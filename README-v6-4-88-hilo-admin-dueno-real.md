# Conecta Servicios v6.4.88 — Hilo admin con dueño real

## Qué corrige

La v6.4.87 todavía podía mandar la respuesta admin como una tarjeta nueva en el celular del usuario.

## Causa

El hilo admin necesitaba guardar dos identidades explícitas:

- adminOwnerId: el dueño real de la publicación
- adminPeerId: el usuario real que escribió

Si el admin respondía solo con el userId local del celular admin, el celular de prueba veía otra conversación.

## Solución

- La bandeja admin calcula el dueño real de la publicación usando state.posts.
- La tarjeta de conversación admin guarda data-admin-owner y data-admin-peer.
- Al responder desde admin, el remitente queda como dueño real de la publicación.
- El receptor queda como el usuario real que inició el mensaje.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-88-hilo-admin-dueno-real.md

## Commit sugerido

Corrige hilo admin con dueno real de publicacion

## Prueba recomendada

Haz la prueba con mensaje nuevo:

1. Celular de prueba:
   - abrir publicación de Edgar
   - enviar mensaje nuevo

2. Celular admin:
   - Mensajes
   - Actualizar bandeja admin
   - abrir esa conversación
   - responder

3. Celular de prueba:
   - abrir Mensajes
   - confirmar que la respuesta cae dentro de la misma conversación

Los mensajes viejos pueden seguir separados porque ya quedaron grabados con la identidad anterior.
