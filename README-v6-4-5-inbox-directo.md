# Conecta Servicios v6.4.5 - Inbox directo

## Qué corrige

Supabase ya confirma que los mensajes se guardan con `receiver_id` correcto, pero el Inbox no los mostraba.

Esta versión:

- Cambia `Actualizar mensajes` a una recarga directa forzada.
- Ignora estados intermedios viejos del Inbox.
- Al entrar a Mensajes, fuerza carga desde `/api/messages`.
- Si el agrupado de conversaciones falla, muestra una lista directa de mensajes como respaldo.
- Muestra un mini diagnóstico: userId actual y estado de API.
- Agrega muestra de mensajes al diagnóstico técnico.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-5-inbox-directo.md`

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

Corrige inbox con recarga directa

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=645

## Checklist

1. Confirmar que aparece `v6.4.5`.
2. En celular dueño, abrir Mensajes.
3. Tocar `Actualizar mensajes`.
4. Confirmar que aparece número de mensajes cargados.
5. Confirmar que aparecen conversaciones o lista directa.
6. Mandar mensaje desde otro celular.
7. Tocar `Actualizar mensajes` y confirmar que aparece.
