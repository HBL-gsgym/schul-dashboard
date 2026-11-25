/* HBL Cloud Sync v4.0: anonymous demo only; each user owns one RLS-protected snapshot. */
(() => {
"use strict";
const URL="https://lmadidvmmwxcbytokoys.supabase.co";
const KEY="sb_publishable_3CWYEt1PpG7t8ur4IA4uiw_nTPtA7e5";
const PAGE="https://hbl-gsgym.github.io/schul-dashboard/";
const el=(id)=>document.getElementById(id);
let client=null,user=null,revision=0,active=false,paused=false,dirty=false,queue=Promise.resolve(),lastError="";
function access(allowed){
 document.documentElement.dataset.access=allowed?"ready":"locked";
 const root=document.getElementById("hblAppRoot");if(root)root.inert=!allowed;
}
access(false);
let bootVersion=0,sessionVersion=0,changeVersion=0,readVersion=0,restoring=false;
let loggingOut=false,retrying=false,pendingBackupFailed=false;
function userKey(){return user ? "hbl-cloud-pending-"+user.id : "";}
function validDemoData(data){return data&&typeof data==="object"&&!Array.isArray(data);}
function status(message,issue=false,state){
 state=state||(issue||paused?"error":(!active||dirty?"pending":window.hblSyncState?.state||"pending"));
 window.hblSyncState={message,state};
 const badge=el("hblCloudState");
 if(badge){badge.textContent=message;badge.style.color=issue?"#ffc387":"";}
 const notice=el("hblSyncNotice");
 if(notice){notice.textContent=message;notice.dataset.issue=String(issue);notice.hidden=!user;}
 window.dispatchEvent(new Event("hbl-sync-state"));
 if(active && typeof prepStatus==="function")prepStatus(message,issue);
 if(active && typeof setParticipationStatus==="function")setParticipationStatus(message,issue);
}
function showModal(open=true){
 const modal=el("hblCloudModal");if(!modal)return;
 modal.hidden=active&&!open;
 if(open){setTimeout(()=>el("hblCloudEmail")?.focus(),20);}
}
function message(value,error=false){
 const box=el("hblCloudMessage");if(box){box.textContent=value;box.style.color=error?"#c2410c":"";}
}
function controls(){
 const panel=el("hblCloudControls");if(!panel)return;
 const signed=!!user;
 el("hblCloudAccount").textContent=signed ? ("Angemeldet: "+(window.hblCurrentUsername||user.email)) : "Bitte anmelden";
 el("hblCloudLogin").hidden=signed;
 el("hblCloudLogout").hidden=!signed;
 el("hblCloudRefresh").hidden=!signed;
 el("hblCloudRetry").hidden=!signed;
 el("hblCloudImport").hidden=!signed;
 if(!signed)status("Anmeldung erforderlich");
}
function rememberPending(snapshot){
 try{localStorage.setItem(userKey(),JSON.stringify({content:snapshot,expectedRevision:revision,at:Date.now()}));pendingBackupFailed=false;}catch(e){pendingBackupFailed=true;status("Lokale Sicherung fehlgeschlagen – App offen lassen und Daten exportieren!",true);throw e;}
}
function downloadLocalBackup(){
 try{
  const pending=getPending();
  const content=pendingBackupFailed?prepDone:(pending?pending.content:prepDone);
  if(!validDemoData(content))throw Error("Lokale Sicherung ist ungültig.");
  const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json"});
  const url=window.URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="HBL-Lokale-Sicherung-"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(a);
  try{a.click();}finally{a.remove();setTimeout(()=>window.URL.revokeObjectURL(url),2000);}
  status("Download der vollständigen lokalen Sicherung gestartet");
 }catch(e){status("Sicherung fehlgeschlagen: "+e.message,true);}
}
function clearPending(){
 try{localStorage.removeItem(userKey());}catch(e){}
}
function getPending(){
 try{return JSON.parse(localStorage.getItem(userKey())||"null");}catch(e){return null;}
}
async function loadRemote({force=false}={}){
 if(!client||!user)return;
 if(!force && (dirty||paused||getPending())){status("Ungesicherte lokale Änderungen – zuerst synchronisieren",true);return;}
 const session=sessionVersion,changes=changeVersion,request=++readVersion;
 await queue.catch(()=>{});
 if(session!==sessionVersion||changes!==changeVersion)return;
 const {data,error}=await client.from("hbl_dashboard_snapshots").select("content,revision").eq("user_id",user.id).maybeSingle();
 if(session!==sessionVersion||request!==readVersion)return;
 if(changes!==changeVersion||(!force&&(dirty||paused||getPending()))){
  status("Lokale Änderungen bleiben erhalten – Cloud-Abgleich zurückgestellt",true);return;
 }
 if(error)throw error;
 const content=data?.content||{};
 if(!validDemoData(content))throw Error("Ungültige Daten in der Cloud.");
 if(force && (dirty||getPending()) && !confirm("Ungesicherte Änderungen auf diesem Gerät werden verworfen. Wirklich Cloud-Version laden?"))return;
 revision=Number(data?.revision||0);
 active=true;paused=false;dirty=false;clearPending();
 applyPrepData(content);
 if(typeof initializeParticipationRoster==="function" && currentParticipationCourse)initializeParticipationRoster();
 status("Cloud synchronisiert · Stand "+revision+" ✓",false,"synced");
 controls();
}
async function cloudWrite(snapshot){
 if(!active||!client||!user)throw Error("Nicht angemeldet");
 if(paused){
  status("Nicht synchronisiert · lokale Änderungen gesichert. Einstellungen → Daten & Synchronisierung öffnen.",true);
  throw Error("Cloud-Synchronisierung pausiert. Bitte Konflikt lösen.");
 }
 const session=sessionVersion;
 const {data,error}=await client.rpc("hbl_save_snapshot",{p_content:snapshot,p_expected_revision:revision});
 if(session!==sessionVersion)throw Error("Sitzung wurde gewechselt. Lokale Sicherung bleibt erhalten.");
 changeVersion++;
 if(error){
  paused=true;lastError=error.message||"Synchronisierung fehlgeschlagen";
  status(/VERSION_CONFLICT/.test(lastError)?"Anderes Gerät hat neuere Daten – bitte prüfen":("Cloud nicht gespeichert: "+lastError),true);
  throw error;
 }
 revision=Number(data);
 const pending=getPending();
 if(pending && JSON.stringify(pending.content)===JSON.stringify(snapshot)){clearPending();dirty=false;}
 else if(pending){pending.expectedRevision=revision;try{localStorage.setItem(userKey(),JSON.stringify(pending));}catch(e){}}
 lastError="";
 status(dirty?"Weitere Änderungen werden gespeichert …":"Cloud synchronisiert · Stand "+revision+" ✓",false,dirty?"pending":"synced");
}
window.savePrepFile=function(){
 if(loggingOut)return Promise.reject(Error("Abmeldung läuft. Bitte kurz warten."));
 if(restoring)return Promise.resolve();
 if(!active)return Promise.reject(Error("Bitte zuerst anmelden."));
 const snapshot=JSON.parse(JSON.stringify(prepDone));
 const session=sessionVersion;
 changeVersion++;
 dirty=true;
 try{rememberPending(snapshot);}catch(e){return Promise.reject(e);}
 status("Speichert in der Cloud …");
 queue=queue.catch(()=>{}).then(()=>{
  if(session!==sessionVersion)throw Error("Sitzung wurde gewechselt. Lokale Sicherung bleibt erhalten.");
  return cloudWrite(snapshot);
 });
 return queue;
};
function beginStartup(){
 window.hblStartup?.begin(()=>{
  bootVersion++;sessionVersion++;readVersion++;
  active=false;serverReady=false;access(false);
 });
}
function startupFailure(error){
 if(error?.status===401||['refresh_token_not_found','refresh_token_already_used','bad_jwt','session_not_found'].includes(error?.code)){
  user=null;active=false;serverReady=false;access(false);controls();
  message("Deine Sitzung ist abgelaufen. Bitte erneut anmelden.",true);
  window.hblStartup?.finish("login");showModal(true);
 }else{
  status("Start fehlgeschlagen: "+(error?.message||"Verbindung nicht erreichbar"),true);
  window.hblStartup?.fail();
 }
}
async function startSession(session){
 beginStartup();
 const version=++sessionVersion;
 serverReady=false;access(false);
 user=session?.user||null;
 active=false;paused=false;dirty=false;revision=0;pendingBackupFailed=false;
 if(!user){active=false;paused=false;dirty=false;revision=0;controls();window.hblStartup?.finish("login");showModal(true);return;}
 controls();
 try{
  const membership=await client.from("hbl_dashboard_members").select("enabled").eq("user_id",user.id).maybeSingle();
  if(version!==sessionVersion)return;
  if(membership.error)throw membership.error;
  if(!membership.data?.enabled){
   active=false;
   status("Konto nicht freigeschaltet – bitte Administrator kontaktieren",true);
   message("Konto nicht freigeschaltet – bitte Administrator kontaktieren",true);window.hblStartup?.finish("login");showModal(true);
   window.dispatchEvent(new Event("hbl-cloud-status"));
   return;
  }
  serverReady=true;
  const pending=getPending();
  if(pending){
   if(!validDemoData(pending.content)||!Number.isFinite(pending.expectedRevision))throw Error("Lokale Sicherung ist ungültig. Bitte nicht überschreiben.");
   revision=pending.expectedRevision;active=true;paused=true;dirty=true;
   restoring=true;
   try{applyPrepData(pending.content);}finally{restoring=false;}
   rememberPending(JSON.parse(JSON.stringify(prepDone)));
   status("Lokale Änderungen wiederhergestellt – bitte exportieren oder erneut speichern",true);
  }else await loadRemote();
  if(version!==sessionVersion)return;
  access(true);window.hblStartup?.finish("ready");showModal(false);
  window.dispatchEvent(new Event("hbl-cloud-status"));
 }catch(e){if(version===sessionVersion)startupFailure(e);}
}
window.hblLogout=async function(){
 if(loggingOut||!client)return false;
 if((dirty||getPending())&&!confirm("Auf diesem Gerät liegen ungesicherte Änderungen. Wirklich abmelden? Die lokale Sicherung bleibt erhalten."))return false;
 loggingOut=true;
 try{
  await queue.catch(()=>{});
  let pushWarning=false;
  if(typeof window.hblPushOnLogout==="function"){
   try{await window.hblPushOnLogout();}catch(_){pushWarning=true;}
  }
  const {error}=await client.auth.signOut();
  if(error)throw error;
  access(false);
  sessionVersion++;user=null;active=false;paused=false;revision=0;dirty=false;
  if(pushWarning)alert("Du bist abgemeldet. Die Push-Abmeldung konnte nicht vollständig bestätigt werden. Auf diesem Gerät können noch Mitteilungen erscheinen; deaktiviere sie bei Bedarf in den Browsereinstellungen.");
  location.reload();
  return true;
 }catch(e){
  const text="Abmeldung fehlgeschlagen: "+e.message;
  status(text,true);message(text,true);alert(text);
  return false;
 }finally{loggingOut=false;}
};
async function initializeAuth(){
 const modal=document.createElement("div");
 modal.id="hblCloudModal";modal.className="hbl-cloud-overlay";modal.hidden=true;
 modal.innerHTML='<section class="hbl-cloud-dialog" role="dialog" aria-modal="true" aria-label="Cloud-Anmeldung"><button type="button" id="hblCloudClose" class="hbl-cloud-close" aria-label="Schließen">✕</button><h2>☁️ Dashboard-Anmeldung</h2><p>Der Zugang ist nur mit persönlicher Einladung möglich. Melde dich mit E-Mail-Adresse und Passwort an.</p><form id="hblCloudForm"><label>E-Mail<input id="hblCloudEmail" type="email" autocomplete="email" required></label><label>Passwort<input id="hblCloudPassword" type="password" autocomplete="current-password" minlength="8" required></label><div class="hbl-cloud-actions"><button type="submit">Anmelden</button></div></form><p id="hblCloudMessage" role="status"></p><small>Du hast noch keinen Zugang? Bitte den Hauptadministrator um eine persönliche Einladung. Keine echten Schülerdaten in dieser Pilotversion speichern.</small></section>';
 const bar=document.createElement("section");
 bar.className="hbl-cloud-bar";bar.id="hblCloudControls";
 bar.innerHTML='<div class="hbl-cloud-label">☁ <strong id="hblCloudAccount">Bitte anmelden</strong><span id="hblCloudState">Laden …</span></div><div class="hbl-cloud-actions"><button id="hblCloudLogin">Anmelden</button><button id="hblLocalBackup">Lokale Sicherung herunterladen</button><button id="hblCloudRefresh" hidden>↻ Abgleichen</button><button id="hblCloudRetry" hidden>↥ Erneut speichern</button><button id="hblCloudImport" hidden>Testdaten übertragen</button><button id="hblCloudLogout" hidden>Abmelden</button></div>';
 const more=document.createElement("button");
 more.type="button";more.id="hblAccountMore";more.className="hbl-account-more";
 more.textContent="Konto ▾";
 more.setAttribute("aria-expanded","false");
 more.setAttribute("aria-label","Weitere Kontoaktionen anzeigen");
 more.onclick=()=>{
  const open=bar.classList.toggle("hbl-account-expanded");
  more.setAttribute("aria-expanded",String(open));
  more.setAttribute("aria-label",open?"Weitere Kontoaktionen ausblenden":"Weitere Kontoaktionen anzeigen");
  more.textContent=open?"Konto ▴":"Konto ▾";
 };
 bar.appendChild(more);
 bar.onkeydown=e=>{
  if(e.key==="Escape"&&bar.classList.contains("hbl-account-expanded")){
   more.onclick();more.focus();
  }
 };
 document.body.prepend(bar);
 document.body.appendChild(modal);
 const notice=document.createElement("button");notice.type="button";notice.id="hblSyncNotice";
 notice.setAttribute("aria-live","polite");
 notice.onclick=()=>{window.openMeinHbl?.();document.querySelector(".mein-hbl [data-sync]")?.click();};
 document.body.appendChild(notice);
 el("hblCloudClose").onclick=()=>showModal(false);
 modal.onclick=e=>{if(e.target===modal)showModal(false)};
 el("hblCloudLogin").onclick=()=>showModal(true);
 el("hblCloudForm").onsubmit=async e=>{
  e.preventDefault();
  if(!client)return message("Supabase-Anmeldung konnte nicht geladen werden.",true);
  beginStartup();const attempt=++bootVersion;
  message("Anmeldung läuft …");
  try{
   const {data,error}=await client.auth.signInWithPassword({email:el("hblCloudEmail").value.trim(),password:el("hblCloudPassword").value});
   if(attempt!==bootVersion)return;
   if(error){window.hblStartup?.finish("login");showModal(true);message(error.message,true);}
   else {message("Angemeldet ✓");await startSession(data.session);}
  }catch(e){if(attempt===bootVersion)startupFailure(e);}
 };
 el("hblLocalBackup").onclick=downloadLocalBackup;
 el("hblCloudLogout").onclick=()=>window.hblLogout();
 el("hblCloudRefresh").onclick=async()=>{
  try{await loadRemote({force:true});}catch(e){status("Abgleich fehlgeschlagen: "+e.message,true);}
 };
 el("hblCloudRetry").onclick=retryPending;
 el("hblCloudImport").onclick=async()=>{
  if(!active||paused)return;
  let saved;
  try{saved=JSON.parse(localStorage.getItem("hbl-github-pages-demo-v1")||"{}");}catch(e){return alert("Lokale Daten unlesbar");}
  if(!validDemoData(saved))return;
  if(!confirm("NUR FÜR ANONYMISIERTE TESTDATEN! Alle lokal gespeicherten Demo-Daten dieses Browsers in dein Cloud-Konto übertragen? Vorhandene Cloud-Daten werden ersetzt. Keine echten Schülernamen/Noten hochladen!"))return;
  try{await cloudWrite(saved);applyPrepData(saved);}
  catch(e){status("Übernahme fehlgeschlagen: "+e.message,true);}
 };
 beginStartup();
 if(!window.supabase?.createClient){startupFailure(Error("Cloud-Bibliothek nicht geladen"));return;}
 client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 window.hblCloudClient=client;
 window.hblCloudUser=()=>user;
 window.hblChangeOwnPassword=async(expectedId,current,password)=>{
  if(!expectedId||user?.id!==expectedId||!user.email)throw Error("Bitte erneut anmelden.");
  if(!current||password.length<10||password===current)throw Error("Bitte ein anderes neues Passwort mit mindestens 10 Zeichen wählen.");
  const check=window.supabase.createClient(URL,KEY,{auth:{storageKey:"hbl-password-"+crypto.randomUUID(),persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  try{
   const verified=await check.auth.signInWithPassword({email:user.email,password:current});
   if(verified.error)throw Error("Anmeldung mit dem bisherigen Passwort fehlgeschlagen.");
   if(verified.data.user?.id!==expectedId||user?.id!==expectedId)throw Error("Das aktive Konto hat sich geändert.");
   const result=await check.auth.updateUser({password});
   if(result.error)throw result.error;
  }finally{
   await check.auth.signOut({scope:"local"}).catch(()=>{});
  }
 };
 client.auth.onAuthStateChange((event,session)=>{
  if(event==="SIGNED_OUT"){bootVersion++;sessionVersion++;user=null;active=false;access(false);controls();window.hblStartup?.finish("login");showModal(true);window.dispatchEvent(new Event("hbl-cloud-status"));}
  if(document.documentElement.dataset.startup!=="error"&&(event==="SIGNED_IN"||event==="PASSWORD_RECOVERY")&&session?.user&&session.user.id!==user?.id){
   setTimeout(()=>{if(document.documentElement.dataset.startup!=="error"&&session?.user&&session.user.id!==user?.id)void startSession(session);},0);
  }
  // TOKEN_REFRESHED does not replace the current state.
 });
 const attempt=++bootVersion;
 try{
  const {data,error}=await client.auth.getSession();
  if(attempt!==bootVersion)return;
  if(error)startupFailure(error);
  else if(data.session)await startSession(data.session);
  else {controls();window.hblStartup?.finish("login");showModal(true);window.dispatchEvent(new Event("hbl-cloud-status"));}
 }catch(e){if(attempt===bootVersion)startupFailure(e);}
 window.addEventListener("hbl-profile-changed",controls);
 window.addEventListener("offline",()=>status(paused?"Sync-Problem · offline. Lokale Änderungen prüfen":"Offline · Änderungen bleiben lokal, Verbindung wird benötigt",false,paused?"error":"pending"));
 window.addEventListener("online",()=>void resumeSync());
 window.addEventListener("focus",()=>void resumeSync());
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)void resumeSync();});
 setInterval(()=>{if(!document.hidden)void resumeSync();},45000);
}
async function retryPending(){
  if(!user||retrying||loggingOut)return;
  retrying=true;
  try{
  const session=sessionVersion,changes=changeVersion;
  await queue.catch(()=>{});
  if(session!==sessionVersion||changes!==changeVersion)return;
  if(dirty){
   try{rememberPending(JSON.parse(JSON.stringify(prepDone)));}
   catch(e){return;}
  }
  const pending=getPending();
  if(!pending){status("Keine ausstehenden Änderungen");return;}
  try{
   const {data,error}=await client.from("hbl_dashboard_snapshots").select("revision").eq("user_id",user.id).maybeSingle();
   if(session!==sessionVersion||changes!==changeVersion)return;
   if(error)throw error;
   if(Number(data?.revision||0)!==Number(pending.expectedRevision)){
    status("Konflikt: Cloud wurde geändert. Bitte lokale Daten als JSON exportieren, bevor du neu lädst.",true);return;
   }
   revision=Number(pending.expectedRevision);paused=false;active=true;
   queue=cloudWrite(pending.content);
   await queue;
  }catch(e){status("Erneut speichern fehlgeschlagen: "+e.message,true);}
   }finally{retrying=false;}
}
async function resumeSync(){
 if(!active||loggingOut)return;
 if(dirty||paused){
  await retryPending();
  return;
 }
 try{await checkRemote();}catch(e){status("Abgleich fehlgeschlagen: "+e.message,true);}
}
async function checkRemote(){
 if(!user||!active||dirty||paused)return;
 const session=sessionVersion,changes=changeVersion;
 const {data,error}=await client.from("hbl_dashboard_snapshots").select("revision").eq("user_id",user.id).maybeSingle();
 if(error){status("Abgleich fehlgeschlagen: "+error.message,true);return;}
 if(session!==sessionVersion||changes!==changeVersion||dirty||paused)return;
 const newest=Number(data?.revision||0);
 if(newest>revision){
  const typing=/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||"");
  if(typing)status("Neue Cloud-Daten verfügbar · ↻ Abgleichen",true,"pending");
  else try{await loadRemote();}catch(e){status("Abgleich fehlgeschlagen",true);}
 }else if(!dirty&&!paused)status("Cloud synchronisiert · Stand "+revision+" ✓",false,"synced");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeAuth,{once:true});
else initializeAuth();
})();
