# Conecta Servicios v4.0 — ubicación cercana segura

© 2026 Conecta Servicios. Todos los derechos reservados.

Este proyecto, su código fuente, diseño, textos, estructura funcional, documentación, interfaz y elementos originales son propiedad exclusiva de su titular.

Queda prohibida la copia, reproducción, distribución, modificación, explotación comercial, cesión o uso no autorizado, total o parcial, por cualquier medio.

El acceso a este repositorio, archivos o despliegue no concede licencia de uso. Todo uso requiere autorización expresa y por escrito del titular.

## Cambios de esta versión

- El botón **Publicaciones cerca de mí** ahora solicita ubicación aproximada del dispositivo.
- La app ordena publicaciones por distancia aproximada cuando existen coordenadas.
- Las publicaciones nuevas pueden guardar ubicación aproximada de forma opcional.
- La ubicación exacta del usuario no se muestra públicamente.
- Las publicaciones sin coordenadas siguen apareciendo, pero después de las que sí tienen distancia calculable.
- Se conserva el diseño moderno, publicación guiada, folios, enlaces clicables, compartir, edición admin y protección legal básica.

## Privacidad

La ubicación es opcional. Se usa solo para mostrar y ordenar publicaciones cercanas. No se publica la ubicación exacta del usuario ni se rastrea en segundo plano.

## Publicación

1. Ejecuta primero `supabase-v4.0-ubicacion-cercana.sql` en Supabase.
2. Después sube a GitHub:
   - index.html
   - styles.css
   - app.js
   - README.md
   - LICENSE
   - assets/brand-hero.webp
3. Vercel desplegará automáticamente.
