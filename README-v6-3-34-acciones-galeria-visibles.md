# Conecta Servicios v6.3.34 - Acciones y galería visibles

## Qué corrige

- Hace mucho más visibles las flechas de galería.
- Agrega y asegura la flecha derecha `>` para avanzar.
- Mantiene la flecha izquierda `<` visible para regresar.
- Las flechas quedan con fondo oscuro, borde blanco y mayor tamaño.
- Refuerza los botones laterales de corazón, mensaje y compartir.
- Agrega una fila extra de acciones visibles sobre cada publicación:
  - Me gusta
  - Mensaje
  - Compartir
- Mantiene el carrusel de varias fotos.
- Mantiene video con autoplay en silencio y botón de sonido.
- No cambia publicación, mensajes ni Supabase.

## Por qué se agregó una fila extra

En algunos celulares, los botones laterales pueden quedar tapados por capas del video/foto o por el área inferior. Para que Mensaje y Compartir nunca desaparezcan, esta versión los deja también en una fila visible dentro de la información inferior de la publicación.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-34-acciones-galeria-visibles.md

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

Refuerza flechas y acciones de publicaciones

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6334

## Checklist

1. Confirmar que se vea v6.3.34.
2. Abrir publicación con varias fotos.
3. Ver flecha `>` a la derecha.
4. Ver flecha `<` a la izquierda.
5. Tocar `>` y confirmar que avanza.
6. Tocar `<` y confirmar que regresa.
7. Confirmar que aparecen Mensaje y Compartir.
8. Tocar Mensaje y confirmar que abre chat.
9. Tocar Compartir y confirmar que comparte o copia.
10. Confirmar que publicar, búsqueda y tienda siguen funcionando.
