# Conecta Servicios v6.4.48 - Encuadre botones arriba

## Objetivo

Corregir definitivamente que `Guardar y volver` y `Cancelar` del encuadre queden debajo o encima de la barra inferior.

## Qué corrige

- Durante encuadre, la barra inferior se oculta realmente.
- Los botones `Guardar y volver` y `Cancelar` se mueven arriba, debajo del menú flotante.
- Los botones ya no quedan cerca del botón +, Siguiendo, Mensajes o Perfil.
- Se oculta la fila Vendo/Ofrezco/Necesito mientras se encuadra para liberar espacio visual.
- El texto de ayuda queda debajo de los botones.
- Se mejora escritura y guardado en `Editar aquí`.
- No toca mensajes.
- No toca perfil.
- No toca Supabase.
- No toca Storage.
- No requiere SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-48-encuadre-botones-arriba.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Mueve botones de encuadre arriba

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6448

Para admin:

https://conecta-servicios.vercel.app/?v=6448&admin=media

## Checklist

1. Confirmar que aparece `v6.4.48`.
2. Entrar a `Encuadre` o `Encuadre admin`.
3. Confirmar que la barra inferior desaparece.
4. Confirmar que `Guardar y volver` y `Cancelar` aparecen arriba.
5. Confirmar que ambos botones se pueden tocar.
6. Confirmar que se puede escribir en `Editar aquí`.
7. Confirmar mensajes y perfil.
