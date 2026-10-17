"use client";
import snapshot from '../lib/stop-snapshot.json';
import {useEffect,useRef,useState} from 'react';
import type {NearbyStop} from '../lib/nearby-stops';
// Keep downloaded coordinates while the user moves or the network fails.
export function useNearbyStops(p:{lat:number;lng:number}|null){
 const [result,setResult]=useState<{stops:NearbyStop[];message:string;loading:boolean}>({stops:snapshot.stops,message:'',loading:false}),[retry,setRetry]=useState(0);
 const current=useRef(p);current.current=p;
 useEffect(()=>{
  let cancelled=false,busy=false,last:{lat:number;lng:number}|null=null,lastAttempt=0;let controller=new AbortController();
  const check=async()=>{const point=current.current;if(!point||busy)return;const moved=last?Math.hypot((point.lat-last.lat)*111320,(point.lng-last.lng)*105000):Infinity;if(moved<500||Date.now()-lastAttempt<20000)return;busy=true;controller=new AbortController();lastAttempt=Date.now();setResult(old=>({...old,loading:true,message:''}));
   try{const timeout=setTimeout(()=>controller.abort(),25000);let d:{stops?:NearbyStop[];message?:string;error?:string};try{const r=await fetch(`/api/nearby-stops?lat=${point.lat.toFixed(3)}&lng=${point.lng.toFixed(3)}`,{signal:controller.signal});d=await r.json();if(!r.ok)throw Error(d.error||'Stop lookup unavailable.');}finally{clearTimeout(timeout);}
    if(cancelled)return;last=point;setResult(old=>{const merged=new Map(old.stops.map(s=>[`${s.name}:${s.lat}:${s.lng}`,s]));for(const s of d.stops||[])merged.set(`${s.name}:${s.lat}:${s.lng}`,s);return {stops:[...merged.values()].slice(-1500),message:d.message||'',loading:false};});
   }catch{if(!cancelled)setResult(old=>({...old,loading:false,message:'Stop lookup unavailable. Saved stops are still used.'}));}finally{busy=false;}
  };
  check();const timer=setInterval(check,5000);return()=>{cancelled=true;controller.abort();clearInterval(timer);};
 },[retry,!!p]);
 return {...result,retry:()=>setRetry(n=>n+1)};
}
