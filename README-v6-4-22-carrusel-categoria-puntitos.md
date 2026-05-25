# Conecta Servicios v6.4.22 - Carrusel, categoría y puntitos

## Objetivo

Corregir tres detalles reportados en la v6.4.21:

1. El carrusel de fotos seguía sin correr con el dedo.
2. La categoría se veía como `o...` en lugar de `OFREZCO`.
3. Los puntitos no quedaron donde se pidió y estaban grandes.

## Qué corrige

- Refuerza el arrastre horizontal del carrusel con soporte `pointer` y respaldo `touch`.
- Fuerza el movimiento horizontal de fotos incluso en Android/Brave.
- Mantiene tap en puntitos para cambiar de foto.
- Muestra la categoría completa: `VENDO`, `OFREZCO` o `NECESITO`.
- Reubica los puntitos arriba del usuario, hacia la derecha, como referencia visual más cercana a la flecha indicada.
- Hace los puntitos más pequeños.
- Mantiene edición directa, multimedia directa, encuadre directo, perfil persistente y mensajes.

## Qué no cambia

- No toca `api/messages.js`.
- No cambia mensajes.
- No requiere SQL.
- No cambia Supabase.
- No cambia Storage.
- No mezcla foto + video todavía.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-22-carrusel-categoria-puntitos.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige carrusel categoria y puntitos

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6422

## Checklist

1. Confirmar que aparece `v6.4.22`.
2. Abrir publicación con varias fotos.
3. Arrastrar horizontalmente sobre la foto.
4. Confirmar que corre a la siguiente foto.
5. Tocar puntitos y confirmar que cambia de foto.
6. Confirmar que los puntitos están más pequeños y arriba/derecha del usuario.
7. Confirmar que la categoría se lee completa: `OFREZCO`, `VENDO` o `NECESITO`.
8. Confirmar que mensajes siguen funcionando.
