# Conecta Servicios v6.4.21 - Carrusel y edición limpia

## Objetivo

Corregir el carrusel de fotos y limpiar la vista de edición directa.

## Qué corrige

- El carrusel de fotos ahora permite arrastrar horizontalmente con el dedo.
- Los puntitos siguen cambiando al mover el carrusel.
- Los puntitos quedan reubicados hacia la zona indicada: arriba del usuario y hacia la derecha, sin tapar el nombre.
- Se mantiene la opción de tocar puntitos para cambiar de foto.
- Se quitan textos innecesarios del panel de edición directa:
  - explicación superior
  - ayuda debajo de zona/cobertura
  - tip inferior
- Los textos importantes del panel de edición, como Título, Descripción y Zona/cobertura, ahora se ven más blancos y claros.

## Qué no cambia

- No toca mensajes.
- No toca `api/messages.js`.
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
- `README-v6-4-21-carrusel-edicion-limpia.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige carrusel y limpia edicion directa

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6421

## Checklist

1. Confirmar que aparece `v6.4.21`.
2. Abrir una publicación con varias fotos.
3. Arrastrar horizontalmente sobre la foto.
4. Confirmar que cambia a la siguiente foto.
5. Confirmar que el puntito activo cambia.
6. Tocar puntitos y confirmar que cambia la foto.
7. Tocar `Editar aquí`.
8. Confirmar que ya no aparecen los textos innecesarios.
9. Confirmar que Título, Descripción y Zona/cobertura se ven claros.
10. Confirmar que mensajes siguen funcionando.
