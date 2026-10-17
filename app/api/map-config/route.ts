import {env} from "cloudflare:workers";
import {liveDb} from "../../../lib/live-db";
const LIMIT=70000;
const headers={"Cache-Control":"no-store, private"};
export async function GET(){
 const month=new Date().toISOString().slice(0,7);
 const key=(env as unknown as Record<string,string>).GOOGLE_MAPS_BROWSER_KEY||null;
 if(!key)return Response.json({key:null,status:"unconfigured",limit:LIMIT,used:0,month},{headers});
 try{
 // Reserve a slot BEFORE releasing the key. Concurrent requests cannot exceed the cap.
 const row=await liveDb().prepare("INSERT INTO map_usage(month,loads) VALUES(?,1) ON CONFLICT(month) DO UPDATE SET loads=loads+1 WHERE loads < ? RETURNING loads").bind(month,LIMIT).first<{loads:number}>();
 if(!row)return Response.json({key:null,status:"capped",limit:LIMIT,used:LIMIT,month},{headers});
 return Response.json({key,status:"allowed",limit:LIMIT,used:row.loads,month},{headers});
 }catch(e){console.error("Google map limit unavailable",e);return Response.json({key:null,status:"unavailable",limit:LIMIT,used:null,month},{headers});}
}
