# Conecta Servicios v4.9.44 — Chatbot Conecta + publicación social

Esta versión simplifica el modelo de publicación para que sea más intuitivo y cercano a una red social local.

## Modelo principal

- 1 publicación gratis por 30 días con Chatbot Conecta incluido.
- Membresía anual de $98 MXN para publicaciones ilimitadas y Chatbot Conecta en todos los rubros.
- El usuario publica como: Solicitante, Agente o Negocio.
- El botón de mensajes de cada publicación tiene un solo canal: Chatbot Conecta o WhatsApp.
- Si el anunciante elige WhatsApp, sustituye al Chatbot Conecta; no se muestran ambos.

## Apartados estrella

- Embajadores
- Agentes en crecimiento
- Mandados verificados
- Aprendizaje

## Publicación tipo red social

Las publicaciones deben conservar una experiencia simple: foto, título, descripción, zona, reacciones, compartir y publicar algo parecido.

## Persistencia

No requiere SQL nuevo para piloto. Usa localStorage para prueba gratis de 30 días y respuestas de Chatbot Conecta. Para producción real multiusuario conviene migrar este control a Supabase.
