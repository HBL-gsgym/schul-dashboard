/* Desktop-/Tablet-Schnellleiste: vorhandene Konto- und Chataktionen verwenden. */
(()=>{
"use strict";
const mq=matchMedia("(min-width:711px)"),get=id=>document.getElementById(id);
const current=()=>window.hblCloudUser?.();
const key=()=> "hbl-quickbar-v1-"+(current()?.id||"local");
let box,handle,location=null,small=false,drag=null;
function read(){try{const v=JSON.parse(localStorage.getItem(key())||"null");return v&&typeof v==="object"?{x:Number.isFinite(v.x)?v.x:null,y:Number.isFinite(v.y)?v.y:null,small:v.small===true}:null}catch(_){return null}}
function save(){try{localStorage.setItem(key(),JSON.stringify({x:location?.x??null,y:location?.y??null,small}))}catch(_){}}
function clamp(x,y){return {x:Math.max(8,Math.min(Math.max(8,innerWidth-box.offsetWidth-8),x)),y:Math.max(8,Math.min(Math.max(8,innerHeight-box.offsetHeight-8),y))}}
function place(){if(!mq.matches||box?.hidden)return;const p=location?.x==null?{x:innerWidth-box.offsetWidth-20,y:16}:location;location=clamp(p.x,p.y);box.style.left=location.x+"px";box.style.top=location.y+"px"}
function fold(on,store=true){small=on;box.classList.toggle("hbl-q-small",on);get("hblQFold").textContent=on?"▣":"−";get("hblQFold").setAttribute("aria-label",on?"Schnellleiste ausklappen":"Schnellleiste minimieren");place();if(store)save()}
function account(){const u=current(),name=u?String(window.hblCurrentUsername||u.email?.split("@")[0]||"Profil"):"Anmelden";get("hblQName").textContent=name;get("hblQAccount").setAttribute("aria-label",u?"Mein Konto: "+name:"Anmelden");get("hblQAccount").title=u?"Konto: "+name:"Anmelden"}
function chat(){const source=get("hblChatToggle"),badge=get("hblChatBadge"),out=get("hblQCount"),n=source&&!source.hidden&&badge&&!badge.hidden?badge.textContent.trim():"";out.hidden=!n;out.textContent=n;get("hblQChat").setAttribute("aria-label",n?"Chat: "+n+" ungelesen":"Kollegium-Chat")}
// In Kursübersicht, Mitarbeit und Noten die Schnellleiste vollständig ausblenden.
function courseRoute(route){
 if(route)return route.view==='course'||route.view==='participation';
 const params=new URLSearchParams(window.location.search);
 return ['kurs','mitarbeit','noten'].some(key=>params.has(key));
}
function syncVisibility(event){
 if(!box)return;
 const hidden=courseRoute(event?.detail);
 const wasHidden=box.hidden;
 box.hidden=hidden;
 if(wasHidden&&!hidden)place(); // Position erst im wieder sichtbaren Zustand berechnen.
}
function openAccount(){if(!current()){get("hblCloudLogin")?.click();return}window.openMeinHbl?.();document.querySelector("dialog.mein-hbl [data-account]")?.click()}
function openChat(){const button=get("hblChatToggle");if(button&&!button.hidden){button.click();return}if(!current())get("hblCloudLogin")?.click();else alert("Kollegium-Chat ist für dieses Konto nicht freigeschaltet.")}
function mount(){
 if(get("hblQuickbar"))return;
 box=document.createElement("aside");box.id="hblQuickbar";box.className="hbl-quickbar";box.setAttribute("aria-label","HBL-Schnellleiste");box.hidden=courseRoute();
 box.innerHTML='<div class="hbl-q-head"><button id="hblQGrip" type="button" aria-label="Leiste verschieben, ziehen oder Pfeiltasten" title="Ziehen · Doppelklick: Position zurücksetzen">⠿ <span>HBL-Schnellleiste</span></button><button id="hblQFold" type="button" aria-label="Schnellleiste minimieren">−</button></div><div class="hbl-q-links"><button id="hblQAccount" type="button"><span aria-hidden="true">👤</span><span id="hblQName">Anmelden</span></button><button id="hblQChat" type="button"><span aria-hidden="true">💬</span><span>Chat</span><span id="hblQCount" class="hbl-q-badge" hidden></span></button><button id="hblQSettings" type="button"><span aria-hidden="true">⚙</span><span>Einstellungen</span></button></div>';
 document.body.append(box);handle=get("hblQGrip");
 get("hblQAccount").onclick=openAccount;get("hblQChat").onclick=openChat;get("hblQSettings").onclick=()=>window.openMeinHbl?.();
 get("hblQFold").onclick=()=>fold(!small);
 handle.addEventListener("dblclick",()=>{location=null;place();save()});
 handle.addEventListener("keydown",e=>{
  if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home"].includes(e.key))return;
  e.preventDefault();if(e.key==="Home"){location=null;place();save();return}
  const v=e.shiftKey?25:10,p=location||{x:box.offsetLeft,y:box.offsetTop};
  location=clamp(p.x+(e.key==="ArrowLeft"?-v:e.key==="ArrowRight"?v:0),p.y+(e.key==="ArrowUp"?-v:e.key==="ArrowDown"?v:0));place();save();
 });
 handle.addEventListener("pointerdown",e=>{
  if(e.button!==0||!mq.matches)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:location?.x??box.offsetLeft,startY:location?.y??box.offsetTop};
  handle.setPointerCapture(e.pointerId);box.classList.add("hbl-q-dragging");
 });
 handle.addEventListener("pointermove",e=>{if(!drag||e.pointerId!==drag.id)return;location=clamp(drag.startX+e.clientX-drag.x,drag.startY+e.clientY-drag.y);place()});
 function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;box.classList.remove("hbl-q-dragging");save()}
 handle.addEventListener("pointerup",end);handle.addEventListener("pointercancel",end);
 function restore(){const s=read();location=s;fold(!!s?.small,false);account();chat()}
 // Die Cloud-Anmeldung ist asynchron. Bis sie den aktiven Benutzer bestätigt,
 // darf die Leiste ihre vorläufige "local"-Position oben rechts NICHT zeigen.
 function reveal(){restore();box.classList.add("hbl-q-ready");}
 restore();
 window.addEventListener("hbl-cloud-status",reveal);
 // Falls die Anmeldung bereits vor dem Mounten fertig war, direkt anzeigen.
 if(current()||!window.hblCloudClient)reveal();
 // Bei einem Netzwerk-/Authentifizierungsfehler bleibt die Bedienung erreichbar.
 // Die Position wird erneut aus der dann bekannten Benutzerkennung gelesen.
 else setTimeout(()=>{if(!box.classList.contains("hbl-q-ready"))reveal();},6000);
 window.addEventListener("hbl-route-changed",syncVisibility);
 window.addEventListener("hbl-profile-changed",account);
 window.addEventListener("hbl-chat-access-changed",chat);
 const controls=document.querySelector("#hblCloudControls .hbl-cloud-actions");
 if(controls)new MutationObserver(chat).observe(controls,{subtree:true,attributes:true,attributeFilter:["hidden"],characterData:true,childList:true});
 window.addEventListener("hbl-sync-mounted",place);
 window.addEventListener("resize",place);mq.addEventListener("change",place);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();
