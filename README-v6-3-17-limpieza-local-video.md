# Conecta Servicios v6.3.17 - Limpieza local de publicaciones y video

## Diagnóstico encontrado

`/api/video-diagnostics` ya mostró que varios videos sí tienen:

- `hasMediaUrl: true`
- `looksLikeStorage: true`
- `mediaStatus: ""`

Eso significa que el video sí llegó a Supabase Storage.

El problema persistente es que algunos celulares conservan copias viejas en `localStorage` con:

- video pendiente
- publicación eliminada
- publicación duplicada o vieja

## Qué corrige esta versión

Agrega `stale-posts-guard.js`, que limpia el almacenamiento local del celular y prefiere siempre la versión correcta del muro público.

También conserva los guards de:

- videos hasta 10 minutos
- reproducción de video cuando ya existe mediaUrl

## Archivos para GitHub

Sube/reemplaza:

- index.html
- stale-posts-guard.js
- video-long-guard.js
- video-playback-guard.js
- manifest.json
- service-worker.js
- README-v6-3-17-limpieza-local-video.md

## No tocar

- app.js
- styles.css
- api
- assets

## Commit sugerido

Corrige copias locales viejas de publicaciones y video

## Después de Vercel Ready

Abre en ambos celulares:

https://conecta-servicios.vercel.app/?v=6317

La primera carga puede recargar una vez sola para limpiar el almacenamiento local.

## Prueba

1. Abre la liga con `?v=6317` en ambos celulares.
2. Espera 10 segundos.
3. Revisa que desaparezcan publicaciones eliminadas viejas.
4. Revisa que los videos con `mediaUrl` ya no digan pendiente.
5. Publica un video nuevo corto.
6. Si sube bien, debe reproducirse sin mensaje de pendiente.
