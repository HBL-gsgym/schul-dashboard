/* HBL Musiklinks: Bereich in „Meine Links“ mit vier sicheren, frei benennbaren Verknüpfungen. */
(()=>{
"use strict";
const MAX=4;
const defaults=[
 {name:"Klassik & Entspannung",url:"https://www.youtube.com/watch?v=Su6ak0ZQBNI"},
 {name:"Work / Concentration",url:"https://www.youtube.com/watch?v=oPVte6aMprI"},
 {name:"Deep House Mix",url:"https://www.youtube.com/watch?v=fzktWM990GA"}
];
const byId=id=>document.getElementById(id);
function validUrl(raw){
 try{
  const url=new URL(String(raw||"").trim());
  return url.protocol==="https:"&&url.hostname&&!url.username&&!url.password?url.href:null;
 }catch(_){return null;}
}
function items(){
 const saved=prepDone.__musicLinksV1;
 const input=Array.isArray(saved)?saved:defaults;
 return input.slice(0,MAX).filter(x=>x&&typeof x.name==="string"&&validUrl(x.url))
  .map(x=>({name:x.name.trim().slice(0,50),url:validUrl(x.url)})).filter(x=>x.name);
}
function render(){
 const list=byId("hblMusicLinks");if(!list)return;
 list.replaceChildren();
 const entries=items();
 if(!entries.length){
  const note=document.createElement("span");
  note.textContent="Noch keine Musiklinks – über „Links bearbeiten“ hinzufügen.";
  list.append(note);return;
 }
 for(const item of entries){
  const row=document.createElement("div");row.className="hbl-links-row";
  const a=document.createElement("a");a.href=item.url;
  a.target="_blank";a.rel="noopener noreferrer";a.title=item.name+" öffnen";
  const symbol=document.createElement("span");symbol.textContent="♫";symbol.setAttribute("aria-hidden","true");
  const external=document.createElement("span");external.className="hbl-links-arrow";
  external.textContent="↗";external.setAttribute("aria-hidden","true");
  const title=document.createElement("span");title.textContent=item.name;
  a.append(symbol,title,external);row.append(a);list.append(row);
 }
}
function updateAdd(){
 const button=byId("hblMusicAdd"),rows=byId("hblMusicRows");
 if(!button||!rows)return;
 button.disabled=rows.children.length>=MAX;
 button.title=button.disabled?"Maximal vier Musiklinks":"";
}
function addRow(name="",url=""){
 const root=byId("hblMusicRows");if(!root||root.children.length>=MAX)return;
 const row=document.createElement("div");row.className="music-editor-row";
 const nameLabel=document.createElement("label");nameLabel.textContent="Bezeichnung";
 const nameInput=document.createElement("input");nameInput.name="musicName";nameInput.required=true;
 nameInput.maxLength=50;nameInput.value=name;nameInput.placeholder="z. B. Ruhige Musik";
 nameLabel.append(nameInput);
 const linkLabel=document.createElement("label");linkLabel.textContent="Link (HTTPS)";
 const linkInput=document.createElement("input");linkInput.name="musicUrl";linkInput.required=true;
 linkInput.type="url";linkInput.value=url;linkInput.placeholder="https://...";linkInput.autocomplete="url";
 linkLabel.append(linkInput);
 const remove=document.createElement("button");remove.type="button";remove.className="music-editor-remove";
 remove.textContent="Entfernen";remove.setAttribute("aria-label","Musiklink entfernen");
 remove.onclick=()=>{row.remove();updateAdd();};
 row.append(nameLabel,linkLabel,remove);root.append(row);updateAdd();
}
function edit(open){
 const form=byId("hblMusicEditor"),button=byId("hblMusicEdit");if(!form||!button)return;
 form.hidden=!open;button.hidden=open;
 if(open){
  byId("hblMusicRows").replaceChildren();
  for(const entry of items())addRow(entry.name,entry.url);
  updateAdd();byId("hblMusicStatus").textContent="Bis zu vier Links, frei benennbar.";
 }
}
function init(){
 const form=byId("hblMusicEditor");if(!form)return;
 byId("hblMusicEdit").onclick=()=>edit(true);
 byId("hblMusicCancel").onclick=()=>edit(false);
 byId("hblMusicAdd").onclick=()=>addRow();
 form.onsubmit=async event=>{
  event.preventDefault();
  const status=byId("hblMusicStatus"),rows=[...byId("hblMusicRows").children];
  if(rows.length>MAX){status.textContent="Maximal vier Musiklinks erlaubt.";return;}
  const result=[];
  for(const row of rows){
   const name=row.querySelector('[name="musicName"]').value.trim();
   const url=validUrl(row.querySelector('[name="musicUrl"]').value);
   if(!name||name.length>50||!url){
    status.textContent="Bitte pro Link eine Bezeichnung und eine gültige HTTPS-Adresse eingeben.";return;
   }
   result.push({name,url});
  }
  const old=prepDone.__musicLinksV1,save=form.querySelector('[type="submit"]');
  save.disabled=true;status.textContent="Musiklinks werden gespeichert …";
  prepDone.__musicLinksV1=result;
  try{await savePrepFile();render();edit(false);}
  catch(error){
   if(old===undefined)delete prepDone.__musicLinksV1;else prepDone.__musicLinksV1=old;
   status.textContent="Speichern fehlgeschlagen: "+(error?.message||"Bitte erneut versuchen.");
  }finally{save.disabled=false;}
 };
 render();
}
window.hblRenderMusicLinks=render;
window.hblCloseMusicEditor=()=>edit(false);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
