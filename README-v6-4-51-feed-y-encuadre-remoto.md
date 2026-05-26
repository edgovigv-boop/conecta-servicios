# Conecta Servicios v6.4.51 - Feed y encuadre remoto

## Objetivo

Corregir dos problemas vistos en celulares de prueba:

1. Un celular abrió la app, pero quedó en una vista casi blanca con `Prueba otra búsqueda...`.
2. El video que se centró desde admin se veía bien en tu celular, pero no en otros celulares.

## Qué corrige

- Si un celular queda en un filtro vacío, la app vuelve automáticamente a `Para ti`.
- Si no hay publicaciones locales, muestra `Cargando publicaciones` y fuerza lectura pública desde Supabase.
- La lectura pública usa cache-busting para evitar datos viejos.
- El encuadre admin se guarda con campos explícitos:
  - `mediaFit`
  - `mediaScale`
  - `mediaX`
  - `mediaY`
  - `fit`
  - `scale`
  - `x`
  - `y`
  - `frameUpdatedAt`
- El API conserva esos campos dentro del JSON de la publicación.
- Después de guardar encuadre, se vuelve a leer la nube para confirmar el dato.
- La mezcla local/remota da prioridad al encuadre más reciente.
- No toca mensajes, perfil, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-51-feed-y-encuadre-remoto.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige feed vacio y encuadre remoto

## Después de Vercel Ready

Abrir en todos los celulares:

https://conecta-servicios.vercel.app/?v=6451

Para admin:

https://conecta-servicios.vercel.app/?v=6451&admin=media

## Checklist

1. Celular que salió en blanco: abrir `?v=6451`.
2. Confirmar que carga publicaciones o muestra `Cargando publicaciones` y después el feed.
3. Admin: abrir `?v=6451&admin=media`.
4. Ajustar el video.
5. Guardar y volver.
6. En otros celulares abrir `?v=6451`.
7. Confirmar que el video ya se ve con el mismo encuadre.
8. Confirmar mensajes y perfil.
