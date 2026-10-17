import {distance,stops,type Point,type Report} from "./aggregate";
export type PilotStop={name:string;lat:number;lng:number};
export type PilotRoute={id:string;name:string;stops:PilotStop[]};
export type Trip={routeId?:string;onboard?:boolean;crowd?:string};
const point=(p:{lat:number;lng:number}):Point=>({...p,t:0});
export function project(p:Point,route:PilotRoute){let offset=0,best={gap:Infinity,progress:0,lat:p.lat,lng:p.lng};const positions=[0];for(let i=1;i<route.stops.length;i++){const a=point(route.stops[i-1]),b=point(route.stops[i]),scale=Math.cos(p.lat*Math.PI/180),x=(b.lng-a.lng)*scale,y=b.lat-a.lat,px=(p.lng-a.lng)*scale,py=p.lat-a.lat;const ratio=Math.max(0,Math.min(1,(px*x+py*y)/(x*x+y*y||1))),snap={lat:a.lat+ratio*y,lng:a.lng+ratio*(b.lng-a.lng),t:0},length=distance(a,b),gap=distance(p,snap);if(gap<best.gap)best={gap,progress:offset+ratio*length,lat:snap.lat,lng:snap.lng};offset+=length;positions.push(offset);}return {...best,total:offset,positions};}
export function routeDistance(p:Point,a:Point,b:Point){return project(p,{id:"",name:"",stops:[{...a,name:""},{...b,name:""}]}).gap;}
function publicId(value:string){let h=2166136261;for(const ch of value)h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0).toString(36);}
const median=(v:number[])=>{const s=[...v].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:0;};
export function pilotBuses(rows:(Report&{token:string;trip:string})[],routes:PilotRoute[],now=Date.now()){
 const riders=rows.filter(r=>r.accuracy<=80&&r.updated>=now-30000).flatMap(r=>{try{
 const trip=JSON.parse(r.trip) as Trip,route=routes.find(x=>x.id===trip.routeId);if(!route)return [];
 const path=(JSON.parse(r.history) as Point[]).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.t>=now-300000&&p.t<=now).sort((a,b)=>a.t-b.t);if(!path.length)return [];
 const last=path.at(-1)!,snap=project(last,route);if(snap.gap>150||now-last.t>30000)return [];
 const recent=path.filter(p=>p.t>=last.t-60000),first=recent[0],delta=snap.progress-project(first,route).progress,direction=Math.abs(delta)>35?Math.sign(delta):0;
 const speeds=recent.slice(1).flatMap((p,i)=>{const prev=recent[i],dt=(p.t-prev.t)/1000,s=distance(prev,p)/dt;return dt>=5&&dt<=20&&s<=35?[s]:[];});
 if(recent.some((p,i)=>i>0&&p.t>recent[i-1].t&&distance(p,recent[i-1])/((p.t-recent[i-1].t)/1000)>55))return [];
 const speed=median(speeds),pause=stops(path),matched=pause.events.filter(e=>e.seconds>=10&&e.seconds<=30).map(e=>route.stops.findIndex(s=>distance(point(s),e.point)<60)).filter(i=>i>=0),sequence=matched.filter((v,i)=>i===0||v!==matched[i-1]);
 const routeEvidence=sequence.length>=2&&(sequence.every((v,i)=>i===0||v===sequence[i-1]+1)||sequence.every((v,i)=>i===0||v===sequence[i-1]-1));
 const movement=path.some(p=>distance(p,last)>100);if(!trip.onboard&&(!routeEvidence||!movement))return [];
 const boarding=pause.events.some(e=>e.completed&&e.seconds>=10&&route.stops.some(s=>distance(point(s),e.point)<=60)&&distance(e.point,last)>100);
 return [{...r,trip,path,route,snap,speed,direction,sequence,boarding,pause,movement}];}catch{return [];}});
 const clusters:(typeof riders)[]=[];
 for(const r of riders){const group=clusters.find(c=>c.every(q=>q.route.id===r.route.id&&r.direction!==0&&q.direction===r.direction&&Math.abs(q.snap.progress-r.snap.progress)<60&&Math.abs(q.speed-r.speed)<4&&r.path.filter(a=>q.path.some(b=>Math.abs(a.t-b.t)<12000&&distance(a,b)<80)).length>=3));if(group)group.push(r);else clusters.push([r]);}
 return clusters.map(c=>{
 const lead=c[0],route=lead.route,progress=median(c.map(r=>r.snap.progress)),direction=lead.direction,speed=median(c.map(r=>r.speed));
 const upcoming=route.stops.map((s,i)=>({...s,index:i,remaining:direction*(lead.snap.positions[i]-progress)})).filter(s=>direction!==0&&s.remaining>=-30).sort((a,b)=>a.remaining-b.remaining).slice(0,5).map((s,i)=>({name:s.name,distance:Math.round(Math.max(0,s.remaining)),minutes:speed>=2?Math.max(1,Math.ceil(Math.max(0,s.remaining)/speed/60+i*.35)):null}));
 const crowd=c.map(r=>r.trip.crowd).filter(x=>x&&x!=="unknown"),mode=crowd.sort((a,b)=>crowd.filter(x=>x===b).length-crowd.filter(x=>x===a).length)[0]||"unknown";
 const currentStop=Math.round(Math.max(...c.map(r=>r.pause.current))),shortStops=Math.max(...c.map(r=>r.sequence.length)),confirmed=c.some(r=>r.trip.onboard);
 const reasons=["Within saved route corridor",confirmed?"Rider confirmed being aboard":"Consecutive stop pattern",c.length>=2?"Multiple matching movement reports":"Single sharing rider",direction?"Travel direction established":"Waiting for direction",shortStops+" qualifying stop pauses"];
 return {id:"bus-"+publicId(c.map(r=>r.token).sort()[0]),routeId:route.id,bus:route.name,route:route.name,vehicle:"bus" as const,contributors:c.length,lat:median(c.map(r=>r.lat)),lng:median(c.map(r=>r.lng)),updated:Math.max(...c.map(r=>r.updated)),accuracy:Math.round(Math.max(...c.map(r=>r.accuracy))),confidence:c.length>=2?"Corroborated reports":confirmed?"Rider-reported":"Possible bus",speed:Math.round(speed*3.6),shortStops,currentStop,reasons,stopLookup:"Matched against pilot stops",nextStop:upcoming[0]?.name||"Direction not established",crowd:mode,crowdReports:crowd.length,boardingSignals:c.filter(r=>r.boarding).length,direction:direction===1?"Towards "+route.stops.at(-1)!.name:direction===-1?"Towards "+route.stops[0].name:"Direction pending",progress:Math.round(100*progress/(lead.snap.total||1)),upcoming,status:currentStop>=10?"Stopped":speed>=2?"Moving":"Slow / waiting"};});
}
