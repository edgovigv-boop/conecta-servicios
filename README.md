# Conecta Servicios v4.9.39-asistente-publicaciones

Esta versión corrige el alcance del asistente configurable: no es sólo para negocios. Ahora el asistente aplica a **todas las publicaciones**.

## Flujos disponibles

1. Pedido con menú
2. Cita
3. Contacto directo
4. Cotización
5. Solicitud de servicio
6. Solicitud de viaje compartido
7. Solicitud de envío o mensajería
8. Ofrecer ayuda / responder necesidad

## Dónde aparece

- En **Mis publicaciones**, cada publicación propia muestra **Configurar asistente**.
- En la vista pública, una publicación con asistente activo muestra el botón que corresponda:
  - Hacer pedido
  - Agendar cita
  - Solicitar cotización
  - Solicitar lugar
  - Cotizar envío
  - Ofrecer ayuda
  - Mensaje al publicante
- En **Mis publicaciones** se agrega el panel **Solicitudes recibidas por mis publicaciones**.

## Membresías

- Admin puede probar sin membresía.
- Usuario sin membresía puede guardar borrador.
- Usuario con membresía activa puede activar asistentes.

## Datos

Funciona en modo piloto con localStorage.

**No requiere SQL nuevo para probar.**

Se incluye `supabase-publication-assistant.sql` como base opcional para producción multiusuario.

## Archivos modificados

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json
- PATCH-INDEX-v4.9.39.txt
- supabase-publication-assistant.sql

## Commit sugerido

Extender asistente configurable a todas las publicaciones
