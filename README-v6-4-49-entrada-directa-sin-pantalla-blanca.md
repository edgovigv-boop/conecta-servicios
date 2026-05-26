# Conecta Servicios v6.4.49 - Entrada directa sin pantalla blanca

## Objetivo

Evitar que usuarios nuevos, familiares, testers o inversionistas vean el mensaje:

`La app se protegió de una pantalla en blanco...`

Ese mensaje era útil para diagnóstico técnico, pero no debe verse en una app pública.

## Qué cambia

- Se elimina la pantalla técnica de protección contra pantalla blanca.
- Si un celular trae caché vieja o estado local raro, la app intenta recuperarse automáticamente.
- En primer intento:
  - limpia caché/service worker de Conecta sin borrar perfil ni datos importantes;
  - redirige automáticamente a `/?v=6449&fresh=...`.
- En segundo intento:
  - limpia solo estados visuales temporales;
  - intenta abrir Home directo.
- Si aún hubiera problema, muestra una pantalla neutra:
  - `Conecta Servicios`
  - `Entrando a la app...`
  - botón `Entrar`
- No se muestra texto técnico ni mensaje de pantalla blanca.

## Qué conserva

- Publicaciones.
- Perfil.
- Mensajes.
- Supabase.
- Storage.
- Multimedia.
- Encuadre.
- Admin de encuadre.
- Follows/corazones.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-49-entrada-directa-sin-pantalla-blanca.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Elimina pantalla tecnica de proteccion

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6449

Para admin:

https://conecta-servicios.vercel.app/?v=6449&admin=media

## Checklist

1. Abrir en celular donde antes salía la pantalla de protección.
2. Confirmar que ya no aparece ese texto.
3. Confirmar que entra directo o muestra máximo `Entrando a la app...`.
4. Confirmar Home.
5. Confirmar mensajes.
6. Confirmar perfil.
7. Confirmar publicaciones.
