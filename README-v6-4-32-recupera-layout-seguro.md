# Conecta Servicios v6.4.32 - Recupera layout seguro

## Objetivo

Recuperar parte del avance visual sin tocar lo que acabamos de estabilizar.

## Qué recupera

- Reubica visualmente `Atiende en` sobre la multimedia, cerca de la categoría.
- Reubica los puntitos del carrusel al lateral derecho.
- Hace los puntitos pequeños.
- Oculta zona y puntitos durante `Encuadre`.
- Mantiene el layout de información inferior más limpio.

## Qué NO toca

- No toca mensajes.
- No toca `api/messages.js`.
- No toca lógica de identidad.
- No toca perfil.
- No toca Supabase.
- No toca Storage.
- No toca JS del carrusel.
- No toca JS de encuadre.

## Por qué esta versión es más segura

A diferencia de la versión que causó problemas, esta recuperación es visual/CSS. No mueve funciones críticas ni cambia la lógica de mensajes, perfil, publicaciones o carrusel.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-32-recupera-layout-seguro.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Recupera layout visual sin tocar mensajes

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6432

## Checklist

1. Confirmar que aparece `v6.4.32`.
2. Confirmar que Mensajes siguen funcionando.
3. Enviar mensaje desde el celular visitante y recibirlo en el dueño.
4. Confirmar que Perfil sigue visible.
5. Confirmar que `Editar aquí` sigue visible.
6. Confirmar que `Atiende en` se ve arriba sobre la multimedia.
7. Confirmar que los puntitos están al lateral derecho.
8. Probar `Encuadre` por foto.
