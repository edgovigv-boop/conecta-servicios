# Diagnóstico local Conecta Servicios v1

## Qué es

Página independiente para revisar por qué algunos celulares entran a rutas recuperadas o se congelan.

## Archivo incluido

- `diagnostico-local.html`

## Qué NO hace automáticamente

- No toca Supabase.
- No borra publicaciones de la nube.
- No cambia `app.js`.
- No cambia `api/publications.js`.
- No cambia diseño.
- No cambia mensajes en la nube.

## Cómo usarlo

1. Subir este archivo a la raíz del repositorio.
2. Esperar Vercel Ready.
3. En cada celular abrir:

   https://conecta-servicios.vercel.app/diagnostico-local.html?v=1

4. Tocar “Copiar diagnóstico”.
5. Comparar:
   - celular fiel
   - celular esposa
   - celular que falla

## Qué buscamos

- Perfil con `avatarData` muy grande.
- Publicaciones locales con `mediaData`, `blob:` o `data:`.
- Favoritos/seguidos locales que congelen Siguiendo.
- Última tarjeta recuperada: `cs_v6480_last_bad_post`.

## Acciones disponibles

La página tiene botones opcionales para limpiar solo datos locales del celular:

- Limpiar errores temporales
- Quitar foto de perfil local pesada
- Limpiar datos locales pesados de publicaciones
- Limpiar favoritos/seguidos locales

Nada de eso borra Supabase.
