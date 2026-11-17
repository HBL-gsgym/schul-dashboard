/* HBL v5.8 – persönliche Profile und erstmalige Passwortvergabe */
(()=>{
"use strict";
const $=id=>document.getElementById(id);
const client=()=>window.hblCloudClient||null;
const USERNAME=/^[A-Za-z0-9ÄÖÜäöüß][A-Za-z0-9ÄÖÜäöüß ._-]{2,29}$/u;
let forceRecovery=/(?:[?&#])type=recovery(?:[&#]|$)/i.test(location.href);
let activeId=null,profile=null,canEnter=false,isOwner=false,editing=false,checking=false,checkQueued=false,authListener=false,run=0;
function status(msg,good=false){const e=$("hblProfileStatus");if(e){e.textContent=msg||"";e.classList.toggle("ok",good);}}
function mount(){
 const controls=document.querySelector("#hblCloudControls .hbl-cloud-actions");
 if(!controls)return false;
 if(!$("hblProfileButton")){
  const button=document.createElement("button");
  button.type="button";button.id="hblProfileButton";button.hidden=true;
  button.textContent="👤 Profil";button.setAttribute("aria-label","Mein Benutzerprofil bearbeiten");
  button.addEventListener("click",()=>{editing=true;paint();});
  controls.insertBefore(button,controls.firstChild);
 }
 if(!$("hblProfileOverlay")){
  const overlay=document.createElement("div");
  overlay.className="hbl-profile-overlay";overlay.id="hblProfileOverlay";overlay.hidden=true;
  overlay.innerHTML='<section class="hbl-profile-dialog" role="dialog" aria-modal="true" aria-labelledby="hblProfileHeading">'+
   '<div class="hbl-profile-title"><div><h2 id="hblProfileHeading">Willkommen beim Schul-Dashboard!</h2>'+
   '<p id="hblProfileSubtitle"></p></div><button type="button" id="hblProfileClose" aria-label="Schließen">✕</button></div>'+
   '<div id="hblProfileNotApproved" hidden><p>Dieses Konto ist noch nicht für das Schul-Dashboard freigeschaltet. Bitte wende dich an den Hauptadministrator.</p></div>'+
   '<form id="hblProfileForm" autocomplete="off">'+
   '<label for="hblProfileUsername">Dein Benutzername</label>'+
   '<input id="hblProfileUsername" name="username" maxlength="30" minlength="3" required autocomplete="nickname" placeholder="z. B. PhysikBro">'+
   '<p class="hbl-profile-hint">3 bis 30 Zeichen, Buchstaben, Zahlen, Leerzeichen, Punkt, Unterstrich und Bindestrich. Jeder Name ist eindeutig.</p>'+
   '<div class="hbl-password-fields" id="hblProfilePasswordFields" hidden>'+
   '<label for="hblProfilePassword">Dein neues Passwort</label>'+
   '<input id="hblProfilePassword" type="password" autocomplete="new-password" minlength="10" placeholder="Mindestens 10 Zeichen">'+
   '<label for="hblProfileConfirm">Passwort wiederholen</label>'+
   '<input id="hblProfileConfirm" type="password" autocomplete="new-password" minlength="10" placeholder="Passwort bestätigen">'+
   '</div>'+
   '<button type="submit" id="hblProfileSave">Speichern und fortfahren</button>'+
   '</form>'+
   '<p id="hblProfileStatus" role="status"></p>'+
   '<button type="button" id="hblProfileLogout" class="hbl-profile-secondary">Abmelden</button>'+
   '<p class="hbl-profile-footnote">Pilotversion: Bitte keine personenbezogenen Schülerdaten oder vertraulichen Informationen hochladen.</p>'+
   '</section>';
  document.body.appendChild(overlay);
  $("hblProfileClose").onclick=()=>{editing=false;paint();};
  $("hblProfileLogout").onclick=async()=>{
   if(!client())return;
   await client().auth.signOut();location.reload();
  };
  $("hblProfileForm").onsubmit=e=>{e.preventDefault();void saveProfile();};
 }
 return true;
}
function setUser(value){
 const button=$("hblProfileButton");
 if(button)button.hidden=!value;
}
function paint(){
 if(!mount())return;
 const overlay=$("hblProfileOverlay");
 const wasHidden=overlay.hidden;
 if(!activeId){overlay.hidden=true;document.body.classList.remove("hbl-profile-required");setUser(false);return;}
 const needed=canEnter&&(!profile||forceRecovery);
 const blocked=!canEnter;
 const visible=needed||blocked||editing;
 overlay.hidden=!visible;
 document.body.classList.toggle("hbl-profile-required",visible);
 setUser(canEnter);
 if(!visible)return;
 $("hblProfileClose").hidden=needed||blocked;
 $("hblProfileForm").hidden=blocked;
 $("hblProfileNotApproved").hidden=!blocked;
 $("hblProfileUsername").value=profile?.username||$("hblProfileUsername").value||"";
 const mustPassword=canEnter&&((!profile&&!isOwner)||forceRecovery);
 const pw=$("hblProfilePasswordFields");
 pw.hidden=!mustPassword;
 $("hblProfilePassword").required=mustPassword;
 $("hblProfileConfirm").required=mustPassword;
 $("hblProfileHeading").textContent=blocked?"Zugang ausstehend":forceRecovery?"Neues Passwort festlegen":!profile?"Dein Benutzerprofil einrichten":"Mein Benutzerprofil";
 $("hblProfileSubtitle").textContent=blocked?"Nur eingeladene und freigeschaltete Lehrkräfte erhalten Zugang.":
  mustPassword?"Bitte wähle einen Benutzernamen und lege dein eigenes Passwort fest.":
  !profile?"Wähle deinen Benutzernamen für das Dashboard und den Kollegium-Chat.":"Hier kannst du deinen Benutzernamen ändern.";
 $("hblProfileSave").textContent=mustPassword?"Passwort und Profil speichern":!profile?"Profil einrichten":"Benutzername speichern";
 if(visible&&wasHidden)$("hblProfileUsername").focus();
}
async function checkProfile(){
 if(checking){checkQueued=true;return;}
 if(!mount()||!client())return;
 const token=++run;checking=true;
 try{
  const auth=await client().auth.getUser();
  const user=auth.data?.user;
  if(token!==run)return;
  if(auth.error||!user){
   activeId=null;profile=null;canEnter=false;isOwner=false;editing=false;
   paint();return;
  }
  const changed=activeId!==user.id;
  if(changed){activeId=user.id;profile=null;isOwner=false;canEnter=false;editing=false;window.hblCurrentUsername=null;$("hblProfileUsername").value="";}
  const [member,me,role]=await Promise.all([
   client().from("hbl_dashboard_members").select("enabled").eq("user_id",user.id).maybeSingle(),
   client().from("hbl_user_profiles").select("username").eq("user_id",user.id).maybeSingle(),
   client().from("hbl_dashboard_admins").select("is_owner").eq("user_id",user.id).maybeSingle()
  ]);
  if(token!==run||activeId!==user.id)return;
  if(member.error)throw member.error;
  canEnter=member.data?.enabled===true;
  if(canEnter&&me.error)throw me.error;
  if(canEnter&&role.error)throw role.error;
  profile=me.data||null;
  isOwner=!!role.data?.is_owner;
  window.hblCurrentUsername=profile?.username||null;
  paint();
  if(changed)window.dispatchEvent(new Event("hbl-profile-changed"));
 }catch(e){
  status("Profilprüfung fehlgeschlagen: "+e.message);
  console.warn("HBL-Profilprüfung",e.message);
 }finally{checking=false;if(checkQueued){checkQueued=false;setTimeout(()=>void checkProfile(),0);}}
}
async function saveProfile(){
 if(!activeId||!canEnter||!client())return;
 const userId=activeId;
 const name=$("hblProfileUsername").value.trim();
 const first=!profile;
 const needsPassword=(first&&!isOwner)||forceRecovery;
 const p=$("hblProfilePassword").value,c=$("hblProfileConfirm").value;
 if(!USERNAME.test(name)){status("Ungültiger Benutzername. Erlaubt sind 3–30 Zeichen ohne führende Sonderzeichen.");return;}
 if(needsPassword&&(p.length<10||p!==c)){status("Passwörter müssen übereinstimmen und mindestens 10 Zeichen lang sein.");return;}
 const submit=$("hblProfileSave");submit.disabled=true;status("Profil wird gespeichert …");
 try{
  if(needsPassword){
   const {error}=await client().auth.updateUser({password:p});
   if(error)throw error;
  }
  const save=profile
   ?await client().from("hbl_user_profiles").update({username:name,updated_at:new Date().toISOString()}).eq("user_id",userId)
   :await client().from("hbl_user_profiles").insert({user_id:userId,username:name});
  if(save.error)throw save.error;
  if(userId!==activeId)return;
  profile={username:name};forceRecovery=false;editing=false;
  $("hblProfilePassword").value="";$("hblProfileConfirm").value="";
  window.hblCurrentUsername=name;
  window.dispatchEvent(new Event("hbl-profile-changed"));
  status("Profil gespeichert ✓",true);
  paint();
 }catch(e){
  const msg=e.code==="23505"?"Dieser Benutzername ist bereits vergeben. Bitte wähle einen anderen.":e.message;
  status("Speichern fehlgeschlagen: "+msg);
 }finally{submit.disabled=false;}
}
function init(){
 if(!mount())return;
 const cl=client();
 if(cl&&!authListener){
  authListener=true;
  cl.auth.onAuthStateChange((event,session)=>{
   if(event==="PASSWORD_RECOVERY")forceRecovery=true;
   if(["SIGNED_IN","SIGNED_OUT","PASSWORD_RECOVERY","INITIAL_SESSION"].includes(event)){
    setTimeout(()=>void checkProfile(),0);
   }
  });
 }
 window.addEventListener("hbl-cloud-status",()=>void checkProfile());
 window.addEventListener("hbl-profile-changed",()=>{if(activeId)void checkProfile();});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)void checkProfile();});
 void checkProfile();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();