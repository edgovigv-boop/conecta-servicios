const CACHE_NAME = 'conecta-servicios-v5-2-9-dola-inyeccion-retorno';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=5.2.9-dola-inyeccion-retorno',
  '/app.js?v=5.2.9-dola-inyeccion-retorno',
  '/manifest.json?v=5.2.9-dola-inyeccion-retorno',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/conecta-logo-oficial.png'
];
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
    return res;
  }).catch(() => caches.match('/index.html'))));
});
