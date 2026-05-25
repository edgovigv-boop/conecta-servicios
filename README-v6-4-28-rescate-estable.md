# Conecta Servicios v6.4.28 - Rescate estable

## Objetivo

Restaurar de inmediato la base estable anterior después de que la v6.4.27 provocó pérdida visual de funciones importantes.

## Base de esta versión

Esta versión está construida directamente sobre:

- `v6.4.26-encuadre-independiente-fotos`

No incluye los cambios de layout de `v6.4.27`.

## Qué recupera

- `Editar aquí` sobre la publicación.
- `Encuadre` con encuadre independiente por foto.
- `Multimedia`.
- `Mensajes`.
- `Perfil`.
- Perfil persistente.
- Zona/cobertura libre.
- Carrusel con fotos y puntitos.
- Botones de corazón, mensaje y compartir.

## Qué NO toca

- No toca `api/messages.js`.
- No toca SQL.
- No toca Supabase.
- No toca Storage.
- No borra publicaciones.
- No cambia estructura de base de datos.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-28-rescate-estable.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura base estable antes de layout v6427

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6428

## Checklist urgente

1. Confirmar que aparece `v6.4.28`.
2. Confirmar que aparece `Editar aquí`.
3. Confirmar que aparece Perfil.
4. Confirmar que aparece Mensajes.
5. Confirmar que tus publicaciones siguen visibles.
6. Confirmar que perfil no vuelve a `Usuario local`.
7. Confirmar que mensajes cargan.
8. No probar más layout hasta confirmar estabilidad.
