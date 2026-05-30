# Conecta Servicios v6.4.90 — Carrusel compacto

## Qué corrige

El indicador de carrusel con puntos podía sentirse como una división visual sobre la foto.

## Cambio

- Se reemplaza la fila de puntos por un contador compacto tipo `1/7`.
- Se coloca en una esquina inferior derecha discreta.
- Incluye botones pequeños ‹ y › para avanzar o regresar.
- Conserva el swipe horizontal del carrusel.
- Evita tapar la imagen principal y la lectura de la publicación.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-90-carrusel-compacto.md

## Commit sugerido

Compacta indicador de carrusel

## Prueba recomendada

1. Abrir publicación con varias fotos.
2. Confirmar que ya no aparece una fila de puntos atravesando la foto.
3. Verificar que aparece contador compacto `1/7`.
4. Probar swipe horizontal.
5. Probar botones ‹ y ›.
