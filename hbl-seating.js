/* Positionen in Rastereinheiten. Jeder Platz ist durch Tisch-ID und Sitzindex bestimmt. */
(function(root){
'use strict';
const width=24;
const empty=()=>({version:1,desks:[]});
const roomName=value=>typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
const roomKey=value=>roomName(value).toLocaleLowerCase('de-DE');
function roomsForCourse(id,slots={},courses={},classes={}){
 const all=new Map(),own=new Map(),templates=[];
 function remember(map,value){
  const name=roomName(value),key=roomKey(name);
  if(name&&!map.has(key))map.set(key,name);
 }
 for(const pair of Object.values(slots)){
  for(const entry of [pair?.A,pair?.B]){
   if(!entry?.room)continue;
   remember(all,entry.room);
   if(entry.courseId===id)remember(own,entry.room);
  }
 }
 for(const [other,course] of Object.entries(courses)){
  const plan=classes[other]?.seating;
  if(plan?.version!==1||!roomName(plan.room))continue;
  remember(all,plan.room);
  if(other!==id&&plan.desks.length)templates.push({id:other,label:course.subject+' · '+course.group,plan});
 }
 const sort=(a,b)=>a.localeCompare(b,'de',{numeric:true});
 return {suggested:own.size===1?[...own.values()][0]:'',rooms:[...own.values()].sort(sort).concat([...all].filter(([key])=>!own.has(key)).map(([,name])=>name).sort(sort)),templates:templates.sort((a,b)=>sort(a.label,b.label))};
}
function copyLayout(plan,template,newId){
 if(!roomKey(plan.room)||roomKey(plan.room)!==roomKey(template.room))throw Error('Der Grundriss gehört zu einem anderen Raum.');
 plan.desks=template.desks.map(d=>({id:newId(),x:d.x,y:d.y,vertical:d.vertical,seats:Array(d.seats.length).fill(null)}));
}
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
const api={empty,width,size,fits,add,move,rotate,assign,shuffledPlan,clearMissing,roomsForCourse,roomName,roomKey,copyLayout};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.HblSeating=api;
})(typeof window==='undefined'?globalThis:window);
