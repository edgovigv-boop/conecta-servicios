# Conecta Servicios v5.0.1 — DOLA pegado inteligente

Versión limpia de Conecta Servicios con corrección del flujo **Crear con ayuda de DOLA**.

## Qué cambia en v5.0.1

- El prompt generado para DOLA ahora pide una experiencia conversacional: **una pregunta a la vez**.
- El prompt pide a DOLA entregar al final un bloque estructurado para copiar y pegar en Conecta.
- El cuadro de prompt incluye botón/ícono de copiar arriba a la derecha.
- El flujo de DOLA incluye un área clara: **“Pega aquí el texto generado por DOLA”**.
- Al pegar el texto, Conecta intenta extraer:
  - Tipo
  - Categoría
  - Título
  - Zona
  - Descripción
  - Canal recomendado
  - Preguntas sugeridas
- Conecta ya no manda directo al formulario manual: muestra una **vista previa de publicación**.
- Desde la vista previa puedes:
  - Publicar ahora
  - Editar
  - Volver a DOLA
- Si el texto no se puede interpretar completo, Conecta conserva el texto y pide completar solo lo faltante.

## Cómo probar localmente

```bash
cd conecta-servicios-v5
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Checklist de prueba

1. Entrar a **Publicar**.
2. Elegir **Crear con DOLA**.
3. Seleccionar plantilla “Busco mensajero cerca”.
4. Copiar prompt.
5. Confirmar que el prompt pide: “Hazme una sola pregunta a la vez”.
6. Pegar un bloque generado por DOLA.
7. Tocar **Usar este texto** o **Ver vista previa**.
8. Confirmar que aparece **Vista previa de tu publicación**.
9. Publicar desde la vista previa.
10. Confirmar que aparece en **Mis publicaciones**, **Inicio** y **Explorar**.
11. Probar un texto incompleto y confirmar que no se pierde.

## Supabase / SQL

No requiere SQL nuevo para esta corrección. Funciona en modo piloto con `localStorage`.

## Vercel

No desplegar automáticamente. Probar localmente antes de subir a GitHub/Vercel.

## Commit sugerido

```text
Corregir pegado inteligente de DOLA y vista previa de publicación v5.0.1
```
