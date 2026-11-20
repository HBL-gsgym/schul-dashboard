/* HBL v5.6 – Schulveranstaltungen, Blockzählung, Benutzerverwaltung, Link-Zentrale */
(function(){
"use strict";
const safe = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const EVENTS_TABLE="hbl_school_events",ROLES_TABLE="hbl_dashboard_admins";
let events=[],isAdmin=false,isOwner=false,loadedUser=null,busy=false,lastEvents=null;
let linkCategory="orga",adminUsers=[],adminOpen=false,linkWorking=false;
const categories=[
 {id:"orga",label:"Organisation",icon:"🏫"},
 {id:"ki",label:"KI",icon:"✨"},
 {id:"tools",label:"Digi-Tools",icon:"🧩"},
 {id:"material",label:"Materialien",icon:"📚"}
];
const defaults={
 orga:[
  ["mein.gsgym.de","https://mein.gsgym.de/","🏫"],
  ["Schulportal Brandenburg","https://schulportal.brandenburg.de/","🗂️"],
  ["pCloud","https://my.pcloud.com/#/login","☁️"]
 ],
 ki:[
  ["ChatGPT","https://chatgpt.com/","✨"],
  ["Perplexity","https://www.perplexity.ai/","🔎"],
  ["NotebookLM","https://notebooklm.google.com/","📚"]
 ],
 tools:[
  ["Plickers","https://www.plickers.com/","📊"],
  ["TaskCards","https://www.taskcards.de/","🧩"],
  ["Kahoot","https://kahoot.com/","🎯"],
  ["Miro","https://miro.com/login","🧠"]
 ],
 material:[
  ["Cornelsen","https://mein.cornelsen.de/bibliothek","📘"],
  ["Klett","https://www.klett.de/meinklett","📗"],
  ["bettermarks","https://www.bettermarks.com/","➗"],
  ["LEIFIphysik","https://www.leifiphysik.de/","⚛️"]
 ]
};
const byId=id=>document.getElementById(id);
const client=()=>window.hblCloudClient||null;
const user=()=>typeof window.hblCloudUser==="function"?window.hblCloudUser():null;
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");};
const asDate=d=>new Date(String(d)+"T12:00:00");
const dateLabel=d=>asDate(d).toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
const knownEvent=(item,date)=>item&&date>=item.starts_on&&date<=item.ends_on;
window.hblSchoolEventsForDate=function(date){return events.filter(e=>knownEvent(e,date));};
window.hblCancelled=function(date,block){
 return events.some(e=>knownEvent(e,date)&&(e.cancellation_mode==="all"||
  (e.cancellation_mode==="blocks"&&Array.isArray(e.cancelled_blocks)&&e.cancelled_blocks.includes(Number(block)))));
};
window.hblFullDayCancelled=function(date){
 return [1,2,3,4].every(block=>window.hblCancelled(date,block));
};
window.hblCourseProgress=function(id){
 const sessions=typeof window.hblPlannedSlots==="function"?window.hblPlannedSlots(id):[];
 const now=new Date(),current=today(),clock=now.getHours()*60+now.getMinutes();
 const past=sessions.filter(s=>{
  if(s.date<current)return true;
  if(s.date>current)return false;
  const end=(typeof BLOCKS!=="undefined"?BLOCKS[s.block-1]?.end:null)||"";
  if(!end)return false;
  const p=end.split(":").map(Number);
  return p[0]*60+p[1]<=clock;
 }).length;
 return {total:sessions.length,past,remaining:sessions.length-past};
};
function refreshViews(){
 if(byId("schoolDots"))renderSchoolCalendar();
 if(byId("currentWeekPrep"))renderPreparationWeeks();
 if(byId("todayLessons"))renderToday();
 if(byId("participationOverview"))renderParticipationOverview();
 if(typeof window.hblScheduleAfterLoad==="function"&&user()){
  window.hblScheduleAfterLoad(); // Reconcile auto terms; marks remain archived/preserved.
 }
 if(byId("participationTableHost")&&typeof renderParticipationTable==="function")renderParticipationTable();
}
async function loadEvents(force){
 const logged=user(),sb=client();
 if(!logged||!sb)return;
 if(busy)return;
 if(!force&&lastEvents&&Date.now()-lastEvents<25000)return;
 busy=true;
 try{
  const {data,error}=await sb.from(EVENTS_TABLE)
   .select("id,title,starts_on,ends_on,starts_at,description,cancellation_mode,cancelled_blocks")
   .order("starts_on",{ascending:true}).limit(500);
  if(error)throw error;
  const previous=JSON.stringify(events);
  events=data||[];lastEvents=Date.now();
  if(previous!==JSON.stringify(events))refreshViews();
  else if(byId("schoolDots"))renderSchoolCalendar();
  const state=byId("hblEventStatus");if(state)state.textContent="";
 }catch(e){
  const state=byId("hblEventStatus");if(state)state.textContent="Schultermine konnten nicht geladen werden: "+e.message;
 }finally{busy=false;}
}
async function loadRole(){
 const logged=user(),sb=client();
 if(!logged||!sb){isAdmin=false;isOwner=false;return;}
 const {data,error}=await sb.from(ROLES_TABLE).select("is_owner").eq("user_id",logged.id).maybeSingle();
 if(error){isAdmin=false;isOwner=false;return;}
 isAdmin=!!data;isOwner=!!data?.is_owner;
 if(byId("schoolDots"))renderSchoolCalendar();
}
async function refreshSession(){
 const logged=user();
 if(!logged){
  if(loadedUser){events=[];loadedUser=null;lastEvents=null;isAdmin=false;isOwner=false;refreshViews();}
  return;
 }
 if(logged.id!==loadedUser){
  loadedUser=logged.id;
  events=[];lastEvents=null;
  await Promise.all([loadRole(),loadEvents(true)]);
 }else await loadEvents();
}
const linkExtras=()=>Array.isArray(prepDone?.__linksV1)?prepDone.__linksV1.filter(x=>x&&categories.some(c=>c.id===x.category)&&/^https?:\/\//i.test(x.url||"")):[];
function categoryLinks(id){
 return [
  ...(defaults[id]||[]).map((x,i)=>({id:"default-"+id+"-"+i,title:x[0],url:x[1],icon:x[2],custom:false})),
  ...linkExtras().filter(x=>x.category===id).map(x=>({...x,icon:"🔗",custom:true}))
 ];
}
function renderLinks(){
 const root=byId("hblLinksRoot");if(!root)return;
 const group=categories.find(c=>c.id===linkCategory)||categories[0],links=categoryLinks(group.id);
 root.innerHTML='<div class="hbl-links-tabs" role="tablist" aria-label="Link-Kategorien">'+
  categories.map(c=>'<button type="button" role="tab" aria-selected="'+(group.id===c.id)+'" class="hbl-links-tab '+(group.id===c.id?"active":"")+'" data-cat="'+c.id+'"><span>'+c.icon+'</span><span>'+safe(c.label)+'</span></button>').join("")+
 '</div><div class="hbl-links-list">'+links.map(x=>
  '<div class="hbl-links-row"><a href="'+safe(x.url)+'" target="_blank" rel="noopener noreferrer"><span class="hbl-links-emoji">'+x.icon+'</span><span>'+safe(x.title)+'</span><span class="hbl-links-arrow">↗</span></a>'+
  (x.custom?'<button type="button" class="hbl-link-delete" aria-label="Link entfernen: '+safe(x.title)+'" data-remove="'+safe(x.id)+'">✕</button>':"")+
  '</div>').join("")+'</div>'+
 '<div class="hbl-links-actions"><button type="button" id="hblLinksAdd">+ Link hinzufügen</button><button type="button" id="hblLinksOpenAll">Alle dieser Kategorie öffnen ↗</button></div>'+
 '<form class="hbl-links-form" id="hblLinksForm" hidden><label>Bezeichnung<input id="hblLinkName" maxlength="80" required placeholder="z. B. Schulbuchverlag"></label>'+
 '<label>Adresse (https://...)<input id="hblLinkUrl" type="url" maxlength="500" required placeholder="https://..."></label>'+
 '<div><button type="submit">Speichern</button><button type="button" id="hblLinksCancel">Abbrechen</button></div></form>'+
 '<p id="hblLinksStatus" class="hbl-links-status" role="status"></p>';
 root.querySelectorAll("[data-cat]").forEach(button=>button.addEventListener("click",()=>{linkCategory=button.dataset.cat;renderLinks();}));
 root.querySelectorAll("[data-remove]").forEach(button=>button.addEventListener("click",()=>void removeLink(button.dataset.remove)));
 byId("hblLinksAdd").onclick=()=>{
  byId("hblLinksForm").hidden=false;byId("hblLinkName").focus();
 };
 byId("hblLinksCancel").onclick=()=>{byId("hblLinksForm").hidden=true;};
 byId("hblLinksOpenAll").onclick=()=>{
  const links=categoryLinks(linkCategory);
  const tabs=links.map(()=>window.open("about:blank","_blank"));
  tabs.forEach((tab,i)=>{if(tab){try{tab.opener=null;}catch(_){ }tab.location.href=links[i].url;}});
  if(tabs.filter(Boolean).length<links.length)alert("Dein Browser blockiert zusätzliche Tabs.");
 };
 byId("hblLinksForm").onsubmit=e=>{e.preventDefault();void addLink();};
}
async function addLink(){
 const title=byId("hblLinkName")?.value.trim(),input=byId("hblLinkUrl")?.value.trim();
 try{
  if(!title||title.length>80||!input)throw Error("Titel und Adresse fehlen.");
  const url=new URL(input);
  if(!["https:","http:"].includes(url.protocol)||!url.hostname)throw Error("Nur http(s)-Adressen erlaubt.");
  if(!serverReady)throw Error("Speicherung noch nicht bereit.");
  const previous=Array.isArray(prepDone.__linksV1)?prepDone.__linksV1.slice():[];
  if(previous.length>=100)throw Error("Maximal 100 eigene Links.");
  const id="l"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  prepDone.__linksV1=[...previous,{id,category:linkCategory,title,url:url.href.slice(0,500)}];
  try{await savePrepFile();renderLinks();}
  catch(e){prepDone.__linksV1=previous;throw e;}
 }catch(e){const p=byId("hblLinksStatus");if(p)p.textContent=e.message;}
}
async function removeLink(id){
 const previous=Array.isArray(prepDone.__linksV1)?prepDone.__linksV1.slice():[];
 const item=previous.find(x=>x.id===id);
 if(!item||!confirm('Link „'+item.title+'“ entfernen?'))return;
 prepDone.__linksV1=previous.filter(x=>x.id!==id);
 try{await savePrepFile();renderLinks();}
 catch(e){prepDone.__linksV1=previous;renderLinks();byId("hblLinksStatus").textContent=e.message;}
}
window.hblAfterPrepLoad=function(){renderLinks();};
window.hblDecorateSchoolMilestones=function(aside,year){
 if(!aside)return;
 const ownYear=events.filter(e=>e.ends_on>=year.start&&e.starts_on<=year.end);
 const day=today();
 const section=document.createElement("section");
 section.className="hbl-school-events";
 section.innerHTML='<div class="hbl-school-events-head"><strong>Schulveranstaltungen</strong>'+
 (isAdmin?'<button type="button" id="hblEventAdd" title="Veranstaltung hinzufügen">+ Termin</button>':'')+
 '</div><p class="hbl-event-status" id="hblEventStatus"></p>'+
 '<div class="hbl-school-event-list">'+(ownYear.length?ownYear.map(e=>{
  const past=e.ends_on<day;
  const range=e.starts_on===e.ends_on?dateLabel(e.starts_on):dateLabel(e.starts_on)+" – "+dateLabel(e.ends_on);
  const mode=e.cancellation_mode==="all"?" · ganztägig Unterrichtsausfall":e.cancellation_mode==="blocks"?" · Ausfall Block "+(e.cancelled_blocks||[]).join(", "):"";
  const content='<strong>'+safe(e.title)+'</strong><small>'+safe(range)+(e.starts_at?" · "+String(e.starts_at).slice(0,5)+" Uhr":"")+safe(mode)+'</small>';
  return '<div class="hbl-school-event '+(past?"hbl-event-past":"")+'" title="'+safe(e.description||e.title)+'">'+
    (isAdmin?'<button type="button" data-edit-event="'+safe(e.id)+'" class="hbl-school-event-button">'+content+'</button>':'<div class="hbl-school-event-text">'+content+'</div>')+
   '</div>';
 }).join(""):'<p class="hbl-school-events-empty">Für gemeinsame Schultermine bitte anmelden oder als Administrator Termine hinzufügen.</p>')+'</div>'+
 (isOwner?'<button type="button" id="hblAdminOpen" class="hbl-admin-launch">⚙ Benutzer verwalten</button>':'');
 aside.appendChild(section);
 byId("hblEventAdd")?.addEventListener("click",()=>openEventEditor());
 section.querySelectorAll("[data-edit-event]").forEach(x=>x.addEventListener("click",()=>openEventEditor(x.dataset.editEvent)));
 byId("hblAdminOpen")?.addEventListener("click",()=>void openAdminUsers());
};
function mountEventEditor(){
 let el=byId("hblEventOverlay");if(el)return el;
 el=document.createElement("div");el.id="hblEventOverlay";el.className="hbl-v56-overlay";el.hidden=true;
 el.innerHTML='<div class="hbl-v56-dialog" role="dialog" aria-modal="true" aria-labelledby="hblEventDialogTitle">'+
 '<button type="button" class="hbl-v56-close" id="hblEventClose" aria-label="Schließen">✕</button>'+
 '<h2 id="hblEventDialogTitle">Schulveranstaltung</h2>'+
 '<form id="hblEventForm"><label>Veranstaltung<input id="hblEventTitle" maxlength="120" required placeholder="z. B. Projekttag"></label>'+
 '<div class="hbl-v56-two"><label>Von<input type="date" id="hblEventStart" required></label><label>Bis<input type="date" id="hblEventEnd" required></label></div>'+
 '<label>Uhrzeit (optional)<input type="time" id="hblEventTime"></label>'+
 '<label>Beschreibung (optional)<textarea id="hblEventDesc" maxlength="800" rows="3"></textarea></label>'+
 '<label>Unterrichtsausfall<select id="hblEventCancel"><option value="none">Kein Unterrichtsausfall</option>'+
 '<option value="all">Ganztägig – alle Blöcke</option><option value="blocks">Teilweise – Blöcke auswählen</option></select></label>'+
 '<fieldset id="hblEventBlockWrap" hidden><legend>Diese Blöcke entfallen</legend>'+
 [1,2,3,4].map(n=>'<label class="hbl-v56-block"><input type="checkbox" value="'+n+'"> '+n+'. Block</label>').join("")+'</fieldset>'+
 '<p class="hbl-v56-note">Ausfallende Blöcke werden bei allen Lehrkräften aus Mitarbeit, Vorbereitung und Restzählung entfernt. Bereits bewertete Termine bleiben erhalten.</p>'+
 '<p id="hblEventFormStatus" role="status"></p>'+
 '<div class="hbl-v56-form-actions"><button type="submit" class="primary">Speichern</button><button type="button" id="hblEventDelete" class="danger">Löschen</button><button type="button" id="hblEventCancelForm">Abbrechen</button></div></form></div>';
 document.body.appendChild(el);
 const close=()=>{el.hidden=true;el.dataset.editId="";};
 byId("hblEventClose").onclick=close;
 byId("hblEventCancelForm").onclick=close;
 el.addEventListener("click",e=>{if(e.target===el)close();});
 el.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 byId("hblEventCancel").addEventListener("change",()=>{
  byId("hblEventBlockWrap").hidden=byId("hblEventCancel").value!=="blocks";
 });
 byId("hblEventForm").onsubmit=e=>{e.preventDefault();void saveEvent(false);};
 byId("hblEventDelete").onclick=()=>void saveEvent(true);
 return el;
}
function openEventEditor(id){
 if(!isAdmin)return;
 const el=mountEventEditor(),item=events.find(x=>x.id===id);
 el.dataset.editId=item?.id||"";
 byId("hblEventDialogTitle").textContent=item?"Veranstaltung bearbeiten":"Neue Schulveranstaltung";
 byId("hblEventTitle").value=item?.title||"";
 byId("hblEventStart").value=item?.starts_on||today();
 byId("hblEventEnd").value=item?.ends_on||today();
 byId("hblEventTime").value=item?.starts_at?String(item.starts_at).slice(0,5):"";
 byId("hblEventDesc").value=item?.description||"";
 byId("hblEventCancel").value=item?.cancellation_mode||"none";
 byId("hblEventBlockWrap").hidden=byId("hblEventCancel").value!=="blocks";
 el.querySelectorAll('#hblEventBlockWrap input[type="checkbox"]').forEach(input=>{
  input.checked=!!item?.cancelled_blocks?.includes(Number(input.value));
 });
 byId("hblEventFormStatus").textContent="";
 byId("hblEventDelete").hidden=!item;
 el.hidden=false;byId("hblEventTitle").focus();
}
async function saveEvent(remove){
 const el=byId("hblEventOverlay"),sb=client(),person=user();
 if(!el||!sb||!person||!isAdmin)return;
 const id=el.dataset.editId;
 const status=byId("hblEventFormStatus");
 if(remove&&(!id||!confirm("Diese Veranstaltung für alle Lehrkräfte löschen?")))return;
 const title=byId("hblEventTitle").value.trim();
 const start=byId("hblEventStart").value,end=byId("hblEventEnd").value;
 const mode=byId("hblEventCancel").value;
 const blocks=[...el.querySelectorAll('#hblEventBlockWrap input[type="checkbox"]:checked')].map(x=>Number(x.value));
 if(!remove){
  if(!title||!start||!end||end<start){status.textContent="Titel und gültigen Zeitraum angeben.";return;}
  const days=(asDate(end)-asDate(start))/86400000;
  if(days>60){status.textContent="Ein Zeitraum darf höchstens 61 Kalendertage umfassen.";return;}
  if(mode==="blocks"&&!blocks.length){status.textContent="Bitte mindestens einen ausfallenden Block auswählen.";return;}
 }
 status.textContent="Speichert …";
 const payload={
  title,starts_on:start,ends_on:end,starts_at:byId("hblEventTime").value||null,
  description:byId("hblEventDesc").value.trim(),
  cancellation_mode:mode,cancelled_blocks:mode==="blocks"?blocks:[]
 };
 try{
  let result;
  if(remove)result=await sb.from(EVENTS_TABLE).delete().eq("id",id);
  else if(id)result=await sb.from(EVENTS_TABLE).update({...payload,updated_at:new Date().toISOString()}).eq("id",id);
  else result=await sb.from(EVENTS_TABLE).insert({...payload,created_by:person.id});
  if(result.error)throw result.error;
  el.hidden=true;
  await loadEvents(true);
 }catch(e){status.textContent="Fehler beim Speichern: "+e.message;}
}
async function openAdminUsers(){
 if(!isOwner)return;
 let overlay=byId("hblAdminsOverlay");
 if(!overlay){
  overlay=document.createElement("div");overlay.id="hblAdminsOverlay";overlay.className="hbl-v56-overlay";overlay.hidden=true;
  overlay.innerHTML='<div class="hbl-v56-dialog" role="dialog" aria-modal="true" aria-labelledby="hblAdminsTitle">'+
   '<button type="button" id="hblAdminsClose" class="hbl-v56-close" aria-label="Schließen">✕</button>'+
   '<h2 id="hblAdminsTitle">Benutzer- und Chatverwaltung</h2>'+
   '<p class="hbl-v56-note">Registrierte Lehrkräfte erhalten hier getrennte Rechte für den Schulkalender und den Kollegium-Chat. Nur du kannst diese Freigaben ändern.</p>'+
   '<section class="hbl-invite-box"><h3>Kollegen einladen</h3>'+
    '<p>Den persönlichen Einladungslink verschickst du über dein normales E-Mail-Programm.</p>'+
    '<form id="hblInviteForm"><label for="hblInviteEmail">E-Mail-Adresse</label>'+
    '<div class="hbl-invite-controls"><input id="hblInviteEmail" type="email" maxlength="254" autocomplete="off" placeholder="kollege@schule.de" required>'+
    '<button type="submit" id="hblInviteGenerate">Einladungslink erzeugen</button></div></form>'+
    '<div id="hblInviteResult" hidden><label for="hblInviteLink">Persönlicher Link – nur an die genannte Person senden</label>'+
    '<textarea id="hblInviteLink" readonly rows="3"></textarea><button type="button" id="hblInviteCopy">Link kopieren</button></div>'+
    '<p id="hblInviteStatus" role="status"></p></section>'+
    '<div id="hblAdminsList">Lädt …</div><p id="hblAdminsStatus" role="status"></p></div>';
  document.body.appendChild(overlay);
  byId("hblAdminsClose").onclick=()=>overlay.hidden=true;
   byId("hblInviteForm").onsubmit=e=>{e.preventDefault();void makeManualLink("invite",byId("hblInviteEmail").value.trim());};
   byId("hblInviteCopy").onclick=async()=>{
    const link=byId("hblInviteLink").value;
    if(!link)return;
    try{await navigator.clipboard.writeText(link);byId("hblInviteStatus").textContent="Link kopiert – persönlich weiterleiten.";}
    catch(e){byId("hblInviteLink").focus();byId("hblInviteLink").select();byId("hblInviteStatus").textContent="Link markieren und mit Strg+C kopieren.";}
   };
  overlay.addEventListener("click",e=>{if(e.target===overlay)overlay.hidden=true;});
 }
 overlay.hidden=false;await reloadAdminUsers();
}
async function makeManualLink(action,emailOrUser){
 if(linkWorking)return;
 linkWorking=true;
 const status=byId("hblInviteStatus"),result=byId("hblInviteResult"),button=byId("hblInviteGenerate");
 if(!status||!result){linkWorking=false;return;}
 status.textContent="Link wird erzeugt …";result.hidden=true;byId("hblInviteLink").value="";
 if(button)button.disabled=true;
 try{
  const data=await callAdmin(action==="invite"?{action:"invite",email:emailOrUser}:{action,user_id:emailOrUser});
  if(!data?.action_link)throw Error("Kein Link vom Server erhalten.");
  byId("hblInviteLink").value=data.action_link;result.hidden=false;
  status.textContent=(action==="renew_invite"?"Einladung erneuert für ":action==="invite"?"Einladung erstellt für ":"Passwort-Link erstellt für ")+data.email+". Nur persönlich weiterleiten. "+(data.expiry_notice||"Einmalig nutzbar; Gültigkeit gemäß Supabase-Auth-Konfiguration.");
  await reloadAdminUsers();
 }catch(e){status.textContent="Fehler: "+e.message;}
 finally{linkWorking=false;if(button)button.disabled=false;}
}
async function callAdmin(body){
 const sb=client();
 if(!sb)throw Error("Bitte anmelden.");
 const {data,error}=await sb.functions.invoke("hbl-admin-users",{body});
 if(error){
  let detail=data?.error;
  try{const body=await error.context?.json();if(typeof body?.error==="string")detail=body.error;}catch(_){}
  throw new Error(detail||"Anfrage fehlgeschlagen. Bitte Anmeldung und Verbindung prüfen.");
 }
 if(data?.error)throw new Error(data.error);
 return data;
}
async function reloadAdminUsers(){
 const root=byId("hblAdminsList"),status=byId("hblAdminsStatus");
 if(!root)return;
 root.textContent="Lädt Benutzerkonten …";status.textContent="";
 try{
  const data=await callAdmin({action:"list"});
  adminUsers=data.users||[];
  root.innerHTML=adminUsers.map(u=>
    '<div class="hbl-admin-person"><div><strong>'+safe(u.username||u.email)+'</strong>'+
     (u.username?'<small>'+safe(u.email)+'</small>':'')+
     '<small>'+(u.is_owner?"Hauptadministrator":u.is_admin?"Kalenderadministrator":"Lehrkraft")+
     ' · '+(u.is_chat?"Chat freigegeben":"Chat gesperrt")+
     ' · '+(u.is_member?"Zugang aktiv":"Zugang gesperrt")+
     ' · '+(u.confirmed_at?"Konto aktiviert":u.invited_at?"Einladung ausstehend":"Nicht aktiviert")+'</small></div>'+
     '<div class="hbl-admin-person-buttons">'+
     (u.is_owner?'<span class="hbl-admin-owner-label">Kalender: Hauptadmin</span>':
       '<button type="button" data-user="'+safe(u.id)+'" data-next="'+(!u.is_admin)+'">'+
       (u.is_admin?"Adminrechte entziehen":"Kalenderadmin vergeben")+'</button>')+
     (u.is_owner?'<span class="hbl-admin-owner-label">Chat: freigegeben</span>':
       '<button type="button" data-chat-user="'+safe(u.id)+'" data-chat-next="'+(!u.is_chat)+'">'+
       (u.is_chat?"Chat-Zugang entziehen":"Chat freigeben")+'</button>')+
     (u.is_owner?'<span class="hbl-admin-owner-label">Konto geschützt</span>':
       '<button type="button" data-access-user="'+safe(u.id)+'" data-access-next="'+(!u.is_member)+'">'+
       (u.is_member?"Zugang sperren":"Zugang freigeben")+'</button>'+
       '<button type="button" data-delete-user="'+safe(u.id)+'" class="hbl-admin-delete">Endgültig löschen</button>')+
     (u.is_member?'<button type="button" data-recovery-user="'+safe(u.id)+'" data-link-action="'+(u.confirmed_at?'recovery':'renew_invite')+'">'+(u.confirmed_at?'Passwort-Link':'Einladungslink erneuern')+'</button>':'')+
     '</div></div>'
   ).join("")||"<p>Keine Konten vorhanden.</p>";
  root.querySelectorAll("[data-user]").forEach(button=>button.onclick=async()=>{
   const item=adminUsers.find(u=>u.id===button.dataset.user),next=button.dataset.next==="true";
   if(!item||!confirm((next?"Kalender-Administratorrechte erteilen: ":"Kalender-Administratorrechte entziehen: ")+item.email+"?"))return;
   button.disabled=true;
   try{await callAdmin({action:"set",user_id:item.id,is_admin:next});await reloadAdminUsers();}
   catch(e){status.textContent=e.message;button.disabled=false;}
  });

  root.querySelectorAll("[data-access-user]").forEach(button=>button.onclick=async()=>{
   const item=adminUsers.find(u=>u.id===button.dataset.accessUser),next=button.dataset.accessNext==="true";
   if(!item||item.is_owner||!confirm((next?"Zugang wieder freischalten: ":"Dashboard- und Chat-Zugriff sperren: ")+item.email+"?"))return;
   button.disabled=true;
   try{await callAdmin({action:"set_access",user_id:item.id,enabled:next});await reloadAdminUsers();window.dispatchEvent(new Event("hbl-chat-access-changed"));}
   catch(e){status.textContent=e.message;button.disabled=false;}
  });
  root.querySelectorAll("[data-delete-user]").forEach(button=>button.onclick=async()=>{
   const item=adminUsers.find(u=>u.id===button.dataset.deleteUser);
   if(!item||item.is_owner)return;
   const typed=prompt("ACHTUNG: Konto und persönliche Daten werden unwiderruflich gelöscht.\nGib zur Bestätigung die vollständige E-Mail-Adresse ein:\n"+item.email,"");
   if(typed!==item.email){if(typed!==null)status.textContent="Löschung abgebrochen: E-Mail stimmt nicht überein.";return;}
   if(!confirm("Letzte Bestätigung: Konto "+item.email+" endgültig löschen? Diese Aktion kann nicht rückgängig gemacht werden."))return;
   button.disabled=true;
   try{await callAdmin({action:"delete_user",user_id:item.id,confirm_email:typed});await reloadAdminUsers();status.textContent="Konto gelöscht: "+item.email;}
   catch(e){status.textContent=e.message;button.disabled=false;}
  });
  root.querySelectorAll("[data-recovery-user]").forEach(button=>button.onclick=async()=>{
    const item=adminUsers.find(u=>u.id===button.dataset.recoveryUser);
    if(!item||!confirm((item.confirmed_at?"Passwort-Link erstellen für ":"Einladung erneuern für ")+item.email+"? Ältere Links können ungültig werden."))return;
    await makeManualLink(item.confirmed_at?"recovery":"renew_invite",item.id);
    byId("hblInviteResult")?.scrollIntoView({behavior:"smooth",block:"nearest"});
   });
  root.querySelectorAll("[data-chat-user]").forEach(button=>button.onclick=async()=>{
   const item=adminUsers.find(u=>u.id===button.dataset.chatUser),next=button.dataset.chatNext==="true";
   if(!item||!confirm((next?"Chat für ":"Chat-Zugang entziehen: ")+item.email+"?"))return;
   button.disabled=true;
   try{
    await callAdmin({action:"set_chat",user_id:item.id,is_chat:next});
    await reloadAdminUsers();
    window.dispatchEvent(new Event("hbl-chat-access-changed"));
   }catch(e){status.textContent=e.message;button.disabled=false;}
  });
 }catch(e){root.textContent="Benutzerliste nicht verfügbar.";status.textContent=e.message;}
}
function init(){
 renderLinks();
 if(byId("schoolDots"))renderSchoolCalendar();
 if(byId("participationOverview"))renderParticipationOverview();
 window.addEventListener("hbl-cloud-status",()=>void refreshSession());
 window.addEventListener("visibilitychange",()=>{if(!document.hidden)void refreshSession();});
 setInterval(()=>{if(!document.hidden&&user())void refreshSession();},60000);
 setInterval(()=>{if(!document.hidden&&byId("participationOverview"))renderParticipationOverview();},60000);
 void refreshSession();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();