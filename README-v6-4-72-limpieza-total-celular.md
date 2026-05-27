# Conecta Servicios v6.4.72 — Limpieza total del celular afectado

## Commit sugerido

Agrega limpieza total del celular afectado

## Qué corrige

El celular afectado seguía cargando datos viejos aunque la limpieza normal ya había quitado caché y service worker.

Esta versión reemplaza `limpiar-cache.html` por una limpieza total:

- CacheStorage
- Service Worker
- localStorage
- sessionStorage
- IndexedDB

## Qué NO borra

- No borra Supabase
- No borra publicaciones de la nube
- No borra Storage
- No modifica mensajes en la nube
- No modifica la app en otros celulares

## Archivos incluidos

- `limpiar-cache.html`
- `service-worker.js`
- `README-v6-4-72-limpieza-total-celular.md`

## Después de Vercel Ready

En el celular que falla abrir:

https://conecta-servicios.vercel.app/limpiar-cache.html

Dejar que redirija solo.

Si no redirige, tocar:

Entrar a la app

## Importante

No subir más `feed-rescue.js`.  
Si existe en el repositorio, retirarlo en una limpieza posterior.
