/* Personal work time. Server timestamps are authoritative for the manual timer. */
((root)=>{
 'use strict';
 const activities=['preparation','grading','organization','conference'];
 const keys=['lesson','duty',...activities];
 const activityKind=value=>value==='supervision'?'duty':activities.includes(value)?value:'organization';
 function totals(intervals,from,to){
  const starts=new Map(),ends=new Map();
  for(const {kind,start,end} of intervals){
   const left=Math.max(start,from),right=Math.min(end,to);
   if(!(left<right))continue;
   (starts.get(left)||starts.set(left,[]).get(left)).push(kind);
   (ends.get(right)||ends.set(right,[]).get(right)).push(kind);
  }
  const points=[...new Set([...starts.keys(),...ends.keys()])].sort((a,b)=>a-b);
  const active=Object.fromEntries(keys.map(key=>[key,0])),sum={...active};
  for(const [index,point] of points.entries()){
   for(const kind of starts.get(point)||[])active[kind]++;
   for(const kind of ends.get(point)||[])active[kind]--;
   const kind=keys.find(key=>active[key]>0);
   if(kind&&index+1<points.length)sum[kind]+=points[index+1]-point;
  }
  return sum;
 }
 function dayTotals(manual,scheduled,dayStart,dayEnd,activation,now){
  // Ob ein Planblock zählt, entscheidet sein Beginn, auch wenn er noch läuft.
  const automatic=scheduled.filter(interval=>interval.start>=activation);
  return totals([...manual,...automatic],Math.max(activation,dayStart),Math.min(now,dayEnd));
 }
 root.HblWorkTimeModel={totals,dayTotals,activityKind};
 if(typeof document==='undefined')return;

 const calendar=root.HblCalendarModel;
 const dateFormat=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit'});
 const dayLabel=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',weekday:'long',day:'numeric',month:'numeric'});
 const labels={lesson:'Unterricht',duty:'Aufsicht',preparation:'Vorbereitung',grading:'Korrektur',organization:'Organisation/Sonstiges',conference:'Konferenz/Fortbildung'};
 const midnight=date=>calendar.berlinInstant(date,'00:00');
 const today=()=>dateFormat.format(new Date());
 const byId=id=>document.getElementById(id);
 const node=(tag,value)=>{const el=document.createElement(tag);el.textContent=value;return el;};
 const time=duration=>{
  const seconds=Math.max(0,Math.floor(duration/1000));
  return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
 };
 const duration=value=>{
  if(value===0)return '–';
  const minutes=Math.round(value/60000);
  return minutes===0?'< 1 min':Math.floor(minutes/60)+' h '+minutes%60+' min';
 };
 const sum=row=>keys.reduce((result,key)=>result+row[key],0);
 let owner=null,state=null,week=null,clockOffset=0,issue='',pending=null,version=0;
 function account(){return root.hblCloudUser?.()?.id||null;}
 async function request(action,id=null,range=week||calendar.monday(today()),activity=null){
  const result=await root.hblCloudClient.rpc('hbl_work_time_action_v3',{
   p_action:action,p_id:id,p_activity:activity,p_from:new Date(midnight(range)).toISOString(),
   p_to:new Date(midnight(calendar.add(range,7))).toISOString()
  });
  if(result.error||!result.data?.now||!Array.isArray(result.data.sessions))throw Error('Arbeitszeit konnte nicht synchronisiert werden. Bitte erneut versuchen.');
  return result.data;
 }
 function renderClock(){
  const clock=byId('hblWorkClock');
  if(!clock)return;
  const value=state?.running?time(Date.now()+clockOffset-Date.parse(state.running.start)):'';
  if(clock.textContent!==value)clock.textContent=value;
 }
 function render(){
  const starts=byId('hblWorkStarts'),running=byId('hblWorkRunning'),status=byId('hblWorkStatus');
  if(!starts)return;
  const current=state?.running;
  starts.hidden=!!current;
  running.hidden=!current;
  const disabled=!!pending||!account()||!navigator.onLine;
  for(const button of starts.querySelectorAll('[data-work-start]'))button.disabled=disabled||!state;
  byId('hblWorkOverview').disabled=!!pending||!state?.activated;
  byId('hblWorkStop').disabled=disabled;
  if(current){
   const activity=byId('hblWorkActivity'),kind=activityKind(current.activity);
   activity.dataset.activity=kind;
   if(activity.textContent!==labels[kind])activity.textContent=labels[kind];
  }
  status.textContent=issue||(!navigator.onLine?'Offline · Zeitstand zuletzt abgeglichen.':pending?'Arbeitszeit wird gespeichert …':'');
  const dialogStatus=byId('hblWorkDialog')?.querySelector('[data-overview-status]');
  if(dialogStatus)dialogStatus.textContent=status.textContent;
  renderClock();
 }
 async function load(){
  const user=account();
  if(owner!==user){
   owner=user;state=null;issue='';week=null;version++;
   byId('hblWorkDialog')?.close();render();
  }
  if(!user||!root.hblCloudClient||document.documentElement.dataset.access!=='ready'||pending||!navigator.onLine)return;
  const attempt=++version,range=week||calendar.monday(today());
  try{
   const data=await request('read',null,range);
   if(attempt!==version||account()!==user)return;
   state=data;clockOffset=Date.parse(data.now)-Date.now();issue='';render();renderOverview();
  }catch(error){if(attempt===version){issue=error.message;render();}}
 }
 function change(activity=null){
  if(pending||!account()||!navigator.onLine)return;
  if(!state){void load();return;}
  const action=activity?'start':'stop';
  if(action==='stop'&&!state.running)return;
  const id=action==='start'?crypto.randomUUID():state.running?.id||null;
  const user=account();
  version++;
  pending=(async()=>{
   try{
    if(!state.activated){
     const activated=await request('activate');
     if(account()!==user)return;
     state=activated;
    }
    const data=await request(action,id,undefined,activity);
    if(account()!==user)return;
    state=data;clockOffset=Date.parse(data.now)-Date.now();issue='';
   }catch(error){if(account()===user)issue=error.message;}
   finally{pending=null;render();renderOverview();}
  })();
  render();
 }
 function renderOverview(){
  const dialog=byId('hblWorkDialog');
  if(!dialog?.open||!state?.activated||!week)return;
  const end=calendar.add(week,6),now=Date.now()+clockOffset,activation=Date.parse(state.activated);
  dialog.querySelector('[data-week-label]').textContent=dayLabel.format(midnight(week))+' – '+dayLabel.format(midnight(end));
  dialog.querySelector('[data-next]').disabled=end>=today();
  dialog.querySelector('[data-prev]').disabled=week<=calendar.monday(dateFormat.format(new Date(activation)));
  const manual=state.sessions.map(s=>({kind:activityKind(s.activity),start:Date.parse(s.start),end:Date.parse(s.end)}));
  if(state.running)manual.push({kind:activityKind(state.running.activity),start:Date.parse(state.running.start),end:now});
  const rows=Array.from({length:7},(_,index)=>{
   const date=calendar.add(week,index);
   const automatic=root.hblWorkSchedule(date).map(({kind,start,end})=>({
    kind,start:calendar.berlinInstant(date,start),end:calendar.berlinInstant(date,end)
   }));
   return {date,...dayTotals(manual,automatic,midnight(date),midnight(calendar.add(date,1)),activation,now)};
  });
  const aggregate=Object.fromEntries(keys.map(key=>[key,rows.reduce((result,row)=>result+row[key],0)]));
  const total=sum(aggregate),peak=Math.max(...rows.map(sum));
  const top=rows.filter(row=>sum(row)===peak).map(row=>dayLabel.format(midnight(row.date)));
  const summary=dialog.querySelector('[data-totals]');
  summary.replaceChildren(node('strong','Gesamt '+(total?duration(total):'0 min')));
  for(const key of keys){
   const fraction=total?Math.round(aggregate[key]*100/total):0;
   const badge=node('span',labels[key]+' · '+(aggregate[key]?duration(aggregate[key]):'0 min')+' · '+fraction+' %');
   badge.dataset.activity=key;summary.append(badge);
  }
  dialog.querySelector('[data-peak]').textContent=peak?'Meiste Arbeitszeit · '+top.join(', ')+' · '+duration(peak):'Für diese Woche ist noch keine Arbeitszeit erfasst.';
  dialog.querySelector('thead tr').replaceChildren(...['Tag',...keys.map(key=>labels[key]),'Gesamt'].map(label=>{
   const heading=node('th',label);heading.scope='col';return heading;
  }));
  const body=dialog.querySelector('tbody');
  body.replaceChildren(...rows.map(row=>{
   const tr=document.createElement('tr'),heading=node('th',dayLabel.format(midnight(row.date)));
   heading.scope='row';
   tr.append(heading,...keys.map(key=>node('td',duration(row[key]))),node('td',duration(sum(row))));
   return tr;
  }));
 }
 function shift(delta){
  week=calendar.add(week,delta*7);
  const dialog=byId('hblWorkDialog');
  dialog.querySelector('[data-prev]').disabled=true;
  dialog.querySelector('[data-next]').disabled=true;
  dialog.querySelector('[data-week-label]').textContent='Woche wird geladen …';
  byId('hblWorkDialog').querySelector('[data-totals]').replaceChildren();
  byId('hblWorkDialog').querySelector('[data-peak]').textContent='';
  byId('hblWorkDialog').querySelector('tbody').replaceChildren();
  void load();
 }
 function mount(){
  const stop=byId('hblWorkStop');
  if(!stop||stop.onclick)return;
  stop.onclick=()=>change();
  for(const button of byId('hblWorkStarts').querySelectorAll('[data-work-start]'))
   button.onclick=()=>change(button.dataset.workStart);
  byId('hblWorkOverview').onclick=()=>{
   if(!state?.activated)return;
   week=calendar.monday(today());
   byId('hblWorkDialog').showModal();shift(0);
  };
  const dialog=byId('hblWorkDialog');
  dialog.querySelector('[data-prev]').onclick=()=>shift(-1);
  dialog.querySelector('[data-next]').onclick=()=>shift(1);
  dialog.onclose=()=>{week=null;void load();};
  render();
 }
 root.hblWorkBeforeLogout=async()=>{
  if(pending)await pending;
  if(!account())return;
  const current=await request('read');
  if(current.running){state=await request('stop',current.running.id);render();}
 };
 root.addEventListener('hbl-cloud-status',()=>{mount();void load();});
 root.addEventListener('hbl-route-changed',()=>{mount();render();});
 root.addEventListener('hbl-calendar-sources-changed',renderOverview);
 root.addEventListener('online',()=>{render();void load();});
 root.addEventListener('offline',render);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load();});
 setInterval(()=>{if(!document.hidden)renderClock();},1000);
 setInterval(()=>{if(!document.hidden)void load();},15000);
})(typeof window==='undefined'?globalThis:window);
