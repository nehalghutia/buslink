type ListedRoute={id:string;code:string;stops:string[];partial:boolean};
export const normalizeStop=(s:string)=>s.trim().toLowerCase().replace(/\s+/g," ");
export function directRoutes<T extends ListedRoute>(routes:T[],from:string,to:string){
 const a=normalizeStop(from),b=normalizeStop(to);if(!a||!b||a===b)return [];
 return routes.flatMap(route=>{if(route.partial)return [];const start=route.stops.findIndex(s=>normalizeStop(s)===a);if(start<0)return [];const end=route.stops.findIndex((s,i)=>i>start&&normalizeStop(s)===b);return end>start?[{route,start,end}]:[];}).sort((a,b)=>(a.end-a.start)-(b.end-b.start));
}

/** A transfer is a shared listed stop, not a verified platform or connection. */
export function transferRoutes<T extends ListedRoute>(routes:T[],from:string,to:string,limit=6){
 const a=normalizeStop(from),b=normalizeStop(to);if(!a||!b||a===b)return [];
 const first=routes.filter(r=>!r.partial).flatMap(route=>{const start=route.stops.findIndex(s=>normalizeStop(s)===a);return start>=0?[{route,start}]:[];});
 const last=routes.filter(r=>!r.partial).flatMap(route=>{const end=route.stops.findIndex(s=>normalizeStop(s)===b);return end>0?[{route,end}]:[];});
 const results:{first:T;second:T;start:number;changeOut:number;changeIn:number;end:number;intervals:number}[]=[];
 for(const f of first)for(const l of last){if(f.route.id===l.route.id||f.route.code===l.route.code)continue;const joins=new Map(l.route.stops.slice(0,l.end).map((s,i)=>[normalizeStop(s),i]));for(let i=f.start+1;i<f.route.stops.length;i++){const j=joins.get(normalizeStop(f.route.stops[i]));if(j===undefined||normalizeStop(f.route.stops[i])===a||normalizeStop(f.route.stops[i])===b)continue;results.push({first:f.route,second:l.route,start:f.start,changeOut:i,changeIn:j,end:l.end,intervals:i-f.start+l.end-j});}}
 const seen=new Set<string>();return results.sort((a,b)=>a.intervals-b.intervals).filter(r=>{const key=r.first.id+'|'+r.second.id;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,limit);
}
