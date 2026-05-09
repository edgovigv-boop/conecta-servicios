# Conecta Servicios v3.9 — publicación guiada + diseño moderno

Esta versión mejora la experiencia para usuarios y reduce la operación manual.

## Cambios principales

- Pantalla principal con estilo más moderno.
- Registro tipo encuesta, paso por paso.
- Publicación automática con reglas básicas.
- Si el contenido se ve incompleto o dudoso, queda en revisión.
- Vista compacta de publicaciones: primero se ven títulos y datos rápidos.
- Al tocar una publicación se despliega el detalle completo.
- Tarjetas, botones y filtros con diseño más moderno.
- Panel admin con resumen de activas, revisión, ocultas y atendidas.
- Mantiene folios, WhatsApp, compartir, enlaces clicables y edición admin.

## Publicación automática

La app intenta activar automáticamente una publicación si tiene:

- Título claro.
- Descripción suficiente.
- WhatsApp válido.
- Estado y municipio.
- Sin palabras bloqueadas básicas.
- Sin señales simples de spam o duplicado.

Si algo no cumple, queda en `revision` para que el administrador la revise.

## Archivos para GitHub/Vercel

Reemplaza en GitHub estos archivos:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`

Mensaje sugerido de commit:

`Actualizar a v3.9 publicación guiada moderna`

## Supabase

No requiere SQL nuevo si ya estás usando la tabla `publicaciones` de la v3.8.
