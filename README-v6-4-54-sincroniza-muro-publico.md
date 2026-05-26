# Conecta Servicios v6.4.54 - Sincroniza muro público

## Objetivo

Aprovechar un solo despliegue para resolver el caso en el que un celular de prueba se queda en `Cargando publicaciones` porque no tiene publicaciones locales y el muro público necesita sincronizarse desde un celular que sí tiene publicaciones visibles.

## Qué agrega

- Modo admin para subir publicaciones visibles de un celular al muro público.
- URL especial para sincronizar:
  `?v=6454&admin=media&sync=public`
- Botón `Subir publicaciones de este celular` cuando el dispositivo está en modo admin y tiene publicaciones locales.
- Footer legal discreto:
  `© 2026 Conecta Servicios. Todos los derechos reservados.`
- Conserva archivos legales:
  `LICENSE-PROPIETARIA.md`
  `NOTICE-COPYRIGHT.md`

## Flujo recomendado

1. En el celular donde SÍ se ven las publicaciones, abrir:
   https://conecta-servicios.vercel.app/?v=6454&admin=media&sync=public

2. Esperar a que termine la sincronización.

3. En el celular de prueba que se queda cargando, abrir:
   https://conecta-servicios.vercel.app/?v=6454

4. Si aparece `Actualizar muro`, tocar una vez.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-54-sincroniza-muro-publico.md`
- `LICENSE-PROPIETARIA.md`
- `NOTICE-COPYRIGHT.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Agrega sincronizacion del muro publico

## Checklist

1. Abrir en celular con publicaciones:
   `?v=6454&admin=media&sync=public`
2. Confirmar mensaje de muro sincronizado.
3. Abrir en celular de prueba:
   `?v=6454`
4. Confirmar que ya aparecen publicaciones.
5. Confirmar mensajes y perfil.
