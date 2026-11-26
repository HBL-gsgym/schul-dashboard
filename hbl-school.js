/* School organization shares the dashboard navigation and account session. */
(()=>{
 let host,screen,view='overview',overview,adminData,epoch=0;
 const labels={overview:'Übersicht',teachers:'Lehrkräfte',requests:'Anträge',subjects:'Fachgruppen',committees:'Gremien',settings:'Schuleinstellungen'};
 const statuses={active:'Bestätigt',invited:'Eingeladen',suspended:'Gesperrt',revoked:'Entzogen',pending:'Offen',approved:'Bestätigt',rejected:'Abgelehnt'};
 const kinds={join:'Schulbeitritt',membership:'Mitgliedschaft',subject:'Vorgeschlagenes Fach',committee:'Vorgeschlagenes Gremium'};
 const node=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
 const button=(text,fn)=>{const e=node('button',text);e.type='button';e.onclick=fn;return e;};
 const call=async(op,p={})=>{
  const response=await window.hblCloudClient.rpc('hbl_school_action',{op,p});
  if(response.error)throw Error(response.error.code==='42501'?'Für diese Aktion fehlt die Berechtigung.':response.error.code==='23505'?'Dieser Eintrag ist bereits vorhanden.':response.error.message);
  return response.data;
 };
 const groups=()=>overview?.groups||[];
 const groupName=id=>(adminData?.groups||groups()).find(g=>g.id===id)?.name||'';
 const memberName=m=>[m.first_name,m.last_name].filter(Boolean).join(' ')||m.name||'Lehrkraft';
 function input(label,name,type='text',value='',required=false){
  const row=node('label',label),field=node('input');Object.assign(field,{name,type,value,required});row.append(field);return row;
 }
 function select(label,name,entries){
  const row=node('label',label),field=node('select');field.name=name;
  for(const [value,title] of entries){const option=node('option',title);option.value=value;field.append(option);}
  row.append(field);return row;
 }
 function groupChooser(list,selected=[]){
  const wrap=node('fieldset');wrap.className='hbl-school-choices';wrap.append(node('legend','Auswahl'));
  const search=node('input');search.type='search';search.placeholder='Auswahl durchsuchen';search.setAttribute('aria-label','Auswahl durchsuchen');
  wrap.append(search);
  for(const g of list){
   const row=input(g.name,'group','checkbox',g.id);row.querySelector('input').checked=selected.includes(g.id);
   row.dataset.choice=g.name.toLocaleLowerCase('de');wrap.append(row);
  }
  search.oninput=()=>{for(const r of wrap.querySelectorAll('[data-choice]'))r.hidden=!r.dataset.choice.includes(search.value.toLocaleLowerCase('de').trim());};
  return wrap;
 }
 function form(children,text,fn){
  const f=node('form');f.className='hbl-school-form';f.append(...children);
  const submit=node('button',text);submit.type='submit';
  const note=node('p');note.setAttribute('role','status');
  f.onsubmit=async e=>{
   e.preventDefault();submit.disabled=true;note.textContent='Wird verarbeitet …';
   try{await fn(new FormData(f),note);if(note.textContent==='Wird verarbeitet …')note.textContent='Gespeichert';}
   catch(error){note.textContent=error.message;}
   finally{submit.disabled=false;}
  };
  f.append(submit,note);return f;
 }
 async function change(op,params){await call(op,params);await load();}
 function section(title,...children){const box=node('section');box.className='hbl-school-section';box.append(node('h2',title),...children);return box;}
 function teacherPane(){
  const choices=()=>groupChooser(groups());
  const identity=()=>[input('Vorname','first_name','text','',true),input('Nachname','last_name','text','',true)];
  const invite=node('details');invite.append(node('summary','+ Lehrkraft hinzufügen'),form([...identity(),input('E-Mail','email','email','',true),choices()],'Einladungslink erstellen',async(data,note)=>{
   const params=Object.fromEntries(data);params.groups=data.getAll('group');
   const result=await hblCloudClient.functions.invoke('hbl-school-invite',{body:params});
   if(result.error){
    const failure=await result.error.context?.json?.().catch(()=>null);
    throw Error(failure?.error||'Einladung fehlgeschlagen.');
   }
   if(!result.data?.action_link)throw Error('Kein Einladungslink erhalten.');
   const link=node('input');link.value=result.data.action_link;link.readOnly=true;link.setAttribute('aria-label','Einmaliger Einrichtungslink');
   note.replaceChildren(node('span','Einmaligen Link nur an diese Lehrkraft weitergeben.'),link,
    button('Link kopieren',async()=>{try{await navigator.clipboard.writeText(link.value);}catch(_){link.select();}}));
  }));
  const eligible=node('details');eligible.append(node('summary','Bestehendes Konto einzeln übernehmen'));
  eligible.open=adminData.eligible.length>0;
  const assign=(accounts,ownerList=false)=>form([
   select(ownerList?'Dashboard-Konto':'Freigegebenes Konto','user_id',[['','Bitte auswählen'],...accounts.map(m=>[m.id,[m.username,m.email].filter(Boolean).join(' · ')])]),
   ...identity(),choices()
  ],'Der Schule zuweisen',async d=>{
   const selected=accounts.find(account=>account.id===d.get('user_id'));
   if(!selected)throw Error('Bitte ein Konto auswählen.');
   if(!confirm(selected.email+' dieser Schule zuweisen?'))return;
   if(ownerList)await call('allow_existing',{email:selected.email});
   await change('assign_existing',{...Object.fromEntries(d),groups:d.getAll('group')});
  });
  if(adminData.eligible.length)eligible.append(assign(adminData.eligible));
  else eligible.append(node('p','Kein Konto zur Einzelübernahme freigegeben. Die Lehrkraft kann auch selbst einen Beitrittsantrag stellen.'));
  if(window.hblCanManageUsers?.()){
   const directory=node('details');directory.append(node('summary','Angelegte Dashboard-Konten anzeigen'));
   const content=node('div');directory.append(content);eligible.append(directory);
   directory.ontoggle=async()=>{
    if(!directory.open||content.dataset.loaded)return;
    content.dataset.loaded='true';content.textContent='Konten werden geladen …';
    try{
     const accounts=await window.hblListManagedUsers();
     if(!directory.isConnected)return;
     const members=new Map(adminData.members.map(m=>[m.user_id,m]));
     const list=node('ul');list.className='hbl-school-directory';
     for(const account of accounts){
      const membership=members.get(account.id);
      const state=membership?'Schule: '+statuses[membership.status]:
       !account.is_member?'Dashboard nicht freigegeben':!account.confirmed_at?'E-Mail unbestätigt':'Ohne Schulzuordnung';
      list.append(node('li',[account.username,account.email,state].filter(Boolean).join(' · ')));
     }
     content.replaceChildren(list);
     const selectable=accounts.filter(a=>a.is_member&&a.confirmed_at&&!members.has(a.id));
     if(selectable.length)content.append(assign(selectable,true));
     else content.append(node('p','Keine bestätigten, freigegebenen Konten ohne Schulzuordnung.'));
    }catch(error){delete content.dataset.loaded;content.textContent=error.message;}
   };
  }
  const search=node('input');search.type='search';search.placeholder='Name oder Fach suchen';search.setAttribute('aria-label',search.placeholder);
  const list=node('div');
  for(const m of adminData.members){
   const row=node('details');row.dataset.memberSearch=[memberName(m),...m.groups.map(groupName)].join(' ').toLocaleLowerCase('de');
   const groupLabels=m.groups.map(groupName).filter(Boolean);
   row.append(node('summary','Zuordnungen verwalten'));
   const record=node('article');
   record.dataset.memberSearch=row.dataset.memberSearch;
   record.append(node('strong',m.user_id===window.hblCloudUser?.()?.id?(window.hblCurrentUsername||memberName(m)):memberName(m)),
    node('span',' · '+statuses[m.status]),node('p',(m.status==='active'?'Gruppen: ':'Hinterlegte Gruppen: ')+(groupLabels.join(', ')||'Keine')));

   if(m.user_id!==window.hblCloudUser?.()?.id){
    row.append(form([select('Schulzugang','status',[['active','Bestätigen'],['suspended','Sperren'],['revoked','Entziehen']])],'Status speichern',
      d=>{if(d.get('status')==='revoked'&&!confirm('Schulzugehörigkeit und Gruppenmitgliedschaften entziehen?'))return;return change('member_status',{user_id:m.user_id,status:d.get('status')});}));
    row.append(form([select('Fachgruppe oder Gremium','group_id',groups().map(g=>[g.id,g.name])),select('Zuordnung','enabled',[['true','Hinzufügen'],['false','Entfernen']])],'Zuordnung speichern',
     d=>change('group_member',{user_id:m.user_id,group_id:d.get('group_id'),enabled:d.get('enabled')==='true'})));
   }
   if(row.children.length>1)record.append(row);
   list.append(record);
  }
  search.oninput=()=>{for(const row of list.children)row.hidden=!row.dataset.memberSearch.includes(search.value.toLocaleLowerCase('de').trim());};
  return section('Lehrkräfte',node('h3','Schulmitglieder und Gruppen'),search,list,invite,eligible);
 }
 function groupPane(kind){
  const list=node('div');
  for(const g of (adminData.groups||groups()).filter(g=>g.kind===kind)){
   const box=node('details');const roster=node('p');
   box.append(node('summary',g.name+(g.active===false?' · Archiviert':'')),roster);
   const active=input('Im Katalog verfügbar','active','checkbox','yes');active.querySelector('input').checked=g.active!==false;
   box.append(form([input('Name','name','text',g.name,true),active],'Gruppe speichern',d=>change('group_settings',{group_id:g.id,name:d.get('name'),active:d.has('active')})));
   box.ontoggle=async()=>{if(!box.open||g.active===false)return;try{const members=await call('group_roster',{group_id:g.id});roster.textContent=members.map(memberName).join(', ')||'Keine bestätigten Mitglieder.';}catch(e){roster.textContent=e.message;}};
   const candidates=adminData.members.filter(m=>m.status==='active'||m.status==='invited');
   if(candidates.length&&g.active!==false)box.append(form([select('Lehrkraft','user_id',candidates.map(m=>[m.user_id,memberName(m)])),select('Zuordnung','enabled',[['true','Hinzufügen'],['false','Entfernen']])],'Zuordnung speichern',
    d=>change('group_member',{group_id:g.id,user_id:d.get('user_id'),enabled:d.get('enabled')==='true'})));
   list.append(box);
  }
  return section(kind==='subject'?'Fachgruppen':'Gremien',form([input('Neuer Name','name','text','',true)],'Hinzufügen',d=>{
   const name=String(d.get('name')).trim();
   const close=groups().find(g=>g.kind===kind&&(g.name.toLocaleLowerCase('de').includes(name.toLocaleLowerCase('de'))||name.toLocaleLowerCase('de').includes(g.name.toLocaleLowerCase('de'))));
   if(close&&!confirm('Ähnlicher Eintrag: '+close.name+'. Trotzdem hinzufügen?'))return;
   return change('create_group',{kind,name});
  }),list);
 }
 function renderAdmin(){
  if(!overview.admin||!adminData){host.append(node('p','Die Schulverwaltung ist für dieses Konto nicht freigegeben.'));return;}
  const tabs=node('nav');tabs.className='hbl-school-tabs';tabs.setAttribute('aria-label','Schulverwaltung');
  for(const [id,text] of Object.entries(labels)){
   const tab=button(text,()=>{view=id;render();});if(id===view)tab.setAttribute('aria-current','page');tabs.append(tab);
  }
  host.append(tabs);
  if(view==='teachers'){host.append(teacherPane());return;}
  if(view==='subjects'||view==='committees'){host.append(groupPane(view==='subjects'?'subject':'committee'));return;}
  if(view==='requests'){
   const box=section('Anträge');
   for(const r of adminData.requests){
    const row=node('article');row.append(node('p',[kinds[r.kind],memberName(r),r.proposed_name||groupName(r.group_id)].filter(Boolean).join(' · ')));
    const own=r.user_id===window.hblCloudUser?.()?.id;
    if(own&&(!adminData.sole_admin||r.kind==='join'))row.append(node('p','Eigener Antrag. Ein anderer Schuladmin muss entscheiden.'));
    else row.append(form([select('Entscheidung','approved',[['true','Bestätigen'],['false','Ablehnen']])],'Antrag entscheiden',d=>change('decide',{request_id:r.id,approved:d.get('approved')==='true'})));box.append(row);
   }
   if(!adminData.requests.length)box.append(node('p','Keine offenen Anträge.'));
   host.append(box);return;
  }
  if(view==='settings'){
   host.append(section('Schuleinstellungen',form(['name','state','address','contact'].map((key,i)=>input(['Schulname','Bundesland','Anschrift','Kontakt'][i],key,'text',adminData.school[key],i<2)),'Speichern',d=>change('school_settings',Object.fromEntries(d))),
    node('p','Schuladministratoren verwalten die Organisation. Schulleitungsrechte werden separat vergeben.')));return;
  }
  const counts=[['Bestätigte Lehrkräfte',adminData.members.filter(m=>m.status==='active').length],['Offene Anträge',adminData.requests.length],['Fachgruppen',groups().filter(g=>g.kind==='subject').length],['Gremien',groups().filter(g=>g.kind==='committee').length]];
  const audit=section('Letzte Änderungen');
  const operations={bootstrap:'Schule eingerichtet',invite:'Lehrkraft eingeladen',assign_existing:'Konto zugeordnet',allow_existing:'Konto zur Übernahme freigegeben',group_member:'Gruppe geändert',member_status:'Schulzugang geändert',create_group:'Gruppe angelegt',group_settings:'Gruppe geändert',decide:'Antrag entschieden',school_settings:'Schulprofil geändert',accept_existing_invitation:'Einladung angenommen'};
  for(const item of adminData.audit)audit.append(node('p',new Date(item.recorded_at).toLocaleString('de-DE')+' · '+(operations[item.action]||item.action)));
  host.append(section('Übersicht',...counts.map(([title,count])=>node('p',title+': '+count))),audit);
  if(window.hblCanManageUsers?.())host.append(section('Bestehende Kontoverwaltung',button('Globale Benutzerverwaltung öffnen',()=>window.hblOpenAdminUsers?.())));
 }
 function renderSelf(){
  const school=overview.school;
  host.append(section(school.name,node('p',school.state+' · '+(statuses[overview.membership]||'Ohne Schulzugehörigkeit'))));
  const pending=overview.requests.some(r=>r.kind==='join'&&r.status==='pending');
  if(pending)host.append(node('p','Der Beitrittsantrag ist offen.'));
  else if(!['active','invited','suspended'].includes(overview.membership))host.append(form([input('Vorname','first_name','text','',true),input('Nachname','last_name','text','',true)],'Schulbeitritt beantragen',d=>change('request',{kind:'join',...Object.fromEntries(d)})));
  host.append(section('Persönliche Unterrichtsfächer',form([groupChooser(groups().filter(g=>g.kind==='subject'),overview.subjects)],'Fächer speichern',d=>change('subjects',{groups:d.getAll('group')}))));
  if(overview.membership==='active'||pending){
   host.append(section('Fachgruppen und Gremien',form([groupChooser(groups())],'Mitgliedschaften beantragen',async d=>{
    for(const group_id of d.getAll('group'))if(!overview.confirmed.includes(group_id))await call('request',{kind:'membership',group_id});
    await load();
   }),form([select('Art','kind',[['subject','Fach'],['committee','Gremium']]),input('Vorschlag','name','text','',true)],'Vorschlagen',d=>change('request',Object.fromEntries(d)))));
  }
  host.append(section('Bestätigte Mitgliedschaften',node('p',overview.confirmed.map(groupName).join(', ')||'Noch keine.')),
   section('Meine Anträge',...overview.requests.map(r=>node('p',[kinds[r.kind],groupName(r.group_id)||r.proposed_name,statuses[r.status]].filter(Boolean).join(' · ')))));
  if(overview.onboarding)host.append(form([],'Einrichtung abschließen',async()=>{await call('finish_onboarding');hblNavigate('./');}));
 }
 function render(){
  if(!host?.isConnected)return;
  host.replaceChildren(node('h1',screen==='admin'?'Administration':'Schulzugehörigkeit'),button('Zum Dashboard',()=>hblNavigate('./')));
  if(!overview){host.append(node('p','Schuldaten werden geladen …'));return;}
  if(!overview.available){host.append(node('p','Die Schulorganisation ist derzeit nicht verfügbar.'));return;}
  if(screen==='admin')renderAdmin();else renderSelf();
 }
 async function load(){
  const account=window.hblCloudUser?.()?.id;
  if(!account||document.documentElement.dataset.access!=='ready')return;
  const request=++epoch,element=host;
  const stillCurrent=()=>request===epoch&&element?.isConnected&&account===window.hblCloudUser?.()?.id;
  try{
   const data=await call('overview');
   const administration=screen==='admin'&&data.admin?await call('admin_view'):null;
   if(!stillCurrent())return;
   overview=data;adminData=administration;render();
  }catch(error){if(stillCurrent())element.append(node('p',error.message));}
 }
 window.HblSchool={mount(admin){
  epoch++;overview=null;adminData=null;screen=admin?'admin':'self';view='overview';
  hblSetView('school','<main id="hblSchoolPage"></main>');host=document.getElementById('hblSchoolPage');render();void load();
 },async accountAccess(){
  if(document.documentElement.dataset.access!=='ready')return null;
  try{return await call('overview');}catch(_){return null;}
 }};
 async function sessionChanged(){
  const account=window.hblCloudUser?.()?.id;
  if(!account){epoch++;overview=null;adminData=null;render();return;}
  if(document.documentElement.dataset.access!=='ready')return;
  const data=await window.HblSchool.accountAccess();
  if(account!==window.hblCloudUser?.()?.id||!data?.available)return;
  if(data.membership==='invited'){try{await call('accept_existing_invitation');}catch(_){}}
  if(host?.isConnected)void load();
  if(data.onboarding&&new URLSearchParams(location.search).size===0&&!document.getElementById('hblProfileOverlay')?.matches(':not([hidden])')){
   hblNavigate('?schule');
  }
 }
 window.addEventListener('hbl-cloud-status',sessionChanged);
 window.addEventListener('hbl-profile-changed',sessionChanged);
 window.addEventListener('focus',()=>{if(host?.isConnected&&!host.contains(document.activeElement))void load();});
})();
