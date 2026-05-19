# Conecta Servicios v4.9.36 — entrega consolidada

Versión consolidada para revisión local antes de subir a GitHub/Vercel.

## Implementaciones incluidas

1. Acceso admin recordado.
   - Acepta `?Admin`, `?=Admin`, `?admin=1` y `?admin=true`.
   - Después de validar el PIN, el acceso queda recordado en ese navegador.

2. Ruta directa de embajadores.
   - `/embajadores` abre el landing de Embajadores Conecta.

3. Corrección visual del botón principal.
   - El símbolo `+` del botón circular de publicar queda en blanco para mejorar lectura.

4. Acceso de usuarios y membresías en modo piloto.
   - Nueva ruta: `/membresia` o `/mi-acceso`.
   - Captura usuario, WhatsApp, municipio y código de embajador.
   - Soporta enlaces con referido: `/membresia?ref=CON-ANA-101`.
   - Permite solicitar activación de membresía anual de $98 MXN.
   - La activación queda manual para admin.
   - Usuario activo puede publicar ilimitadamente durante el periodo vigente.
   - Embajadores pueden crear/copiar enlaces directos para sus clientes.

## Archivos a reemplazar

Copiar a la raíz del proyecto:

- `app.js`
- `styles.css`
- `service-worker.js`
- `manifest.json`

## SQL

Para prueba local de esta entrega: **No requiere SQL nuevo**.

Para producción real multiusuario: se incluye un archivo SQL opcional como base de trabajo:

- `SQL-OPCIONAL-MEMBRESIAS-v4.9.36.sql`

No lo ejecutes automáticamente sin revisar permisos, RLS y flujo de autenticación.

## Commit sugerido

```txt
Actualizar v4.9.36 con acceso, membresías y embajadores
```

## Nota de publicación

Subir primero a GitHub, esperar despliegue en Vercel y probar en incógnito:

- `/`
- `/embajadores`
- `/membresia`
- `/membresia?ref=CON-PRUEBA`
- `/?admin=1`

