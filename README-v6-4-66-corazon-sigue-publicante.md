# Conecta Servicios v6.4.66 - Corazón sigue publicante

## Objetivo

Corregir el apartado `Siguiendo`.

## Problema reportado

Cuando el usuario daba corazón a una publicación, en `Siguiendo` sí aparecía la publicación guardada, pero en la sección `Cuentas que sigues` aparecía:

`Todavía no sigues cuentas`

Eso confundía porque al dar corazón el usuario ya está mostrando interés por ese publicante.

## Qué corrige

- Al tocar corazón en una publicación, también se sigue automáticamente al publicante.
- En `Siguiendo`, la sección `Cuentas que sigues` incluye:
  - cuentas seguidas manualmente;
  - publicantes de publicaciones marcadas con corazón.
- Se cambia el texto vacío para que no contradiga la acción del usuario.
- No toca carrusel.
- No toca mensajes.
- No toca perfil.
- No toca admin.
- No toca publicar.
- No toca Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-66-corazon-sigue-publicante.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Hace que corazon siga al publicante

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6466

Para admin:

https://conecta-servicios.vercel.app/?v=6466&admin=media#admin

## Checklist

1. Tocar corazón en una publicación.
2. Ir a `Siguiendo`.
3. Confirmar que la publicación aparece en `Guardados para ti`.
4. Confirmar que el publicante aparece en `Cuentas que sigues`.
5. Confirmar que ya no sale el mensaje contradictorio.
6. Confirmar carrusel, mensajes, perfil y admin.
