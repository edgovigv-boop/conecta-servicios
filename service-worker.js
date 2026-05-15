// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Titular del proyecto: Conecta Servicios
// ------------------------------------------------------------------

const CACHE_NAME = "conecta-servicios-v4.8.3-reconstruccion-visual-controlada";
const ASSETS = [
  "./",
  "index.html",
  "styles.css?v=4.8.3-reconstruccion-visual-controlada",
  "app.js?v=4.8.3-reconstruccion-visual-controlada",
  "manifest.json",
  "assets/hero-scene-v4718.webp",
  "assets/hero-scene-clean-v4711.png",
  "assets/logo-conecta-v4718.svg",
  "assets/municipios-mx-base.json",
  "assets/icon-v4718-192.png",
  "assets/icon-v4718-512.png",
  "assets/apple-touch-v4718.png",
  "assets/maskable-v4718-512.png"
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
  const isAppShell = request.mode === "navigate" || /\/(index\.html|app\.js|styles\.css|manifest\.json)(\?|$)/.test(new URL(request.url).pathname + new URL(request.url).search);
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
