# Conecta Servicios v6.3.8 - Chat en tiempo casi real y limpieza de caché

## Qué corrige

Esta versión corrige dos cosas detectadas en las pruebas:

1. En algunos celulares seguía apareciendo el cuadro viejo del navegador para escribir mensajes. Eso indica app.js viejo en caché/service worker.
2. Los mensajes no llegaban solos; había que actualizar la pantalla.

## Cambios

- Se sube versión a `v6.3.8-chat-tiempo-real-cache`.
- `index.html` apunta a `app.js?v=6.3.8-chat-tiempo-real-cache`.
- `service-worker.js` cambia de caché y usa network-first para HTML, JS y CSS.
- `app.js` borra cachés viejos de Conecta al iniciar una vez.
- En `/mensajes`, la app consulta mensajes cada 3.5 segundos.
- En `/chat`, la conversación se actualiza cada 3.5 segundos.
- Si el usuario está escribiendo en el chat, no se refresca la conversación para no borrar lo escrito.

## Archivos para subir

Sube/reemplaza:

- index.html
- app.js
- manifest.json
- service-worker.js
- README-v6-3-8-chat-tiempo-real-cache.md

No es necesario volver a subir SQL si ya ejecutaste `connecta_messages`.

## No tocar

- api/messages.js
- api/publications.js
- assets
- styles.css, salvo que quieras volver a subirlo también; no cambió en esta corrección.

## Commit sugerido

Corrige chat en tiempo casi real y limpia caché móvil

## Prueba

1. Espera Vercel Ready.
2. En cada celular abre: `https://conecta-servicios.vercel.app/?v=638`
3. Celular B toca el sobre de una publicación.
4. Debe abrir una pantalla de chat, no un cuadro del navegador.
5. Celular B envía mensaje.
6. Celular A entra a Mensajes y espera 3 a 4 segundos.
7. El mensaje debe aparecer sin actualizar manualmente.
