# Conecta Servicios v6.4.58 - Emergencia feed siempre visible

## Objetivo

Evitar de inmediato que cualquier celular abra en blanco o quede en `Cargando publicaciones`.

## Qué corrige

- Si no hay publicaciones en el dispositivo o en la nube, carga un muro base de respaldo.
- El Home ya no muestra pantalla blanca ni `Cargando publicaciones` como vista principal.
- Mantiene menú flotante superior.
- Mantiene publicación a pantalla completa.
- No vuelve a mostrar el cuadro Buscar/OFREZCO debajo de la publicación.
- No toca mensajes, perfil, Storage ni SQL.
- No agrega footer visible ni botones nuevos de sincronización.

## Importante

Esta es una versión de estabilización visual urgente para no perder la demostración.
Después, con calma, se debe revisar por qué el muro público de Supabase no está devolviendo publicaciones reales a todos los dispositivos.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-58-emergencia-feed-siempre-visible.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Estabiliza feed siempre visible

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6458
