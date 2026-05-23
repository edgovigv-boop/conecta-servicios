# Conecta Servicios v6.3.3 - Publicar primero

## Qué corrige

Esta versión corrige dos problemas reportados:

1. La publicación no se veía en otro celular.
2. Después de publicar, la pantalla dificultaba poner descripción.

## Cambio principal

Ahora la app intenta publicar primero los datos básicos:

- descripción
- zona
- categoría
- nombre visible
- fecha
- estado

Después intenta subir la foto o video.

Esto significa que, aunque el video tarde o falle, la publicación debe aparecer en otro celular como tarjeta pública con aviso de video pendiente.

## Formulario más claro

La descripción ahora aparece antes de la vista previa grande.

El flujo queda:

1. Tocar +
2. Elegir foto/video
3. Escribir descripción
4. Elegir zona
5. Elegir VENDO / OFREZCO / NECESITO
6. PUBLICAR

## Búsqueda

La búsqueda mantiene la corrección anterior: no debe cerrar teclado porque solo actualiza el feed.

## Punto técnico importante

Si la publicación completa todavía no aparece en otro celular, hay que revisar /api/publications y las variables de Vercel:

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Para multimedia:

- SUPABASE_ANON_KEY

El proyecto ya tiene api/public-config.js, pero si faltan variables en Vercel, la multimedia no podrá subir.

## Archivos para subir

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js
- README-v6-3-3-publicar-primero.md

## No tocar

- api
- assets

## Commit sugerido

Publica primero datos básicos y corrige descripción móvil

## Prueba rápida

1. Subir estos archivos.
2. Abrir la app en celular A.
3. Tocar +.
4. Elegir video o foto.
5. Confirmar que puedes escribir descripción.
6. Publicar.
7. Abrir celular B.
8. Esperar 7 segundos o refrescar.
9. Debe aparecer la publicación aunque el video esté pendiente.
