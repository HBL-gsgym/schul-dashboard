/* Persönliche Kursidentitäten; keine schulweiten Zugriffsrechte. */
(function(root){
'use strict';
const lower=s=>String(s??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('de-DE');
function subject(s){const x=lower(s),aliases={mathematik:'ma',math:'ma',ma:'ma',mathe:'ma',physik:'ph',ph:'ph',astronomie:'astro',astro:'astro','physik gk':'gkph1',gkphysik:'gkph1','gk physik':'gkph1',gkph1:'gkph1'};return Object.hasOwn(aliases,x)?aliases[x]:x;}
const key=e=>subject(e?.subject)+'|'+lower(e?.group);
const legacy={'ma|9a':'ma9a','ph|9a':'ph9a','gkph1|12':'gkph12','astro|10':'astro10','wat|8a':'wat8a','wat|8b':'wat8b','wat|8c':'wat8c','wat|9a':'wat9a','wat|9c':'wat9c','wat|9d':'wat9d'};
function legacyId(e){const k=key(e);let h=2166136261;for(const c of k){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return legacy[k]||'kurs-'+(h>>>0).toString(36);}
const valid=id=>typeof id==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id)&&!['constructor','prototype','__proto__'].includes(id);
const id=e=>valid(e?.courseId)?e.courseId:legacyId(e);
function entries(slots){return Object.values(slots||{}).flatMap(pair=>['A','B'].map(w=>pair?.[w]).filter(e=>e?.subject&&e?.group));}
function candidates(slots,classes){
 const map=new Map();
 const add=(e,i)=>{const k=key(e);if(!map.has(k))map.set(k,new Set());map.get(k).add(i);};
 for(const e of entries(slots))add(e,id(e));
 for(const [i,c] of Object.entries(classes||{}))if(valid(i)&&c?.meta)add({subject:c.meta.label,group:c.meta.group},i);
 return map;
}
function ensure(slots,{knownSlots={},classes={},migrate=false,newId=()=> 'kurs-'+root.crypto.randomUUID()}={}){
 const result=JSON.parse(JSON.stringify(slots||{})),known=candidates(knownSlots,classes);
 // Explicit identities win; never combine two identified courses by their name.
 for(const e of entries(result))if(valid(e.courseId)){
  const k=key(e);if(!known.has(k))known.set(k,new Set());known.get(k).add(e.courseId);
 }
 const occupied=new Set([...known.values()].flatMap(v=>[...v]));
 for(const e of entries(result)){
  if(valid(e.courseId))continue;
  const matches=known.get(key(e));
  if(matches?.size>1)throw Error('Mehrere Kurse heißen gleich. Bitte einen vorhandenen Kurs im Blockeditor auswählen.');
  let selected=matches?.size===1?[...matches][0]:migrate?legacyId(e):newId();
  if(!matches?.size&&migrate&&occupied.has(selected))throw Error('Kurskennung ist nicht eindeutig. Der vorhandene Datenbestand bleibt erhalten.');
  e.courseId=selected;occupied.add(selected);known.set(key(e),new Set([selected]));
 }
 return result;
}
function edit(slots,{day,block,week,value,replace=false,classes={},newId}){
 const result=ensure(slots,{knownSlots:slots,classes,newId});
 const pair=result[day+'-'+block]||{};
 const previous=week==='both'?(pair.A||pair.B):pair[week];
 const known=candidates(result,classes),matches=known.get(key(value));
 let selected=previous&&!replace?id(previous):null;
 if(selected){
  if(matches&&[...matches].some(i=>i!==selected))throw Error('Ein anderer Kurs hat bereits diese Bezeichnung. Für einen Kurswechsel bitte „Andere Belegung“ wählen.');
  for(const e of entries(result))if(id(e)===selected){e.subject=value.subject;e.group=value.group;}
 }else{
  if(matches?.size>1)throw Error('Die Bezeichnung ist mehrdeutig. Bitte eine eindeutige Kursbezeichnung verwenden.');
  selected=matches?.size===1?[...matches][0]:(newId||(()=> 'kurs-'+root.crypto.randomUUID()))();
 }
 const v={...value,courseId:selected};
 if(week==='both'){pair.A={...v};pair.B={...v};}
 else {if(pair.A&&pair.B&&JSON.stringify(pair.A)===JSON.stringify(pair.B))delete pair[week==='A'?'B':'A'];pair[week]=v;}
 result[day+'-'+block]=pair;
 return result;
}
const api={subject,key,legacyId,valid,id,ensure,edit};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.HblCourseIds=api;
})(typeof window!=='undefined'?window:globalThis);
