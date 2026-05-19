# Conecta Servicios v4.9.36.5

Hotfix de prueba para:

- Evitar que el botón Admin aparezca flotante o arriba de la app.
- Mantener el acceso Admin únicamente dentro de Oficina / Oficina de registro.
- Corregir el botón "Copiar enlace" de Mi acceso / Membresía.
- Usar enlaces seguros tipo `/?section=membresia&ref=CODIGO`, para evitar 404 en Vercel.
- Agregar rewrites opcionales en `vercel.json` para que `/membresia`, `/mi-acceso` y `/acceso` también funcionen si alguien abre un enlace viejo.

## Archivos a reemplazar

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json

Aplicar también `PATCH-INDEX-v4.9.36.5.txt` en `index.html`.

## SQL

No requiere SQL nuevo.

## Commit sugerido

Corregir enlace de membresía y mover Admin a Oficina v4.9.36.5
