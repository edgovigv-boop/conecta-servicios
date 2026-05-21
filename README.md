# Conecta Servicios v5.0.6

Versión: `v5.0.6-pwa-notificaciones-modulos-perfil`

## Cambios principales

- Botón circular con `+` en el logo para iniciar instalación PWA o mostrar instrucciones.
- Perfil con acceso a Instalar app, Notificaciones, Datos básicos, Preferencias, Ayuda/privacidad y Oficina/Admin.
- Panel de notificaciones internas en modo piloto.
- Notificaciones locales guardadas en `localStorage`.
- Módulos estrella con acciones funcionales:
  - Embajadores: copiar enlace, mensaje para compartir, registrar referido y guía rápida.
  - Agentes en crecimiento: crear publicación como agente, buscar solicitudes y usar DOLA.
  - Mandados verificados: solicitar mandado, postularse como agente, requisitos y FAQ.
  - Aprendizaje: recursos, plan con DOLA y prompt copiable.
- Mantiene correcciones previas: flujo DOLA/Manual simple, media sugerida/placeholder y navegación atrás correcta.

## Prueba local

```bash
cd conecta-servicios-v5.0.6
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

## Despliegue recomendado en Vercel

Para ahorrar despliegues, probar localmente primero y subir un solo commit final a GitHub.

Commit sugerido:

```text
Activar PWA, notificaciones, módulos estrella y perfil v5.0.6
```

## SQL

No requiere SQL nuevo para el piloto local.


## v5.0.7 - Publicar limpio y módulos útiles

- El botón Publicar siempre inicia desde la pantalla principal “¿Qué quieres publicar?” cuando se toca desde la navegación.
- Se evita que el flujo quede congelado en DOLA / Manual.
- Los módulos estrella se simplifican para no parecer listas de botones inactivos.
- Se agregan acciones reales y modales útiles para Embajadores, Agentes, Mandados verificados, Aprendizaje y Conseguir clientes.
- No requiere SQL nuevo para piloto local.

## v5.0.8 - Logo oficial en Home y PWA

Versión: `v5.0.8-logo-home-pwa`

### Cambios principales

- Se agrega el logo oficial proporcionado por el usuario como identidad visual de Conecta Servicios.
- Se actualiza el encabezado del Home para usar el nuevo logo/ícono oficial.
- Se generan assets PWA en `assets/icons/`:
  - `conecta-logo-oficial.png`
  - `conecta-logo-mark.png`
  - `icon-192.png`
  - `icon-512.png`
  - `apple-touch-icon.png`
  - `favicon.ico`
  - `favicon-32.png`
  - `favicon-64.png`
- Se actualiza `manifest.json` para usar los iconos PNG oficiales.
- Se agregan enlaces de favicon y apple-touch-icon en `index.html`.
- Se actualiza `service-worker.js` con cache nuevo `conecta-servicios-v5-0-8-logo-home-pwa`.

### Archivos modificados

- `index.html`
- `app.js`
- `styles.css`
- `manifest.json`
- `service-worker.js`
- `README.md`
- `CHECKLIST-v5.0.8.txt`
- `NO_REQUIERE_SQL_NUEVO.txt`
- `assets/icons/`

### Prueba local

```bash
cd conecta-servicios-v5.0.8
python -m http.server 8080
```

Abrir:

```text
http://localhost:8080
```

### SQL

No requiere SQL nuevo.

### Commit sugerido

```text
Actualizar logo oficial en Home y PWA v5.0.8
```

## v5.0.9 - Prompts DOLA con contexto cerrado

Versión: `v5.0.9-prompts-dola-contexto-cerrado`

### Cambios principales

- Todos los prompts generados para DOLA ahora incluyen:
  - ROL: DOLA como asistente especializado de Conecta Servicios.
  - OBJETIVO: ayudar únicamente dentro del contexto de Conecta Servicios.
  - CONTEXTO: explicación breve de la app y liga oficial `https://conecta-servicios.vercel.app/`.
  - REGLAS: no recomendar WhatsApp Business, empleos externos, plataformas externas, cursos externos ni soluciones ajenas salvo que el usuario lo pida explícitamente.
- El prompt de Aprendizaje ahora orienta primero a:
  - publicar gratis por 30 días;
  - publicarse como Agente;
  - revisar Agentes en crecimiento;
  - aprender habilidades útiles para ofrecer servicios;
  - explorar Mandados verificados;
  - conocer Embajadores si quiere ganar por comisión.
- El prompt para publicar con DOLA sigue pidiendo una sola pregunta a la vez y salida final lista para pegar en Conecta.
- El prompt para contactar a un anunciante ahora también queda cerrado al contexto de Conecta Servicios.
- El prompt de Conseguir clientes por comisión evita inventar pagos, contratos o reglas no definidas.

### Archivos modificados

- `app.js`
- `index.html`
- `manifest.json`
- `service-worker.js`
- `README.md`
- `CHECKLIST-v5.0.9.txt`
- `NO_REQUIERE_SQL_NUEVO.txt`

### SQL

No requiere SQL nuevo para esta corrección.

### Commit sugerido

```text
Cerrar contexto de prompts DOLA para Conecta Servicios v5.0.9
```

---

## v5.1.0 - Integración segura de API DOLA dentro de Conecta

Versión: `v5.1.0-integracion-api-dola-segura`

Esta versión prepara a Conecta Servicios para que DOLA pueda funcionar dentro de la app por API, sin redirigir al usuario a Dola.com cuando existan credenciales oficiales.

### Qué incluye

- Nuevo backend seguro: `api/dola.js`.
- El frontend llama a `/api/dola`, nunca directamente a la API externa.
- La API key no se expone en `app.js`, `index.html` ni en el navegador.
- Nueva tarjeta “DOLA dentro de Conecta” en el flujo de publicación.
- Botones rápidos:
  - Generar con DOLA
  - Más corto
  - Más formal
  - Más sencillo
  - Usar en publicación
  - Bot Atención
  - Bot Contacto
- El botón “Mensaje” en publicaciones con DOLA puede intentar filtrar dentro de Conecta.
- Si la API no está configurada, se mantiene el modo externo actual:
  - Copiar prompt
  - Abrir DOLA externo
  - Pegar resultado

### Variables de entorno en Vercel

Configura estas variables en Vercel cuando tengas credenciales oficiales:

```env
DOLA_API_URL=https://endpoint-oficial-de-dola
DOLA_API_KEY=tu_api_key_oficial
DOLA_MODEL=modelo_si_aplica
```

### Cómo configurarlo en Vercel

1. Entra al proyecto en Vercel.
2. Abre **Settings**.
3. Entra a **Environment Variables**.
4. Agrega:
   - `DOLA_API_URL`
   - `DOLA_API_KEY`
   - `DOLA_MODEL` si aplica.
5. Guarda los cambios.
6. Haz un nuevo deployment para que Vercel lea las variables.

### Qué pasa si falta la API

Si no existen `DOLA_API_URL` o `DOLA_API_KEY`, `/api/dola` responde:

```json
{
  "ok": false,
  "error": "DOLA_API_NOT_CONFIGURED",
  "message": "La API de DOLA aún no está configurada."
}
```

En ese caso, Conecta muestra el modo alternativo externo y la app sigue funcionando.

### Nota técnica

`api/dola.js` usa un payload genérico tipo chat:

```json
{
  "model": "default",
  "messages": [],
  "context": {},
  "temperature": 0.45,
  "stream": false
}
```

Cuando DOLA entregue documentación oficial, ajusta el payload dentro de `api/dola.js` sin tocar el frontend.

### Commit sugerido

```text
Preparar integración segura de API DOLA dentro de Conecta v5.1.0
```
