# Conecta Servicios v6.3.22 - Video con subida resumible TUS

## Qué pasaba

La app ya permitía 10 minutos y 1 GB, pero el video se quedaba en:

> Video en proceso

Eso indica que la publicación se guardó, pero el archivo de video no terminó de subirse a Supabase Storage.

El método anterior hacía una sola subida directa. Para videos grandes eso es inestable.

## Qué cambia

Esta versión usa subida resumible TUS para videos y archivos de más de 6 MB:

- Divide el video en partes de 6 MB.
- Reintenta partes si falla la conexión.
- Muestra progreso por porcentaje.
- Mantiene la publicación visible mientras sube.
- Al terminar guarda la `mediaUrl` y quita el estado pendiente.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-22-video-tus-resumable.md

## SQL

Normalmente no requiere SQL nuevo si ya ejecutaste el v6.3.21.

Si tienes duda, puedes ejecutar:

- supabase-storage-video-1gb-v6-3-22.sql

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets

## Commit sugerido

Corrige subida resumible de videos

## Después de Vercel Ready

Abre:

https://conecta-servicios.vercel.app/?v=6322

## Prueba

1. Publica un video corto primero.
2. Mantén la app abierta hasta ver que termina la subida.
3. Debe aparecer avance: “Subiendo video...”.
4. Luego debe dejar de decir “Video en proceso”.
5. Si una publicación anterior quedó pendiente, en el celular que la creó toca Reintentar.
6. Para videos de 3 a 10 minutos, no cierres la app mientras sube.
