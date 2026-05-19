Conecta Servicios v4.9.28 — Multimedia y Feed Real

Cambios principales:
- Admin puede cambiar fotos de publicaciones piloto del Home Feed mediante URL pública.
- Publicaciones reales pueden incluir URL de foto/multimedia en el flujo de publicación.
- Explorar muestra publicaciones reales como tarjetas visuales tipo feed.
- Al tocar una publicación real, se abre una vista visual tipo feed con contacto, compartir y publicar algo parecido.
- No se toca Supabase ni se modifica esquema de base de datos.
- La multimedia se guarda de forma compatible agregando la URL a la descripción como "Multimedia: URL".
- PWA/cache actualizado a v4.9.28.

Validación:
1. Abrir Home: debe cargar el feed.
2. Ir a Explorar: los registros reales aparecen en formato visual.
3. Abrir una publicación real: debe verse como feed con imagen.
4. Publicar algo parecido: debe abrir encuesta guiada con plantilla.
5. Admin (?admin=1): debe aparecer panel para editar fotos del Home Feed piloto.
