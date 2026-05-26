# Conecta Servicios v6.4.43 - Ajustes post diseño

## Objetivo

Corregir los detalles reportados después de aplicar el diseño del prototipo a la app real.

## Qué corrige

- El encabezado vuelve a mostrar claramente los menús superiores:
  - Municipio / zona
  - Tienda
  - Para ti
  - Vendo / Ofrezco / Necesito
- Se elimina el efecto de encabezado blanco que hacía que los menús se perdieran.
- Se quita la barra blanca inferior tipo pastilla. La navegación queda sin contenedor blanco grande.
- El corazón ya no se ve enorme ni ocupa media fila.
- Si al quitar fotos queda una sola imagen, la publicación deja de tratarla como carrusel y desaparecen los puntitos.
- `Siguiendo` ahora muestra primero publicaciones guardadas con corazón y después cuentas seguidas.
- `Perfil` ahora usa la misma lógica de identidad asociada que ya usa el feed, para que aparezcan todas las publicaciones propias activas.
- No toca mensajes.
- No toca Supabase.
- No toca Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-43-ajustes-post-diseno.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige encabezado siguiendo perfil y acciones

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6443

## Checklist

1. Confirmar que aparece `v6.4.43`.
2. Confirmar que el encabezado superior se lee bien.
3. Confirmar que ya no hay barra blanca inferior grande.
4. Confirmar que el corazón se ve compacto.
5. Confirmar que los puntitos desaparecen si solo queda una foto.
6. Confirmar que `Siguiendo` muestra publicaciones con corazón.
7. Confirmar que `Perfil` muestra tus publicaciones activas.
8. Confirmar que mensajes siguen funcionando.
