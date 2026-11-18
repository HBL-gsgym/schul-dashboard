import { createClient } from "npm:@supabase/supabase-js@2.57.0";
import webpush from "npm:web-push@3.6.7";

const cors={
  "Access-Control-Allow-Origin":"https://hbl-gsgym.github.io",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
  "Content-Type":"application/json"
};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:cors});
const url=Deno.env.get("SUPABASE_URL");
const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if(!url||!serviceKey)throw new Error("Service configuration missing");
const db=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async req=>{
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST")return respond({ok:false,error:"Method not allowed"},405);
  try{
    const token=(req.headers.get("Authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
    if(!token)return respond({ok:false,error:"Bitte erneut anmelden."},401);
    const {data:{user},error:authError}=await db.auth.getUser(token);
    if(authError||!user)return respond({ok:false,error:"Sitzung abgelaufen. Bitte erneut anmelden."},401);
    const input=await req.json().catch(()=>null);
    const endpoint=input?.endpoint;
    if(typeof endpoint!=="string"||!endpoint.startsWith("https://")||endpoint.length>3000)
      return respond({ok:false,error:"Ungültiges Push-Abonnement."},400);
    const {data:sub,error:subError}=await db.from("hbl_push_subscriptions")
      .select("id,endpoint,p256dh,auth_key").eq("user_id",user.id)
      .eq("endpoint",endpoint).maybeSingle();
    if(subError)throw subError;
    if(!sub)return respond({ok:false,error:"Dieses Gerät ist nicht registriert. Bitte Push erneut aktivieren."},404);
    const {data:settings,error:settingsError}=await db.from("hbl_push_private_settings")
      .select("key,value").in("key",["vapid_public","vapid_private"]);
    if(settingsError)throw settingsError;
    const secrets=Object.fromEntries((settings||[]).map((x:any)=>[x.key,x.value]));
    if(!secrets.vapid_public||!secrets.vapid_private)throw Error("VAPID configuration missing");
    webpush.setVapidDetails("https://hbl-gsgym.github.io",secrets.vapid_public,secrets.vapid_private);
    try{
      const result=await webpush.sendNotification(
        {endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},
        JSON.stringify({title:"HBL Push-Test ✅",body:"Die Testnachricht wurde an dieses Gerät gesendet.",tag:"hbl-push-test",url:"./"}),
        {TTL:120,urgency:"high"}
      );
      return respond({ok:true,accepted:true,status:result.statusCode||201,detail:"Push-Dienst hat die Testnachricht angenommen. Ob sie angezeigt wird, prüfst du am Gerät."});
    }catch(error:any){
      const status=Number(error?.statusCode)||0;
      console.error("HBL push test delivery",status,String(error?.message||"error").slice(0,250));
      if(status===404||status===410){
        await db.from("hbl_push_subscriptions").delete().eq("id",sub.id);
        return respond({ok:false,error:"Das Geräte-Abonnement ist abgelaufen. Bitte Push deaktivieren und erneut aktivieren.",push_status:status},410);
      }
      return respond({ok:false,error:"Push-Versand fehlgeschlagen ("+(status||"Netzwerk")+"). Bitte Verbindung und Geräteberechtigung prüfen.",push_status:status},502);
    }
  }catch(error:any){
    console.error("HBL push test function",String(error?.message||error).slice(0,300));
    return respond({ok:false,error:"Serverfehler beim Push-Test."},500);
  }
});