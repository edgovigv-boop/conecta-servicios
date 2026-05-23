# Conecta Servicios v6.3.28 - Búsqueda con teclado fijo

## Objetivo

La búsqueda ya encontraba palabras, pero el teclado se ocultaba al escribir. Esta versión corrige ese punto.

## Qué corrige

- La lupa permite escribir sin esconder el teclado.
- Mientras el usuario escribe, la app evita re-render completo.
- La búsqueda actualiza resultados con pequeño debounce.
- El polling de publicaciones/mensajes no repinta la pantalla si el input de búsqueda está activo.
- El botón Limpiar mantiene el foco en el buscador.
- Se conserva la búsqueda que ya encuentra palabras como “refrigerador”.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-28-busqueda-teclado-fijo.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## Commit sugerido

Corrige teclado de búsqueda con lupa

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6328

## Checklist de prueba

1. Confirmar que se vea `v6.3.28`.
2. Tocar lupa.
3. Escribir “refrigerador” completo.
4. Confirmar que el teclado NO se esconda.
5. Confirmar que aparezca la publicación.
6. Tocar Limpiar y confirmar que el teclado siga abierto.
7. Probar filtros después de cerrar búsqueda.
