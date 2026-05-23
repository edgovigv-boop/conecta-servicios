# Conecta Servicios v6.3.32 - Multifoto, video limpio y limpieza de muestras

## Objetivo

Mejorar publicaciones reales antes de seguir con más módulos.

## Qué cambia

- Permite seleccionar varias fotos en una publicación.
- Las publicaciones con varias fotos se muestran como carrusel horizontal.
- Los videos se reproducen automáticamente dentro del feed en silencio y en loop.
- Se quitan los botones visibles `Recargar video` y `Ver grande` del video.
- Al tocar el video, se abre en visor grande interno.
- Se refuerza que los botones de corazón, mensaje y compartir sigan visibles.
- Se eliminan las publicaciones muestra locales del app, para que ya no aparezcan las semillas de prueba.
- Mantiene publicación, mensajes, tiendas por usuario y búsqueda.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-32-multifoto-video-limpio.md

## SQL opcional de limpieza

El archivo:

- cleanup-publicaciones-prueba-v6-3-32.sql

NO se sube a GitHub. Se usa en Supabase SQL Editor.

Trae consultas de revisión y borrado controlado para limpiar publicaciones de prueba.

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets

## Commit sugerido

Agrega multifoto y limpia video del feed

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6332

## Checklist de prueba

1. Confirmar que se vea `v6.3.32`.
2. Confirmar que ya no aparezcan publicaciones muestra locales.
3. Crear publicación con una foto.
4. Crear publicación con varias fotos.
5. Deslizar carrusel de fotos.
6. Crear o revisar publicación con video corto.
7. Confirmar que el video se reproduce automático sin botones Recargar/Ver grande.
8. Tocar el video y confirmar que abre visor grande interno.
9. Confirmar que corazón, mensaje y compartir están visibles.
10. Confirmar que mensajes, búsqueda y tiendas siguen funcionando.
