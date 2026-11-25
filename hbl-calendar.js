(()=>{
 const M=HblCalendarModel;
 const table='hbl_private_calendars';
 const colors={personal:'Grün · Persönlich',lesson:'Blau',task:'Gelb',meeting:'Violett · Besprechung',red:'Rot',teal:'Türkis'};
 const repeats={'':'Nie',daily:'Täglich',weekly:'Wöchentlich',fortnight:'Alle zwei Wochen',monthly:'Monatlich (Wochentag und Position)',yearly:'Jährlich',green:'Grüne A-Wochen',blue:'Blaue B-Wochen'};
 const alerts=[5,15,30,60,1440,10080];
 let lastPoll=0;
 let host,date,mode='month',events=[],revision=0,owner,status='',available=false,loading=false,request=0;
 const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;};
 const btn=(text,fn,cls)=>{const el=node('button',text,cls);el.type='button';el.onclick=fn;return el;};
 const label=(value,options)=>new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',...options}).format(new Date(value+'T00:00:00Z'));
 const localDate=value=>new Date(value+'T12:00:00');
 const rules={cycle:value=>weekInfo(localDate(value)).color,excluded:value=>{
  const day=localDate(value),year=currentSchoolYear(day);
  return schoolDateDescription(value,year,publicHolidays(day.getFullYear())).kind!=='school';
 }};
 function paintStatus(){const output=host?.querySelector('.personal-calendar-status');if(output)output.textContent=status;}
 function cache(retrieve=false){
  try{
   const key='hbl-private-calendar-'+owner;
   if(retrieve)return JSON.parse(localStorage.getItem(key)||'null');
   localStorage.setItem(key,JSON.stringify(events));
  }catch(_){}
 }
 async function load(){
  const user=window.hblCloudUser?.(),client=window.hblCloudClient;
  if(!user||!client||document.documentElement.dataset.access!=='ready')return;
  if(owner!==user.id){owner=user.id;events=cache(true)||[];revision=0;available=false;}
  lastPoll=Date.now();
  const attempt=++request;
  loading=true;status='Termine werden geladen …';render();
  try{
   const {data,error}=await client.from(table).select('events,revision').eq('user_id',user.id).maybeSingle();
   if(error)throw error;
   if(attempt!==request||owner!==window.hblCloudUser?.()?.id)return;
   events=data?.events||[];revision=Number(data?.revision||0);available=true;status='Synchronisiert';cache();
  }catch(_){if(attempt===request){available=false;status='Cloud nicht erreichbar. Gespeicherte Termine sind offline nur lesbar.';}}
  finally{if(attempt===request){loading=false;render();}}
 }
 async function save(next,expected){
  if(!available||loading||!navigator.onLine||owner!==window.hblCloudUser?.()?.id)throw Error('Speichern braucht eine Verbindung. Die Eingaben bleiben geöffnet.');
  if(expected!==revision)throw Error('Die Termine wurden inzwischen geändert. Bitte den Termin neu öffnen.');
  const client=window.hblCloudClient,account=owner;
  const query=expected?client.from(table).update({events:next,revision:expected+1}).eq('user_id',account).eq('revision',expected):
    client.from(table).insert({user_id:account,events:next,revision:1});
  const result=await query.select('revision').maybeSingle();
  if(account!==owner||account!==window.hblCloudUser?.()?.id)throw Error('Das Konto wurde gewechselt.');
  if(!result.data||result.error){
   if(!result.error||result.error.code==='23505'){void load();throw Error('Ein anderes Gerät hat gespeichert. Eingaben bleiben hier erhalten. Bitte den aktuellen Termin vor dem Speichern neu öffnen.');}
   throw Error('Die Änderung konnte nicht gespeichert werden. Bitte erneut versuchen.');
  }
  request++;loading=false;events=next;revision=Number(result.data.revision);status='Synchronisiert';cache();render();
 }
 function selectDate(next){if(M.validDate(next)){date=next;render();}}
 function openEntry(entry,start=date,time='08:00',options={}){
  if(!available||loading){status='Zum Bearbeiten bitte zuerst synchronisieren.';paintStatus();return;}
  const expected=revision;
  const master=events.find(e=>e.id===entry?.seriesId);
  const dialog=node('dialog',null,'personal-calendar-dialog'),form=node('form');
  const header=node('h2',entry?'Termin bearbeiten':'Privater Termin');
  const field=(caption,type,name,value,parent=form)=>{
   const row=node('label',caption);const input=node(type==='select'?'select':type==='textarea'?'textarea':'input');
   if(!['select','textarea'].includes(type))input.type=type;
   input.name=name;
   if(type==='select')for(const [key,title] of Object.entries(value)){const option=node('option',title);option.value=key;input.append(option);}
   else if(type==='checkbox')input.checked=Boolean(value);else input.value=value??'';
   row.append(input);parent.append(row);return input;
  };
  form.append(header);
  const scope=master?.repeat?field('Änderung anwenden auf','select','scope',{one:'Nur dieser Termin',future:'Dieser und folgende',series:'Gesamte Serie'}):null;
  const title=field('Titel','text','title',entry?.title);title.required=true;title.maxLength=200;
  const day=field('Datum','date','start',entry?.start||start);day.required=true;
  const all=field('Ganztägig','checkbox','allDay',entry?.allDay??options.allDay);
  const from=field('Beginn','time','startTime',entry?.startTime||time);
  const initialHour=options.endMinute??(M.minutes(time)+60);
  const to=field('Ende','time','endTime',entry?.endTime||String(Math.floor(initialHour/60)%24).padStart(2,'0')+':'+String(initialHour%60).padStart(2,'0'));
  const category=field('Farbe / Kategorie','select','category',colors);category.value=entry?.category||'personal';
  const repeat=field('Wiederholung','select','repeat',repeats);repeat.value=master?.repeat||'';
  const stored=entry?.reminders||[];
  const reminderMinutes=[...new Set([...alerts,...stored])].sort((a,b)=>a-b);
  const reminderOptions={'':'Keine'};for(const n of reminderMinutes)reminderOptions[n]=M.reminderLabel(n);
  const reminder=field('Erinnerung (Kalender-Push in Mein HBL)','select','reminder',reminderOptions);
  reminder.value=String(stored[0]??'');
  const details=node('details');details.append(node('summary','Weitere Optionen'));form.append(details);
  const end=field('Enddatum','date','end',entry?.end||((initialHour>=1440)?M.add(start,1):start),details);end.required=true;
  let previousDay=day.value;
  day.onchange=()=>{
   if(M.validDate(previousDay)&&M.validDate(day.value)&&M.validDate(end.value))end.value=M.add(day.value,M.distance(previousDay,end.value));
   previousDay=day.value;
  };
  to.onchange=()=>{if(!details.open&&from.value&&to.value)end.value=M.add(day.value,to.value<=from.value?1:0);};
  const description=field('Notizen','textarea','description',entry?.description,details);
  const place=field('Ort','text','place',entry?.place,details);
  const interval=field('Wiederholen alle … (Intervall)','number','interval',master?.interval||1,details);interval.min=1;interval.max=365;interval.step=1;
  const stop=field('Wiederholungsende','select','stop',{never:'Nie',date:'Am Datum',school:'Zum Schuljahresende'},details);stop.value=master?.stop||'never';
  const until=field('Letztes Datum','date','until',master?.until,details);
  const skip=field('Ferien und Feiertage überspringen','checkbox','skip',master?.skip,details);
  const extra=reminderMinutes.map(n=>[n,field(M.reminderLabel(n),'checkbox','r'+n,entry?.reminders?.includes(n)&&entry.reminders[0]!==n,details)]);
  const notice=node('p',null,'personal-calendar-status');notice.setAttribute('role','status');form.append(notice);
  const submit=node('button','Speichern');submit.type='submit';
  const cancel=btn('Abbrechen',()=>dialog.close());
  const remove=entry?btn('Löschen',()=>{if(confirm('Ausgewählten Termin oder Serienbereich löschen?'))void commit(null);}):null;
  const actions=node('div',null,'personal-calendar-actions');
  actions.append(submit,cancel);if(remove)actions.append(remove);form.append(actions);
  const timeFields=()=>{from.disabled=to.disabled=all.checked;};all.onchange=timeFields;timeFields();
  if(scope)scope.onchange=()=>{
   const source=scope.value==='series'?master:entry;
   day.value=previousDay=source.start;end.value=source.end;
   from.value=source.startTime;to.value=source.endTime;
  };
  async function commit(replacement){
   submit.disabled=true;if(remove)remove.disabled=true;
   try{await save(M.update(events,entry?.seriesId,entry?.original,scope?.value||'series',replacement,crypto.randomUUID()),expected);dialog.close();}
   catch(error){notice.textContent=error.message;}
   finally{submit.disabled=false;if(remove)remove.disabled=false;}
  }
  form.onsubmit=e=>{
   e.preventDefault();
   const start=day.value,last=end.value;
   const valid=M.validDate(start)&&M.validDate(last)&&last>=start&&M.distance(start,last)<=3660;
   if(!title.value.trim()||!valid||(!all.checked&&(!from.value||!to.value||(start===last&&to.value<=from.value)))){
    details.open=true;notice.textContent='Bitte Titel sowie einen gültigen Beginn und ein späteres Ende angeben.';return;
   }
   const limit=stop.value==='school'?currentSchoolYear(localDate(start)).end:stop.value==='date'?until.value:'';
   if(repeat.value&&stop.value!=='never'&&(!M.validDate(limit)||limit<start)){details.open=true;notice.textContent='Das Wiederholungsende muss am oder nach dem Start liegen.';return;}
   void commit({title:title.value.trim(),start,end:last,startTime:all.checked?'00:00':from.value,endTime:all.checked?'00:00':to.value,allDay:all.checked,
    category:category.value,repeat:repeat.value,interval:Number(interval.value)||1,stop:stop.value,until:limit,skip:skip.checked,
    description:description.value,place:place.value,reminders:[...new Set([...(reminder.value===''?[]:[Number(reminder.value)]),...extra.filter(([,input])=>input.checked).map(([n])=>n)])]});
  };
  dialog.append(form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }
 function openDetails(entry){
  const dialog=node('dialog',null,'personal-calendar-dialog personal-calendar-details');
  const time=entry.allDay?'Ganztägig':entry.startTime+' – '+entry.endTime;
  dialog.append(node('h2',entry.title),node('p',entry.start+(entry.end!==entry.start?' – '+entry.end:'')+' · '+time));
  if(entry.place)dialog.append(node('p',entry.place));
  if(entry.description)dialog.append(node('p',entry.description));
  if(entry.done)dialog.append(node('p','Erledigt'));
  if(entry.reminders?.length)dialog.append(node('p','Erinnerungen: '+entry.reminders.map(M.reminderLabel).join(', ')));
  const actions=node('div',null,'personal-calendar-actions');
  if(!entry.source)actions.append(btn('Bearbeiten',()=>{dialog.close();dialog.remove();openEntry(entry);}));
  if(entry.source==='task'&&!entry.done)actions.append(btn('Aufgabe öffnen',()=>{
   dialog.close();hblNavigate('./');const tile=hblTileById('aufgaben');
   if(tile?.hidden){tile.hidden=false;}
   if(tile?.classList.contains('tile-collapsed'))hblSetTileFold(tile,false,false);
   editTask(entry.sourceId);
  }));
  actions.append(btn('Schließen',()=>dialog.close()));dialog.append(actions);
  document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 }
 function setFilter(key,value){
  if(!serverReady)return;
  const previous=prepDone.__calendarFilters;
  const next={...previous,[key]:value};
  prepDone.__calendarFilters=next;render();
  savePrepFile().catch(()=>{
   // Existing snapshot synchronization retains the pending change on conflicts.
   if(prepDone.__calendarFilters===next){status='Kalenderfilter lokal geändert · Dashboard-Synchronisierung prüfen';paintStatus();}
  });
 }
 function dragSlot(slot,raster,day,hour){
  slot.onpointerdown=e=>{
   if(e.pointerType!=='mouse'||e.button!==0)return;
   const origin=e.clientY,top=raster.getBoundingClientRect().top;
   const minute=y=>Math.min(1425,Math.max(0,Math.floor((y-top)/12)*15));
   const start=minute(origin);
   slot.setPointerCapture(e.pointerId);
   let dragged=false;
   slot.onpointermove=m=>{
    if(Math.abs(m.clientY-origin)<6&&!dragged)return;
    dragged=true;
    const end=minute(m.clientY);
    raster.style.setProperty('--selection-top',Math.min(start,end)/14.4+'%');
    raster.style.setProperty('--selection-height',(Math.abs(start-end)+15)/14.4+'%');
    raster.dataset.selecting='true';
   };
   const finish=event=>{
    slot.onpointermove=slot.onpointerup=slot.onpointercancel=null;
    delete raster.dataset.selecting;
    if(!dragged||event.type!=='pointerup')return;
    slot.onclick=null;
    const other=minute(event.clientY),begin=Math.min(start,other);
    const time=String(Math.floor(begin/60)).padStart(2,'0')+':'+String(begin%60).padStart(2,'0');
    openEntry(null,day,time,{endMinute:Math.max(start,other)+15});
    setTimeout(()=>slot.onclick=()=>openEntry(null,day,hour),0);
   };
   slot.onpointerup=slot.onpointercancel=finish;
  };
 }
 function eventButton(entry,compact=false){
  const text=(entry.allDay?'':entry.startTime+' · ')+entry.title;
  const el=btn(text,()=>openDetails(entry),'personal-calendar-event');
  if(compact)el.classList.add('personal-calendar-mark');
  if(entry.done)el.classList.add('calendar-event-done');
  el.dataset.color=entry.category;el.title=text;el.setAttribute('aria-label',text);return el;
 }
 function onDay(entry,value){return M.overlaps(entry,value,value);}
 function render(){
  if(!host?.isConnected)return;
  host.replaceChildren();
  const title=node('h1','Kalender');
  const head=node('div',null,'personal-calendar-toolbar');
  const input=node('input');input.type='date';input.value=date;input.setAttribute('aria-label','Zu Datum springen');input.onchange=()=>selectDate(input.value);
  const move=direction=>selectDate(mode==='month'?M.shiftMonth(date.slice(0,7)+'-01',direction):M.add(date,direction*(mode==='week'?7:1)));
  const previous=btn('‹',()=>move(-1));previous.setAttribute('aria-label','Zurück');
  const next=btn('›',()=>move(1));next.setAttribute('aria-label','Weiter');
  const views=node('select');views.setAttribute('aria-label','Kalenderansicht');
  for(const [value,text] of Object.entries({month:'Monat',week:'Woche',day:'Tag'})){const option=node('option',text);option.value=value;views.append(option);}
  views.value=mode;views.onchange=()=>{mode=views.value;render();};
  head.append(btn('Dashboard',()=>hblNavigate('./')),previous,btn('Heute',()=>selectDate(M.berlinToday())),next,input,views,btn('+ Termin',()=>openEntry()),btn('Aktualisieren',load));
  const output=node('p',status,'personal-calendar-status');output.setAttribute('role','status');
  const prefs=prepDone.__calendarFilters||{};
  const filters=node('div',null,'personal-calendar-filters');
  for(const [key,text,checked] of [['timetable','Stundenplan anzeigen',!!prefs.timetable],['tasks','Aufgaben anzeigen',prefs.tasks!==false],['completed','Erledigte anzeigen',!!prefs.completed]]){
   const row=node('label',text),toggle=node('input');toggle.type='checkbox';toggle.checked=checked;
   toggle.onchange=()=>setFilter(key,toggle.checked);row.prepend(toggle);filters.append(row);
  }
  host.append(title,head,filters,output);
  const first=mode==='month'?M.monday(date.slice(0,7)+'-01'):mode==='week'?M.monday(date):date;
  const count=mode==='month'?42:mode==='week'?7:1;
  const last=M.add(first,count-1);
  const all=[...M.occurrences(events,first,last,rules),...M.overlays(first,last,prefs,{
   lessons:value=>dayBlocks(localDate(value)),tasks:getTasks
  })].sort((a,b)=>a.start.localeCompare(b.start)||Number(b.allDay||false)-Number(a.allDay||false)||a.startTime.localeCompare(b.startTime));
  const pane=node('div',null,mode==='month'?'personal-calendar-month':'personal-calendar-time-scroll');
  if(mode==='month'){
   const today=M.berlinToday();
   for(const name of ['Mo','Di','Mi','Do','Fr','Sa','So'])pane.append(node('strong',name));
   for(let i=0;i<count;i++){
    const value=M.add(first,i),cell=node('div',null,'personal-calendar-cell');
    const choose=btn(String(Number(value.slice(8))),()=>selectDate(value));choose.setAttribute('aria-label',label(value,{dateStyle:'full'}));
    choose.setAttribute('aria-pressed',String(value===date));
    if(value===today)choose.setAttribute('aria-current','date');
    cell.append(choose);
    const marks=node('div',null,'personal-calendar-marks');for(const entry of all.filter(e=>onDay(e,value)))marks.append(eventButton(entry,true));
    const add=btn('+',()=>openEntry(null,value,'08:00',{allDay:true}),'personal-calendar-add-day');
    add.setAttribute('aria-label','Termin am '+label(value,{dateStyle:'full'})+' erstellen');
    cell.addEventListener('click',event=>{if(event.target===cell)openEntry(null,value,'08:00',{allDay:true});});
    cell.append(add,marks);pane.append(cell);
   }
   const agenda=node('section',null,'personal-calendar-agenda');agenda.append(node('h2',label(date,{dateStyle:'full'})));
   const entries=all.filter(e=>onDay(e,date));for(const entry of entries)agenda.append(eventButton(entry));
   if(!entries.length)agenda.append(node('p','Keine Termine.'));
   host.append(node('h2',label(date,{month:'long',year:'numeric'})),pane,agenda);
  }else{
   pane.tabIndex=0;pane.setAttribute('aria-label','Stundenraster, horizontal scrollbar');
   const grid=node('div',null,'personal-calendar-time-grid');grid.style.setProperty('--days',count);
   for(let day=0;day<count;day++){
    const value=M.add(first,day),column=node('section',null,'personal-calendar-day');
    column.append(node('h2',label(value,{weekday:'short',day:'numeric',month:'numeric'})));
    const entries=all.filter(e=>onDay(e,value));const full=node('div',null,'personal-calendar-allday');
    for(const entry of entries.filter(e=>e.allDay))full.append(eventButton(entry));
    column.append(full);
    const raster=node('div',null,'personal-calendar-hours');
    for(let hour=0;hour<24;hour++){
     const time=String(hour).padStart(2,'0')+':00';
     const slot=btn(time,()=>openEntry(null,value,time),'personal-calendar-slot');
     dragSlot(slot,raster,value,time);raster.append(slot);
    }
    const timed=entries.filter(e=>!e.allDay).map(entry=>({entry,start:entry.start<value?0:M.minutes(entry.startTime),end:entry.end>value?1440:M.minutes(entry.endTime)})).sort((a,b)=>a.start-b.start);
    let group=[],ends=[],until=0;
    const flush=()=>{
     for(const item of group){
      const el=eventButton(item.entry);
      el.style.setProperty('--top',item.start/14.4+'%');el.style.setProperty('--height',(item.end-item.start)/14.4+'%');
      el.style.setProperty('--left',item.lane/ends.length*100+'%');el.style.setProperty('--width',100/ends.length+'%');
      raster.append(el);
     }
     group=[];ends=[];until=0;
    };
    for(const item of timed){
     if(item.start>=until)flush();
     let lane=ends.findIndex(end=>end<=item.start);if(lane<0)lane=ends.length;
     item.lane=lane;ends[lane]=item.end;until=Math.max(until,item.end);group.push(item);
    }
    flush();column.append(raster);grid.append(column);
   }
   pane.append(grid);host.append(pane);
  }
  const legend=node('details',null,'personal-calendar-legend');legend.append(node('summary','Farben'));
  for(const [color,name] of Object.entries(colors)){const tag=node('span',name,'personal-calendar-event');tag.dataset.color=color;legend.append(tag);}
  host.append(legend);
 }
 window.HblCalendar={mount(value){
  date=M.validDate(value)?value:M.berlinToday();
  hblSetView('calendar','<main id="hblPersonalCalendar" class="personal-calendar"></main>');
  host=document.getElementById('hblPersonalCalendar');render();void load();
 }};
 window.addEventListener('hbl-cloud-status',()=>{
  if(owner!==window.hblCloudUser?.()?.id){request++;owner=null;events=[];available=false;loading=false;document.querySelector('.personal-calendar-dialog')?.close();}
  if(host?.isConnected)void load();
 });
 window.addEventListener('hbl-calendar-sources-changed',render);
 window.addEventListener('online',()=>{if(host?.isConnected)void load();});
 document.addEventListener('visibilitychange',()=>{
  if(!document.hidden&&host?.isConnected&&!document.querySelector('.personal-calendar-dialog[open]'))void load();
 });
 setInterval(()=>{
  if(Date.now()-lastPoll>40000&&!document.hidden&&host?.isConnected&&!document.querySelector('.personal-calendar-dialog[open]'))void load();
 },45000);
 window.addEventListener('focus',()=>{if(host?.isConnected&&!document.querySelector('.personal-calendar-dialog[open]'))void load();});
})();
