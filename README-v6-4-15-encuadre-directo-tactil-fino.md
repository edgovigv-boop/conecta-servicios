# Conecta Servicios v6.4.15 - Encuadre directo táctil fino

## Objetivo

Afinar el modo `Encuadrar aquí` para que el gesto táctil funcione mejor directamente sobre la publicación.

## Qué corrige

- Mejora el pellizco para ampliar y reducir desde la publicación.
- Hace más sensible el zoom con dos dedos.
- Evita que el video o imagen capture el gesto antes que el editor.
- Mejora el arrastre con un dedo.
- Amplía el rango de movimiento y zoom.
- Evita saltos cuando se levanta un dedo durante el pellizco.
- Mantiene Guardar y Cancelar sobre la publicación.
- Mantiene doble toque para alternar Completo/Llenar.
- No obliga a entrar a Editar.

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
- `README-v6-4-15-encuadre-directo-tactil-fino.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Afina encuadre tactil directo

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6415

## Checklist

1. Confirmar que aparece `v6.4.15`.
2. En una publicación propia, tocar `Encuadrar aquí`.
3. Arrastrar con un dedo.
4. Pellizcar con dos dedos para ampliar.
5. Pellizcar con dos dedos para reducir.
6. Levantar un dedo y confirmar que no salta el encuadre.
7. Doble toque para cambiar Completo/Llenar.
8. Tocar Guardar.
9. Confirmar que el encuadre se mantiene.
10. Confirmar que Mensajes sigue funcionando.
