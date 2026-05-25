# Conecta Servicios v6.4.23 - Carrusel, zona y encuadre

## Objetivo

Corregir tres detalles antes de avanzar:

1. La zona/cobertura se veía morada y se perdía sobre la foto.
2. El encuadre directo debía quedarse solo con:
   - un dedo para mover
   - pellizco para abrir/reducir
3. El carrusel de fotos seguía sin avanzar con el dedo.

## Qué corrige

- Cambia la zona/cobertura a texto blanco sobre fondo oscuro translúcido.
- Elimina la indicación de doble toque en encuadre.
- Desactiva la acción de doble toque para no interferir.
- Refuerza el carrusel con swipe real sobre el área completa de la foto.
- El dedo hacia la izquierda avanza a la siguiente foto.
- El dedo hacia la derecha regresa a la foto anterior.
- Los puntitos siguen funcionando y quedan más pequeños.
- Mantiene la categoría completa.
- No toca mensajes.
- No requiere SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-23-carrusel-zona-encuadre.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige carrusel zona y encuadre directo

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6423

## Checklist

1. Confirmar que aparece `v6.4.23`.
2. Abrir publicación con varias fotos.
3. Deslizar sobre la foto hacia la izquierda.
4. Confirmar que pasa a la siguiente foto.
5. Deslizar hacia la derecha.
6. Confirmar que regresa.
7. Confirmar que los puntitos cambian.
8. Confirmar que la zona/cobertura se lee en blanco.
9. Tocar `Encuadrar aquí`.
10. Confirmar que solo se usa un dedo para mover y pellizco para tamaño.
11. Confirmar que mensajes siguen funcionando.
