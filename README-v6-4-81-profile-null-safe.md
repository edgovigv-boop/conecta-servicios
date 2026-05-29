# Conecta Servicios v6.4.81 — Perfil local tolerante a null

## Diagnóstico confirmado

El diagnóstico local reportó:

`Cannot read properties of null (reading 'name')`

La causa está en `normalizeProfile(prof={})`: si `profileFromBackups()` recibe `null` desde un respaldo local de perfil, el parámetro default no se aplica porque el valor explícito es `null`. Entonces `prof.name` rompe el render.

## Qué corrige

- `normalizeProfile()` ahora convierte `null`, strings u otros valores no objeto en `{}`.
- `profileFromBackups()` ahora filtra respaldos inválidos antes de normalizar.
- Mantiene `safePostCard()` de v6.4.80.
- Agrega `reparar-perfil-local.html` como herramienta opcional para reparar solo el perfil local de un celular.

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `reparar-perfil-local.html`
- `README-v6-4-81-profile-null-safe.md`

## Commit sugerido

Corrige perfil local null en dispositivos

## Después de Vercel Ready

Abrir primero:

https://conecta-servicios.vercel.app/limpiar-cache.html

Si un celular específico sigue fallando, abrir:

https://conecta-servicios.vercel.app/reparar-perfil-local.html

## Qué NO toca

- Supabase
- Storage
- API de publicaciones
- Diseño
- Mensajes en la nube
