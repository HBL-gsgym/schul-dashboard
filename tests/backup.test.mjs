import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './cloud-harness.mjs';

for (const pending of [false,true]) {
 test(pending?'Konfliktsicherung exportiert vollständigen Pending-Inhalt':'Lokaler Export enthält sämtliche persönlichen Daten',async()=>{
  const content={__linksV1:[{title:'Demo'}],__timetableV1:{slots:{}},__participation:{classes:{demo:{marks:{synthetic:{date:{rating:'+'}}}}}},__tasks:[{title:'Demo-Aufgabe'}]};
  const h=harness({pending:pending?{content,expectedRevision:2}:undefined});
  await h.api.initializeAuth();
  if(pending)await h.api.startSession({user:{id:'demo'}});
  h.ctx.prepDone=pending?{wrong:true}:content;
  let blob,clicked=false,revoked=false;
  h.ctx.Blob=Blob;
  h.ctx.window.URL={createObjectURL:b=>{blob=b;return 'blob:synthetic'},revokeObjectURL:()=>{revoked=true}};
  h.ctx.setTimeout=fn=>fn();
  h.ctx.document.createElement=()=>({click(){clicked=true},remove(){}});
  h.element('hblLocalBackup').onclick();
  assert.equal(clicked,true);
  assert.deepEqual(JSON.parse(await blob.text()),content);
  assert.equal(revoked,true);
  if(pending)assert.deepEqual(h.pending().content,content);
  assert.equal(h.calls.length,0);
 });
}
