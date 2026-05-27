# Conecta Servicios v6.4.65 - Carrusel táctil completo

## Objetivo

Corregir la zona táctil del carrusel en publicaciones con varias fotos.

## Problema reportado

El carrusel ya no avanzaba solo, pero solo permitía pasar fotos en la parte superior de la imagen. La zona inferior sombreada, donde aparece la información de la publicación, limitaba el gesto.

## Qué corrige

- El carrusel sigue siendo manual.
- Ahora también permite iniciar el swipe desde la zona inferior sombreada/texto de la publicación.
- No afecta botones ni controles:
  - corazón
  - mensaje
  - compartir
  - encuadre
  - editar
  - multimedia
  - borrar
  - puntitos
- Las fotos solo cambian si el usuario desliza o toca puntitos.
- No toca mensajes.
- No toca perfil.
- No toca admin.
- No toca publicar.
- No toca Supabase Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-65-carrusel-tactil-completo.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Amplia zona tactil del carrusel

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6465

Para admin:

https://conecta-servicios.vercel.app/?v=6465&admin=media#admin

## Checklist

1. Abrir una publicación con varias fotos.
2. Deslizar arriba de la imagen.
3. Deslizar también desde la zona sombreada/texto.
4. Confirmar que cambia una foto a la vez.
5. Confirmar que botones siguen funcionando.
6. Confirmar mensajes, perfil y admin.
