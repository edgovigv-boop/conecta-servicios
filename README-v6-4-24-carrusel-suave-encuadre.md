# Conecta Servicios v6.4.24 - Carrusel suave y encuadre

## Objetivo

Pulir el carrusel y el encuadre directo antes de avanzar.

## Qué corrige

- El carrusel ya no exige pasar el dedo de extremo a extremo.
- Ahora basta un gesto corto horizontal sobre la foto.
- Conserva la foto actual al tocar `Encuadre`.
- El botón cambia de `Encuadrar aquí` a `Encuadre`.
- Al entrar a encuadre en una galería, no regresa automáticamente a la primera foto.
- Guarda el encuadre de la foto visible del carrusel, no necesariamente de la primera.
- Mantiene un dedo para mover y pellizco para ampliar/reducir.
- Mantiene zona/cobertura legible y puntitos pequeños.

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
- `README-v6-4-24-carrusel-suave-encuadre.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Suaviza carrusel y conserva foto al encuadrar

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6424

## Checklist

1. Confirmar que aparece `v6.4.24`.
2. Abrir publicación con varias fotos.
3. Hacer un gesto horizontal corto sobre la foto.
4. Confirmar que cambia de foto.
5. Dejar la segunda foto visible.
6. Tocar `Encuadre`.
7. Confirmar que no vuelve a la primera foto.
8. Mover con un dedo y pellizcar.
9. Guardar.
10. Confirmar que mensajes siguen funcionando.
