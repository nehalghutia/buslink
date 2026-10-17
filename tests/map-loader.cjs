const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('lib/map-loader.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function setup({google=false,failLeaflet=false,existingLeaflet=false}={}){
 const nodes=new Map(),added=[],timers=new Map();let timerId=0,requests=0;
 const window={};if(existingLeaflet)window.L={};
 const options={google,failLeaflet};
 const document={getElementById:id=>nodes.get(id)||null,createElement:tag=>{
  const listeners=new Map();const node={tag,addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:(k,f)=>{if(listeners.get(k)===f)listeners.delete(k)},remove:()=>nodes.delete(node.id),fire:k=>listeners.get(k)?.()};return node;
 },head:{appendChild:node=>{
  nodes.set(node.id,node);added.push(node);
  if(node.tag==='script'){
   if(node.id==='leaflet-js'){
    if(options.failLeaflet)node.fire('error');else{window.L={};node.fire('load');}
   }else{
    // async Google load may fire before the Maps constructor exists.
    node.fire('load');window.google={maps:{Map:function Map(){}}};window.initBusMap();
   }
  }
 }}};
 const ctx={exports:{},window,document,AbortSignal,Promise,Error,setTimeout:f=>(timers.set(++timerId,f),timerId),clearTimeout:id=>timers.delete(id),fetch:async()=>{requests++;return{ok:true,json:async()=>({key:options.google?'test-browser-key':null})}}};
 vm.runInNewContext(source,ctx);
 return{api:ctx.exports,window,added,nodes,options,requests:()=>requests,timers};
}
(async()=>{
 {
  const x=setup();const a=x.api.loadMapSdk(),b=x.api.loadMapSdk();assert.equal(a,b);assert.equal((await a).engine,'leaflet');assert.equal(x.requests(),1);assert.equal(x.added.filter(n=>n.id==='leaflet-js').length,1);assert.equal(x.timers.size,0);await x.api.loadMapSdk();assert.equal(x.requests(),1);
 }
 {
  const x=setup({existingLeaflet:true});await x.api.loadLeaflet();assert(x.nodes.has('leaflet-css'));assert.equal(x.added.filter(n=>n.tag==='script').length,0);
 }
 {
  const x=setup({google:true});assert.equal((await x.api.loadMapSdk()).engine,'google');let notified=0;const off=x.api.onGoogleMapFailure(()=>notified++);x.window.gm_authFailure();assert.equal(notified,1);off();assert.equal((await x.api.loadMapSdk()).engine,'leaflet');assert.equal(x.requests(),1);assert.equal(x.timers.size,0);
 }
 {
  const x=setup({failLeaflet:true});await assert.rejects(x.api.loadMapSdk());assert.equal(x.nodes.has('leaflet-js'),false);x.options.failLeaflet=false;assert.equal((await x.api.loadMapSdk()).engine,'leaflet');assert.equal(x.added.filter(n=>n.id==='leaflet-js').length,2);assert.equal(x.timers.size,0);
 }
 console.log('PASS: concurrent maps share SDK/config, cached synchronous load, existing SDK gets CSS, async Google callback, auth fallback, failed-script retry, timer cleanup');
})().catch(e=>{console.error(e);process.exitCode=1});
