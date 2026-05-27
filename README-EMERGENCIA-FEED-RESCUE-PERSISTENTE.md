# Emergencia — Feed Rescue Persistente v6.4.69

## Commit sugerido

Corrige rescate persistente del feed en celulares

## Qué pasó

La API `/api/publications` sí devuelve publicaciones, pero el render principal puede volver a dejar el centro blanco después de entrar.

El parche anterior alcanzaba a pintar una vez, pero si `app.js` hacía otro render después, podía volver a borrar el centro.

## Qué corrige este ZIP

Incluye una versión persistente de `feed-rescue.js`.

- Revisa el feed cada 1.6 segundos.
- Si detecta el centro blanco, vuelve a pintar publicaciones reales desde Supabase.
- Usa `MutationObserver` para reaccionar si `app.js` vuelve a borrar el centro.
- No muestra el aviso gris de “Feed recuperado...”.
- No modifica Supabase.
- No modifica Storage.
- No modifica mensajes.
- No reemplaza `app.js`.

## Archivos incluidos

- `index.html`
- `feed-rescue.js`
- `README-EMERGENCIA-FEED-RESCUE-PERSISTENTE.md`

## Prueba después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6469

## Nota

Este sigue siendo un parche de emergencia para presentación.
Después conviene corregir el render principal dentro de `app.js`, pero esto evita que el usuario vea el centro blanco durante el pitch.
