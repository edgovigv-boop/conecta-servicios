# Conecta Servicios v6.4.84 — Admin sin contaminar usuario normal

## Qué corrige

1. Al tocar Mensajes en una publicación propia, ya no abre todas las conversaciones.
   Ahora entra a Mensajes filtrando solo esa publicación.

2. En modo admin, Perfil muestra publicaciones administrables en lugar de decir que no hay publicaciones.

3. En modo admin, Tienda muestra una tienda global con publicaciones VENDO visibles.

4. El modo admin se mantiene separado de la identidad local:
   - no cambia userId
   - no reclama publicaciones como propias
   - no mezcla usuarios normales

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-84-admin-sin-contaminar-usuario.md

## Commit sugerido

Separa admin de usuario normal y filtra mensajes por publicacion

## Prueba recomendada

1. Celular admin:
   - abrir Perfil: debe decir admin activo y mostrar administrables
   - abrir Tienda: debe mostrar VENDO global
   - abrir Mensajes: debe mostrar bandeja global

2. Celular fiel normal:
   - tocar mensaje en “Hago tus mandados...”
   - debe abrir solo conversaciones de esa publicación
   - usar “Ver todas las conversaciones” para regresar a bandeja general

3. Usuario normal:
   - sin admin debe seguir viendo solo sus mensajes normales.
