# Conecta Servicios v6.4.20 - Ajuste puntitos multimedia

## Objetivo

Pulir la experiencia de multimedia directa y carrusel de fotos.

## Qué corrige

- Quita el mensaje dentro del panel Multimedia:
  - `Por ahora usa varias fotos...`
- Reubica los puntitos del carrusel:
  - ahora aparecen centrados arriba del usuario/anunciante
  - quedan dentro de la zona de información de la publicación
  - son más fáciles de entender
- Mejora la actualización visual de los puntitos al deslizar fotos.
- Mantiene el botón `Multimedia`.
- Mantiene varias fotos o un solo video, sin mezclar foto + video todavía.
- No toca mensajes.
- No toca Supabase.
- No requiere SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-20-ajuste-puntitos-multimedia.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Ajusta puntitos de carrusel y limpia multimedia directa

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6420

## Checklist

1. Confirmar que aparece `v6.4.20`.
2. Abrir una publicación propia con varias fotos.
3. Confirmar que los puntitos aparecen arriba del usuario y centrados.
4. Deslizar fotos y confirmar que cambia el puntito activo.
5. Tocar los puntitos y confirmar que cambia la foto.
6. Abrir `Multimedia` y confirmar que ya no aparece el mensaje sobrante.
7. Confirmar que mensajes siguen funcionando.
8. Confirmar que perfil no vuelve a Usuario local.
