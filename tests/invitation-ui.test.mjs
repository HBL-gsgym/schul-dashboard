import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
function ui(invoke){
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',innerHTML:'',querySelectorAll:()=>[]});return elements.get(id);};
 const context={window:{hblCloudClient:{functions:{invoke}},addEventListener(){}},document:{readyState:'loading',addEventListener(){},getElementById:get},console};
 const source=readFileSync(new URL('../hbl-v56.js',import.meta.url),'utf8').replace(/\}\)\(\);\s*$/,'window.test={reloadAdminUsers,makeManualLink};})();');
 vm.createContext(context);vm.runInContext(source,context);
 return {api:context.window.test,get};
}
test('Bestätigtes Konto ohne Profil erhält Recovery, unbestätigtes mit Profil Erneuerung',async()=>{
 const h=ui(async()=>({data:{users:[{id:'active',email:'a@example.invalid',is_member:true,confirmed_at:'2026-11-01'},
 {id:'pending',email:'b@example.invalid',username:'Demo',is_member:true,invited_at:'2026-11-01'},
 {id:'blocked',email:'c@example.invalid',is_member:false,invited_at:'2026-11-01'}]}}));
 await h.api.reloadAdminUsers();const html=h.get('hblAdminsList').innerHTML;
 assert.match(html,/data-recovery-user="active" data-link-action="recovery"/);
 assert.match(html,/data-recovery-user="pending" data-link-action="renew_invite"/);
 assert.doesNotMatch(html,/data-recovery-user="blocked"/);
});
test('Erneuerung übergibt bestehende ID und verhindert parallele Linkanfragen',async()=>{
 const calls=[];let finish;
 const h=ui(async(_,args)=>{calls.push(args.body);if(args.body.action==='list')return{data:{users:[]}};await new Promise(r=>finish=r);return{data:{action_link:'synthetic',email:'demo@example.invalid'}};});
 const first=h.api.makeManualLink('renew_invite','existing-id');
 await h.api.makeManualLink('renew_invite','existing-id');
 assert.equal(calls.length,1);assert.equal(calls[0].action,'renew_invite');assert.equal(calls[0].user_id,'existing-id');
 finish();await first;
});
test('Fehler entfernt alten Link und zeigt lesbare Servermeldung',async()=>{
 const h=ui(async()=>({error:{context:{json:async()=>({error:'Konto ist gesperrt.'})}}}));
 h.get('hblInviteLink').value='alter-synthetischer-link';
 await h.api.makeManualLink('renew_invite','existing-id');
 assert.equal(h.get('hblInviteLink').value,'');
 assert.equal(h.get('hblInviteResult').hidden,true);
 assert.match(h.get('hblInviteStatus').textContent,/Konto ist gesperrt/);
});
