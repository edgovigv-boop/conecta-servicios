# Conecta Servicios v4.2 — Analítica y enlaces directos

© 2026 Conecta Servicios. Todos los derechos reservados.

Esta versión mantiene la base de v4.1.1 e incorpora mejoras clave para promoción y medición.

## Cambios principales

- Analítica básica dentro de Supabase.
- Nueva sección de administración: **Analítica**.
- Conteo de visitas aproximadas, clics en PUBLICA, publicaciones abiertas, clics a WhatsApp, compartidos y uso de “Publicaciones cerca de mí”.
- Ranking de publicaciones con más interés.
- Enlaces directos corregidos para compartir publicaciones por WhatsApp.
- Al abrir un enlace compartido, la app lleva directo al detalle de la publicación.
- Si la publicación no está activa o no existe, se muestra un aviso claro.
- Se registra analítica anónima sin guardar nombres, teléfonos ni ubicación exacta de visitantes.

## SQL requerido

Antes de subir esta versión a GitHub/Vercel, ejecuta en Supabase:

```sql
supabase-v4.2-analitica-enlaces-directos.sql
```

Este SQL crea la tabla:

```text
eventos_analytics
```

## Archivos a subir a GitHub

```text
index.html
styles.css
app.js
README.md
assets/brand-hero.webp
supabase-v4.2-analitica-enlaces-directos.sql
```

El archivo SQL no es necesario para Vercel, pero conviene conservarlo en GitHub como respaldo del proyecto.

## Mensaje de commit sugerido

```text
Actualizar a v4.2 analítica y enlaces directos
```

## Nota de privacidad

La analítica es aproximada y anónima. No guarda nombres, teléfonos ni ubicación exacta de visitantes. Mide acciones generales para entender si la promoción genera tráfico e interés real.

## Propiedad

Este proyecto, su código fuente, diseño, textos, estructura funcional, documentación e interfaz son propiedad de Conecta Servicios. Queda prohibida la copia, reproducción, distribución, modificación, explotación comercial o uso no autorizado, total o parcial, por cualquier medio.
