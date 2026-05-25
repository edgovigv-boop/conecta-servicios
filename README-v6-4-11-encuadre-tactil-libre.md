# Conecta Servicios v6.4.11 - Encuadre táctil libre

## Objetivo

Hacer que el encuadre sea más natural, como en redes sociales: mover la multimedia completa con el dedo, ampliar/reducir con pellizco y quitar los botones inferiores.

## Qué cambia

- Se quitan los botones de abajo del editor de encuadre.
- La vista previa sigue grande.
- Arrastrar con un dedo mueve la multimedia completa.
- El movimiento ya no queda limitado al tamaño visible de la imagen.
- Permite mover más hacia arriba, abajo, derecha e izquierda.
- Pellizcar con dos dedos amplía o reduce con más libertad.
- Doble toque alterna entre:
  - `Completo`
  - `Llenar pantalla`
- En escritorio, la rueda del mouse amplía o reduce.
- Se conserva una guía de encuadre y una indicación breve.

## Qué se guarda

Igual que versiones anteriores:

- `mediaFit`
- `mediaScale`
- `mediaX`
- `mediaY`

No vuelve a subir el archivo; solo cambia cómo se muestra.

## No cambia

- No toca Supabase.
- No toca `api/messages.js`.
- No toca envío/recepción de mensajes.
- No toca SQL.
- No cambia videos ya subidos.
- No modifica Storage.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-11-encuadre-tactil-libre.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## SQL

No requiere SQL.

## Commit sugerido

Libera encuadre tactil de multimedia

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6411

## Checklist

1. Confirmar que aparece `v6.4.11`.
2. Editar publicación con foto o video.
3. Confirmar que ya no aparecen botones debajo de la imagen/video.
4. Arrastrar hacia arriba, abajo, derecha e izquierda.
5. Pellizcar para ampliar/reducir.
6. Probar doble toque para cambiar Completo/Llenar.
7. Guardar.
8. Confirmar que el Home respeta el encuadre elegido.
9. Confirmar que mensajes siguen funcionando.
