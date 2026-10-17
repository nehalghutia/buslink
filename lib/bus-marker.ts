/** Badge counts contributing phones, never inferred occupancy or vehicle capacity. */
export function busMarkerUrl(contributors:number, selected=false){
 const count=Number.isFinite(contributors)?Math.max(0,Math.floor(contributors)):0;
 const label=count>99?'99+':String(count);
 const color=count>=2?'#087f75':'#b96812';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><circle cx="28" cy="34" r="24" fill="white" stroke="${selected?'#173fee':color}" stroke-width="${selected?4:2}"/><g transform="translate(14 20) scale(1.16)" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6 2 7M10 6h4m8 1-2-1"/><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16M8 15h.01M16 15h.01M6 19v2M18 21v-2"/></g><rect x="34" y="2" width="29" height="24" rx="12" fill="${color}" stroke="white" stroke-width="2"/><text x="48.5" y="18.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="${count>99?11:14}" font-weight="700" fill="white">${label}</text></svg>`;
 return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
export function freshReports<T extends {updated:number}>(reports:T[],now:number):T[]{
 return reports.filter(r=>Number.isFinite(r.updated)&&now-r.updated>=-5000&&now-r.updated<=30000);
}
