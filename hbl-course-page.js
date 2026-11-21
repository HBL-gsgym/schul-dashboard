/* Kursstart und persönliche Notentabelle. */
(function(){
'use strict';
const grades=window.HblGradebook;
const rosters=window.HblClassRosters;
const ordered=students=>rosters.sorted((students||[]).map((s,i)=>({...s,number:rosters.numberOf(s,i)})));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const format=value=>value.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2});
const makeId=()=>crypto.randomUUID();
let page,serial=0;
const cachedContents=new Map(),seatViews=new Map(),renderStamps=new Map();
let contentKey='';
function switchCourseContent(host,key){
 if(contentKey===key)return;
 if(contentKey){
  const detached=document.createDocumentFragment();
  while(host.firstChild)detached.append(host.firstChild);
  cachedContents.set(contentKey,detached);
 }
 const previous=cachedContents.get(key);
 if(previous){host.append(previous);cachedContents.delete(key);}
 contentKey=key;
}
let gradeView='year';
const gradeFilters=new Map();
const periodLabel={first:'1. Halbjahr',second:'2. Halbjahr',year:'Schuljahr'};
function link(view,label,style='part-button'){
 return '<a class="'+style+'" href="?'+view+'='+encodeURIComponent(page.id)+'">'+label+'</a>';
}
// Eine gemeinsame, zugängliche Kursnavigation für alle drei bisherigen Routen.
function courseTabs(courseId,selected){
 const sections=[['kurs','Übersicht'],['mitarbeit','Mitarbeit'],['noten','Noten']];
 return '<nav class="hbl-course-tabs" aria-label="Kursbereiche">'+sections.map(([view,label])=>
  '<a class="hbl-course-tab'+(view===selected?' current':'')+'" href="?'+view+'='+encodeURIComponent(courseId)+'"'+(view===selected?' aria-current="page"':'')+'>'+label+'</a>'
 ).join('')+'</nav>';
}
// Eine einzige Kursauswahl für Übersicht, Mitarbeit und Noten.
// Die Links übernehmen die aktuell gewählte Ansicht, nicht die jeweilige Standardseite.
function courseSwitcher(courseId,view){
 return '<nav class="part-tabs hbl-course-picker" id="hblCourseTabs" aria-label="Kurs auswählen" data-course-id="'+esc(courseId)+'" data-course-view="'+esc(view)+'"></nav>';
}
function renderCourseSwitcher(courses){
 const nav=document.getElementById('hblCourseTabs');if(!nav)return;
 const current=nav.dataset.courseId,view=nav.dataset.courseView;
 if(!['kurs','mitarbeit','noten'].includes(view))return;
 const visible=(Array.isArray(courses)?courses:[]).filter(c=>c&&c.id&&(!c.archived||c.id===current)).map(c=>({id:String(c.id),short:String(c.short||[c.label,c.group].filter(Boolean).join(' '))}));
 if(!visible.some(c=>c.id===current)&&typeof window.hblReadCourses==='function'){
  // Alte Links auf archivierte Kurse bleiben nutzbar.
  const c=window.hblReadCourses()?.catalog?.courses?.[current];
  if(c)visible.push({id:current,short:[c.subject,c.group].filter(Boolean).join(' ')});
 }
 visible.sort((a,b)=>a.short.localeCompare(b.short,'de'));
 const visibleStamp=JSON.stringify(visible);
 if(nav.dataset.visibleStamp!==visibleStamp){
  nav.dataset.visibleStamp=visibleStamp;
  nav.innerHTML=visible.length?visible.map(c=>
   '<a class="part-tab" data-course-choice="'+esc(c.id)+'" href="?'+view+'='+encodeURIComponent(c.id)+'">'+esc(c.short)+'</a>'
  ).join(''):'<span class="hbl-course-picker-empty">Kurse werden geladen …</span>';
 }
 // Die Kursleiste bleibt stehen: nur aktiven Link und Ziel-Ansicht ändern.
 for(const link of nav.querySelectorAll('[data-course-choice]')){
  const active=link.dataset.courseChoice===current;
  link.href='?'+view+'='+encodeURIComponent(link.dataset.courseChoice);
  link.classList.toggle('current',active);
  if(active)link.setAttribute('aria-current','page');
  else link.removeAttribute('aria-current');
 }
 const selected=nav.querySelector('[aria-current="page"]');
 if(selected){
  const outer=nav.getBoundingClientRect(),inner=selected.getBoundingClientRect();
  if(inner.left<outer.left)nav.scrollLeft+=inner.left-outer.left-12;
  else if(inner.right>outer.right)nav.scrollLeft+=inner.right-outer.right+12;
 }
}

function syncNavigation(courseId,view,courses){
 const tabs=document.querySelector('.hbl-course-tabs');
 if(tabs)for(const anchor of tabs.querySelectorAll('a')){
  const type=new URL(anchor.href,location.href).searchParams.keys().next().value;
  anchor.href='?'+type+'='+encodeURIComponent(courseId);
  anchor.classList.toggle('current',type===view);
  if(type===view)anchor.setAttribute('aria-current','page');
  else anchor.removeAttribute('aria-current');
 }
 const picker=document.getElementById('hblCourseTabs');
 if(picker){
  picker.dataset.courseId=courseId;picker.dataset.courseView=view;
  renderCourseSwitcher(courses||page?.courses?.()||[]);
 }
}
function navigate(courseId,mode){
 if(!page)return;
 page.id=courseId;page.mode=mode;
 gradeView=gradeFilters.get(courseId)||'year';
 syncNavigation(courseId,mode,page.courses?.());
}
function status(message){
 const el=document.getElementById('gradeStatus');
 if(el)el.textContent=message;
}
function mount(options){
 if(page)Object.assign(page,options);else page=options;
 if(window.hblActivateView?.('course')){navigate(page.id,page.mode);return;}
 window.hblSetView('course','<div class="dashboard-scene" id="dashboardScene" aria-hidden="true"></div><main class="course-workspace hbl-course-layout"><nav class="part-nav"><a class="part-back" href="./">← Schul-Dashboard</a></nav>'+
  courseSwitcher(page.id,page.mode==='noten'?'noten':'kurs')+
  courseTabs(page.id,page.mode==='noten'?'noten':'kurs')+
  '<header class="hbl-course-heading"><p class="hbl-course-eyebrow">MEIN KURS</p><h1 id="coursePageTitle">Kurs wird geladen …</h1><p class="hbl-course-meta" id="coursePageMeta"></p></header>'+
  '<div id="coursePageContent"></div><p id="gradeStatus" role="status"></p></main>');
 const host=document.getElementById('coursePageContent');
 host.addEventListener('click',onClick);
 host.addEventListener('change',onChange);
}
function refresh(){
 if(!page)return;
 const {meta,data}=page.read(),host=document.getElementById('coursePageContent');
 if(!host)return;
 const key=page.mode+':'+page.id;
 switchCourseContent(host,key);
 if(typeof page.courses==='function')renderCourseSwitcher(page.courses());
 const title=document.getElementById('coursePageTitle');
 if(!meta){title.textContent='Kurs nicht gefunden';host.replaceChildren();renderStamps.delete(key);return;}
 const name=meta.subject+' · '+meta.group;
 title.textContent=name;
 document.getElementById('coursePageMeta').textContent=(data?.students?.length??0)+' Lernende · '+(page.mode==='noten'?'Notenbuch':'Sitzplan und Schülerliste');
 document.title=(page.mode==='noten'?'Noten · ':'Kurs · ')+name+' · Schul-Dashboard';
 const stamp=JSON.stringify(page.mode==='kurs'?
  [data?.students,data?.seating,data?.dates,data?.marks,page.rooms?.(),page.rosterWarning?.()]:
  [data?.students,data?.gradebook,gradeView]);
 if(renderStamps.get(key)===stamp&&host.childNodes.length)return;
 renderStamps.set(key,stamp);
 if(page.mode==='kurs'){
  if(!host.querySelector('.seat-section')){
   host.innerHTML='<section class="part-pane seat-section" aria-label="Sitzplan"></section><details class="part-pane course-roster"><summary></summary><p class="class-roster-warning" hidden></p><button type="button" class="part-button" data-link-class hidden>Klassenliste nach Nummer abgleichen</button><button type="button" class="part-button" data-add-person>+ Person hinzufügen</button><ul></ul></details>';
   seatViews.set(key,window.hblCreateSeatView(host.querySelector('.seat-section'),page));
  }
  seatViews.get(key)?.render();
  const roster=host.querySelector('.course-roster'),students=ordered(data?.students);
  const warning=!!page.rosterWarning?.();
  const warningText=roster.querySelector('.class-roster-warning'),linkButton=roster.querySelector('[data-link-class]');
  warningText.hidden=!warning;linkButton.hidden=!warning;
  if(warning)warningText.textContent='Dieser Fachkurs enthält noch eine eigenständige Schülerliste. Prüfe die Zuordnung zu den Klassenbuchnummern, bevor Daten zusammengeführt werden.';
  roster.querySelector('summary').textContent='Schülerliste ('+students.length+') · Klassenbuchnummern';
  roster.querySelector('ul').innerHTML=students.map(s=>'<li><button type="button" data-person="'+esc(s.id)+'" aria-label="Nr. '+s.number+' · '+esc(s.name)+' bearbeiten">Nr. '+s.number+' · '+esc(s.name)+'</button></li>').join('');
  return;
 }
 if(data?.gradebook&&data.gradebook.version!==1){host.textContent='Dieses Notenbuch benötigt eine neuere App-Version.';return;}
 const book=grades.forCourse(data);
 const expanded=host.querySelector('details')?.open??!book.areas.length;
 const formerTable=host.querySelector('.grade-scroll');
 const scroll=[formerTable?.scrollLeft||0,formerTable?.scrollTop||0];
 const active=book.areas.filter(a=>a.active);
 const total=grades.weightTotal(book);
 const settings=book.areas.map(a=>'<div class="grade-area"><b>'+esc(a.name)+'</b><span>'+a.weight.toLocaleString('de-DE')+' %'+(a.active?'':' · inaktiv')+'</span><button type="button" class="part-button" data-edit-area="'+esc(a.id)+'">Bearbeiten</button><button type="button" class="part-button" data-add-column="'+esc(a.id)+'">+ Nachweis</button></div>').join('');
 host.innerHTML='<section class="part-pane"><p class="grade-pilot">Pilotbetrieb · Nur Beispieldaten</p><details '+(expanded?'open':'')+'><summary>Bewertungsbereiche, Skala und Berechnung</summary><div class="grade-settings"><label>Berechnung <select data-mode><option value="sek1">Sek I · ganzes Schuljahr</option><option value="sek2">Sek II · getrennte Halbjahre</option></select></label><label>Kursskala <select data-scale><option value="grades">Noten 1–6</option><option value="points">Punkte 0–15</option></select></label>'+settings+'<button class="part-button primary" type="button" data-new-area>+ Bewertungsbereich</button></div></details>'+
  (book.areas.length?'<p class="grade-weight">'+(total===100?'Aktive Gewichtung: 100 %':'Aktive Gewichtung: '+total.toLocaleString('de-DE')+' %. Für den Gesamtwert sind 100 % erforderlich.')+'</p>':'<p>Lege zuerst einen Bewertungsbereich und anschließend einen Leistungsnachweis an.</p>')+
  '<div class="grade-period"><label>Nachweise anzeigen <select data-view><option value="year">Gesamtes Schuljahr</option><option value="first">1. Halbjahr</option><option value="second">2. Halbjahr</option></select></label></div>'+
  (active.some(a=>a.columns.some(c=>!['first','second'].includes(c.term)))?'<p>Nachweise ohne Halbjahr findest du unter „Gesamtes Schuljahr“. Zum Zuordnen den Spaltenkopf öffnen.</p>':'')+
  (gradeView!=='year'&&active.length&&!active.some(a=>a.columns.some(c=>c.term===gradeView))?'<p>Für dieses Halbjahr gibt es noch keine Nachweise. Ordne einen Spaltenkopf im gesamten Schuljahr zu oder ergänze einen Nachweis im Bewertungsbereich.</p>':'')+
  tableHtml(book,active,ordered(data?.students))+'</section>';
 host.querySelector('[data-scale]').value=book.scale;
 host.querySelector('[data-view]').value=gradeView;
 host.querySelector('[data-mode]').value=book.mode==='sek2'?'sek2':'sek1';
 const table=host.querySelector('.grade-scroll');
 if(table){table.scrollLeft=scroll[0];table.scrollTop=scroll[1];}
}
function tableHtml(book,active,students){
 const [min,max]=grades.limits(book.scale);
 const choices=Array.from({length:max-min+1},(_,i)=>i+min);
 const periods=grades.periods(book);
 const showMean=gradeView!=='year'||book.mode!=='sek2';
 const visible=active.map(area=>({...area,columns:area.columns.map((c,i)=>({...c,label:c.title||('Nachweis '+(i+1))})).filter(c=>gradeView==='year'||c.term===gradeView)})).filter(a=>a.columns.length||showMean);
 const groupHead=visible.map(area=>'<th scope="colgroup" colspan="'+(area.columns.length+Number(showMean))+'">'+esc(area.name)+' · '+area.weight.toLocaleString('de-DE')+' %</th>').join('');
 const headings=visible.map(area=>area.columns.map(c=>'<th scope="col"><button type="button" data-edit-column="'+esc(c.id)+'" data-area="'+esc(area.id)+'">'+esc(c.label)+'<small>'+esc(periodLabel[c.term]||'Ohne Halbjahr')+'</small>'+(c.date?'<small>'+esc(c.date.split('-').reverse().join('.'))+'</small>':'')+'</button></th>').join('')+(showMean?'<th scope="col">Ø</th>':'')).join('');
 const rows=students.map(s=>{
  const summaries=Object.fromEntries(periods.map(p=>[p,grades.results(book,s.id,p)]));
  const means=summaries[gradeView]?.means;
  const cells=visible.map(area=>area.columns.map(c=>{
   const value=Object.hasOwn(c.scores,s.id)?c.scores[s.id]:'';
   const options=choices.map(n=>'<option'+(value===n?' selected':'')+'>'+n+'</option>').join('');
   return '<td><select aria-label="'+esc(s.name+' · '+area.name+' · '+c.label)+'" data-student="'+esc(s.id)+'" data-column="'+esc(c.id)+'" data-area="'+esc(area.id)+'"><option value="">–</option>'+options+'</select></td>';
  }).join('')+(showMean?'<td class="grade-mean">'+(means.get(area.id)===null?'–':format(means.get(area.id)))+'</td>':'')).join('');
  const totals=periods.map(p=>{
   const value=summaries[p].total,manual=book.reportMarks?.[p]?.[s.id];
   const raw=value===null?'Unvollständig':format(value);
   return '<td class="grade-total"><button type="button" data-report="'+p+'" data-person-id="'+esc(s.id)+'" aria-label="Zeugnisnote für '+esc(s.name)+' · '+periodLabel[p]+' bearbeiten">'+(manual==null?raw:'Zeugnis: '+esc(manual)+'<small>Berechnet: '+raw+'</small>')+'</button></td>';
  }).join('');
  return '<tr><th scope="row">'+s.number+'</th><td>'+esc(s.name)+'</td>'+cells+totals+'</tr>';
 }).join('');
 return '<div class="grade-scroll" tabindex="0" aria-label="Notentabelle"><table><thead><tr><th rowspan="2" scope="col">Nr.</th><th rowspan="2" scope="col">Name</th>'+groupHead+'<th scope="colgroup" colspan="'+periods.length+'">Notenvorschläge</th></tr><tr>'+headings+periods.map(p=>'<th scope="col">'+(p==='year'?'Jahresnote':periodLabel[p])+'</th>').join('')+'</tr></thead><tbody>'+rows+'</tbody></table></div>'+
  (students.length?'':'<p>Öffne die Schülerliste in der '+link('kurs','Kursübersicht','')+', um Personen hinzuzufügen.</p>');
}
async function commit(change){
 const {meta,data}=page.read();
 if(!meta||!data)throw Error('Kursdaten sind noch nicht verfügbar.');
 if(data.gradebook&&data.gradebook.version!==1)throw Error('Unbekanntes Notenformat.');
 const book=structuredClone(grades.forCourse(data));
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
 if(el.matches('[data-view]')){
  gradeView=el.value;gradeFilters.set(page.id,gradeView);refresh();document.querySelector('[data-view]')?.focus({preventScroll:true});return;
 }
 if(!el.matches('[data-scale],[data-mode],[data-student]'))return;
 commit((book,data)=>{
  if(el.matches('[data-scale]')){grades.setScale(book,el.value);return;}
  if(el.matches('[data-mode]')){book.mode=el.value==='sek2'?'sek2':'sek1';return;}
  const area=book.areas.find(a=>a.id===d.area),column=area?.columns.find(c=>c.id===d.column);
  if(!area?.active||!column||!data.students.some(s=>s.id===d.student))throw Error('Eintrag hat sich geändert. Bitte erneut auswählen.');
  grades.setScore(book,column,d.student,el.value);
 }).catch(error=>{refresh();status(error.message);});
 // Beim Neuaufbau der Tabelle den Tastaturfokus auf derselben Zelle halten.
 const host=document.getElementById('coursePageContent');
 const selector=d.student?'[data-student="'+CSS.escape(d.student)+'"][data-column="'+CSS.escape(d.column)+'"]':el.matches('[data-mode]')?'[data-mode]':'[data-scale]';
 host.querySelector(selector)?.focus({preventScroll:true});
}
function onClick(event){
 const button=event.target.closest('button');
 if(!button||!page.read().data)return;
 if(page.mode==='kurs'){
  if(!button.closest('.course-roster'))return;
  if(seatViews.get(contentKey)?.isEditing()){status('Bitte den Sitzplanentwurf zuerst speichern oder schließen.');return;}
  if(button.hasAttribute('data-link-class')){page.linkClass?.();return;}
  personEditor(button);return;
 }
 const book=grades.forCourse(page.read().data),d=button.dataset;
 if(d.report){reportEditor(d.report,d.personId);return;}
 const area=book.areas.find(a=>a.id===(d.editArea||d.addColumn||d.area));
 if(button.hasAttribute('data-new-area')||d.editArea)editor('area',area);
 else if(area&&(d.addColumn||d.editColumn))editor('column',area,area.columns.find(c=>c.id===d.editColumn));
}
function reportEditor(period,id){
 const data=page.read().data,original=data.gradebook,book=grades.forCourse(data);
 const person=data.students.find(s=>s.id===id);
 if(!person||!grades.periods(book).includes(period))return;
 const value=grades.results(book,id,period).total;
 const dialog=document.createElement('dialog');dialog.className='grade-dialog';
 dialog.setAttribute('aria-labelledby','gradeReportTitle');
 dialog.innerHTML='<form><h2 id="gradeReportTitle">Zeugnisnote</h2><p>'+esc(person.name)+' · '+periodLabel[period]+'</p><p>Berechneter Vorschlag: '+(value===null?'Unvollständig':format(value))+'</p><label>Manuell festgelegt<select></select></label><div class="grade-actions"><button class="part-button primary">Speichern</button><button type="button" class="part-button" data-cancel>Abbrechen</button></div><p role="status"></p></form>';
 const select=dialog.querySelector('select'),form=dialog.querySelector('form');
 select.add(new Option('Keine Festlegung',''));
 const [min,max]=grades.limits(book.scale);
 for(let n=min;n<=max;n++)select.add(new Option(String(n),String(n)));
 select.value=book.reportMarks?.[period]?.[id]??'';
 form.onsubmit=async e=>{
  e.preventDefault();if(select.disabled)return;
  try{
   if(page.read().data!==data||data.gradebook!==original||!data.students.some(s=>s.id===id))throw Error('Datenstand geändert. Bitte erneut öffnen.');
   select.disabled=true;
   await commit(next=>grades.setReportMark(next,period,id,select.value));
   dialog.close();
  }catch(error){form.querySelector('[role=status]').textContent=error.message;}
  finally{select.disabled=false;}
 };
 form.querySelector('[data-cancel]').onclick=()=>{if(!select.disabled)dialog.close();};
 dialog.oncancel=e=>{if(select.disabled)e.preventDefault();};
 dialog.onclose=()=>{dialog.remove();document.querySelector('[data-report="'+period+'"][data-person-id="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});};
 document.body.append(dialog);dialog.showModal();select.focus();
}
function personEditor(button){
 const data=page.read().data,id=button.dataset.person;
 const person=data.students.find(s=>s.id===id),originalName=person?.name;
 if(id&&!person)return;
 const dialog=document.createElement('dialog');
 dialog.className='grade-dialog';dialog.setAttribute('aria-labelledby','personTitle');
 const nextNumber=Math.max(0,...data.students.map((s,i)=>rosters.numberOf(s,i)))+1;
 const originalNumber=person?rosters.numberOf(person,data.students.indexOf(person)):nextNumber;
 dialog.innerHTML='<form><h2 id="personTitle">'+(person?'Schüler bearbeiten':'Schüler hinzufügen')+'</h2><label>Klassenbuchnummer<input name="number" type="number" required min="1" max="999" step="1"></label><label>Name oder Alias<input name="name" required maxlength="100" autocomplete="off"></label><div class="grade-actions"><button class="part-button primary">Speichern</button><button type="button" class="part-button" data-cancel>Abbrechen</button>'+
  (person?'<button type="button" class="part-button" data-remove>Aus der Schülerliste entfernen</button>':'')+'</div><p role="status"></p></form>';
 const form=dialog.querySelector('form'),input=form.elements.name,numberInput=form.elements.number,feedback=form.querySelector('[role=status]');
 input.value=originalName||'';numberInput.value=originalNumber;
 let busy=false;
 async function apply(remove){
  if(busy)return;
  if(page.read().data!==data||(person&&(!data.students.includes(person)||person.name!==originalName))){
   feedback.textContent='Die Schülerliste hat sich geändert. Bitte erneut öffnen.';return;
  }
  const name=input.value.trim(),number=Number(numberInput.value);
  try{
   if(!remove&&(!name||!Number.isSafeInteger(number)||number<1||number>999)){
    feedback.textContent='Name und Klassenbuchnummer (1–999) eingeben.';return;
   }
   if(remove&&page.isClassRoster?.()){
    if(!confirm('Schüler aus der gesamten Klasse entfernen? Nur ohne Bewertungen und belegte Sitzplätze möglich.'))return;
   }
   const shared=page.editStudent?.({id,remove,name,number})===true;
   if(!shared){
    if(remove){if(!page.removeStudent(data,id))return;}
    else{
     if(data.students.some((s,i)=>s.id!==id&&rosters.numberOf(s,i)===number))throw Error('Diese Klassenbuchnummer ist bereits vergeben.');
     if(person){person.name=name;person.number=number;}
     else data.students.push({id:makeId(),name,number});
    }
   }
  }catch(error){feedback.textContent=error.message;return;}
  busy=true;
  form.querySelectorAll('input,button').forEach(el=>el.disabled=true);
  try{await page.save();status('Schülerliste gespeichert.');}
  catch(error){status('Speichern fehlgeschlagen. Speicherstatus prüfen: '+error.message);}
  finally{refresh();dialog.close();}
 }
 form.onsubmit=event=>{event.preventDefault();apply(false);};
 if(person)form.querySelector('[data-remove]').onclick=()=>apply(true);
 form.querySelector('[data-cancel]').onclick=()=>dialog.close();
 dialog.oncancel=event=>{if(busy)event.preventDefault();};
 dialog.onclose=()=>{
  dialog.remove();
  const focus=id&&document.querySelector('[data-person="'+CSS.escape(id)+'"]');
  (focus||document.querySelector('[data-add-person]'))?.focus({preventScroll:true});
 };
 document.body.append(dialog);dialog.showModal();input.focus();
}
function editor(kind,area,column){
 const data=page.read().data,original=data.gradebook,isArea=kind==='area';
 const book=grades.forCourse(data),areas=book.areas,existing=isArea?area:column;
 const dialog=document.createElement('dialog');dialog.className='grade-dialog';
 dialog.setAttribute('aria-labelledby','gradeEditorTitle');
 const positions=Array.from({length:areas.length+(area?0:1)},(_,i)=>'<option value="'+i+'">'+(i+1)+'</option>').join('');
 dialog.innerHTML='<form><h2 id="gradeEditorTitle">'+(isArea?'Bewertungsbereich':'Leistungsnachweis')+(existing?' bearbeiten':' anlegen')+'</h2>'+
  (isArea?'<label>Name<input name="title" required maxlength="60"></label><label>Gewichtung (%)<input name="weight" type="number" required min="0" max="100" step="0.01"></label><label>Position<select name="position">'+positions+'</select></label><label><input type="checkbox" name="active"> In Gesamtwert einbeziehen</label>':
  '<label>Titel (optional)<input name="title" maxlength="60"></label><label>Datum (optional)<input type="date" name="date"></label><label>Halbjahr<select name="term"><option value="first">1. Halbjahr</option><option value="second">2. Halbjahr</option><option value="">Ohne Zuordnung</option></select></label>')+
  '<div class="grade-actions"><button class="part-button primary">Speichern</button><button type="button" class="part-button" data-cancel>Abbrechen</button>'+
  (existing?'<button type="button" class="part-button" data-remove>Entfernen</button>':'')+'</div><p role="status"></p></form>';
 const form=dialog.querySelector('form'),fields=form.elements;
 fields.title.value=(isArea?area?.name:column?.title)||'';
 if(isArea){
  fields.weight.value=area?.weight??Math.max(0,100-grades.weightTotal(book));
  fields.active.checked=area?.active??true;
  fields.position.value=area?areas.findIndex(a=>a.id===area.id):areas.length;
 }else{
  fields.date.value=column?.date||'';
  fields.term.value=column?(column.term||''):(gradeView==='second'?'second':'first');
 }
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
    item.title=fields.title.value.trim();item.date=fields.date.value;item.term=fields.term.value;
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
window.HblCoursePage={mount,refresh,navigate,syncNavigation,courseTabs,courseSwitcher,renderCourseSwitcher};
})();
