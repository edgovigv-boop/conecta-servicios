# Conecta Servicios v6.4.9 - Multimedia encuadre

## Objetivo

Permitir ajustar cómo se ve una foto o video dentro de una publicación, especialmente cuando un video promocional se ve demasiado grande y corta información importante.

## Qué agrega

En Nueva publicación / Editar publicación aparece la sección:

- Encuadre de multimedia
- Ver completo
- Llenar pantalla
- + Tamaño
- − Tamaño
- Arriba / Abajo / Izquierda / Derecha
- Centrar

## Cómo usarlo

- `Ver completo`: muestra todo el video o imagen, útil cuando hay texto, precios o información en los bordes.
- `Llenar pantalla`: mantiene el estilo tipo feed, más visual, pero puede recortar bordes.
- `+ Tamaño` y `− Tamaño`: acercan o alejan.
- Flechas: mueven el punto de enfoque.
- `Centrar`: regresa al encuadre inicial.

## Qué se guarda

La publicación guarda:

- `mediaFit`
- `mediaScale`
- `mediaX`
- `mediaY`

Estos valores se aplican en el feed sin volver a subir el archivo.

## No cambia

- No toca Supabase.
- No toca `api/messages.js`.
- No cambia envío/recepción de mensajes.
- No cambia videos en Storage.
- No cambia SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-9-multimedia-encuadre.md`

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

Agrega encuadre editable de multimedia

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=649

## Checklist

1. Confirmar que aparece `v6.4.9`.
2. Editar una publicación con video.
3. Probar `Ver completo`.
4. Probar `Llenar pantalla`.
5. Probar `+ Tamaño` y `− Tamaño`.
6. Probar flechas izquierda/derecha/arriba/abajo.
7. Guardar cambios.
8. Confirmar que el video se ve con el encuadre elegido en Home.
9. Confirmar que mensajes siguen funcionando.
