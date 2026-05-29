# Conecta Servicios v6.4.82 — Gestión completa en modo admin

## Qué corrige

En celulares que no son dueños locales de una publicación, la app ya no mostraba:

- Encuadre
- Editar aquí
- Multimedia
- Completo
- Borrar

La causa era que el menú completo solo se mostraba cuando `isMeId(post.ownerId)` era verdadero. El modo admin anterior solo permitía `Encuadre admin`.

## Qué cambia

- El modo admin local ahora muestra el menú completo.
- Los botones de edición, multimedia, encuadre, completo y borrado aceptan modo admin.
- Los usuarios normales siguen sin ver gestión completa.
- El modo admin se activa solo en el navegador/celular donde se active.

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `activar-admin.html`
- `README-v6-4-82-admin-gestion-completa.md`

## Commit sugerido

Permite gestion completa en modo admin

## Cómo activar admin en un celular

Después de Vercel Ready, abre:

https://conecta-servicios.vercel.app/activar-admin.html

Toca:

Activar modo admin en este celular

También funciona entrando directo a:

https://conecta-servicios.vercel.app/?v=6482&admin=1

## Cómo desactivar admin

https://conecta-servicios.vercel.app/?v=6482&admin=off

o desde:

https://conecta-servicios.vercel.app/activar-admin.html

## Validación

- `node --check app.js`: OK
- `node --check service-worker.js`: OK

## Reemplazos de permisos realizados

{"if(!post || !isMeId(post.ownerId)) return toast('Solo puedes guardar tus publicaciones.');": 1, "if(!post || !isMeId(post.ownerId)) return toast('Solo puedes editar tus publicaciones.');": 2, "if(!post || !isMeId(post.ownerId)) return toast('Solo puedes cambiar multimedia de tus publicaciones.');": 4, "if(!post || !isMeId(post.ownerId)) return toast('Solo puedes borrar tus publicaciones.');": 1}

## Importante

No toca Supabase.
No toca Storage.
No toca api/publications.js.
No cambia diseño general.
No activa admin para testers.
