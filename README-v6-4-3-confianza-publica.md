# Conecta Servicios v6.4.3 - Confianza pública

## Objetivo

Agregar una capa pública de confianza, privacidad y seguridad sin tocar mensajes, videos, publicaciones ni Supabase.

Esta versión responde a una preocupación real: algunas personas no quieren abrir ligas desconocidas por miedo a seguridad o privacidad.

## Qué cambia

- Agrega nueva pantalla: `Privacidad y seguridad`.
- Agrega acceso desde Perfil.
- Explica qué permisos usa la app y para qué:
  - ubicación aproximada
  - cámara/galería
  - mensajes internos
  - notificaciones futuras
- Agrega texto claro:
  - Conecta Servicios no accede a archivos personales.
  - Cámara/galería solo se usan cuando el usuario decide publicar.
  - Ubicación sirve para zona/municipio, no para rastreo en tiempo real.
- Agrega instrucciones de instalación segura como PWA.
- Agrega aviso de no instalar APKs fuera de canales verificados.
- Agrega footer:
  - © 2026 Conecta Servicios. Todos los derechos reservados.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-3-confianza-publica.md`

## No se tocó

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- SQL

## SQL

No requiere SQL.

## Deploy

No se hizo deploy automático.

## Commit sugerido

Agrega privacidad y confianza publica

## URL de prueba después de deploy manual

https://conecta-servicios.vercel.app/?v=643

## Checklist

1. Confirmar que aparece `v6.4.3`.
2. Entrar a Perfil.
3. Ver tarjeta `Privacidad y seguridad`.
4. Tocar `Ver`.
5. Confirmar que abre la pantalla de confianza.
6. Leer permisos de ubicación, cámara/galería, mensajes y notificaciones.
7. Confirmar que el Home sigue cargando.
8. Confirmar que publicaciones siguen visibles.
9. Confirmar que mensajes siguen funcionando.
10. Confirmar que no se rompió publicar.
