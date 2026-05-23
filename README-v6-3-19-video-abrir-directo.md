# Conecta Servicios v6.3.19 - Video abrir directo

## Diagnóstico

El video sí se reproduce bien cuando se usa **Abrir video**. Eso confirma que:

- el archivo sí está en Supabase Storage,
- la URL pública funciona,
- el problema es reproducirlo incrustado dentro del feed.

## Decisión para el MVP

Para que no se quede cargando dentro del muro, el botón principal de video ahora abre el video directo en el reproductor del navegador.

Esto es más confiable para inversionistas y usuarios en celulares modestos.

## Qué corrige

- El botón grande de play ya no intenta reproducir dentro del feed.
- El botón grande abre el video directamente.
- El botón "Abrir video" se mantiene.
- Limpia copias locales viejas con video pendiente.
- Oculta la banda de "video pendiente" cuando ya existe URL real.

## Archivos para GitHub

Sube/reemplaza:

- index.html
- video-open-guard.js
- manifest.json
- service-worker.js
- README-v6-3-19-video-abrir-directo.md

## No tocar

- app.js
- styles.css
- api
- assets
- SQL

## Commit sugerido

Abre videos directamente desde el feed

## Después de Vercel Ready

Abrir en ambos celulares:

https://conecta-servicios.vercel.app/?v=6319

## Prueba

1. Entra al muro.
2. Toca el botón grande de play en una publicación con video.
3. Debe abrirse el video directo.
4. Regresa a la app con el botón atrás del navegador.
5. En el otro celular debe comportarse igual.

## Nota futura

Más adelante, para reproducir fluido dentro del feed como TikTok/Instagram, se necesita comprimir/transcodificar videos a MP4/H.264 optimizado y posiblemente generar miniaturas.
