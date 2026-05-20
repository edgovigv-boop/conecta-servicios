# Conecta Servicios v5.0.4 — Media sugerida y placeholder


Versión: `v5.0.3-plus-simple-dola-final-media`

Esta versión ajusta el flujo de publicación para que sea más intuitivo y menos abrumador.

## Cambios principales

- Después de elegir una plantilla de publicación, la app muestra una pantalla simple con dos círculos grandes:
  - **DOLA**: para crear con ayuda externa.
  - **Manual**: para escribir directamente.
- Los módulos estrella ya no se tratan como plantillas de anuncio:
  - Embajadores.
  - Agentes en crecimiento.
  - Mandados verificados.
  - Aprendizaje.
- DOLA ahora recibe un prompt más claro:
  - hacer una pregunta a la vez;
  - no usar tablas ni JSON;
  - no repetir el prompt;
  - no devolver toda la conversación;
  - entregar solo la publicación final lista para pegar.
- Conecta ya no intenta separar muchos campos del resultado de DOLA.
  - Usa la primera línea como título sugerido.
  - Usa todo el texto pegado como descripción principal.
  - Respeta saltos de línea y formato visual.
- Antes de abrir DOLA, se muestra aviso breve para que el usuario inicie sesión y evite límites de invitado.
- Si el usuario no sube foto/video, Conecta intenta sugerir un recurso del banco manual `assets/dola-media/`.
- Después de publicar, se limpia el estado del flujo y se redirige a **Mis publicaciones**.

## Banco manual de imágenes/videos

Coloca archivos opcionales en:

```text
assets/dola-media/
```

Nombres sugeridos:

```text
comida-01.jpg
comida-01.mp4
mandados-01.jpg
mandados-01.mp4
negocio-01.jpg
agente-01.jpg
embajadores-01.jpg
aprendizaje-01.jpg
```

Si los archivos no existen, la publicación no se rompe; se muestra un placeholder.

## Probar localmente

Desde la carpeta del proyecto:

```bash
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Vercel

No desplegar automáticamente. Probar localmente primero y subir un solo commit final cuando se apruebe.

Commit sugerido:

```text
Simplificar plus con DOLA o Manual y media sugerida v5.0.3
```

## SQL

No requiere SQL nuevo para piloto local. Funciona con `localStorage`.

## Cambios v5.0.4

- Corrige render de media para evitar imágenes rotas o texto HTML visible como `"/>`.
- Usa banco manual `assets/dola-media/` con imágenes sugeridas por categoría.
- Si no existe media válida, muestra un placeholder limpio por tipo/categoría.
- Conserva saltos de línea y emojis en descripciones generadas por DOLA.
- No requiere SQL nuevo para el piloto local.

### Banco de media sugerida

Archivos incluidos:

- `comida-01.jpg`
- `mandados-01.jpg`
- `agente-01.jpg`
- `negocio-01.jpg`
- `embajadores-01.jpg`
- `aprendizaje-01.jpg`
- `mandados-verificados-01.jpg`
- `solicitante-01.jpg`

Puedes reemplazarlos manualmente por fotos/videos propios manteniendo los mismos nombres.
