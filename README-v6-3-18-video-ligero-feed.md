# Conecta Servicios v6.3.18 - Video ligero en feed

## Problema

El video ya está en Supabase Storage, pero en ambos celulares se queda cargando, reproduce muy poco y vuelve a quedarse pensando.

Esto pasa porque el feed puede tener muchos videos y cada `<video src>` intenta cargar datos al mismo tiempo.

## Qué corrige

Agrega `video-feed-guard.js`:

- Los videos del feed ya no cargan automáticamente.
- Solo se carga el video cuando el usuario toca reproducir.
- Si se reproduce un video, se descarga/pausa cualquier otro video del feed.
- Se oculta el aviso viejo de video pendiente cuando ya hay video real.
- Agrega botón de respaldo: "Abrir video".

## Archivos para GitHub

Sube/reemplaza:

- index.html
- video-feed-guard.js
- manifest.json
- service-worker.js
- README-v6-3-18-video-ligero-feed.md

## No tocar

- app.js
- styles.css
- api
- assets
- SQL

## Commit sugerido

Optimiza reproducción de videos en el feed

## Después de Vercel Ready

Abre en ambos celulares:

https://conecta-servicios.vercel.app/?v=6318

## Prueba

1. Espera que cargue el feed.
2. Toca el botón de reproducir del video.
3. Debe cargar solo ese video.
4. Si sigue cargando lento, toca "Abrir video".

## Nota importante

Esto mejora mucho el MVP, pero para videos de 10 minutos realmente fluidos se necesita una etapa posterior de compresión/transcodificación, por ejemplo convertir a MP4/H.264 optimizado para web.
