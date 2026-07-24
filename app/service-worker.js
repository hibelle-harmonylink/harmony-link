const CACHE="harmony-link-app-v61";
const ASSETS=["./","./index.html","./app.css?v=61","./overrides.css?v=61","./app.js?v=61","./manifest.webmanifest?v=61","./icon-192.png?v=61","./icon-512.png?v=61","../assets/harmony-logo.png","../assets/volunteer/digital-volunteer.png","../assets/events/one-day-class.jpg","../assets/events/finance-ai-seminar.jpg","../assets/partners/partner-recruitment.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html"))));
});
