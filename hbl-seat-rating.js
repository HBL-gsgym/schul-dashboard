/* Mitarbeit am belegten Sitzplatz. Die Tabelle und der Sitzplan schreiben dieselbe Bewertung. */
(function(root){
'use strict';
function suggestedDate(dates,today,block,remembered){
 const context=today+'|'+(block||'');
 if(remembered?.context===context&&(remembered.id===''||dates.some(d=>d.id===remembered.id)))return remembered.id;
 const sameDay=dates.filter(d=>d.date===today);
 const current=sameDay.filter(d=>block&&d.block===block);
 if(current.length===1)return current[0].id;
 return sameDay.length===1?sameDay[0].id:'';
}
if(typeof module!=='undefined'&&module.exports){module.exports={suggestedDate};return;}

root.hblSeatRating=function(page,host,report){
 let remembered=null,timer;
 const api=page.participation;
 const dateLabel=d=>api.formatDate(d.date)+(d.block>0?' · Block '+d.block:' · ohne Block');
 function selection(data){
  const now=new Date(),today=api.today(now);
  const time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  const block=api.blocks.find(b=>b.start<=time&&time<b.end)?.n;
  const dates=(data.dates||[]).filter(d=>!d.archived);
  return {dates,today,context:today+'|'+(block||''),id:suggestedDate(dates,today,block,remembered)};
 }
 function populate(select,{dates,today,id}){
  select.replaceChildren(new Option('Termin wählen',''));
  const groups=[['Heute',dates.filter(d=>d.date===today)],['Vergangene Termine',dates.filter(d=>d.date<today).reverse()],['Kommende Termine',dates.filter(d=>d.date>today)]];
  for(const [label,items] of groups){
   if(!items.length)continue;
   const optgroup=document.createElement('optgroup');optgroup.label=label;
   for(const d of items)optgroup.append(new Option(dateLabel(d),d.id));
   select.append(optgroup);
  }
  select.value=id;
 }
 function sync(rebuild=false){
  clearTimeout(timer);
  const select=host.querySelector('[data-rating-term]'),data=page.read().data;
  if(!host.isConnected||!select||!data)return;
  const state=selection(data);
  if(rebuild||select.dataset.today!==state.today){
   populate(select,state);select.dataset.today=state.today;
  }else select.value=state.id;
  host.querySelector('[data-rating-key]').hidden=!state.id;
  for(const button of host.querySelectorAll('[data-rate]')){
   const marked=!!state.id&&api.ratings.includes(data.marks?.[button.dataset.rate]?.[state.id]?.rating);
   button.toggleAttribute('data-rated',marked);
   button.setAttribute('aria-label','Mitarbeit für '+button.textContent+' erfassen'+(marked?' · bereits bewertet':''));
  }
  select.onchange=()=>{
   remembered={context:selection(data).context,id:select.value};
   sync();
  };
  timer=setTimeout(sync,60000-Date.now()%60000);
 }
 function open(button){
  const {meta,data}=page.read(),id=button.dataset.rate;
  const person=data?.students?.find(s=>s.id===id);
  if(!meta||!person)return;
  const state=selection(data),dates=state.dates;
  const dialog=document.createElement('dialog');
  dialog.className='grade-dialog seat-rating';
  dialog.setAttribute('aria-labelledby','seatRatingTitle');
  dialog.innerHTML='<h2 id="seatRatingTitle"></h2><p data-course></p><label>Unterrichtstermin<select></select></label><div class="seat-rating-values" role="group" aria-label="Mitarbeit bewerten"></div><p role="status"></p><div class="grade-actions"><button type="button" class="part-button" data-clear>Eintrag leeren</button><button type="button" class="part-button" data-close>Schließen</button></div>';
  dialog.querySelector('h2').textContent=person.name;
  dialog.querySelector('[data-course]').textContent='Mitarbeit · '+meta.subject+' · '+meta.group;
  const select=dialog.querySelector('select'),group=dialog.querySelector('[role=group]'),status=dialog.querySelector('[role=status]');
  const clear=dialog.querySelector('[data-clear]'),close=dialog.querySelector('[data-close]');
  populate(select,state);
  let saving=false,shown='';
  function reflect(){
   const dateId=select.value;
   shown=data.marks?.[id]?.[dateId]?.rating||'';
   for(const key of group.children){
    key.disabled=!dateId||saving;
    key.setAttribute('aria-pressed',String(key.value===shown));
   }
   clear.hidden=!shown;clear.disabled=saving;
   status.textContent=shown?'Vorhandener Eintrag: '+shown:'';
  }
  async function save(value){
   if(saving||!select.value)return;
   const d=dates.find(item=>item.id===select.value);
   const current=page.read().data;
   if(!d||current!==data||!current.dates.some(item=>item.id===d.id&&!item.archived&&item.date===d.date&&item.block===d.block)||
      (current.marks?.[id]?.[d.id]?.rating||'')!==shown||!api.write(current,id,d.id,value)){
    status.textContent='Die Kursdaten haben sich geändert. Bitte den Sitzplatz erneut öffnen.';return;
   }
   saving=true;select.disabled=true;close.disabled=true;reflect();status.textContent='Speichert …';
   try{
    await page.save();
    remembered={context:state.context,id:d.id};
    sync();
    dialog.close();
    report(person.name+' · '+dateLabel(d)+' · '+(value?'Mitarbeit '+value+' gespeichert.':'Eintrag geleert.'));
   }catch(error){
    saving=false;select.disabled=false;close.disabled=false;reflect();
    status.textContent='Speichern fehlgeschlagen. Speicherstatus prüfen: '+error.message;
   }
  }
  for(const rating of api.ratings){
   const key=document.createElement('button');
   key.type='button';key.value=rating;key.textContent=rating.replaceAll('-','−');key.className='part-button';
   key.onclick=()=>save(rating);group.append(key);
  }
  select.onchange=()=>{
   remembered={context:state.context,id:select.value};
   reflect();sync();
  };
  clear.onclick=()=>save('');close.onclick=()=>dialog.close();
  dialog.oncancel=event=>{if(saving)event.preventDefault();};
  dialog.onclose=()=>{dialog.remove();host.querySelector('[data-rate="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});};
  reflect();
  if(!dates.length){
   select.disabled=true;status.textContent='Für diesen Kurs fehlt ein Unterrichtstermin. ';
   const link=document.createElement('a');link.href='?mitarbeit='+encodeURIComponent(page.id);
   link.textContent='Termin in der Mitarbeit ergänzen';status.append(link);
  }
  document.body.append(dialog);dialog.showModal();
  (select.value?group.querySelector('[aria-pressed=true]')||group.firstElementChild:select).focus();
 }
 return {open,sync};
};
})(typeof window==='undefined'?globalThis:window);
