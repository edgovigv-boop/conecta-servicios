# Conecta Servicios v6.4.25 - Carrusel y encuadre limpio

## Objetivo

Corregir dos detalles de la v6.4.24:

1. Los puntitos estorbaban al desplazar/encuadrar.
2. El encuadre por foto se encimaba o se perdía con otras fotos del carrusel.

## Qué corrige

- Reubica los puntitos más abajo y a la derecha, fuera de la zona principal del gesto.
- Oculta los puntitos mientras está activo `Encuadre`, para que no estorben.
- En modo `Encuadre`, si la publicación tiene varias fotos, muestra solo la foto actual.
- Evita que una foto se encime encima de otra durante el encuadre.
- Conserva la foto actual del carrusel al tocar `Encuadre`.
- El gesto del carrusel queda menos exigente: requiere un movimiento horizontal más corto.
- Mantiene `Encuadre`, `Editar aquí`, `Multimedia`, perfil persistente y mensajes.

## Qué no cambia

- No toca `api/messages.js`.
- No cambia mensajes.
- No requiere SQL.
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
- `README-v6-4-25-carrusel-encuadre-limpio.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Limpia encuadre por foto y reubica puntitos

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6425

## Checklist

1. Confirmar que aparece `v6.4.25`.
2. Abrir publicación con varias fotos.
3. Deslizar con gesto corto.
4. Confirmar que cambia de foto.
5. Dejar una foto que no sea la primera.
6. Tocar `Encuadre`.
7. Confirmar que no aparecen otras fotos encimadas.
8. Confirmar que los puntitos no estorban en encuadre.
9. Guardar.
10. Confirmar que mensajes siguen funcionando.
