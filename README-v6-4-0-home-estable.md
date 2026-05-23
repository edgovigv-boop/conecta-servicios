# Conecta Servicios v6.4.0 - Home estable

## Objetivo

Estabilizar el Home tomando como base funcional y visual la v6.3.41-perfil-simple-iconos.

Esta versión evita seguir agregando parches pequeños y concentra la corrección en dos puntos:

1. Descripción larga tipo TikTok con `...leer` / `...ocultar`.
2. Corazón de preferencias sin contador: `♡` → `❤️`.

## Qué se limpió / consolidó

Se revisaron los bloques visuales del Home y se dejó un bloque consolidado final para:

- `post-card`
- `media-area`
- `post-body`
- `post-description`
- `post-action-row`
- `heart-action`
- `icon-only-action`

También se neutraliza la columna lateral vieja (`media-bottom`) para evitar duplicados de corazón/mensaje/compartir con contadores.

## Qué se corrigió

- La descripción corta se muestra siempre.
- Si la descripción es larga, aparece `...leer`.
- Al tocar `...leer`, la descripción se despliega hacia arriba sobre la publicación.
- Si el texto desplegado es largo, tiene scroll interno.
- Al tocar `...ocultar`, vuelve a la vista corta.
- El corazón ya no muestra contador.
- El corazón aparece inicialmente como `♡`.
- Al tocarlo cambia a `❤️` y se guarda como preferencia para `Para ti`.
- Al tocarlo otra vez vuelve a `♡` y se quita de preferencias.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-0-home-estable.md`

## SQL

No requiere SQL.

## Deploy

No se hizo deploy automático.

## Commit sugerido

Estabiliza Home descripcion y corazon

## URL de prueba después de deploy manual

https://conecta-servicios.vercel.app/?v=640

## Checklist de pruebas

1. Confirmar que aparece `v6.4.0`.
2. Abrir una publicación con descripción corta.
3. Confirmar que la descripción corta se ve normal.
4. Abrir una publicación con descripción larga.
5. Confirmar que aparece `...leer`.
6. Tocar `...leer`.
7. Confirmar que la descripción se despliega hacia arriba.
8. Si el texto es largo, confirmar scroll interno.
9. Tocar `...ocultar`.
10. Confirmar que vuelve a vista corta.
11. Confirmar que el corazón aparece como `♡`.
12. Tocar corazón y confirmar que cambia a `❤️`.
13. Volver a tocar y confirmar que cambia a `♡`.
14. Confirmar que no aparece contador de corazón.
15. Confirmar que Mensaje funciona.
16. Confirmar que Compartir funciona.
17. Confirmar que Audio funciona en videos.
18. Confirmar que Publicar sigue funcionando.
19. Confirmar que Perfil sigue guardando nombre y foto.
20. Confirmar que la barra inferior sigue centrada.
21. Confirmar que búsqueda con lupa no cierra teclado.
22. Confirmar que Tienda por usuario sigue funcionando.
23. Confirmar que no se rompieron videos ni fotos.
