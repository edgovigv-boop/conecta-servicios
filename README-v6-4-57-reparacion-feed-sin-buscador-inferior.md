# Conecta Servicios v6.4.57 - Reparación feed sin buscador inferior

## Objetivo

Corregir de emergencia el problema donde apareció un cuadro `Buscar / OFREZCO` debajo de la publicación y rompió el layout visual.

## Qué corrige

- Quita físicamente del Home la sección `feed-title`.
- `updateFeedOnly` ya no intenta actualizar `feedTitle`.
- Fuerza estilos nuevos por versión para que no queden estilos viejos en el navegador.
- Oculta cualquier buscador/encabezado antiguo debajo del feed.
- Restaura las publicaciones a pantalla completa.
- No toca mensajes.
- No toca perfil.
- No toca Supabase.
- No toca Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-57-reparacion-feed-sin-buscador-inferior.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Repara feed sin buscador inferior

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6457

## Checklist

1. Confirmar que desaparece el cuadro Buscar/OFREZCO mal ubicado.
2. Confirmar que la publicación ocupa pantalla completa.
3. Confirmar que el menú flotante superior sigue bien.
4. Confirmar mensajes.
5. Confirmar perfil.
