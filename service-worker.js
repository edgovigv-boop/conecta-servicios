// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Titular del proyecto: Conecta Servicios
// ------------------------------------------------------------------

const CACHE_NAME = "conecta-servicios-v4.9.8-embajadores-mp-piloto";
const ASSETS = [
  "./",
  "index.html",
  "styles.css?v=4.9.8-embajadores-mp-piloto",
  "app.js?v=4.9.8-embajadores-mp-piloto",
  "manifest.json",
  "assets/hero-scene-v4718.webp",
  "assets/hero-scene-clean-v4711.png",
  "assets/municipios-mx-base.json",
  "assets/municipios-mx-completo.json",
  "assets/pwa-plus-icon-192.png",
  "assets/pwa-plus-icon-512.png",
  "assets/apple-touch-plus.png",
  "assets/pwa-plus-maskable-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => null)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("conecta-servicios-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;
  const url = new URL(request.url);
  const isAppShell = request.mode === "navigate" || /\/(index\.html|app\.js|styles\.css|manifest\.json)(\?|$)/.test(url.pathname + url.search);
  if (isAppShell) {
    event.respondWith(
      fetch(request, { cache: "no-store" })
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match("index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => null);
      return response;
    }).catch(() => cached))
  );
});
