# Conecta Servicios v6.4.12 - Encuadre compacto

## Objetivo

Ajustar el editor de encuadre para que sea más fácil usarlo en celular.

## Qué corrige

- El cuadro de edición ya no ocupa casi toda la pantalla.
- El recuadro ahora tiene proporción más parecida a la publicación.
- La cuadrícula queda dentro del recuadro de publicación.
- Es más fácil bajar la página de edición.
- Se reduce el riesgo de que el navegador haga pull-to-refresh y saque al usuario de editar.
- Si ocurre una recarga accidental durante edición, intenta recuperar la publicación en edición.
- Se mantiene el encuadre táctil:
  - arrastrar
  - pellizcar
  - doble toque para Completo/Llenar

## Qué no cambia

- No toca Supabase.
- No toca `api/messages.js`.
- No toca envío/recepción de mensajes.
- No toca Storage.
- No requiere SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-12-encuadre-compacto.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Compacta editor de encuadre multimedia

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6412

## Checklist

1. Confirmar que aparece `v6.4.12`.
2. Editar una publicación con video.
3. Confirmar que el cuadro de encuadre es más pequeño.
4. Confirmar que la cuadrícula queda acorde al recuadro.
5. Probar arrastrar y pellizcar.
6. Deslizar fuera del recuadro para bajar la página.
7. Guardar.
8. Confirmar que el Home respeta el encuadre.
9. Confirmar que mensajes siguen funcionando.
