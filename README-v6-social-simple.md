# Conecta Servicios v6.0.0 - MVP social simple

Esta versión reinicia la app como una red social local mínima.

## Qué se quitó por ahora

- Embajadores
- IA / DOLA como protagonista
- Agentes en crecimiento
- Mandados Verificados
- Aprendizaje
- Flujos complejos de membresía

## Qué queda

- Home tipo red social.
- Botón central `+`.
- Selector de foto o video desde el dispositivo.
- Formulario simple:
  - Descripción
  - Zona o municipio
  - Categoría
- Publicar.
- Mis publicaciones.
- Admin con PIN `3145`.
- Admin puede cargar muchas publicaciones tipo plantilla.
- Sin tocar la API `api/publications.js`.

## Archivos para reemplazar

Subir/reemplazar en la raíz del repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`

## Pruebas

1. Abrir Home.
2. Tocar `+`.
3. Elegir foto del dispositivo.
4. Escribir descripción.
5. Agregar zona.
6. Seleccionar categoría.
7. Publicar.
8. Ver publicación en Home.
9. Entrar como Admin con PIN `3145`.
10. Publicar varias plantillas.

## Nota importante

Esta versión usa `/api/publications` para guardar en Supabase si está configurado. Si falla, guarda localmente y muestra mensaje claro.
