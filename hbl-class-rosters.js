/* HBL: Klassenbuchnummern und klassenweit gemeinsame Schüleridentitäten im privaten Snapshot.
   Fachkurs-Bewertungen, Mitarbeit und Sitzpläne bleiben pro Kurs getrennt. */
(function(root){
'use strict';
const normal=value=>String(value??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
const clone=value=>JSON.parse(JSON.stringify(value));
const validNumber=value=>Number.isSafeInteger(Number(value))&&Number(value)>0&&Number(value)<=999;
const numberOf=(student,index)=>validNumber(student?.number)?Number(student.number):index+1;
const sorted=students=>(students||[]).slice().sort((a,b)=>a.number-b.number||a.id.localeCompare(b.id));
function key(meta,year){
 const group=normal(meta?.group).replace(/^(\d{1,2})\s+([a-z]{1,2})$/,'$1$2');
 // Fach- und jahrgangsübergreifende Oberstufenkurse nicht als Klassen behandeln.
 return /^\d{1,2}[a-z]{1,2}$/.test(group)?String(meta.schoolYear||year)+'|'+group:null;
}
const ready=(snapshot)=>snapshot.__classRostersV1??={version:1,classes:{}};
const hasRecords=(data,id)=>!!(Object.keys(data?.marks?.[id]||{}).length||
 data?.finals?.[id]!=null||
 data?.gradebook?.areas?.some(a=>a.columns?.some(c=>Object.hasOwn(c.scores||{},id)))||
 Object.values(data?.gradebook?.reportMarks||{}).some(m=>Object.hasOwn(m,id))||
 ['first','second'].some(t=>Object.values(data?.participationGrades?.[t]?.confirmed||{}).some(m=>Object.hasOwn(m,id))||
  Object.values(data?.participationGrades?.[t]?.overrides||{}).some(m=>Object.hasOwn(m,id)))||
 data?.seating?.desks?.some(d=>d.seats?.includes(id)));
const placeholder=name=>/^Schüler\s+\d+$/i.test(String(name||''));
function normalizeStudents(students,newId){
 const used=new Set();
 return (students||[]).map((student,index)=>{
  let number=numberOf(student,index);
  while(used.has(number))number++;
  used.add(number);
  return {id:student.id||newId(),name:String(student.name||'Schüler '+number).trim(),number};
 });
}
function relink(data,map){
 // Neue Referenzen erst in einer Kopie prüfen, damit ein Konflikt keine halbe Umstellung hinterlässt.
 const draft=clone({marks:data.marks,finals:data.finals,gradebook:data.gradebook,
  participationGrades:data.participationGrades,seating:data.seating});
 const move=record=>{
  if(!record||typeof record!=='object')return;
  for(const [before,after] of map){
   if(before===after||!Object.hasOwn(record,before))continue;
   if(Object.hasOwn(record,after))throw Error('Bewertungskonflikt bei der Zusammenführung.');
   record[after]=record[before];delete record[before];
  }
 };
 move(draft.marks);move(draft.finals);
 for(const area of draft.gradebook?.areas||[])for(const column of area.columns||[])move(column.scores);
 for(const period of Object.values(draft.gradebook?.reportMarks||{}))move(period);
 for(const t of ['first','second']){
  for(const set of Object.values(draft.participationGrades?.[t]?.confirmed||{}))move(set);
  for(const set of Object.values(draft.participationGrades?.[t]?.overrides||{}))move(set);
 }
 for(const desk of draft.seating?.desks||[])desk.seats=desk.seats.map(id=>map.get(id)||id);
 for(const field of ['marks','finals','gradebook','participationGrades','seating'])
  if(Object.hasOwn(draft,field))data[field]=draft[field];
}
function match(student,target,byTarget,used,existingIds){
 const exact=byTarget.get(student.id);
 if(exact)return used.has(exact.id)?null:exact;
 const alias=normal(student.name);
 const matches=alias?target.filter(candidate=>!existingIds.has(candidate.id)&&normal(candidate.name)===alias):[];
 const unique=matches.length===1?matches[0]:null;
 return unique&&!used.has(unique.id)?unique:null;
}
function compatible(data,target){
 const current=Array.isArray(data.students)?data.students:[];
 const map=new Map(),used=new Set(),byTarget=new Map(target.map(s=>[s.id,s]));
 if(!current.length){
  if(Object.keys(data.marks||{}).length||Object.keys(data.finals||{}).length||
    data.gradebook?.areas?.some(a=>a.columns?.some(c=>Object.keys(c.scores||{}).length))||
    data.seating?.desks?.some(d=>d.seats?.some(Boolean))||
    ['first','second'].some(t=>Object.values(data.participationGrades?.[t]?.confirmed||{}).some(o=>Object.keys(o).length)||
     Object.values(data.participationGrades?.[t]?.overrides||{}).some(o=>Object.keys(o).length)))return null;
  return map;
 }
 const existingIds=new Set(current.map(person=>person.id));
 for(const person of current){
  const chosen=match(person,target,byTarget,used,existingIds);
  if(chosen){map.set(person.id,chosen.id);used.add(chosen.id);continue;}
  // Unbewertete Pseudoplatzhalter dürfen entfallen; benannte/benutzte Personen nicht.
  if(!hasRecords(data,person.id)&&placeholder(person.name))continue;
  return null;
 }
 return map;
}
function align(data,target,newId){
 const mapping=compatible(data,target);
 if(mapping===null)return false;
 relink(data,mapping);
 data.students=clone(target);
 data.initialized=true;
 return true;
}
function ensure(snapshot,catalog,year,newId){
 if(!snapshot||typeof snapshot!=='object')throw Error('Kein gültiger Speicherstand.');
 const rosters=ready(snapshot).classes;
 const classes=snapshot.__participation?.classes||{};
 let changed=false;
 const conflicts=[];
 const groups=new Map();
 for(const [courseId,meta] of Object.entries(catalog?.courses||{})){
  const k=key(meta,year);if(!k)continue;
  if(!groups.has(k))groups.set(k,[]);
  groups.get(k).push({courseId,meta,data:classes[courseId]});
 }
 for(const [k,group] of groups){
  let roster=rosters[k];
  if(!roster){
   const choices=group.filter(g=>g.data?.students?.length)
     .sort((a,b)=>{
      const named=g=>g.data.students.filter(s=>!placeholder(s.name)).length;
      return named(b)-named(a)||b.data.students.length-a.data.students.length||a.courseId.localeCompare(b.courseId);
     });
   const source=choices[0]?.data?.students||[];
   roster={group:group[0].meta.group,schoolYear:k.split('|')[0],students:normalizeStudents(source,newId)};
   // Standard-Platzhalter einmal je Klasse, nicht ein zweites Mal pro Fach.
   if(!roster.students.length)roster.students=Array.from({length:30},(_,i)=>({id:newId(),name:'Schüler '+(i+1),number:i+1}));
   rosters[k]=roster;changed=true;
  }
  const normalized=normalizeStudents(roster.students,newId);
  if(JSON.stringify(roster.students)!==JSON.stringify(normalized)){roster.students=normalized;changed=true;}
  const ordered=sorted(roster.students);
  if(JSON.stringify(roster.students)!==JSON.stringify(ordered))changed=true;
  roster.students=ordered;
  for(const {courseId,data} of group){
   if(!data)continue;
   const before=JSON.stringify(data.students||[]);
   const existing=compatible(data,roster.students);
   if(existing===null){conflicts.push({courseId,classKey:k});continue;}
   // Sogar unbenotete Tischbelegung wird über die sichere Identitätszuordnung umgestellt.
   const remap=[...existing].some(([from,to])=>from!==to);
   if(before!==JSON.stringify(roster.students)||remap){
    try{
     if(!align(data,roster.students,newId)){conflicts.push({courseId,classKey:k});continue;}
     changed=true;
    }catch(_){
     // Orphan-Bewertungen oder doppelte IDs lassen wir ohne Teilmigration bestehen.
     conflicts.push({courseId,classKey:k});
    }
   }
  }
 }
 return {changed,conflicts};
}
function membership(snapshot,catalog,courseId,year){
 const meta=catalog?.courses?.[courseId],k=key(meta,year);
 return k?{key:k,roster:ready(snapshot).classes[k],classes:snapshot.__participation?.classes||{}}:null;
}
function courseMembers(catalog,year,k){
 return Object.entries(catalog?.courses||{}).filter(([,meta])=>key(meta,year)===k).map(([id])=>id);
}
function linked(data,students){
 const ids=new Set(students.map(s=>s.id));
 return Array.isArray(data?.students)&&data.students.every(s=>ids.has(s.id));
}
function propagate(snapshot,catalog,year,k,students,previousIds=new Set(students.map(s=>s.id))){
 const classes=snapshot.__participation?.classes||{};
 for(const id of courseMembers(catalog,year,k)){
  const data=classes[id];if(!data)continue;
  if(data.students?.length&&!data.students.every(s=>previousIds.has(s.id)))continue; // ungelöste Altzuordnung nicht verändern
  data.students=clone(sorted(students));data.initialized=true;
 }
}
function edit(snapshot,catalog,courseId,year,change,newId){
 ensure(snapshot,catalog,year,newId);
 const m=membership(snapshot,catalog,courseId,year);
 if(!m?.roster)throw Error('Dieser Kurs ist keine eindeutige Klasse.');
 const current=m.classes[courseId];
 if(current?.students?.length&&!linked(current,m.roster.students))
  throw Error('Die bestehende Kursliste muss zuerst mit der Klasse abgeglichen werden.');
 const students=m.roster.students,previousIds=new Set(students.map(s=>s.id));
 const existing=change.id?students.find(s=>s.id===change.id):null;
 if(change.id&&!existing)throw Error('Schüler nicht gefunden.');
 if(change.remove){
  if(!existing)return;
  for(const id of courseMembers(catalog,year,m.key)){
   if(hasRecords(m.classes[id],existing.id))throw Error('Schüler hat Bewertungen oder einen Sitzplatz in '+(catalog.courses[id]?.subject||'einem Fachkurs')+'. Bitte zuerst dort prüfen.');
  }
  m.roster.students=students.filter(s=>s!==existing);
 }else{
  const name=String(change.name||'').trim(),number=Number(change.number);
  if(!name||name.length>100)throw Error('Bitte einen Namen oder Alias mit höchstens 100 Zeichen eingeben.');
  if(!validNumber(number))throw Error('Klassenbuchnummer von 1 bis 999 eingeben.');
  if(students.some(s=>s.id!==existing?.id&&s.number===number))throw Error('Diese Klassenbuchnummer ist bereits vergeben.');
  if(existing)Object.assign(existing,{name,number});
  else students.push({id:newId(),name,number});
 }
 propagate(snapshot,catalog,year,m.key,m.roster.students,previousIds);
 return sorted(m.roster.students);
}
function importNames(snapshot,catalog,courseId,year,names,newId){
 ensure(snapshot,catalog,year,newId);
 const m=membership(snapshot,catalog,courseId,year);
 if(!m?.roster)throw Error('Dieser Fachkurs gehört nicht zu einer eindeutigen Klasse.');
 if(m.classes[courseId]?.students?.length&&!linked(m.classes[courseId],m.roster.students))
  throw Error('Die bestehende Kursliste muss zuerst abgeglichen werden.');
 const list=m.roster.students,previousIds=new Set(list.map(s=>s.id));
 importByNumber(list,names,newId);
 propagate(snapshot,catalog,year,m.key,list,previousIds);
 return list.length;
}
function importByNumber(students,names,newId){
 if(!Array.isArray(names)||names.length>999||!names.some(n=>String(n||'').trim()))
  throw Error('Bitte eine Klassenliste mit bis zu 999 Zeilen eingeben.');
 const rows=names.map(raw=>String(raw||'').trim());
 const invalid=rows.findIndex(name=>name.length>100);
 if(invalid!==-1)throw Error('Ungültiger Name in Zeile '+(invalid+1)+'.');
 const byNumber=new Map();
 for(const [index,student] of students.entries()){
  const number=numberOf(student,index);
  if(byNumber.has(number))throw Error('Klassenbuchnummer '+number+' ist mehrfach vergeben. Bitte zuerst korrigieren.');
  byNumber.set(number,student);
 }
 for(const [index,name] of rows.entries()){
  if(!name)continue; // Die Zeilennummer bleibt auch bei Leerzeilen erhalten.
  const number=index+1,student=byNumber.get(number);
  if(student)student.name=name;
  else students.push({id:newId(),name,number});
 }
}
function firstFreeNumber(students){
 const occupied=new Set(students.map(numberOf));
 for(let number=1;number<=999;number++)if(!occupied.has(number))return number;
 return null;
}
function linkByNumber(snapshot,catalog,courseId,year){
 const m=membership(snapshot,catalog,courseId,year);
 if(!m?.roster)throw Error('Keine zentrale Klassenliste vorhanden.');
 const data=m.classes[courseId],master=m.roster.students;
 if(!data)return false;
 const map=new Map(),seen=new Set();
 for(const [i,p] of (data.students||[]).entries()){
  const number=numberOf(p,i),target=master.find(x=>x.number===number);
  if(!target){
   if(hasRecords(data,p.id))throw Error('Für Nummer '+number+' existieren Daten, aber kein Schüler in der zentralen Klassenliste.');
   continue;
  }
  if(seen.has(target.id))throw Error('Klassenbuchnummer '+number+' ist im Fachkurs doppelt vergeben.');
  seen.add(target.id);map.set(p.id,target.id);
 }
 relink(data,map);
 data.students=clone(sorted(master));data.initialized=true;
 return true;
}
const api={key,sorted,numberOf,ensure,membership,edit,importNames,importByNumber,firstFreeNumber,linkByNumber,hasRecords};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.HblClassRosters=api;
})(typeof window==='undefined'?globalThis:window);
