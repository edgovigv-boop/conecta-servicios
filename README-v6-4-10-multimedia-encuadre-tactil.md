# Conecta Servicios v6.4.10 - Multimedia encuadre táctil

## Objetivo

Mejorar el editor de encuadre para que se parezca más al ajuste de redes sociales: el usuario puede acomodar la foto o video directamente con los dedos.

## Qué agrega

Sobre la vista previa de multimedia:

- Vista previa mucho más grande.
- Guía visual de encuadre.
- Arrastrar con un dedo para mover la imagen o video.
- Pellizcar con dos dedos para acercar o alejar.
- En escritorio, la rueda del mouse acerca o aleja.
- Se conservan botones de respaldo:
  - Ver completo
  - Llenar pantalla
  - + Tamaño
  - − Tamaño
  - Arriba / Abajo / Izquierda / Derecha
  - Centrar

## Qué se guarda

La publicación guarda los mismos campos de v6.4.9:

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
- `README-v6-4-10-multimedia-encuadre-tactil.md`

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

Agrega encuadre tactil de multimedia

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6410

## Checklist

1. Confirmar que aparece `v6.4.10`.
2. Editar una publicación con video.
3. Confirmar que la vista previa es más grande.
4. Arrastrar con un dedo sobre el video.
5. Pellizcar con dos dedos para acercar/alejar.
6. Probar `Ver completo`.
7. Guardar cambios.
8. Confirmar que el Home respeta el encuadre elegido.
9. Confirmar que mensajes siguen funcionando.
