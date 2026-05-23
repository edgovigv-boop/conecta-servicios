# Conecta Servicios v6.3.1 - Publicación confiable y tiempo real

## Problema que corrige

Esta versión corrige el punto más urgente del MVP:

- Evita publicaciones duplicadas por tocar varias veces PUBLICAR.
- Muestra la publicación inmediatamente en el feed con estado “Publicando...”.
- Bloquea el botón mientras se publica.
- Usa un solo ID estable por publicación.
- Agrega deduplicación por ID y por doble publicación accidental.
- Mejora el manejo de video para no guardarlo como base64 pesado en localStorage.
- Guarda videos e imágenes en IndexedDB para vista previa local y reintento.
- Intenta subir multimedia a Supabase Storage usando /api/public-config si está disponible.
- Sincroniza el feed automáticamente cada 12 segundos.
- Sincroniza al volver a primer plano.
- Agrega botón “Reintentar” si la publicación queda local.

## Archivos para subir

Subir/reemplazar en la raíz del repositorio:

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js

También puedes subir:

- README-v6-3-1-publicacion-confiable.md

## No tocar

No borrar ni reemplazar:

- api
- assets

## Cómo probar foto

1. Abrir la app.
2. Tocar +.
3. Elegir una foto.
4. Escribir descripción, zona y categoría.
5. Tocar PUBLICAR.
6. Debe aparecer inmediatamente en el feed.
7. Si hay conexión, debe cambiar a publicada.
8. Si falla, debe quedar como guardada en este dispositivo.

## Cómo probar video

1. Tocar +.
2. Elegir video ligero.
3. Publicar.
4. Debe verse de inmediato como vista previa.
5. Si puede subir a Storage, quedará pública.
6. Si no puede subir, queda local con botón Reintentar.

## Cómo probar doble clic en PUBLICAR

1. Entra a publicar.
2. Toca PUBLICAR varias veces rápido.
3. El botón debe cambiar a PUBLICANDO...
4. No debe crear duplicados.
5. Al refrescar, debe verse una sola publicación.

## Cómo probar publicación sin conexión

1. Desactiva internet.
2. Publica.
3. La publicación debe quedar visible localmente.
4. Debe mostrar “Guardada en este dispositivo”.
5. Debe aparecer botón Reintentar.

## Cómo probar sincronización con otra pestaña o celular

1. Abre la app en dos pestañas o dos dispositivos.
2. Publica desde uno.
3. En el otro debe aparecer en pocos segundos.
4. También debe aparecer al volver a primer plano.

## Commit sugerido

Corrige publicación confiable sin duplicados y sincronización rápida

## Checklist

- Home muestra VENDO, OFREZCO y NECESITO.
- Barra inferior muestra Inicio, Siguiendo, +, Mensajes y Perfil.
- El botón + abre multimedia del dispositivo.
- Se puede elegir foto.
- Se puede elegir video ligero.
- Se puede escribir descripción.
- Se puede elegir zona.
- Se puede elegir categoría.
- Se puede publicar.
- La publicación aparece de inmediato.
- El botón dice PUBLICANDO...
- No hay duplicados por doble clic.
- Refrescar no duplica.
- Reintentar no duplica.
- La búsqueda funciona.
- Los filtros funcionan.
- Seguir funciona.
- Mensajes funciona.
- Perfil permite guardar nombre.
- Editar y borrar propias publicaciones funciona.
