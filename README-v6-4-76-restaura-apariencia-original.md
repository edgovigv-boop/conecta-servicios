# Conecta Servicios v6.4.76 — Restaura apariencia original

## Decisión

Se retira el modo seguro integrado porque sí entraba, pero no se veía como la app original y causaba intermitencia visual.

## Qué contiene

- `app.js` restaurado desde la base estable v6.4.48, que conserva la apariencia original del feed.
- `index.html` sin `feed-rescue.js` y sin modo seguro externo.
- `service-worker.js` seguro para evitar versiones mezcladas.
- `limpiar-cache.html` para entrar limpio después de Vercel Ready.

## Commit sugerido

Restaura apariencia original y retira modo seguro

## Orden recomendado

1. Subir estos archivos a GitHub.
2. Esperar Vercel Ready.
3. Abrir en el celular:

   https://conecta-servicios.vercel.app/limpiar-cache.html

## Importante

- No subir `feed-rescue.js`.
- No usar `output: export`.
- No volver a meter modo seguro visual como solución de producción.
- Si un celular específico sigue fallando, se revisa ese dispositivo sin cambiar la app para todos.
