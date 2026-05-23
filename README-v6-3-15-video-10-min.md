# Conecta Servicios v6.3.15 - Videos hasta 10 minutos

## Qué cambia

Permite seleccionar videos de hasta:

- 10 minutos de duración
- 300 MB de peso máximo

## Por qué también hay límite de peso

10 minutos no siempre pesan igual. Un video de 10 minutos puede pesar poco si está comprimido o puede pesar muchísimo si está en alta resolución. Para este MVP se recomienda un límite sano de 300 MB para no saturar Supabase ni hacer lenta la publicación.

## Archivos para GitHub

Sube/reemplaza:

- index.html
- video-long-guard.js
- video-playback-guard.js
- manifest.json
- service-worker.js
- README-v6-3-15-video-10-min.md

## No tocar

- app.js
- styles.css
- api
- assets

## SQL

El archivo:

- supabase-storage-video-10-min-v6-3-15.sql

no es para GitHub. Debe ejecutarse en Supabase SQL Editor.

## Commit sugerido

Permite videos de hasta 10 minutos

## Prueba

1. Ejecuta el SQL en Supabase.
2. Sube los archivos a GitHub.
3. Espera Vercel Ready.
4. Abre:

https://conecta-servicios.vercel.app/?v=6315

5. Prueba con un video corto.
6. Luego prueba con un video de más de 40 MB pero menor a 10 minutos y menor a 300 MB.

## Nota importante

Si un video de 10 minutos no se reproduce en otro celular, puede ser por formato. Para móviles conviene MP4/H.264. MOV o formatos raros pueden subir, pero no siempre reproducirse bien en todos los navegadores.
