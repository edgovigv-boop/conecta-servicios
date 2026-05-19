# Conecta Servicios v4.9.36.3 — Hotfix botones landing Embajadores

Esta entrega corrige que el landing `/embajadores` abra correctamente pero sus botones no ejecuten acciones.

## Corrección principal

El `index.html` del landing usa estos botones:

- `startAmbassadorLandingFlow('embajador')`
- `startAmbassadorLandingFlow('referido')`
- `startAmbassadorLandingFlow('pago')`
- `startAmbassadorLandingFlow('manual')`
- `copyAmbassadorLandingLink()`

En la versión publicada esas funciones no estaban definidas en `app.js`, por eso los botones se veían pero no respondían.

## Qué se agregó

- Función global `startAmbassadorLandingFlow(type)`.
- Función global `copyAmbassadorLandingLink()`.
- Delegación de respaldo para volver a enganchar los botones del landing aunque el onclick inline falle por caché.
- Cache nuevo del service worker: `conecta-servicios-v4.9.36.3-botones-embajadores`.
- Manifest actualizado a `v=4.9.36.3-botones-embajadores`.

## Mapeo de botones

- “Quiero ser embajador” / “Registrarme” → registro de embajador.
- “Registrar referido” → registro de referido.
- “Activar membresía $98” / “Cobrar membresía” → Mi acceso/Membresía para visitantes; panel de pagos si el admin está activo.
- “Manual rápido” → manual de embajadores.
- “Copiar enlace para compartir” → copia `/embajadores` o `/embajadores?ref=CODIGO`.

## SQL

No requiere SQL nuevo.

## Commit sugerido

`Corregir botones del landing de embajadores v4.9.36.3`
