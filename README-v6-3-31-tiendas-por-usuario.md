# Conecta Servicios v6.3.31 - Tiendas por usuario

## Objetivo

Ajustar el concepto de Tienda: no debe ser solo un filtro general de VENDO, sino una tienda por usuario.

## Qué cambia

- La pestaña `Tienda` abre la tienda del usuario actual.
- Cada usuario tiene una tienda con solo sus publicaciones `VENDO`.
- Las publicaciones `OFREZCO` y `NECESITO` no aparecen dentro de la tienda.
- Al tocar el nombre/autor de una publicación, se abre la cuenta/tienda de ese usuario.
- En `Siguiendo` ahora se muestran usuarios seguidos como lista, no publicaciones mezcladas.
- Cada usuario seguido tiene botón `Ver tienda`.
- El usuario puede seguir usando corazón, mensaje, compartir y seguir.
- No cambia la lógica de publicación, videos ni mensajes.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-31-tiendas-por-usuario.md

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

Agrega tiendas por usuario

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6331

## Checklist de prueba

1. Confirmar que se vea `v6.3.31`.
2. Tocar `Tienda` y verificar que abra `Mi tienda`.
3. Confirmar que solo aparezcan publicaciones propias de categoría VENDO.
4. Crear o revisar una publicación propia OFREZCO/NECESITO y confirmar que no aparece en tienda.
5. Tocar el nombre de otro usuario en una publicación y verificar que abre su tienda.
6. Seguir a un usuario.
7. Entrar a `Siguiendo`.
8. Confirmar que aparece como usuario con botón `Ver tienda`.
9. Probar regresar al Home sin que saque de la app.
10. Probar publicar, lupa, mensajes y video corto.
