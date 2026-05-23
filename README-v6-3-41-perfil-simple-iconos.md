# Conecta Servicios v6.3.41 - Perfil simple e iconos

## Qué corrige

- Quita el botón extra `Aplicar mi nombre y foto a publicaciones visibles`.
- Ahora `Guardar perfil` aplica automáticamente nombre y foto a tus publicaciones visibles en este dispositivo.
- Al subir foto de perfil también se aplica automáticamente.
- Simplifica la interfaz para que sea más abuelita friendly.
- Los botones de publicación quedan solo con iconos:
  - ❤️
  - ✉️
  - ↗️
  - 🔇 / 🔊 en videos
- Mantiene etiquetas accesibles internas para los botones, aunque no se muestre texto.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-41-perfil-simple-iconos.md

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

Simplifica perfil y acciones con iconos

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6341

## Checklist

1. Confirmar que se vea v6.3.41.
2. Ir a Perfil y confirmar que ya no aparece el botón extra.
3. Cambiar nombre o foto.
4. Tocar Guardar perfil.
5. Confirmar que nombre y foto aparecen en publicaciones.
6. Confirmar que los botones de publicación son solo iconos.
7. En videos, confirmar que aparece 🔇/🔊 como icono.
