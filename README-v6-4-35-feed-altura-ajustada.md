# Conecta Servicios v6.4.35 - Feed altura ajustada

## Objetivo

Corregir que el feed se sintiera demasiado largo después de recuperar las herramientas.

## Qué corrige

- Ajusta la altura de cada publicación del feed a la pantalla visible real.
- Evita que cada publicación quede más larga de lo necesario.
- Reduce ligeramente el alto de la barra inferior.
- Compacta un poco el espacio inferior del contenido de la publicación.
- Mantiene los paneles de edición/multimedia con altura flexible cuando se abren, para que no se corten.

## Qué conserva

- Mensajes corregidos.
- Perfil.
- Editar aquí.
- Encuadre.
- Multimedia.
- Guardar y volver.
- Menú de herramientas sin el falso botón `Herramientas`.

## Qué no toca

- No toca `api/messages.js`.
- No toca perfil.
- No toca identidad.
- No requiere SQL.
- No cambia Supabase.
- No cambia Storage.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-35-feed-altura-ajustada.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Ajusta altura del feed

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6435

## Checklist

1. Confirmar que aparece `v6.4.35`.
2. Revisar el feed: cada publicación debe sentirse menos larga.
3. Confirmar que no se corta la barra inferior.
4. Confirmar que `Editar aquí` abre y permite guardar.
5. Confirmar que `Encuadre` abre y permite guardar.
6. Confirmar que mensajes siguen funcionando.
