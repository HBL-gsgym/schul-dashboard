/* HBL v5.9: private Chat-Push mit Arbeitszeitfenster. */
(()=>{
"use strict";
const el=id=>document.getElementById(id);
const db=()=>window.hblCloudClient||null;
const user=()=>typeof window.hblCloudUser==="function"?window.hblCloudUser():null;
const weekdays=["Mo","Di","Mi","Do","Fr","Sa","So"];
let currentUser=null;
let ready=false;
function message(value,bad=false){const status=el("hblChatPushStatus");if(status){status.textContent=value;status.classList.toggle("problem",bad);}}
function mount(){
 const header=el("hblChatHeading")?.closest(".hbl-chat-head");
 if(!header)return false;
 if(!el("hblChatPushOpen")){
  const button=document.createElement("button");
  button.type="button";button.id="hblChatPushOpen";button.className="hbl-chat-push-launch";
  button.textContent="🔔 Ruhezeiten";button.title="Chat-Benachrichtigungen und Arbeitszeiten einstellen";
  button.addEventListener("click",()=>void showSettings(true));
  header.insertBefore(button,el("hblChatClose"));
 }
 if(el("hblChatPushOverlay"))return true;
 const overlay=document.createElement("div");
 overlay.className="hbl-chat-push-overlay";overlay.id="hblChatPushOverlay";overlay.hidden=true;
 overlay.innerHTML='<section class="hbl-chat-push-dialog" role="dialog" aria-modal="true" aria-labelledby="hblChatPushHeading">'+
 '<div class="hbl-chat-push-top"><h2 id="hblChatPushHeading">🔔 Chat-Benachrichtigungen</h2><button type="button" id="hblChatPushClose" aria-label="Schließen">✕</button></div>'+
 '<p>Du entscheidest, wann Chat-Nachrichten als Pop-up auf deinem Handy erscheinen. Die Nachrichten selbst bleiben jederzeit im Chat abrufbar.</p>'+
 '<form id="hblChatPushForm">'+
 '<label class="hbl-chat-push-switch"><input id="hblChatPushEnabled" type="checkbox"> Chat-Pop-ups aktivieren</label>'+
 '<p class="hbl-chat-push-label">Aktive Wochentage</p><div class="hbl-chat-push-days" id="hblChatPushDays"></div>'+
 '<div class="hbl-chat-push-times"><label>Von <input id="hblChatPushStart" type="time" value="07:00" required></label>'+
 '<label>Bis <input id="hblChatPushEnd" type="time" value="17:00" required></label></div>'+
 '<label class="hbl-chat-push-switch secondary"><input id="hblChatPushPreview" type="checkbox"> Nachrichtentext in der Vorschau anzeigen</label>'+
 '<p class="hbl-chat-push-tip">Zeitzone: Deutschland (Europe/Berlin). Bei Zeiten über Mitternacht gelten die ausgewählten Starttage. Pushes außerhalb der festgelegten Zeiten werden nicht nachträglich zugestellt.</p>'+
 '<button type="submit" class="hbl-chat-push-primary" id="hblChatPushSave">Einstellungen speichern</button>'+
 '</form><div class="hbl-chat-push-device"><strong>Dieses Gerät</strong>'+
 '<p>Damit Benachrichtigungen auch bei geschlossener Seite erscheinen, musst du Push auf diesem Gerät erlauben.</p>'+
 '<button type="button" id="hblChatPushDevice">Handy-/Browser-Push aktivieren</button>'+
 '<p id="hblChatPushDeviceState"></p></div>'+
 '<p id="hblChatPushStatus" role="status"></p>'+
 '<p class="hbl-chat-push-tip">iPhone: Dashboard in Safari zum Home-Bildschirm hinzufügen und anschließend die installierte App öffnen. Android: Browserberechtigung für Benachrichtigungen erteilen.</p>'+
 '</section>';
 document.body.appendChild(overlay);
 el("hblChatPushClose").onclick=()=>showSettings(false);
 overlay.addEventListener("click",e=>{if(e.target===overlay)showSettings(false);});
 overlay.addEventListener("keydown",e=>{if(e.key==="Escape")showSettings(false);});
 el("hblChatPushForm").onsubmit=e=>{e.preventDefault();void save();};
 el("hblChatPushDevice").onclick=()=>void activateDevice();
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
async function showSettings(open){
 if(!mount())return;
 el("hblChatPushOverlay").hidden=!open;
 if(!open)return;
 await load();
 await deviceStatus();
}
async function load(){
 if(!db()||!user())return;
 const id=user().id;
 const {data,error}=await db().from("hbl_chat_push_preferences")
  .select("enabled,days,start_time,end_time,preview").eq("user_id",id).maybeSingle();
 if(error){message("Einstellungen konnten nicht geladen werden: "+error.message,true);return;}
 currentUser=id;
 el("hblChatPushEnabled").checked=data?.enabled??false;
 const days=data?.days||[1,2,3,4,5];
 el("hblChatPushDays").querySelectorAll("input").forEach(input=>input.checked=days.includes(Number(input.value)));
 el("hblChatPushStart").value=String(data?.start_time||"07:00").slice(0,5);
 el("hblChatPushEnd").value=String(data?.end_time||"17:00").slice(0,5);
 el("hblChatPushPreview").checked=data?.preview??false;
 message("");
}
async function save(){
 if(!db()||!user())return;
 const uid=user().id;
 const days=[...el("hblChatPushDays").querySelectorAll("input:checked")].map(i=>Number(i.value));
 const start=el("hblChatPushStart").value,end=el("hblChatPushEnd").value;
 if(!days.length){message("Bitte mindestens einen Wochentag auswählen.",true);return;}
 if(!start||!end||start===end){message("Beginn und Ende müssen unterschiedlich sein.",true);return;}
 const btn=el("hblChatPushSave");btn.disabled=true;message("Speichern …");
 try{
  const {error}=await db().from("hbl_chat_push_preferences").upsert({
   user_id:uid,enabled:el("hblChatPushEnabled").checked,days,
   start_time:start,end_time:end,preview:el("hblChatPushPreview").checked,
   updated_at:new Date().toISOString()
  },{onConflict:"user_id"});
  if(error)throw error;
  message("✓ Einstellungen gespeichert. Chat-Nachrichten bleiben auch während der Freizeit lesbar.");
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