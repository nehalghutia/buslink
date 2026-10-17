import {project,type PilotRoute} from './pilot';
export type DeviceFix={lat:number;lng:number;accuracy:number;t:number;speed:number|null};
export function localBusEta(route:PilotRoute,drop:number,fixes:DeviceFix[],now:number){
 const last=fixes.at(-1),first=fixes.find(f=>last&&last.t-f.t>=5000&&last.t-f.t<=30000);
 if(!last||now-last.t>30000)return {message:'Waiting for a fresh device location.'};
 if(last.accuracy>80)return {message:'Location is approximate. Wait for better GPS accuracy.'};
 if(drop<1||drop>=route.stops.length||!first)return {message:'Collecting movement to estimate speed and direction…'};
 if(first.accuracy>80)return {message:'Waiting for stable GPS accuracy.'};
 if(last.speed!==null&&last.speed<2)return {message:'Bus is stopped or moving slowly. ETA will resume with movement.'};
 const here=project(last,route),before=project(first,route),dt=(last.t-first.t)/1000;
 if(here.gap>150||before.gap>150)return {message:'Your location is outside this saved stop corridor.'};
 const delta=here.progress-before.progress,measured=delta/dt;
 if(delta< -35)return {message:'You appear to be travelling in the opposite direction. Check From / To.'};
 if(delta<35||measured<2)return {message:'Bus is stopped or movement is too slow for a reliable ETA.'};
 if(measured>35)return {message:'Location jumped. Waiting for stable movement.'};
 const speed=last.speed!==null&&last.speed>=2&&last.speed<=35?last.speed:measured;
 const remaining=here.positions[drop]-here.progress;
 if(remaining< -50)return {message:'Selected drop-off stop has been passed.'};
 return {message:'Approximate ETA from recent movement along saved stop connections.',speed:Math.round(speed*3.6),distance:Math.round(Math.max(0,remaining)),minutes:Math.ceil(Math.max(0,remaining)/speed/60)};
}
