# Conecta Servicios v4.9.38 — Asistente de negocio configurable

Entrega preparada sin despliegue automático.

## Objetivo
Convertir el antiguo concepto de “Chat negocio” en una herramienta de mayor valor para la membresía: un asistente interno configurable por negocio, sin depender de WhatsApp Business ni proveedores externos.

## Qué incluye

- Asistente de negocio configurable.
- Flujos internos por publicación:
  - Pedidos con menú.
  - Citas.
  - Mensaje filtrado al negocio.
- Ejemplo de Rosticería:
  - Pollo asado con ensalada, salsas y tortillas: $235 MXN.
  - Quesadillas: $50 MXN.
  - Refrescos: $35 MXN.
  - Papas fritas: $40 MXN.
- Carrito con total automático.
- Datos de cliente.
- Pickup o entrega.
- Pago pendiente / acordar con negocio.
- Panel del negocio para pedidos, citas, mensajes y estados.
- Admin libre para probar sin membresía.
- Usuario sin membresía puede guardar borrador; para publicar se invita a activar membresía.
- Modo piloto con localStorage.

## Archivos modificados

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json

## Archivo de patch

- PATCH-INDEX-v4.9.38.txt

## SQL

No requiere SQL nuevo para probar el piloto.

Se incluye `supabase-business-messaging.sql` como base opcional para producción real multiusuario en Supabase.

## Versión

`v4.9.38-asistente-negocio-configurable`

## Commit sugerido

`Implementar asistente de negocio configurable v4.9.38`
