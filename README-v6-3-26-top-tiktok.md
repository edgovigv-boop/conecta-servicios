# Conecta Servicios v6.3.26 - Interfaz superior estilo TikTok

## Objetivo

Actualizar la parte superior del Home sin tocar publicación, chat ni video.

## Qué cambia

- Se elimina la barra de búsqueda grande del Home.
- Se deja solo el ícono de lupa.
- Al tocar la lupa aparece una búsqueda compacta flotante.
- Se muestra `Para ti` y el municipio visible.
- La parte superior queda fija al scrollear.
- La parte superior es transparente/degradada para que el contenido se vea más completo.
- Las categorías VENDO / OFREZCO / NECESITO quedan como chips pequeños y transparentes debajo.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-26-top-tiktok.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## Commit sugerido

Actualiza interfaz superior estilo TikTok

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6326

## Checklist de prueba

1. Confirmar que se vea `v6.3.26`.
2. Confirmar que ya no aparezca la barra de búsqueda grande.
3. Confirmar que aparece `Para ti` y municipio.
4. Confirmar que la lupa abre búsqueda compacta.
5. Confirmar que VENDO, OFREZCO y NECESITO siguen filtrando.
6. Hacer scroll y confirmar que la barra superior no desaparece.
7. Publicar foto o video corto para confirmar que no se rompió publicación.
8. Abrir mensajes para confirmar que no se rompió chat.
