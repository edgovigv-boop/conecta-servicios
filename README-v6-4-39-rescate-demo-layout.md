# Conecta Servicios v6.4.39 - Rescate demo layout

## Objetivo

Resolver de emergencia el layout roto mostrado en la captura:

- herramientas fuera de lugar
- publicación demasiado larga
- multimedia con franjas negras
- barra inferior desacomodada

## Qué hace

- Mantiene la base estable v6.4.38.
- Agrega una sola capa CSS final de rescate para la demo.
- La multimedia vuelve a ocupar todo el ancho y alto de la publicación.
- La información queda superpuesta sobre foto/video.
- Las herramientas quedan dentro del bloque inferior, no arriba.
- La barra inferior se fuerza a ancho completo.
- Oculta el botón duplicado de audio en la fila inferior para evitar saturación.
- No toca lógica de mensajes, perfil, identidad, Supabase ni Storage.

## Qué conserva

- Mensajes funcionando.
- Perfil.
- Editar aquí.
- Guardar y volver.
- Encuadre.
- Multimedia.
- Menú de herramientas.
- Publicaciones reales.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-39-rescate-demo-layout.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Rescata layout de demo movil

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6439

## Checklist urgente

1. Confirmar que aparece `v6.4.39`.
2. Confirmar que la foto/video llena el ancho.
3. Confirmar que las herramientas ya no aparecen arriba.
4. Confirmar que la barra inferior aparece completa.
5. Confirmar que mensajes siguen funcionando.
