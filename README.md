# Conecta Servicios — v4.9.43-publicar-unificado-real

## Objetivo

Migrar definitivamente el botón **+ Publicar** y las plantillas al nuevo flujo unificado:

**Publicación básica gratis mensual + Asistente de publicación opcional.**

Esta versión corrige el problema donde el botón + todavía abría el flujo anterior **“Crear oportunidad”**, no mostraba el asistente y podía fallar con el mensaje genérico “No se pudo guardar”.

## Cambios principales

- El botón + abre el flujo de **Crear publicación**.
- WhatsApp queda como contacto opcional.
- La publicación básica se permite gratis una vez al mes.
- Se muestra la pregunta: **“¿Quieres configurar un asistente para esta publicación?”**
- Opciones de asistente:
  - No, solo publicar gratis
  - Mensaje filtrado
  - Pedido con menú
  - Cita
  - Cotización
  - Solicitud de servicio
  - Viaje compartido
  - Envío o mensajería
  - Ofrecer ayuda / responder necesidad
- Usuario sin membresía puede guardar asistente como borrador/vista previa.
- Usuario con membresía puede activar asistente.
- Admin puede publicar y activar sin restricciones.
- Si Supabase falla, se guarda borrador local temporal con mensaje claro.

## Archivos incluidos

- app.js
- styles.css
- service-worker.js
- manifest.json
- PATCH-INDEX-v4.9.43.txt
- CHECKLIST-v4.9.43.txt
- INSTRUCCIONES-CODEX-v4.9.43.txt

## SQL

No requiere SQL nuevo para probar esta versión piloto.

El guardado remoto sigue usando la tabla actual de publicaciones. El respaldo local usa localStorage cuando Supabase falla.

## Commit sugerido

Migrar definitivamente Publicar al flujo freemium con asistente
