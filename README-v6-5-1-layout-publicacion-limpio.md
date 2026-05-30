# Conecta Servicios v6.5.1 — Layout limpio de publicación

## Qué corrige

Se reconstruyó la jerarquía de la tarjeta de publicación para evitar superposiciones:

- La imagen/carrusel/video queda en su propio contenedor limpio.
- El contador de fotos vive dentro del contenedor de imagen, como pastilla discreta `‹ 1 / 3 ›`.
- El texto de usuario, ubicación, título, descripción, fecha, acciones y admin vive en un bloque normal debajo de la imagen.
- Se elimina el overlay/gradiente oscuro sobre la foto.
- No se usa posicionamiento absoluto para el texto de la publicación.
- El swipe del carrusel se conserva.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-5-1-layout-publicacion-limpio.md

## Commit sugerido

Reestructura layout limpio de publicacion

## Prueba recomendada

1. Abrir publicación con varias fotos.
2. Confirmar imagen limpia sin banda ahumada.
3. Confirmar contador discreto abajo/derecha dentro de la imagen.
4. Confirmar texto completo debajo de la imagen, sin superponerse.
5. Probar swipe horizontal.
6. Probar mensajes, estrella, perfil y admin.
