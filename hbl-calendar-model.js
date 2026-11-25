/* Calendar values are civil dates and wall times in Europe/Berlin. */
(function(root){
 const datePattern=/^\d{4}-\d{2}-\d{2}$/;
 const dayMs=86400000;
 const utc=value=>new Date(value+'T00:00:00Z');
 const iso=date=>date.toISOString().slice(0,10);
 const validDate=value=>datePattern.test(value)&&Number.isFinite(+utc(value))&&iso(utc(value))===value;
 const add=(value,days)=>iso(new Date(+utc(value)+days*dayMs));
 const distance=(a,b)=>(+utc(b)-+utc(a))/dayMs;
 const weekday=value=>utc(value).getUTCDay();
 const monday=value=>add(value,-((weekday(value)+6)%7));
 const berlinToday=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const minutes=time=>Number(time.slice(0,2))*60+Number(time.slice(3));
 function shiftMonth(value,offset){
  const date=utc(value),day=date.getUTCDate();
  date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+offset);
  const end=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  date.setUTCDate(Math.min(day,end));return iso(date);
 }
 function matches(event,date,rules){
  const elapsed=distance(event.start,date);
  if(elapsed<0||(event.until&&date>event.until))return false;
  const interval=event.interval||1;
  const monthDelta=(Number(date.slice(0,4))-Number(event.start.slice(0,4)))*12+Number(date.slice(5,7))-Number(event.start.slice(5,7));
  let matched;
  switch(event.repeat){
   case 'daily':matched=elapsed%interval===0;break;
   case 'weekly':matched=elapsed%(7*interval)===0;break;
   case 'fortnight':matched=elapsed%(14*interval)===0;break;
   case 'monthly':matched=monthDelta%interval===0&&weekday(date)===weekday(event.start)&&Math.floor((Number(date.slice(8))-1)/7)===Math.floor((Number(event.start.slice(8))-1)/7);break;
   case 'yearly':matched=date.slice(5)===event.start.slice(5)&&monthDelta%(12*interval)===0;break;
   case 'green':case 'blue':matched=elapsed%7===0&&rules.cycle(date)===event.repeat;break;
   default:return elapsed===0;
  }
  return matched&&(!event.skip||!rules.excluded(date));
 }
 function overlaps(entry,first,last){
  const end=entry.allDay||entry.endTime!=='00:00'?entry.end:add(entry.end,-1);
  return entry.start<=last&&end>=first;
 }
 function occurrences(events,first,last,rules){
  const result=[];
  for(const event of events){
   const span=distance(event.start,event.end);
   const exceptions=event.exceptions||{};
   const earliest=add(first,-span);
   for(let date=earliest>event.start?earliest:event.start;date<=last;date=add(date,1)){
    if(Object.hasOwn(exceptions,date)||!matches(event,date,rules))continue;
    const entry={...event,start:date,end:add(date,span),seriesId:event.id,original:date};
    if(overlaps(entry,first,last))result.push(entry);
   }
   for(const [original,edit] of Object.entries(exceptions)){
    if(edit&&overlaps(edit,first,last))result.push({...edit,seriesId:event.id,original});
   }
  }
  return result.sort((a,b)=>a.start.localeCompare(b.start)||Number(b.allDay)-Number(a.allDay)||a.startTime.localeCompare(b.startTime)||a.title.localeCompare(b.title));
 }
 function update(events,id,original,scope,replacement,newId){
  if(!id)return [...events,{...replacement,id:newId,exceptions:{}}];
  return events.flatMap(event=>{
   if(event.id!==id)return [event];
   if(!event.repeat||scope==='series')return replacement?[{...event,...replacement,id}]:[];
   if(scope==='one')return [{...event,exceptions:{...event.exceptions,[original]:replacement}}];
   const entries=Object.entries(event.exceptions||{});
   const previous={...event,until:add(original,-1),exceptions:Object.fromEntries(entries.filter(([date])=>date<original))};
   const result=original===event.start?[]:[previous];
   if(replacement)result.push({...replacement,id:newId,exceptions:Object.fromEntries(entries.filter(([date])=>date>original))});
   return result;
  });
 }
 root.HblCalendarModel={validDate,add,distance,weekday,monday,berlinToday,minutes,shiftMonth,occurrences,overlaps,update};
})(globalThis);
