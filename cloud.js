/* HBL Cloud Sync v4.0: anonymous demo only; each user owns one RLS-protected snapshot. */
(() => {
"use strict";
const URL="https://lmadidvmmwxcbytokoys.supabase.co";
const KEY="sb_publishable_3CWYEt1PpG7t8ur4IA4uiw_nTPtA7e5";
const PAGE="https://hbl-gsgym.github.io/schul-dashboard/";
const el=(id)=>document.getElementById(id);
let client=null,user=null,revision=0,active=false,paused=false,dirty=false,queue=Promise.resolve(),lastError="";
const originalSave=window.savePrepFile;
function userKey(){return user ? "hbl-cloud-pending-"+user.id : "";}
function validDemoData(data){return data&&typeof data==="object"&&!Array.isArray(data);}
function status(message,issue=false){
 const badge=el("hblCloudState");
 if(badge){badge.textContent=message;badge.style.color=issue?"#ffc387":"";}
 if(active && typeof prepStatus==="function")prepStatus(message,issue);
 if(active && typeof setParticipationStatus==="function")setParticipationStatus(message,issue);
}
function showModal(open=true){
 const modal=el("hblCloudModal");if(!modal)return;
 modal.hidden=!open;
 if(open){setTimeout(()=>el("hblCloudEmail")?.focus(),20);}
}
function message(value,error=false){
 const box=el("hblCloudMessage");if(box){box.textContent=value;box.style.color=error?"#c2410c":"";}
}
function controls(){
 const panel=el("hblCloudControls");if(!panel)return;
 const signed=!!user;
 el("hblCloudAccount").textContent=signed ? ("Angemeldet: "+user.email) : "Nur lokal · Testmodus";
 el("hblCloudLogin").hidden=signed;
 el("hblCloudLogout").hidden=!signed;
 el("hblCloudRefresh").hidden=!signed;
 el("hblCloudRetry").hidden=!signed;
 el("hblCloudImport").hidden=!signed;
 if(!signed)status("Lokale Testdaten · nicht synchronisiert");
}
function rememberPending(snapshot){
 try{localStorage.setItem(userKey(),JSON.stringify({content:snapshot,expectedRevision:revision,at:Date.now()}));}catch(e){}
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
 const {data,error}=await client.from("hbl_dashboard_snapshots").select("content,revision").eq("user_id",user.id).maybeSingle();
 if(error)throw error;
 const content=data?.content||{};
 if(!validDemoData(content))throw Error("Ungültige Daten in der Cloud.");
 if(force && (dirty||getPending()) && !confirm("Ungesicherte Änderungen auf diesem Gerät werden verworfen. Wirklich Cloud-Version laden?"))return;
 revision=Number(data?.revision||0);
 active=true;paused=false;dirty=false;clearPending();
 applyPrepData(content);
 if(typeof initializeParticipationRoster==="function" && currentParticipationCourse)initializeParticipationRoster();
 status("Cloud synchronisiert · Stand "+revision+" ✓");
 controls();
}
async function cloudWrite(snapshot){
 if(!active||!client||!user)throw Error("Nicht angemeldet");
 if(paused)throw Error("Cloud-Synchronisierung pausiert. Bitte Konflikt lösen.");
 const {data,error}=await client.rpc("hbl_save_snapshot",{p_content:snapshot,p_expected_revision:revision});
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
 status("Cloud synchronisiert · Stand "+revision+" ✓");
}
window.savePrepFile=function(){
 if(!active)return originalSave();
 const snapshot=JSON.parse(JSON.stringify(prepDone));
 dirty=true;rememberPending(snapshot);
 status("Speichert in der Cloud …");
 queue=queue.catch(()=>{}).then(()=>cloudWrite(snapshot));
 return queue;
};
async function startSession(session){
 user=session?.user||null;
 if(!user){active=false;paused=false;dirty=false;revision=0;controls();return;}
 controls();
 try{
  const pending=getPending();
  if(pending){
   paused=true;dirty=true;
   message("Auf diesem Gerät gibt es ungesicherte Cloud-Änderungen. Lade sie nicht ungeprüft neu.");
   status("Lokale Änderungen vorhanden – bitte prüfen",true);
   return;
  }
  const membership=await client.from("hbl_dashboard_members").select("enabled").eq("user_id",user.id).maybeSingle();
  if(membership.error)throw membership.error;
  if(!membership.data?.enabled){
   active=false;
   status("Konto nicht freigeschaltet – bitte Administrator kontaktieren",true);
   showModal(false);
   window.dispatchEvent(new Event("hbl-cloud-status"));
   return;
  }
  await loadRemote();
  showModal(false);
  window.dispatchEvent(new Event("hbl-cloud-status"));
 }catch(e){status("Cloud-Laden fehlgeschlagen: "+e.message,true);message(e.message,true);}
}
async function initializeAuth(){
 const modal=document.createElement("div");
 modal.id="hblCloudModal";modal.className="hbl-cloud-overlay";modal.hidden=true;
 modal.innerHTML='<section class="hbl-cloud-dialog" role="dialog" aria-modal="true" aria-label="Cloud-Anmeldung"><button type="button" id="hblCloudClose" class="hbl-cloud-close" aria-label="Schließen">✕</button><h2>☁️ Dashboard-Anmeldung</h2><p>Der Zugang ist nur mit persönlicher Einladung möglich. Melde dich mit E-Mail-Adresse und Passwort an.</p><form id="hblCloudForm"><label>E-Mail<input id="hblCloudEmail" type="email" autocomplete="email" required></label><label>Passwort<input id="hblCloudPassword" type="password" autocomplete="current-password" minlength="8" required></label><div class="hbl-cloud-actions"><button type="submit">Anmelden</button></div></form><p id="hblCloudMessage" role="status"></p><small>Du hast noch keinen Zugang? Bitte den Hauptadministrator um eine persönliche Einladung. Keine echten Schülerdaten in dieser Pilotversion speichern.</small></section>';
 const bar=document.createElement("section");
 bar.className="hbl-cloud-bar";bar.id="hblCloudControls";
 bar.innerHTML='<div class="hbl-cloud-label">☁ <strong id="hblCloudAccount">Nur lokal · Testmodus</strong><span id="hblCloudState">Laden …</span></div><div class="hbl-cloud-actions"><button id="hblCloudLogin">Anmelden</button><button id="hblCloudRefresh" hidden>↻ Abgleichen</button><button id="hblCloudRetry" hidden>↥ Erneut speichern</button><button id="hblCloudImport" hidden>Testdaten übertragen</button><button id="hblCloudLogout" hidden>Abmelden</button></div>';
 document.body.prepend(bar);
 document.body.appendChild(modal);
 el("hblCloudClose").onclick=()=>showModal(false);
 modal.onclick=e=>{if(e.target===modal)showModal(false)};
 el("hblCloudLogin").onclick=()=>showModal(true);
 el("hblCloudForm").onsubmit=async e=>{
  e.preventDefault();
  if(!client)return message("Supabase-Anmeldung konnte nicht geladen werden.",true);
  message("Anmeldung läuft …");
  const {data,error}=await client.auth.signInWithPassword({email:el("hblCloudEmail").value.trim(),password:el("hblCloudPassword").value});
  if(error)message(error.message,true);else {message("Angemeldet ✓");await startSession(data.session);}
 };
 el("hblCloudLogout").onclick=async()=>{
  if(dirty||getPending()){if(!confirm("Auf diesem Gerät liegen ungesicherte Änderungen. Wirklich abmelden?"))return;}
  if(typeof window.hblPushOnLogout==="function")await window.hblPushOnLogout();
  await client.auth.signOut();
  user=null;active=false;paused=false;revision=0;dirty=false;
  location.reload();
 };
 el("hblCloudRefresh").onclick=async()=>{
  try{await loadRemote({force:true});}catch(e){status("Abgleich fehlgeschlagen: "+e.message,true);}
 };
 el("hblCloudRetry").onclick=async()=>{
  if(!user)return;
  const pending=getPending();
  if(!pending){status("Keine ausstehenden Änderungen");return;}
  try{
   const {data,error}=await client.from("hbl_dashboard_snapshots").select("revision").eq("user_id",user.id).maybeSingle();
   if(error)throw error;
   if(Number(data?.revision||0)!==Number(pending.expectedRevision)){
    status("Konflikt: Cloud wurde geändert. Bitte lokale Daten als JSON exportieren, bevor du neu lädst.",true);return;
   }
   revision=Number(pending.expectedRevision);paused=false;active=true;
   await cloudWrite(pending.content);
   applyPrepData(pending.content);
  }catch(e){status("Erneut speichern fehlgeschlagen: "+e.message,true);}
 };
 el("hblCloudImport").onclick=async()=>{
  if(!active||paused)return;
  let saved;
  try{saved=JSON.parse(localStorage.getItem("hbl-github-pages-demo-v1")||"{}");}catch(e){return alert("Lokale Daten unlesbar");}
  if(!validDemoData(saved))return;
  if(!confirm("NUR FÜR ANONYMISIERTE TESTDATEN! Alle lokal gespeicherten Demo-Daten dieses Browsers in dein Cloud-Konto übertragen? Vorhandene Cloud-Daten werden ersetzt. Keine echten Schülernamen/Noten hochladen!"))return;
  try{await cloudWrite(saved);applyPrepData(saved);}
  catch(e){status("Übernahme fehlgeschlagen: "+e.message,true);}
 };
 if(!window.supabase?.createClient){status("Cloud-Bibliothek nicht geladen – bitte Seite neu öffnen",true);return;}
 client=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 window.hblCloudClient=client;
 window.hblCloudUser=()=>user;
 client.auth.onAuthStateChange((event,session)=>{
  if(event==="SIGNED_OUT"){user=null;active=false;controls();window.dispatchEvent(new Event("hbl-cloud-status"));}
  if(event==="SIGNED_IN"&&session?.user&&session.user.id!==user?.id){
   setTimeout(()=>{if(session?.user&&session.user.id!==user?.id)void startSession(session);},0);
  }
  // TOKEN_REFRESHED does not replace the current state.
 });
 const {data,error}=await client.auth.getSession();
 if(error)status("Anmeldung konnte nicht gelesen werden: "+error.message,true);
 else if(data.session)await startSession(data.session);
 else {controls();window.dispatchEvent(new Event("hbl-cloud-status"));}
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&active&&!dirty&&!paused)checkRemote();});
 setInterval(()=>{if(!document.hidden&&active&&!dirty&&!paused)checkRemote();},45000);
}
async function checkRemote(){
 if(!user||!active||dirty||paused)return;
 const {data,error}=await client.from("hbl_dashboard_snapshots").select("revision").eq("user_id",user.id).maybeSingle();
 if(error)return;
 const newest=Number(data?.revision||0);
 if(newest>revision){
  const typing=/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName||"");
  if(typing)status("Neue Cloud-Daten verfügbar · ↻ Abgleichen",true);
  else try{await loadRemote();}catch(e){status("Abgleich fehlgeschlagen",true);}
 }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initializeAuth,{once:true});
else initializeAuth();
})();