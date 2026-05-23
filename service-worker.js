const CACHE_NAME = 'conecta-servicios-v6-3-9-chat-limpio-sonido';

const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=6.3.9-chat-limpio-sonido',
  '/app.js?v=6.3.9-chat-limpio-sonido',
  '/manifest.json?v=6.3.9-chat-limpio-sonido',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/conecta-logo-oficial.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  // Para evitar que un celular se quede con app.js viejo, HTML/JS/CSS van network-first.
  const networkFirst = url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css');

  if (networkFirst) {
    event.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
        return res;
      }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached =>
      cached ||
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
        return res;
      }).catch(() => caches.match('/index.html'))
    )
  );
});
