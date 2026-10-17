// Public OSM read endpoints. Fail over once; do not loop on rate limits.
export async function fetchStopSource(query:string){
 for(const endpoint of ['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter']){
  try{const response=await fetch(endpoint+'?'+new URLSearchParams({data:query}),{headers:{'Accept':'application/json'},signal:AbortSignal.timeout(9000)});if(!response.ok)continue;const data=await response.json() as {elements?:unknown[];remark?:string};if(Array.isArray(data.elements)&&!data.remark)return data;}catch{}
 }
 throw Error('Stop coordinates are temporarily unavailable.');
}
