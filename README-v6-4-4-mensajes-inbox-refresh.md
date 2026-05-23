# Conecta Servicios v6.4.4 - Mensajes inbox refresh

## Qué corrige

La base de datos ya guardaba los mensajes con el `receiver_id` correcto, pero la pantalla de Mensajes podía no refrescar o quedarse con un estado local anterior.

Esta versión:

- Fuerza recarga de mensajes al entrar a `Mensajes`.
- Agrega botón `Actualizar mensajes`.
- Guarda en estado el `userId` usado para cargar mensajes.
- Si cambia el `userId`, vuelve a cargar mensajes.
- Muestra cuántos mensajes se cargaron y la hora de la última carga.
- Refuerza el render de la pantalla de mensajes cuando llegan mensajes nuevos.
- Agrega información de mensajes al diagnóstico técnico.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-4-mensajes-inbox-refresh.md`

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

Corrige recarga de inbox de mensajes

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=644

## Checklist

1. Confirmar que aparece `v6.4.4`.
2. En celular dueño, abrir Mensajes.
3. Tocar `Actualizar mensajes`.
4. Confirmar que aparecen conversaciones.
5. Desde otro celular, mandar mensaje nuevo.
6. Volver a Mensajes y tocar `Actualizar mensajes`.
7. Confirmar que aparece el nuevo mensaje.
8. Confirmar que el diagnóstico muestra `messages.count`.
