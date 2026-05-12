# Conecta Servicios — v4.4 App instalable

© 2026 Conecta Servicios. Todos los derechos reservados.

Esta versión convierte Conecta Servicios en una aplicación web instalable tipo PWA.

## Cambios principales

- Configuración PWA con `manifest.json`.
- Service Worker básico para instalación y carga de archivos principales.
- Íconos de app para Android, iPhone y navegadores compatibles.
- Botón “Instalar app” en la pantalla principal.
- Sección de ayuda para instalar en Android y iPhone.
- Modo pantalla completa cuando se abre desde el ícono instalado.
- Mantiene Supabase, publicaciones, analítica, oportunidades, cercanía inteligente y Aprende y emprende.

## Archivos nuevos/importantes

- `manifest.json`
- `service-worker.js`
- `assets/icon-192.png`
- `assets/icon-512.png`
- `assets/maskable-512.png`
- `assets/apple-touch-icon.png`
- `assets/brand-hero.webp`

## Para publicar en GitHub/Vercel

Subir/reemplazar:

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `LICENSE`
- `manifest.json`
- `service-worker.js`
- carpeta `assets`

Mensaje sugerido de commit:

`Actualizar a v4.4 app instalable`

## Nota

No requiere SQL nuevo si ya se aplicaron las migraciones anteriores de Supabase.
