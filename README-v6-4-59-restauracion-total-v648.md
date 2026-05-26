# Conecta Servicios v6.4.59 - Restauración total desde v6.4.48

## Objetivo

Regresar la app a la última base visual estable antes de los cambios de muro público, sincronización forzada, footer legal visible y pantallas de carga.

## Base usada

Esta versión parte directamente de:

`v6.4.48-encuadre-botones-arriba`

## Qué NO trae

- No trae el flujo de `Subir publicaciones de este celular`.
- No trae footer legal visible encima del feed.
- No trae muro público forzado.
- No trae pantallas nuevas de carga agregadas después.
- No trae los cambios experimentales de v6.4.49 a v6.4.58.

## Qué conserva

- Feed visual tipo publicación completa.
- Menú flotante superior.
- Vendo / Ofrezco / Necesito.
- Barra inferior.
- Mensajes.
- Perfil.
- Encuadre.
- Encuadre admin.
- Botones Guardar / Cancelar arriba durante encuadre.
- Multimedia.
- API de publicaciones original de esa base.
- Sin cambios en SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-59-restauracion-total-v648.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura version estable v648

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6459

Para admin de encuadre:

https://conecta-servicios.vercel.app/?v=6459&admin=media

## Checklist

1. Confirmar que el feed ya no queda en Cargando publicaciones.
2. Confirmar que desaparece cualquier cuadro Buscar/OFREZCO mal ubicado.
3. Confirmar que mensajes abre.
4. Confirmar que perfil abre.
5. Confirmar que encuadre/encuadre admin siguen funcionando.
