# Conecta Servicios v6.4.37 - Restaura layout estable

## Objetivo

Corregir el daño visual de la v6.4.36 y recuperar una interfaz móvil confiable para demo/inversionistas.

## Decisión técnica

Esta versión se construye desde la base v6.4.35, no desde la v6.4.36.

La v6.4.36 se descarta porque hizo que herramientas/botones se montaran en la parte superior y desacomodó el feed.

## Qué corrige

- Evita que herramientas como `Encuadre`, `Editar aquí` y `Multimedia` aparezcan arriba del feed.
- Regresa la información de la publicación como capa superpuesta sobre foto/video.
- Evita que la publicación crezca por debajo de la multimedia.
- Mantiene cada publicación en una altura de pantalla móvil real.
- No usa scroll-snap agresivo para evitar que se vea una parte de la publicación anterior.
- Mantiene `Editar aquí`, `Guardar y volver`, `Encuadre`, `Multimedia` y mensajes.

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
- `README-v6-4-37-restaura-layout-estable.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura layout estable para demo movil

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6437

## Checklist

1. Confirmar que aparece `v6.4.37`.
2. Confirmar que no aparecen herramientas arriba del feed.
3. Confirmar que la publicación no queda larga.
4. Confirmar que la información queda sobre la foto/video.
5. Probar `Editar aquí` y `Guardar y volver`.
6. Probar `Encuadre` y `Guardar y volver`.
7. Probar `Multimedia`.
8. Enviar mensaje desde celular visitante y recibirlo en el dueño.
