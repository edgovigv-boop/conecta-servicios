# Conecta Servicios v5.2.0 — UX visual universal

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
