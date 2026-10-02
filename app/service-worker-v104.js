// Keep the registration URL stable so already installed clients receive this fix.
const CACHE="harmony-link-app-v108";
const ASSETS=["./","./index.html","./app.css?v=65","./overrides.css?v=104","./app.js?v=105","../shared/data/businesses.js?v=4","../shared/data/events.js?v=1","../shared/data/programs.js?v=1","../shared-content.js?v=88","./manifest-v72.webmanifest","./icon-192-v71.png","./icon-512-v71.png","../assets/harmony-logo.png","../assets/instagram.svg","../assets/threads.svg","../assets/home/harmony-community-learning.png","../assets/events/meeran-melody-messiah-20261209.png","../assets/events/hole19-screen-golf-tournament-20260930.png","../assets/events/free-music-class-20260822.png","../assets/events/one-day-class.jpg","../assets/events/finance-ai-seminar.jpg","../assets/events/ai-business-automation-free-class-20260911.webp","../assets/events/lina-market-ai-growth-20261003.jpg","../assets/events/roxpkg-build-a-box-ai-automation-20260928.jpg","../assets/events/boxd-kitchen-youtube-interview-20260926.jpg","../assets/images/dms-care-logo.webp","../assets/ads/coway/coway-banner-16x9.png","../assets/ads/coway/coway-logo.png"];
const APP_ENTRY=new URL("./",self.location.href).href;
const APP_INDEX=new URL("./index.html",self.location.href).href;
function isAppEntry(request){
  const url=new URL(request.url);
  url.search="";
  url.hash="";
  return url.href===APP_ENTRY||url.href===APP_INDEX;
}
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE)
  // A new cache name alone does not prevent addAll from copying stale HTTP HTML.
  .then(cache=>cache.addAll(ASSETS.map(asset=>new Request(new URL(asset,self.location.href),{cache:"reload"}))))
  .then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys()
  .then(keys=>Promise.all(keys.filter(key=>key.startsWith("harmony-link-app-")&&key!==CACHE).map(key=>caches.delete(key))))
  .then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const entry=isAppEntry(event.request);
  event.respondWith(fetch(event.request,{cache:"no-store"}).then(async response=>{
    if(response.ok){
      try{
        const cache=await caches.open(CACHE);
        // All app entry aliases share one refreshed HTML fallback, not per-URL snapshots.
        await cache.put(entry?APP_ENTRY:event.request,response.clone());
      }catch{/* Storage failure must not replace a successful network response. */}
    }
    return response;
  }).catch(async()=>{
    const cache=await caches.open(CACHE);
    // Never recover an obsolete shell from a different cache or an index/query alias.
    const cached=await cache.match(entry?APP_ENTRY:event.request);
    return cached||Response.error();
  }));
});
