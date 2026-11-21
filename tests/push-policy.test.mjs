import test from 'node:test';
import assert from 'node:assert/strict';
import {categoryActive,pushWindowActive} from '../supabase/functions/hbl-push-dispatch/push-policy.mjs';

const keys=['enabled','lessons_enabled','calendar_enabled','announcements_enabled'];
test('Alle 16 Kategorie-Kombinationen beachten das gemeinsame Zeitfenster',()=>{
 for(let mask=0;mask<16;mask++){
  const pref={days:[1],start_time:'07:00',end_time:'17:00'};
  keys.forEach((key,i)=>{pref[key]=Boolean(mask&(1<<i));});
  for(const key of keys){
   for(const [time,inside] of [['06:59',false],['07:00',true],['16:59',true],['17:00',false]]){
    assert.equal(categoryActive(pref,key,{date:'2026-11-23',time}),pref[key]&&inside);
   }
  }
 }
});
test('Zeitfenster über Mitternacht gilt für den gewählten Starttag',()=>{
 const pref={days:[7],start_time:'22:00',end_time:'06:00'};
 for(const [date,time,ok] of [['2026-10-25','22:00',true],['2026-10-26','05:59',true],['2026-10-26','06:00',false],['2026-10-26','22:00',false]]){
  assert.equal(pushWindowActive(pref,{date,time}),ok);
 }
});
