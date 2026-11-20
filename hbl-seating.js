/* Positionen in Rastereinheiten. Jeder Platz ist durch Tisch-ID und Sitzindex bestimmt. */
(function(root){
'use strict';
const width=24;
const empty=()=>({version:1,desks:[]});
function size(desk){
 const double=desk.seats.length===2;
 return {w:double&&!desk.vertical?6:3,h:double&&desk.vertical?6:3};
}
function fits(plan,desk,x,y){
 const {w,h}=size(desk);
 if(!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||x<0||y<0||x+w>width)return false;
 return plan.desks.every(other=>{
  if(other.id===desk.id)return true;
  const bounds=size(other);
  return x+w<=other.x||other.x+bounds.w<=x||y+h<=other.y||other.y+bounds.h<=y;
 });
}
function add(plan,count,id){
 if(![1,2].includes(count))throw Error('Ein Tisch hat einen oder zwei Plätze.');
 const desk={id,x:0,y:0,vertical:false,seats:Array(count).fill(null)};
 const bottom=plan.desks.reduce((n,d)=>Math.max(n,d.y+size(d).h),0);
 for(let y=0;y<=bottom;y++){
  for(let x=0;x<=width-size(desk).w;x++){
   if(fits(plan,desk,x,y)){Object.assign(desk,{x,y});plan.desks.push(desk);return desk;}
  }
 }
}
function move(plan,desk,x,y){
 if(!fits(plan,desk,x,y))throw Error('Dort ist kein Platz für diesen Tisch.');
 Object.assign(desk,{x,y});
}
function rotate(plan,desk){
 if(desk.seats.length!==2)return;
 const rotated={...desk,vertical:!desk.vertical};
 if(!fits(plan,rotated,desk.x,desk.y))throw Error('Zum Drehen braucht der Tisch mehr Platz.');
 desk.vertical=rotated.vertical;
}
function assign(plan,desk,index,studentId){
 if(!Number.isInteger(index)||index<0||index>=desk.seats.length)throw Error('Unbekannter Platz.');
 const previous=desk.seats[index];
 if(previous===studentId)return;
 if(studentId!==null){
  for(const source of plan.desks){
   const from=source.seats.indexOf(studentId);
   if(from!==-1){source.seats[from]=previous;break;}
  }
 }
 desk.seats[index]=studentId;
}
function shuffledPlan(plan,students,random=Math.random){
 const next=structuredClone(plan);
 const values=students.map(s=>s.id);
 const capacity=next.desks.reduce((n,d)=>n+d.seats.length,0);
 while(values.length<capacity)values.push(null);
 for(let i=values.length-1;i>0;i--){
  const j=Math.floor(random()*(i+1));
  [values[i],values[j]]=[values[j],values[i]];
 }
 let index=0;
 for(const desk of next.desks)desk.seats=desk.seats.map(()=>values[index++]);
 return next;
}
function clearMissing(plan,students){
 if(plan?.version!==1)return;
 const ids=new Set(students.map(s=>s.id));
 for(const desk of plan.desks)desk.seats=desk.seats.map(id=>ids.has(id)?id:null);
}
const api={empty,width,size,fits,add,move,rotate,assign,shuffledPlan,clearMissing};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.HblSeating=api;
})(typeof window==='undefined'?globalThis:window);
