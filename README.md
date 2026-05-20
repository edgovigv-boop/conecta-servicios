# Conecta Servicios v5.0

**Rediseño estructural desde cero basado en el esbozo visual aprobado.**

Conecta Servicios v5.0 es una app estática mobile-first para publicar, explorar y contactar solicitantes, agentes y negocios. La app queda organizada como red social local limpia y usa **DOLA externo** como herramienta de apoyo, similar al flujo de abrir WhatsApp.

## Idea principal

> Publica fácil. Encuentra cerca. Conecta mejor con ayuda de DOLA o WhatsApp.

## Modelo comercial piloto

- Gratis: 1 publicación básica por 30 días.
- Membresía anual: $98 MXN para publicaciones ilimitadas.
- Admin: sin restricciones en modo piloto.

## Estructura

```text
conecta-servicios-v5/
  index.html
  styles.css
  app.js
  manifest.json
  service-worker.js
  vercel.json
  README.md
  LICENSE
  assets/
    dola-media/
      README-dola-media.txt
    icons/
    images/
    videos/
```

## Páginas principales

- Inicio
- Explorar
- Publicar
- Mis publicaciones
- Perfil
- Embajadores
- Agentes en crecimiento
- Mandados verificados
- Aprendizaje

## Navegación inferior

La barra inferior contiene solo:

1. Inicio
2. Explorar
3. Publicar
4. Mis publicaciones
5. Perfil

## Carrusel superior

Lenguaje oficial:

1. Para ti
2. Solicitantes
3. Agentes
4. Negocios
5. Mandados verificados
6. Conseguir clientes por comisión
7. Embajadores
8. Aprendizaje

## DOLA externo

La constante para abrir DOLA está en `app.js`:

```js
const DOLA_EXTERNAL_URL = 'https://dola.com';
```

Puedes cambiar esa URL si después se decide usar otra ruta.

La app no replica DOLA internamente. Solo genera prompts contextuales, permite copiarlos, abrir DOLA, regresar y pegar el resultado final.

## WhatsApp

Cada publicación tiene un solo canal:

- DOLA
- WhatsApp

No se muestran ambos al mismo tiempo.

## Banco manual de medios

Coloca imágenes o videos cortos en:

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

Si no hay medios, la app muestra placeholders y no se rompe.

## Cómo probar localmente

Opción sencilla con Python:

```bash
cd conecta-servicios-v5
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Admin piloto

El acceso admin está en:

```text
Perfil → Oficina / Admin
```

PIN piloto:

```text
3145
```

El admin no tiene límite de publicaciones ni bloqueo por membresía.

## Persistencia

La versión piloto usa `localStorage` para:

- publicaciones;
- publicación gratis de 30 días;
- membresía piloto;
- solicitudes locales;
- reacciones;
- preferencias;
- admin activo.

## SQL

**No requiere SQL nuevo para piloto local.**

Si después se migra a producción real multiusuario, se puede crear un archivo `supabase-v5-estructura.sql` con la estructura definitiva.

## Vercel

Incluye `vercel.json` con rewrites para SPA:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Cómo subir a GitHub/Vercel en un solo despliegue

1. Probar localmente.
2. Confirmar que el checklist funciona.
3. Subir todos los archivos en un solo commit.
4. Esperar un solo deployment de Vercel.

Commit sugerido:

```text
Crear Conecta Servicios v5.0 rediseño estructural desde cero
```

## Checklist local

- Inicio carga con carrusel de 8 apartados.
- Feed muestra publicaciones tipo red social.
- Explorar muestra publicaciones y filtros.
- Publicar permite crear con ayuda de DOLA.
- Plantilla “Busco mensajero cerca” genera prompt contextual.
- Botón Copiar prompt funciona.
- Botón Abrir DOLA abre `DOLA_EXTERNAL_URL`.
- Pegar resultado de DOLA prellena publicación.
- Publicación manual funciona.
- Foto o video opcional funciona.
- Banco `assets/dola-media` no rompe si está vacío.
- Mensaje abre WhatsApp si canal es WhatsApp.
- Mensaje abre puente DOLA si canal es DOLA.
- Mis publicaciones muestra publicaciones activas.
- Publicación gratis muestra días restantes.
- Límite de 1 publicación gratis por 30 días funciona.
- Membresía piloto libera publicaciones ilimitadas.
- Admin no tiene restricciones.
- Perfil queda simple.
- `/embajadores` abre landing de embajadores.
- No aparecen barras flotantes laterales.
- No aparecen textos viejos como Chat negocio o Responder filtro.

