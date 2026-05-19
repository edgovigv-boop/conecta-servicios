Conecta Servicios v4.9.32 — Hotfix visualización multimedia

Correcciones:
- Home Feed ahora convierte rutas/URLs de Storage antes de pintar imágenes.
- Si una foto de plantilla no carga, se muestra una foto base limpia y se avisa al admin.
- Al subir foto desde Admin a template-media, la app verifica que la URL pública realmente cargue antes de guardarla.
- Al guardar una URL manual, se valida que abra como imagen pública.
- Se mantiene Supabase, Admin, Explorar y PWA sin cambios destructivos.

Prueba:
1. Entra con ?admin=1.
2. Admin > Editar multimedia del Home Feed piloto.
3. Selecciona archivo y toca Subir foto.
4. Debe aparecer en el Home sin imagen rota.

Si aparece error, revisa que el bucket template-media sea público y tenga políticas de lectura/subida.
