export type Timetable={id:string;code:string;days:number[];stops:string[];trips:number[][];source:string;sourceUpdated:string;retrieved:string};
const DAY=86400000,IST=330*60000;
export function indiaInput(now:number){return new Date(now+IST).toISOString().slice(0,16);}
export function nextArrivals(table:Timetable,stop:number,after:number,limit=3){
 if(!Number.isFinite(after)||!Number.isInteger(stop)||stop<0||stop>=table.stops.length)return [];
 const local=new Date(after+IST);const midnight=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-IST;
 const results:{time:number;minutes:number;serviceDate:string;trip:number}[]=[];
 // Include yesterday's services that continue after midnight.
 for(let day=-1;day<=7;day++){
  const base=midnight+day*DAY;const calendar=new Date(base+IST);
  if(!table.days.includes(calendar.getUTCDay()))continue;
  table.trips.forEach((trip,index)=>{const value=trip[stop];if(!Number.isFinite(value))return;const time=base+value*60000;if(time>=after)results.push({time,minutes:Math.ceil((time-after)/60000),serviceDate:calendar.toISOString().slice(0,10),trip:index});});
 }
 return results.sort((a,b)=>a.time-b.time).slice(0,limit);
}
