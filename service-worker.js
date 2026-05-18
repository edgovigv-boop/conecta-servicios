// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Titular del proyecto: Conecta Servicios
// ------------------------------------------------------------------

const CACHE_NAME = "conecta-servicios-v4.9.19-feed-pilotos-limpios";
const ASSETS = [
  "./",
  "index.html",
  "styles.css?v=4.9.19-feed-pilotos-limpios",
  "app.js?v=4.9.19-feed-pilotos-limpios",
  "manifest.json",
  "assets/hero-scene-v4718.webp",
  "assets/hero-scene-clean-v4711.png",
  "assets/municipios-mx-base.json",
  "assets/municipios-mx-completo.json",

  "assets/feed4919-solicitante-barista.webp",
  "assets/feed4919-solicitante-mandado.webp",
  "assets/feed4919-solicitante-mudanza.webp",
  "assets/feed4919-agente-entregas.webp",
  "assets/feed4919-agente-redes.webp",
  "assets/feed4919-agente-mandados.webp",
  "assets/feed4919-negocio-panaderia.webp",
  "assets/feed4919-negocio-estetica.webp",
  "assets/feed4919-negocio-ferreteria.webp",
  "assets/feed4919-servicio-reparacion.webp",
  "assets/feed4919-servicio-limpieza.webp",
  "assets/feed4919-servicio-mascotas.webp",
  "assets/feed4919-crecimiento-creditos.webp",
  "assets/feed4919-crecimiento-campana.webp",
  "assets/feed4919-crecimiento-clientes.webp",
  "assets/feed4919-embajadores-recomienda.webp",
  "assets/feed4919-embajadores-comision.webp",
  "assets/feed4919-embajadores-comunidad.webp",
  "assets/feed4919-aprendizaje-computacion.webp",
  "assets/feed4919-aprendizaje-oficios.webp",
  "assets/feed4919-aprendizaje-ventas.webp",
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
