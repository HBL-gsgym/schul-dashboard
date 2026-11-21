/* HBL PWA – Update-Hinweis statt überraschender Seiten-Neuladung. */
(()=>{
'use strict';
const VERSION=document.querySelector('meta[name="hbl-version"]')?.content||'';
const CHECK_INTERVAL=300000;
let last=0,checking=false,dismissed='';
function promptUpdate(version){
 if(document.getElementById('hblUpdateNotice')||dismissed===version)return;
 const host=document.createElement('aside');host.id='hblUpdateNotice';host.setAttribute('role','status');
 host.style.cssText='position:fixed;z-index:10020;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));margin:auto;max-width:520px;box-sizing:border-box;padding:12px 14px;border-radius:14px;background:#18253c;color:white;box-shadow:0 12px 32px #0006;font:600 14px system-ui,sans-serif;display:flex;align-items:center;gap:9px;flex-wrap:wrap';
 const text=document.createElement('span');text.textContent='HBL v'+version+' ist verfügbar.';text.style.flex='1 1 160px';
 const update=document.createElement('button');update.textContent='Jetzt aktualisieren';update.type='button';
 update.style.cssText='border:0;border-radius:9px;background:#dce8ff;color:#18253c;padding:10px;font:700 13px system-ui,sans-serif;cursor:pointer';
 update.onclick=()=>{
  const url=new URL(location.href);
  url.searchParams.set('hbl_reload',String(Date.now()));
  location.assign(url.href);
 };
 const later=document.createElement('button');later.type='button';later.textContent='Später';
 later.style.cssText='border:1px solid #7c95ae;border-radius:9px;background:transparent;color:white;padding:9px;font:600 12px system-ui,sans-serif;cursor:pointer';
 later.onclick=()=>{dismissed=version;host.remove();};
 host.append(text,update,later);document.body.append(host);
}
async function check(){
 if(!navigator.onLine||document.hidden||checking||Date.now()-last<CHECK_INTERVAL)return;
 checking=true;last=Date.now();
 try{
  const reg=await navigator.serviceWorker?.getRegistration('./');
  if(reg)await reg.update().catch(()=>{});
  const url=new URL('./index.html',location.href);
  url.searchParams.set('hbl_version_check',String(Date.now()));
  const response=await fetch(url.href,{cache:'no-store'});
  if(!response.ok)return;
  const html=await response.text();
  const current=html.match(/name="hbl-version" content="([^"]+)"/)?.[1]||html.match(/<title>[^<]*v([0-9.]+)</)?.[1];
  if(current&&VERSION&&current!==VERSION)promptUpdate(current);
 }catch(_){/* Offline und Netzfehler: still erneut prüfen. */}
 finally{checking=false;}
}
function init(){
 if(!('serviceWorker' in navigator))return;
 void check();
 window.addEventListener('pageshow',()=>void check());
 window.addEventListener('focus',()=>void check());
 window.addEventListener('online',()=>{last=0;void check();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
