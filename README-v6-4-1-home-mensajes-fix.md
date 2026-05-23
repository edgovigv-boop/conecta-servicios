# Conecta Servicios v6.4.1 - Home mensajes fix

## Objetivo

Corregir dos problemas detectados en v6.4.0:

1. La publicación larga no mostraba `...leer`.
2. Los mensajes dejaron de llegar al celular dueño de la publicación.

## Qué se corrige

### Descripción larga

- Se baja el umbral para que `...leer` aparezca antes.
- Ahora una descripción de más de 65 caracteres o más de una línea se considera larga.
- Se refuerza CSS para que `...leer` sea visible.
- Se mantiene `...ocultar` en vista expandida.
- Se conserva scroll interno si el texto es muy largo.

### Mensajes / dueño de publicación

- Se elimina el comportamiento peligroso que aplicaba el perfil a todas las publicaciones visibles.
- Guardar perfil ya NO cambia el `ownerId` de publicaciones ajenas.
- Subir foto de perfil ya NO cambia el `ownerId` de publicaciones visibles.
- El perfil solo se aplica a publicaciones que ya son realmente del usuario actual.
- El diagnóstico ahora muestra `userId` y `ownerId` de publicaciones locales para poder reparar si una publicación quedó con dueño equivocado.

## SQL opcional

Incluye:

- `repair-owner-publicacion-mensajes-v6-4-1.sql`

No se sube a GitHub. Solo se usa si los mensajes siguen sin llegar porque la publicación ya quedó guardada en Supabase con `owner_id` incorrecto.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-1-home-mensajes-fix.md`

## No tocar

- `styles.css`
- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `assets`

## SQL

No requiere SQL para la app.
El SQL incluido es solo de reparación si el owner_id ya quedó mal en Supabase.

## Commit sugerido

Corrige descripcion larga y owner de mensajes

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=641

## Checklist

1. Confirmar que aparece `v6.4.1`.
2. Abrir publicación larga de chofer/mandados.
3. Confirmar que aparece `...leer`.
4. Tocar `...leer`.
5. Confirmar que aparece `...ocultar`.
6. Probar enviar mensaje desde otro celular.
7. Confirmar si llega al celular dueño de la publicación.
8. Si no llega, copiar diagnóstico del celular dueño y usar el SQL de reparación.
