export function locationErrorMessage(error:unknown){
 const code=(error as {code?:number})?.code;
 if(code===1)return 'Location permission is blocked. Open BusLink in Chrome, allow Location for this site, and turn on phone Location.';
 if(code===2)return 'Your device could not find a position. Turn on phone Location and retry near a window.';
 if(code===3)return 'No location response received. Allow the permission prompt, or open BusLink in Chrome and retry.';
 return error instanceof Error?error.message:'Location could not be read. Open BusLink in Chrome and retry.';
}
export function requestDeviceLocation(geo:Geolocation|undefined,onFallback:()=>void=()=>{},deadlineMs=25000):Promise<GeolocationPosition>{
 return new Promise((resolve,reject)=>{
  if(!geo){reject(Error('This browser does not provide location. Open BusLink in Chrome.'));return;}
  let finished=false,fallback=false;
  const finish=(p?:GeolocationPosition,error?:unknown)=>{if(finished)return;finished=true;clearTimeout(timer);if(p&&Number.isFinite(p.coords.latitude)&&Number.isFinite(p.coords.longitude)&&Number.isFinite(p.coords.accuracy))resolve(p);else reject(error||Error('The device returned an invalid location. Retry.'));};
  const timer=setTimeout(()=>finish(undefined,{code:3}),deadlineMs);
  const attempt=(high:boolean)=>{try{geo.getCurrentPosition(p=>finish(p),e=>{if(finished)return;if(e.code!==1&&!fallback){fallback=true;onFallback();attempt(false);}else finish(undefined,e);},{enableHighAccuracy:high,maximumAge:high?0:15000,timeout:high?12000:8000});}catch(e){finish(undefined,e);}};
  attempt(true);
 });
}

/** Continuous foreground tracking. Never upload here; sharing requires separate consent. */
export function watchDeviceLocation(geo:Geolocation, receive:(p:GeolocationPosition)=>void, fail:(e:GeolocationPositionError)=>void):()=>void {
 let stopped=false, lastTimestamp=0, watch:number|null=null, generation=0, request=0;
 let pending=false, pendingSince=0, watchSince=0, lastAcceptedAt=0, transientReported=false;
 const options={enableHighAccuracy:true,maximumAge:0,timeout:12000};
 const valid=(p:GeolocationPosition)=>Number.isFinite(p.timestamp)&&p.timestamp>lastTimestamp&&Date.now()-p.timestamp<=30000&&p.timestamp<=Date.now()+5000&&Number.isFinite(p.coords.latitude)&&Math.abs(p.coords.latitude)<=90&&Number.isFinite(p.coords.longitude)&&Math.abs(p.coords.longitude)<=180&&Number.isFinite(p.coords.accuracy)&&p.coords.accuracy>=0;
 const accept=(p:GeolocationPosition)=>{if(stopped||!valid(p))return;lastTimestamp=p.timestamp;lastAcceptedAt=Date.now();transientReported=false;receive(p);};
 const error=(e:GeolocationPositionError)=>{if(stopped)return;if(e.code===1){cleanup();fail(e);return;}if(!transientReported){transientReported=true;fail(e);}};
 function restartWatch(){
  if(stopped)return;
  const current=++generation;
  if(watch!==null)geo.clearWatch(watch);watch=null;watchSince=Date.now();
  try{const id=geo.watchPosition(p=>{if(current===generation)accept(p);},e=>{if(current===generation)error(e);},options);if(stopped||current!==generation)geo.clearWatch(id);else watch=id;}
  catch(e){error({code:2,message:e instanceof Error?e.message:'GPS unavailable',PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3});}
 }
 function acquire(){
  if(stopped||pending||document.visibilityState==='hidden')return;
  pending=true;pendingSince=Date.now();const current=++request;
  try{geo.getCurrentPosition(p=>{if(stopped||current!==request)return;pending=false;accept(p);},e=>{if(stopped||current!==request)return;pending=false;error(e);},options);}
  catch(e){pending=false;error({code:2,message:e instanceof Error?e.message:'GPS unavailable',PERMISSION_DENIED:1,POSITION_UNAVAILABLE:2,TIMEOUT:3});}
 }
 function resume(){if(stopped||document.visibilityState==='hidden')return;pending=false;++request;restartWatch();acquire();}
 const timer=setInterval(()=>{
  if(stopped||document.visibilityState==='hidden')return;
  // Some browsers never deliver a timeout callback. Retire that request ourselves.
  if(pending&&Date.now()-pendingSince>=15000){pending=false;++request;}
  if(Date.now()-Math.max(lastAcceptedAt,watchSince)>=20000)restartWatch();
  if(Date.now()-lastAcceptedAt>8000)acquire();
 },5000);
 function cleanup(){if(stopped)return;stopped=true;++generation;++request;if(watch!==null)geo.clearWatch(watch);watch=null;clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);window.removeEventListener('pageshow',resume);}
 document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);window.addEventListener('pageshow',resume);
 restartWatch();
 return cleanup;
}
