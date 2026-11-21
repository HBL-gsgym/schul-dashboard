import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import {categoryActive,pushWindowActive} from "./push-policy.mjs";
import webpush from "npm:web-push@3.6.7";

// HBL v5.5: A private cron-only Web Push dispatcher.
// VAPID credentials and cron authentication are stored in a service-role-only table.
const url = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceKey) throw new Error("Supabase service environment is missing");
const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const lessonStarts = [["1", "08:05", "08:15"], ["2", "09:55", "10:05"], ["3", "12:10", "12:20"], ["4", "13:50", "14:00"]];
const dutyStarts = [
  ["breakfast", "09:35", "09:45", "Frühstückspause"],
  ["lunch1", "11:25", "11:35", "Mittagspause · Teil 1"],
  ["lunch2", "11:45", "11:55", "Mittagspause · Teil 2"],
];
const vacations = [
  ["2026-10-19", "2026-10-30"], ["2026-12-23", "2027-01-02"],
  ["2027-02-01", "2027-02-06"], ["2027-03-22", "2027-04-03"],
  ["2027-05-18", "2027-05-18"], ["2027-05-07", "2027-05-07"],
  ["2027-10-11", "2027-10-23"], ["2027-12-23", "2027-12-31"],
  ["2028-01-31", "2028-02-05"], ["2028-04-10", "2028-04-22"],
];
const validYears = [["2026-08-24", "2027-06-30"], ["2027-08-16", "2028-06-28"]];
function pad(n: number) { return String(n).padStart(2, "0"); }
function germanTime(d: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: p.year + "-" + p.month + "-" + p.day, time: p.hour + ":" + p.minute };
}
function easter(year: number) {
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
  const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
  const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7;
  const m=Math.floor((a+11*h+22*l)/451);
  const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(Date.UTC(year,month-1,day,12));
}
function iso(d:Date){return d.getUTCFullYear()+"-"+pad(d.getUTCMonth()+1)+"-"+pad(d.getUTCDate());}
function isSchoolDay(date:string) {
  if (!validYears.some(([a,b])=>date>=a&&date<=b)) return false;
  const [y,m,d] = date.split("-").map(Number),utc=new Date(Date.UTC(y,m-1,d,12));
  const dow=utc.getUTCDay();if(dow===0||dow===6)return false;
  if(vacations.some(([a,b])=>date>=a&&date<=b))return false;
  const fixed=["01-01","05-01","10-03","10-31","12-25","12-26"];
  if(fixed.includes(date.slice(5)))return false;
  const east=easter(y);
  for(const offset of [-2,1,39,50]){
    const holiday=new Date(east);holiday.setUTCDate(holiday.getUTCDate()+offset);
    if(iso(holiday)===date)return false;
  }
  return true;
}
function weekType(date:string) {
  const [y,m,d]=date.split("-").map(Number),u=Date.UTC(y,m-1,d);
  const day=new Date(u).getUTCDay(),monday=u-((day+6)%7)*86400000;
  const w=Math.round((monday-Date.UTC(2026,7,24))/604800000);
  return ((w%2)+2)%2===0?"A":"B";
}
type SchoolEvent={starts_on:string;ends_on:string;cancellation_mode:string;cancelled_blocks:number[]};
function dueEvents(snapshot:Record<string,unknown>,date:string,time:string,schoolEvents:SchoolEvent[]) {
  const cancelled=(block:number)=>schoolEvents.some(e=>date>=e.starts_on&&date<=e.ends_on&&(
    e.cancellation_mode==="all"||(e.cancellation_mode==="blocks"&&e.cancelled_blocks?.includes(block))
  ));
  const [y,m,d]=date.split("-").map(Number),day=new Date(Date.UTC(y,m-1,d)).getUTCDay(),week=weekType(date);
  const result:Array<{key:string;title:string;body:string}>=[];
  const lessonSlots=(snapshot?.__timetableV1 as any)?.slots||{};
  const duties=(snapshot?.__dutiesV1 as any)?.slots||{};
  for(const [block,reminder,start] of lessonStarts) {
    if(reminder!==time||cancelled(Number(block)))continue;
    const item=lessonSlots[String(day)+"-"+block]?.[week];
    if(!item||typeof item.subject!=="string"||typeof item.group!=="string")continue;
    const title="Unterricht in 10 Minuten";
    const body=String(item.subject).slice(0,60)+" · "+String(item.group).slice(0,30)+(item.room?" · Raum "+String(item.room).slice(0,40):"")+" · "+start+" Uhr";
    result.push({key:date+"|unterricht|"+block, title, body});
  }
  for(const [type,reminder,start,label] of dutyStarts) {
    const afterBlock=type==="breakfast"?1:2;
    if(reminder!==time||cancelled(afterBlock))continue;
    const entry=duties[String(day)+"-"+type]?.[week];
    if(!entry||typeof entry.place!=="string"||!entry.place.trim())continue;
    result.push({key:date+"|aufsicht|"+type,title:"Aufsicht in 10 Minuten",body:label+" · "+entry.place.slice(0,60)+" · "+start+" Uhr"});
  }
  return result;
}

type ChatPref={user_id:string;enabled:boolean;days:number[];start_time:string;end_time:string;preview:boolean};
type ChatMsg={id:string;channel:string;sender_id:string;recipient_id?:string|null;group_id?:string;body:string;created_at:string};
async function dispatchChatPush(now:Date):Promise<{sent:number;failed:number}>{
 const local=germanTime(now);
 const {data:prefs,error:prefError}=await db.from("hbl_chat_push_preferences")
  .select("user_id,enabled,days,start_time,end_time,preview").eq("enabled",true).limit(1000);
 if(prefError)throw prefError;
 const active=new Map((prefs||[]).filter((p:ChatPref)=>categoryActive(p,"enabled",local)).map((p:ChatPref)=>[p.user_id,p]));
 if(!active.size)return {sent:0,failed:0};
 const {data:subs,error:subsError}=await db.from("hbl_push_subscriptions")
  .select("id,user_id,endpoint,p256dh,auth_key").in("user_id",[...active.keys()]).limit(1000);
 if(subsError)throw subsError;
 if(!subs?.length)return {sent:0,failed:0};
 const cutoff=new Date(now.getTime()-105000).toISOString();
 const [plain,groupChat,allowed,groupMembers,groups,profiles,dashboardMembers]=await Promise.all([
  db.from("hbl_chat_messages").select("id,channel,sender_id,recipient_id,body,created_at")
   .gte("created_at",cutoff).lte("created_at",now.toISOString()).order("created_at",{ascending:false}).limit(300),
  db.from("hbl_chat_group_messages").select("id,group_id,sender_id,body,created_at")
   .gte("created_at",cutoff).lte("created_at",now.toISOString()).order("created_at",{ascending:false}).limit(300),
  db.from("hbl_chat_members").select("user_id").limit(1000),
  db.from("hbl_chat_group_members").select("group_id,user_id").limit(5000),
  db.from("hbl_chat_groups").select("id,name").limit(1000),
  db.from("hbl_user_profiles").select("user_id,username").limit(1000),
  db.from("hbl_dashboard_members").select("user_id,enabled").limit(1000)
 ]);
 for(const q of [plain,groupChat,allowed,groupMembers,groups,profiles,dashboardMembers])if(q.error)throw q.error;
 const permitted=new Set((allowed.data||[]).map((x:any)=>x.user_id));
 const dashboardEnabled=new Set((dashboardMembers.data||[]).filter((x:any)=>x.enabled).map((x:any)=>x.user_id));
 const members=new Map<string,Set<string>>();
 for(const m of groupMembers.data||[]){
  const set=members.get(m.group_id)||new Set<string>();
  set.add(m.user_id);members.set(m.group_id,set);
 }
 const groupNames=new Map((groups.data||[]).map((g:any)=>[g.id,g.name]));
 const names=new Map((profiles.data||[]).map((p:any)=>[p.user_id,p.username]));
 const messages:ChatMsg[]=[
  ...(plain.data||[]),
  ...(groupChat.data||[]).map((x:any)=>({...x,channel:"group"}))
 ].sort((a,b)=>b.created_at.localeCompare(a.created_at));
 if(!messages.length)return {sent:0,failed:0};
 let sent=0,failed=0;
 for(const sub of subs){
  const pref=active.get(sub.user_id) as ChatPref|undefined;
  if(!pref||!permitted.has(sub.user_id)||!dashboardEnabled.has(sub.user_id))continue;
  const candidates=messages.filter(m=>m.sender_id!==sub.user_id&&pushWindowActive(pref,germanTime(new Date(m.created_at)))&&(
   m.channel==="lounge" ||
   (m.channel==="direct"&&m.recipient_id===sub.user_id) ||
   (m.channel==="group"&&m.group_id&&members.get(m.group_id)?.has(sub.user_id))
  )).slice(0,60);
  if(!candidates.length)continue;
  const newly:ChatMsg[]=[];
  for(const m of candidates){
   const {error}=await db.from("hbl_chat_push_sent").insert({
    subscription_id:sub.id,user_id:sub.user_id,
    kind:m.channel,message_id:m.id
   });
   if(!error)newly.push(m);
   else if(error.code!=="23505")failed++;
  }
  if(!newly.length)continue;
  const recent=newly[0],sender=String(names.get(recent.sender_id)||"Kollegium");
  const where=recent.channel==="group"?String(groupNames.get(recent.group_id)||"Gruppe"):
   recent.channel==="lounge"?"Lehrerzimmer":"Direktnachricht";
  const title=newly.length>1?newly.length+" neue Chat-Nachrichten":"Chat · "+where;
  const body=pref.preview?
   sender+": "+String(recent.body).slice(0,130):
   "Neue Nachricht von "+sender+" · "+where;
  try{
   await webpush.sendNotification(
    {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},
    JSON.stringify({title,body,tag:"hbl-chat-"+recent.channel+"-"+(recent.group_id||recent.sender_id),url:"./"}),
    {TTL:120,urgency:"normal"}
   );
   sent++;
  }catch(e:any){
   failed++;
   for(const m of newly)await db.from("hbl_chat_push_sent").delete()
    .eq("subscription_id",sub.id).eq("kind",m.channel).eq("message_id",m.id);
   if(e?.statusCode===404||e?.statusCode===410)
    await db.from("hbl_push_subscriptions").delete().eq("id",sub.id);
  }
 }
 return {sent,failed};
}

function constantEqual(a:string,b:string) {
  if(a.length!==b.length)return false;
  let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);
  return diff===0;
}
Deno.serve(async (req:Request) => {
  if(req.method!=="POST")return new Response("Method not allowed",{status:405});
  try{
    const {data:settings,error:cfgError}=await db.from("hbl_push_private_settings").select("key,value");
    if(cfgError)throw cfgError;
    const secrets=Object.fromEntries((settings||[]).map((s:any)=>[s.key,s.value]));
    if(!secrets.cron_token||!constantEqual(req.headers.get("x-hbl-cron")||"",secrets.cron_token))
      return new Response("Unauthorized",{status:401});
    if(!secrets.vapid_public||!secrets.vapid_private)throw Error("Missing VAPID keys");
    webpush.setVapidDetails("https://hbl-gsgym.github.io",secrets.vapid_public,secrets.vapid_private);
    const current=new Date(),now=germanTime(current);
    // Chat-Push läuft unabhängig von Schultagen und immer nur in den selbst gewählten Zeiten.
    const chat=await dispatchChatPush(current);
    if(!isSchoolDay(now.date))return Response.json({ok:true,date:now.date,sent:0,chat,reason:"not a school day"});
    if(!lessonStarts.some(x=>x[1]===now.time)&&!dutyStarts.some(x=>x[1]===now.time))
      return Response.json({ok:true,date:now.date,time:now.time,sent:0,chat});
    const {data:subs,error:subError}=await db.from("hbl_push_subscriptions")
      .select("id,user_id,endpoint,p256dh,auth_key").limit(1000);
    if(subError)throw subError;
    if(!subs?.length)return Response.json({ok:true,sent:0,subscriptions:0,chat});
    const {data:schoolEvents,error:eventsError}=await db.from("hbl_school_events")
      .select("starts_on,ends_on,cancellation_mode,cancelled_blocks")
      .lte("starts_on",now.date).gte("ends_on",now.date);
    if(eventsError)throw eventsError;
    const ids=[...new Set(subs.map((s:any)=>s.user_id))];
    const [lessonPrefs,membership]=await Promise.all([
      db.from("hbl_chat_push_preferences").select("user_id,lessons_enabled,days,start_time,end_time").in("user_id",ids),
      db.from("hbl_dashboard_members").select("user_id").eq("enabled",true).in("user_id",ids)
    ]);
    if(lessonPrefs.error||membership.error)throw lessonPrefs.error||membership.error;
    const prefs=new Map((lessonPrefs.data||[]).map(p=>[p.user_id,p] as const));
    const allowed=new Set((membership.data||[]).map(m=>m.user_id));
    const {data:rows,error:snapError}=await db.from("hbl_dashboard_snapshots")
      .select("user_id,content").in("user_id",ids);
    if(snapError)throw snapError;
    const byUser=new Map((rows||[]).map((r:any)=>[r.user_id,r.content||{}]));
    let sent=0,failed=0;
    for(const sub of subs){
      const pref=prefs.get(sub.user_id)??{lessons_enabled:true,days:[1,2,3,4,5],start_time:"07:00",end_time:"17:00"};
      if(!allowed.has(sub.user_id)||!categoryActive(pref,"lessons_enabled",now))continue;
      const snapshot=byUser.get(sub.user_id);
      if(!snapshot)continue;
      for(const event of dueEvents(snapshot,now.date,now.time,schoolEvents||[])){
        const {error:logError}=await db.from("hbl_push_sent").insert({
          subscription_id:sub.id,user_id:sub.user_id,event_key:event.key,
        });
        if(logError){
          if(logError.code==="23505")continue;
          failed++;continue;
        }
        try{
          await webpush.sendNotification(
            {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},
            JSON.stringify({title:event.title,body:event.body,tag:event.key,url:"./"}),
            {TTL:600,urgency:"high"},
          );
          sent++;
        }catch(err:any){
          failed++;
          await db.from("hbl_push_sent").delete()
            .eq("subscription_id",sub.id).eq("event_key",event.key);
          if(err?.statusCode===404||err?.statusCode===410)
            await db.from("hbl_push_subscriptions").delete().eq("id",sub.id);
        }
      }
    }
    return Response.json({ok:true,sent,failed,chat,subscriptions:subs.length,date:now.date,time:now.time});
  }catch(e:any){
    console.error("HBL push dispatch failed:",e?.message||"error");
    return Response.json({ok:false,error:"Push dispatcher error"},{status:500});
  }
});
