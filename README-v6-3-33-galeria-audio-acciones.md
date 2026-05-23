# Conecta Servicios v6.3.33 - Galería, audio y acciones visibles

## Qué corrige

- Agrega flecha `>` para avanzar en publicaciones con varias fotos.
- Agrega flecha `<` para regresar.
- Mantiene contador 1/N en galerías.
- Refuerza que los botones de mensaje y compartir estén visibles en cada publicación.
- Los botones ahora muestran icono y texto corto.
- Los videos se reproducen automáticamente en silencio.
- Se agrega botón de sonido 🔇/🔊 para activar audio con el volumen del dispositivo.
- Al tocar el video se abre en grande dentro de la app.
- En el visor grande el video intenta reproducirse con sonido.

## Importante sobre audio automático

Los navegadores móviles normalmente bloquean autoplay con sonido hasta que el usuario toca algo. Por eso el feed inicia en silencio y el usuario puede activar sonido con 🔇/🔊. Una vez activado, el volumen depende del dispositivo.

## SQL opcional de limpieza

Archivo incluido:

- borrar-publicacion-tarja-v6-3-33.sql

No se sube a GitHub. Se ejecuta en Supabase SQL Editor para borrar la publicación de prueba de la tarja.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-33-galeria-audio-acciones.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets

## Commit sugerido

Mejora galería audio y acciones visibles

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6333

## Checklist

1. Confirmar que se vea v6.3.33.
2. Publicación con varias fotos: probar `>` y `<`.
3. Confirmar que mensaje y compartir aparecen.
4. Tocar mensaje y confirmar que abre chat.
5. Tocar compartir y confirmar que comparte/copia.
6. Video: confirmar autoplay en silencio.
7. Tocar 🔇/🔊 y confirmar sonido con volumen del dispositivo.
8. Tocar video y confirmar que abre grande dentro de la app.
9. Ejecutar SQL para borrar publicación de tarja.
