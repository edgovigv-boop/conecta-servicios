# Conecta Servicios v6.3.21 - Videos de 10 minutos con límite de 1 GB

## Corrección urgente

El límite anterior era de 300 MB. Un video de 3 minutos puede superar 300 MB si fue grabado en alta calidad. Por eso la app lo bloqueaba aunque durara menos de 10 minutos.

Esta versión cambia el criterio práctico:

- Duración máxima: 10 minutos.
- Peso máximo en app: 1 GB.
- Peso máximo en Supabase Storage: 1 GB, con SQL incluido.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-21-video-10min-1gb.md

## SQL obligatorio en Supabase

Ejecuta este archivo en Supabase SQL Editor:

- supabase-storage-video-10min-1gb-v6-3-21.sql

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets

## Commit sugerido

Permite videos de 10 minutos hasta 1 GB

## Después de Vercel Ready

Abre:

https://conecta-servicios.vercel.app/?v=6321

## Prueba recomendada

1. Primero ejecuta el SQL en Supabase.
2. Después sube los archivos a GitHub.
3. Espera Vercel Ready.
4. Abre la app con `?v=6321`.
5. Prueba un video de 3 minutos.
6. Prueba un video más largo.
7. Verifica que ya no salga el bloqueo de 300 MB.

## Nota

Para que videos de 10 minutos se vean fluidos en celulares, lo ideal es grabarlos en calidad media o HD normal, no 4K. La app ahora permite hasta 1 GB, pero videos muy pesados pueden tardar bastante en subir según la conexión.
