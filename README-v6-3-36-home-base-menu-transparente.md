# Conecta Servicios v6.3.36 - Home base y menú transparente

## Qué corrige

- Baja la información de la publicación hacia la base del video/foto, usando el espacio que estaba desperdiciado arriba del menú inferior.
- Hace que el contenido visual sea más protagonista.
- Mueve los puntitos del carrusel a una zona más clara sobre la información.
- Reduce el tamaño de la barra inferior.
- Hace la barra inferior más transparente.
- Quita `Siguiendo` de la barra superior porque ya existe abajo.
- Mantiene arriba: municipio/zona, Tienda, Para ti y lupa.
- Conserva los botones horizontales:
  - Me gusta
  - Mensaje
  - Compartir

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-36-home-base-menu-transparente.md

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

Ajusta Home base y menú transparente

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6336

## Checklist

1. Confirmar que se vea v6.3.36.
2. Ver que arriba ya no aparezca Siguiendo.
3. Confirmar que la información de la publicación bajó hacia la base.
4. Confirmar que los puntitos del carrusel aparecen arriba de la información.
5. Confirmar que la barra inferior es más pequeña y transparente.
6. Probar Me gusta, Mensaje y Compartir.
7. Probar lupa, Tienda, publicar y mensajes.
