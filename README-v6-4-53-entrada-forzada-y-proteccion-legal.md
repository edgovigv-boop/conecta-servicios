# Conecta Servicios v6.4.53 - Entrada forzada y protección legal

## Objetivo

Aprovechar un solo despliegue para:

1. Reforzar la entrada al feed público en celulares de prueba.
2. Evitar que el usuario quede atrapado en `Cargando publicaciones`.
3. Agregar archivos base de protección legal/copyright al repositorio.

## Qué corrige

- Agrega recuperación forzada del muro público desde `/api/publications?force=1`.
- Si el feed queda vacío, muestra botón `Actualizar muro`.
- Limpia filtros visuales vacíos y vuelve a `Para ti`.
- Mantiene la corrección de encuadre remoto.
- Agrega archivos:
  - `LICENSE-PROPIETARIA.md`
  - `NOTICE-COPYRIGHT.md`

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-53-entrada-forzada-y-proteccion-legal.md`
- `LICENSE-PROPIETARIA.md`
- `NOTICE-COPYRIGHT.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Refuerza entrada publica y proteccion legal

## Después de Vercel Ready

Abrir en el celular de prueba:

https://conecta-servicios.vercel.app/?v=6453

Para admin:

https://conecta-servicios.vercel.app/?v=6453&admin=media

## Checklist

1. Abrir `?v=6453` en el celular que se queda cargando.
2. Esperar hasta 12 segundos.
3. Si aparece `Actualizar muro`, tocarlo.
4. Confirmar que entra al feed.
5. Confirmar que el encuadre remoto sigue funcionando.
6. Confirmar mensajes y perfil.
7. Verificar que los archivos legales quedaron en GitHub.
