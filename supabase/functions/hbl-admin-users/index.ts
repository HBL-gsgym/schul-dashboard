import { createClient } from "npm:@supabase/supabase-js@2.57.0";

// HBL v5.6: Only the verified primary administrator may manage administrator roles.
// The service key never leaves this server-side function.
const URL=Deno.env.get("SUPABASE_URL")||"";
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const client=createClient(URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const origin="https://hbl-gsgym.github.io";
const siteUrl="https://hbl-gsgym.github.io/schul-dashboard/";
const cors={
 "Access-Control-Allow-Origin":origin,
 "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
 "Access-Control-Allow-Methods":"POST, OPTIONS",
 "Content-Type":"application/json",
 "Vary":"Origin",
};
function reply(data:unknown,status=200){
 return new Response(JSON.stringify(data),{status,headers:cors});
}
function validEmail(s:unknown){return typeof s==="string" && s.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function goodId(s:unknown){
 return typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 if(req.headers.get("Origin") && req.headers.get("Origin")!==origin)return reply({error:"Forbidden"},403);
 try{
  const header=req.headers.get("authorization")||"";
  if(!/^Bearer\s+\S+$/i.test(header))return reply({error:"Anmeldung erforderlich"},401);
  const jwt=header.replace(/^Bearer\s+/i,"");
  const {data:session,error:authError}=await client.auth.getUser(jwt);
  const actor=session?.user;
  if(authError||!actor||actor.is_anonymous)return reply({error:"Anmeldung ungültig"},401);
  const {data:role,error:roleError}=await client.from("hbl_dashboard_admins")
   .select("is_owner").eq("user_id",actor.id).maybeSingle();
  if(roleError)throw roleError;
  if(!role?.is_owner)return reply({error:"Nur Hauptadministratoren dürfen Rechte vergeben."},403);
  const payload=await req.json();
  if(!payload||typeof payload!=="object")return reply({error:"Ungültige Anfrage"},400);
  if(payload.action==="list"){
   const users:Array<{id:string,email:string,created_at:string,is_admin:boolean,is_owner:boolean,is_chat:boolean,username:string|null,is_member:boolean,confirmed_at:string|null,invited_at:string|null}>=[];
   for(let page=1;page<=10;page++){
    const {data,error}=await client.auth.admin.listUsers({page,perPage:100});
    if(error)throw error;
    const entries=data?.users||[];
    for(const user of entries){
     users.push({id:user.id,email:user.email||"(ohne E-Mail)",created_at:user.created_at,
       is_admin:false,is_owner:false,is_chat:false,username:null,is_member:false,
       confirmed_at:user.email_confirmed_at||user.confirmed_at||null,invited_at:user.invited_at||null});
    }
    if(entries.length<100)break;
   }
   const {data:roles,error:rolesError}=await client.from("hbl_dashboard_admins")
    .select("user_id,is_owner");
   if(rolesError)throw rolesError;
   const roleMap=new Map((roles||[]).map(x=>[x.user_id,x]));
   for(const u of users){const r=roleMap.get(u.id);u.is_admin=!!r;u.is_owner=!!r?.is_owner;}
   const {data:members,error:membersError}=await client.from("hbl_chat_members").select("user_id");
   if(membersError)throw membersError;
   const membersSet=new Set((members||[]).map(x=>x.user_id));
   for(const u of users)u.is_chat=membersSet.has(u.id);

   const {data:profiles,error:profileError}=await client.from("hbl_user_profiles").select("user_id,username");
   if(profileError)throw profileError;
   const profileMap=new Map((profiles||[]).map(x=>[x.user_id,x.username]));
   const {data:dashboardMembers,error:memberError}=await client.from("hbl_dashboard_members").select("user_id,enabled");
   if(memberError)throw memberError;
   const memberMap=new Map((dashboardMembers||[]).map(x=>[x.user_id,x.enabled]));
   for(const u of users){
    u.username=profileMap.get(u.id)||null;
    u.is_member=memberMap.get(u.id)===true;
   }
   users.sort((a,b)=>a.email.localeCompare(b.email,"de"));
   return reply({users,actor:actor.id});
  }

  if(payload.action==="invite"){
    const email=typeof payload.email==="string"?payload.email.trim().toLowerCase():"";
    if(!validEmail(email))return reply({error:"Bitte eine gültige E-Mail-Adresse eingeben."},400);
    const {data:generated,error:genError}=await client.auth.admin.generateLink({
      type:"invite",email,options:{redirectTo:siteUrl}
    });
    if(genError)return reply({error:genError.message||"Einladungslink konnte nicht erzeugt werden."},400);
    const target=generated?.user?.id,actionLink=generated?.properties?.action_link;
    if(!goodId(target)||!actionLink)return reply({error:"Unvollständige Einladungsdaten."},500);
    const {error:memberError}=await client.from("hbl_dashboard_members").upsert({
      user_id:target,invited_by:actor.id,enabled:true
    },{onConflict:"user_id"});
    if(memberError)throw memberError;
    return reply({ok:true,email,action_link:actionLink});
  }
  if(payload.action==="recovery"){
    const target=payload.user_id;
    if(!goodId(target))return reply({error:"Ungültiges Konto."},400);
    const {data:existing,error:lookupError}=await client.auth.admin.getUserById(target);
    if(lookupError||!existing?.user?.email)return reply({error:"Konto nicht gefunden."},404);
    const {data:generated,error:genError}=await client.auth.admin.generateLink({
      type:"recovery",email:existing.user.email,options:{redirectTo:siteUrl}
    });
    if(genError)return reply({error:genError.message||"Passwort-Link konnte nicht erzeugt werden."},400);
    const actionLink=generated?.properties?.action_link;
    if(!actionLink)return reply({error:"Kein Passwort-Link erhalten."},500);
    return reply({ok:true,email:existing.user.email,action_link:actionLink});
  }
  if(payload.action==="set_chat"){
    const target=payload.user_id,allowed=payload.is_chat;
    if(!goodId(target)||typeof allowed!=="boolean")return reply({error:"Ungültige Auswahl"},400);
    const {data:targetUser,error:targetError}=await client.auth.admin.getUserById(target);
    const account=targetUser?.user;
    if(targetError||!account?.email)return reply({error:"Konto nicht gefunden"},404);
    const {data:ownerRole,error:roleErr}=await client.from("hbl_dashboard_admins")
      .select("is_owner").eq("user_id",target).maybeSingle();
    if(roleErr)throw roleErr;
    if(ownerRole?.is_owner&&!allowed)return reply({error:"Der Hauptadministrator behält Chat-Zugang."},403);
    if(allowed){
      const {error}=await client.from("hbl_chat_members").upsert({
        user_id:target,email:account.email,approved_by:actor.id
      },{onConflict:"user_id"});
      if(error)throw error;
    }else{
      const {error}=await client.from("hbl_chat_members").delete().eq("user_id",target);
      if(error)throw error;
    }
    return reply({ok:true});
  }
  if(payload.action==="set"){
   const target=payload.user_id,allowed=payload.is_admin;
   if(!goodId(target)||typeof allowed!=="boolean")return reply({error:"Ungültige Auswahl"},400);
   const {data:targetUser,error:targetError}=await client.auth.admin.getUserById(target);
   if(targetError||!targetUser?.user)return reply({error:"Konto nicht gefunden"},404);
   const {data:existing,error:existingError}=await client.from("hbl_dashboard_admins")
    .select("is_owner").eq("user_id",target).maybeSingle();
   if(existingError)throw existingError;
   if(existing?.is_owner)return reply({error:"Hauptadministrator kann nicht verändert werden."},403);
   if(allowed){
    const {error}=await client.from("hbl_dashboard_admins").upsert({
      user_id:target,is_owner:false,granted_by:actor.id
    },{onConflict:"user_id"});
    if(error)throw error;
   }else{
    const {error}=await client.from("hbl_dashboard_admins").delete()
      .eq("user_id",target).eq("is_owner",false);
    if(error)throw error;
   }
   return reply({ok:true});
  }
  return reply({error:"Unbekannte Aktion"},400);
 }catch(e:any){
  console.error("HBL admin function:",e?.message||"error");
  return reply({error:"Anfrage konnte nicht verarbeitet werden"},500);
 }
});