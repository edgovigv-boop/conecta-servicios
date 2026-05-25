# Conecta Servicios v6.4.19 - Multimedia directa básica

## Objetivo

Permitir cambios básicos de multimedia directamente desde la publicación, sin entrar a edición completa, y mejorar la claridad de las instrucciones.

## Qué agrega

En publicaciones propias aparece:

- `Multimedia`

Al tocarlo se puede:

- agregar más fotos a una publicación de fotos
- cambiar toda la multimedia por una o varias fotos
- reemplazar un video por otro video
- quitar fotos de una galería, dejando al menos una

## Límites intencionales

Para mantener estabilidad:

- varias fotos sí
- un solo video sí
- foto + video mezclados todavía no

El carrusel mixto queda para una versión posterior.

## También corrige

- Quita la flecha/lista del campo de zona/cobertura en la edición completa.
- Hace más visibles los textos de ayuda dentro de edición directa, multimedia y encuadre.
- Conserva perfil persistente, zona libre visible, encuadre directo y mensajes.

## No cambia

- No toca `api/messages.js`.
- No cambia chat ni mensajes.
- No requiere SQL.
- No modifica Storage manualmente.
- No cambia llaves ni configuración de Supabase.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-19-multimedia-directa-basica.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega multimedia directa basica

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6419

## Checklist

1. Confirmar que aparece `v6.4.19`.
2. En una publicación propia, tocar `Multimedia`.
3. Probar agregar fotos en publicación de fotos.
4. Probar cambiar todo por una nueva foto.
5. Probar reemplazar un video por otro video corto.
6. Confirmar que no permite mezclar foto + video.
7. Confirmar que la zona/cobertura ya no muestra flecha.
8. Confirmar que instrucciones se ven mejor.
9. Confirmar que mensajes siguen funcionando.
10. Confirmar que perfil no vuelve a Usuario local.
