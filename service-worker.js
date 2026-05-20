// Conecta Servicios v4.9.48 — Bots por perfil
const CACHE_NAME = "conecta-servicios-v4.9.49-dola-asistente-interno";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=v4.9.49-dola-asistente-interno",
  "/app.js?v=v4.9.49-dola-asistente-interno",
  "/manifest.json?v=v4.9.49-dola-asistente-interno",
  "/service-worker.js?v=v4.9.49-dola-asistente-interno"
];
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
    return response;
  }).catch(() => cached)));
});
