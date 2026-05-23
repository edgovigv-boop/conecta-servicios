# Conecta Servicios v6.4.2 - Descripción visible y reparación de dueño

## Qué corrige

- `...leer` ahora queda separado del texto corto, para que no quede oculto por el recorte.
- La descripción larga usa un bloque `post-description-collapsed` con texto y botón visibles.
- Si el texto está expandido, aparece `...ocultar`.
- El diagnóstico ahora muestra `descriptionLength` y `captionLength` para confirmar si la app está recibiendo texto largo.
- Se mantiene el corazón `♡` / `❤️`.

## Mensajes

v6.4.1 ya impide que Guardar Perfil vuelva a cambiar dueños de publicaciones.
Pero si una publicación ya quedó guardada en Supabase con `owner_id` equivocado, el código no puede saber quién era el dueño real.

Para eso se incluye:

- `repair-owner-publicacion-mensajes-v6-4-2.sql`

No se sube a GitHub. Se ejecuta en Supabase solo si los mensajes siguen sin llegar.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-2-descripcion-visible-owner-sql.md`

## No tocar

- `styles.css`
- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `assets`

## SQL

No requiere SQL para cargar la app.
El SQL incluido es solo reparación si `owner_id` ya está mal en Supabase.

## Commit sugerido

Corrige leer visible y prepara reparacion de owner

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=642

## Checklist

1. Confirmar que aparece `v6.4.2`.
2. Revisar publicación larga.
3. Confirmar que aparece `...leer`.
4. Tocar `...leer` y confirmar que aparece `...ocultar`.
5. Enviar mensaje desde otro celular.
6. Si no llega al dueño, copiar diagnóstico del celular dueño y usar el SQL de reparación.
