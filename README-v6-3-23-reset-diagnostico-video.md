# Conecta Servicios v6.3.23 - Reset y diagnóstico de video

## Objetivo

Esta versión no intenta esconder el problema. Sirve para confirmar exactamente:

1. Qué versión está cargando cada celular.
2. Si el service worker/caché está mezclando versiones.
3. Qué error real devuelve la subida del video.
4. Si el video queda en proceso por falta de URL o por falla de subida.
5. Permitir reset técnico del dispositivo sin borrar datos públicos de Supabase.

## Qué cambia

- Muestra una etiqueta visible `v6.3.23` en el encabezado.
- Agrega diagnóstico técnico en Perfil.
- Agrega botón `Reset app / caché`.
- Agrega botón `Copiar diagnóstico`.
- Cuando falla la subida del video, ahora guarda el error real en vez de quedarse indefinidamente en “Video en proceso”.
- Si el video falla, muestra “Video no subió” y botón Reintentar.
- Mantiene subida resumible TUS para videos.
- Mantiene visor interno de video cuando sí existe `mediaUrl`.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-23-reset-diagnostico-video.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## Commit sugerido

Agrega reset y diagnóstico real de video

## Después de Vercel Ready

Abre en ambos celulares:

https://conecta-servicios.vercel.app/?v=6323

## Prueba obligatoria

1. Abre la app y confirma que se vea `v6.3.23`.
2. Entra a Perfil.
3. Toca `Reset app / caché`.
4. Vuelve a abrir:

https://conecta-servicios.vercel.app/?v=6323

5. Publica un video corto de 5 segundos.
6. Mantén la app abierta.
7. Si falla, entra a Perfil y toca `Copiar diagnóstico`.
8. Pega aquí el diagnóstico copiado.

## Liga de reset directo

Si un celular sigue comportándose raro, abre:

https://conecta-servicios.vercel.app/?v=6323&hardreset=1

## SQL

No requiere SQL nuevo si ya ejecutaste el de 1 GB.
