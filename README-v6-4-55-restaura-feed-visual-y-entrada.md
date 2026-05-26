# Conecta Servicios v6.4.55 - Restaura feed visual y entrada

## Objetivo

Corregir el problema visual provocado en v6.4.54:

- El cuadro Buscar / OFREZCO apareció fuera de lugar debajo de la publicación.
- El estado `Cargando publicaciones` quedaba como primera vista en el celular de prueba.
- El botón de actualización no siempre respondía claramente.
- El footer legal se veía encima del feed y estorbaba visualmente.

## Qué corrige

- Quita `feed-title` del Home para que el buscador viejo no se meta bajo la publicación.
- Mantiene solo el menú flotante superior con municipio, carrito, corazón y lupa.
- Oculta el footer legal dentro de la app visual, pero conserva los archivos legales en GitHub.
- Quita el botón visible de `Subir publicaciones de este celular` para evitar desconfigurar el layout.
- Mantiene `Actualizar muro`.
- Agrega binding directo para que `Actualizar muro` responda mejor.
- Mantiene encuadre remoto y protección legal.
- No toca mensajes, perfil, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-55-restaura-feed-visual-y-entrada.md`
- `LICENSE-PROPIETARIA.md`
- `NOTICE-COPYRIGHT.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura feed visual estable

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6455

Para admin de encuadre:

https://conecta-servicios.vercel.app/?v=6455&admin=media

## Checklist

1. Confirmar que ya no aparece el cuadro Buscar/OFREZCO debajo de una publicación.
2. Confirmar que el feed vuelve a verse como publicación completa.
3. Confirmar que el menú flotante superior se conserva.
4. Confirmar que el celular de prueba ya no queda con UI desconfigurada.
5. Confirmar mensajes y perfil.
