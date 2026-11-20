/* Kursstart und persönliche Notentabelle. */
(function(){
'use strict';
const grades=window.HblGradebook;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=value=>value.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const makeId=()=>crypto.randomUUID();
let page,seatView,serial=0;
function link(view,label,style='part-button'){
 return '<a class="'+style+'" href="?'+view+'='+encodeURIComponent(page.id)+'">'+label+'</a>';
}
function status(message){
 const el=document.getElementById('gradeStatus');
 if(el)el.textContent=message;
}
function mount(options){
 page=options;
 document.body.innerHTML='<div class="dashboard-scene" id="dashboardScene" aria-hidden="true"></div><main class="course-workspace"><nav class="part-nav"><a class="part-back" href="./">← Schul-Dashboard</a>'+
  (page.mode==='noten'?link('kurs','Zur Kursübersicht','part-back'):'')+'</nav><header><h1 id="coursePageTitle">Kurs wird geladen …</h1></header><div id="coursePageContent"></div><p id="gradeStatus" role="status"></p></main>';
 const host=document.getElementById('coursePageContent');
 host.addEventListener('click',onClick);
 host.addEventListener('change',onChange);
}
function refresh(){
 if(!page)return;
 const {meta,data}=page.read(),host=document.getElementById('coursePageContent');
 if(!host)return;
 const title=document.getElementById('coursePageTitle');
 if(!meta){title.textContent='Kurs nicht gefunden';host.replaceChildren();return;}
 const name=meta.subject+' · '+meta.group;
 title.textContent=page.mode==='noten'?'Noten · '+name:name;
 document.title=title.textContent+' · Schul-Dashboard';
 if(page.mode==='kurs'){
  if(!host.querySelector('.seat-section')){
   host.innerHTML='<section class="part-pane seat-section" aria-label="Sitzplan"></section><nav class="course-choices" aria-label="Kursbereiche">'+link('mitarbeit','Mitarbeit')+link('noten','Noten')+'</nav>';
   seatView=window.hblCreateSeatView(host.querySelector('.seat-section'),page);
  }
  seatView.render();
  return;
 }
 if(data?.gradebook&&data.gradebook.version!==1){host.textContent='Dieses Notenbuch benötigt eine neuere App-Version.';return;}
 const book=data?.gradebook||grades.empty();
 const expanded=host.querySelector('details')?.open??!book.areas.length;
 const formerTable=host.querySelector('.grade-scroll');
 const scroll=[formerTable?.scrollLeft||0,formerTable?.scrollTop||0];
 const active=book.areas.filter(a=>a.active);
 const total=grades.weightTotal(book);
 const settings=book.areas.map(a=>'<div class="grade-area"><b>'+esc(a.name)+'</b><span>'+a.weight.toLocaleString('de-DE')+' %'+(a.active?'':' · inaktiv')+'</span><button type="button" class="part-button" data-edit-area="'+esc(a.id)+'">Bearbeiten</button><button type="button" class="part-button" data-add-column="'+esc(a.id)+'">+ Nachweis</button></div>').join('');
 host.innerHTML='<section class="part-pane"><p class="grade-pilot">Pilotbetrieb · Nur Beispieldaten</p><details '+(expanded?'open':'')+'><summary>Bewertungsbereiche und Skala</summary><div class="grade-settings"><label>Kursskala <select data-scale><option value="grades">Noten 1–6</option><option value="points">Punkte 0–15</option></select></label>'+settings+'<button class="part-button primary" type="button" data-new-area>+ Bewertungsbereich</button></div></details>'+
  (book.areas.length?'<p class="grade-weight">'+(total===100?'Aktive Gewichtung: 100 %':'Aktive Gewichtung: '+total.toLocaleString('de-DE')+' %. Für den Gesamtwert sind 100 % erforderlich.')+'</p>':'<p>Lege zuerst einen Bewertungsbereich und anschließend einen Leistungsnachweis an.</p>')+
  (active.length?tableHtml(book,active,data?.students||[]):'')+'</section>';
 host.querySelector('[data-scale]').value=book.scale;
 const table=host.querySelector('.grade-scroll');
 if(table){table.scrollLeft=scroll[0];table.scrollTop=scroll[1];}
}
function tableHtml(book,active,students){
 const [min,max]=grades.limits(book.scale);
 const choices=Array.from({length:max-min+1},(_,i)=>i+min);
 const groupHead=active.map(area=>'<th scope="colgroup" colspan="'+(area.columns.length+1)+'">'+esc(area.name)+' · '+area.weight.toLocaleString('de-DE')+' %</th>').join('');
 const colTitle=(c,i)=>c.title||('Nachweis '+(i+1));
 const headings=active.map(area=>area.columns.map((c,i)=>'<th scope="col"><button type="button" data-edit-column="'+esc(c.id)+'" data-area="'+esc(area.id)+'">'+esc(colTitle(c,i))+(c.date?'<small>'+esc(c.date.split('-').reverse().join('.'))+'</small>':'')+'</button></th>').join('')+'<th scope="col">Ø</th>').join('');
 const rows=students.map(s=>{
  const {means,total}=grades.results(book,s.id);
  const cells=active.map(area=>area.columns.map((c,i)=>{
   const value=Object.hasOwn(c.scores,s.id)?c.scores[s.id]:'';
   const options=choices.map(n=>'<option'+(value===n?' selected':'')+'>'+n+'</option>').join('');
   return '<td><select aria-label="'+esc(s.name+' · '+area.name+' · '+colTitle(c,i))+'" data-student="'+esc(s.id)+'" data-column="'+esc(c.id)+'" data-area="'+esc(area.id)+'"><option value="">–</option>'+options+'</select></td>';
  }).join('')+'<td class="grade-mean">'+(means.get(area.id)===null?'–':format(means.get(area.id)))+'</td>').join('');
  return '<tr><th scope="row">'+esc(s.name)+'</th>'+cells+'<td class="grade-total">'+(total===null?'Unvollständig':format(total))+'</td></tr>';
 }).join('');
 return '<div class="grade-scroll" tabindex="0" aria-label="Notentabelle"><table><thead><tr><th rowspan="2" scope="col">Name</th>'+groupHead+'<th rowspan="2" scope="col">Gesamtwert</th></tr><tr>'+headings+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+
  (students.length?'':'<p>Die Schülerliste kannst du unter '+link('mitarbeit','Mitarbeit','')+' pflegen.</p>');
}
async function commit(change){
 const {meta,data}=page.read();
 if(!meta||!data)throw Error('Kursdaten sind noch nicht verfügbar.');
 if(data.gradebook&&data.gradebook.version!==1)throw Error('Unbekanntes Notenformat.');
 const book=structuredClone(data.gradebook||grades.empty());
 change(book,data);
 data.gradebook=book;
 const version=++serial;
 const saved=page.save();
 refresh();status('Speichert …');
 try{await saved;if(version===serial)status('Gespeichert.');}
 catch(error){if(version===serial)status('Speichern fehlgeschlagen: '+error.message);throw error;}
}
function onChange(event){
 const el=event.target,d=el.dataset;
 if(!el.matches('[data-scale],[data-student]'))return;
 commit((book,data)=>{
  if(el.matches('[data-scale]')){grades.setScale(book,el.value);return;}
  const area=book.areas.find(a=>a.id===d.area),column=area?.columns.find(c=>c.id===d.column);
  if(!area?.active||!column||!data.students.some(s=>s.id===d.student))throw Error('Eintrag hat sich geändert. Bitte erneut auswählen.');
  grades.setScore(book,column,d.student,el.value);
 }).catch(error=>{refresh();status(error.message);});
 // Beim Neuaufbau der Tabelle den Tastaturfokus auf derselben Zelle halten.
 const host=document.getElementById('coursePageContent');
 const selector=d.student?'[data-student="'+CSS.escape(d.student)+'"][data-column="'+CSS.escape(d.column)+'"]':'[data-scale]';
 host.querySelector(selector)?.focus({preventScroll:true});
}
function onClick(event){
 if(page.mode!=='noten')return;
 const button=event.target.closest('button');
 if(!button||!page.read().data)return;
 const book=page.read().data.gradebook||grades.empty(),d=button.dataset;
 const area=book.areas.find(a=>a.id===(d.editArea||d.addColumn||d.area));
 if(button.hasAttribute('data-new-area')||d.editArea)editor('area',area);
 else if(area&&(d.addColumn||d.editColumn))editor('column',area,area.columns.find(c=>c.id===d.editColumn));
}
function editor(kind,area,column){
 const data=page.read().data,original=data.gradebook,isArea=kind==='area';
 const areas=original?.areas||[],existing=isArea?area:column;
 const dialog=document.createElement('dialog');dialog.className='grade-dialog';
 dialog.setAttribute('aria-labelledby','gradeEditorTitle');
 const positions=Array.from({length:areas.length+(area?0:1)},(_,i)=>'<option value="'+i+'">'+(i+1)+'</option>').join('');
 dialog.innerHTML='<form><h2 id="gradeEditorTitle">'+(isArea?'Bewertungsbereich':'Leistungsnachweis')+(existing?' bearbeiten':' anlegen')+'</h2>'+
  (isArea?'<label>Name<input name="title" required maxlength="60"></label><label>Gewichtung (%)<input name="weight" type="number" required min="0" max="100" step="0.01"></label><label>Position<select name="position">'+positions+'</select></label><label><input type="checkbox" name="active"> In Gesamtwert einbeziehen</label>':
  '<label>Titel (optional)<input name="title" maxlength="60"></label><label>Datum (optional)<input type="date" name="date"></label>')+
  '<div class="grade-actions"><button class="part-button primary">Speichern</button><button type="button" class="part-button" data-cancel>Abbrechen</button>'+
  (existing?'<button type="button" class="part-button" data-remove>Entfernen</button>':'')+'</div><p role="status"></p></form>';
 const form=dialog.querySelector('form'),fields=form.elements;
 fields.title.value=(isArea?area?.name:column?.title)||'';
 if(isArea){
  fields.weight.value=area?.weight??Math.max(0,100-grades.weightTotal(original||grades.empty()));
  fields.active.checked=area?.active??true;
  fields.position.value=area?areas.indexOf(area):areas.length;
 }else fields.date.value=column?.date||'';
 const close=()=>dialog.close();
 form.querySelector('[data-cancel]').onclick=close;
 let busy=false;
 async function apply(remove){
  if(busy)return;
  if(page.read().data!==data||data.gradebook!==original){form.querySelector('[role=status]').textContent='Datenstand geändert. Bitte den Dialog erneut öffnen.';return;}
  busy=true;
  try{
   await commit(book=>{
    const current=book.areas.find(a=>a.id===area?.id);
    if(remove){
     if(isArea)grades.removeArea(book,current);
     else grades.removeColumn(current,current.columns.find(c=>c.id===column.id));
     return;
    }
    if(isArea){grades.saveArea(book,area?.id||makeId(),{name:fields.title.value,weight:fields.weight.valueAsNumber,active:fields.active.checked,position:Number(fields.position.value)});return;}
    const item=current.columns.find(c=>c.id===column?.id)||{id:makeId(),scores:{}};
    item.title=fields.title.value.trim();item.date=fields.date.value;
    if(!column)current.columns.push(item);
   });
   close();
  }catch(error){form.querySelector('[role=status]').textContent=error.message;}
  finally{busy=false;}
 }
 form.onsubmit=e=>{e.preventDefault();apply(false);};
 if(existing)form.querySelector('[data-remove]').onclick=()=>{
  if(confirm(isArea?'Bereich mit seinen leeren Nachweisen entfernen?':'Leeren Nachweis entfernen?'))apply(true);
 };
 dialog.oncancel=e=>{if(busy)e.preventDefault();};
 dialog.onclose=()=>dialog.remove();
 document.body.appendChild(dialog);dialog.showModal();fields.title.focus();
}
window.HblCoursePage={mount,refresh};
})();
