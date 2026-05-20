# Conecta Servicios v4.9.47 — Publicar por voz guiado

## Objetivo
Agregar una forma más intuitiva de crear publicaciones: el usuario puede hablar o escribir una idea inicial y la app le hace preguntas guiadas para generar una publicación clara.

## Decisión de producto
Esta versión **no sustituye Chatbot Conecta**. Lo mejora desde el origen: ayuda a crear una publicación mejor redactada y después mantiene el canal único de contacto: Chatbot Conecta o WhatsApp.

## Qué implementa
- Panel “Publicar por voz” dentro del flujo de publicar.
- Opción de dictar con micrófono cuando el navegador lo permita.
- Fallback para escribir si el navegador no permite reconocimiento de voz.
- Clasificación inicial como:
  - Solicitud / necesidad.
  - Oferta / anuncio.
- Preguntas guiadas diferentes para solicitudes y ofertas.
- Generación de título y descripción ordenada.
- Llenado automático del formulario de publicación.
- Chatbot Conecta como canal recomendado por defecto.
- Guardado de borradores guiados en localStorage.

## No requiere SQL nuevo
Funciona en modo piloto con localStorage y con el formulario/publicaciones actuales. Para producción real multiusuario no necesita tabla nueva si la publicación se guarda en la tabla actual de publicaciones.

## Archivos principales
- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json
- PATCH-INDEX-v4.9.47.txt

## Commit sugerido
Implementar publicación guiada por voz v4.9.47
