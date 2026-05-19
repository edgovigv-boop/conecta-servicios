// ------------------------------------------------------------------
// PROPIEDAD EXCLUSIVA - DERECHOS RESERVADOS © 2026
// Proyecto: Conecta Servicios
// Titular del proyecto: Conecta Servicios
// ------------------------------------------------------------------

const CACHE_NAME = "conecta-servicios-v4.9.34-hotfix-subida-multimedia-admin";
const ASSETS = [
  "./",
  "index.html",
  "styles.css?v=4.9.34-hotfix-subida-multimedia-admin",
  "app.js?v=4.9.34-hotfix-subida-multimedia-admin",
  "manifest.json",
  "assets/hero-scene-v4718.webp",
  "assets/hero-scene-clean-v4711.png",
  "assets/municipios-mx-base.json",
  "assets/municipios-mx-completo.json",

  "assets/photo4922-solicitantes-1.webp",
  "assets/photo4922-solicitantes-2.webp",
  "assets/photo4922-solicitantes-3.webp",
  "assets/photo4922-solicitantes-4.webp",
  "assets/photo4922-solicitantes-5.webp",
  "assets/photo4922-agentes-1.webp",
  "assets/photo4922-agentes-2.webp",
  "assets/photo4922-agentes-3.webp",
  "assets/photo4922-agentes-4.webp",
  "assets/photo4922-agentes-5.webp",
  "assets/photo4922-negocios-1.webp",
  "assets/photo4922-negocios-2.webp",
  "assets/photo4922-negocios-3.webp",
  "assets/photo4922-negocios-4.webp",
  "assets/photo4922-negocios-5.webp",
  "assets/photo4922-servicios-1.webp",
  "assets/photo4922-servicios-2.webp",
  "assets/photo4922-servicios-3.webp",
  "assets/photo4922-servicios-4.webp",
  "assets/photo4922-servicios-5.webp",
  "assets/photo4922-crecimiento-1.webp",
  "assets/photo4922-crecimiento-2.webp",
  "assets/photo4922-crecimiento-3.webp",
  "assets/photo4922-crecimiento-4.webp",
  "assets/photo4922-crecimiento-5.webp",
  "assets/photo4922-embajadores-1.webp",
  "assets/photo4922-embajadores-2.webp",
  "assets/photo4922-embajadores-3.webp",
  "assets/photo4922-embajadores-4.webp",
  "assets/photo4922-embajadores-5.webp",
  "assets/photo4922-aprendizaje-1.webp",
  "assets/photo4922-aprendizaje-2.webp",
  "assets/photo4922-aprendizaje-3.webp",
  "assets/photo4922-aprendizaje-4.webp",
  "assets/photo4922-aprendizaje-5.webp",

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
