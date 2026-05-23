# Conecta Servicios v6.3.35 - Home estético, acciones horizontales y sonido

## Qué corrige

- Los botones quedan acomodados horizontalmente:
  - Corazón
  - Mensaje
  - Compartir
- La información de la publicación baja a la base del video/foto.
- El contenido visual queda más protagonista.
- Corrige que al guardar el nombre de usuario también se actualicen las publicaciones propias.
- Cambia las flechas de carrusel por puntitos.
- Los puntitos indican que hay más fotos y permiten cambiar de foto.
- Refuerza que el botón de sonido 🔇/🔊 aparezca sobre videos.
- El sonido se activa por toque del usuario y usa el volumen del dispositivo.

## Nota sobre sonido automático

Los navegadores móviles bloquean el autoplay con sonido. Por eso el video inicia en silencio y el usuario activa sonido tocando 🔇/🔊. Después de ese toque, el volumen depende del dispositivo.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-35-home-estetico-acciones-sonido.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL.

## Commit sugerido

Ajusta acciones horizontales nombre y sonido

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6335

## Checklist

1. Confirmar que se vea v6.3.35.
2. Ver los tres botones horizontales: corazón, mensaje, compartir.
3. Confirmar que Mensaje abre chat.
4. Confirmar que Compartir funciona.
5. Confirmar que la información baja a la base del video/foto.
6. En publicación con varias fotos, ver puntitos y tocarlos.
7. En video, ver botón 🔇/🔊.
8. Activar sonido y confirmar que responde al volumen del dispositivo.
9. Cambiar nombre en Perfil y confirmar que aparece en tus publicaciones.
