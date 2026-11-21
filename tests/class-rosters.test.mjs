import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const ctx=vm.createContext({module:{exports:{}}});
vm.runInContext(readFileSync(new URL('../hbl-class-rosters.js',import.meta.url),'utf8'),ctx);
const rosters=ctx.module.exports;
let serial=0;
const createId=()=> 'p-'+(++serial);
const catalog=(...entries)=>({courses:Object.fromEntries(entries.map(([id,subject,group,schoolYear='2026/27'])=>[id,{subject,group,schoolYear}]))});
const course=(students,marks={},gradebook=null,seating=null)=>({students:students.map(([id,name])=>({id,name})),marks,finals:{},dates:[],...(gradebook?{gradebook}:{}),...(seating?{seating}:{})});
const snap=classes=>({__participation:{classes}});

test('Class roster is shared by subject; marks, grades and seats remain subject-specific',()=>{
 const state=snap({
  ma:course([['m1','Newton'],['m2','Galileo']]),
  ph:course([['p1','Newton'],['p2','Galileo']],{p1:{d:{rating:'+'}}},
   {version:1,areas:[{id:'a',columns:[{id:'c',scores:{p2:2}}]}]},
   {version:1,desks:[{id:'desk',seats:['p2',null]}]})
 });
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 const first=rosters.ensure(state,cat,'2026/27',createId);
 assert.equal(first.conflicts.length,0);
 assert.deepEqual(JSON.parse(JSON.stringify(state.__participation.classes.ma.students)),
  JSON.parse(JSON.stringify(state.__participation.classes.ph.students)));
 const phys=state.__participation.classes.ph;
 assert.equal(phys.marks.m1.d.rating,'+');
 assert.equal(phys.gradebook.areas[0].columns[0].scores.m2,2);
 assert.equal(phys.seating.desks[0].seats[0],'m2');
 assert.equal(Object.keys(state.__participation.classes.ma.marks).length,0);
 assert.equal(rosters.ensure(state,cat,'2026/27',createId).changed,false);
});

test('Pseudonyms and classbook numbers retain IDs across subjects; numeric, not alphabetical',()=>{
 const state=snap({ma:course([['a','Zebra'],['b','Alpha']]),ph:course([])});
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 rosters.ensure(state,cat,'2026/27',createId);
 rosters.edit(state,cat,'ma','2026/27',{id:'a',name:'Alias X',number:7},createId);
 assert.equal(state.__participation.classes.ph.students.find(s=>s.id==='a').name,'Alias X');
 assert.deepEqual(Array.from(rosters.sorted(state.__participation.classes.ph.students),s=>s.number),[2,7]);
 assert.throws(()=>rosters.edit(state,cat,'ph','2026/27',{id:'a',name:'Doppelt',number:2},createId),/bereits vergeben/);
});

test('Import updates names by number but preserves IDs, existing grades and missing rows',()=>{
 const state=snap({ma:course([['a','Schüler 1'],['b','Schüler 2']],{a:{d:{rating:'++'}}}),
  ph:course([])});
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 rosters.ensure(state,cat,'2026/27',createId);
 rosters.importNames(state,cat,'ph','2026/27',['Newton'],createId);
 assert.equal(state.__participation.classes.ma.students[0].id,'a');
 assert.equal(state.__participation.classes.ma.students[0].name,'Newton');
 assert.equal(state.__participation.classes.ma.marks.a.d.rating,'++');
 assert.equal(state.__participation.classes.ph.students[1].name,'Schüler 2');
});

test('Existing different aliases with graded data are never silently linked',()=>{
 const state=snap({
  ma:course([['a','Alias A'],['b','Alias B']]),
  ph:course([['x','Pseudonym X'],['y','Pseudonym Y']],{y:{d:{rating:'0'}}})
 });
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 const result=rosters.ensure(state,cat,'2026/27',createId);
 assert.deepEqual(Array.from(result.conflicts,c=>c.courseId),['ph']);
 assert.equal(state.__participation.classes.ph.students[1].id,'y');
 assert.equal(state.__participation.classes.ph.marks.y.d.rating,'0');
 rosters.linkByNumber(state,cat,'ph','2026/27');
 assert.equal(state.__participation.classes.ph.students[1].id,'b');
 assert.equal(state.__participation.classes.ph.marks.b.d.rating,'0');
});

test('Deleting a pupil is blocked while any subject has assessments or a seat',()=>{
 const state=snap({ma:course([['a','Ada'],['b','Bohr']]),ph:course([['x','Ada'],['y','Bohr']],{x:{d:{rating:'+'}}})});
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 rosters.ensure(state,cat,'2026/27',createId);
 assert.throws(()=>rosters.edit(state,cat,'ma','2026/27',{id:'a',remove:true},createId),/Bewertungen oder einen Sitzplatz/);
 rosters.edit(state,cat,'ma','2026/27',{id:'b',remove:true},createId);
 assert.equal(state.__participation.classes.ma.students.length,1);
 assert.equal(state.__participation.classes.ph.students.length,1);
 assert.equal(state.__participation.classes.ma.students[0].number,1);
});

test('School years and distinct classes never share roster identity',()=>{
 const state=snap({a:course([['a1','Newton']]),b:course([['b1','Curie']]),c:course([['c1','Bohr']])});
 const cat=catalog(['a','Mathematik','9a','2026/27'],['b','Physik','9a','2027/28'],['c','WAT','9b','2026/27']);
 rosters.ensure(state,cat,'2026/27',createId);
 assert.equal(Object.keys(state.__classRostersV1.classes).length,3);
 assert.notEqual(state.__participation.classes.a.students[0].id,state.__participation.classes.b.students[0].id);
 assert.equal(rosters.key({group:'GK 12'},'2026/27'),null);
 assert.equal(rosters.key({group:'9 A'},'2026/27'),'2026/27|9a');
});

test('Blank Excel rows keep their classbook positions, without moving marks',()=>{
 const state=snap({ma:course([['a','Schüler 1'],['b','Schüler 2']],{a:{d:{rating:'+'}}}),ph:course([])});
 const cat=catalog(['ma','Mathematik','9a'],['ph','Physik','9a']);
 rosters.ensure(state,cat,'2026/27',createId);
 rosters.importNames(state,cat,'ma','2026/27',['','Newton'],createId);
 assert.equal(state.__participation.classes.ma.students[0].name,'Schüler 1');
 assert.equal(state.__participation.classes.ma.students[1].name,'Newton');
 assert.equal(state.__participation.classes.ma.marks.a.d.rating,'+');
});

test('Class UI uses the public course-catalog bridge across inline scripts',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const beforeSecond=html.split('<script>\n/* HBL Schul-Dashboard v5.0')[0];
 assert.match(beforeSecond,/window\.hblReadCourses\(\)\.catalog/);
 assert.doesNotMatch(beforeSecond,/getCourseCatalog\(\)/);
});
