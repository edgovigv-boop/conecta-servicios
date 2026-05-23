# Conecta Servicios v6.3.10 - Chat con badge, autoscroll, sonido y vibración larga

## Qué mejora

Esta versión pule la experiencia de mensajes para que se sienta más parecida a una app social o tipo WhatsApp básico.

## Cambios principales

- El sonido de mensaje usa la salida normal del navegador, por lo que depende del volumen físico del dispositivo y del permiso del navegador.
- La vibración de mensaje entrante es más larga.
- El chat baja automáticamente al último mensaje cuando se abre o cuando llegan mensajes nuevos.
- El sobre de Mensajes en la barra inferior muestra una burbuja roja con el número de mensajes no atendidos.
- Cada conversación también muestra el número de mensajes no leídos.
- Cuando abres una conversación, esos mensajes quedan marcados como atendidos y el contador baja.
- Se incrementó la versión/caché para forzar actualización en móviles.

## Archivos para subir

Sube/reemplaza estos archivos:

```text
index.html
app.js
styles.css
manifest.json
service-worker.js
README-v6-3-10-chat-badge-scroll-alertas.md
```

## No necesitas volver a subir

```text
api/messages.js
api/publications.js
supabase-connecta-messages.sql
```

## Commit sugerido

```text
Agrega badge de mensajes y autoscroll del chat
```

## Prueba recomendada

1. Esperar Vercel Ready.
2. Abrir en ambos celulares:

```text
https://conecta-servicios.vercel.app/?v=6310
```

3. Celular B manda mensaje a publicación del celular A.
4. Celular A debe escuchar/vibrar si el navegador lo permite.
5. El sobre de Mensajes debe mostrar badge rojo.
6. Abrir la conversación en celular A.
7. El chat debe abrir al último mensaje y el badge debe bajar.
8. Responder y revisar que el otro celular haga autoscroll al nuevo mensaje.

## Nota sobre sonido

Los navegadores móviles bloquean audio hasta que el usuario toca la pantalla una vez. Por eso, el sonido suele activarse después de la primera interacción con la app. El volumen depende del volumen físico del dispositivo y de las restricciones del navegador.
