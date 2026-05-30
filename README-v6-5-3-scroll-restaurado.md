# Conecta Servicios v6.5.3 — Scroll restaurado

## Qué corrige

La v6.5.2 mejoró el diseño inmersivo, pero bloqueó el scroll vertical del Feed y de otras pantallas.

## Cambio

- Restaura overflow-y del documento.
- El Feed vuelve a scrollear verticalmente entre publicaciones.
- Las pantallas de mensajes, perfil, tienda y paneles vuelven a permitir scroll.
- Mantiene el diseño inmersivo de pantalla completa.
- Mantiene carrusel, video, mensajes, admin y Supabase intactos.
- El modo encuadre sigue usando touch-action none solo cuando está activo.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-5-3-scroll-restaurado.md

## Commit sugerido

Restaura scroll en feed inmersivo

## Prueba recomendada

1. Abrir Inicio.
2. Deslizar verticalmente entre publicaciones.
3. Abrir Mensajes y scrollear la lista.
4. Abrir Perfil y scrollear.
5. Abrir Tienda y scrollear.
6. Probar carrusel horizontal en una publicación.
7. Probar mensaje, estrella, video y admin.
