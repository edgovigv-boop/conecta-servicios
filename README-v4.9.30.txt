Conecta Servicios v4.9.30 — Multimedia real con membresía

Cambios principales:
- Admin puede subir foto de publicaciones plantilla del Home Feed usando Supabase Storage.
- Admin puede subir/cambiar foto de publicaciones reales desde el editor.
- Usuarios con membresía activa pueden subir 1 foto principal al publicar.
- Usuarios sin membresía pueden avanzar en la encuesta, pero el envío final sigue pidiendo membresía anual de $98 MXN.
- Explorar conserva el feed real visual con imagen, Contactar y Publicar algo parecido.
- No se cambió Supabase de forma destructiva; las imágenes se guardan como archivos y se referencia la URL en la publicación.

Supabase requerido:
1. Crear buckets de Storage:
   - template-media
   - publication-media
2. Hacerlos públicos o configurar políticas de lectura/escritura adecuadas para la app.
3. Tamaño máximo validado por frontend: 3 MB.
4. Formatos permitidos: JPG, PNG, WEBP.

Compatibilidad:
- Para no romper la tabla publicaciones, la app sigue guardando la URL multimedia dentro de la descripción con el marcador “Multimedia: URL”.
- Si después agregas columnas image_url, media_type, media_path, media_created_at, puede migrarse a una estructura más limpia.

Opcional para que los cambios de fotos de plantillas se vean en todos los dispositivos:
Crear una tabla plantillas_home_overrides con al menos:
- template_id text primary key
- image_url text
- object_position text
- updated_at timestamptz

La app intenta guardar/leer esa tabla si existe. Si no existe, usa localStorage como respaldo.

Validación rápida:
1. Abrir con ?admin=1 e ingresar PIN.
2. Admin → Editar multimedia del Home Feed piloto → Subir foto.
3. Confirmar que Home muestra la nueva foto.
4. Crear publicación guiada → Agregar foto principal → Publicar con membresía marcada.
5. Explorar → confirmar que la publicación aparece con imagen.
6. Admin → Editar publicación real → subir/cambiar foto.

Commit sugerido:
Actualización v4.9.30 - Multimedia real con membresía
