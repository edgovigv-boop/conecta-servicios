# Conecta Servicios v6.4.27 - Layout zona y puntitos

## Objetivo

Aplicar el cambio de layout indicado en la imagen enviada:

- mover la zona/cobertura a la parte superior de la publicación
- reubicar los puntitos del carrusel hacia el lateral derecho
- liberar la zona de información inferior para que el usuario, título y descripción respiren mejor

## Qué cambia

- `📍 Atiende en:` ya no aparece debajo del usuario.
- Ahora aparece arriba, sobre la imagen/video, a la derecha de la categoría.
- Los puntitos del carrusel ya no están en el bloque inferior de información.
- Ahora aparecen como indicador lateral derecho sobre la multimedia.
- Los puntitos se ocultan durante `Encuadre` para no estorbar.
- La zona también se oculta durante `Encuadre` para que el recorte se vea limpio.
- Se conserva el encuadre independiente por foto de la v6.4.26.

## Qué no cambia

- No toca `api/messages.js`.
- No cambia mensajes.
- No requiere SQL.
- No cambia Storage.
- No mezcla foto + video todavía.
- Conserva `Encuadre`, `Editar aquí`, `Multimedia`, perfil persistente y zona libre.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-27-layout-zona-puntitos.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Reubica zona y puntitos en layout de publicacion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6427

## Checklist

1. Confirmar que aparece `v6.4.27`.
2. Abrir publicación con varias fotos.
3. Confirmar que `Atiende en` aparece arriba, junto a la categoría.
4. Confirmar que ya no aparece debajo del usuario.
5. Confirmar que los puntitos aparecen al lateral derecho.
6. Confirmar que los puntitos no estorban en `Encuadre`.
7. Confirmar que el encuadre por foto sigue independiente.
8. Confirmar que mensajes siguen funcionando.
