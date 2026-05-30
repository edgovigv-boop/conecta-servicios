# Conecta Servicios v6.4.86 — Avatar público y video estable

## Qué corrige

1. Foto de perfil visible en otros celulares:
   - agrega botón “Reparar foto pública” en Perfil
   - busca foto local en perfil, respaldos y publicaciones propias
   - la sube a Supabase Storage como URL pública
   - aplica esa URL a publicaciones propias
   - evita volver a mandar base64/blob al muro público

2. Video estable tipo TikTok:
   - evita re-render automático del feed cuando hay videos montados
   - agrega reproducción automática por visibilidad con IntersectionObserver
   - pausa otros videos cuando uno entra en pantalla
   - reduce el parpadeo/reinicio provocado por sincronización cada pocos segundos

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-86-avatar-publico-y-video-estable.md

## Commit sugerido

Estabiliza videos y repara avatar publico

## Prueba recomendada

1. Celular fiel:
   - abrir Perfil
   - tocar “Reparar foto pública”
   - esperar mensaje de éxito
   - revisar desde otro celular

2. Celular esposa:
   - repetir “Reparar foto pública” desde su celular

3. Video:
   - abrir publicación “Consultoría”
   - confirmar que el video no parpadea cada 3 segundos
   - confirmar autoplay muted tipo TikTok

Si la foto no se puede subir, revisar políticas de Storage del bucket publication-media.
