# Conecta Servicios v6.5.2 — Feed inmersivo

## Qué cambia

Rediseño profesional del Feed principal inspirado en formato vertical inmersivo, conservando identidad e iconos de Conecta Servicios.

## Estructura

- Cada publicación ocupa 100% del alto y ancho disponible.
- Multimedia en pantalla completa con object-fit cover.
- Texto flotante sobre multimedia en la esquina inferior izquierda.
- Acciones Conecta en lateral derecho: estrella, mensaje, compartir y audio si aplica.
- Contador de carrusel como pastilla discreta dentro de la imagen.
- Menú superior y navegación inferior con blur translúcido.
- Botón + integrado dentro de la barra inferior.
- Sin cambiar Supabase ni lógica de datos.

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-5-2-feed-inmersivo.md

## Commit sugerido

Rediseña feed inmersivo de pantalla completa

## Prueba recomendada

1. Abrir el feed en celular.
2. Confirmar que cada publicación ocupa pantalla completa.
3. Confirmar que foto/video cubre toda la pantalla sin márgenes negros.
4. Confirmar que texto queda abajo izquierda con sombra.
5. Confirmar acciones al lateral derecho.
6. Probar carrusel, video, mensaje, estrella y compartir.
7. Revisar admin: editar, multimedia, encuadre y mensajes globales.
