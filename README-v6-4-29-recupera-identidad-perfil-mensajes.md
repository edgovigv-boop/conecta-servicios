# Conecta Servicios v6.4.29 - Recupera identidad, perfil y mensajes

## Objetivo

Corregir el caso crítico donde después de una actualización parecían desaparecer:

- Perfil
- Mensajes
- Edición directa sobre publicación

La causa más probable es que el navegador generó o tomó otro `userId`, y entonces la app ya no reconocía las publicaciones/mensajes/perfil del dueño anterior.

## Qué corrige

- Agrega respaldo persistente del `userId`.
- Recupera el `userId` anterior desde:
  - respaldo principal
  - respaldo alterno
  - respaldo no versionado
  - publicaciones propias con nombre/foto real
- Si el `userId` actual parece nuevo pero hay publicaciones anteriores con identidad real, recupera el dueño anterior.
- El perfil también puede recuperarse desde publicaciones propias.
- Agrega accesos rápidos visibles a:
  - Mensajes
  - Perfil
- Fuerza que la barra inferior siga visible.
- Conserva la base estable anterior con:
  - Editar aquí
  - Multimedia
  - Encuadre independiente por foto
  - Perfil persistente
  - Mensajes

## Qué no cambia

- No toca `api/messages.js`.
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
- `README-v6-4-29-recupera-identidad-perfil-mensajes.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Recupera identidad perfil y mensajes

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6429

## Checklist urgente

1. Confirmar que aparece `v6.4.29`.
2. Tocar el acceso rápido `Perfil`.
3. Confirmar si recupera nombre/foto.
4. Tocar el acceso rápido `Mensajes`.
5. Tocar `Actualizar mensajes`.
6. Confirmar que vuelve la bandeja.
7. Confirmar que `Editar aquí` aparece en publicaciones propias.
