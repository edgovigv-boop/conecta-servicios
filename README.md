# Conecta Servicios v4.9.37-chat-interno-negocios

Entrega preparada sin despliegue automático.

## Qué cambia

Esta versión sustituye la lógica anterior de “Chat negocio / Responder filtro” por un sistema interno de negocio por publicación:

- **Pedidos con menú**: productos, cantidades, carrito, total automático, entrega/pickup, pedido y chat de seguimiento.
- **Citas**: fecha, horario, necesidad, solicitud y chat interno.
- **Contacto directo**: mensaje interno al negocio y conversación.
- **Panel del negocio** en “Mis publicaciones”: pedidos, citas, mensajes, estados y respuestas.
- **Admin libre**: el admin puede probar y supervisar sin pagar membresía.
- **Membresías**: usuario sin membresía puede dejar el flujo como borrador; usuario con membresía activa o admin puede activarlo.

## Archivos cambiados

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json
- PATCH-INDEX-v4.9.37.txt
- supabase-business-messaging.sql

## Persistencia

Funciona en modo piloto con `localStorage`.

No requiere SQL nuevo para probar interfaz y flujo localmente o en Vercel. El archivo `supabase-business-messaging.sql` es opcional para producción real multiusuario en Supabase.

## Versión

`v4.9.37-chat-interno-negocios`

## Commit sugerido

`Implementar mensajería interna y pedidos por publicación para negocios`
