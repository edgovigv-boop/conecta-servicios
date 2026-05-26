# Conecta Servicios v6.4.46 - Admin encuadre y video auto-ajustado

## Objetivo

Permitir que el administrador pueda corregir el encuadre de multimedia de publicaciones que no son suyas, por ejemplo un video subido desde el celular de otra persona, sin cambiar dueño, mensajes, perfil, Supabase ni SQL.

## Qué corrige/agrega

- Los videos nuevos o sin encuadre manual se ajustan automáticamente como `cover`, centrados en pantalla.
- Se agrega un modo admin local para encuadre.
- En modo admin, las publicaciones ajenas muestran únicamente:
  - `Encuadre admin`
- El admin puede mover con un dedo y pellizcar para ajustar el video/foto.
- Al guardar, se sincroniza el encuadre en la publicación.
- No se muestran botones peligrosos de admin como Borrar o Editar texto en publicaciones ajenas.
- Las publicaciones propias conservan sus herramientas normales.

## Cómo activar modo admin en tu dispositivo

Abrir la app una vez con:

https://conecta-servicios.vercel.app/?v=6446&admin=media

Después queda activo en ese navegador.

## Cómo desactivar modo admin

Abrir:

https://conecta-servicios.vercel.app/?v=6446&admin=off

## Importante

Este modo admin es local/de piloto, útil para corregir publicaciones durante pruebas y operación inicial.
No reemplaza un sistema de seguridad real de servidor. Para una etapa masiva se recomienda después crear roles reales en Supabase.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-46-admin-encuadre-auto-video.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega encuadre admin y auto ajuste de video

## Después de Vercel Ready

Abrir primero:

https://conecta-servicios.vercel.app/?v=6446&admin=media

Luego revisar la publicación de video y tocar:

`Encuadre admin`

## Checklist

1. Confirmar que aparece `v6.4.46`.
2. Abrir con `?v=6446&admin=media`.
3. Ver que una publicación ajena muestra `Encuadre admin`.
4. Ajustar video con un dedo/pellizco.
5. Guardar y volver.
6. Confirmar que la publicación conserva dueño original.
7. Confirmar mensajes y perfil.
8. Confirmar que publicaciones propias siguen con herramientas normales.
