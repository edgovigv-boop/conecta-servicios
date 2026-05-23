# Conecta Servicios v6.3.2 - Multicelular + búsqueda estable

## Qué corrige

Esta versión corrige dos problemas reportados después de v6.3.1:

1. La búsqueda solo permitía escribir un carácter y cerraba el teclado.
   - Causa: el Home completo se renderizaba en cada tecla.
   - Corrección: ahora solo se actualiza el feed y no se recrea el input.

2. La publicación no se veía en otro celular.
   - Ahora la publicación se intenta guardar en el muro público aunque el video no logre subirse.
   - Si el video queda pendiente, la publicación de texto/categoría/zona sí puede verse en otro equipo.
   - Si Supabase Storage funciona, el video también se sube y se comparte con otros equipos.
   - Si no funciona Storage, la publicación queda visible pero con aviso de video pendiente.

## Punto importante sobre Vercel

Para que videos y fotos se vean en otros celulares, Vercel debe tener configuradas estas variables:

- SUPABASE_URL
- SUPABASE_ANON_KEY

o sus equivalentes:

- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY

El archivo api/public-config.js ya existe en el proyecto y usa esas variables. Si faltan, la multimedia queda local.

## Archivos para subir

Subir/reemplazar en la raíz del repositorio:

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js

También puedes subir:

- README-v6-3-2-multicelular-busqueda.md

## No tocar

No borrar ni reemplazar:

- api
- assets

## Cómo probar búsqueda

1. Abre la app en celular.
2. Toca la lupa.
3. Escribe varias letras.
4. El teclado no debe cerrarse.
5. El feed debe filtrarse mientras escribes.

## Cómo probar publicación en otro celular

1. Abre la app en celular A.
2. Publica una foto.
3. Abre la app en celular B.
4. Espera hasta 8 segundos o refresca.
5. Debe aparecer la publicación.
6. Repite con video ligero.
7. Si el video no sube, debe aparecer al menos la publicación con aviso de video pendiente.

## Commit sugerido

Corrige búsqueda móvil y publicación visible en otro celular

## Limitación honesta

Si la publicación sigue sin verse en otro celular, el problema ya no está en el flujo visual del frontend: hay que revisar que /api/publications esté conectado a Supabase y que Vercel tenga las variables necesarias.
