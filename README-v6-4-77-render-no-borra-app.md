# Conecta Servicios v6.4.77 — Render no borra la app

## Qué pasó

El modo seguro anterior sí entraba, pero no mantenía la apariencia original.

El problema real era que `render()` tenía un solo `try/catch` para todo:
- crear HTML
- bind de botones
- videos
- galerías
- encuadre
- editor táctil

Si cualquiera de esos pasos fallaba en un celular, el catch reemplazaba toda la app por la pantalla:
“La app se protegió de una pantalla en blanco”.

## Qué corrige esta versión

Mantiene la apariencia original, pero separa el render en pasos seguros:

- Si falla un paso visual, se omite ese paso.
- Ya no borra toda la pantalla.
- La app conserva el feed, mensajes y perfil.
- Guarda el último error en `localStorage`:
  - `cs_v6477_last_visual_error`
  - `cs_v6477_last_route_error`

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-77-render-no-borra-app.md`

## Commit sugerido

Evita que errores visuales borren la app

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/limpiar-cache.html

## Importante

- No usa `feed-rescue.js`.
- No usa modo seguro visual alterno.
- No usa `output: export`.
- No toca Supabase.
- No toca Storage.
