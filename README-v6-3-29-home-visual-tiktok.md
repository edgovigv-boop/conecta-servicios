# Conecta Servicios v6.3.29 - Home visual estilo red social

## Objetivo

Hacer que la imagen o video sea el protagonista del Home, inspirado en la lógica visual de TikTok/Reels, sin romper búsqueda, publicación, mensajes ni video.

## Qué cambia

- La publicación ocupa mucha más pantalla.
- La barra superior queda fija, transparente y más ligera.
- Se muestran Municipio, Siguiendo, Tienda, Para ti y lupa.
- VENDO / OFREZCO / NECESITO quedan como chips más pequeños.
- Corazón, mensaje, compartir y seguir quedan en columna lateral discreta.
- La información de la publicación queda sobre un degradado inferior, no como bloque blanco grande.
- Los botones de video “Recargar video” y “Ver grande” quedan más pequeños.
- La descripción se recorta visualmente para no hacer gigante la tarjeta.
- La barra inferior se mantiene, solo con ajuste ligero.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-29-home-visual-tiktok.md

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

Mejora Home visual estilo red social

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6329

## Checklist de prueba

1. Confirmar que se vea `v6.3.29`.
2. Ver que la publicación visual domina la pantalla.
3. Confirmar que la barra superior sea transparente y fija.
4. Probar la lupa y escribir sin que se esconda el teclado.
5. Buscar “refrigerador” y confirmar que encuentra la publicación.
6. Probar VENDO, OFREZCO y NECESITO.
7. Probar corazón, mensaje, compartir y seguir.
8. Reproducir un video corto dentro de la app.
9. Publicar una foto o video corto.
10. Abrir mensajes y Perfil.
11. No avanzar si hay bloqueo visual grave en celular.
