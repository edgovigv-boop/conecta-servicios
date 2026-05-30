# Conecta Servicios v6.4.91 — Contador de carrusel arriba

## Qué corrige

La v6.4.90 quitó la línea de puntos, pero el contador quedó demasiado abajo y se mezcló con el título/descripción.

## Cambio

- Mantiene el contador compacto `1/3`.
- Lo mueve al centro superior de la imagen.
- Lo deja debajo de las pestañas Vendo/Ofrezco/Necesito.
- No toca el sistema de swipe.
- No cambia lógica de publicación, mensajes, admin, video ni Supabase.

## Commit sugerido

Mueve contador de carrusel arriba

## Prueba recomendada

1. Abrir publicación con varias fotos.
2. Verificar que el contador ya no quede encima del título o descripción.
3. Verificar que el contador aparezca arriba, centrado y discreto.
4. Probar swipe.
5. Probar botones ‹ y ›.
