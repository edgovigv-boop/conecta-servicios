# Conecta Servicios v6.3.30 - Tabs Tienda / Para ti / Zona y regreso seguro

## Objetivo

Ajustar el comportamiento del Home visual sin cambiar el diseño que ya gustó.

## Qué cambia

- **Tienda** ahora muestra solo publicaciones `VENDO`.
- **Para ti** ahora prioriza publicaciones marcadas con corazón, categorías que ya gustaron, publicaciones de la zona y publicaciones con más reacciones.
- El corazón ahora también agrega la publicación al interés de `Para ti`.
- El municipio superior ya no queda fijo a Chapultepec: permite detectar zona aproximada con permiso del usuario.
- La app no guarda coordenadas exactas; solo guarda el nombre aproximado del municipio/zona en este dispositivo.
- Si no se puede detectar, permite escribir municipio manualmente.
- Corrige el problema de entrar a `Siguiendo` y que al regresar el navegador saque de la app.
- Agrega botón `← Volver al Home` en Siguiendo.
- Implementa historial interno con `pushState`/`popstate`.

## Alcance de ubicación

Para este MVP se usa detección aproximada con una lista piloto de municipios frecuentes:
Tejupilco, Chapultepec, Calimaya, Metepec, Toluca, Mexicaltzingo, San Mateo Atenco y Ayala.

Para cobertura nacional fina se recomienda después integrar INEGI/geocoder o un catálogo completo de municipios.

## Archivos para GitHub

Sube/reemplaza:

- app.js
- index.html
- boot-diagnostics.js
- service-worker.js
- manifest.json
- api/publications.js
- README-v6-3-30-tabs-zona-back.md

## No tocar

- styles.css
- api/messages.js
- api/public-config.js
- api/video-diagnostics.js
- api/storage-diagnostics.js
- assets
- SQL

## SQL

No requiere SQL.

## Commit sugerido

Ajusta Tienda Para ti zona y regreso

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6330

## Checklist de prueba

1. Confirmar que se vea `v6.3.30`.
2. Tocar `Tienda` y confirmar que solo salen publicaciones VENDO.
3. Dar corazón a una publicación y confirmar que se prioriza en `Para ti`.
4. Tocar el municipio superior y permitir ubicación aproximada.
5. Confirmar que el municipio cambia según zona o permite captura manual.
6. Entrar a `Siguiendo`.
7. Usar flecha del navegador o botón `Volver al Home`.
8. Confirmar que ya no saca de la app.
9. Probar lupa y teclado.
10. Probar mensajes y publicar.
