/* HBL v5.9: private Chat-Push mit Arbeitszeitfenster. */
(()=>{
"use strict";
const el=id=>document.getElementById(id);
const db=()=>window.hblCloudClient||null;
const user=()=>typeof window.hblCloudUser==="function"?window.hblCloudUser():null;
const weekdays=["Mo","Di","Mi","Do","Fr","Sa","So"];
let currentUser=null;
let loadVersion=0,returnFocus,returnToMenu;
let ready=false;
function message(value,bad=false){const status=el("hblChatPushStatus");if(status){status.textContent=value;status.classList.toggle("problem",bad);}}
function mount(){
 const header=el("hblChatHeading")?.closest(".hbl-chat-head");
 if(!header)return false;
 // Kein zusätzlicher Ruhezeiten-Button im Chatkopf: zentral unter Mein HBL.
 if(el("hblChatPushOverlay"))return true;
 const overlay=document.createElement("div");
 overlay.className="hbl-chat-push-overlay";overlay.id="hblChatPushOverlay";overlay.hidden=true;
 overlay.innerHTML='<section class="hbl-chat-push-dialog" role="dialog" aria-modal="true" aria-labelledby="hblChatPushHeading">'+
 '<div class="hbl-chat-push-top"><h2 id="hblChatPushHeading">🔔 Benachrichtigungen</h2><button type="button" id="hblChatPushClose" aria-label="Schließen">✕</button></div>'+
 '<p>Wähle deine Kategorien und ein gemeinsames Zeitfenster für alle Benachrichtigungen. Kalender und Mitteilungen kannst du für spätere Versionen vormerken.</p>'+
 '<form id="hblChatPushForm">'+
 '<label class="hbl-chat-push-switch"><input id="hblChatPushEnabled" type="checkbox"> Chatnachrichten</label>'+
 '<label class="hbl-chat-push-switch"><input id="hblLessonPush" type="checkbox"> Unterricht &amp; Aufsichten (10 Minuten vorher)</label>'+
 '<label class="hbl-chat-push-switch"><input id="hblCalendarPush" type="checkbox"> Kalendererinnerungen (ab v8.0)</label>'+
 '<label class="hbl-chat-push-switch"><input id="hblAnnouncementPush" type="checkbox"> Mitteilungen (ab v12.0)</label>'+
 '<p class="hbl-chat-push-label">Aktive Wochentage</p><div class="hbl-chat-push-days" id="hblChatPushDays"></div>'+
 '<div class="hbl-chat-push-times"><label>Von <input id="hblChatPushStart" type="time" value="07:00" required></label>'+
 '<label>Bis <input id="hblChatPushEnd" type="time" value="17:00" required></label></div>'+
 '<label class="hbl-chat-push-switch secondary"><input id="hblChatPushPreview" type="checkbox"> Nachrichtentext in der Vorschau anzeigen</label>'+
 '<p class="hbl-chat-push-tip">Zeitzone: Deutschland (Europe/Berlin). Bei Zeiten über Mitternacht gelten die ausgewählten Starttage. Pushes außerhalb der festgelegten Zeiten werden nicht nachträglich zugestellt.</p>'+
 '<button type="submit" class="hbl-chat-push-primary" id="hblChatPushSave">Einstellungen speichern</button>'+
 '</form><div class="hbl-chat-push-device"><strong>Dieses Gerät</strong>'+
 '<p>Damit Benachrichtigungen auch bei geschlossener Seite erscheinen, musst du Push auf diesem Gerät erlauben.</p>'+
 '<button type="button" id="hblChatPushDevice">Handy-/Browser-Push aktivieren</button>'+
 '<button type="button" id="hblChatPushTest">🔔 Testbenachrichtigung senden</button>'+
 '<p id="hblChatPushDeviceState"></p></div>'+
 '<p id="hblChatPushStatus" role="status"></p>'+
 '<p class="hbl-chat-push-tip">iPhone: Dashboard in Safari zum Home-Bildschirm hinzufügen und anschließend die installierte App öffnen. Android: Browserberechtigung für Benachrichtigungen erteilen.</p>'+
 '</section>';
 document.body.appendChild(overlay);
 // Geräte-Push-Aktionen aus dem Stundenplan in diese zentrale Steuerung holen.
 const devicePanel=el('hblPushPanel');
 if(devicePanel)overlay.querySelector('.hbl-chat-push-dialog').appendChild(devicePanel);
 el("hblChatPushClose").onclick=()=>showSettings(false);
 overlay.addEventListener("click",e=>{if(e.target===overlay)showSettings(false);});
 overlay.addEventListener("keydown",e=>{
  if(e.key==="Escape"){e.stopPropagation();showSettings(false);}
  if(e.key!=="Tab")return;
  const controls=[...overlay.querySelectorAll("button:not(:disabled),input:not(:disabled)")];
  const first=controls[0],last=controls.at(-1);
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 });
 el("hblChatPushForm").onsubmit=e=>{e.preventDefault();void save();};
 el("hblChatPushDevice").onclick=()=>void activateDevice();
 el("hblChatPushTest").onclick=()=>void testNotification();
 el("hblChatPushDays").innerHTML=weekdays.map((name,i)=>
  '<label><input type="checkbox" value="'+(i+1)+'" '+(i<5?"checked":"")+'> '+name+'</label>').join("");
 return true;
}
async function deviceStatus(){
 const root=el("hblChatPushDeviceState");
 if(!root)return;
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
 const supported="serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
 if(!supported){root.textContent="Dieser Browser unterstützt keine Web-Push-Mitteilungen.";return;}
 if(ios&&!standalone){root.textContent="iPhone: Bitte zuerst die Web-App über Safari installieren.";return;}
 if(Notification.permission==="denied"){root.textContent="Mitteilungen sind in den Einstellungen des Geräts blockiert.";return;}
 try{
  const worker=await navigator.serviceWorker.ready,subscription=await worker.pushManager.getSubscription();
  if(!subscription){root.textContent="Noch nicht aktiviert auf diesem Gerät.";return;}
  const {data,error}=await db().from("hbl_push_subscriptions")
   .select("id").eq("endpoint",subscription.endpoint).eq("user_id",user().id).maybeSingle();
  if(error)throw error;
  root.textContent=data?"✓ Push auf diesem Gerät aktiviert":"Push ist auf diesem Gerät noch nicht mit deinem Konto verbunden.";
 }catch(e){root.textContent="Status nicht abrufbar: "+e.message;}
}
async function activateDevice(){
 const btn=el("hblChatPushDevice");if(!btn)return;
 btn.disabled=true;message("Benachrichtigungen werden eingerichtet …");
 try{
  if(typeof window.hblEnablePush!=="function")throw Error("Push-Unterstützung nicht geladen.");
  await window.hblEnablePush();
  await deviceStatus();
  message("Bitte Gerätestatus oben prüfen.");
 }catch(e){message("Aktivierung fehlgeschlagen: "+e.message,true);}
 finally{btn.disabled=false;}
}
async function testNotification(){
 const btn=el("hblChatPushTest");
 if(!btn||btn.disabled)return;
 btn.disabled=true;message("Teste Push-Verbindung …");
 try{
  if(!db()||!user())throw Error("Bitte am Dashboard anmelden.");
  if(!("serviceWorker" in navigator)||!("PushManager" in window)||!("Notification" in window))
   throw Error("Web Push wird von diesem Gerät nicht unterstützt.");
  if(Notification.permission!=="granted")
   throw Error("Mitteilungen nicht erlaubt. Bitte zuerst auf diesem Gerät aktivieren.");
  const worker=await navigator.serviceWorker.ready;
  const subscription=await worker.pushManager.getSubscription();
  if(!subscription)throw Error("Dieses Gerät hat noch kein Push-Abonnement. Bitte Push aktivieren.");
  const {data:registered,error:checkError}=await db().from("hbl_push_subscriptions")
    .select("id").eq("endpoint",subscription.endpoint).eq("user_id",user().id).maybeSingle();
  if(checkError)throw Error("Gerätedaten nicht prüfbar: "+checkError.message);
  if(!registered)throw Error("Dieses Gerät ist noch nicht beim Dashboard registriert. Push erneut aktivieren.");
  const {data,error}=await db().functions.invoke("hbl-push-test",{body:{endpoint:subscription.endpoint}});
  if(error){
   let detail=error.message||"Unbekannter Fehler";
   try{
    const payload=await error.context?.json();
    if(payload?.error)detail=payload.error;
   }catch(_){}
   throw Error(detail);
  }
  if(!data?.ok)throw Error(data?.error||"Test wurde vom Server abgelehnt.");
  message("✓ Push-Dienst hat den Test angenommen. Prüfe jetzt die Geräte-Mitteilungen. Falls nichts erscheint: Fokusmodus und Systemeinstellungen kontrollieren.");
 }catch(error){message("Push-Test: "+(error?.message||error),true);}
 finally{btn.disabled=false;await deviceStatus();}
}
async function showSettings(open){
 if(!mount())return;
 if(open)returnFocus=document.activeElement;
 el("hblChatPushOverlay").hidden=!open;
 if(!open){
  if(returnToMenu){const back=returnToMenu;returnToMenu=null;back();}
  else returnFocus?.focus();
  return;
 }
 el("hblChatPushClose").focus();
 await load();
 if(user())await deviceStatus();
}
window.hblOpenPushSettings=back=>{returnToMenu=back;void showSettings(true);};
async function load(){
 const version=++loadVersion;
 currentUser=null;el("hblChatPushSave").disabled=true;
 if(!db()||!user()){message("Bitte zuerst anmelden.");return;}
 const id=user().id;
 const {data,error}=await db().from("hbl_chat_push_preferences")
  .select("enabled,lessons_enabled,calendar_enabled,announcements_enabled,days,start_time,end_time,preview").eq("user_id",id).maybeSingle();
 if(version!==loadVersion||user()?.id!==id)return;
 if(error){message("Einstellungen konnten nicht geladen werden: "+error.message,true);return;}
 currentUser=id;
 el("hblChatPushEnabled").checked=data?.enabled??true;
 el("hblLessonPush").checked=data?.lessons_enabled??true;
 el("hblCalendarPush").checked=data?.calendar_enabled??false;
 el("hblAnnouncementPush").checked=data?.announcements_enabled??true;
 el("hblChatPushSave").disabled=false;
 const days=data?.days||[1,2,3,4,5];
 el("hblChatPushDays").querySelectorAll("input").forEach(input=>input.checked=days.includes(Number(input.value)));
 el("hblChatPushStart").value=String(data?.start_time||"07:00").slice(0,5);
 el("hblChatPushEnd").value=String(data?.end_time||"17:00").slice(0,5);
 el("hblChatPushPreview").checked=data?.preview??false;
 if(!data){message("Vorschläge geladen. Speichere deine Auswahl, um sie zu übernehmen.");return;}
 await reportWindow(data);
}
async function reportWindow(pref,saved=false){
 const id=user()?.id;
 const policy=await import("./supabase/functions/hbl-push-dispatch/push-policy.mjs?v=6.0.0").catch(()=>null);
 if(!id||user()?.id!==id)return;
 if(!policy){message((saved?"Gespeichert. ":"")+"Zeitfensterstatus momentan nicht verfügbar.");return;}
 const parts=Object.fromEntries(new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const local={date:parts.year+"-"+parts.month+"-"+parts.day,time:parts.hour+":"+parts.minute};
 message((saved?"Gespeichert. ":"")+(policy.pushWindowActive(pref,local)?"Benachrichtigungszeit aktiv.":"Ruhezeit aktiv."));
}
async function save(){
 if(!db()||!user()||currentUser!==user().id)return;
 const uid=user().id;
 const days=[...el("hblChatPushDays").querySelectorAll("input:checked")].map(i=>Number(i.value));
 const start=el("hblChatPushStart").value,end=el("hblChatPushEnd").value;
 if(!days.length){message("Bitte mindestens einen Wochentag auswählen.",true);return;}
 if(!start||!end||start===end){message("Beginn und Ende müssen unterschiedlich sein.",true);return;}
 const btn=el("hblChatPushSave");btn.disabled=true;message("Speichern …");
 try{
  const {error}=await db().from("hbl_chat_push_preferences").upsert({
   user_id:uid,enabled:el("hblChatPushEnabled").checked,days,
   lessons_enabled:el("hblLessonPush").checked,calendar_enabled:el("hblCalendarPush").checked,
   announcements_enabled:el("hblAnnouncementPush").checked,
   start_time:start,end_time:end,preview:el("hblChatPushPreview").checked,
   updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error)throw error;
  await reportWindow({days,start_time:start,end_time:end},true);
  await deviceStatus();
 }catch(e){message("Speichern fehlgeschlagen: "+e.message,true);}
 finally{btn.disabled=false;}
}
function init(){
 if(!mount())return;
 window.addEventListener("hbl-cloud-status",()=>{
  const logged=user();
  if(!logged){currentUser=null;el("hblChatPushOverlay").hidden=true;return;}
  if(logged.id!==currentUser)void load();
 });
 window.addEventListener("hbl-chat-access-changed",()=>{if(el("hblChatPushOverlay")&&!el("hblChatPushOverlay").hidden)void load();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
