# Conecta Servicios v6.3.7 - Chat público básico

## Qué agrega

Esta versión convierte el botón de mensaje en una conversación real básica, guardada en Supabase y visible entre celulares.

Corrige el problema detectado:

- Antes, el mensaje solo se guardaba en el celular que lo escribía.
- Ahora, el mensaje se guarda en `/api/messages` y puede verlo tanto quien escribe como el dueño de la publicación.
- Se elimina el cuadro feo del navegador (`prompt`) y se abre una pantalla de conversación tipo WhatsApp básico.

## Archivos a subir

Subir/reemplazar en GitHub:

```text
index.html
styles.css
app.js
manifest.json
service-worker.js
api/messages.js
supabase-connecta-messages.sql
README-v6-3-7-chat-publico-basico.md
```

No borres ni toques:

```text
api/publications.js
api/public-config.js
assets
```

## Paso obligatorio en Supabase

Antes de probar mensajes, abre Supabase → SQL Editor y ejecuta el archivo:

```text
supabase-connecta-messages.sql
```

Eso crea la tabla:

```text
connecta_messages
```

## Prueba

1. Celular A publica una foto ligera.
2. Celular B ve la publicación.
3. Celular B toca el sobre ✉️.
4. Se abre una conversación.
5. Celular B escribe y envía mensaje.
6. Celular A abre Mensajes.
7. Debe ver la conversación recibida.
8. Celular A responde.
9. Celular B abre Mensajes o la conversación y debe ver la respuesta.

## Diagnóstico

Después de subir y redeploy, puedes abrir:

```text
https://conecta-servicios.vercel.app/api/messages?debug=1
```

Debe decir:

```json
{"ok":true}
```

Si al enviar mensaje falla, probablemente falta ejecutar el SQL de `connecta_messages`.

## Commit sugerido

```text
Agrega chat público básico entre publicaciones
```

## Nota sobre Seguir

El botón Seguir sigue siendo local en esta versión. La prioridad fue resolver mensajes reales porque eso es más importante para comunicación entre usuarios.
