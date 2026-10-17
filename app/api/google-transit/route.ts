import {env} from 'cloudflare:workers';
import {liveDb} from '../../../lib/live-db';
const headers={'Cache-Control':'no-store, private'};
export async function POST(request:Request){
 const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'Open BusLink to check buses.'},403);
 const key=(env as unknown as Record<string,string>).GOOGLE_ROUTES_API_KEY;
 if(!key)return reply({error:'Google bus lookup is not connected yet.',status:'unconfigured'},503);
 let input:{origin?:unknown;destination?:unknown;position?:{lat:number;lng:number}};try{input=await request.json() as typeof input;if(!input||typeof input!=='object')throw Error();}catch{return reply({error:'Invalid journey.'},400);}
 const valid=(s:unknown)=>typeof s==='string'&&s.length>2&&s.length<220;
 if(!valid(input.destination)||!valid(input.origin))return reply({error:'Choose boarding and destination stops.'},400);
 const p=input.position;
 if(p&&(!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180))return reply({error:'Invalid location.'},400);
 try{
 const month=new Date().toISOString().slice(0,7);
 const reserved=await liveDb().prepare('INSERT INTO map_usage(month,loads) VALUES(?,1) ON CONFLICT(month) DO UPDATE SET loads=loads+1 WHERE loads < ? RETURNING loads').bind(month,70000).first();
 if(!reserved)return reply({error:'Monthly Google request limit reached.'},429);
 const response=await fetch('https://routes.googleapis.com/directions/v2:computeRoutes',{
 method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.legs.steps.transitDetails,routes.duration'},
 body:JSON.stringify({origin:p?{location:{latLng:{latitude:p.lat,longitude:p.lng}}}:{address:input.origin+', Navi Mumbai, India'},destination:{address:input.destination+', Navi Mumbai, India'},travelMode:'TRANSIT',transitPreferences:{allowedTravelModes:['BUS']},computeAlternativeRoutes:true,departureTime:new Date().toISOString(),languageCode:'en'}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)return reply({error:'Google bus lookup is unavailable. Try again later.'},502);
 const data=await response.json() as {routes?:{duration?:string;legs?:{steps?:{transitDetails?:{headsign?:string;transitLine?:{name?:string;nameShort?:string};stopDetails?:{departureStop?:{name?:string};arrivalStop?:{name?:string};departureTime?:string;arrivalTime?:string}}}[]}[]}[]};
 const journeys=(data.routes||[]).map(r=>({duration:r.duration,legs:(r.legs||[]).flatMap(l=>(l.steps||[]).flatMap(s=>s.transitDetails?[{line:s.transitDetails.transitLine?.nameShort||s.transitDetails.transitLine?.name||'Bus',headsign:s.transitDetails.headsign,...s.transitDetails.stopDetails}]:[]))})).filter(r=>r.legs.length);
 return reply({journeys,checkedAt:new Date().toISOString()});
 }catch{return reply({error:'Bus lookup timed out or is unavailable. Please retry.'},503);}
}
