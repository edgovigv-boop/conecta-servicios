# Conecta Servicios v5.0.2 — DOLA flujo de plantillas limpio

Corrección enfocada en que el botón **+ Publicar** y todas las plantillas abran una página clara de creación con DOLA, sin mandar al usuario al formulario manual ni intentar separar campos de forma pesada.

## Qué cambia

- Al entrar a **Publicar → Crear con DOLA**, primero se muestran las plantillas.
- Al seleccionar cualquier plantilla, se abre una página limpia llamada **Crear publicación con DOLA**.
- El prompt para DOLA ahora pide:
  - una sola pregunta a la vez;
  - no usar tablas;
  - no usar JSON;
  - no entregar campos técnicos;
  - generar una publicación final visualmente ordenada.
- Conecta ya no intenta separar obligatoriamente el resultado de DOLA en muchos campos.
- Conecta usa:
  - la plantilla elegida para tipo/categoría/intención;
  - la primera línea del texto de DOLA como título sugerido;
  - todo el texto pegado como descripción principal.
- Después de pegar el texto, se muestra **Vista previa de tu publicación**.
- Desde la vista previa se puede publicar, editar o volver a DOLA.
- Todas las plantillas tienen acción. Ninguna debe quedarse sin hacer nada.

## Cómo probar localmente

```bash
cd conecta-servicios-v5
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Checklist rápido

1. Tocar **+ Publicar**.
2. Entrar a **Crear con DOLA**.
3. Seleccionar **Busco mensajero cerca**.
4. Confirmar que abre **Crear publicación con DOLA**.
5. Copiar prompt.
6. Abrir DOLA.
7. Pegar en Conecta una publicación final generada por DOLA.
8. Confirmar que aparece vista previa.
9. Confirmar que no manda al formulario manual completo.
10. Publicar.
11. Confirmar que aparece en Inicio, Explorar y Mis publicaciones.
12. Probar al menos tres plantillas.

## Supabase / SQL

No requiere SQL nuevo para esta corrección. Funciona en modo piloto con `localStorage`.

## Vercel

No desplegar automáticamente. Probar localmente antes de subir a GitHub/Vercel.

## Commit sugerido

```text
Corregir flujo de plantillas con DOLA y descripción directa v5.0.2
```
