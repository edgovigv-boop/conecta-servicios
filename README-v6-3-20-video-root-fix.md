# Conecta Servicios v6.3.20 - Video root fix

## Qué corrige desde la raíz

Esta versión deja de depender de guards acumulados para el video.

Corrige:

- La mezcla entre publicaciones locales y remotas.
- El caso donde localStorage/IndexedDB sobrescribía una publicación remota correcta.
- La regla principal: si una publicación tiene `mediaUrl` válida y `mediaType = "video"`, nunca se muestra como pendiente.
- El feed ya no intenta reproducir videos incrustados.
- El video se abre en un visor interno dentro de la app con `<video controls playsinline preload="metadata">`.
- El service worker usa versión nueva y estrategia network-first para `index.html`, `app.js` y `service-worker.js`.

## Archivos modificados

Sube/reemplaza:

- app.js
- index.html
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-20-video-root-fix.md

## Archivos que NO se tocan

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL nuevo.

## Commit sugerido

Corrige video desde raíz y visor interno

## Prueba recomendada

1. Espera Vercel Ready.
2. Abre en ambos celulares:

https://conecta-servicios.vercel.app/?v=6320

3. Publica una foto.
4. Verifica que aparece en el otro celular.
5. Publica un video corto.
6. Verifica que aparece en el otro celular.
7. El video NO debe decir pendiente si ya tiene mediaUrl.
8. Toca “Ver video”.
9. Debe abrirse un visor interno dentro de la app.
10. Cierra el visor y vuelve al feed.
11. Borra la publicación y confirma que desaparece en ambos celulares.
12. Prueba Mensajes para confirmar que el chat sigue funcionando.

## Nota

Para reproducción tipo TikTok/Instagram dentro del feed se necesitaría una fase posterior de compresión/transcodificación. Para el MVP, el visor interno es la opción más estable.
