/* HBL v5.5 – Pausenaufsichten, mobile Installation und Web Push */
(function(){
"use strict";
const DUTIES = [
 {id:"breakfast",label:"Frühstückspause",start:"09:45",end:"10:00",after:1},
 {id:"lunch1",label:"Mittagspause · Teil 1",start:"11:35",end:"11:55",after:2},
 {id:"lunch2",label:"Mittagspause · Teil 2",start:"11:55",end:"12:15",after:2}
];
const PUBLIC_VAPID="BOaHxzC0CYlfzcVf1wCLlYHMlSKwpdoJJpJ3ODo2UFwyjsgmjHXjVfloCZ9m7nbAQqXc-1MQo88gNEUDbSnhsrQ";
const DAYNAMES_HBL=["","Montag","Dienstag","Mittwoch","Donnerstag","Freitag"];
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dutyStore=()=>prepDone&&prepDone.__dutiesV1&&typeof prepDone.__dutiesV1.slots==="object"?prepDone.__dutiesV1.slots:{};
function dutyCell(day,type){
 const entry=dutyStore()[day+"-"+type]||{},a=entry.A,b=entry.B;
 const same=a&&b&&a.place===b.place,editing=!!window.hblTimetableEditing;
 const kind=!a&&!b?"off":same?"shared":a&&!b?"green":!a&&b?"blue":"mixed";
 const value=(week,v)=>v&&v.place?'<span class="hbl-duty-value '+week+'"><b>'+(week==="shared"?"A+B":week)+'</b>'+safe(v.place)+'</span>':"";
 const desc=same?value("shared",a):value("A",a)+value("B",b);
 return '<button type="button" class="hbl-duty-cell '+kind+'" '+(editing?'onclick="hblOpenDutyEditor('+day+',\''+type+'\')"':'disabled')+' title="'+(editing?"Aufsicht bearbeiten":"Pausenaufsicht")+'">'+(desc||'<span class="hbl-duty-empty">'+(editing?"+ Aufsicht":"–")+'</span>')+'</button>';
}
function decorateTable(host){
 const old=[...host.children];
 if(old.length!==25)return;
 const fragment=document.createDocumentFragment();
 for(const el of old.slice(0,5))fragment.appendChild(el);
 for(let block=1;block<=4;block++){
  for(const el of old.slice(5+(block-1)*5,5+block*5))fragment.appendChild(el);
  for(const type of DUTIES.filter(d=>d.after===block)){
   const editing=!!window.hblTimetableEditing;
   const hasAny=[1,2,3,4,5].some(day=>{
    const v=dutyStore()[day+"-"+type.id];
    return !!(v?.A?.place||v?.B?.place);
   });
   if(!editing&&!hasAny)continue;
   for(let day=1;day<=5;day++){
    const filled=!!(dutyStore()[day+"-"+type.id]?.A?.place||dutyStore()[day+"-"+type.id]?.B?.place);
    const parent=document.createElement("div");
    parent.className="hbl-duty-container"+(!editing&&!filled?" hbl-duty-placeholder":"");
    parent.innerHTML='<span class="hbl-duty-caption">'+safe(type.label)+'<small>'+type.start+'–'+type.end+'</small></span>'+
      (editing||filled?dutyCell(day,type.id):'<span class="hbl-duty-spacer" aria-hidden="true"></span>');
    fragment.appendChild(parent);
   }
  }
 }
 host.replaceChildren(fragment);
}
window.hblDecorateDutyTable=decorateTable;
function ensureEditor(){
 let overlay=document.getElementById("hblDutyOverlay");
 if(overlay)return overlay;
 overlay=document.createElement("div");
 overlay.id="hblDutyOverlay";
 overlay.className="hbl-plan-overlay hbl-duty-overlay";
 overlay.hidden=true;
 overlay.innerHTML='<section class="hbl-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="hblDutyTitle">'+
 '<button class="hbl-plan-close" type="button" id="hblDutyClose" aria-label="Schließen">✕</button>'+
 '<div class="hbl-plan-eyebrow">PAUSENAUFSICHT · 10 MINUTEN VORHER ERINNERN</div>'+
 '<h2 id="hblDutyTitle">Aufsicht bearbeiten</h2><p id="hblDutyTime" class="hbl-plan-info"></p>'+
 '<form id="hblDutyForm"><label>Gültigkeit<select id="hblDutyWeek"><option value="both">A und B – beide Wochen</option><option value="A">Nur A – grün</option><option value="B">Nur B – blau</option></select></label>'+
 '<label class="hbl-duty-form-place">Aufsichtsort<input type="text" id="hblDutyPlace" required maxlength="60" autocomplete="off" placeholder="z. B. Hof 1, Haus 2, Foyer"></label>'+
 '<p class="hbl-plan-info">Die drei Pausenzeiten sind fest hinterlegt. Aufsichten erzeugen keine Mitarbeitstermine.</p>'+
 '<div class="hbl-plan-buttons"><button type="submit" class="hbl-plan-primary">Speichern</button><button type="button" id="hblDutyDelete">Entfernen</button><button type="button" id="hblDutyCancel">Abbrechen</button></div></form></section>';
 document.body.appendChild(overlay);
 const close=()=>{overlay.hidden=true;window.hblEditingDuty=null;};
 document.getElementById("hblDutyClose").onclick=close;
 document.getElementById("hblDutyCancel").onclick=close;
 overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
 overlay.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 const weekSelect=document.getElementById("hblDutyWeek");
 const placeInput=document.getElementById("hblDutyPlace");
 weekSelect.addEventListener("change",()=>{
  const chosen=window.hblEditingDuty;if(!chosen)return;
  const entry=dutyStore()[chosen.day+"-"+chosen.type]||{};
  const v=weekSelect.value==="both"?(entry.A||entry.B):entry[weekSelect.value];
  placeInput.value=v?.place||"";
 });
 async function save(remove){
  const selected=window.hblEditingDuty;if(!selected)return;
  const value=placeInput.value.trim().slice(0,60),week=weekSelect.value;
  if(!remove&&!value){placeInput.focus();return;}
  const slots=JSON.parse(JSON.stringify(dutyStore()));
  const key=selected.day+"-"+selected.type,entry=slots[key]||{};
  const selectedWeeks=week==="both"?["A","B"]:[week];
  if(!remove&&week==="both"&&entry.A&&entry.B&&entry.A.place!==entry.B.place
     &&!confirm("A und B enthalten unterschiedliche Aufsichtsorte. Beide überschreiben?"))return;
  for(const w of selectedWeeks)if(remove)delete entry[w];else entry[w]={place:value};
  if(!entry.A&&!entry.B)delete slots[key];else slots[key]=entry;
  if(!serverReady){alert("Speicherung noch nicht bereit.");return;}
  const previous=prepDone.__dutiesV1;
  prepDone.__dutiesV1={version:1,slots};
  try{await savePrepFile();renderTimetable();renderToday();close();}
  catch(e){prepDone.__dutiesV1=previous;renderTimetable();renderToday();alert("Aufsicht konnte nicht gespeichert werden: "+(e?.message||e));}
 }
 document.getElementById("hblDutyForm").addEventListener("submit",e=>{e.preventDefault();void save(false);});
 document.getElementById("hblDutyDelete").onclick=()=>void save(true);
 return overlay;
}
window.hblOpenDutyEditor=function(day,type){
 if(!window.hblTimetableEditing||day<1||day>5||!DUTIES.some(d=>d.id===type))return;
 const overlay=ensureEditor(),entry=dutyStore()[day+"-"+type]||{};
 const kind=DUTIES.find(d=>d.id===type);
 window.hblEditingDuty={day,type};
 document.getElementById("hblDutyTitle").textContent=DAYNAMES_HBL[day]+" · "+kind.label;
 document.getElementById("hblDutyTime").textContent="Feste Uhrzeit: "+kind.start+"–"+kind.end+" Uhr";
 const same=entry.A&&entry.B&&entry.A.place===entry.B.place;
 const week=same||(!entry.A&&!entry.B)?"both":entry.A?"A":"B";
 document.getElementById("hblDutyWeek").value=week;
 document.getElementById("hblDutyPlace").value=(entry[week]||entry.A||entry.B)?.place||"";
 overlay.hidden=false;
 document.getElementById("hblDutyPlace").focus();
};
function isSchool(date){
 const year=currentSchoolYear(date),key=taskDateString(date);
 if(key<year.start||key>year.end)return false;
 if(date.getDay()===0||date.getDay()===6)return false;
 return schoolDateDescription(key,year,publicHolidays(date.getFullYear())).kind==="school";
}
function upcomingEvents(){
 const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
 const cur=now.getHours()*60+now.getMinutes(),out=[];
 for(let offset=0;offset<35&&out.length<4;offset++){
  const date=dayOffset(today,offset);
  if(!isSchool(date))continue;
  const event=[];
  for(const block of dayBlocks(date)){
   if(offset===0&&block.e<=cur)continue;
   event.push({kind:"lesson",date,offset,s:block.s,e:block.e,block});
  }
  const day=date.getDay(),week=weekCycle(date);
  for(const type of DUTIES){
   const v=dutyStore()[day+"-"+type.id]?.[week];
   if(!v||!v.place||!v.place.trim())continue;
   const s=tmin(type.start),e=tmin(type.end);
   if(offset===0&&e<=cur)continue;
   event.push({kind:"duty",date,offset,s,e,type,place:v.place});
  }
  out.push(...event.sort((a,b)=>a.s-b.s));
 }
 return out.slice(0,4);
}
function renderUpcomingWithDuties(){
 const host=document.getElementById("todayLessons");if(!host)return;
 const cur=new Date(),now=cur.getHours()*60+cur.getMinutes();
 const upcoming=upcomingEvents();
 if(!upcoming.length){host.innerHTML='<div class="nolesson">Keine anstehenden Unterrichtsblöcke oder Aufsichten.</div>';return;}
 host.innerHTML=upcoming.map((event,index)=>{
  const {date,offset}=event;
  const active=offset===0&&now>=event.s&&now<event.e;
  const label=active?"Jetzt":index===0?"Als Nächstes":"Danach";
  const dateLabel=offset===0?"Heute":offset===1?"Morgen":DAYNAMES[date.getDay()]+" "+date.toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit"});
  const starts=event.kind==="lesson"?event.block.start:event.type.start;
  const ends=event.kind==="lesson"?event.block.end:event.type.end;
  const meta=event.kind==="lesson"?event.block.n+". Block":"Aufsicht";
  const details=event.kind==="lesson"
   ?event.block.entries.map(([f,k,r])=>safe(f)+" · "+safe(k)+(r?" · Raum "+safe(r):"")).join("<br>")
   :'<strong>🛡 '+safe(event.type.label)+'</strong><div class="hbl-duty-location">📍 '+safe(event.place)+'</div>';
  return '<div class="lessonrow '+(active?"current ":"")+(event.kind==="duty"?"hbl-duty-event":"")+'">'+
    '<div class="lessontime"><strong>'+dateLabel+'</strong><div>'+starts+'–'+ends+'</div><div class="lessondetail">'+label+" · "+meta+'</div></div>'+
    '<div class="lessonmain">'+details+'</div></div>';
 }).join("");
}
window.renderToday=renderUpcomingWithDuties;
window.hblDutyAfterLoad=()=>{renderTimetable();renderToday();};

const byId=id=>document.getElementById(id);
let pushWorking=false;
let beforeInstallPrompt=null;
let installBtn=null;
function pushUi(message,issue){
 const s=byId("hblPushState");if(s){s.textContent=message;s.classList.toggle("hbl-push-error",!!issue);}
}
function toUint8(str){
 const normalized=str.replace(/-/g,"+").replace(/_/g,"/");
 const binary=atob(normalized+"=".repeat((4-normalized.length%4)%4));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
function client(){return window.hblCloudClient||null;}
function user(){return typeof window.hblCloudUser==="function"?window.hblCloudUser():null;}
async function readyWorker(){
 if(!("serviceWorker" in navigator))throw Error("Dieser Browser unterstützt keine Service Worker.");
 return navigator.serviceWorker.ready;
}
async function updatePushUi(){
 const enable=byId("hblPushEnable"),disable=byId("hblPushDisable");
 if(!enable||!disable)return;
 enable.hidden=false;disable.hidden=true;
 const standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
 const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
 const support=("serviceWorker" in navigator)&&("PushManager" in window)&&("Notification" in window);
 if(!support){enable.disabled=true;pushUi(ios&&!standalone?"iPhone: erst in Safari über Teilen → Zum Home-Bildschirm installieren.":"Push wird von diesem Browser nicht unterstützt.",true);return;}
 if(ios&&!standalone){enable.disabled=true;pushUi("iPhone: Zuerst über Safari → Teilen → Zum Home-Bildschirm installieren.",true);return;}
 if(Notification.permission==="denied"){enable.disabled=true;pushUi("Mitteilungen sind in den Geräteeinstellungen blockiert.",true);return;}
 if(!user()||!client()){enable.disabled=true;pushUi("Für Erinnerungen bitte zuerst am Dashboard anmelden.");return;}
 enable.disabled=false;
 try{
  const reg=await readyWorker(),subscription=await reg.pushManager.getSubscription();
  if(!subscription){pushUi("Noch nicht aktiviert · Erinnerungen 10 Minuten vor Unterricht und Aufsicht.");return;}
  const {data,error}=await client().from("hbl_push_subscriptions").select("id")
    .eq("endpoint",subscription.endpoint).eq("user_id",user().id).maybeSingle();
  if(error)throw error;
  if(data){enable.hidden=true;disable.hidden=false;pushUi("🔔 Push-Erinnerungen auf diesem Gerät aktiviert.");}
  else pushUi("Gerät noch nicht mit diesem Konto verbunden. Bitte Erinnerungen aktivieren.");
 }catch(e){pushUi("Push-Status nicht abrufbar: "+(e?.message||e),true);}
}
async function enablePush(){
 if(pushWorking)return;
 pushWorking=true;
 const btn=byId("hblPushEnable");if(btn)btn.disabled=true;
 try{
  if(!client()||!user())throw Error("Bitte zuerst mit deinem Dashboard-Konto anmelden.");
  if(Notification.permission==="default"){
   const state=await Notification.requestPermission();
   if(state!=="granted")throw Error("Benachrichtigungen wurden nicht erlaubt.");
  }
  if(Notification.permission!=="granted")throw Error("Benachrichtigungen sind blockiert.");
  const worker=await readyWorker();
  let subscription=await worker.pushManager.getSubscription();
  if(!subscription)subscription=await worker.pushManager.subscribe({
   userVisibleOnly:true,applicationServerKey:toUint8(PUBLIC_VAPID)
  });
  const key=subscription.toJSON().keys||{};
  if(!key.p256dh||!key.auth)throw Error("Geräteschlüssel fehlen.");
  const {error}=await client().from("hbl_push_subscriptions").upsert({
    user_id:user().id,endpoint:subscription.endpoint,p256dh:key.p256dh,auth_key:key.auth,
    updated_at:new Date().toISOString()
  },{onConflict:"endpoint"});
  if(error)throw Error(error.code==="23505"?"Dieses Gerät ist noch einem anderen Konto zugeordnet. Dort erst abmelden.":error.message);
  pushUi("Erinnerungen aktiviert ✓");
 }catch(e){pushUi("Aktivierung fehlgeschlagen: "+(e?.message||e),true);}
 finally{pushWorking=false;await updatePushUi();}
}
async function disablePush(){
 if(pushWorking)return;
 pushWorking=true;
 try{
  const reg=await readyWorker(),subscription=await reg.pushManager.getSubscription();
  if(subscription){
   if(client()&&user()){
    const {error}=await client().from("hbl_push_subscriptions").delete().eq("endpoint",subscription.endpoint);
    if(error)throw error;
   }
   await subscription.unsubscribe();
  }
  pushUi("Erinnerungen deaktiviert.");
 }catch(e){pushUi("Deaktivieren fehlgeschlagen: "+(e?.message||e),true);}
 finally{pushWorking=false;await updatePushUi();}
}
window.hblPushOnLogout=async()=>{
 try{
  const reg=await readyWorker(),subscription=await reg.pushManager.getSubscription();
  if(!subscription)return;
  if(client()&&user())await client().from("hbl_push_subscriptions").delete().eq("endpoint",subscription.endpoint);
  await subscription.unsubscribe();
 }catch(e){console.warn("Push-Abmeldung konnte nicht abgeschlossen werden",e);}
};
function mountPushSettings(){
 const table=byId("weeklyTimetable");if(!table||byId("hblPushPanel"))return;
 const panel=document.createElement("section");
 panel.id="hblPushPanel";panel.className="hbl-push-panel";
 panel.innerHTML='<div class="hbl-push-header"><strong>🔔 Handy-Erinnerungen</strong><span>10 Minuten vor Unterricht und Aufsicht</span></div>'+
 '<p id="hblPushState" role="status">Push-Status wird geprüft …</p>'+
 '<div class="hbl-push-actions"><button type="button" id="hblPushEnable">Benachrichtigungen aktivieren</button>'+
 '<button type="button" id="hblPushDisable" hidden>Benachrichtigungen deaktivieren</button>'+
 '<button type="button" id="hblPwaInstall" hidden>App installieren</button></div>'+
 '<p class="hbl-push-note">Android: Browsermenü → App installieren. iPhone (iOS 16.4+): Safari → Teilen → Zum Home-Bildschirm. Auf dem iPhone erst die installierte App öffnen, dann Erinnerungen aktivieren. Mitteilungen benötigen Internet und deine Zustimmung.</p>';
 const wrapper=table.parentElement;wrapper.appendChild(panel);
 byId("hblPushEnable").onclick=()=>void enablePush();
 byId("hblPushDisable").onclick=()=>void disablePush();
 installBtn=byId("hblPwaInstall");
 installBtn.onclick=async()=>{
  if(!beforeInstallPrompt)return;
  beforeInstallPrompt.prompt();
  await beforeInstallPrompt.userChoice;
  beforeInstallPrompt=null;installBtn.hidden=true;
 };
 void updatePushUi();
}
window.addEventListener("beforeinstallprompt",e=>{
 e.preventDefault();beforeInstallPrompt=e;
 if(installBtn)installBtn.hidden=false;
});
window.addEventListener("appinstalled",()=>{beforeInstallPrompt=null;if(installBtn)installBtn.hidden=true;});
window.addEventListener("hbl-cloud-status",()=>void updatePushUi());
function init(){
 mountPushSettings();
 if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js",{scope:"./"})
  .then(()=>void updatePushUi()).catch(e=>pushUi("App-Service nicht verfügbar: "+e.message,true));
 window.addEventListener("online",()=>void updatePushUi());
 if(byId("weeklyTimetable")){renderTimetable();renderToday();}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();