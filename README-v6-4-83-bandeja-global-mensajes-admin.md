# Conecta Servicios v6.4.83 — Bandeja global de mensajes admin

## Qué agrega

Cuando el modo admin está activo en un celular, la sección Mensajes carga una bandeja global:
- Muestra conversaciones de todas las publicaciones.
- No depende únicamente del userId local.
- Agrupa mensajes por publicación y participantes.
- Mantiene el comportamiento normal para usuarios/testers sin admin.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html

## Commit sugerido

Agrega bandeja global de mensajes admin

## Cómo probar

1. Subir archivos a GitHub.
2. Esperar Vercel Ready.
3. Abrir /activar-admin.html y activar admin.
4. Entrar a Mensajes.
5. Tocar “Actualizar bandeja admin”.

Nota: solución de piloto sin login formal; no reemplaza roles reales de producción.
