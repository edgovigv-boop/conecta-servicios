# Conecta Servicios v4.9.36.8

Hotfix de flujo de Chat negocio y membresía.

## Cambios

- El Chat negocio ya no se publica libremente para usuarios sin membresía.
- Al terminar el flujo, el usuario recibe una pantalla para pagar/activar membresía anual.
- El chat queda como borrador pendiente y aparece en Mi acceso.
- Admin puede probar y supervisar sin límite, sin requerir membresía.
- Se conserva la publicación ilimitada para membresías activas.

## Archivos

Reemplazar en la raíz:

- `app.js`
- `styles.css`
- `service-worker.js`
- `manifest.json`
- `vercel.json`

Aplicar `PATCH-INDEX-v4.9.36.8.txt` sobre `index.html`.

## SQL

No requiere SQL nuevo.

## Commit sugerido

`Agregar gate de membresía a Chat negocio y liberar Admin v4.9.36.8`
