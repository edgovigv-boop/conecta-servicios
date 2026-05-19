# Conecta Servicios v4.9.36 — paquete directo de reemplazo

Este paquete corrige la entrega anterior para que los archivos principales estén directamente en la raíz del ZIP.

## Cambios incluidos

1. Acceso admin recordado en el navegador.
2. Ruta directa `/embajadores` hacia el landing de Embajadores Conecta.
3. Símbolo `+` del botón principal en color blanco.
4. Acceso piloto de usuario/membresía en `/membresia` y `/membresia?ref=CODIGO`.
5. Service worker actualizado para romper caché.

## Importante

El sitio publicado seguía mostrando referencias a `v4.9.35-landing-embajadores` en `index.html`. Para ver los cambios, además de reemplazar `app.js`, `styles.css`, `service-worker.js` y `manifest.json`, debes actualizar `index.html` con el patch incluido en `PATCH-INDEX-v4.9.36.txt`.

## No requiere SQL nuevo

La prueba piloto funciona localmente en el navegador. El SQL opcional para producción multiusuario puede agregarse después.

## Commit sugerido

Actualizar v4.9.36 final con acceso admin, membresías y embajadores
