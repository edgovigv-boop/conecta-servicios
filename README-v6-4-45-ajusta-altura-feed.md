# Conecta Servicios v6.4.45 - Ajusta altura del feed

## Objetivo

Corregir el hueco inferior marcado en la captura, donde una publicación terminaba antes de completar la pantalla y dejaba ver la siguiente publicación debajo.

## Qué corrige

- Cada publicación vuelve a ocupar el alto completo visible del celular.
- El menú superior sigue flotante y transparente.
- La siguiente publicación ya no debe verse antes de hacer scroll.
- Se elimina el espacio/hueco entre publicaciones.
- El bloque inferior baja con la publicación, sin quedarse arriba.
- La barra inferior sigue flotante y transparente.
- No toca mensajes, perfil, Supabase, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-45-ajusta-altura-feed.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige altura completa de publicaciones

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6445

## Checklist

1. Confirmar que aparece `v6.4.45`.
2. Revisar una publicación nueva.
3. Confirmar que ya no queda hueco inferior antes de la siguiente publicación.
4. Confirmar que la siguiente publicación solo aparece al hacer scroll.
5. Confirmar que menú flotante superior sigue visible.
6. Confirmar que barra inferior sigue visible.
7. Confirmar mensajes y perfil.
