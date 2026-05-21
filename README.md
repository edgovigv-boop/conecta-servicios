# Conecta Servicios v5.2.3.0 — UX visual universal

Rediseño visual de Conecta Servicios con la regla: **si hay que leer demasiado, está mal diseñado**.

## Qué cambia

- Home inicia con banco visual de publicaciones, sin textos largos.
- Categorías claras: 🟢 Negocios, 🟡 Agentes, 🔴 Solicitantes.
- Menú inferior reducido: Inicio, Buscar, Crear, Perfil.
- Flujo Crear con botones grandes e iconos.
- DOLA y Manual siguen disponibles.
- DOLA se muestra como chat interno si la API está configurada.
- Si la API no está configurada, sigue funcionando el respaldo externo.
- Fotos y videos hasta 10 archivos por publicación.
- Videos se reproducen dentro de la tarjeta.
- WhatsApp sigue funcionando como canal opcional.
- Módulos: Embajadores, Agentes en crecimiento, Mandados verificados, Aprendizaje.
- PWA lista para Vercel.

## Estructura

```text
index.html
styles.css
app.js
manifest.json
service-worker.js
vercel.json
api/dola.js
assets/icons/
assets/dola-media/
```

## Probar localmente

```bash
cd conecta-servicios-v5.2.0-ux-visual-universal
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## DOLA API

El archivo `api/dola.js` ya está preparado. En Vercel configura:

```text
DOLA_API_URL=
DOLA_API_KEY=
DOLA_MODEL=
```

Mientras no existan estas variables, la app mantiene el modo alternativo externo.

## Multimedia

En modo local se guardan fotos/videos pequeños en `localStorage`. Para videos reales de hasta 10 minutos en producción, se recomienda conectar Supabase Storage o un storage equivalente.

## Subir a Vercel

1. Reemplaza los archivos del proyecto por esta carpeta.
2. Haz un solo commit.
3. Configura variables de entorno si ya tienes API de DOLA.
4. Deja que Vercel despliegue una sola vez.

## Commit sugerido

```text
Rediseñar Conecta Servicios con UX visual universal v5.2.0
```


## v5.2.2 - Formato DOLA, teclado estable y Admin

Cambios principales:
- Se respeta el formato de texto pegado desde DOLA usando saltos de línea y espacios visibles.
- Se evita re-renderizar la pantalla en cada tecla para que el teclado móvil no se cierre al escribir.
- Se recupera panel Admin con acceso a todas las publicaciones.
- Admin puede editar cualquier publicación, ocultarla o reactivarla.
- Las publicaciones ocultas no aparecen en el feed normal, pero sí en Admin.
- Videos y multimedia se mantienen sin cambios funcionales.

No requiere SQL nuevo para modo piloto.


## v5.2.3 - DOLA guía visual y editar/terminar

Cambios principales:
- Se reemplazaron mensajes técnicos de API por: PRÓXIMAMENTE: Copia el prompt y abre DOLA.
- El recuadro del prompt parpadea suavemente para guiar al usuario.
- Después de copiar el prompt, parpadea el botón Abrir DOLA.
- El prompt enviado a DOLA incluye ayuda paciente: si el usuario no sabe qué responder, DOLA debe dar opciones y ejemplos.
- Se quitaron botones Corto/Formal del flujo visual.
- En el regreso de DOLA solo queda el botón grande: Editar y terminar.
- Editar y terminar lleva a la pantalla final, directo al área de fotos/videos.
- Se mantiene la lógica de videos de la versión anterior.

No requiere SQL nuevo.
