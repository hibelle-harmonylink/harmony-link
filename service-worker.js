const CACHE_NAME = 'harmony-link-pwa-v6';
const ADMIN_ASSET_PATHS = new Set(['/admin.html', '/admin.css', '/admin.js']);
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/styles.css?v=20260908-12',
  '/homepage-ui.css?v=20260908-17',
  '/script.js?v=20260908-13',
  '/assets/harmony-logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('harmony-link-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);

  // The administrator area must never fall back to a stale HTML/CSS/JS
  // response. The pathname check deliberately preserves query strings as
  // part of the request while applying the policy to every versioned URL.
  if (ADMIN_ASSET_PATHS.has(requestUrl.pathname)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // /app/ has its own, more-specific service worker. Do not duplicate its
  // assets in the root runtime cache while that worker is responsible for
  // its PWA and offline behavior.
  if (requestUrl.pathname.startsWith('/app/')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
    if (response.ok && requestUrl.origin === self.location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/app/'))));
});
