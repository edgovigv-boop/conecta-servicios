# Conecta Servicios v6.4.89 — Lectura estable e intereses

## Qué corrige

1. Publicaciones que parpadean cada 3 o 4 segundos:
   - evita re-render automático mientras el usuario está leyendo o scrolleando
   - mantiene abierta la descripción larga sin regresar al inicio
   - mantiene la sincronización en segundo plano, pero sin reconstruir el feed durante lectura

2. Confusión con corazón / Para ti:
   - el botón flotante superior de “Para ti” cambia de corazón a 🎯
   - las publicaciones guardadas cambian de corazón a estrella
   - los textos de Siguiendo ahora dicen “intereses” en vez de “corazón”

## Archivos incluidos

- app.js
- api/messages.js
- index.html
- service-worker.js
- limpiar-cache.html
- activar-admin.html
- README-v6-4-89-lectura-estable-e-intereses.md

## Commit sugerido

Estabiliza lectura y aclara intereses

## Prueba recomendada

1. Abrir publicación “Venta de croquetas para perro”.
2. Tocar “…leer”.
3. Scrollear la descripción durante 15-30 segundos.
4. Confirmar que no parpadea ni regresa al inicio.
5. Confirmar que el botón superior ahora muestra 🎯 para “Intereses / Para ti”.
6. Tocar estrella en una publicación y revisar Siguiendo.
