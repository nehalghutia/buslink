'use client';
import {useEffect,useState} from 'react';
import tables from '../lib/airport-timetables.json';
import {serviceSummary} from '../lib/route-service';
const clock=(n:number)=>new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(n);
export default function RouteSchedule({id,source}:{id:string;source:string}){
 const table=tables.find(t=>t.id===id);
 const [stop,setStop]=useState(0),[date,setDate]=useState(''),[now,setNow]=useState(0);
 useEffect(()=>{setDate(new Date(Date.now()+330*60000).toISOString().slice(0,10));setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>setStop(0),[id]);
 if(!table)return <section className="schedule-card"><h2>Schedule unavailable</h2><p>Departure times have not been imported for this route.</p><a href="https://nmmtbus.com/" target="_blank" rel="noreferrer">Check NMMT</a> · <a href={source} target="_blank" rel="noreferrer">Route source</a></section>;
 const summary=serviceSummary(table,stop,date);
 const next=summary?.times.find(t=>t>=now);
 return <section className="schedule-card" aria-label="Full bus timetable"><h2>{table.code} · Bus schedule</h2><div className="boarding-picker"><label>Stop<select value={stop} onChange={e=>setStop(Number(e.target.value))}>{table.stops.map((s,i)=><option key={i} value={i}>{s}{i===table.stops.length-1?' · Final stop':''}</option>)}</select></label><label>Travel date (IST)<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label></div><p className="field-help">Expected timetable · not live tracking</p>{summary&&summary.times.length>0?<><div className="station-service-summary"><div><span>First {stop===table.stops.length-1?'arrival':'bus'}</span><strong>{clock(summary.times[0])}</strong></div><div><span>Last {stop===table.stops.length-1?'arrival':'bus'}</span><strong>{clock(summary.last!)}</strong></div></div><p>{next!==undefined?<>Next on selected date: <strong>{clock(next)}</strong></>:'No remaining times on selected date.'}</p><div className="schedule-times" aria-label="All scheduled times">{summary.times.map(t=><span key={t} className={t===next?'next-time':''}><time dateTime={new Date(t).toISOString()}>{clock(t)}</time>{new Date(t+330*60000).toISOString().slice(0,10)!==date&&<small> +1 day</small>}</span>)}</div>{summary.gaps.filter(g=>!g.overnight).map(g=><p key={g.from} className="field-help">Service gap: {clock(g.from)}–{clock(g.to)} ({Math.floor(g.minutes/60)}h {g.minutes%60}m)</p>)}</>:<p>No scheduled times available for this date.</p>}<details className="clean-route-source"><summary>Schedule source</summary><p>Moovit timetable, imported {table.retrieved}. Current operation is not confirmed by NMMT. Times may change on holidays.</p><a href={table.source} target="_blank" rel="noreferrer">Check timetable source</a></details></section>;
}
