import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
test('Chat folgt sichtbarem Bildschirm bei Tastatur und kehrt zur vollen Höhe zurück',()=>{
 const props={},classes=new Set();
 const overlay={style:{setProperty:(k,v)=>{props[k]=v;}},classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k)}};
 const context={window:{visualViewport:{height:340,offsetTop:28},innerHeight:844},
  document:{getElementById:()=>overlay,readyState:'loading',addEventListener(){}}};
 vm.createContext(context);
 const source=readFileSync(new URL('../hbl-v57.js',import.meta.url),'utf8')
  .replace(/\}\)\(\);\s*$/,'window.test={syncChatViewport,S};})();');
 vm.runInContext(source,context);
 context.window.test.S.open=true;context.window.test.syncChatViewport();
 assert.equal(props['--hbl-chat-height'],'340px');assert.equal(props['--hbl-chat-top'],'28px');
 assert.equal(classes.has('hbl-chat-short'),true);
 context.window.visualViewport={height:844,offsetTop:0};context.window.test.syncChatViewport();
 assert.equal(props['--hbl-chat-height'],'844px');assert.equal(classes.has('hbl-chat-short'),false);
 delete context.window.visualViewport;context.window.test.syncChatViewport();
 assert.equal(props['--hbl-chat-height'],'844px');
});
