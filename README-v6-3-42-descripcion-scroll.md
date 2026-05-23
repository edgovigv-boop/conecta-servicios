# Conecta Servicios v6.3.42 - Descripción con scroll propio

## Qué corrige

- Las publicaciones con descripción larga ya no cortan el texto.
- La descripción tiene su propio scroll dentro de la publicación.
- El usuario puede deslizar sobre la descripción para leer toda la oferta.
- El video o foto sigue siendo protagonista.
- Los botones de acción se mantienen visibles.
- Se conserva el diseño abuelita friendly con botones de iconos.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-42-descripcion-scroll.md

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

Agrega scroll propio a descripciones largas

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6342

## Checklist

1. Confirmar que se vea v6.3.42.
2. Abrir publicación con descripción larga.
3. Deslizar dentro de la descripción y confirmar que se lee completa.
4. Confirmar que la foto/video sigue siendo protagonista.
5. Confirmar que ❤️, ✉️, ↗️ y 🔇/🔊 siguen visibles.
6. Confirmar que mensajes, compartir, perfil y tienda siguen funcionando.
