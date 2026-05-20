# Conecta Servicios v4.9.42 — Publicación unificada freemium

Esta versión migra el modelo anterior de publicar a un flujo único:

- El botón `+ Publicar` crea una publicación básica gratis.
- Las plantillas llevan al mismo flujo de publicación.
- La publicación básica gratuita es mensual en modo piloto local.
- El contacto/WhatsApp es opcional.
- El Asistente de publicación queda como valor avanzado de membresía.
- Admin puede publicar, activar y probar sin restricciones.
- El asistente no debe aparecer flotando ni como sección global repetida.

## Modelo comercial

Gratis:
- 1 publicación básica mensual.
- Título, descripción, categoría, municipio/zona, foto opcional y contacto básico opcional.

Membresía:
- Más publicaciones.
- Asistente por publicación.
- Pedidos, citas, cotizaciones, mensajes filtrados, solicitudes de viaje/envío/ayuda y panel de atención.

## SQL

No requiere SQL nuevo para probar esta versión. El límite mensual se valida en localStorage en modo piloto.

Para producción real multiusuario se recomienda persistir conteos mensuales y asistentes en Supabase.

## Commit sugerido

Migrar publicar a modelo freemium unificado v4.9.42
