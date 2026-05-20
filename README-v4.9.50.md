# Conecta Servicios v4.9.50-dola-contextual-conecta

Esta versión convierte a **DOLA** en el agente contextual especializado de Conecta Servicios.

## Idea central

- Conecta Servicios mantiene un feed limpio, publicaciones, plantillas, carrusel y comunidad.
- DOLA funciona como asistente conversacional contextual.
- DOLA entiende desde qué sección, plantilla o publicación viene el usuario.
- DOLA recomienda publicaciones internas relacionadas cuando existen.
- DOLA ayuda a crear publicaciones y genera un bloque para copiar y pegar en Conecta.
- DOLA filtra interesados y prepara mensajes claros para WhatsApp cuando corresponde.

## Qué se agregó

- Rutas internas sugeridas para DOLA:
  - `/dola`
  - `/dola/crear`
  - `/dola/contactar`
  - `/dola/guia`
- Recomendaciones de publicaciones internas activas relacionadas.
- Modo “Copia este texto y pégalo en Conecta”.
- Cuadro limpio para pegar texto generado por DOLA en el flujo de publicar.
- Solicitudes filtradas por DOLA en Mis publicaciones.
- Aviso de uso de DOLA.
- Banco manual preparado para imágenes/videos en `assets/dola-media/`.

## SQL

No requiere SQL nuevo para probar en modo piloto.

Se incluye `supabase-dola-contextual.sql` como propuesta futura para persistencia real multiusuario.

## Commit sugerido

Convertir DOLA en asistente contextual especializado de Conecta Servicios
