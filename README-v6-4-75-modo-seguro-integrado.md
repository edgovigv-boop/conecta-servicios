# Conecta Servicios v6.4.75 — Modo seguro integrado

## Qué corrige

El celular afectado ya recibe `app.js v6.4.74`, pero el render principal cae a la pantalla “Estamos cargando la app”.

Esta versión integra un modo seguro dentro de `app.js`:

- Si el render principal falla, ya no muestra pantalla vacía.
- Consulta `/api/publications`.
- Pinta publicaciones reales desde Supabase.
- Incluye navegación básica: Inicio, Mensajes, Perfil.
- Respeta filtros VENDO / OFREZCO / NECESITO.
- No usa `feed-rescue.js`.
- No usa `output: export`.

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-75-modo-seguro-integrado.md`

## Commit sugerido

Integra modo seguro para evitar bloqueo de render

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/limpiar-cache.html

## Nota

Esto mantiene viva la app en el celular problemático mientras después revisamos el error exacto almacenado en:

`cs_v6475_last_safe_mode_error`
