# Conecta Servicios v6.4.74 — Render seguro del feed

## Qué corrige

La pantalla “La app se protegió de una pantalla en blanco” aparece cuando una excepción en el render tumba toda la pantalla.

Esta versión evita eso con dos defensas:

1. `safePostCard(post)`: si una publicación viene dañada o con datos inesperados, solo esa tarjeta se recupera con un diseño seguro.
2. Render fallback: si Home falla, intenta pintar el feed con tarjetas seguras antes de mostrar cualquier pantalla técnica.

## Base

Parte de la base estable:

`v6.4.48-encuadre-botones-arriba`

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-74-render-seguro-feed.md`

## Commit sugerido

Agrega render seguro para evitar pantalla blanca

## Después de Vercel Ready

Abrir en el celular:

https://conecta-servicios.vercel.app/limpiar-cache.html

## Importante

No subir `feed-rescue.js`.
No usar `output: export`.
No tocar Supabase.
