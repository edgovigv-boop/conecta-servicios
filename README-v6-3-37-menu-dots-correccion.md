# Conecta Servicios v6.3.37 - Corrección menú inferior y puntitos

## Qué corrige

- Corrige la barra inferior para que quede centrada.
- Reduce realmente el alto de la barra inferior.
- Hace la barra inferior más transparente, sin fondo blanco pesado.
- Mantiene el botón + centrado dentro de la barra.
- Cambia la estructura del carrusel para que los puntitos sean estáticos.
- Los puntitos ya no se mueven con la primera foto.
- Los puntitos quedan centrados arriba de la descripción.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-37-menu-dots-correccion.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL.

## Commit sugerido

Corrige menú inferior y puntitos del carrusel

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6337

## Checklist

1. Confirmar que se vea v6.3.37.
2. Confirmar que la barra inferior está centrada.
3. Confirmar que la barra inferior es más pequeña.
4. Confirmar que la barra inferior se ve transparente.
5. Confirmar que el botón + queda centrado.
6. Confirmar que los puntitos del carrusel están centrados arriba de la descripción.
7. Deslizar fotos y confirmar que los puntitos no se mueven con la imagen.
8. Probar mensaje, compartir, publicar y tienda.
