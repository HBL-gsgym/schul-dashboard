/* HBL v5.5 – Offline-App-Shell & Push-Empfang. Keine Nutzerdaten im SW-Cache. */
const CACHE="hbl-pwa-shell-v600-mein-hbl";
const ASSETS=["./supabase/functions/hbl-push-dispatch/push-policy.mjs?v=6.0.0","./mein-hbl.js?v=6.0.0","./hbl-grades.js?v=5.9.20","./hbl-seating.js?v=5.9.21","./hbl-seat-rating.js?v=5.9.21","./hbl-seat-view.js?v=5.9.22","./hbl-course-page.js?v=5.9.20","./hbl-course-page.css?v=5.9.22","./hbl-courses.js?v=5.9.13","./hbl-course-ids.js?v=5.9.10","./","./index.html","./mobile.css?v=3.3","./cloud.css?v=5.10.4",
 "./hbl-v55.css?v=5.9.8-plan","./hbl-v56.css?v=5.6","./hbl-v57.css?v=5.9.7-chat","./hbl-v58.css?v=5.8","./hbl-v59.css?v=5.9.11-courses","./mobile.js?v=5.10.5","./cloud.js?v=5.10.3",
 "./hbl-v55.js?v=5.9.9-today","./hbl-v56.js?v=5.9.5-invites","./hbl-v57.js?v=5.9.7-chat","./hbl-v58.js?v=5.9.5","./hbl-v59.js?v=6.0.0","./manifest.webmanifest","./hbl-icon.svg","./hbl-icon-192.png","./hbl-icon-512.png","./hbl-icon-180.png"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(Promise.all([
  caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("hbl-pwa-shell-")&&k!==CACHE).map(k=>caches.delete(k)))),
  self.clients.claim()
 ]));
});
self.addEventListener("fetch",event=>{
 const req=event.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));}
   return res;
  }).catch(()=>caches.match("./index.html")));
  return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
  if(res.ok&&["script","style","image","manifest"].includes(req.destination)){
   const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy));
  }
  return res;
 })));
});
self.addEventListener("push",event=>{
 let data={};
 try{data=event.data?.json()||{};}catch(_){data={};}
 const title=typeof data.title==="string"?data.title.slice(0,90):"Schul-Dashboard HBL";
 const body=typeof data.body==="string"?data.body.slice(0,180):"Du hast eine Erinnerung.";
 const tag=typeof data.tag==="string"?data.tag.slice(0,180):"hbl-unterricht";
 event.waitUntil(self.registration.showNotification(title,{
  body,tag,icon:"./hbl-icon-192.png",badge:"./hbl-icon-192.png",data:{url:"./"},timestamp:Date.now()
 }));
});
self.addEventListener("notificationclick",event=>{
 event.notification.close();
 event.waitUntil((async()=>{
  const target=new URL("./",self.registration.scope).href;
  const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
  const open=windows.find(x=>x.url.startsWith(target));
  if(open){await open.focus();return;}
  if(self.clients.openWindow)await self.clients.openWindow(target);
 })());
});
