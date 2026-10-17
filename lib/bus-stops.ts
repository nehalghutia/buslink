import type {Point} from "./aggregate";
// Transient cache of public map data only; location reports remain in D1.
const cache=new Map<string,{expires:number;points:Point[];available:boolean}>();
export async function nearbyStops(lat:number,lng:number):Promise<{points:Point[];available:boolean}>{
 const y=Math.round(lat*50)/50,x=Math.round(lng*50)/50,key=y+","+x,now=Date.now(),saved=cache.get(key);if(saved&&saved.expires>now)return {points:saved.points,available:saved.available};
 const query=`[out:json][timeout:4];(node["highway"="bus_stop"](around:6000,${y},${x});node["public_transport"="stop_position"]["bus"="yes"](around:6000,${y},${x});node["public_transport"="platform"]["bus"="yes"](around:6000,${y},${x}););out body 1500;`;
 try{const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",body:new URLSearchParams({data:query}),signal:AbortSignal.timeout(5000),headers:{"Content-Type":"application/x-www-form-urlencoded"}});if(!r.ok)throw Error("Map data unavailable");const d=await r.json() as {elements:{lat:number;lon:number}[]};if(!Array.isArray(d.elements))throw Error("Invalid map data");const points=d.elements.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>({lat:p.lat,lng:p.lon,t:0}));if(cache.size>=30)cache.delete(cache.keys().next().value!);cache.set(key,{expires:now+600000,points,available:true});return {points,available:true};}catch{cache.set(key,{expires:now+60000,points:[],available:false});return {points:[],available:false};}
}
