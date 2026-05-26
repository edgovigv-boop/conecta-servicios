# Conecta Servicios v6.4.50 - Entrada estable y encuadre global

## Objetivo

Corregir dos problemas:

1. Algunos celulares se quedaban en `Conecta Servicios / Entrando a la app...`.
2. El encuadre admin del video se veía correcto solo en tu celular, pero no en otros.

## Qué corrige

- Vuelve a tomar como base estable la v6.4.48 y elimina la recuperación que podía dejar la app atorada.
- Si una publicación específica causa error visual, se omite esa tarjeta sin tumbar toda la app.
- El Home intenta abrir directo sin mostrar pantalla técnica.
- El encuadre de video/foto se guarda con campos explícitos:
  - `mediaFit`
  - `mediaScale`
  - `mediaX`
  - `mediaY`
  - `fit`
  - `scale`
  - `x`
  - `y`
- El encuadre se guarda también en el item activo del carrusel cuando aplica.
- Después de guardar encuadre, se sincroniza en nube para que otros celulares lo vean.
- Se conserva modo admin de encuadre.
- No toca mensajes, perfil, Supabase, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-50-entrada-estable-y-encuadre-global.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Estabiliza entrada y sincroniza encuadre global

## Después de Vercel Ready

Abrir normal:

https://conecta-servicios.vercel.app/?v=6450

Para admin:

https://conecta-servicios.vercel.app/?v=6450&admin=media

## Checklist

1. Abrir en el celular que se quedaba en `Entrando a la app...`.
2. Confirmar que entra al Home.
3. Abrir admin con `?v=6450&admin=media`.
4. Encuadrar el video de la publicación ajena.
5. Tocar `Guardar y volver`.
6. Abrir en otro celular con `?v=6450`.
7. Confirmar que el encuadre ya se ve centrado también ahí.
8. Confirmar mensajes y perfil.
