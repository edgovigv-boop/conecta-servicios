# Conecta Servicios v6.3.38 - Altavoz y foto de perfil

## Qué corrige

- Refuerza el botón de altavoz 🔇/🔊 en publicaciones con video.
- El botón de sonido queda más grande, visible y por encima de las capas del video.
- Permite subir foto de perfil desde Perfil.
- La foto de perfil aparece en tus publicaciones como anunciante.
- Al guardar nombre o foto, se actualizan tus publicaciones propias.
- La foto también se conserva para nuevas publicaciones.
- La foto ayuda a posicionar el canal, negocio o perfil del anunciante.

## Nota sobre sonido

El video sigue iniciando en silencio porque los navegadores móviles bloquean autoplay con sonido. El usuario toca 🔇/🔊 para activar audio; después el volumen depende del dispositivo.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-38-altavoz-foto-perfil.md

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

Agrega altavoz visible y foto de perfil

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6338

## Checklist

1. Confirmar que se vea v6.3.38.
2. Abrir una publicación con video y confirmar que aparece 🔇/🔊.
3. Tocar 🔇/🔊 y confirmar que se activa el sonido.
4. Ir a Perfil.
5. Subir foto de perfil.
6. Guardar perfil.
7. Confirmar que la foto aparece en tus publicaciones.
8. Crear una nueva publicación y confirmar que usa tu foto.
9. Confirmar que mensaje, compartir, tienda y búsqueda siguen funcionando.
