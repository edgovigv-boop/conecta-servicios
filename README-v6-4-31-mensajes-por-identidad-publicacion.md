# Conecta Servicios v6.4.31 - Mensajes por identidad de publicación

## Objetivo

Corregir que un usuario de prueba mande mensaje desde otro celular y el celular dueño no lo reciba, aunque antes funcionaba.

## Causa probable

Después de las recuperaciones y cambios recientes, algunas publicaciones pueden seguir teniendo un `ownerId` anterior. El celular dueño puede tener perfil y mensajes visibles, pero al consultar la bandeja solo pedía mensajes del `userId` actual, no de los `ownerId` asociados a sus publicaciones.

## Qué corrige

- La bandeja de mensajes ahora consulta mensajes de más de una identidad asociada al dueño:
  - `userId` actual
  - respaldo local si existe
  - `ownerId` de publicaciones locales que coinciden con el perfil/foto del dueño
- Une los mensajes sin duplicarlos.
- Las conversaciones reconocen como propios los mensajes enviados/recibidos por cualquiera de esas identidades.
- El chat también carga mensajes usando esas identidades.
- No toca el API de mensajes.
- No requiere SQL.
- No toca Supabase.
- No cambia Storage.
- No toca layout, carrusel ni multimedia.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-31-mensajes-por-identidad-publicacion.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige recepcion de mensajes por identidad de publicacion

## Después de Vercel Ready

Abrir en el celular dueño:

https://conecta-servicios.vercel.app/?v=6431

## Checklist

1. Confirmar que aparece `v6.4.31`.
2. En el celular visitante, abrir una publicación del dueño.
3. Enviar un mensaje nuevo.
4. En el celular dueño, abrir Mensajes.
5. Tocar Actualizar mensajes.
6. Confirmar que llega.
7. Confirmar que Perfil sigue visible.
8. Confirmar que Editar aquí sigue visible.
