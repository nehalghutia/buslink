import {nearbySorted,stopKey,type NearbyStop} from './nearby-stops';
export function matchRouteStops(names:string[],coordinates:NearbyStop[]){
 const unique=[...new Map(coordinates.map(s=>[`${stopKey(s.name)}:${s.lat}:${s.lng}`,s])).values()];
 return unique.flatMap(s=>{const matches=names.map((name,index)=>({name,index})).filter(n=>stopKey(n.name)===stopKey(s.name));return matches.length===1?[{...s,name:matches[0].name,index:matches[0].index}]:[];});
}
export function nearestBoardingStop(names:string[],coordinates:NearbyStop[],position:{lat:number;lng:number}){
 return nearbySorted(matchRouteStops(names,coordinates).filter(s=>s.index<names.length-1),position)[0];
}
