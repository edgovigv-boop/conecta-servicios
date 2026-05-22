# Conecta Servicios v6.1.0 - Tres caminos

Esta versión reduce la app a solo tres caminos:

- VENDO
- OFREZCO
- NECESITO

## Cambios principales

- El Home solo muestra los tres botones principales.
- No hay rubros extra.
- No hay Embajadores, IA, Mandados Verificados, Aprendizaje ni Agentes en crecimiento.
- Solo Admin puede publicar, editar y borrar.
- Admin entra con PIN: 3145.
- El formulario de publicación solo tiene:
  - Foto o video
  - Descripción
  - Zona o municipio
  - Categoría: VENDO / OFREZCO / NECESITO
  - Botón PUBLICAR
- No hay botón de guardar borrador.
- La primera línea de la descripción se usa como título de la publicación.
- Se incluye una idea base de texto: PLANTILLA "ÚSALA".

## Archivos para subir a GitHub

Reemplazar en la raíz del repositorio:

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js

No borrar ni reemplazar:

- api
- assets

## Prueba recomendada

1. Abrir la app.
2. Activar Admin con PIN 3145.
3. Ver Home con solo VENDO / OFREZCO / NECESITO.
4. Entrar a VENDO.
5. Presionar +.
6. Elegir foto/video.
7. Escribir descripción iniciando con PLANTILLA "ÚSALA".
8. Elegir zona.
9. Elegir categoría VENDO.
10. Publicar.
