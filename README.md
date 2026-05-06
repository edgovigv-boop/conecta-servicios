# Conecta Servicios v3.7.3 — Edición administrativa

Versión de prueba pública municipal con Supabase, folios, filtros flexibles y edición desde administración.

## Cambios principales

- Mantiene los filtros flexibles: Todo México, estado o municipio.
- Mantiene folios visibles para pedidos y perfiles.
- Mantiene solicitud de atendido verificada por últimos 4 dígitos.
- Agrega botón **Solicitar modificación** para pedidos y perfiles públicos.
- Agrega botón **Editar** en el panel administrador para pedidos.
- Agrega botón **Editar** en el panel administrador para perfiles.
- Permite corregir título, servicio, categoría, ubicación, teléfono, descripción y otros campos desde la app.
- Mantiene los estados: revisión, activo, oculto y atendido.
- No requiere SQL nuevo si ya aplicaste las versiones anteriores hasta v3.3.2/v3.7.2.

## Publicación en Vercel

Sube a GitHub estos cuatro archivos en la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Mensaje sugerido de commit:

`Actualizar a v3.7.3 edición administrativa`

Vercel publicará automáticamente el cambio desde GitHub.

## Administración

Para entrar al panel usa:

`https://conecta-servicios.vercel.app?admin=1`

PIN temporal de piloto: `3145`

> Nota: El PIN temporal sirve para piloto. Para una versión masiva se recomienda login real con Supabase Auth.
