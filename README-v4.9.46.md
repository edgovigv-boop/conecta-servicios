# Conecta Servicios v4.9.46 — Chatbot Conecta tipo WhatsApp

## Objetivo

Implementar una lógica clara de contacto por publicación con un solo canal principal:

- Chatbot Conecta
- WhatsApp

Nunca se muestran ambos al mismo tiempo.

## Cambios principales

- Durante la publicación se pregunta: “¿Cómo quieres recibir respuestas?”
- Chatbot Conecta queda como opción recomendada.
- WhatsApp queda como opción rápida y opcional.
- Si el anunciante elige WhatsApp, la publicación abre WhatsApp y no muestra Chatbot Conecta.
- Si el anunciante elige Chatbot Conecta, el botón “Mensaje” abre una conversación tipo WhatsApp dentro de la app.
- El Chatbot Conecta usa burbujas, preguntas una por una, botones de respuesta rápida, resumen final y confirmación.
- Se agregan preguntas sugeridas para Solicitante, Agente, Negocio de comida/rosticería y servicio profesional/consulta.
- Se mantiene una publicación gratis por 30 días.
- Se mantiene membresía anual de $98 MXN para publicaciones ilimitadas.
- Admin sigue sin restricciones.
- No se agregan barras flotantes nuevas.

## Archivos modificados

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json

## SQL

No requiere SQL nuevo para probar esta versión piloto.

La configuración del Chatbot Conecta, las respuestas del usuario y el canal elegido se prueban con localStorage.

## Commit sugerido

Implementar Chatbot Conecta tipo WhatsApp con canal único por publicación
