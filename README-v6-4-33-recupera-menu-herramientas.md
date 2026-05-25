# Conecta Servicios v6.4.33 - Recupera menú de herramientas

## Objetivo

Recuperar el menú de herramientas del dueño de la publicación:

- Encuadre
- Editar aquí
- Multimedia
- Completo
- Borrar
- Reintentar cuando aplique

## Qué corrige

- El menú vuelve a aparecer aunque la publicación conserve un `ownerId` anterior asociado al mismo perfil.
- Ahora la app usa las identidades recuperadas de v6.4.31 para reconocer publicaciones propias.
- `Editar aquí`, `Encuadre`, `Multimedia`, `Completo` y `Borrar` aceptan publicaciones propias por identidad asociada.
- El menú queda más visible como fila horizontal con etiqueta `Herramientas`.
- No toca mensajes.
- No toca `api/messages.js`.
- No toca Supabase.
- No requiere SQL.
- No cambia Storage.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-33-recupera-menu-herramientas.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Recupera menu de herramientas de publicaciones propias

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6433

## Checklist

1. Confirmar que aparece `v6.4.33`.
2. Abrir una publicación propia.
3. Confirmar que aparece la fila `Herramientas`.
4. Confirmar botones: `Encuadre`, `Editar aquí`, `Multimedia`, `Completo`, `Borrar`.
5. Probar `Editar aquí`.
6. Probar `Encuadre`.
7. Probar que mensajes siguen funcionando desde el otro celular.
