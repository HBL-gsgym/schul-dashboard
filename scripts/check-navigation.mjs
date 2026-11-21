// Run with Node 22+ and CHROME_PATH pointing to Chrome. Uses only synthetic local data.
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
const root=fileURLToPath(new URL('../',import.meta.url));
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!path.startsWith(resolve(root)+sep))throw Error();
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':({'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8'})[extname(path)]||'application/octet-stream','Content-Security-Policy':"default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'none'"});res.end(body);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const profile=await mkdtemp(join(tmpdir(),'hbl-nav-'));
const chrome=spawn(process.env.CHROME_PATH||'chrome',['--headless','--disable-gpu','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
try{
 let port;
 for(let i=0;i<100&&!port;i++){await delay(100);try{port=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]}catch{}}
 assert.ok(port,'Chrome konnte nicht starten');
 const [tab]=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise(done=>ws.onopen=done);
 let serial=0;const pending=new Map(),requests=[];
 ws.onmessage=({data})=>{const m=JSON.parse(data);if(m.method==='Runtime.exceptionThrown')console.error(m.params.exceptionDetails.exception?.description);if(m.method==='Network.requestWillBeSent'){requests.push(m.params.type);if(m.params.type==='Document')console.log('Dokument',m.params.request.url);}if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}};
 async function call(method,params={}){const id=++serial;const reply=new Promise(done=>pending.set(id,done));ws.send(JSON.stringify({id,method,params}));const m=await reply;if(m.error)throw Error(m.error.message);return m.result}
 async function js(expression){const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.result.description);return r.result.value}
 await call('Runtime.enable');await call('Network.enable');await call('Page.enable');
 const mobile=!process.argv.includes('--desktop');
 if(mobile){
  await call('Emulation.setDeviceMetricsOverride',{width:393,height:852,deviceScaleFactor:2.75,mobile:true});
  await call('Emulation.setTouchEmulationEnabled',{enabled:true});
  await call('Network.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0 Mobile Safari/537.36'});
 }
 await call('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('hbl-github-pages-demo-v1',JSON.stringify({__timetableV1:{version:1,slots:{'1-1':{A:{subject:'Demo A',group:'Gruppe A',room:'1'},B:{subject:'Demo B',group:'Gruppe B',room:'2'}}}}}));`});
 await call('Page.navigate',{url:'http://127.0.0.1:'+server.address().port+'/'});
 for(let i=0;i<100&&!await js("!!document.querySelector('.pcourse-action')");i++)await delay(100);
 const result=await js(`(async()=>{
 const q=s=>document.querySelector(s),frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const click=async s=>{const a=q(s);if(!a)throw Error('Element fehlt: '+s);a.click();await frame()};
 const card=q('.pcourse-action'),nav=q('#hblMobileNav'),board=q('#dashboardBoard'),cell=q('#weeklyTimetable button');
 const search=q('input[type=search]')||q('#dashboardBoard input:not([type])');
 if(!search)throw Error('Kein Eingabefeld');search.value='Entwurf';search.focus();
 window.scrollTo({top:200,behavior:'instant'});await frame();const homeY=scrollY;
 const boardTop=board.getBoundingClientRect().top;
 let moved=0;const observer=new MutationObserver(records=>{moved+=records.reduce((n,r)=>n+r.removedNodes.length,0)});observer.observe(board,{childList:true});
 await click('.pcourse-action');const picker=q('#hblCourseTabs'),tab=q('.hbl-course-tab'),seat=q('.seat-section');
 await click('.hbl-course-tab[href^="?mitarbeit"]');const pickerDuring=q('#hblCourseTabs')===picker;
 await click('.hbl-course-tab[href^="?noten"]');const grades=q('.grade-scroll');
 await click('.hbl-course-picker a:not(.current)');await click('.hbl-course-picker a:not(.current)');
 const sameGrades=!!grades&&q('.grade-scroll')===grades;
 await click('.hbl-course-tab[href^="?kurs"]');const sameSeat=q('.seat-section')===seat;
 const updated=structuredClone(prepDone);
 updated.__coursesV1.courses[new URL(card.href).searchParams.get('kurs')].note='Neue Kursnotiz';
 applyPrepData(updated);await savePrepFile();
 await click('.part-back');const sameCard=q('.pcourse-action')===card,sameNav=q('#hblMobileNav')===nav;
 const restored=search.isConnected&&search.value==='Entwurf'&&document.activeElement===search&&Math.abs(scrollY-homeY)<2;
 const fresh=q('#participationOverview').innerText.includes('Neue Kursnotiz')&&localStorage.getItem('hbl-github-pages-demo-v1').includes('Neue Kursnotiz');
 const sameCell=!!cell&&cell===q('#weeklyTimetable button');
 const boardShift=Math.abs(board.getBoundingClientRect().top-boardTop);
 const back=new Promise(r=>addEventListener('popstate',r,{once:true}));history.back();await back;await frame();
 observer.disconnect();return {sameCard,sameNav,sameGrades,sameSeat,pickerDuring,sameTab:q('.hbl-course-tab')===tab,boardMoves:moved,boardShift,back:!!q('.seat-section'),restored,fresh,sameCell};
 })()`);
 console.log({mobile,...result,documents:requests.filter(t=>t==='Document').length});
 for(const key of ['sameCard','sameNav','sameGrades','sameSeat','pickerDuring','sameTab','back','restored','fresh','sameCell'])assert.equal(result[key],true,key);
 assert.equal(result.boardMoves,0);assert.ok(result.boardShift<2);assert.equal(requests.filter(t=>t==='Document').length,1);
}finally{ws?.close();chrome.kill();server.closeAllConnections();server.close();await delay(350);await rm(profile,{recursive:true,force:true,maxRetries:4,retryDelay:250});}
