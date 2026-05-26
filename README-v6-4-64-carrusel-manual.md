# Conecta Servicios v6.4.64 - Carrusel manual

## Objetivo

Corregir el carrusel de publicaciones con varias fotos para que no avance ni se mueva automáticamente.

## Qué cambia

- El carrusel queda en modo manual.
- Las fotos solo cambian cuando el usuario:
  - desliza con el dedo;
  - toca los puntitos del carrusel.
- Al abrir o re-renderizar la publicación, ya no se hace scroll animado automático.
- Los puntitos ahora reflejan la foto realmente visible según el scroll del usuario.
- Se limpian posibles timers/residuos de autoplay en galerías.
- No toca mensajes.
- No toca perfil.
- No toca admin.
- No toca publicar.
- No toca Supabase Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-64-carrusel-manual.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Deja carrusel en modo manual

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6464

Para admin:

https://conecta-servicios.vercel.app/?v=6464&admin=media#admin

## Checklist

1. Abrir una publicación con varias fotos.
2. Esperar 15 a 20 segundos.
3. Confirmar que las fotos no avanzan solas.
4. Deslizar con el dedo.
5. Confirmar que cambia una foto a la vez.
6. Tocar puntitos.
7. Confirmar que cambia solo cuando el usuario lo decide.
8. Confirmar mensajes, perfil y admin.
