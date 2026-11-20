/* Persönlicher Kursbestand; Speicherung im vorhandenen privaten Snapshot. */
(function(root){
'use strict';
const identities=()=>root.HblCourseIds;
const clone=v=>JSON.parse(JSON.stringify(v));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function entries(slots){return Object.values(slots||{}).flatMap(p=>['A','B'].map(w=>p?.[w]).filter(e=>e?.subject&&e?.group));}
function reconcile(current,slots,classes={},samples=[]){
 const courses=clone(current?.courses||{});
 for(const e of entries(slots)){
  const id=identities().id(e);
  if(!Object.hasOwn(courses,id))courses[id]={subject:e.subject,group:e.group,archived:false};
 }
 for(const [id,data] of Object.entries(classes)){
  if(!identities().valid(id)||Object.hasOwn(courses,id))continue;
  const meta=data?.meta||samples.find(c=>c.id===id);
  courses[id]={subject:meta?.label||'Kurs',group:meta?.group||id,archived:false};
 }
 return {version:1,courses};
}
function align(slots,catalog){
 const result=clone(slots||{});
 for(const e of entries(result)){
  const c=catalog.courses[identities().id(e)];
  if(c){e.subject=c.subject;e.group=c.group;}
 }
 return result;
}
function count(slots,id){return entries(slots).filter(e=>identities().id(e)===id).length;}
function update(catalog,change,slots={},newId=()=> 'kurs-'+root.crypto.randomUUID()){
 const result=clone(catalog),id=change.id||newId(),old=result.courses[id];
 if(!identities().valid(id))throw Error('Ungültige Kurskennung.');
 if(change.id&&!old)throw Error('Der Kurs ist nicht mehr vorhanden. Bitte neu laden.');
 const subject=String(change.subject??old?.subject??'').trim(),group=String(change.group??old?.group??'').trim();
 if(!subject||!group||subject.length>60||group.length>30)throw Error('Bitte Fach (max. 60 Zeichen) und Klasse / Kurs (max. 30 Zeichen) ausfüllen.');
 if(Object.entries(result.courses).some(([other,c])=>other!==id&&identities().key(c)===identities().key({subject,group})))throw Error('Diese Kursbezeichnung ist bereits vorhanden, eventuell im Archiv. Bitte den vorhandenen Kurs verwenden.');
 const archived=change.archived??old?.archived??false;
 if(archived&&count(slots,id))throw Error('Der Kurs ist noch im Stundenplan. Entferne zuerst seine Belegungen; Bewertungen und Schüler bleiben erhalten.');
 result.courses[id]={...old,subject,group,archived:!!archived};
 return {catalog:result,id};
}
function assign(slots,catalog,id,{day,block,week,room=''}){
 const course=catalog.courses[id];
 if(!course||course.archived)throw Error('Bitte einen aktiven Kurs auswählen.');
 if(![1,2,3,4,5].includes(day)||![1,2,3,4].includes(block)||!['A','B','both'].includes(week))throw Error('Ungültiger Unterrichtsblock.');
 const result=clone(slots||{}),pair=result[day+'-'+block]||{};
 const value={courseId:id,subject:course.subject,group:course.group,room:String(room).trim().slice(0,40)};
 for(const w of week==='both'?['A','B']:[week])pair[w]={...value};
 result[day+'-'+block]=pair;return result;
}
function identityClasses(catalog,classes={}){
 const result={...classes};
 for(const [id,c] of Object.entries(catalog.courses))result[id]={...result[id],meta:{label:c.subject,group:c.group}};
 return result;
}

let editing=null,working=false,returnFocus=null;
const byId=id=>root.document.getElementById(id);
function status(message){byId('hblCourseStatus').textContent=message;}
function render(){
 const {catalog,slots}=root.hblReadCourses();
 const rows=Object.entries(catalog.courses).sort((a,b)=>Number(a[1].archived)-Number(b[1].archived)||(a[1].subject+' '+a[1].group).localeCompare(b[1].subject+' '+b[1].group,'de'));
 byId('hblCourseList').innerHTML=rows.length?rows.map(([id,c])=>'<article class="hbl-course-row"><div><strong>'+esc(c.subject)+' · '+esc(c.group)+'</strong><small>'+(c.archived?'Archiviert':count(slots,id)+' A/B-Belegungen im Stundenplan')+'</small></div><div class="hbl-course-actions"><button type="button" data-course-edit="'+esc(id)+'">Bearbeiten</button><button type="button" data-course-archive="'+esc(id)+'">'+(c.archived?'Wiederherstellen':'Archivieren')+'</button><a href="?kurs='+encodeURIComponent(id)+'">Kurs öffnen</a></div></article>').join(''):'<p>Noch keine Kurse. Lege deinen ersten Kurs unten an – auch ohne Stundenplan.</p>';
}
function resetForm(){editing=null;byId('hblCourseForm').reset();byId('hblCourseFormTitle').textContent='Neuen Kurs anlegen';byId('hblCourseCancel').hidden=true;}
async function save(change){
 if(working)return;working=true;
 const overlay=byId('hblCourseManager');
 overlay.querySelectorAll('button:not(.hbl-plan-close),input').forEach(e=>e.disabled=true);
 try{
  const {catalog,slots}=root.hblReadCourses();
  const result=update(catalog,change,slots);
  await root.hblWriteCourses(result.catalog);
  resetForm();render();status('Kurs gespeichert.');
 }catch(error){status(error.message||'Speichern fehlgeschlagen.');}
 finally{working=false;overlay.querySelectorAll('button,input').forEach(e=>e.disabled=false);}
}
function open(){
 let overlay=byId('hblCourseManager');
 if(!overlay){
  overlay=root.document.createElement('div');overlay.id='hblCourseManager';overlay.className='hbl-plan-overlay';overlay.hidden=true;
  overlay.innerHTML='<section class="hbl-plan-dialog hbl-course-dialog" role="dialog" aria-modal="true" aria-labelledby="hblCourseTitle"><button type="button" class="hbl-plan-close" aria-label="Kursverwaltung schließen">✕</button><h2 id="hblCourseTitle">Meine Kurse</h2><p class="hbl-plan-info">Dein privater Kursbestand. Kurse bleiben auch ohne Stundenplaneintrag erhalten. Schüler und Bewertungen bleiben ihrem Kurs zugeordnet.</p><div id="hblCourseList"></div><form id="hblCourseForm"><h3 id="hblCourseFormTitle">Neuen Kurs anlegen</h3><label>Fach<input id="hblCourseSubject" required maxlength="60" autocomplete="off" placeholder="z. B. Mathematik"></label><label>Klasse / Kurs<input id="hblCourseGroup" required maxlength="30" autocomplete="off" placeholder="z. B. 9a oder GK 12"></label><div class="hbl-plan-buttons"><button type="submit" class="hbl-plan-primary">Kurs speichern</button><button type="button" id="hblCourseCancel" hidden>Abbrechen</button></div></form><p id="hblCourseStatus" role="status" aria-live="polite"></p></section>';
  root.document.body.appendChild(overlay);
  const close=()=>{overlay.hidden=true;returnFocus?.focus();};
  overlay.querySelector('.hbl-plan-close').onclick=close;
  overlay.addEventListener('click',e=>{if(e.target===overlay)close();});
  overlay.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();close();}
   if(e.key==='Tab'){
    const focusable=[...overlay.querySelectorAll('button:not(:disabled),a,input:not(:disabled)')].filter(e=>!e.hidden&&e.getClientRects().length);
    const first=focusable[0],last=focusable.at(-1);
    if(e.shiftKey&&root.document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&root.document.activeElement===last){e.preventDefault();first?.focus();}
   }
  });
  byId('hblCourseForm').onsubmit=e=>{e.preventDefault();save({id:editing,subject:byId('hblCourseSubject').value,group:byId('hblCourseGroup').value});};
  byId('hblCourseCancel').onclick=()=>{resetForm();status('');};
  byId('hblCourseList').onclick=e=>{
   if(working)return;
   const edit=e.target.closest('[data-course-edit]'),archive=e.target.closest('[data-course-archive]');
   if(edit){
    editing=edit.dataset.courseEdit;const c=root.hblReadCourses().catalog.courses[editing];if(!c)return;
    byId('hblCourseSubject').value=c.subject;byId('hblCourseGroup').value=c.group;
    byId('hblCourseFormTitle').textContent='Kurs bearbeiten';byId('hblCourseCancel').hidden=false;status('Umbenennen gilt für alle Belegungen dieses Kurses.');byId('hblCourseSubject').focus();
   }else if(archive){const id=archive.dataset.courseArchive,c=root.hblReadCourses().catalog.courses[id];if(c)save({id,archived:!c.archived});}
  };
 }
 returnFocus=root.document.activeElement;resetForm();render();status('');overlay.hidden=false;overlay.querySelector('.hbl-plan-close').focus();
}
const api={reconcile,align,count,update,assign,identityClasses,open};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else {root.HblCourses=api;root.hblOpenCourseManager=open;}
})(typeof window!=='undefined'?window:globalThis);
