/* HBL v3.3: Handy-Navigation */
(function(){
  'use strict';
  function jumpTo(element){
    if(!element)return;
    element.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function createButton(icon,label,callback){
    const button=document.createElement('button');
    button.type='button';button.setAttribute('aria-label',label);
    const pict=document.createElement('span');pict.className='hbl-mobile-icon';pict.textContent=icon;
    const text=document.createElement('span');text.textContent=label;
    button.append(pict,text);button.addEventListener('click',callback);
    return button;
  }
  function init(){
    if(document.getElementById('hblMobileNav'))return;
    const nav=document.createElement('nav');
    nav.id='hblMobileNav';nav.className='hbl-mobile-nav';nav.setAttribute('aria-label','Handy-Schnellnavigation');
    const onCourse=!!document.querySelector('.part-shell');
    if(onCourse){
      const link=document.createElement('a');link.href='./';
      const icon=document.createElement('span');icon.className='hbl-mobile-icon';icon.textContent='⌂';
      const txt=document.createElement('span');txt.textContent='Start';link.append(icon,txt);nav.appendChild(link);
      nav.appendChild(createButton('▦','Kurse',()=>jumpTo(document.querySelector('.part-tabs'))));
      nav.appendChild(createButton('✎','Bewerten',()=>jumpTo(document.getElementById('participationTableHost'))));
      nav.appendChild(createButton('⇧','Import',()=>{
        if(typeof toggleParticipationRoster==='function')toggleParticipationRoster(true);
        jumpTo(document.getElementById('participationRoster'));
      }));
      const table=document.getElementById('participationTableHost');
      if(table && !document.querySelector('.part-swipe-tip')){
        const hint=document.createElement('div');hint.className='part-swipe-tip';
        hint.textContent='↔ Tabelle seitlich wischen · Namen bleiben sichtbar';
        table.parentNode.insertBefore(hint,table);
      }
    }else if(document.getElementById('dashboardBoard')){
      const items=[['⌂','Heute','unterricht'],['☑','Aufgaben','aufgaben'],['✎','Mitarbeit','mitarbeit'],['▦','Plan','stundenplan']];
      for(const [icon,label,id] of items){
        nav.appendChild(createButton(icon,label,()=>{
          const tile=document.querySelector('.dashboard-tile[data-tile="'+id+'"]');
          if(!tile)return;
          if(tile.classList.contains('tile-collapsed') && typeof hblSetTileFold==='function')hblSetTileFold(tile,false,true);
          jumpTo(tile);
        }));
      }
    }else{return;}
    document.body.appendChild(nav);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();