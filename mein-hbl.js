/* Persönliche Einstellungen auf dem Dashboard. */
window.openMeinHbl=function(){
 const dialog=document.createElement('dialog');
 dialog.className='mein-hbl';
 dialog.setAttribute('aria-labelledby','meinHblTitle');
 const opener=document.activeElement;
 dialog.innerHTML='<header><h2 id="meinHblTitle">Mein HBL</h2><button type="button" data-close>Schließen</button></header><section data-home><button data-account>Mein Konto</button><button disabled>Benachrichtigungen</button><button data-design>Design</button><button disabled>Dashboard anpassen</button><button data-sync>Daten &amp; Synchronisierung</button><p>Weitere Einstellungen folgen mit den nächsten Etappen.</p><footer><strong>Über HBL</strong><p>Persönlicher Arbeitsplatz für Lehrkräfte · <span data-version></span></p><a href="https://github.com/HBL-gsgym/schul-dashboard/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Änderungsprotokoll</a></footer></section><section data-detail hidden><button data-back>← Zurück</button><label>Darstellung<select data-mode><option value="light">Hell</option><option value="dark">Dunkel</option></select></label><label>Fachdesign<select data-scene-choice><option value="none">Neutral</option><option value="astro">Astronomie</option><option value="math">Mathematik</option><option value="physics">Physik</option></select></label></section>';
 const get=selector=>dialog.querySelector(selector);
 const byId=id=>document.getElementById(id);
 const accountId=()=>window.hblCloudUser?.()?.id;
 const initialId=accountId();
 let handedOff=false;
 function launch(id,leave=true){
  const target=byId(id);
  if(!target||target.hidden||target.disabled||accountId()!==initialId)return;
  if(leave){handedOff=true;dialog.close();}
  target.click();
 }
 const extra=document.createElement('section');
 extra.hidden=true;dialog.append(extra);
 let origin;
 function action(label,fn){
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.onclick=fn;extra.append(button);return button;
 }
 function openSection(trigger){
  origin=trigger;extra.replaceChildren();extra.hidden=false;get('[data-home]').hidden=true;
  get('h2').textContent=origin.textContent;
  action('← Zurück',()=>{
   extra.replaceChildren();extra.hidden=true;get('[data-home]').hidden=false;
   get('h2').textContent='Mein HBL';origin.focus();
  }).focus();
 }
 function existing(id,label,leave){
  if(byId(id)&&!byId(id).hidden)action(label,()=>launch(id,leave));
 }
 get('[data-account]').onclick=()=>{
  openSection(get('[data-account]'));
  const info=document.createElement('p'),user=window.hblCloudUser?.();
  info.textContent=user?[window.hblCurrentUsername,user.email].filter(Boolean).join(' · '):'Nur lokal · nicht angemeldet';extra.append(info);
  existing('hblCloudLogin','Anmelden');
  existing('hblProfileButton','Benutzernamen ändern');
  if(user&&byId('hblProfileButton')&&!byId('hblProfileButton').hidden){
   const form=document.createElement('form');form.hidden=true;
   form.innerHTML='<label>Bisheriges Passwort<input required type="password" autocomplete="current-password"></label><label>Neues Passwort<input required minlength="10" type="password" autocomplete="new-password"></label><label>Neues Passwort bestätigen<input required type="password" autocomplete="new-password"></label><button>Neues Passwort speichern</button><p role="status"></p>';
   const fields=form.querySelectorAll('input'),submit=form.querySelector('button'),status=form.querySelector('p');
   action('Passwort ändern',()=>{form.hidden=false;fields[0].focus();});extra.append(form);
   form.onsubmit=async event=>{
    event.preventDefault();if(submit.disabled)return;
    if(fields[1].value!==fields[2].value){status.textContent='Die neuen Passwörter stimmen nicht überein.';return;}
    submit.disabled=true;status.textContent='Passwort wird geändert …';
    try{await window.hblChangeOwnPassword(initialId,fields[0].value,fields[1].value);form.reset();status.textContent='Passwort geändert.';}
    catch(error){status.textContent=error.message;}
    finally{submit.disabled=false;}
   };
  }
  existing('hblCloudLogout','Abmelden');
 };
 function syncStatus(){
  const output=extra.querySelector('[data-sync-status]');
  if(output)output.textContent=(navigator.onLine?'':'Offline · ')+(byId('hblCloudState')?.textContent||'Speicherstatus noch nicht verfügbar');
 }
 get('[data-sync]').onclick=()=>{
  openSection(get('[data-sync]'));
  const state=document.createElement('p');state.dataset.syncStatus='';state.setAttribute('role','status');extra.append(state);syncStatus();
  existing('hblLocalBackup','Lokale Sicherung herunterladen',false);
  existing('hblCloudRefresh','Jetzt abgleichen',false);
  existing('hblCloudRetry','Erneut speichern',false);
  existing('hblCloudImport','Lokale Testdaten übertragen',false);
 };
 const observer=new MutationObserver(syncStatus);
 if(byId('hblCloudState'))observer.observe(byId('hblCloudState'),{childList:true,subtree:true,characterData:true});
 function accountChanged(){if(accountId()!==initialId&&dialog.open)dialog.close();}
 window.addEventListener('hbl-cloud-status',accountChanged);
 window.addEventListener('online',syncStatus);window.addEventListener('offline',syncStatus);
 dialog.addEventListener('close',()=>{
  observer.disconnect();window.removeEventListener('hbl-cloud-status',accountChanged);
  window.removeEventListener('online',syncStatus);window.removeEventListener('offline',syncStatus);
 },{once:true});
 get('[data-version]').textContent=document.querySelector('.dashboard-version')?.firstChild.textContent.trim()||'';
 if(document.getElementById('hblAdminOpen')){
  const admin=document.createElement('button');admin.onclick=()=>launch('hblAdminOpen');admin.textContent='Administration';
  get('[data-home] p').before(admin);
 }
 function showDesign(detail){
  get('[data-home]').hidden=detail;get('[data-detail]').hidden=!detail;
  get('h2').textContent=detail?'Design':'Mein HBL';
  get('[data-mode]').value=document.body.classList.contains('dark')?'dark':'light';
  get('[data-scene-choice]').value=document.body.dataset.backdrop||'none';
  get(detail?'[data-back]':'[data-design]').focus();
 }
 get('[data-design]').onclick=()=>showDesign(true);
 get('[data-back]').onclick=()=>showDesign(false);
 get('[data-mode]').onchange=event=>{
  if((event.target.value==='dark')!==document.body.classList.contains('dark'))toggleTheme();
 };
 get('[data-scene-choice]').onchange=event=>setBackdrop(event.target.value);
 get('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.remove();if(!handedOff)opener?.focus();},{once:true});
 document.body.append(dialog);dialog.showModal();
};
