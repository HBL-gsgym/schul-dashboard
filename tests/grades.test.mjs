import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context={module:{exports:{}}};
vm.runInNewContext(readFileSync(new URL('../hbl-grades.js',import.meta.url),'utf8'),context);
const api=context.module.exports;
test('Sofortstart hat fünf unabhängige leere Spalten und wertet die erste Note zu 100 Prozent',()=>{
 const book=api.forCourse({}),area=book.areas[0];
 assert.equal(book.areas.length,1);assert.equal(api.weightTotal(book),100);
 assert.equal(area.columns.length,5);assert.equal(new Set(area.columns.map(c=>c.id)).size,5);
 assert.equal(api.results(book,'demo').total,null);
 api.setScore(book,area.columns[4],'demo','2');
 assert.equal(api.results(book,'demo').total,2);assert.deepEqual(Object.keys(area.columns[0].scores),[]);
 assert.equal(api.results(api.forCourse({}),'demo').total,null);
 const existing=api.empty();assert.equal(api.forCourse({gradebook:existing}),existing);
});
function example(){
 const book=api.empty();
 for(const [position,weight] of [40,60].entries()){
  api.saveArea(book,String(position),{name:'Bereich '+position,position,weight,active:true});
  book.areas[position].columns=[{id:'a'+position,scores:{}},{id:'b'+position,scores:{}}];
 }
 return book;
}
test('Issue #6: 40 und 60 Prozent ergeben 1,90, unabhängig von anderen Schülern',()=>{
 const book=example();
 const [a,b]=book.areas;
 [2,3].forEach((n,i)=>api.setScore(book,a.columns[i],'demo',String(n)));
 [1,2].forEach((n,i)=>api.setScore(book,b.columns[i],'demo',String(n)));
 assert.equal(api.results(book,'demo').total.toFixed(2),'1.90');
 assert.equal(api.results(book,'anderer').total,null);
 assert.equal(api.results(book,'demo').means.get(a.id),2.5);
});
test('Leere Zellen und unvollständige Gewichtung erzeugen keine Endnote, 0 Punkte zählen',()=>{
 const book=example();api.setScale(book,'points');
 const [a,b]=book.areas;
 api.setScore(book,a.columns[0],'demo','0');
 assert.equal(api.results(book,'demo').total,null);
 api.setScore(book,b.columns[0],'demo','15');
 assert.equal(api.results(book,'demo').total,9);
 api.setScore(book,b.columns[0],'demo','');
 assert.equal(api.results(book,'demo').total,null);
 b.active=false;a.weight=99.99;
 assert.equal(api.results(book,'demo').total,null);
 a.weight=100;
 assert.equal(api.results(book,'demo').total,0);
});
test('Bewertete Spalten, Bereiche und Skalen sind geschützt, auch bei inaktiven Bereichen',()=>{
 const book=example(),area=book.areas[0],column=area.columns[0];
 assert.throws(()=>api.setScore(book,column,'demo','0'));
 assert.throws(()=>api.setScore(book,column,'demo','7'));
 api.setScore(book,column,'demo','3');
 api.saveArea(book,area.id,{name:'Tests',weight:25,active:false,position:1});
 assert.equal(book.areas[1].columns[0].scores.demo,3);
 assert.equal(api.hasStudent(book,'demo'),true);
 assert.throws(()=>api.removeArea(book,area));
 assert.throws(()=>api.removeColumn(area,column));
 assert.throws(()=>api.setScale(book,'points'));
 api.setScore(book,column,'demo','');
 api.removeColumn(area,column);api.removeArea(book,area);api.setScale(book,'points');
 assert.equal(book.areas.length,1);
 assert.equal(api.hasStudent(book,'demo'),false);
});
test('Ungültige Gewichte oder Positionen verändern den Bereich nicht',()=>{
 const book=example(),before=JSON.stringify(book);
 for(const [weight,position] of [[NaN,0],[101,0],[-1,0],[33.333,0],[10,-1]]){
  assert.throws(()=>api.saveArea(book,'0',{name:'X',weight,position,active:true}));
  assert.equal(JSON.stringify(book),before);
 }
});
