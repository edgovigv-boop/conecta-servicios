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
