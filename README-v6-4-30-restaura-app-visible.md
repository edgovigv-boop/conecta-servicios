# Conecta Servicios v6.4.30 - Restaura app visible

## Objetivo

Corrección de emergencia para salir de la pantalla en blanco.

## Qué hace

- Restaura la base estable anterior a la versión que dejó la app en blanco.
- Conserva la funcionalidad que ya estaba estable:
  - Perfil
  - Mensajes
  - Editar aquí
  - Multimedia
  - Encuadre independiente por foto
- Agrega un pequeño seguro para que, si ocurre un error de render, la app muestre una pantalla de recuperación en lugar de quedarse en blanco.

## Importante

Esta versión NO intenta hacer recuperación agresiva de identidad. Primero recupera la app visible. Después revisamos perfil/mensajes con diagnóstico ya dentro de la app.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-30-restaura-app-visible.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura app visible tras pantalla en blanco

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6430

## Checklist urgente

1. Confirmar que la app ya no está en blanco.
2. Confirmar que aparece `v6.4.30`.
3. Revisar Inicio.
4. Revisar Perfil.
5. Revisar Mensajes.
6. No borrar caché ni resetear todavía.
