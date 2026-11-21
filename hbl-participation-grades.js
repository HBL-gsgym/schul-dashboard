/* Mitarbeitsnoten pro Halbjahr: laufender Vorschlag, manuell bestätigte Momentaufnahme.
   Kein weiterer Speicherort: verbleibt pro Fachkurs im privaten Snapshot. */
(function(root){
'use strict';
const RATINGS={'++':1,'+':2,'0':3,'-':4,'--':5};
const TERMS=['first','second'];
const copy=value=>JSON.parse(JSON.stringify(value));
function day(date){return Math.floor(Date.parse(date+'T12:00:00Z')/86400000);}
function iso(n){return new Date(n*86400000).toISOString().slice(0,10);}
function isFinalUpperSecondaryCourse(meta){
 if(meta?.finalUpperSecondary===true)return true;
 if(meta?.finalUpperSecondary===false)return false;
 // Pilot: Goethe-Schiller-Gymnasium, Abschlussjahrgang 12.
 // Andere Schulformen benötigen eine ausdrücklich gesetzte Kennzeichnung.
 if(meta?.schoolType&&String(meta.schoolType).trim().toLocaleLowerCase('de-DE')!=='gymnasium')return false;
 const group=String(meta?.group||'').trim();
 return /(?:^|[^0-9])12(?:$|[^0-9])/.test(group)||/(?:^|[^a-z0-9])q[34](?:$|[^a-z0-9])/i.test(group);
}
function yearBounds(year){
 if(!year||!year.start||!year.end)throw Error('Schuljahresdaten fehlen.');
 // Brandenburg VV-Schulbetrieb Nr. 6 Abs. 3: regulär Beginn Winterferien,
 // im letzten Jahrgang der gymnasialen Oberstufe Beginn Weihnachtsferien.
 const type=year.finalUpperSecondary===true?'Weihnachtsferien':'Winterferien';
 const vacation=(year.vacations||[]).find(v=>v.name?.toLocaleLowerCase('de-DE')===type.toLocaleLowerCase('de-DE'));
 const secondStart=vacation?.start;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(secondStart||'')||
    !(secondStart>year.start&&secondStart<=year.end))
  throw Error('Beginn des 2. Halbjahres ('+type+') im Schuljahreskalender nicht hinterlegt.');

 return {first:{start:year.start,end:iso(day(secondStart)-1)},
         second:{start:secondStart,end:year.end}};
}
function termForDate(year,date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||''))return null;
 const bounds=yearBounds(year);
 return date>=bounds.first.start&&date<=bounds.first.end?'first':
  date>=bounds.second.start&&date<=bounds.second.end?'second':null;
}
function activeSegment(data,year,date){
 const term=termForDate(year,date),items=segments(data,year);
 if(term)return items.find(s=>s.term===term&&date>=s.start&&date<=s.end)||null;
 const bounds=yearBounds(year);
 return date<bounds.first.start?items[0]||null:
  date>bounds.second.end?items.at(-1)||null:null;
}
function evenStarts(start,end,count){
 const span=day(end)-day(start)+1;
 if(count>span)throw Error('Mehr Abschnitte als Kalendertage.');
 return Array.from({length:count},(_,i)=>iso(day(start)+Math.floor(span*i/count)));
}
function defaultState(year){
 const bounds=yearBounds(year);
 return {version:1,first:{starts:[bounds.first.start],confirmed:{},overrides:{}},
  second:{starts:[bounds.second.start],confirmed:{},overrides:{}}};
}
function read(data,year){
 const saved=data?.participationGrades;
 if(saved&&saved.version!==1)throw Error('Unbekanntes Mitarbeitsnoten-Format. Keine Änderung vorgenommen.');
 const state=saved?copy(saved):defaultState(year);
 const bounds=yearBounds(year);
 // Vor v7.3 gespeicherte 12er-Kurse haben u. U. den Winterferienbeginn.
 // Nur den sicheren ersten Starttermin korrigieren; bestätigte Werte und
 // manuelle Abweichungen bleiben unangetastet und werden ggf. als geändert angezeigt.
 if(saved&&year.finalUpperSecondary===true){
  const winter=(year.vacations||[]).find(v=>/winterferien/i.test(v.name));
  if(state.second?.starts?.[0]===winter?.start){
   const newStart=bounds.second.start;
   if(state.first?.starts?.some((start,i)=>i>0&&start>bounds.first.end)||
      state.second.starts.slice(1).some(start=>start<=newStart))
    throw Error('Alte Abschnittsgrenzen überschneiden den korrigierten Halbjahreswechsel. Bitte diese Kursdaten vor einer automatischen Umstellung prüfen.');
   state.second.starts[0]=newStart;
  }
 }

 for(const term of TERMS){
  const p=state[term];
  if(!p||!Array.isArray(p.starts)||p.starts.length>6||p.starts.some(x=>typeof x!=='string'))
   throw Error('Mitarbeitsnoten benötigen eine neuere App-Version.');
  p.confirmed??={};p.overrides??={};
  // Alte, freie Schuljahresgrenzen werden nur über Benutzerinteraktion geändert.
  if(p.starts.length&&p.starts[0]!==bounds[term].start)
   throw Error('Schuljahresgrenzen geändert; Mitarbeitsnoten bitte prüfen.');
  for(let i=1;i<p.starts.length;i++)if(!(p.starts[i]>p.starts[i-1]&&p.starts[i]<=bounds[term].end))
   throw Error('Ungültige Abschnittsgrenzen.');
 }
 return state;
}
function ensure(data,year){
 const current=read(data,year);
 // Erst bei einer schreibenden Aktion den normalisierten Zustand übernehmen.
 // Bestätigungen samt ursprünglicher Signatur und allen IDs bleiben erhalten.
 if(!data.participationGrades||JSON.stringify(data.participationGrades)!==JSON.stringify(current))
  data.participationGrades=current;
 return data.participationGrades;
}
function segments(data,year){
 const state=read(data,year),bounds=yearBounds(year);
 return TERMS.flatMap(term=>{
  const starts=state[term].starts;
  return starts.map((start,index)=>({
   id:term+'-'+(index+1),term,index,start,
   end:index+1<starts.length?iso(day(starts[index+1])-1):bounds[term].end,
   label:(term==='first'?'1.':'2.')+' HJ · MA '+(index+1)
  }));
 });
}
/** Wählt die MA-Phase aus dem ANGEZEIGTEN Monat, nicht aus dem heutigen Tag.
 * Eine Auswahl ist nur bei mehreren Abschnitten des sichtbaren Zeitraums nötig.
 * Auch „gesamtes Schuljahr“ und Monate mit einem Halbjahreswechsel bleiben bedienbar.
 */
function selectForView(data,year,view,today,preferredId=''){
 const all=segments(data,year);
 let options,anchor;
 if(view==='all'){
  options=all;
  anchor=today;
 }else if(/^\d{4}-(0[1-9]|1[0-2])$/.test(view)){
  const start=view+'-01';
  const [y,m]=view.split('-').map(Number);
  const end=new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
  options=all.filter(s=>s.start<=end&&s.end>=start);
  // Im Übergangsmonat des GK12 bevorzugt den Abschnitt des letzten
  // angezeigten Unterrichtstermins; ohne Termine den Monatsletzten.
  const shown=(data?.dates||[]).filter(d=>d?.date>=start&&d.date<=end&&
   options.some(s=>d.date>=s.start&&d.date<=s.end)).map(d=>d.date).sort();
  anchor=shown.at(-1)||end;
 }else{
  throw Error('Ungültiger Ansichtsmonat für die Mitarbeit.');
 }
 const selected=options.find(s=>s.id===preferredId)||
  options.find(s=>anchor>=s.start&&anchor<=s.end)||
  (view==='all'?activeSegment(data,year,today):null)||
  options.at(-1)||null;
 return {selected,options,showPicker:options.length>1,
  spansBothTerms:new Set(options.map(s=>s.term)).size>1};
}
function setCount(data,year,term,count){
 if(!TERMS.includes(term)||!Number.isSafeInteger(count)||count<0||count>6)throw Error('Pro Halbjahr sind 0–6 Noten möglich.');
 const current=read(data,year)[term],old=current.starts.length;
 if(old===count)return;
 if(count<old){
  for(let i=count;i<old;i++){
   const sid=term+'-'+(i+1);
   if(Object.keys(current.confirmed?.[sid]||{}).length)throw Error('MA '+(i+1)+' enthält bestätigte Noten. Vor dem Entfernen Bestätigungen aufheben.');
   if(Object.keys(current.overrides?.[sid]||{}).length)throw Error('MA '+(i+1)+' enthält manuelle Notenvorschläge. Zuerst löschen.');
  }
 }
 const state=ensure(data,year)[term],limits=yearBounds(year)[term];
 state.starts=evenStarts(limits.start,limits.end,count);
}
function setBoundary(data,year,term,index,start){
 const state=read(data,year),starts=state[term]?.starts;
 if(!TERMS.includes(term)||!Number.isInteger(index)||index<=0||index>=starts?.length)throw Error('Unbekannte Abschnittsgrenze.');
 const bounds=yearBounds(year)[term];
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||start<=starts[index-1]||start>= (starts[index+1]||iso(day(bounds.end)+1)))
  throw Error('Abschnittsgrenze muss zwischen den benachbarten Abschnitten liegen.');
 ensure(data,year)[term].starts[index]=start;
}
const isMark=value=>Object.hasOwn(RATINGS,value);
function proposal(data,year,segment,studentId,scale='grades'){
 const values=(data?.dates||[]).filter(d=>d.date>=segment.start&&d.date<=segment.end)
  .map(d=>({date:d.date,id:d.id,rating:data.marks?.[studentId]?.[d.id]?.rating}))
  .filter(d=>isMark(d.rating)).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
 const avg=values.length?values.reduce((sum,v)=>sum+RATINGS[v.rating],0)/values.length:null;
 const state=read(data,year)[segment.term];
 const manual=state.overrides?.[segment.id]?.[studentId];
 const limits=scale==='points'?[0,15]:[1,6];
 const candidate=Number.isInteger(manual)&&manual>=limits[0]&&manual<=limits[1]?manual:
  scale==='grades'&&avg!==null?Math.round(avg):null;
 const fingerprint=JSON.stringify({start:segment.start,end:segment.end,marks:values,manual:manual??null,scale});
 const previous=state.confirmed?.[segment.id]?.[studentId];
 const status=!previous?'provisional':previous.signature===fingerprint?'confirmed':'changed';
 return {avg,count:values.length,candidate,confirmed:previous?.value??null,status,
  signature:fingerprint,confirmedAt:previous?.confirmedAt||null,manual:manual??null};
}
function setOverride(data,year,segment,studentId,value,scale='grades'){
 const limits=scale==='points'?[0,15]:[1,6];
 if(value!==''&&(!/^\d+$/.test(String(value))||Number(value)<limits[0]||Number(value)>limits[1]))
  throw Error('Die Note passt nicht zur Kursskala.');
 const s=ensure(data,year)[segment.term],set=s.overrides[segment.id]??={};
 if(value==='')delete set[studentId];
 else set[studentId]=Number(value);
}
function confirm(data,year,segment,studentId,scale='grades'){
 const p=proposal(data,year,segment,studentId,scale);
 if(p.candidate===null)throw Error('Ohne Beobachtungen oder manuelle Notenfestlegung ist keine Bestätigung möglich.');
 if(!(data.students||[]).some(student=>student.id===studentId))throw Error('Schüler-ID nicht gefunden.');
 const s=ensure(data,year)[segment.term],set=s.confirmed[segment.id]??={};
 set[studentId]={value:p.candidate,signature:p.signature,confirmedAt:new Date().toISOString()};
 return p.candidate;
}
function unconfirm(data,year,segment,studentId){
 const set=ensure(data,year)[segment.term].confirmed?.[segment.id];
 if(set)delete set[studentId];
}
// Die Mitarbeit hat ab v7.4 keine eigene Gewichtung. Der gespeicherte frühere
// participationWeight-Wert bleibt als Altbestand erhalten, wird aber nie addiert.
function areaId(book){return typeof book?.participationAreaId==='string'?book.participationAreaId:'';}
function setArea(book,id){
 if(typeof id!=='string')throw Error('Ungültige Notenkategorie.');
 if(id&&!book?.areas?.some(area=>area.id===id&&area.active))
  throw Error('Bitte einen vorhandenen aktiven Bewertungsbereich auswählen.');
 if(id)book.participationAreaId=id;
 else delete book.participationAreaId;
}
function targetArea(book){return book?.areas?.find(a=>a.id===areaId(book))||null;}
function gradeArea(data,book,year,preview=false){
 const scale=book?.scale||'grades';
 const columns=segments(data,year).map(s=>{
  const scores={},display={};
  for(const student of data.students||[]){
   const p=proposal(data,year,s,student.id,scale);
   const value=preview?p.candidate:p.confirmed;
   if(value!==null)scores[student.id]=value;
   display[student.id]=p;
  }
  return {id:'hbl-ma-'+s.id,title:'MA '+(s.index+1),term:s.term,scores,linked:true,display,segment:s};
 });
 return {id:'hbl-participation',name:'Mitarbeit',active:true,linked:true,columns};
}
function linkedBook(data,book,year,preview=false){
 const selected=targetArea(book);
 if(!selected)return {...book,areas:[...(book.areas||[])]};
 const linked=gradeArea(data,book,year,preview).columns;
 return {...book,areas:(book.areas||[]).map(area=>area.id===selected.id?
  {...area,columns:[...(area.columns||[]),...linked]}:area)};
}
function hasStudent(data,id){
 const g=data?.participationGrades;
 return !!g&&TERMS.some(t=>Object.values(g[t]?.confirmed||{}).some(set=>Object.hasOwn(set,id))||
  Object.values(g[t]?.overrides||{}).some(set=>Object.hasOwn(set,id)));
}
const model={isFinalUpperSecondaryCourse,yearBounds,termForDate,activeSegment,segments,selectForView,read,ensure,setCount,setBoundary,proposal,setOverride,confirm,unconfirm,
 areaId,setArea,targetArea,gradeArea,linkedBook,hasStudent};
if(typeof module!=='undefined'&&module.exports)module.exports=model;
else root.HblParticipationGrades=model;
})(typeof window==='undefined'?globalThis:window);
