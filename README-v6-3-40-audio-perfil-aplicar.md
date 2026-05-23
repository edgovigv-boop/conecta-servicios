# Conecta Servicios v6.3.40 - Audio visible y aplicar perfil

## Qué corrige

- Agrega botón `Audio` dentro de la fila horizontal de acciones cuando la publicación es video.
- Así el sonido queda visible aunque el altavoz flotante quede tapado por capas visuales.
- Mantiene el altavoz flotante 🔇/🔊.
- Agrega en Perfil el botón `Aplicar mi nombre y foto a publicaciones visibles`.
- Ese botón sirve cuando las publicaciones fueron creadas antes del cambio de perfil o desde otro celular.
- Reduce más la foto de perfil para evitar problemas de almacenamiento local.
- Hace más estable el campo de nombre visible.

## Importante

El botón `Aplicar mi nombre y foto a publicaciones visibles` debe usarse solo si esas publicaciones visibles son tuyas. Actualiza ownerId, ownerName y ownerAvatar de esas publicaciones.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-40-audio-perfil-aplicar.md

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

Agrega audio visible y aplicar perfil

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6340

## Checklist

1. Confirmar que se vea v6.3.40.
2. En una publicación con video, ver botón `Audio` en la fila de acciones.
3. Tocar `Audio` y confirmar que activa sonido.
4. Ir a Perfil.
5. Escribir nombre sin que se cierre el teclado.
6. Subir foto.
7. Guardar perfil.
8. Tocar `Aplicar mi nombre y foto a publicaciones visibles`.
9. Confirmar que la foto aparece en publicaciones visibles.
