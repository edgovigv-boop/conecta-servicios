# Conecta Servicios v6.4.18 - Perfil persistente

## Objetivo

Evitar que las actualizaciones de la app regresen el perfil del usuario a `Usuario local`.

## Qué corrige

- El perfil ahora se guarda en la llave normal y también en respaldos no versionados.
- Si el perfil local se pierde, la app intenta recuperarlo desde:
  - respaldo principal
  - respaldo alterno
  - nombre/foto guardados por separado
  - publicaciones propias que ya tienen `ownerName` y `ownerAvatar`
- Evita que una actualización con perfil vacío sobrescriba publicaciones propias con `Usuario local`.
- `applyProfileToOwnPosts` ya no empuja un perfil genérico si no hay nombre/foto real.
- El botón de reset técnico conserva también los respaldos del perfil.
- El diagnóstico técnico indica si hay respaldo de perfil.

## Qué no cambia

- No toca `api/messages.js`.
- No cambia mensajes.
- No cambia Storage.
- No requiere SQL.
- No cambia la estructura de Supabase.
- No vuelve a subir multimedia.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-18-perfil-persistente.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Protege perfil contra reinicios por actualizacion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6418

## Checklist

1. Confirmar que aparece `v6.4.18`.
2. Revisar Perfil.
3. Confirmar que nombre y foto siguen presentes.
4. Si aparece `Usuario local`, tocar Perfil una vez; la app debe intentar recuperar desde publicaciones propias.
5. Guardar perfil de nuevo solo si fuera necesario.
6. Confirmar que publicaciones propias no se actualizan a `Usuario local`.
7. Confirmar que mensajes siguen funcionando.
