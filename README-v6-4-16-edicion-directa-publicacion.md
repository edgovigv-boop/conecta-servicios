# Conecta Servicios v6.4.16 - Edición directa de publicación

## Objetivo

Permitir editar texto, zona y categoría directamente desde la publicación, sin entrar a la pantalla larga de edición.

## Qué agrega

En publicaciones propias aparece:

- `Editar aquí`

Al tocarlo, se abre un panel dentro de la misma publicación para modificar:

- Título
- Descripción
- Zona / municipio
- Categoría

El panel tiene:

- `Guardar cambios`
- `Cancelar`

## Qué se conserva

- `Encuadrar aquí` sigue funcionando.
- El botón `Completo` mantiene acceso a la edición anterior completa.
- Mensajes, chat, compartir, corazón y encuadre directo no cambian.
- No se toca Storage.
- No requiere SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-16-edicion-directa-publicacion.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega edicion directa de publicacion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6416

## Checklist

1. Confirmar que aparece `v6.4.16`.
2. En una publicación propia, tocar `Editar aquí`.
3. Cambiar título.
4. Cambiar descripción.
5. Cambiar zona.
6. Cambiar categoría.
7. Tocar `Guardar cambios`.
8. Confirmar que los cambios se reflejan en Home.
9. Revisar en otro celular que se sincroniza.
10. Confirmar que Mensajes sigue funcionando.
11. Confirmar que `Encuadrar aquí` sigue funcionando.
