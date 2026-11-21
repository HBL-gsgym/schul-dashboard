/* Kursbezogener Sitzplan mit lokalem Entwurf bis zum Speichern. */
(function(){
'use strict';
const model=window.HblSeating;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,label,disabled=false)=>'<button type="button" class="part-button" data-action="'+action+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
const unitY=22;

window.hblCreateSeatView=function(host,page){
 let source,baseline,rosterKey,draft,names={},undo,preview,selected,seat=0,drag,busy=false;
 let message='';
 function reset(){
  draft=undo=preview=selected=drag=null;names={};seat=0;
 }
 function capture(){return {plan:structuredClone(draft),names:{...names}};}
 function update(fn){
  const before=capture();
  fn();undo=before;message='';render();
 }
 function currentDesk(){return draft?.desks.find(d=>d.id===selected);}
 function pick(id,index){
  selected=id;seat=index;message='';render();
 }
 function focusDesk(){
  const handle=[...host.querySelectorAll('[data-handle]')].find(el=>el.dataset.handle===selected);
  handle?.focus({preventScroll:true});
 }
 function templateTools(room,templates){
  const matches=templates.filter(t=>model.roomKey(t.plan.room)===model.roomKey(room));
  if(!matches.length)return '';
  return '<label>Tischanordnung aus <select data-template>'+matches.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.label)+'</option>').join('')+'</select></label>'+button('copy','Tischanordnung übernehmen');
 }
 function roomEditor(){
  const {rooms,templates}=page.rooms();
  return '<div class="seat-tools"><label>Raum <input data-room list="seat-room-options" maxlength="40" required placeholder="z. B. 226" value="'+esc(draft.room)+'"></label><datalist id="seat-room-options">'+rooms.map(name=>'<option value="'+esc(name)+'"></option>').join('')+'</datalist></div><div class="seat-tools" data-template-tools>'+templateTools(draft.room,templates)+'</div>';
 }
 function render(){
  const data=page.read().data;
  if(draft&&(data!==source||baseline!==data?.seating||rosterKey!==JSON.stringify(data?.students))){
   reset();message='Der Kurs wurde neu geladen. Bitte den aktuellen Sitzplan prüfen.';
  }
  if(!data||data.seating&&data.seating.version!==1){
   host.textContent=data?'Dieser Sitzplan benötigt eine neuere App-Version.':'Kursdaten werden geladen …';return;
  }
  const oldScroll=host.querySelector('.seat-scroll');
  const left=oldScroll?.scrollLeft||0,top=oldScroll?.scrollTop||0;
  const plan=preview||draft||data.seating||model.empty(),editing=!!draft&&!preview;
  const students=data.students||[];
  const person=new Map(students.map(s=>[s.id,Object.hasOwn(names,s.id)?names[s.id]:s.name]));
  const placed=new Set(plan.desks.flatMap(d=>d.seats).filter(id=>person.has(id)));
  const capacity=plan.desks.reduce((n,d)=>n+d.seats.length,0);
  const bottom=plan.desks.reduce((n,d)=>Math.max(n,d.y+model.size(d).h),0);
  const desks=plan.desks.map((d,i)=>{
   const {w,h}=model.size(d);
   const label='Tisch '+(i+1);
   const seats=d.seats.map((id,j)=>{
    const name=person.get(id)||'Frei';
    return editing?'<button type="button" class="seat-place" data-desk="'+esc(d.id)+'" data-index="'+j+'" aria-label="'+label+', Platz '+(j+1)+': '+esc(name)+'" aria-pressed="'+(d.id===selected&&seat===j)+'">'+esc(name)+'</button>':'<span class="seat-place" title="'+esc(name)+'">'+esc(name)+'</span>';
   }).join('');
   const handle=editing?'<button type="button" class="seat-handle" data-handle="'+esc(d.id)+'" aria-label="'+label+' verschieben">'+label+' ↔</button>':'<small>'+label+'</small>';
   return '<div class="seat-desk'+(d.vertical?' vertical':'')+(editing&&d.id===selected?' selected':'')+'" style="left:'+d.x/model.width*100+'%;top:'+d.y*unitY+'px;width:'+w/model.width*100+'%;height:'+h*unitY+'px"><div>'+handle+'<div class="seat-places">'+seats+'</div></div></div>';
  }).join('');
  const controls=!draft?button('edit',capacity?'Sitzplan bearbeiten':'Sitzplan einrichten'):
   preview?button('accept','Verteilung übernehmen')+button('reject','Vorschau verwerfen'):
   button('single','+ Einzeltisch')+button('double','+ Doppeltisch')+button('shuffle','Zufällig verteilen',!students.length||!capacity)+button('undo','Rückgängig',!undo);
  const board='<div class="seat-scroll" tabindex="0" aria-label="Raum mit Sitzplätzen"><div class="seat-room"><div class="seat-front">Tafel</div><div class="seat-board" style="--seat-columns:'+model.width+';height:'+Math.max(220,(bottom+(editing?3:0))*unitY)+'px">'+desks+(capacity?'':'<span class="seat-empty">Noch keine Tische eingerichtet.</span>')+'</div></div></div>';
  const count=students.length-placed.size;
  const summary=capacity+' Plätze · '+placed.size+' belegt'+(count?' · '+count+' ohne Platz':'');
  const room=model.roomName(plan.room);
  const headingRoom=!editing&&room?' · Raum '+esc(room):'';
  host.innerHTML='<div class="seat-heading"><h2>Sitzplan'+headingRoom+'</h2><span>'+summary+'</span></div><fieldset class="seat-fields"'+(busy?' disabled':'')+'>'+(editing?roomEditor():'')+'<div class="seat-tools">'+controls+'</div>'+
   (preview?'<p><strong>Vorschau der Zufallsverteilung</strong></p>':'')+board+
   (count&&capacity?'<details><summary>Ohne Platz ('+count+')</summary><p>'+students.filter(s=>!placed.has(s.id)).map(s=>esc(person.get(s.id))).join(', ')+'</p></details>':'')+
   (editing?inspector(person,students):'')+
   (draft&&capacity<students.length?'<p class="seat-hint">Für die ganze Kursliste fehlen '+(students.length-capacity)+' Plätze.</p>':'')+
   (editing?'<div class="seat-tools">'+button('save','Sitzplan speichern')+button('cancel','Abbrechen')+'</div>':'')+
   '</fieldset><p class="seat-status" role="status"></p>';
  host.querySelector('.seat-status').textContent=message;
  const scroll=host.querySelector('.seat-scroll');scroll.scrollLeft=left;scroll.scrollTop=top;
 }
 function inspector(person,students){
  const desk=currentDesk();
  if(!desk)return '';
  const index=draft.desks.indexOf(desk)+1,id=desk.seats[seat],name=person.get(id);
  const options=students.map(s=>'<option value="'+esc(s.id)+'"'+(s.id===id?' selected':'')+'>'+esc(person.get(s.id))+'</option>').join('');
  return '<div class="seat-inspector"><strong>Tisch '+index+'</strong><div class="seat-tools"><label>Spalte <input data-col type="number" step="1" min="1" max="'+(model.width-model.size(desk).w+1)+'" value="'+(desk.x+1)+'"></label><label>Reihe <input data-row type="number" min="1" step="1" value="'+(desk.y+1)+'"></label>'+button('move','Verschieben')+(desk.seats.length===2?button('rotate','Drehen'):'')+button('remove','Tisch entfernen')+'</div>'+
   '<div class="seat-tools"><label>Platz '+(seat+1)+' besetzen <select data-assign><option value="">Frei</option>'+options+'</select></label>'+
   (name!==undefined?'<label>Name <input data-name maxlength="100" value="'+esc(name)+'"></label>'+button('rename','Namen übernehmen'):'')+'</div></div>';
 }
 async function save(){
  if(!draft||busy)return;
  draft.room=model.roomName(draft.room);
  if(!draft.room){
   message='Bitte einen Raum für diesen Sitzplan eingeben oder auswählen.';
   render();host.querySelector('[data-room]')?.focus();return;
  }
  const data=page.read().data;
  if(source!==data||baseline!==data.seating||rosterKey!==JSON.stringify(data.students)){render();return;}
  busy=true;
  data.seating=structuredClone(draft);baseline=data.seating;
  for(const s of data.students)if(Object.hasOwn(names,s.id))s.name=names[s.id];
  rosterKey=JSON.stringify(data.students);
  // Der bestehende Speicherweg hält den bearbeiteten Stand auch bei Cloud-Konflikten lokal vor.
  reset();message='Speichert …';render();
  try{await page.save();message='Sitzplan gespeichert.';}
  catch(error){message='Speichern fehlgeschlagen. Speicherstatus und lokale Sicherung prüfen: '+error.message;}
  finally{busy=false;render();}
 }
 host.addEventListener('click',event=>{
  if(busy)return;
  const el=event.target.closest('button');if(!el)return;
  if(el.hasAttribute('data-handle')){pick(el.dataset.handle,0);focusDesk();return;}
  if(el.hasAttribute('data-desk')){pick(el.dataset.desk,Number(el.dataset.index));host.querySelector('[data-assign]')?.focus({preventScroll:true});return;}
  const desk=currentDesk(),data=page.read().data;
  try{
   switch(el.dataset.action){
    case 'edit':
     source=data;baseline=data.seating;rosterKey=JSON.stringify(data.students);
     draft=structuredClone(baseline||model.empty());
     draft.room=model.roomName(draft.room)||page.rooms().suggested;
     message='';render();break;
    case 'copy':{
     const id=host.querySelector('[data-template]')?.value;
     const template=page.rooms().templates.find(t=>t.id===id);
     if(!template)throw Error('Die gewählte Tischanordnung ist nicht mehr verfügbar.');
     if(draft.desks.length&&!confirm('Tische und Sitzverteilung im Entwurf ersetzen? Die übernommenen Plätze sind leer.'))break;
     update(()=>{model.copyLayout(draft,template.plan,()=>crypto.randomUUID());selected=null;seat=0;});
     break;
    }
    case 'single':case 'double':
     update(()=>{selected=model.add(draft,el.dataset.action==='single'?1:2,crypto.randomUUID()).id;seat=0;});focusDesk();break;
    case 'move':update(()=>model.move(draft,desk,host.querySelector('[data-col]').valueAsNumber-1,host.querySelector('[data-row]').valueAsNumber-1));focusDesk();break;
    case 'rotate':update(()=>model.rotate(draft,desk));focusDesk();break;
    case 'remove':update(()=>{draft.desks=draft.desks.filter(d=>d!==desk);selected=null;});break;
    case 'rename':{
     const value=host.querySelector('[data-name]').value.trim();
     if(!value)throw Error('Bitte einen Namen eingeben.');
     update(()=>{names={...names,[desk.seats[seat]]:value};});break;
    }
    case 'shuffle':preview=model.shuffledPlan(draft,data.students);message='';render();break;
    case 'accept':update(()=>{draft=preview;preview=null;});break;
    case 'reject':preview=null;message='';render();break;
    case 'undo':draft=undo.plan;names=undo.names;undo=null;selected=null;message='';render();break;
    case 'cancel':reset();message='';render();break;
    case 'save':save();break;
   }
  }catch(error){message=error.message;render();}
 });
 host.addEventListener('input',event=>{
  if(!event.target.matches('[data-room]')||!draft)return;
  draft.room=event.target.value;
  host.querySelector('[data-template-tools]').innerHTML=templateTools(draft.room,page.rooms().templates);
  host.querySelector('.seat-status').textContent='';
 });
 host.addEventListener('change',event=>{
  if(!event.target.matches('[data-assign]'))return;
  update(()=>model.assign(draft,currentDesk(),seat,event.target.value||null));
  host.querySelector('[data-assign]')?.focus({preventScroll:true});
 });
 function point(event){
  const rect=drag.board.getBoundingClientRect();
  return {x:Math.round((event.clientX-rect.left-drag.offsetX)/rect.width*model.width),y:Math.round((event.clientY-rect.top-drag.offsetY)/unitY)};
 }
 host.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-handle]');
  if(!handle||busy||!event.isPrimary||event.button!==0)return;
  const element=handle.closest('.seat-desk'),rect=element.getBoundingClientRect();
  drag={id:event.pointerId,table:handle.dataset.handle,board:host.querySelector('.seat-board'),element,
   offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,startX:event.clientX,startY:event.clientY,moved:false};
  handle.setPointerCapture(event.pointerId);
 });
 host.addEventListener('pointermove',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>4)drag.moved=true;
  if(!drag.moved)return;
  const desk=draft.desks.find(d=>d.id===drag.table),{x,y}=point(event);
  drag.element.style.left=x/model.width*100+'%';drag.element.style.top=y*unitY+'px';
  drag.element.classList.toggle('blocked',!model.fits(draft,desk,x,y));
 });
 host.addEventListener('pointerup',event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const active=drag,{x,y}=point(event);drag=null;
  if(!active.moved)return;
  selected=active.table;seat=0;
  try{update(()=>model.move(draft,currentDesk(),x,y));}
  catch(error){message=error.message;render();}
  focusDesk();
 });
 host.addEventListener('pointercancel',()=>{if(drag){drag=null;render();}});
 return {render};
};
})();
