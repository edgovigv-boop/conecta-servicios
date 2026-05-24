# Conecta Servicios v6.4.7 - Mensajes conversación estable

## Objetivo

Mejorar la forma de ver y abrir mensajes sin tocar Supabase ni la lógica de envío.

La v6.4.6 ya mostraba mensajes como tarjetas visibles. Esta versión agrega una vista principal por conversación, más parecida a WhatsApp, pero conserva las tarjetas individuales como respaldo.

## Qué cambia

- Agrupa mensajes por publicación + usuario.
- Muestra una tarjeta por conversación.
- Muestra:
  - nombre del usuario
  - publicación relacionada
  - último mensaje
  - número de mensajes
  - contador rojo de no leídos si aplica
- Al tocar una conversación abre el chat completo.
- El chat aprovecha los mensajes ya cargados para abrir rápido.
- Agrega botón `Actualizar` dentro del chat.
- Conserva `Ver mensajes individuales` como respaldo.
- Conserva `Actualizar mensajes`.

## No cambia

- No toca `api/messages.js`.
- No toca Supabase.
- No cambia envío de mensajes.
- No cambia publicaciones.
- No cambia perfil.
- No cambia videos ni fotos.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-7-mensajes-conversacion-estable.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## SQL

No requiere SQL.

## Commit sugerido

Mejora conversaciones de mensajes sin tocar backend

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=647

## Checklist

1. Confirmar que aparece `v6.4.7`.
2. Abrir Mensajes.
3. Tocar `Actualizar mensajes`.
4. Confirmar que aparecen conversaciones agrupadas.
5. Abrir una conversación.
6. Confirmar que se ve el chat completo.
7. Tocar `Actualizar` dentro del chat.
8. Mandar mensaje desde el otro celular.
9. Tocar `Actualizar mensajes`.
10. Confirmar que el nuevo mensaje aparece en la conversación.
11. Abrir `Ver mensajes individuales` y confirmar que sigue como respaldo.
