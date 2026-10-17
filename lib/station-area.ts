import {nearbySorted} from './nearby-stops';
// Railway-station landmark ONLY, not a bus-stop coordinate or road-side assignment.
// OSM way 648982741, https://mapcarta.com/W648982741, checked 2026-10-16.
const bamandongri={name:'Bamandongri Railway Station',lat:18.97517,lng:73.0244};
export function stationAreaChoices(names:string[],p:{lat:number;lng:number;accuracy:number}|null){
 if(!p||p.accuracy>100||!nearbySorted([bamandongri],p,600).length)return [];
 return names.map((name,index)=>({name,index})).filter(s=>/bamandongri/i.test(s.name)&&s.index<names.length-1);
}
