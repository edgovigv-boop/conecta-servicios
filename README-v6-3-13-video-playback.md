# Conecta Servicios v6.3.13 - Video reproducible

## Problema

La publicación de video ya aparece en ambos celulares, pero sigue mostrando:

> El video está pendiente. La publicación ya está visible.

y el usuario no puede reproducir el video correctamente.

## Causa probable

La publicación ya puede tener una `mediaUrl` real, pero el estado viejo `mediaStatus: "pendiente"` queda guardado en localStorage o viene mezclado desde el muro público. Eso hace que la app siga mostrando la banda de pendiente aunque ya exista un video disponible.

## Solución

Se agrega `video-playback-guard.js` antes de `app.js`.

Este guard:

- limpia publicaciones locales si ya tienen `mediaUrl`,
- intercepta `/api/publications` y elimina `mediaStatus: "pendiente"` cuando ya existe `mediaUrl`,
- asegura que los videos tengan `controls`, `playsinline` y `preload="metadata"`,
- oculta la banda de pendiente cuando ya hay un `<video src="">` real.

## Archivos para subir

Sube/reemplaza:

- index.html
- video-playback-guard.js
- manifest.json
- service-worker.js
- README-v6-3-13-video-playback.md

## No tocar

- app.js
- styles.css
- api
- assets
- SQL

## Commit sugerido

Corrige reproducción de video publicado

## Prueba

1. Sube los archivos.
2. Espera Vercel Ready.
3. Abre en ambos celulares:

https://conecta-servicios.vercel.app/?v=6313

4. Revisa la publicación de video.
5. Si el video ya tiene `mediaUrl`, debe desaparecer el mensaje de pendiente y debe reproducirse.

## Si sigue pendiente

Si después de esto el video sigue sin reproducirse, entonces el archivo de video no llegó a Supabase Storage. En ese caso hay que revisar el bucket `publication-media` y la respuesta exacta de subida.
