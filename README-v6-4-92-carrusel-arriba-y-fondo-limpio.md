# Conecta Servicios v6.4.92 — Carrusel arriba y fondo limpio

## Qué corrige

1. El contador del carrusel quedó demasiado abajo y se mezclaba con título/descripción.
2. El fondo ahumado de la zona de título/descripción dividía visualmente la foto.

## Cambio

- El contador 1/3 se mueve al centro superior de la imagen.
- Se conserva el swipe y los botones ‹ / ›.
- Se elimina el fondo ahumado/gradiente de la zona de texto.
- Se mantiene legibilidad con sombra de texto, sin tapar tanto la foto.
- No se toca Supabase, mensajes, video ni lógica de publicaciones.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-92-carrusel-arriba-y-fondo-limpio.md

## Commit sugerido

Mueve contador arriba y limpia fondo de publicacion

## Prueba recomendada

1. Abrir una publicación con varias fotos.
2. Confirmar que el contador aparece arriba, centrado y discreto.
3. Confirmar que ya no tapa título/descripción.
4. Confirmar que la foto se aprecia mejor sin la franja ahumada.
5. Probar swipe y botones ‹ / ›.
