Conecta Servicios v4.9.31 — Hotfix multimedia Admin

Cambios:
- Al subir imagen desde Admin al bucket template-media, la app ahora obtiene y guarda la URL pública completa.
- La URL pública se guarda como override local y se intenta guardar en Supabase como image_url_override.
- Si la tabla remota aún usa image_url, la app intenta fallback a image_url.
- Publicaciones reales subidas a publication-media guardan image_url, media_path, media_type y media_created_at cuando la tabla lo permite.
- Si la tabla publicaciones todavía no tiene columnas multimedia, la app conserva la compatibilidad guardando la URL dentro de la descripción.
- La vista previa de Admin ahora tiene fallback visual cuando la imagen falla.

Supabase:
- Buckets requeridos: template-media y publication-media.
- Columnas recomendadas en publicaciones: image_url, media_type, media_path, media_created_at.
- Opcional/recomendado: correr supabase-v4.9.31-plantillas-home-overrides.sql para que las fotos de plantillas se conserven para todos los usuarios.

Validación:
1. Entrar con ?admin=1.
2. Admin → Editar multimedia del Home Feed piloto.
3. Seleccionar una foto y tocar Subir foto.
4. Confirmar que el input muestre URL pública completa de Supabase.
5. Confirmar que la vista previa carga correctamente.
6. Volver al Home y revisar que la plantilla use la nueva imagen.
