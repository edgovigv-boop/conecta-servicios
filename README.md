# Conecta Servicios v4.9.8 — Embajadores Conecta con Mercado Pago piloto

Esta versión agrega un piloto de monetización sin cobros reales para validar activación local, referidos y una futura membresía.

Cambios principales:

- Sección **Embajadores Conecta** actualizada con registro, códigos y pagos piloto.
- Acceso desde **Oportunidades para ti**.
- Acceso desde **Centro de mensajes**.
- Registro piloto de embajadores.
- Registro piloto de referidos: solicitantes, agentes, negocios, servicios o crecimiento.
- Contadores locales de referidos, negocios, agentes y embajadores.
- Modelo visual de membresía futura, sin activar pagos.
- Publicación piloto de Embajadores dentro de Crecimiento.
- No se toca Supabase.
- No hay manejo real de dinero ni comisiones automáticas.
- PWA/cache actualizado a v4.9.8.


## Mercado Pago piloto

Esta versión incluye `/api/create-ambassador-payment.js` para crear una preferencia de Checkout Pro usando la variable de entorno `MP_ACCESS_TOKEN` en Vercel. Si no se configura esa variable, el panel permite pegar un link manual de Mercado Pago para operar con validación manual.

No guardar credenciales privadas dentro de `app.js` ni `index.html`.


## v4.9.12
- Embajadores Conecta ahora usa flujos limpios tipo encuesta para registro, referidos y cobro de membresía.
- Oportunidades para ti reduce textos y mantiene iconos/acciones.
