# Conecta Servicios v6.4.60 - Restauración con caché real

## Objetivo

Restaurar la app desde la base estable v6.4.48/v6.4.59 y corregir el problema real de caché.

## Problema detectado

La versión restaurada seguía pudiendo cargar un `app.js` viejo porque `index.html` tenía:

`app.js?v=6.3.21-video-10min-1gb`

Eso podía hacer que el navegador mostrara pantallas viejas como `Cargando publicaciones`, aunque ya hubiéramos subido otra versión.

## Qué corrige

- `index.html` ahora carga:
  - `app.js?v=6460`
  - `styles.css?v=6460`
  - `manifest.json?v=6460`
- Limpia cachés y service workers una sola vez.
- No borra localStorage.
- No borra perfil.
- No borra mensajes.
- No borra publicaciones.
- No toca SQL.
- No agrega funciones nuevas.
- Mantiene la base estable restaurada.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-60-restauracion-cache-real.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura version estable con cache real

## Después de Vercel Ready

Abrir exactamente:

https://conecta-servicios.vercel.app/?v=6460

La primera vez puede redirigir sola a:

https://conecta-servicios.vercel.app/?v=6460&reset=done

## Checklist

1. Confirmar que ya no aparece `Cargando publicaciones`.
2. Confirmar que ya no aparece el cuadro Buscar/OFREZCO mal ubicado.
3. Confirmar que mensajes abre.
4. Confirmar que perfil abre.
5. Confirmar que el feed se ve como estaba antes de los cambios experimentales.
