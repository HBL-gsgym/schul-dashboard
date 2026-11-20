import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountLink } from '../supabase/functions/hbl-admin-users/invitation-links.js';
const uid='11111111-1111-4111-8111-111111111111';
const site='https://hbl-gsgym.github.io/schul-dashboard/';
function fixture({confirmed=false,enabled=true,existing=true,banned=false,wrongId=false,rate=false,wrongRedirect=false}={}){
 const account={id:uid,email:'demo@example.invalid',invited_at:'2026-11-01',email_confirmed_at:confirmed?'2026-11-02':null,banned_until:banned?'2099-01-01':null};
 const calls=[];let count=0;
 const client={supabaseUrl:'https://synthetic.supabase.co',auth:{admin:{
  listUsers:async()=>({data:{users:existing?[account]:[]}}),getUserById:async()=>({data:{user:account}}),
  generateLink:async params=>{calls.push(params);count++;return rate?{error:{status:429}}:{data:{user:{id:wrongId?'other':uid},properties:{action_link:'https://synthetic.supabase.co/auth/v1/verify?type='+params.type+'&redirect_to='+encodeURIComponent(wrongRedirect?'https://example.invalid':site)+'&token=synthetic-'+count}}};},
 }},from:table=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{enabled}})})}),insert:async data=>{calls.push({table,data});return{};}})};
 return {client,calls,account};
}
test('Erneuerung behält ID und Rechte; zwei Aufrufe erzeugen eigenständige Links',async()=>{
 const f=fixture(),before=structuredClone(f.account);
 const a=await createAccountLink(f.client,{action:'renew_invite',user_id:uid},'owner',site);
 const b=await createAccountLink(f.client,{action:'renew_invite',user_id:uid},'owner',site);
 assert.equal(a.status,200);assert.equal(a.body.user_id,uid);
 assert.notEqual(a.body.action_link,b.body.action_link);
 assert.deepEqual(f.account,before);assert.equal(f.calls.length,2);
 assert.ok(f.calls.every(c=>c.type==='invite'));
});
for(const [name,options,action,status] of [
 ['Aktives Konto darf nicht erneut eingeladen werden',{confirmed:true},'renew_invite',409],
 ['Offene Einladung darf nicht Recovery verwenden',{},'recovery',409],
 ['Gesperrtes Konto bleibt gesperrt',{enabled:false},'renew_invite',403],
 ['Auth-Sperre wird berücksichtigt',{banned:true},'renew_invite',403],
 ['Bestehende E-Mail nicht erneut anlegen',{},'invite',409],
 ['Aktives Konto erhält Recovery',{confirmed:true},'recovery',200],
 ['Neues Konto erhält einmalige Freigabe',{existing:false},'invite',200],
 ['Falsche Benutzer-ID wird nicht ausgegeben',{wrongId:true},'renew_invite',502],
 ['Falscher Redirect wird nicht ausgegeben',{wrongRedirect:true},'renew_invite',502],
 ['Rate-Limit wird verständlich gemeldet',{rate:true},'renew_invite',429],
])test(name,async()=>{
 const f=fixture(options);
 const r=await createAccountLink(f.client,{action,email:f.account.email,user_id:uid},'owner',site);
 assert.equal(r.status,status);
 if(status!==200)assert.equal(r.body.action_link,undefined);
 assert.equal(f.calls.filter(c=>c.table).length,action==='invite'&&status===200?1:0);
});
