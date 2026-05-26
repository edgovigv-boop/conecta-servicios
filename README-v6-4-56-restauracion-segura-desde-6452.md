# Conecta Servicios v6.4.56 - Restauración segura desde v6.4.52

## Objetivo

Restaurar una base visual segura después de que v6.4.54 desconfiguró el cuadro de búsqueda y el layout del feed.

## Qué hace

- Parte de la base segura v6.4.52.
- Fuerza nueva versión/cache con `?v=6456`.
- No arrastra el botón visible `Subir publicaciones de este celular`.
- No arrastra el footer legal flotando sobre la app.
- Oculta cualquier `feed-title` antiguo si aparece debajo de la publicación.
- Conserva la corrección de encuadre remoto que ya venía desde v6.4.52.
- Conserva archivos legales como documentos separados, sin afectar la UI.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-56-restauracion-segura-desde-6452.md`
- `LICENSE-PROPIETARIA.md`
- `NOTICE-COPYRIGHT.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura base visual segura

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6456

## Checklist

1. Verificar que desapareció el cuadro Buscar/OFREZCO mal ubicado.
2. Verificar que el feed vuelve a verse como publicación completa.
3. Verificar que mensajes funciona.
4. Verificar que perfil funciona.
5. Verificar que encuadre admin sigue disponible con:
   https://conecta-servicios.vercel.app/?v=6456&admin=media
