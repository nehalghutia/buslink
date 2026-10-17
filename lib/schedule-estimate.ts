import type {PilotRoute} from "./pilot";
import {distance} from "./aggregate";
export function scheduleEstimate(route:PilotRoute,start:number,duration:number,now:number,reverse=false){
 if(!Number.isFinite(start)||!Number.isFinite(duration)||duration<1||duration>360||route.stops.length<2)return null;
 const progress=(now-start)/(duration*60000);
 if(progress<0||progress>=1)return null;
 const stops=reverse?[...route.stops].reverse():route.stops;
 const lengths=stops.slice(1).map((s,i)=>distance({...stops[i],t:0},{...s,t:0}));
 const total=lengths.reduce((a,b)=>a+b,0);if(!total)return null;
 let remaining=progress*total;
 for(let i=0;i<lengths.length;i++){
  if(remaining<=lengths[i]&&lengths[i]>0){const p=remaining/lengths[i];return {lat:stops[i].lat+(stops[i+1].lat-stops[i].lat)*p,lng:stops[i].lng+(stops[i+1].lng-stops[i].lng)*p,progress:Math.round(progress*100),nextStop:stops[i+1].name};}
  remaining-=lengths[i];
 }
 return null;
}
