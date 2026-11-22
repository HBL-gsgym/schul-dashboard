/* HBL PWA – Update-Hinweis statt überraschender Seiten-Neuladung. */
(()=>{
'use strict';
const VERSION=document.querySelector('meta[name="hbl-version"]')?.content||'';
const CHECK_INTERVAL=30000;
let last=0,checking=false,dismissed='';
function newerThan(available,installed){
 const parse=value=>/^(\d+)\.(\d+)\.(\d+)$/.exec(value)?.slice(1).map(Number);
 const next=parse(available),current=parse(installed);
 if(!next||!current)return false;
 for(let i=0;i<3;i++){if(next[i]!==current[i])return next[i]>current[i];}
 return false;
}
function promptUpdate(version){
 if(document.getElementById('hblUpdateNotice')||dismissed===version)return;
 const host=document.createElement('aside');host.id='hblUpdateNotice';host.setAttribute('role','status');
 host.style.cssText='position:fixed;z-index:10020;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));margin:auto;max-width:520px;box-sizing:border-box;padding:12px 14px;border-radius:14px;background:#18253c;color:white;box-shadow:0 12px 32px #0006;font:600 14px system-ui,sans-serif;display:flex;align-items:center;gap:9px;flex-wrap:wrap';
 const text=document.createElement('span');text.textContent='HBL v'+version+' ist verfügbar.';text.style.flex='1 1 160px';
 const update=document.createElement('button');update.textContent='Jetzt aktualisieren';update.type='button';
 update.style.cssText='border:0;border-radius:9px;background:#dce8ff;color:#18253c;padding:10px;font:700 13px system-ui,sans-serif;cursor:pointer';
 update.onclick=()=>{
  // Auf index.html mit neuer URL wechseln (nicht auf die möglicherweise
  // alt gecachte Verzeichnis-URL "./"). Den aktuellen Kurs dabei behalten.
  const url=new URL('./index.html',location.href);
  for(const [key,value] of new URL(location.href).searchParams){
   if(key!=='hbl_reload'&&key!=='hbl_version_check')url.searchParams.append(key,value);
  }
  url.searchParams.set('hbl_reload',String(Date.now()));
  location.assign(url.href);
 };
 const later=document.createElement('button');later.type='button';later.textContent='Später';
 later.style.cssText='border:1px solid #7c95ae;border-radius:9px;background:transparent;color:white;padding:9px;font:600 12px system-ui,sans-serif;cursor:pointer';
 later.onclick=()=>{dismissed=version;host.remove();};
 host.append(text,update,later);document.body.append(host);
}
async function check(force=false){
 if(!navigator.onLine||document.hidden||checking||(!force&&Date.now()-last<CHECK_INTERVAL))return;
 checking=true;last=Date.now();
 try{
  void navigator.serviceWorker?.getRegistration('./').then(reg=>reg?.update()).catch(()=>{});
  const url=new URL('./index.html',location.href);
  url.searchParams.set('hbl_version_check',String(Date.now()));
  const response=await fetch(url.href,{cache:'no-store',signal:AbortSignal.timeout(12000),headers:{'Cache-Control':'no-cache'}});
  if(!response.ok)return;
  const html=await response.text();
  const current=html.match(/name="hbl-version" content="([^"]+)"/)?.[1]||html.match(/<title>[^<]*v([0-9.]+)</)?.[1];
  // Keine Rückwärts-"Updates" anzeigen, falls eine CDN-Kante später reagiert.
  if(current&&VERSION&&newerThan(current,VERSION))promptUpdate(current);
 }catch(_){/* Offline und Netzfehler: still erneut prüfen. */}
 finally{checking=false;}
}
window.hblCheckUpdate=()=>check(true);
function init(){
 if(!('serviceWorker' in navigator))return;
 void check();
 setInterval(()=>void check(),CHECK_INTERVAL);
 navigator.serviceWorker.addEventListener('controllerchange',()=>void check(true));
 window.addEventListener('pageshow',()=>void check(true));
 window.addEventListener('focus',()=>void check(true));
 window.addEventListener('online',()=>{last=0;void check();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check(true);});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
