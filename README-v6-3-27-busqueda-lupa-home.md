# Conecta Servicios v6.3.27 - Búsqueda con lupa y ajuste Home

## Objetivo

Corregir la lupa de la interfaz superior estilo TikTok sin rediseñar toda la app.

## Qué corrige

- La lupa ya permite escribir sin cerrar el teclado.
- Al escribir, la búsqueda no vuelve a pintar el encabezado.
- La búsqueda ahora ignora filtros activos para encontrar cualquier publicación.
- La búsqueda normaliza acentos y espacios.
- Si buscas “refrigerador”, debe encontrar publicaciones que lo tengan en título o descripción.
- Muestra conteo de resultados.
- Ajusta un poco la vista del Home sin cambiar la estructura principal.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-27-busqueda-lupa-home.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## Commit sugerido

Corrige búsqueda con lupa y ajusta Home

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6327

## Checklist de prueba

1. Confirmar que se vea `v6.3.27`.
2. Tocar la lupa.
3. Escribir “refrigerador”.
4. Ver que no se cierre el teclado.
5. Ver que aparezca la publicación de refrigerador.
6. Probar buscar una palabra de una publicación real.
7. Confirmar que VENDO / OFREZCO / NECESITO siguen funcionando cuando no hay búsqueda.
8. No avanzar al siguiente cambio si la búsqueda no queda al 100%.
