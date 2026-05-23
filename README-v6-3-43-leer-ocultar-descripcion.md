# Conecta Servicios v6.3.43 - Descripción con ...leer / ...ocultar

## Qué corrige

- Cambia el comportamiento de descripciones largas al estilo TikTok.
- En vez de mostrar siempre un cuadro con scroll, primero muestra texto corto con `...leer`.
- Al tocar `...leer`, la descripción se despliega hacia arriba sobre el contenido.
- Si la descripción es muy larga, el texto desplegado tiene scroll propio.
- Al tocar `...ocultar`, vuelve a la vista corta.
- El contenido visual sigue siendo protagonista.
- Los botones ❤️, ✉️, ↗️ y 🔇/🔊 siguen visibles.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-43-leer-ocultar-descripcion.md

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

Agrega leer y ocultar en descripciones largas

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6343

## Checklist

1. Confirmar que se vea v6.3.43.
2. Abrir una publicación con descripción larga.
3. Confirmar que aparece `...leer`.
4. Tocar `...leer` y confirmar que la descripción sube y se despliega.
5. Si el texto es largo, deslizar dentro de la descripción.
6. Tocar `...ocultar` y confirmar que vuelve a la vista corta.
7. Confirmar que los botones de mensaje, compartir, me gusta y audio siguen funcionando.
