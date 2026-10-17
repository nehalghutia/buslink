/** Shared SDK loading keeps optional maps safe to close, reopen, and mount together. */
export type MapSdk = { engine: 'leaflet' | 'google'; label: string };
let sdkPromise: Promise<MapSdk> | undefined;
let leafletPromise: Promise<void> | undefined;
let googleUnavailable = false;
const authListeners = new Set<() => void>();
export function onGoogleMapFailure(listener: () => void) {
 authListeners.add(listener);
 return () => { authListeners.delete(listener); };
}
function script(id: string, src: string, ready: () => boolean, google = false): Promise<void> {
 if (ready()) return Promise.resolve();
 return new Promise((resolve, reject) => {
  let node = document.getElementById(id) as HTMLScriptElement | null;
  const fresh = !node;
  node ??= Object.assign(document.createElement('script'), { id, src, async: true });
  const cleanup = () => { clearTimeout(timer); node!.removeEventListener('load', done); node!.removeEventListener('error', failed); if(google)window.initBusMap=()=>{}; };
  const done = () => { cleanup(); if (ready()) resolve(); else { node!.remove(); reject(Error('Map library did not initialize.')); } };
  const failed = () => { cleanup(); node!.remove(); reject(Error('Map library could not load.')); };
  const timer = setTimeout(failed, 12000);
  // Attach listeners before appending: cached scripts can load immediately.
  if(google)window.initBusMap=done;else node.addEventListener('load', done, { once: true });
  node.addEventListener('error', failed, { once: true });
  if (fresh) document.head.appendChild(node);
  else if (ready()) done();
 });
}
export function loadLeaflet(): Promise<void> {
 if (!document.getElementById('leaflet-css')) {
  const css = Object.assign(document.createElement('link'), { id: 'leaflet-css', rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' });
  document.head.appendChild(css);
 }
 if (!leafletPromise) leafletPromise = script('leaflet-js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', () => !!window.L)
  .catch(error => { leafletPromise = undefined; throw error; });
 return leafletPromise;
}
export function loadMapSdk(): Promise<MapSdk> {
 if (googleUnavailable) return loadLeaflet().then(() => ({ engine: 'leaflet', label: 'OpenStreetMap' }));
 if (!sdkPromise) sdkPromise = (async (): Promise<MapSdk> => {
  try {
   if (typeof window.google?.maps?.Map !== 'function') {
    const response = await fetch('/api/map-config', { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw Error('Map configuration unavailable');
    const config = await response.json() as { key?: string | null };
    if (!config.key) throw Error('Use the open map');
    window.gm_authFailure = () => {
     googleUnavailable = true;
     sdkPromise = undefined;
     authListeners.forEach(notify => notify());
    };
    await script('buslink-google-maps', 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(config.key) + '&loading=async&callback=initBusMap', () => typeof window.google?.maps?.Map === 'function', true);
    if (googleUnavailable) throw Error('Google Maps unavailable');
   }
   return { engine: 'google', label: 'Google Maps' };
  } catch {
   await loadLeaflet();
   return { engine: 'leaflet', label: 'OpenStreetMap' };
  }
 })().catch(error => { sdkPromise = undefined; throw error; });
 return sdkPromise;
}
