# Conecta Servicios v6.4.78 — Sanitiza publicaciones de Supabase

## Diagnóstico

Si deployments viejos de Vercel también muestran pantalla blanca, entonces el problema no está solo en el código desplegado.

El patrón más probable es que el muro público está recibiendo desde Supabase una o más publicaciones con datos pesados/locales:

- `mediaData` con base64 muy grande
- `mediaPreviewUrl` tipo `blob:`
- `mediaItems[]` con `mediaData`
- URLs locales que solo sirven en un navegador

Eso puede romper o congelar el render incluso en versiones anteriores de la app.

## Qué hace este parche

Actualiza únicamente:

- `api/publications.js`

La API ahora:

- conserva `mediaUrl` público de Supabase Storage
- conserva `mediaItems[].mediaUrl`
- elimina `mediaData`
- elimina `mediaBase64`
- elimina `blob:` y `data:`
- no manda datos locales al feed público
- también limpia esos campos cuando se guarda una publicación nueva

## Commit sugerido

Sanitiza payload de publicaciones de Supabase

## Después de subirlo

1. Esperar Vercel Ready.
2. Abrir:

   https://conecta-servicios.vercel.app/api/publications?sizes=1

3. Confirmar que responde `ok: true`.
4. Abrir la app normal.

## Importante

Este parche no toca:

- `app.js`
- `index.html`
- `styles.css`
- Supabase Storage
- mensajes
- perfil

La idea es limpiar el alimento del feed, no cambiar otra vez la interfaz.
