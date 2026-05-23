# Conecta Servicios v6.3.12 - Publicaciones sincronizadas y video más estable

## Qué corrige

Esta versión corrige la regresión donde una publicación borrada seguía apareciendo en el celular que no publicó, y refuerza el flujo de sincronización para publicaciones nuevas.

También mejora el manejo de video corto:

- Limpia la URL de Supabase antes de subir multimedia.
- Si el video no logra subir, la app avisa claramente: "Publicación visible. El video no subió; toca Reintentar.".
- Conserva la publicación local del dueño mientras está subiendo, pero elimina copias públicas que ya no aparecen en el muro remoto.

## Archivos para subir

Sube/reemplaza:

- index.html
- app.js
- styles.css
- manifest.json
- service-worker.js
- README-v6-3-12-publicaciones-video-sync.md

## No tocar

- api
- assets
- SQL

## Commit sugerido

Corrige sincronización de publicaciones y video pendiente

## Prueba recomendada

1. Abrir en ambos celulares:
   https://conecta-servicios.vercel.app/?v=6312

2. Publicar una FOTO desde celular A.
3. Confirmar que aparece en celular B.
4. Borrar desde celular A.
5. Confirmar que desaparece en celular B.
6. Probar un video corto. Si queda pendiente, tocar Reintentar.

## Nota importante

Si un video de 5 segundos queda pendiente, el problema ya no es el muro público: es la subida del archivo a Supabase Storage. En ese caso conviene probar primero con video más ligero o revisar políticas/límite del bucket `publication-media`.
