// Owner authorization is performed by index.ts before calling this helper.
export async function createAccountLink(client, payload, actorId, siteUrl) {
 const fail=(error,status=400)=>({status,body:{error}});
 if(!["invite","renew_invite","recovery"].includes(payload.action))return fail("Unbekannte Link-Aktion.");
 const confirmed=u=>!!(u.email_confirmed_at||u.confirmed_at);
 const generationError=e=>fail(e?.status===429?
  "Zu viele Anfragen. Bitte später erneut versuchen.":
  "Link konnte nicht erzeugt werden. Bitte Kontostatus und Auth-Konfiguration prüfen.",e?.status===429?429:400);
 let account=null;
 const fresh=payload.action==="invite";
 if(fresh){
  const email=typeof payload.email==="string"?payload.email.trim().toLowerCase():"";
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return fail("Bitte eine gültige E-Mail-Adresse eingeben.");
  // Never reuse the create flow for an existing account (especially blocked accounts).
  let complete=false;
  for(let page=1;page<=100;page++){
   const {data,error}=await client.auth.admin.listUsers({page,perPage:100});
   if(error)return fail("Konten konnten nicht geprüft werden.",503);
   account=(data?.users||[]).find(u=>u.email?.toLowerCase()===email);
   if(account)return fail("Dieses Konto existiert bereits. Bitte in der Benutzerliste Einladung erneuern oder Passwort-Link wählen.",409);
   if((data?.users||[]).length<100){complete=true;break;}
  }
  if(!complete)return fail("Kontenprüfung unvollständig. Bitte später erneut versuchen.",503);
  account={email};
 }else{
  if(typeof payload.user_id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.user_id))return fail("Ungültiges Konto.");
  const {data,error}=await client.auth.admin.getUserById(payload.user_id);
  if(error||!data?.user?.email)return fail("Konto nicht gefunden.",404);
  account=data.user;
  const member=await client.from("hbl_dashboard_members").select("enabled").eq("user_id",account.id).maybeSingle();
  if(member.error)return fail("Freigabe konnte nicht geprüft werden.",503);
  if(!member.data?.enabled||(account.banned_until&&Date.parse(account.banned_until)>Date.now()))return fail("Konto ist gesperrt oder nicht freigeschaltet. Zugang zuerst bewusst freigeben.",403);
  if(payload.action==="renew_invite"&&(confirmed(account)||!account.invited_at))return fail("Keine offene Einladung. Für aktivierte Konten bitte Passwort-Link verwenden.",409);
  if(payload.action==="recovery"&&!confirmed(account))return fail("Einladung noch offen. Bitte Einladungslink erneuern.",409);
 }
 const type=payload.action==="recovery"?"recovery":"invite";
 const {data,error}=await client.auth.admin.generateLink({type,email:account.email,options:{redirectTo:siteUrl}});
 if(error)return generationError(error);
 const target=data?.user?.id,link=data?.properties?.action_link;
 if(!target||(!fresh&&target!==account.id)||!link)return fail("Link konnte dem bestehenden Konto nicht sicher zugeordnet werden.",502);
 // Check redirect/type before exposing a token; never log the generated URL.
 try{
  const parsed=new URL(link),expected=new URL(siteUrl);
  if(parsed.origin!==new URL(client.supabaseUrl).origin||parsed.pathname!=="/auth/v1/verify"||parsed.searchParams.get("type")!==type||parsed.searchParams.get("redirect_to")!==expected.href)throw Error();
 }catch(_){return fail("Link-Weiterleitung stimmt nicht mit dem Dashboard überein. Auth-URL-Konfiguration prüfen.",502);}
 if(fresh){
  // INSERT must fail on a concurrent existing membership instead of re-enabling it.
  const {error:memberError}=await client.from("hbl_dashboard_members").insert({user_id:target,invited_by:actorId,enabled:true});
  if(memberError)return fail("Konto angelegt, Freigabe nicht abgeschlossen. Bitte Benutzerliste prüfen; Konto nicht erneut anlegen.",409);
 }
 return {status:200,body:{ok:true,email:account.email,user_id:target,action_link:link,
  link_kind:payload.action,expiry_notice:"Einmalig nutzbar. Die Gültigkeit richtet sich nach der Supabase-Auth-Konfiguration; ältere Links können durch die Erneuerung ungültig werden."}};
}
