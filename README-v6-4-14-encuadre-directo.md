# Conecta Servicios v6.4.14 - Encuadre directo

## Objetivo

Permitir encuadrar una foto o video directamente desde la publicación, sin entrar a Editar.

## Qué agrega

En publicaciones propias aparece el botón:

- `Encuadrar aquí`

Al tocarlo:

- La publicación entra en modo encuadre.
- Se muestra una cuadrícula sobre el contenido real.
- Puedes arrastrar con un dedo para mover la multimedia.
- Puedes pellizcar con dos dedos para ampliar o reducir.
- Doble toque alterna entre `Completo` y `Llenar pantalla`.
- Aparecen botones `Guardar` y `Cancelar` sobre la publicación.
- Guardar sincroniza el nuevo encuadre con Supabase usando la lógica existente de publicaciones.

## Qué no cambia

- No toca `api/messages.js`.
- No cambia chat ni mensajes.
- No cambia Storage.
- No requiere SQL.
- No vuelve a subir el archivo multimedia.
- No modifica Supabase URL ni llaves.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-14-encuadre-directo.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega encuadre directo desde publicacion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6414

## Checklist

1. Confirmar que aparece `v6.4.14`.
2. Abrir Home.
3. En una publicación propia, tocar `Encuadrar aquí`.
4. Arrastrar sobre la foto/video.
5. Pellizcar para acercar/alejar.
6. Doble toque para cambiar Completo/Llenar.
7. Tocar Guardar.
8. Confirmar que el encuadre se mantiene.
9. Revisar en otro celular que el encuadre se ve actualizado.
10. Confirmar que Mensajes sigue funcionando.
