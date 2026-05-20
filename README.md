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
