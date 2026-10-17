import type {Timetable} from './arrivals';
export function serviceSummary(table:Timetable,stop:number,date:string){
 const base=Date.parse(date+'T00:00:00+05:30');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(base)||!Number.isInteger(stop)||stop<0||stop>=table.stops.length)return null;
 const weekday=new Date(base+330*60000).getUTCDay();
 if(!table.days.includes(weekday))return {times:[],last:null,gaps:[],nextFirst:null};
 const minutes=[...new Set(table.trips.map(t=>t[stop]).filter(Number.isFinite))].sort((a,b)=>a-b);
 const times=minutes.map(n=>base+n*60000),last=times.at(-1)??null;
 const gaps:{from:number;to:number;minutes:number;overnight:boolean}[]=[];
 times.slice(1).forEach((time,i)=>{const gap=(time-times[i])/60000;if(gap>=180)gaps.push({from:times[i],to:time,minutes:gap,overnight:false});});
 let nextFirst:number|null=null;
 if(last!==null&&minutes.length)for(let d=1;d<=7;d++){const next=base+d*86400000;if(table.days.includes(new Date(next+330*60000).getUTCDay())){const first=next+minutes[0]*60000;if(first>last){nextFirst=first;const gap=(first-last)/60000;if(gap>=180)gaps.push({from:last,to:first,minutes:gap,overnight:true});break;}}}
 return {times,last,gaps,nextFirst};
}
