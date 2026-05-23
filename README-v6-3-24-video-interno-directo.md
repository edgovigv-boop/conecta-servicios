# Conecta Servicios v6.3.24 - Video interno directo

## Diagnóstico confirmado

El diagnóstico de v6.3.23 mostró:

- Storage está bien.
- `anonUpload.ok = true`.
- `serviceUpload.ok = true`.
- El video de prueba sí subió:
  `upload-success`.
- La publicación sí tiene `mediaUrl`.
- El archivo pesa 4.6 MB, así que no es problema de tamaño.

Por lo tanto, el problema restante ya no era subida ni Supabase. Era el render/reproductor dentro de la app.

## Qué cambia

Esta versión deja de mostrar tarjeta indirecta para videos con `mediaUrl`.

Ahora, cuando la publicación ya tiene video:

- Se muestra un `<video controls playsinline preload="metadata">` directamente dentro de la publicación.
- No se abre fuera de la app.
- Tiene botón `Recargar video`.
- Tiene botón `Ver grande` para visor interno.
- Si el reproductor falla, muestra mensaje de error real y queda registrado en Diagnóstico.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-24-video-interno-directo.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL nuevo.

## Commit sugerido

Corrige reproducción interna de video

## Después de Vercel Ready

Abre:

https://conecta-servicios.vercel.app/?v=6324

## Prueba

1. Confirma que se vea `v6.3.24`.
2. Revisa la publicación del video de pollos.
3. Debe aparecer el video dentro de la tarjeta.
4. Toca play directamente en el video.
5. Si no carga, toca `Recargar video`.
6. Si quieres verlo más grande, toca `Ver grande`.
7. Si falla, entra a Perfil > Copiar diagnóstico.
