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
  let dispose=()=>{};
  function init(){
    const onCourse=!!document.querySelector('.part-shell');
    const onWorkspace=!!document.querySelector('.course-workspace');
    const onDashboard=!!document.getElementById('dashboardBoard');
    const mode=onCourse?'participation':onWorkspace?'course':onDashboard?'dashboard':'none';
    const previous=document.getElementById('hblMobileNav');
    // Kein Austausch derselben Leiste bei Kurs- oder Tabwechseln.
    if(previous?.dataset.navMode===mode)return;
    dispose();
    previous?.remove();
    if(mode==='none')return;
    const controller=new AbortController(),observers=[];
    dispose=()=>{controller.abort();observers.forEach(o=>o.disconnect());};
    const nav=document.createElement('nav');
    nav.id='hblMobileNav';nav.className='hbl-mobile-nav';nav.dataset.navMode=mode;
    nav.setAttribute('aria-label','Handy-Schnellnavigation');
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
    }else if(onWorkspace){
      const link=document.createElement('a');link.href='./';link.textContent='⌂ Start';nav.appendChild(link);
      nav.appendChild(createButton('▦','Kurse',()=>jumpTo(document.querySelector('.hbl-course-picker'))));
      for(const [icon,label,view] of [['▣','Übersicht','kurs'],['✎','Mitarbeit','mitarbeit'],['★','Noten','noten']]){
        nav.appendChild(createButton(icon,label,()=>{
          const id=document.getElementById('hblCourseTabs')?.dataset.courseId;
          if(id)window.hblNavigate?.('?'+view+'='+encodeURIComponent(id));
        }));
      }
      nav.style.gridTemplateColumns='repeat(5,minmax(0,1fr))';
    }else if(onDashboard){
      // Frühere Kachel-Schnellzugriffe bleiben erhalten. Konto und Chat sind
      // unabhängig von ausgeblendeten Kacheln immer über die Leiste erreichbar.
      const items=[['⌂','Heute','unterricht'],['☑','Aufgaben','aufgaben'],['▦','Kurse','mitarbeit'],['▦','Plan','stundenplan']];
      for(const [icon,label,id] of items){
        const shortcut=createButton(icon,label,()=>{
          const tile=document.querySelector('.dashboard-tile[data-tile="'+id+'"]');
          if(!tile)return;
          if(tile.classList.contains('tile-collapsed') && typeof hblSetTileFold==='function')hblSetTileFold(tile,false,true);
          jumpTo(tile);
        });
        shortcut.dataset.tileLink=id;nav.appendChild(shortcut);
      }
      const chatButton=createButton('💬','Chat',()=>{
        const original=document.getElementById('hblChatToggle');
        if(original&&!original.hidden){original.click();return;}
        if(!window.hblCloudUser?.())document.getElementById('hblCloudLogin')?.click();
        else alert('Der Kollegium-Chat ist für dieses Konto derzeit nicht freigeschaltet.');
      });
      chatButton.id='hblMobileChat';
      const unread=document.createElement('span');unread.className='hbl-mobile-chat-badge';unread.hidden=true;
      chatButton.appendChild(unread);nav.appendChild(chatButton);
      const accountButton=createButton('👤','Anmelden',()=>{
        if(!window.hblCloudUser?.()){document.getElementById('hblCloudLogin')?.click();return;}
        window.openMeinHbl?.();
        document.querySelector('dialog.mein-hbl [data-account]')?.click();
      });
      accountButton.id='hblMobileAccount';nav.appendChild(accountButton);
      nav.appendChild(createButton('⚙','Mein HBL',()=>window.openMeinHbl()));
      function syncAccount(){
        const user=window.hblCloudUser?.();
        const name=user?String(window.hblCurrentUsername||user.email?.split('@')[0]||'Konto').trim():'Anmelden';
        accountButton.querySelector('span:last-child').textContent=name;
        accountButton.title=user?'Konto: '+name:'Mit dem Dashboard-Konto anmelden';
        accountButton.setAttribute('aria-label',user?'Mein Konto: '+name:'Anmelden');
      }
      function syncChat(){
        const source=document.getElementById('hblChatToggle'),badge=document.getElementById('hblChatBadge');
        const text=source&&!source.hidden&&badge&&!badge.hidden?badge.textContent.trim():'';
        unread.hidden=!text;unread.textContent=text;
        chatButton.setAttribute('aria-label',text?'Chat: '+text+' ungelesene Nachrichten':'Kollegium-Chat');
      }
      function syncShortcuts(){
        let visible=3; // Chat, Konto und Mein HBL bleiben immer erreichbar.
        for(const button of nav.querySelectorAll('[data-tile-link]')){
          const tile=document.querySelector('.dashboard-tile[data-tile="'+button.dataset.tileLink+'"]');
          button.hidden=!tile||tile.hidden;
          if(!button.hidden)visible++;
        }
        nav.style.gridTemplateColumns='repeat('+visible+',minmax('+(visible>4?'76px':'0')+',1fr))';
      }
      syncShortcuts();syncAccount();syncChat();
      const shortcutsObserver=new MutationObserver(syncShortcuts);
      shortcutsObserver.observe(document.getElementById('dashboardBoard'),{attributes:true,attributeFilter:['hidden'],subtree:true});observers.push(shortcutsObserver);
      const cloudActions=document.querySelector('#hblCloudControls .hbl-cloud-actions');
      if(cloudActions){const chatObserver=new MutationObserver(syncChat);chatObserver.observe(cloudActions,{attributes:true,attributeFilter:['hidden'],childList:true,characterData:true,subtree:true});observers.push(chatObserver);}
      window.addEventListener('hbl-cloud-status',()=>{syncAccount();syncChat();},{signal:controller.signal});
      window.addEventListener('hbl-profile-changed',syncAccount,{signal:controller.signal});
      window.addEventListener('hbl-chat-access-changed',syncChat,{signal:controller.signal});
    }else{return;}
    document.body.appendChild(nav);
  }
  window.addEventListener('hbl-route-changed',init);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
