# Conecta Servicios v6.3.39 - Fix altavoz y perfil

## Qué corrige

- El altavoz ahora se agrega como botón externo al video, no solo dentro del contenedor del video.
- El botón 🔇/🔊 queda por encima de las capas visuales.
- Corrige que el campo de nombre en Perfil cierre el teclado por renders automáticos.
- Evita repintar la app mientras se escribe en inputs.
- Reduce el peso de la foto de perfil para que se guarde mejor.
- Fuerza que las publicaciones propias usen la foto y nombre guardados en Perfil.
- Cuando Supabase devuelve una publicación propia sin avatar, la app vuelve a aplicar el avatar local.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-39-altavoz-perfil-fix.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL.

## Commit sugerido

Corrige altavoz y perfil de anunciante

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6339

## Checklist

1. Confirmar que se vea v6.3.39.
2. Abrir una publicación con video y confirmar que aparece 🔇/🔊.
3. Tocar 🔇/🔊 y confirmar que se activa sonido.
4. Ir a Perfil.
5. Escribir en Nombre visible sin que se cierre el teclado.
6. Subir foto de perfil.
7. Guardar perfil.
8. Confirmar que nombre y foto aparecen en publicaciones propias.
9. Recargar la app y confirmar que siguen apareciendo.
