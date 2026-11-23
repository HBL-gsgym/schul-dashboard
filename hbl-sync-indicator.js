/* One persistent indicator follows the active navigation, including cached course tabs. */
(()=>{
 const root=document.documentElement;
 const labels={synced:['✓','Synchronisiert'],pending:['↻','Ausstehend'],error:['!','Sync-Problem']};
 let scheduled=false;
 function visible(node){return node&&!node.hidden&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';}
 function render(){
  scheduled=false;
  const button=document.getElementById('hblSyncNotice');if(!button)return;
  const state=window.hblSyncState||{state:'pending',message:'Synchronisierung wird geprüft'};
  const [icon,label]=labels[state.state]||labels.pending;
  button.dataset.sync=state.state;
  button.title=state.message+' · Synchronisierung öffnen';
  button.setAttribute('aria-label',button.title);
  const symbol=document.createElement('span');symbol.className='sync-symbol';symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');
  const text=document.createElement('span');text.className='sync-label';text.textContent=label;
  button.replaceChildren(symbol,text);
  const desktop=document.getElementById('workspaceNav'),mobile=document.getElementById('hblMobileNav'),quick=document.getElementById('hblQuickbar');
  const host=visible(desktop)?desktop:visible(mobile)?mobile:visible(quick)?quick:document.body;
  button.dataset.docked=String(host!==document.body);
  if(button.parentNode!==host){host.prepend(button);window.dispatchEvent(new Event('hbl-sync-mounted'));}
 }
 function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
 window.addEventListener('hbl-sync-state',render);
 for(const name of ['resize','hbl-route-changed','hbl-cloud-status'])window.addEventListener(name,schedule);
 new MutationObserver(schedule).observe(root,{attributes:true,attributeFilter:['data-platform','data-dock','data-compact']});
 schedule();
})();
