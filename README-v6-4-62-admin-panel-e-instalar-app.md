# Conecta Servicios v6.4.62 - Admin panel e instalar app

## Objetivo

Aprovechar el despliegue sin tocar la base estable para agregar:

1. Acceso Admin piloto.
2. Edición/borrado/multimedia/encuadre desde admin.
3. Analítica básica.
4. Botón para instalar la app desde Perfil.

## Acceso admin

Abrir:

https://conecta-servicios.vercel.app/?v=6462&admin=media#admin

También puedes abrir normal y entrar desde Perfil si el modo admin ya está activo:

https://conecta-servicios.vercel.app/?v=6462&admin=media

## Qué agrega

- Ruta `/admin`.
- Tarjeta `Admin piloto` en Perfil cuando está activo `admin=media`.
- Panel con métricas:
  - publicaciones
  - usuarios
  - multimedia
  - videos
  - Vendo / Ofrezco / Necesito
  - mensajes sin leer
- Lista de publicaciones con acciones:
  - Ver
  - Encuadre
  - Editar
  - Multimedia
  - Borrar
- En publicaciones ajenas, modo admin muestra:
  - Encuadre admin
  - Editar admin
  - Multimedia admin
  - Borrar admin
- Perfil incluye:
  - Instalar app

## Importante

Este admin es local/de piloto. Para etapa masiva debe convertirse después en roles reales en Supabase.

## Qué NO toca

- Mensajes.
- Perfil base.
- Supabase Storage.
- SQL.
- Diseño principal del feed.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-62-admin-panel-e-instalar-app.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega admin piloto e instalar app

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6462

Para admin:

https://conecta-servicios.vercel.app/?v=6462&admin=media#admin

## Checklist

1. Confirmar que Home sigue estable.
2. Confirmar que Mensajes abre.
3. Confirmar que Perfil abre.
4. En Perfil, ver botón `Instalar app`.
5. Abrir `?v=6462&admin=media#admin`.
6. Confirmar que aparece Admin piloto.
7. Probar editar una publicación ajena.
8. Probar encuadre admin.
9. Probar borrar solo con una publicación de prueba.
