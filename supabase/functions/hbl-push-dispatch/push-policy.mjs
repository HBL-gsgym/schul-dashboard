export function pushWindowActive(p,local){
 const dow=new Date(local.date+"T12:00:00Z").getUTCDay()||7;
 const yesterday=dow===1?7:dow-1;
 const start=String(p.start_time).slice(0,5),end=String(p.end_time).slice(0,5);
 const days=p.days||[];
 if(start<end)return days.includes(dow)&&local.time>=start&&local.time<end;
 return (days.includes(dow)&&local.time>=start)||(days.includes(yesterday)&&local.time<end);
}

export function categoryActive(pref,key,local){
 return pref[key]===true && pushWindowActive(pref,local);
}
