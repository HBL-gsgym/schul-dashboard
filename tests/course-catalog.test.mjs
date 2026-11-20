import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({module:{exports:{}},crypto:globalThis.crypto});
vm.runInContext(readFileSync(new URL('../hbl-course-ids.js',import.meta.url),'utf8'),context);
context.HblCourseIds=context.module.exports;
vm.runInContext(readFileSync(new URL('../hbl-courses.js',import.meta.url),'utf8'),context);
const api=context.module.exports,ids=context.HblCourseIds;
const math={subject:'Mathematik',group:'9a',room:'101',courseId:'ma9a'};
test('Bestehende und gespeicherte Kurse werden ohne Duplikate und ohne Datenänderung übernommen',()=>{
 const slots={'1-1':{A:math,B:math}},classes={ma9a:{students:[{id:'demo-1'}],marks:{'demo-1':{date:{rating:'+'}}}}},before=JSON.stringify({slots,classes});
 const catalog=api.reconcile(null,slots,classes);
 assert.equal(Object.keys(catalog.courses).length,1);assert.equal(catalog.courses.ma9a.subject,'Mathematik');
 assert.equal(JSON.stringify(api.reconcile(catalog,slots,classes)),JSON.stringify(catalog));
 assert.equal(JSON.stringify({slots,classes}),before);
 const noPlan=api.reconcile(null,{}, {ma9a:{meta:{label:'Mathematik',group:'9a'}}});
 assert.equal(noPlan.courses.ma9a.group,'9a');
});
test('Ein manuell angelegter Kurs bleibt ohne Plan und nach JSON-Neuladen bestehen',()=>{
 const created=api.update(api.reconcile(null,{}),{subject:'Demo',group:'Testkurs'},{},()=> 'kurs-demo');
 const restored=api.reconcile(JSON.parse(JSON.stringify(created.catalog)),{});
 assert.equal(restored.courses['kurs-demo'].subject,'Demo');
 assert.equal(api.count({},created.id),0);
 assert.throws(()=>api.update(restored,{subject:'Demo',group:'Testkurs'}),/bereits vorhanden/);
});
test('Dropdown-Zuweisung nutzt dieselbe Identität mehrfach und erhält die andere Woche',()=>{
 const catalog=api.reconcile(null,{'1-1':{A:math}});
 let slots=api.assign({},catalog,'ma9a',{day:2,block:3,week:'both',room:'202'});
 slots=api.assign(slots,catalog,'ma9a',{day:4,block:1,week:'A',room:'303'});
 assert.equal(slots['2-3'].A.courseId,slots['4-1'].A.courseId);
 const changed=api.assign(slots,catalog,'ma9a',{day:2,block:3,week:'A',room:'404'});
 assert.equal(changed['2-3'].B.room,'202');assert.equal(changed['2-3'].A.room,'404');
 assert.equal(api.count(changed,'ma9a'),3);
});
test('Kursumbenennung wirkt auf alle Belegungen, aber nicht auf Kennungen oder Räume',()=>{
 const slots={'1-1':{A:math},'3-2':{B:{...math,room:'202'}}};
 const catalog=api.update(api.reconcile(null,slots),{id:'ma9a',subject:'Mathe neu',group:'9a neu'},slots).catalog;
 const aligned=api.align(slots,catalog);
 assert.equal(aligned['1-1'].A.courseId,'ma9a');assert.equal(aligned['3-2'].B.subject,'Mathe neu');
 assert.equal(aligned['3-2'].B.room,'202');assert.equal(slots['1-1'].A.subject,'Mathematik');
});
test('Archiv verlangt leeren Stundenplan, verhindert neue Belegung und erlaubt Wiederherstellen ohne Datenverlust',()=>{
 const slots={'1-1':{A:math}},catalog=api.reconcile(null,slots);
 assert.throws(()=>api.update(catalog,{id:'ma9a',archived:true},slots),/noch im Stundenplan/);
 const archived=api.update(catalog,{id:'ma9a',archived:true},{}).catalog;
 assert.equal(api.reconcile(archived,{}).courses.ma9a.archived,true);
 assert.throws(()=>api.assign({},archived,'ma9a',{day:1,block:1,week:'A'}),/aktiven Kurs/);
 assert.equal(api.update(archived,{id:'ma9a',archived:false},{}).catalog.courses.ma9a.subject,'Mathematik');
});
test('CSV ohne Kennungen findet auch einen Kurs ohne Stundenplan, statt einen zweiten zu erzeugen',()=>{
 const catalog=api.update(api.reconcile(null,{}),{subject:'Mathematik',group:'9a'},{},()=> 'kurs-eigener').catalog;
 const result=ids.ensure({'2-2':{A:{subject:'Mathe',group:'9a',room:'101'}}},{classes:api.identityClasses(catalog)});
 assert.equal(result['2-2'].A.courseId,'kurs-eigener');
 assert.equal(api.align(result,catalog)['2-2'].A.subject,'Mathematik');
});
