/* HBL v5.7 | Freigeschalteter Kollegium-Chat, Supabase Realtime */
(()=>{
"use strict";
const el=id=>document.getElementById(id);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const db=()=>window.hblCloudClient||null;
const account=()=>typeof window.hblCloudUser==="function"?window.hblCloudUser():null;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const S={uid:null,allowed:false,members:[],names:new Map(),groups:[],groupMembers:[],inbox:[],read:new Map(),thread:"lounge",messages:[],more:false,open:false,channel:null,checking:false,loading:false,sending:false,request:0,checked:0};
const nick=email=>String(email||"Lehrkraft").split("@")[0].replace(/[._-]+/g," ");
const member=id=>S.members.find(x=>x.user_id===id);
const label=id=>S.names.get(id)||nick(member(id)?.email||"Lehrkraft");
const isGroup=thread=>typeof thread==="string"&&thread.startsWith("group:")&&uuid.test(thread.slice(6));
const group=thread=>S.groups.find(g=>g.id===(isGroup(thread)?thread.slice(6):thread));
const groupName=thread=>group(thread)?.name||"Gruppe";
function belongs(m,thread){
 return thread==="lounge"?m.channel==="lounge":isGroup(thread)?
 (m.channel==="group"&&m.group_id===thread.slice(6)):
 m.channel==="direct"&&((m.sender_id===S.uid&&m.recipient_id===thread)||
 (m.recipient_id===S.uid&&m.sender_id===thread));
}
function unread(thread){
 const after=S.read.get(thread)||"1970-01-01T00:00:00.000Z";
 return S.inbox.filter(m=>m.sender_id!==S.uid&&belongs(m,thread)&&m.created_at>after).length;
}
function allUnread(){
 return unread("lounge")+S.members.filter(m=>m.user_id!==S.uid).reduce((a,m)=>a+unread(m.user_id),0)+
 S.groups.reduce((sum,g)=>sum+unread("group:"+g.id),0);
}
function stamp(d){
 try{return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}).format(new Date(d));}
 catch(_){return "";}
}
function mount(){
 const controls=document.querySelector("#hblCloudControls .hbl-cloud-actions");
 if(!controls)return false;
 if(!el("hblChatToggle")){
  const button=document.createElement("button");button.id="hblChatToggle";button.type="button";
  button.className="hbl-chat-toggle";button.hidden=true;
  button.innerHTML='<span aria-hidden="true">💬</span> Chat <span class="hbl-chat-badge" id="hblChatBadge" hidden></span>';
  button.setAttribute("aria-label","Kollegium-Chat");
  button.addEventListener("click",()=>openChat(true));
  controls.insertBefore(button,controls.firstChild);
 }
 if(!el("hblChatOverlay")){
  const overlay=document.createElement("div");
  overlay.id="hblChatOverlay";overlay.className="hbl-chat-overlay";overlay.hidden=true;
  overlay.innerHTML='<section class="hbl-chat-panel" role="dialog" aria-modal="true" aria-labelledby="hblChatHeading">'+
   '<header class="hbl-chat-head"><div><h2 id="hblChatHeading">💬 Kollegium-Chat</h2><small>Lehrerzimmer &amp; Direktnachrichten</small></div>'+
   '<button type="button" id="hblChatClose" aria-label="Chat schließen">✕</button></header>'+
   '<div class="hbl-chat-workspace"><aside class="hbl-chat-threads" id="hblChatThreads"></aside>'+
   '<section class="hbl-chat-discussion"><div class="hbl-chat-room" id="hblChatRoom"></div>'+
   '<div class="hbl-chat-history" id="hblChatHistory" role="log" aria-live="polite"></div>'+
   '<form class="hbl-chat-form" id="hblChatForm"><label for="hblChatInput">Nachricht</label>'+
   '<textarea id="hblChatInput" rows="2" maxlength="2000" required placeholder="Nachricht schreiben …"></textarea>'+
   '<button type="submit" id="hblChatSend">Senden ↗</button></form>'+
   '<p class="hbl-chat-status" id="hblChatStatus" role="status"></p></section></div>'+
   '<div class="hbl-chat-group-create" id="hblGroupCreatePanel" hidden><form id="hblGroupCreateForm">'+
   '<h3>Neue Chatgruppe</h3><label for="hblGroupName">Gruppenname</label>'+
   '<input id="hblGroupName" type="text" required minlength="3" maxlength="60" placeholder="z. B. Fachkonferenz Physik">'+
   '<p>Mitglieder auswählen (du selbst bist automatisch dabei):</p>'+
   '<div id="hblGroupMemberChoices"></div><div class="hbl-chat-group-buttons">'+
   '<button type="submit" id="hblGroupCreateSave">Gruppe erstellen</button>'+
   '<button type="button" id="hblGroupCreateCancel">Abbrechen</button></div></form></div>'+
   '<footer class="hbl-chat-footnote">Nur für freigeschaltete Lehrkräfte. Keine Schülerdaten oder vertraulichen Angaben versenden. Nachrichten sind nicht Ende-zu-Ende-verschlüsselt.</footer>'+
   '</section>';
  document.body.appendChild(overlay);
  el("hblChatClose").addEventListener("click",()=>openChat(false));
  overlay.addEventListener("click",event=>{if(event.target===overlay)openChat(false);});
  overlay.addEventListener("keydown",event=>{if(event.key==="Escape")openChat(false);});
  el("hblChatForm").addEventListener("submit",event=>{event.preventDefault();void sendMessage();});
  el("hblGroupCreateForm").onsubmit=event=>{event.preventDefault();void createGroup();};
  el("hblGroupCreateCancel").onclick=()=>showGroupCreate(false);
  el("hblChatInput").addEventListener("keydown",event=>{
   if(event.key==="Enter"&&!event.shiftKey&&!event.isComposing){event.preventDefault();void sendMessage();}
  });
 }
 return true;
}
function setStatus(msg){if(el("hblChatStatus"))el("hblChatStatus").textContent=msg||"";}
function paintBadge(){
 const toggle=el("hblChatToggle");if(!toggle)return;
 toggle.hidden=!S.allowed;
 const n=allUnread(),badge=el("hblChatBadge");
 if(badge){badge.hidden=n===0;badge.textContent=n>99?"99+":String(n);}
 toggle.setAttribute("aria-label",n?"Kollegium-Chat: "+n+" ungelesene Nachrichten":"Kollegium-Chat");
}
function paintThreads(){
 const root=el("hblChatThreads");if(!root)return;
 const contacts=S.members.filter(m=>m.user_id!==S.uid);
 contacts.sort((a,b)=>{
  const t1=S.inbox.find(m=>belongs(m,a.user_id))?.created_at||"";
  const t2=S.inbox.find(m=>belongs(m,b.user_id))?.created_at||"";
  return t2.localeCompare(t1)||a.email.localeCompare(b.email,"de");
 });
 function option(id,title,subtitle,icon){
  const n=unread(id);
  return '<button type="button" class="hbl-chat-thread '+(id===S.thread?"active":"")+'" data-thread="'+esc(id)+'" aria-pressed="'+(id===S.thread)+'">'+
   '<span class="hbl-chat-avatar">'+icon+'</span><span class="hbl-chat-threadname"><strong>'+esc(title)+'</strong><small>'+esc(subtitle)+'</small></span>'+
   (n?'<span class="hbl-chat-threadbadge">'+(n>99?"99+":n)+'</span>':"")+'</button>';
 }
 root.innerHTML='<div class="hbl-chat-category">GEMEINSAM</div>'+
  option("lounge","Lehrerzimmer","Alle freigeschalteten Lehrkräfte","👥")+
  '<div class="hbl-chat-category hbl-chat-section"><span>GRUPPEN</span><button type="button" id="hblChatNewGroup" title="Neue Gruppe erstellen">+ Gruppe</button></div>'+
  (S.groups.length?S.groups.map(g=>option("group:"+g.id,g.name,
    S.groupMembers.filter(x=>x.group_id===g.id).length+" Mitglieder","👥")).join(""):
    '<p class="hbl-chat-empty">Noch keine Gruppen.</p>')+
  '<div class="hbl-chat-category">DIREKTNACHRICHTEN</div>'+
  (contacts.length?contacts.map(x=>option(x.user_id,label(x.user_id),"Privater Chat","👤")).join(""):'<p class="hbl-chat-empty">Noch keine weiteren Kollegen freigeschaltet.</p>');
 el("hblChatNewGroup")?.addEventListener("click",()=>showGroupCreate(true));
 root.querySelectorAll("[data-thread]").forEach(btn=>btn.addEventListener("click",()=>{
  const selected=btn.dataset.thread;
  if(selected!=="lounge"&&!isGroup(selected)&&!member(selected))return;
  if(isGroup(selected)&&!group(selected))return;
  S.thread=selected;S.messages=[];S.more=false;
  paintThreads();paintRoom();el("hblChatInput").value="";
  void loadConversation();
 }));
}
function paintRoom(){
 const root=el("hblChatRoom");if(!root)return;
 const current=group(S.thread),owner=current&&current.created_by===S.uid;
 root.innerHTML='<strong>'+(S.thread==="lounge"?"👥 Lehrerzimmer":current?"👥 "+esc(current.name):"👤 "+esc(label(S.thread)))+'</strong>'+
 '<small>'+(S.thread==="lounge"?"Gemeinsamer Chat für das Kollegium":current?
 "Geschlossene Gruppe · "+S.groupMembers.filter(x=>x.group_id===current.id).length+" Mitglieder":"Privater Chat – nur die beiden Gesprächspartner können mitlesen")+'</small>'+
 (current?'<div class="hbl-chat-group-tools">'+
 (owner?'<button id="hblGroupRename" type="button">✎ Umbenennen</button><button id="hblGroupDelete" type="button">Gruppe löschen</button>':
 '<button id="hblGroupLeave" type="button">Gruppe verlassen</button>')+'</div>':'');
 el("hblGroupRename")?.addEventListener("click",()=>void renameGroup());
 el("hblGroupDelete")?.addEventListener("click",()=>void deleteGroup());
 el("hblGroupLeave")?.addEventListener("click",()=>void leaveGroup());
}
function paintHistory(scrollToEnd=true,oldHeight=0){
 const root=el("hblChatHistory");if(!root)return;
 root.innerHTML=(S.more?'<button type="button" class="hbl-chat-more" id="hblChatMore">Ältere Nachrichten laden</button>':"")+
 (S.messages.length?S.messages.map(m=>{
  const mine=m.sender_id===S.uid;
  return '<article class="hbl-chat-msg '+(mine?"mine":"theirs")+'">'+
   (!mine?'<strong class="hbl-chat-author">'+esc(label(m.sender_id))+'</strong>':"")+
   '<div class="hbl-chat-bubble">'+esc(m.body)+'</div>'+
   '<time>'+esc(stamp(m.created_at))+'</time></article>';
 }).join(""):'<p class="hbl-chat-empty">Noch keine Nachrichten. Schreib die erste!</p>');
 el("hblChatMore")?.addEventListener("click",()=>void loadConversation(true));
 root.scrollTop=scrollToEnd?root.scrollHeight:Math.max(0,root.scrollHeight-oldHeight);
}
async function readConversation(){
 if(!S.allowed||!S.open||document.hidden||!db()||!S.uid)return;
 const thread=S.thread;
 const newest=S.messages[S.messages.length-1]?.created_at||new Date().toISOString();
 const previous=S.read.get(thread);
 if(previous&&previous>=newest)return;
 S.read.set(thread,newest);paintBadge();paintThreads();
 const {error}=await db().from("hbl_chat_reads").upsert({
  user_id:S.uid,thread_key:thread,last_read_at:newest
 },{onConflict:"user_id,thread_key"});
 if(error)console.warn("Chat-Lesestatus nicht gespeichert:",error.message);
}
async function loadConversation(older=false){
 if(!S.allowed||!db()||!S.uid)return;
 const thread=S.thread,uid=S.uid,request=++S.request,view=el("hblChatHistory"),oldHeight=view?.scrollHeight||0;
 if(!older&&view)view.innerHTML='<p class="hbl-chat-empty">Nachrichten werden geladen …</p>';
 let query=isGroup(thread)?
 db().from("hbl_chat_group_messages").select("id,group_id,sender_id,body,created_at")
  .eq("group_id",thread.slice(6)).order("created_at",{ascending:false}).limit(100):
 db().from("hbl_chat_messages").select("id,channel,sender_id,recipient_id,body,created_at")
  .eq("channel",thread==="lounge"?"lounge":"direct")
  .order("created_at",{ascending:false}).limit(100);
 if(thread!=="lounge"&&!isGroup(thread)){
  if(!uuid.test(thread))return;
  query=query.in("sender_id",[uid,thread]).in("recipient_id",[uid,thread]);
 }
 if(older&&S.messages.length)query=query.lt("created_at",S.messages[0].created_at);
 const {data,error}=await query;
 if(request!==S.request||uid!==S.uid||S.thread!==thread)return;
 if(error){setStatus("Nachrichten konnten nicht geladen werden: "+error.message);return;}
 const recent=(data||[]).reverse().map(m=>isGroup(thread)?{...m,channel:"group"}:m);
 if(older){
  const known=new Set(S.messages.map(x=>x.id));
  S.messages=[...recent.filter(x=>!known.has(x.id)),...S.messages];
 }else S.messages=recent;
 S.more=(data||[]).length===100;
 setStatus("");paintHistory(!older,oldHeight);
 void readConversation();
}
async function reloadInbox(){
 if(!S.allowed||!db()||!S.uid||S.loading)return;
 const uid=S.uid;S.loading=true;
 try{
  const [messages,groupMessages,reads]=await Promise.all([
   db().from("hbl_chat_messages").select("id,channel,sender_id,recipient_id,body,created_at")
    .order("created_at",{ascending:false}).limit(500),
   db().from("hbl_chat_group_messages").select("id,group_id,sender_id,body,created_at")
    .order("created_at",{ascending:false}).limit(500),
   db().from("hbl_chat_reads").select("thread_key,last_read_at").eq("user_id",uid)
  ]);
  if(uid!==S.uid)return;
  if(messages.error)throw messages.error;
  if(groupMessages.error)throw groupMessages.error;
  if(reads.error)throw reads.error;
  const previousNewest=S.inbox[0]?.id;
  S.inbox=[...(messages.data||[]),...(groupMessages.data||[]).map(m=>({...m,channel:"group"}))]
   .sort((a,b)=>b.created_at.localeCompare(a.created_at));
  S.read=new Map((reads.data||[]).map(r=>[r.thread_key,r.last_read_at]));
  paintBadge();if(S.open)paintThreads();
  const newest=S.inbox[0];
  if(S.open&&newest&&newest.id!==previousNewest&&belongs(newest,S.thread)&&
     !S.messages.some(m=>m.id===newest.id))void loadConversation();
 }catch(e){if(S.open)setStatus("Nachrichtenabgleich fehlgeschlagen: "+e.message);}
 finally{S.loading=false;}
}
async function sendMessage(){
 const field=el("hblChatInput"),button=el("hblChatSend"),uid=S.uid,key=S.thread;
 if(!S.allowed||!uid||!db()||!field||!button||S.sending)return;
 const content=field.value.trim();
 if(!content||content.length>2000){setStatus("Bitte 1 bis 2000 Zeichen eingeben.");return;}
 if(isGroup(key)&&!group(key)){setStatus("Du bist kein Mitglied dieser Gruppe.");return;}
 if(key!=="lounge"&&!isGroup(key)&&!member(key)){setStatus("Der Kollege ist nicht für den Chat freigeschaltet.");return;}
 S.sending=true;button.disabled=true;setStatus("");
 try{
  const {error}=isGroup(key)?
   await db().from("hbl_chat_group_messages").insert({group_id:key.slice(6),sender_id:uid,body:content}):
   await db().from("hbl_chat_messages").insert({
    channel:key==="lounge"?"lounge":"direct",sender_id:uid,recipient_id:key==="lounge"?null:key,body:content
   });
  if(error)throw error;
  if(S.thread===key)field.value="";
  await reloadInbox();
  if(S.thread===key)await loadConversation();
  field.focus();
 }catch(e){setStatus("Senden fehlgeschlagen: "+e.message);}
 finally{S.sending=false;button.disabled=false;}
}
function openChat(open){
 if(!S.allowed||!el("hblChatOverlay"))return;
 S.open=!!open;el("hblChatOverlay").hidden=!open;
 el("hblChatToggle")?.setAttribute("aria-expanded",String(S.open));
 if(open){
  paintThreads();paintRoom();void loadConversation();void reloadInbox();el("hblChatInput")?.focus();
 }else{
  S.request++;el("hblChatToggle")?.focus();
 }
}
function releaseChannel(){
 if(S.channel&&db())void db().removeChannel(S.channel);
 S.channel=null;
}
function clearAccess(){
 releaseChannel();S.request++;
 S.uid=null;S.allowed=false;S.members=[];S.names.clear();S.groups=[];S.groupMembers=[];S.inbox=[];S.read.clear();S.thread="lounge";
 S.messages=[];S.open=false;S.more=false;S.checked=0;
 if(el("hblChatOverlay"))el("hblChatOverlay").hidden=true;
 paintBadge();
}
function startChannel(){
 if(!S.allowed||S.channel||!db())return;
 S.channel=db().channel("hbl-colleagues-v57-"+S.uid)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"hbl_chat_messages"},payload=>{
  if(!S.allowed)return;
  void reloadInbox();
  if(S.open&&belongs(payload.new||{},S.thread))void loadConversation();
 })
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"hbl_chat_group_messages"},payload=>{
  if(!S.allowed)return;
  void reloadInbox();
  if(S.open&&belongs({...payload.new,channel:"group"},S.thread))void loadConversation();
 })
 .subscribe(status=>{
  if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")
   console.warn("Chat-Echtzeit zeitweise unterbrochen; automatischer Abgleich bleibt aktiv.");
 });
}

async function loadGroups(){
 if(!db()||!S.uid)return;
 const [groups,members]=await Promise.all([
  db().from("hbl_chat_groups").select("id,name,created_by,created_at").order("created_at",{ascending:false}).limit(100),
  db().from("hbl_chat_group_members").select("group_id,user_id").limit(2000)
 ]);
 if(groups.error)throw groups.error;
 if(members.error)throw members.error;
 S.groupMembers=members.data||[];
 const allowed=new Set(S.groupMembers.filter(m=>m.user_id===S.uid).map(m=>m.group_id));
 S.groups=(groups.data||[]).filter(g=>allowed.has(g.id));
 if(isGroup(S.thread)&&!group(S.thread)){S.thread="lounge";S.messages=[];S.more=false;}
}
function showGroupCreate(show){
 const panel=el("hblGroupCreatePanel");
 if(!panel)return;
 panel.hidden=!show;
 if(!show)return;
 el("hblGroupName").value="";
 el("hblGroupMemberChoices").innerHTML=S.members.filter(m=>m.user_id!==S.uid)
  .map(m=>'<label class="hbl-group-member-option"><input type="checkbox" value="'+esc(m.user_id)+'" checked> '+esc(label(m.user_id))+'</label>').join("")||
  '<p>Du brauchst mindestens einen weiteren freigeschalteten Kollegen.</p>';
 el("hblGroupName").focus();
}
async function createGroup(){
 if(!S.allowed||!db()||!S.uid)return;
 const name=el("hblGroupName").value.trim();
 const others=[...el("hblGroupMemberChoices").querySelectorAll("input:checked")].map(x=>x.value).filter(x=>uuid.test(x));
 if(name.length<3||name.length>60){setStatus("Gruppenname: 3–60 Zeichen.");return;}
 if(!others.length){setStatus("Bitte mindestens einen Kollegen auswählen.");return;}
 const save=el("hblGroupCreateSave");save.disabled=true;setStatus("Gruppe wird angelegt …");
 try{
  const {data:created,error:createError}=await db().from("hbl_chat_groups")
   .insert({name,created_by:S.uid}).select("id").single();
  if(createError)throw createError;
  const users=[S.uid,...new Set(others)];
  const {error:memberError}=await db().from("hbl_chat_group_members")
   .insert(users.map(user_id=>({group_id:created.id,user_id})));
  if(memberError){await db().from("hbl_chat_groups").delete().eq("id",created.id);throw memberError;}
  await loadGroups();showGroupCreate(false);
  S.thread="group:"+created.id;S.messages=[];S.more=false;
  paintThreads();paintRoom();void loadConversation();void reloadInbox();
  setStatus("Gruppe erstellt ✓");
 }catch(e){setStatus("Gruppe konnte nicht erstellt werden: "+e.message);}
 finally{save.disabled=false;}
}
async function renameGroup(){
 const current=group(S.thread);
 if(!current||current.created_by!==S.uid)return;
 const name=prompt("Neuer Gruppenname (3–60 Zeichen):",current.name);
 if(name===null)return;
 if(name.trim().length<3||name.trim().length>60){setStatus("Bitte einen Namen mit 3–60 Zeichen wählen.");return;}
 const {error}=await db().from("hbl_chat_groups").update({name:name.trim(),updated_at:new Date().toISOString()}).eq("id",current.id);
 if(error){setStatus("Umbenennen fehlgeschlagen: "+error.message);return;}
 await loadGroups();paintThreads();paintRoom();
}
async function deleteGroup(){
 const current=group(S.thread);if(!current||current.created_by!==S.uid)return;
 if(!confirm("Gruppe „"+current.name+"“ mit allen Gruppennachrichten endgültig löschen?"))return;
 const {error}=await db().from("hbl_chat_groups").delete().eq("id",current.id);
 if(error){setStatus("Löschen fehlgeschlagen: "+error.message);return;}
 S.thread="lounge";S.messages=[];await loadGroups();paintThreads();paintRoom();void loadConversation();void reloadInbox();
}
async function leaveGroup(){
 const current=group(S.thread);if(!current||current.created_by===S.uid)return;
 if(!confirm("Gruppe „"+current.name+"“ verlassen?"))return;
 const {error}=await db().from("hbl_chat_group_members").delete()
  .eq("group_id",current.id).eq("user_id",S.uid);
 if(error){setStatus("Gruppe verlassen fehlgeschlagen: "+error.message);return;}
 S.thread="lounge";S.messages=[];await loadGroups();paintThreads();paintRoom();void loadConversation();void reloadInbox();
}

async function refreshAccess(force=false){
 if(S.checking||!mount())return;
 const logged=account(),client=db();
 if(!logged||!client){if(S.uid)clearAccess();return;}
 if(!force&&logged.id===S.uid&&Date.now()-S.checked<30000)return;
 S.checking=true;
 try{
  const {data,error}=await client.from("hbl_chat_members")
   .select("user_id,email").order("email",{ascending:true}).limit(300);
  if(error)throw error;
  if(logged.id!==account()?.id)return;
  const approved=(data||[]).some(m=>m.user_id===logged.id);
  if(!approved){if(S.uid)clearAccess();return;}
  const switched=S.uid!==logged.id;
  if(switched&&S.uid)clearAccess();
  S.uid=logged.id;S.allowed=true;S.members=data||[];S.checked=Date.now();
  const {data:profiles,error:profileError}=await client.from("hbl_user_profiles")
   .select("user_id,username").limit(300);
  if(!profileError)S.names=new Map((profiles||[]).map(p=>[p.user_id,p.username]));
  await loadGroups();
  paintBadge();startChannel();
  if(switched)await reloadInbox();
  if(S.open)paintThreads();
 }catch(e){console.warn("Chat-Freigabe derzeit nicht prüfbar:",e.message);}
 finally{S.checking=false;}
}
function init(){
 if(!mount())return;
 window.addEventListener("hbl-cloud-status",()=>void refreshAccess(true));
 window.addEventListener("hbl-chat-access-changed",()=>void refreshAccess(true));
 window.addEventListener("hbl-profile-changed",()=>void refreshAccess(true));
 document.addEventListener("visibilitychange",()=>{
  if(!document.hidden){void refreshAccess(true);if(S.allowed){void reloadInbox();if(S.open)void loadConversation();}}
 });
 window.addEventListener("online",()=>{void refreshAccess(true);if(S.allowed)void reloadInbox();});
 setInterval(()=>{
  if(document.hidden)return;
  void refreshAccess();
  if(S.allowed)void reloadInbox();
 },20000);
 void refreshAccess(true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();