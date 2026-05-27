# Emergencia — Rescate visual del feed desde Supabase

## Commit sugerido

Agrega rescate visual del feed desde Supabase

## Situación confirmada

`/api/publications` ya responde:

- `ok: true`
- `posts: [...]`

Eso significa que Supabase y Vercel ya están entregando publicaciones.

Si el centro de la app sigue blanco, el problema está en el render del Home/feed del navegador, no en Supabase.

## Qué hace este parche

Agrega `feed-rescue.js`.

Este archivo solo actúa si detecta que la app quedó sin tarjetas visibles. Entonces:

1. Consulta `/api/publications`.
2. Toma las publicaciones reales.
3. Construye un feed visual de emergencia.
4. No toca Supabase.
5. No toca Storage.
6. No toca mensajes.
7. No reemplaza app.js.

## Archivos incluidos

- `index.html`
- `feed-rescue.js`
- `README-EMERGENCIA-FEED-RESCUE.md`

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6468

## Importante

Este es un parche de presentación para que el feed no quede blanco.
Después, con calma, se debe revisar por qué el render principal no está pintando las tarjetas aunque la API ya entrega datos.
