import snapshot from '../../../lib/stop-snapshot.json';
import {fetchStopSource} from '../../../lib/stop-source';
import type {NearbyStop} from '../../../lib/nearby-stops';
let cached:{at:number;stops:NearbyStop[]}|null=null;
let pending:Promise<NearbyStop[]>|null=null;
async function fetchStops(){
 const query='[out:json][timeout:7];(nwr[highway=bus_stop](18.80,72.84,19.30,73.35);nwr[public_transport=platform][bus=yes](18.80,72.84,19.30,73.35););out center tags;';
 const data=await fetchStopSource(query) as {elements?:{id:number;type:string;lat?:number;lon?:number;center?:{lat:number;lon:number};tags?:Record<string,string>}[];remark?:string};
 if(!Array.isArray(data.elements)||data.remark)throw Error('Stop source incomplete');
 return data.elements.flatMap(e=>{const lat=e.lat??e.center?.lat,lng=e.lon??e.center?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lng))return [];return [{id:`${e.type}/${e.id}`,lat:lat!,lng:lng!,name:(e.tags?.['name:en']||e.tags?.name||'Unnamed bus stop').slice(0,160),source:'OpenStreetMap'}];});
}
export async function GET(){
 try{if(!cached||Date.now()-cached.at>21600000){pending??=fetchStops();try{cached={at:Date.now(),stops:await pending};}finally{pending=null;}}return Response.json({stops:cached.stops,updated:cached.at},{headers:{'Cache-Control':'public, max-age=3600'}});}
 catch{return Response.json({stops:cached?.stops||snapshot.stops,error:'The bus-stop map service is unavailable. Saved route stops are still shown. Retry shortly.'},{status:200,headers:{'Cache-Control':'no-store'}});}
}
