import snapshot from '../../../lib/stop-snapshot.json';
import {nearbySorted} from '../../../lib/nearby-stops';
import {fetchStopSource} from '../../../lib/stop-source';
import type {NearbyStop} from '../../../lib/nearby-stops';
const cache=new Map<string,{at:number;stops:NearbyStop[]}>();
const headers={'Cache-Control':'no-store, private'};
export async function GET(request:Request){
 const p=new URL(request.url).searchParams,lat=Number(p.get('lat')),lng=Number(p.get('lng'));
 if(!p.has('lat')||!p.has('lng')||!Number.isFinite(lat)||!Number.isFinite(lng))return Response.json({error:'A valid location is required.'},{status:400,headers});
 if(lat<18.8||lat>19.5||lng<72.7||lng>73.4)return Response.json({stops:[],message:'This pilot searches for bus stops in Navi Mumbai and nearby areas only.'},{headers});
 const a=lat.toFixed(3),b=lng.toFixed(3),key=a+','+b,hit=cache.get(key);
 if(hit&&Date.now()-hit.at<3600000)return Response.json({stops:hit.stops,source:'OpenStreetMap'},{headers});
 const query=`[out:json][timeout:7];(nwr[highway=bus_stop](around:1700,${a},${b});nwr[public_transport=platform][bus=yes](around:1700,${a},${b}););out center tags;`;
 try{
 const data=await fetchStopSource(query) as {elements?:{type:string;id:number;lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>}[];remark?:string};
 if(data.remark||!Array.isArray(data.elements))throw Error('incomplete');
 const stops=data.elements.flatMap(e=>{const lat=e.lat??e.center?.lat,lng=e.lon??e.center?.lon,name=e.tags?.['name:en']||e.tags?.name;if(!name||!Number.isFinite(lat)||!Number.isFinite(lng))return [];return [{id:`${e.type}/${e.id}`,name:name.slice(0,160),lat:lat!,lng:lng!,source:'OpenStreetMap'}];}).slice(0,250);
 if(cache.size>=100)cache.delete(cache.keys().next().value!);cache.set(key,{at:Date.now(),stops});
 return Response.json({stops,source:'OpenStreetMap'},{headers});
 }catch{return Response.json({stops:nearbySorted(snapshot.stops,{lat,lng},1700),source:'OpenStreetMap',message:'Using saved stop data · partial coverage.'},{status:200,headers});}
}
