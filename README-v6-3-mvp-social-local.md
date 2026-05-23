# Conecta Servicios v6.3.0 - MVP social local

## Objetivo

Convertir Conecta Servicios en una red social local simple y visual para:

- VENDO
- OFREZCO
- NECESITO

La app está pensada para personas comunes, negocios pequeños, proveedores, mensajeros, clientes y usuarios sin experiencia digital.

## Qué trae esta versión

- Home visual inspirado en la referencia.
- Barra superior morada.
- Tarjeta blanca superior.
- Logo y nombre Conecta Servicios.
- Botón de campana.
- Tres caminos principales: VENDO / OFREZCO / NECESITO.
- Buscador simple y grande.
- Feed visual con foto/video como protagonista.
- Botones sobre la publicación:
  - corazón
  - mensaje
  - compartir
  - seguir
- Barra inferior:
  - Inicio
  - Siguiendo
  - +
  - Mensajes
  - Perfil
- Cualquier usuario puede publicar.
- El botón + abre multimedia del dispositivo.
- Formulario simple:
  - descripción
  - zona o municipio
  - categoría
  - PUBLICAR
- Perfil con nombre visible.
- Mensajes guardados localmente.
- Seguidos guardados localmente.
- Editar y borrar solo publicaciones propias.
- Si falla conexión, la publicación queda en el dispositivo.

## Qué NO incluye todavía

- IA
- DOLA
- Embajadores
- Mandados Verificados
- Aprendizaje
- Agentes en crecimiento
- Membresías
- Pagos
- Mapas
- Login complejo
- Chat real con backend

## Archivos para subir a GitHub

Subir/reemplazar en la raíz del repositorio:

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js

También puedes subir este README:

- README-v6-3-mvp-social-local.md

## No tocar

No borrar ni reemplazar estas carpetas:

- api
- assets

## Commit sugerido

Mejora MVP social local con diseño abuelita friendly

## Pruebas

- Home muestra VENDO, OFREZCO y NECESITO.
- Barra inferior muestra Inicio, Siguiendo, +, Mensajes y Perfil.
- El botón + abre multimedia del dispositivo.
- Se puede elegir foto.
- Se puede elegir video ligero.
- Se puede escribir descripción.
- Se puede elegir zona.
- Se puede elegir categoría.
- Se puede publicar.
- La publicación aparece en el feed.
- La búsqueda filtra publicaciones.
- VENDO / OFREZCO / NECESITO filtran correctamente.
- Se puede seguir a alguien.
- Siguiendo muestra publicaciones de seguidos.
- Se puede mandar mensaje desde publicación.
- Mensajes muestra mensajes guardados.
- Perfil permite guardar nombre visible.
- El usuario puede editar y borrar sus propias publicaciones.
- Si falla conexión, la publicación queda visible localmente.

## Limitación actual

Para evitar errores, usa archivos ligeros. La app muestra un mensaje si el archivo es muy grande.
