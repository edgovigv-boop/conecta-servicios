// Conecta Servicios v4.9.39 — Service Worker Asistente de publicaciones
const CACHE_NAME = "conecta-servicios-4.9.39-asistente-publicaciones";
const ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=4.9.39-asistente-publicaciones",
  "/app.js?v=4.9.39-asistente-publicaciones",
  "/manifest.json?v=4.9.39-asistente-publicaciones",
  "/service-worker.js?v=4.9.39-asistente-publicaciones"
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
