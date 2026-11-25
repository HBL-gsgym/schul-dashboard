/* Common Brandenburg school dates for the dashboard and calendar reminders. */
(()=>{
 const taskDateString=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 function dayOffset(date,days){const value=new Date(date);value.setDate(value.getDate()+days);return value;}
const SCHOOL_YEARS=[
 {label:"2026/27",start:"2026-08-24",end:"2027-06-30",vacations:[
  {name:"Herbstferien",start:"2026-10-19",end:"2026-10-30"},
  {name:"Weihnachtsferien",start:"2026-12-23",end:"2027-01-02"},
  {name:"Winterferien",start:"2027-02-01",end:"2027-02-06"},
  {name:"Osterferien",start:"2027-03-22",end:"2027-04-03"},
  {name:"Pfingstfreier Tag",start:"2027-05-18",end:"2027-05-18"},
  {name:"Sommerferien",start:"2027-07-01",end:"2027-08-14"}
 ],variable:[{date:"2027-05-07",name:"Variabler Ferientag (vorbehaltlich Schulbeschluss)"}]},
 {label:"2027/28",start:"2027-08-16",end:"2028-06-28",vacations:[
  {name:"Herbstferien",start:"2027-10-11",end:"2027-10-23"},
  {name:"Weihnachtsferien",start:"2027-12-23",end:"2027-12-31"},
  {name:"Winterferien",start:"2028-01-31",end:"2028-02-05"},
  {name:"Osterferien",start:"2028-04-10",end:"2028-04-22"},
  {name:"Sommerferien",start:"2028-06-29",end:"2028-08-12"}
 ],variable:[{date:"2028-05-26",name:"Variabler Ferientag (vorbehaltlich Schulbeschluss)"}]}
];
function parseSchoolDate(str){return new Date(Number(str.slice(0,4)),Number(str.slice(5,7))-1,Number(str.slice(8,10)),12)}
function gregorianEaster(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;
 return new Date(year,month-1,day,12);
}
function publicHolidays(year){
 const dates=new Map([
  [`${year}-01-01`,"Neujahr"],[`${year}-05-01`,"Tag der Arbeit"],[`${year}-10-03`,"Tag der Deutschen Einheit"],
  [`${year}-10-31`,"Reformationstag"],[`${year}-12-25`,"1. Weihnachtstag"],[`${year}-12-26`,"2. Weihnachtstag"]
 ]);
 const easter=gregorianEaster(year);
 for(const [days,name] of [[-2,"Karfreitag"],[1,"Ostermontag"],[39,"Christi Himmelfahrt"],[50,"Pfingstmontag"]]){
  dates.set(taskDateString(dayOffset(easter,days)),name);
 }
 return dates;
}
function currentSchoolYear(date){
 const d=taskDateString(date);
 if(d<SCHOOL_YEARS[0].start)return SCHOOL_YEARS[0];
 for(let i=SCHOOL_YEARS.length-1;i>=0;i--){if(d>=SCHOOL_YEARS[i].start)return SCHOOL_YEARS[i];}
 return SCHOOL_YEARS[0];
}
function schoolDateDescription(key,year,holidays){
 for(const v of year.vacations)if(key>=v.start&&key<=v.end)return {kind:"vacation",label:v.name};
 const varDay=year.variable.find(v=>v.date===key);
 if(varDay)return {kind:"free",label:varDay.name};
 if(holidays.has(key))return {kind:"free",label:holidays.get(key)};
 return {kind:"school",label:"Schultag"};
}
 globalThis.HblSchoolCalendar={SCHOOL_YEARS,parseSchoolDate,publicHolidays,currentSchoolYear,schoolDateDescription};
})();
