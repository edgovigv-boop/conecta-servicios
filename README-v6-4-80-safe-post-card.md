# Conecta Servicios v6.4.80 — Protección por tarjeta

## Qué corrige

La app seguía mostrando “Hubo un problema con una pantalla” porque `homePage()` falla cuando una sola publicación rompe `postCard(post)`.

Esta versión mantiene la apariencia original, pero cambia el render del feed:

- `safePostCard(post)` intenta pintar la tarjeta normal.
- Si una publicación falla, solo esa tarjeta se recupera.
- El resto del feed sigue visible.
- `feedMarkup()` ya no tumba toda la pantalla por una publicación dañada.

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-80-safe-post-card.md`

## Commit sugerido

Protege feed contra publicaciones dañadas

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/limpiar-cache.html

## Importante

No usa feed-rescue.
No cambia diseño general.
No toca Supabase.
