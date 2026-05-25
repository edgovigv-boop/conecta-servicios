# Conecta Servicios v6.4.13 - Scroll fix

## Objetivo

Corregir el problema de la v6.4.12 donde la pantalla ya no permitía hacer scroll en ninguna página.

## Qué corrige

- Restaura el scroll vertical global.
- Quita el bloqueo global de `overscroll-behavior`.
- Mantiene el bloqueo táctil solo dentro del recuadro de encuadre multimedia.
- Mantiene el editor de encuadre compacto.
- Evita que Home, Perfil, Mensajes, Chat o Publicar queden congelados.
- No toca Supabase.
- No toca mensajes.
- No toca Storage.
- No requiere SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-13-scroll-fix.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige scroll global tras editor de encuadre

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6413

## Checklist urgente

1. Confirmar que aparece `v6.4.13`.
2. Probar scroll en Home.
3. Probar scroll en Perfil.
4. Probar scroll en Mensajes.
5. Probar scroll en Editar publicación.
6. Dentro del recuadro de encuadre, probar arrastrar/pellizcar.
7. Fuera del recuadro, confirmar que la página baja normalmente.
8. Guardar publicación y confirmar que Home respeta el encuadre.
