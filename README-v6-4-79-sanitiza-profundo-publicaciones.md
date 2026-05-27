# Conecta Servicios v6.4.79 — Sanitización profunda de publicaciones

## Qué detectamos

La prueba `/api/publications?sizes=1` ya respondió `ok: true`, pero todavía aparecían valores peligrosos dentro del JSON, especialmente:

- `ownerAvatar` con `data:image/...`
- `mediaPreviewUrl` tipo `blob:`
- posibles campos base64/locales dentro de objetos anidados

Eso puede romper el render aunque el `mediaData` principal ya se haya quitado.

## Qué hace esta versión

Actualiza únicamente:

- `api/publications.js`

La API ahora hace sanitización profunda:

- elimina cualquier `data:`
- elimina cualquier `blob:`
- elimina cualquier `file:`
- elimina campos `mediaData`, `mediaBase64`, `rawFile`, etc.
- limpia también `ownerAvatar`
- limpia objetos anidados y `mediaItems`
- conserva URLs públicas `https://...supabase.co/storage/...`

## Commit sugerido

Sanitiza profundamente publicaciones del feed

## Después de subirlo

1. Espera Vercel Ready.
2. Abre:

   https://conecta-servicios.vercel.app/api/publications?sizes=1

3. Revisa que diga:

   `containsUnsafeValue:false`

4. Después abre la app normal.

## Importante

No toca:

- `app.js`
- `index.html`
- `styles.css`
- mensajes
- perfil
- diseño

Esto corrige el alimento del feed, no la interfaz.
