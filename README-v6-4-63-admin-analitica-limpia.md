# Conecta Servicios v6.4.63 - Admin analítica limpia

## Objetivo

Limpiar el panel Admin piloto.

## Cambio principal

Se elimina la lista de publicaciones dentro de Admin porque ya es redundante:
- Encuadre admin
- Editar admin
- Multimedia admin
- Borrar admin

ya aparecen directamente en cada publicación del feed.

## Qué queda en Admin

- Analítica rápida:
  - publicaciones
  - usuarios
  - publicaciones con multimedia
  - videos
  - Vendo
  - Ofrezco
  - Necesito
  - mensajes sin leer
- Botón para volver al feed.
- Botón para ver mensajes.
- Nota de que el admin actual es local/de piloto.

## Qué conserva

- Acceso Admin desde Perfil.
- Botón Instalar app en Perfil.
- Acciones admin directamente en publicaciones.
- Feed estable.
- Mensajes.
- Perfil.
- Multimedia.
- Encuadre admin.
- Sin cambios en SQL.
- Sin tocar Supabase Storage.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-63-admin-analitica-limpia.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Limpia admin y deja solo analitica

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6463

Para admin:

https://conecta-servicios.vercel.app/?v=6463&admin=media#admin

## Checklist

1. Confirmar Home estable.
2. Confirmar Perfil.
3. Confirmar Instalar app en Perfil.
4. Confirmar Admin piloto desde Perfil.
5. Confirmar que Admin ya no muestra lista larga de publicaciones.
6. Confirmar que Admin muestra analítica.
7. Confirmar que en el feed siguen apareciendo Encuadre admin / Editar admin / Multimedia admin / Borrar admin.
