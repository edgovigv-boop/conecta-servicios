# Conecta Servicios v6.4.71 — Solución definitiva de caché

## Decisión

No correr más parches de `feed-rescue`.

Como la app funciona bien en otro celular y `/api/publications` ya devuelve publicaciones, el problema está en caché/local state del celular afectado, no en Supabase.

## Qué hace esta versión

- Quita cualquier `feed-rescue.js` del arranque.
- Fuerza `app.js`, `styles.css` y `manifest.json` con versión nueva.
- Actualiza `service-worker.js` para no cachear `index.html`, `app.js`, `styles.css`, `manifest.json` ni `/api`.
- Agrega `limpiar-cache.html` para limpiar el celular afectado sin tocar Supabase.

## Archivos incluidos

- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-71-solucion-definitiva-cache.md`

## Commit sugerido

Soluciona cache del cliente y retira rescue del feed

## Orden recomendado

1. Subir estos archivos a GitHub.
2. Esperar Vercel Ready.
3. En el celular que falla abrir:

   https://conecta-servicios.vercel.app/limpiar-cache.html

4. Dejar que redirija a la app.
5. Si todavía falla, volver a abrir `limpiar-cache.html` y tocar:
   “Último recurso: limpiar datos locales de este celular”.

## Qué NO toca

- No toca `app.js`.
- No toca Supabase.
- No toca Storage.
- No toca mensajes.
- No toca perfil.
- No toca publicaciones de la nube.

## Nota

La solución definitiva real en código vendrá después revisando el render de `app.js`, pero para el problema actual esta es la corrección correcta: limpiar y prevenir caché viejo en el celular afectado.
