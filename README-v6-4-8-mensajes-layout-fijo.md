# Conecta Servicios v6.4.8 - Mensajes layout fijo

## Objetivo

Corregir el movimiento lateral de la pantalla de Mensajes y Chat.

## Qué corrige

- Bloquea el scroll horizontal en Mensajes y Chat.
- Evita que tarjetas largas empujen la pantalla hacia los lados.
- Ajusta conversaciones para respetar el ancho del celular.
- Recorta títulos largos con puntos suspensivos.
- Permite que textos largos de mensajes se partan correctamente.
- Estabiliza barra superior del chat.
- Estabiliza caja de texto y botón Enviar.
- No toca Supabase.
- No toca `api/messages.js`.
- No toca lógica de envío ni recepción.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-8-mensajes-layout-fijo.md`

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

Fija layout horizontal de mensajes

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=648

## Checklist

1. Confirmar que aparece `v6.4.8`.
2. Abrir Mensajes.
3. Mover el dedo de izquierda a derecha.
4. Confirmar que la pantalla ya no se mueve lateralmente.
5. Abrir una conversación.
6. Confirmar que el chat no se mueve lateralmente.
7. Escribir y enviar un mensaje.
8. Confirmar que el Inbox y el chat siguen funcionando.
