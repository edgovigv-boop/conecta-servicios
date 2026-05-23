const CACHE_NAME = 'conecta-servicios-v6-3-28-busqueda-teclado-fijo';

const ASSETS = [
  '/',
  '/index.html',
  '/styles.css?v=6.3.12-publicaciones-video-sync',
  '/app.js?v=6.3.28-video-tus-resumable',
  '/manifest.json?v=6.3.28-video-tus-resumable',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/icons/conecta-logo-oficial.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith('conecta-servicios-') && key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  const networkFirst =
    req.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/service-worker.js') ||
    url.search.includes('v=6328') ||
    url.search.includes('v=6.3.28');

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
