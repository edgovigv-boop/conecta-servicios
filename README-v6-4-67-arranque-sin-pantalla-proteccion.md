# Conecta Servicios v6.4.67 - Arranque sin pantalla de protección

## Objetivo

Quitar el problema donde la app muestra:

`La app se protegió de una pantalla en blanco`

y no permite entrar a Inicio, Mensajes o Perfil.

## Base usada

Se parte de la base estable:

`v6.4.48-encuadre-botones-arriba`

## Qué corrige

- Elimina la pantalla técnica de protección como salida principal.
- Si hay un error de render, la app intenta recuperarse dentro del Home.
- Si una publicación viene dañada, se omite esa tarjeta sin tumbar toda la app.
- Quita físicamente `feed-title` del Home para evitar el cuadro Buscar/OFREZCO abajo.
- Fuerza estilos nuevos por versión para limpiar CSS viejo.
- Mantiene Mensajes, Perfil, Encuadre, Encuadre admin, multimedia y barra inferior.
- No toca Supabase, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-67-arranque-sin-pantalla-proteccion.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Corrige arranque sin pantalla de proteccion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6467

Si un celular insiste con caché vieja:

https://conecta-servicios.vercel.app/?v=6467&clearcache=1

Para admin de encuadre:

https://conecta-servicios.vercel.app/?v=6467&admin=media

## Checklist

1. Ya no debe aparecer “La app se protegió de una pantalla en blanco”.
2. Debe abrir Inicio.
3. Debe abrir Mensajes.
4. Debe abrir Perfil.
5. No debe aparecer el cuadro Buscar/OFREZCO abajo.
6. El feed debe verse como publicación completa.
