export type Point={lat:number;lng:number;t:number};
export type Report={lat:number;lng:number;accuracy:number;updated:number;history:string};
export function distance(a:Point,b:Point){const r=Math.PI/180,x=(a.lng-b.lng)*r*Math.cos((a.lat+b.lat)*r/2),y=(a.lat-b.lat)*r;return Math.hypot(x,y)*6371000;}
function heading(a:Point,b:Point){const r=Math.PI/180;return Math.atan2((b.lng-a.lng)*Math.cos(a.lat*r),b.lat-a.lat)*180/Math.PI;}
export function stops(path:Point[]){let start:number|null=null;let anchor:Point|null=null;const events:{point:Point;seconds:number;completed:boolean}[]=[];for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];if(b.t-a.t>15000){start=null;anchor=null;continue;}if(distance(a,b)<=4&&(!anchor||distance(anchor,b)<=8)){start??=a.t;anchor??=a;}else if(start!==null){events.push({point:anchor!,seconds:(a.t-start)/1000,completed:true});start=null;anchor=null;}}const current=start===null?0:(path.at(-1)!.t-start)/1000;if(start!==null)events.push({point:anchor!,seconds:current,completed:false});return {events,current};}
export function aggregate(rows:Report[],now=Date.now(),knownStops:Point[]=[]){
 const moving=rows.filter(r=>r.updated>=now-30000&&r.accuracy<=50).flatMap(r=>{try{
 const full=(JSON.parse(r.history) as Point[]).filter(p=>p.t>=now-300000),path=full.filter(p=>p.t>=now-90000);if(path.length<3||path.at(-1)!.t-path[0].t<20000)return [];
 // Require a sustained movement segment before classifying a stopped group as a vehicle.
 let travel:{speed:number;heading:number;t:number}|null=null;
 for(let i=2;i<path.length;i++){const a=path[i-2],b=path[i],dt=(b.t-a.t)/1000,speed=distance(a,b)/dt;if(dt>=16&&dt<=35&&speed>=2&&speed<=45)travel={speed,heading:heading(a,b),t:b.t};}
 if(!travel||now-travel.t>45000)return [];
 const last=path.at(-1)!,prev=path.at(-2)!,speed=distance(prev,last)/((last.t-prev.t)/1000),stop=stops(full);return [{...r,path,speed,travel,stop}];
 }catch{return [];}});
 type Moving=typeof moving[number];
 function together(a:Moving,b:Moving){const dh=Math.abs(a.travel.heading-b.travel.heading);if(distance(a.path.at(-1)!,b.path.at(-1)!)>80||Math.abs(a.speed-b.speed)>3||Math.min(dh,360-dh)>25)return false;const matches=a.path.filter(p=>b.path.some(q=>Math.abs(p.t-q.t)<=12000&&distance(p,q)<100));return matches.length>=3&&matches.at(-1)!.t-matches[0].t>=20000;}
 const clusters:Moving[][]=[];
 for(const r of moving.sort((a,b)=>a.lat-b.lat)){const c=clusters.find(c=>c.every(x=>together(r,x)));if(c)c.push(r);else clusters.push([r]);}
 return clusters.filter(c=>c.length>=2).map((c,i)=>{
 const stopCount=Math.min(...c.map(r=>r.stop.events.filter(e=>e.seconds>=10&&e.seconds<=30&&knownStops.some(s=>distance(s,e.point)<=40)).length));const currentStop=Math.round(Math.min(...c.map(r=>r.stop.current)));const vehicle=c.length>=7||stopCount>=1?"bus":"car";
 const reasons=[c.length+" contributing phones",stopCount+" pauses of 10–30 s near mapped bus stops"];
 return {id:"group-"+i,bus:"Group "+(i+1),route:vehicle==="bus"?"Possible bus":"Possible car",vehicle,contributors:c.length,lat:c.reduce((s,r)=>s+r.lat,0)/c.length,lng:c.reduce((s,r)=>s+r.lng,0)/c.length,updated:Math.max(...c.map(r=>r.updated)),accuracy:Math.round(Math.max(...c.map(r=>r.accuracy))),confidence:"Estimated",speed:Math.round(c.reduce((s,r)=>s+r.speed,0)/c.length*3.6),shortStops:stopCount,currentStop,reasons};
 });
}
