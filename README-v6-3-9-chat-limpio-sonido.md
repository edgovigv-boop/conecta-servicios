# Conecta Servicios v6.3.9 - Chat limpio con sonido y vibración

## Qué corrige

Esta versión limpia la pantalla de mensajes y agrega aviso corto para mensajes nuevos.

## Cambios

- Mensajes muestra menos texto explicativo.
- La lista de conversaciones queda más parecida a WhatsApp: nombre, último mensaje y hora.
- El chat elimina información repetida dentro de cada burbuja.
- Cada mensaje entrante nuevo intenta activar vibración corta.
- Cada mensaje entrante nuevo intenta reproducir un sonido corto.
- El sonido se activa después del primer toque del usuario en la app, por reglas normales del navegador móvil.
- La app sigue actualizando mensajes cada 3 segundos aproximadamente.
- No refresca el chat mientras estás escribiendo para no borrar el texto.
- Se actualiza versión y caché para forzar carga nueva.

## Archivos para subir

- index.html
- app.js
- styles.css
- manifest.json
- service-worker.js
- README-v6-3-9-chat-limpio-sonido.md

## No necesitas subir otra vez

- api/messages.js
- supabase-connecta-messages.sql

si ya quedaron de la versión anterior.

## Commit sugerido

```text
Limpia chat y agrega sonido y vibración
```

## Prueba

1. Sube los archivos.
2. Espera Vercel Ready.
3. Abre la app con:

```text
https://conecta-servicios.vercel.app/?v=639
```

4. Toca cualquier parte de la app una vez para habilitar sonido.
5. Desde otro celular envía un mensaje.
6. El receptor debe sentir vibración y escuchar un tono corto si el navegador lo permite.
