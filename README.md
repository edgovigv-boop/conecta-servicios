# Conecta Servicios v3.7 - Publicación piloto pública

Versión consolidada para publicar en prueba pública desde Vercel/GitHub.

## Archivos

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

## Cambios principales

- Pantalla inicial más directa para usuarios.
- Texto cambiado de piloto a prueba pública municipal.
- Sección nueva: **Planes y destacados**.
- Solicitud de perfil destacado, publicación destacada y registro asistido por WhatsApp.
- Sin pagos automáticos dentro de la app.
- Los pedidos y perfiles nuevos siguen entrando como `revision`.
- Los teléfonos siguen enmascarados como `xxxxxx3145` en la vista pública.
- El cierre `Atendido` se mantiene solo desde administración.
- Admin oculto con `?admin=1`.
- Cache actualizado con `app.js?v=3.7-publicacion` y `styles.css?v=3.7-publicacion`.

## Publicar en Vercel

Reemplaza en GitHub estos cuatro archivos en la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Commit sugerido:

`Actualizar a v3.7 publicación piloto pública`

Vercel publicará automáticamente.

## Supabase

No requiere SQL nuevo si ya aplicaste las versiones anteriores hasta v3.3.2.
