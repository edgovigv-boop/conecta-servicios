# Conecta Servicios v6.4.73 — Restaura app.js completo

## Causa encontrada

El archivo `app.js` actual en el repositorio quedó incompleto/truncado.  
No es solo caché: si `app.js` se corta, la app no puede terminar de cargar ni renderizar el feed, mensajes o perfil.

## Solución

Este ZIP restaura `app.js` completo desde la última base estable:

`v6.4.48-encuadre-botones-arriba`

Además actualiza:

- `index.html` para cargar `app.js?v=6.4.73-restaura-appjs-completo`
- `service-worker.js` para evitar versiones mezcladas
- `limpiar-cache.html` para limpiar el celular afectado y entrar a la app nueva

## Archivos incluidos

- `app.js`
- `index.html`
- `service-worker.js`
- `limpiar-cache.html`
- `README-v6-4-73-restaura-appjs-completo.md`

## Commit sugerido

Restaura appjs completo y estabiliza cache

## Orden recomendado

1. Subir estos archivos a GitHub.
2. Esperar Vercel Ready.
3. En tu celular abrir:

   https://conecta-servicios.vercel.app/limpiar-cache.html

4. Si no redirige, tocar “Entrar a la app”.

## No subir feed-rescue

No subir `feed-rescue.js`.  
Si existe en GitHub, debe quedarse sin ser llamado desde `index.html`.

## Qué NO toca

- No toca Supabase
- No toca Storage
- No toca API
- No toca SQL
