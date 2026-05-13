# Conecta Servicios v4.6.2 — Clasificación inteligente de publicaciones

© 2026 Conecta Servicios. Todos los derechos reservados.

Versión enfocada en que cada publicación nazca mejor clasificada y que **Oportunidades para ti** muestre resultados más precisos por intención real.

## Cambios principales

- Se ajustó la sección **Oportunidades para ti** para evitar opciones repetidas o confusas.
- Nuevas frases de intención:
  - Busco trabajo u oportunidades
  - Quiero empezar algo propio
  - Busco quién me ayude
  - Necesito movilidad, entregas o mandados
  - Quiero aprender algo
  - Tengo un negocio
  - Quiero ver personas que buscan empleo
- Se quitó de la vista principal la opción amplia **Quiero colaborar con mi comunidad**.
- Se reemplazó **Quiero activarme económicamente** por **Quiero empezar algo propio**.
- La app interpreta palabras como **Busco**, **Ofrezco**, **Necesito**, **Tengo** y **Vendo** para sugerir mejor categoría, subcategoría e intención.
- El panel admin conserva el botón **Reclasificar** y ahora sugiere mejor la clasificación de registros antiguos.
- Al publicar, la vista previa muestra la **clasificación sugerida**.
- Se priorizan coincidencias por intención, categoría, palabra clave, estado y municipio.
- No borra registros antiguos y no requiere SQL nuevo.

## Archivos a subir

Sube o reemplaza en GitHub:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `LICENSE`
- `manifest.json`
- `service-worker.js`
- carpeta `assets/`

## Recomendación operativa

Después de subir esta versión, entra al panel admin y usa **Reclasificar** para revisar registros antiguos. Si una publicación todavía está ambigua, déjala en revisión u oculta hasta que quede bien ordenada.

No requiere SQL nuevo.
