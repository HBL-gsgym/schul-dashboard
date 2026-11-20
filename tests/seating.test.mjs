import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const ctx={module:{exports:{}},structuredClone};
vm.runInNewContext(readFileSync(new URL('../hbl-seating.js',import.meta.url),'utf8'),ctx);
const s=ctx.module.exports;
test('Raumvorschlag berücksichtigt beide Wochen, Mehrdeutigkeit und ältere Pläne',()=>{
 const courses={a:{subject:'Mathe',group:'9'},b:{subject:'Physik',group:'8'}};
 const slots={'1-1':{A:{courseId:'a',room:' D1 '},B:{courseId:'a',room:'d1'}},'2-2':{A:{courseId:'b',room:'D2'}}};
 const classes={a:{seating:s.empty()},b:{seating:{version:1,room:'D1',desks:[{seats:[null]}]}}};
 const info=s.roomsForCourse('a',slots,courses,classes);
 assert.equal(info.suggested,'D1');assert.deepEqual([...info.rooms],['D1','D2']);assert.equal(info.templates[0].id,'b');
 slots['1-1'].B.room='D3';assert.equal(s.roomsForCourse('a',slots,courses,classes).suggested,'');
 assert.equal(s.roomsForCourse('x').suggested,'');
});
test('Raumkopie übernimmt nur die Geometrie, mit neuen Tisch-IDs und freien Plätzen',()=>{
 const origin=s.empty(),target=s.empty();
 origin.room='D1';const a=s.add(origin,1,'a'),b=s.add(origin,2,'b');s.rotate(origin,b);s.assign(origin,a,0,'alt');
 target.room='D2';assert.throws(()=>s.copyLayout(target,origin,()=>''));assert.equal(target.desks.length,0);
 target.room='d1';let i=0;s.copyLayout(target,origin,()=>String(++i));
 assert.deepEqual([...target.desks.map(d=>d.id)],['1','2']);
 assert.equal(target.desks[1].vertical,true);assert.equal(target.desks[1].x,b.x);
 assert.ok(target.desks.every(d=>d.seats.every(id=>id===null)));
 s.assign(target,target.desks[0],0,'neu');assert.equal(a.seats[0],'alt');
});
test('Einzel- und Doppeltische passen in den Raum, ohne sich zu überdecken',()=>{
 const plan=s.empty(),a=s.add(plan,1,'a'),b=s.add(plan,2,'b');
 assert.equal(a.seats.length,1);assert.equal(b.seats.length,2);
 assert.throws(()=>s.move(plan,b,a.x,a.y));
 s.move(plan,b,18,4);s.rotate(plan,b);assert.equal(b.vertical,true);
 assert.throws(()=>s.move(plan,b,23,4));
 assert.throws(()=>s.move(plan,b,0,-1));
 assert.deepEqual([b.x,b.y],[18,4]);
});
test('Versetzen, Tauschen und Freigeben erhalten eindeutige Sitzplatzzuweisungen',()=>{
 const plan=s.empty(),a=s.add(plan,1,'a'),b=s.add(plan,2,'b');
 s.assign(plan,a,0,'x');s.assign(plan,b,1,'y');s.assign(plan,b,1,'x');
 assert.equal(a.seats[0],'y');assert.equal(b.seats[1],'x');
 s.assign(plan,b,0,'y');assert.equal(a.seats[0],null);
 s.assign(plan,b,0,null);assert.equal(b.seats[0],null);
 s.clearMissing(plan,[{id:'y'}]);assert.equal(b.seats[1],null);
});
test('Zufallsvorschau erhält Grundriss und Original bei zu vielen oder zu wenigen Sitzen',()=>{
 for(const n of [0,2,3,5]){
  const plan=s.empty(),a=s.add(plan,1,'a'),b=s.add(plan,2,'b');
  s.move(plan,b,8,4);s.rotate(plan,b);s.assign(plan,a,0,'p0');
  const original=JSON.stringify(plan),students=Array.from({length:n},(_,i)=>({id:'p'+i}));
  const preview=s.shuffledPlan(plan,students,()=>0.25);
  assert.equal(JSON.stringify(plan),original);
  const ids=preview.desks.flatMap(d=>d.seats).filter(Boolean);
  assert.equal(ids.length,Math.min(3,n));assert.equal(new Set(ids).size,ids.length);
  assert.ok(ids.every(id=>students.some(s=>s.id===id)));
  assert.equal(JSON.stringify(preview.desks.map(({seats,...layout})=>layout)),JSON.stringify(plan.desks.map(({seats,...layout})=>layout)));
 }
});
