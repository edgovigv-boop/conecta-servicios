# Conecta Servicios v6.4.6 - Inbox visible

## Qué corrige

En v6.4.5 la API cargaba mensajes, pero la pantalla podía no mostrar las conversaciones.

Esta versión elimina la dependencia del agrupado para la vista principal de Mensajes:

- Si la API carga 11 mensajes, se muestran 11 tarjetas visibles.
- Los mensajes recibidos aparecen primero.
- Cada tarjeta muestra:
  - Recibido / Enviado
  - Remitente
  - Publicación
  - Texto
  - Hora
  - Botón Responder
- Se conserva el botón Actualizar mensajes.
- No cambia Supabase ni api/messages.js.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-6-inbox-visible.md`

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

Muestra mensajes cargados en inbox visible

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=646

## Checklist

1. Confirmar que aparece `v6.4.6`.
2. Abrir Mensajes.
3. Tocar `Actualizar mensajes`.
4. Si dice 11 mensajes cargados, deben aparecer 11 tarjetas visibles.
5. Mandar un mensaje desde otro celular.
6. Tocar `Actualizar mensajes`.
7. Confirmar que aparece arriba como Recibido.
