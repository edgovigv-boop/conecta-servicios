# Conecta Servicios v4.0.3 — cercanía precisa, publicación asistida y enlaces externos

© 2026 Conecta Servicios. Todos los derechos reservados.

Esta versión consolida:

- Corrección de **Publicaciones cerca de mí**: solo muestra publicaciones con coordenadas dentro del radio elegido.
- Radio de búsqueda: 10 km, 25 km, 50 km y 100 km.
- Asistente de descripción sin IA externa: ayuda a redactar, aclarar, resumir o agregar detalles.
- Enlaces externos visibles para referencias de Facebook/Instagram/redes, sin copiar contenido ajeno.
- Mantiene ubicación aproximada segura, publicación guiada, diseño moderno, folios, edición admin y protección legal básica.

## Publicación

Subir a GitHub/Vercel:

- index.html
- styles.css
- app.js
- README.md
- assets/brand-hero.webp

No requiere SQL nuevo si ya se aplicó el SQL de v4.0.


## v4.0.3 — cercanía inteligente

- Corrige la vista “Publicaciones cerca de mí” para no ocultar registros locales antiguos sin coordenadas.
- Muestra primero publicaciones con GPS dentro del radio elegido.
- Agrega como respaldo publicaciones del mismo municipio que aún no tienen latitud/longitud.
- Evita mezclar otros estados o municipios salvo que realmente estén dentro del radio GPS.
- No requiere SQL nuevo si ya se aplicó la v4.0.
