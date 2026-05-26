# Conecta Servicios v6.4.52 - Recupera feed público

## Objetivo

Corregir el celular de prueba que abría la app pero quedaba en una pantalla casi blanca con el mensaje `Toca la lupa...`.

## Qué corrige

- Si un celular quedó en filtro/búsqueda vacía, vuelve automáticamente a `Para ti`.
- Si el dispositivo tenía IDs borrados o datos locales de pruebas anteriores, no bloquean el muro público.
- Si hay publicaciones públicas en Supabase, se fuerza la recuperación del feed.
- Si tarda en cargar, muestra `Cargando publicaciones` en lugar de `Prueba otra búsqueda`.
- Conserva la corrección de encuadre remoto de la v6.4.51.
- No toca mensajes, perfil, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-52-recupera-feed-publico.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Recupera feed publico en celulares de prueba

## Después de Vercel Ready

Abrir en el celular de prueba:

https://conecta-servicios.vercel.app/?v=6452

Para admin:

https://conecta-servicios.vercel.app/?v=6452&admin=media

## Checklist

1. Abrir `?v=6452` en el celular que estaba blanco.
2. Esperar unos segundos si aparece `Cargando publicaciones`.
3. Confirmar que el feed entra sin `Toca la lupa...`.
4. Confirmar que el otro celular conserva el encuadre del video.
5. Confirmar mensajes y perfil.
