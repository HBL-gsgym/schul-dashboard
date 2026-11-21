/* Persönliche Einstellungen auf dem Dashboard. */
window.openMeinHbl=function(){
 const dialog=document.createElement('dialog');
 dialog.className='mein-hbl';
 dialog.setAttribute('aria-labelledby','meinHblTitle');
 const opener=document.activeElement;
 dialog.innerHTML='<header><h2 id="meinHblTitle">Mein HBL</h2><button type="button" data-close>Schließen</button></header><section data-home><button disabled>Mein Konto</button><button disabled>Benachrichtigungen</button><button data-design>Design</button><button disabled>Dashboard anpassen</button><button disabled>Daten &amp; Synchronisierung</button><p>Weitere Einstellungen folgen mit den nächsten Etappen.</p><footer><strong>Über HBL</strong><p>Persönlicher Arbeitsplatz für Lehrkräfte · <span data-version></span></p><a href="https://github.com/HBL-gsgym/schul-dashboard/blob/main/CHANGELOG.md" target="_blank" rel="noopener">Änderungsprotokoll</a></footer></section><section data-detail hidden><button data-back>← Zurück</button><label>Darstellung<select data-mode><option value="light">Hell</option><option value="dark">Dunkel</option></select></label><label>Fachdesign<select data-scene-choice><option value="none">Neutral</option><option value="astro">Astronomie</option><option value="math">Mathematik</option><option value="physics">Physik</option></select></label></section>';
 const get=selector=>dialog.querySelector(selector);
 get('[data-version]').textContent=document.querySelector('.dashboard-version')?.firstChild.textContent.trim()||'';
 if(document.getElementById('hblAdminOpen')){
  const admin=document.createElement('button');admin.disabled=true;admin.textContent='Administration';
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
 dialog.addEventListener('close',()=>{dialog.remove();opener?.focus();},{once:true});
 document.body.append(dialog);dialog.showModal();
};
