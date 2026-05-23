# Conecta Servicios v6.3.25 - Video sin re-render durante reproducción

## Diagnóstico confirmado

En v6.3.24 el video ya se ve dentro de la app en ambos celulares, pero se reproduce muy poco y luego vuelve a quedarse cargando.

Eso indica que el archivo sí existe y el reproductor sí inicia, pero el feed se está actualizando/re-renderizando mientras el video reproduce. Al reemplazar el DOM, el video pierde buffer y vuelve a cargar.

## Qué corrige

Esta versión evita re-render mientras un video está reproduciéndose:

- Detecta `play`, `pause`, `ended`, `waiting` y `stalled`.
- Si hay un video reproduciéndose, el polling de publicaciones/mensajes no vuelve a pintar el feed.
- Mantiene sincronización en segundo plano, pero sin reemplazar el `<video>`.
- Usa `preload="auto"` para videos cortos dentro de la app.
- Si el video se queda en `stalled`, lo registra en diagnóstico, pero no destruye el reproductor.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-25-video-sin-rerender.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## Commit sugerido

Evita reiniciar video durante actualización del feed

## Después de Vercel Ready

Abre:

https://conecta-servicios.vercel.app/?v=6325

## Prueba

1. Confirma que se vea `v6.3.25`.
2. Toca play en el video de 5 segundos.
3. No toques nada más.
4. Debe reproducirse completo sin que el feed lo reinicie.
5. Si se detiene, entra a Perfil > Copiar diagnóstico.
