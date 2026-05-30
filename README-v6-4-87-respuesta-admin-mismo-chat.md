# Conecta Servicios v6.4.87 — Respuesta admin en el mismo chat

## Qué corrige

Cuando un usuario escribía desde un celular de prueba a una publicación de Edgar y el admin respondía, la respuesta podía aparecer en una tarjeta nueva.

## Causa

El admin respondía usando el userId local del celular admin. Para el usuario normal, eso parecía otra persona distinta al dueño real de la publicación.

## Solución

Cuando admin responde desde una conversación global:

- detecta la publicación del chat
- usa ownerId/ownerName de esa publicación como remitente
- responde al usuario real que inició el hilo
- mantiene el mismo postId y el mismo par de conversación

Así el usuario debe ver la respuesta dentro del mismo chat.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-87-respuesta-admin-mismo-chat.md

## Commit sugerido

Corrige respuesta admin en mismo chat

## Prueba recomendada

1. Celular de prueba:
   - abrir publicación de Edgar
   - enviar mensaje nuevo

2. Celular admin:
   - Mensajes
   - Actualizar bandeja admin
   - abrir esa conversación
   - responder

3. Celular de prueba:
   - revisar que la respuesta aparezca en la misma conversación, no en una tarjeta nueva

Nota: mensajes antiguos enviados antes de este parche pueden seguir apareciendo como tarjeta separada. La prueba válida es con un mensaje nuevo después de subir v6.4.87.
