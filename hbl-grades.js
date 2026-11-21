/* Persönliches Notenbuch. Schüler-IDs stammen aus der Kursliste der Mitarbeit. */
(function(root){
'use strict';
const empty=()=>({version:1,scale:'grades',areas:[]});
function forCourse(data){
 if(data?.gradebook)return data.gradebook;
 const book=empty();
 const columns=Array.from({length:5},(_,i)=>({id:'note-'+(i+1),title:'Note '+(i+1),date:'',term:'first',scores:{}}));
 book.areas.push({id:'noten',name:'Noten',weight:100,active:true,columns});
 return book;
}
const limits=scale=>scale==='points'?[0,15]:[1,6];
const columns=book=>book.areas.flatMap(area=>area.columns);
const hasScores=column=>Object.keys(column.scores).length>0;
const hasStudent=(book,id)=>!!book&&(columns(book).some(column=>Object.hasOwn(column.scores,id))||
 Object.values(book.reportMarks||{}).some(marks=>Object.hasOwn(marks,id)));
const periods=book=>book.mode==='sek2'?['first','second']:['first','second','year'];

function setScale(book,scale){
 if(!['grades','points'].includes(scale))throw Error('Unbekannte Notenskala.');
 if(book.scale!==scale&&(columns(book).some(hasScores)||Object.values(book.reportMarks||{}).some(marks=>Object.keys(marks).length)))throw Error('Die Skala ist festgelegt, solange Noten eingetragen sind.');
 book.scale=scale;
}
function saveArea(book,id,{name,weight,active,position}){
 name=name.trim();
 if(!name||name.length>60)throw Error('Bitte einen Bereichsnamen mit höchstens 60 Zeichen eingeben.');
 if(!Number.isFinite(weight)||weight<0||weight>100||Math.abs(weight*100-Math.round(weight*100))>1e-7)throw Error('Gewicht zwischen 0 und 100 % mit höchstens zwei Nachkommastellen eingeben.');
 const index=book.areas.findIndex(area=>area.id===id);
 if(!Number.isInteger(position)||position<0||position>book.areas.length-(index<0?0:1))throw Error('Ungültige Reihenfolge.');
 const area=index<0?{id,columns:[]}:book.areas.splice(index,1)[0];
 Object.assign(area,{name,weight,active});
 book.areas.splice(position,0,area);
}
function removeArea(book,area){
 if(area.columns.some(hasScores))throw Error('Dieser Bereich enthält Noten. Du kannst ihn deaktivieren.');
 book.areas=book.areas.filter(item=>item!==area);
}
function removeColumn(area,column){
 if(hasScores(column))throw Error('Dieser Nachweis enthält Noten. Zum Entfernen zuerst die betreffenden Einträge leeren.');
 area.columns=area.columns.filter(item=>item!==column);
}
function setScore(book,column,studentId,value){
 if(value===''){delete column.scores[studentId];return;}
 const [min,max]=limits(book.scale);
 if(!/^\d+$/.test(value)||Number(value)<min||Number(value)>max)throw Error('Der Wert passt nicht zur Kursskala.');
 Object.defineProperty(column.scores,studentId,{value:Number(value),enumerable:true,configurable:true,writable:true});
}
function weightTotal(book){
 return book.areas.reduce((sum,area)=>sum+(area.active?Math.round(area.weight*100):0),0)/100;
}
function setReportMark(book,period,id,value){
 if(!periods(book).includes(period))throw Error('Dieser Zeitraum gehört nicht zur aktuellen Kursberechnung.');
 book.reportMarks??={};
 const scores=book.reportMarks[period]??={};
 setScore(book,{scores},id,value);
}
function results(book,studentId,period='year'){
 const means=new Map();
 let total=0,complete=periods(book).includes(period)&&weightTotal(book)===100;
 for(const area of book.areas){
  const values=area.columns.filter(c=>(period==='year'||c.term===period)&&Object.hasOwn(c.scores,studentId)).map(c=>c.scores[studentId]);
  const mean=values.length?values.reduce((sum,n)=>sum+n,0)/values.length:null;
  means.set(area.id,mean);
  if(area.active&&area.weight>0){
   if(mean===null)complete=false;
   else total+=mean*area.weight/100;
  }
 }
 return {means,total:complete?total:null};
}
const model={empty,forCourse,limits,hasStudent,periods,setScale,saveArea,removeArea,removeColumn,setScore,setReportMark,weightTotal,results};
if(typeof module!=='undefined'&&module.exports){module.exports=model;return;}
root.HblGradebook=model;
})(typeof window==='undefined'?globalThis:window);
