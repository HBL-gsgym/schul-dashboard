import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({module:{exports:{}},crypto:globalThis.crypto});
vm.runInContext(readFileSync(new URL('../hbl-course-ids.js',import.meta.url),'utf8'),context);
const ids=context.module.exports;
const lesson=(subject='Mathematik',group='9a',room='101')=>({subject,group,room});
const old={'1-1':{A:lesson(),B:lesson()},'3-2':{A:lesson('Mathe')}};
test('Bestandskennungen und Links bleiben erhalten; Übernahme ist wiederholbar und verändert keine Eingabe',()=>{
 const original=JSON.stringify(old),migrated=ids.ensure(old,{migrate:true});
 assert.equal(migrated['1-1'].A.courseId,'ma9a');
 assert.equal(migrated['3-2'].A.courseId,'ma9a');
 assert.deepEqual(ids.ensure(migrated,{migrate:true}),migrated);
 assert.equal(JSON.stringify(old),original);
 assert.equal(ids.id(lesson('Demo-Fach','Testkurs')),ids.ensure({'1-1':{A:lesson('Demo-Fach','Testkurs')}},{migrate:true})['1-1'].A.courseId);
});
test('Umbenennen erhält Identität, aktualisiert alle Belegungen und lässt Räume separat',()=>{
 const slots=ids.ensure(old,{migrate:true});
 const next=ids.edit(slots,{day:1,block:1,week:'A',value:lesson('Mathematik Aufbau','9a neu','202')});
 assert.equal(next['1-1'].A.courseId,'ma9a');
 assert.equal(next['3-2'].A.subject,'Mathematik Aufbau');
 assert.equal(next['3-2'].A.group,'9a neu');
 assert.equal(next['3-2'].A.room,'101');
 assert.equal(next['1-1'].A.room,'202');
 assert.equal(slots['1-1'].A.subject,'Mathematik');
});
test('Neuer Kurs in einem Block übernimmt keine Identität des bisherigen Kurses',()=>{
 const next=ids.edit(old,{day:1,block:1,week:'A',replace:true,value:lesson('Physik','8z'),newId:()=> 'kurs-neu'});
 assert.equal(next['1-1'].A.courseId,'kurs-neu');
 assert.equal(next['3-2'].A.courseId,'ma9a');
});
test('Leerer Zielblock und CSV ohne Kennungen finden den vorhandenen umbenannten Kurs',()=>{
 const renamed=ids.edit(old,{day:1,block:1,week:'both',value:lesson('Aufbau','9x')});
 const added=ids.edit(renamed,{day:5,block:4,week:'both',value:lesson('Aufbau','9x')});
 assert.equal(added['5-4'].A.courseId,'ma9a');
 const imported=ids.ensure({'2-3':{A:lesson('Aufbau','9x')}},{knownSlots:renamed});
 assert.equal(imported['2-3'].A.courseId,'ma9a');
});
test('A/B-Kurswechsel behält Gegenkurs und andere Wochenbelegungen',()=>{
 const slots={'1-1':{A:{...lesson(),courseId:'a'},B:{...lesson('Physik','9a'),courseId:'b'}}};
 const result=ids.edit(slots,{day:1,block:1,week:'A',value:lesson('Mathe neu','9a')});
 assert.equal(result['1-1'].A.courseId,'a');assert.equal(JSON.stringify(result['1-1'].B),JSON.stringify(slots['1-1'].B));
});
test('Keine stille Zusammenführung gleichnamiger Kurse oder versehentliche Übernahme fremder Bewertungen',()=>{
 const slots={'1-1':{A:{...lesson(),courseId:'a'},B:{...lesson('Physik'),courseId:'b'}}};
 assert.throws(()=>ids.edit(slots,{day:1,block:1,week:'A',value:lesson('Physik')}),/anderer Kurs/);
 const duplicate={'1-1':{A:{...lesson(),courseId:'a'},B:{...lesson(),courseId:'b'}}};
 assert.throws(()=>ids.ensure({'2-1':{A:lesson()}},{knownSlots:duplicate}),/Mehrere Kurse/);
});
test('Neuladen und JSON-Austausch erhalten eingefrorene Kennungen; Kursdaten bleiben unverändert',()=>{
 const classes={ma9a:{students:[{id:'demo-1',name:'Demo 1'}],marks:{'demo-1':{date:{rating:'+'}}},finals:{'demo-1':'2'}}};
 const before=JSON.stringify(classes),renamed=ids.edit(old,{day:1,block:1,week:'both',value:lesson('Neu','9x'),classes});
 const restored=ids.ensure(JSON.parse(JSON.stringify(renamed)),{migrate:true});
 assert.equal(restored['1-1'].A.courseId,'ma9a');assert.equal(JSON.stringify(classes),before);
 assert.ok(classes[restored['1-1'].A.courseId].marks['demo-1']);
});
test('Termine folgen der Kurskennung; Umbenennen erhält Bewertungen und Umplanen archiviert bewertete Termine',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const code=html.slice(html.indexOf('function plannedSlots(course)'),html.indexOf('window.hblPlannedSlots=plannedSlots;'));
 let slots=ids.ensure({'1-1':{A:lesson()}},{migrate:true});
 const format=d=>d.toISOString().slice(0,10);
 const ctx=vm.createContext({Date,Map,Set,Object,window:{},courseId:ids.id,
  currentSchoolYear:()=>({start:'2026-11-02',end:'2026-11-06'}),publicHolidays:()=>[],
  parseSchoolDate:s=>new Date(s+'T12:00:00Z'),taskDateString:format,
  dayOffset:(d,n)=>new Date(d.getTime()+n*86400000),schoolDateDescription:()=>({kind:'school'}),
  weekCycle:()=> 'A',TIMETABLE:{A:{}},BLOCKS:[{n:1,hours:[1,2]}],getSettings:()=>({slots})});
 vm.runInContext(code,ctx);
 const c={dates:[{id:'auto-2026-11-02-b1',date:'2026-11-02',block:1,auto:true}],marks:{demo:{'auto-2026-11-02-b1':{rating:'+'}}}};
 slots=ids.edit(slots,{day:1,block:1,week:'A',value:lesson('Umbenannt','Neu')});
 assert.equal(ctx.plannedSlots('ma9a').length,1);ctx.reconcileDates(c,'ma9a');
 assert.equal(c.dates.length,1);assert.equal(c.dates[0].archived,undefined);
 slots={'2-1':slots['1-1']};ctx.reconcileDates(c,'ma9a');
 assert.equal(c.dates.length,2);assert.equal(c.dates[0].archived,true);
 assert.equal(c.marks.demo['auto-2026-11-02-b1'].rating,'+');
 assert.equal(c.dates[1].date,'2026-11-03');
});
