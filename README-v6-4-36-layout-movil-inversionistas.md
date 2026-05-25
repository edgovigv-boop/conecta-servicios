# Conecta Servicios v6.4.36 - Layout móvil inversionistas

## Objetivo

Ajustar la app como interfaz móvil de demostración, cuidando que las publicaciones ya no se sientan largas y sin tocar las funcionalidades recuperadas.

## Diagnóstico

El feed se seguía alargando porque una capa visual anterior había dejado `.post-body` en flujo normal (`position: static`). Eso hacía que la publicación midiera:

- multimedia
- más bloque de información
- más herramientas

En móvil se veía como una tarjeta demasiado larga.

## Qué corrige

- Regresa la información de la publicación a una capa superpuesta sobre la multimedia.
- Cada publicación vuelve a medir solo la altura útil visible del celular.
- Usa unidades móviles `svh/dvh` para evitar el problema clásico de `100vh` en navegadores móviles.
- Evita que el contenido inferior agregue altura extra al feed.
- Mantiene el texto, botones, herramientas y descripción dentro de la tarjeta.
- Cuando se abre `Editar aquí` o `Multimedia`, el panel se desplaza dentro de la publicación, sin hacer crecer todo el feed.
- Durante `Encuadre`, oculta el bloque inferior para que el encuadre se vea limpio.
- Ajusta la barra inferior para que no empuje ni estire las publicaciones.

## Qué conserva

- Mensajes funcionando.
- Perfil funcionando.
- Editar aquí.
- Guardar y volver.
- Encuadre.
- Encuadre por foto.
- Multimedia.
- Menú de herramientas recuperado.
- Layout visual recuperado.
- No toca Supabase, Storage ni SQL.

## Archivos para GitHub

Sube/reemplaza:

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-36-layout-movil-inversionistas.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Ajusta layout movil del feed para demo

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6436

## Checklist

1. Confirmar que aparece `v6.4.36`.
2. Revisar que cada publicación ya no se vea larga.
3. Confirmar que la información queda sobre la multimedia, no debajo.
4. Probar scroll entre publicaciones.
5. Probar `Editar aquí` y `Guardar y volver`.
6. Probar `Encuadre` y `Guardar y volver`.
7. Probar `Multimedia`.
8. Enviar mensaje desde celular visitante y recibirlo en el dueño.
9. Confirmar que Perfil sigue visible.
