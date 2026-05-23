# Conecta Servicios v6.3.16 - Diagnóstico de video y Storage

## Objetivo

Antes de cambiar más código de la app, esta versión nos dice exactamente dónde está el problema del video:

1. Si Supabase Storage acepta subida con `SUPABASE_ANON_KEY`.
2. Si acepta subida con `SUPABASE_SERVICE_ROLE_KEY`.
3. Si las publicaciones de video tienen `mediaUrl`.
4. Si siguen con `mediaStatus: "pendiente"`.

## Archivos para GitHub

Sube la carpeta `api` o estos dos archivos dentro de `api`:

- api/storage-diagnostics.js
- api/video-diagnostics.js

No reemplaces `app.js`.
No reemplaces `styles.css`.
No ejecutes SQL nuevo.

## Commit sugerido

Agrega diagnóstico de video y Storage

## Después de Vercel Ready

Abre estas ligas:

```text
https://conecta-servicios.vercel.app/api/storage-diagnostics?test=1
```

y:

```text
https://conecta-servicios.vercel.app/api/video-diagnostics
```

## Cómo leer resultados

### Caso A

Si `anonUpload.ok` sale `false`:

La app no puede subir multimedia desde el navegador.
Revisar `SUPABASE_ANON_KEY` en Vercel o políticas del bucket.

### Caso B

Si `anonUpload.ok` sale `true` y `serviceUpload.ok` sale `true`:

Storage sí permite subir.
Entonces el problema está en el archivo de video, formato, tamaño o flujo frontend.

### Caso C

Si en `video-diagnostics` el video dice:

```json
"hasMediaUrl": false
```

El archivo de video no subió o la URL no se guardó.

### Caso D

Si dice:

```json
"hasMediaUrl": true,
"mediaStatus": "pendiente"
```

El archivo sí tiene URL, pero la app dejó una marca vieja de pendiente.

Con esos datos hacemos la corrección precisa.
