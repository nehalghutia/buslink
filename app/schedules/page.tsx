'use client';
import {useEffect,useState} from 'react';
import catalog from '../../lib/route-catalog.json';
import tables from '../../lib/airport-timetables.json';
import RouteSchedule from '../../components/route-schedule';
export default function Schedules(){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('Airport'),[id,setId]=useState('');
 useEffect(()=>{setId(new URLSearchParams(window.location.search).get('id')||'');},[]);
 const selected=catalog.routes.find(r=>r.id===id);
 const filtered=catalog.routes.filter(r=>(category==='All'||r.category===category)&&`${r.code} ${r.title} ${r.stops.join(' ')}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>a.code.localeCompare(b.code,undefined,{numeric:true}));
 return <main className="clean-routes"><header><a className="brand" href="/">BusLink</a><a href="/routes">Routes & stops</a></header><h1>Bus schedules</h1>{selected?<><button className="outline" onClick={()=>setId('')}>All schedules</button><h2>{selected.code}</h2><p>{selected.stops[0]} → {selected.stops.at(-1)}</p><RouteSchedule key={id} id={id} source={selected.source}/><a href={'/routes?id='+encodeURIComponent(id)}>View route & stops</a></>:<><p>A1–A7 · Both directions · All times in IST</p><div className="bus-filters"><label>Bus or stop<input placeholder="A1, Nerul, Panvel…" value={query} onChange={e=>setQuery(e.target.value.replace(/^a(\d)/i,'A-$1'))}/></label><label>Services<select value={category} onChange={e=>setCategory(e.target.value)}>{['Airport','All','AC','Regular'].map(c=><option key={c}>{c}</option>)}</select></label></div><p className="field-help">{tables.length} directions with saved timetables · {catalog.routes.length} listed directions</p><div className="clean-route-list">{filtered.map(r=><button className="clean-route-choice" key={r.id} onClick={()=>{setId(r.id);window.scrollTo({top:0,behavior:'smooth'});}}><span className="clean-route-number">{r.code}</span><span><strong>{r.stops[0]}</strong><span>to {r.stops.at(-1)}</span><small>{tables.some(t=>t.id===r.id)?'View full timetable':'Timetable not imported'}</small></span></button>)}</div>{!filtered.length&&<p>No matching buses.</p>}</>}</main>;
}
