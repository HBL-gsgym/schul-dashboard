/* Shared appearance and desktop navigation for the existing workspace. */
(()=>{
 const root=document.documentElement;
 const defaults={theme:"professional",position:"top",collapsed:false};
 function apply(value={}){
  value=value||{};
  root.dataset.world=["organic","professional","glass"].includes(value.theme)?value.theme:defaults.theme;
  root.dataset.dock=value.position==="left"?"left":"top";
  root.dataset.compact=String(value.collapsed===true);
  const toggle=document.querySelector("#workspaceNav [data-action=fold]");
  if(toggle){
   toggle.setAttribute("aria-expanded",String(value.collapsed!==true));
   const label=value.collapsed?"Navigation ausklappen":"Navigation einklappen";
   toggle.title=label;toggle.setAttribute("aria-label",label);
  }
 }
 function change(patch){
  if(!serverReady)return;
  prepDone.__workspace={...defaults,...prepDone.__workspace,...patch};
  apply(prepDone.__workspace);savePrepFile().catch(()=>{});
 }
 window.hblWorkspace={apply,change};
 apply(typeof prepDone==="object"?prepDone.__workspace:defaults);
 const nav=document.createElement("nav");
 nav.id="workspaceNav";nav.setAttribute("aria-label","Hauptnavigation");
 const items=[
  ["home","⌂","Dashboard"],["unterricht","◷","Heute"],["aufgaben","☑","Aufgaben"],
  ["mitarbeit","▦","Kurse"],["stundenplan","▤","Stundenplan"],["kalender","▧","Kalender"],
  ["chat","✉","Chat"],["account","◎","Konto"],["settings","⚙","Einstellungen"],["fold","⇄","Menü"]
 ];
 function active(key){
  for(const button of nav.children){
   if(button.dataset.action===key)button.setAttribute("aria-current","location");
   else button.removeAttribute("aria-current");
  }
 }
 function route(){active(/[?&](kurs|mitarbeit|noten)=/.test(location.search)?"mitarbeit":"home");}
 for(const [key,icon,label] of items){
  const button=document.createElement("button");button.type="button";button.title=label;
  button.dataset.action=key;button.setAttribute("aria-label",label);
  const glyph=document.createElement("span");glyph.textContent=icon;glyph.setAttribute("aria-hidden","true");
  const text=document.createElement("span");text.className="workspace-label";text.textContent=label;
  button.append(glyph,text);nav.append(button);
  button.onclick=()=>{
   if(key==="fold"){change({collapsed:root.dataset.compact!=="true"});return;}
   if(key==="settings"){window.openMeinHbl();return;}
   if(key==="chat"||key==="account"){document.getElementById(key==="chat"?"hblQChat":"hblQAccount")?.click();return;}
   window.hblNavigate("./");
   requestAnimationFrame(()=>{
    if(key==="home"){window.scrollTo({top:0,behavior:"instant"});active(key);return;}
    const tile=hblTileById(key);
    if(!tile||tile.hidden){window.openMeinHbl();document.querySelector(".mein-hbl [data-tiles]")?.click();return;}
    if(tile.classList.contains("tile-collapsed"))hblSetTileFold(tile,false,true);
    tile.scrollIntoView({block:"start",behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth"});
    active(key);
   });
  };
 }
 document.body.append(nav);apply(prepDone.__workspace);route();
 window.addEventListener("hbl-route-changed",route);
})();
