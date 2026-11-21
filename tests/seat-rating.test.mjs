import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context={module:{exports:{}}};
vm.runInNewContext(readFileSync(new URL('../hbl-seat-rating.js',import.meta.url),'utf8'),context);
const {suggestedDate}=context.module.exports;
const today='2026-11-23';
const dates=[{id:'a',date:today,block:1},{id:'b',date:today,block:3}];
test('Sitzplatzbewertung schlägt bei zwei Terminen den laufenden Block vor',()=>{
 assert.equal(suggestedDate(dates,today,3),'b');
 assert.equal(suggestedDate(dates,today,undefined),'');
 assert.equal(suggestedDate(dates,'2026-11-24',1),'');
 assert.equal(suggestedDate([dates[0]],today,undefined),'a');
});
test('Die manuelle Auswahl gilt für weitere Personen bis zum Block- oder Tageswechsel',()=>{
 const remembered={context:today+'|1',id:'b'};
 assert.equal(suggestedDate(dates,today,1,remembered),'b');
 assert.equal(suggestedDate(dates,today,undefined,remembered),'');
 assert.equal(suggestedDate(dates,'2026-11-24',1,remembered),'');
 assert.equal(suggestedDate([dates[0]],today,1,remembered),'a');
 assert.equal(suggestedDate(dates,today,1,{context:today+'|1',id:''}),'');
});
