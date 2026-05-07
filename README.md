# Conecta Servicios v3.8 - estructura simple

Esta versión cambia la estructura de la app para eliminar la separación pública entre pedidos y perfiles.

## Cambios principales

- Un solo proceso de registro: **REGISTRARME**.
- Un solo espacio público: **Resultados**.
- Todo convive como publicación: servicios, necesidades, viajes y envíos.
- Categorías visibles:
  - 🚘 Viajes compartidos
  - 📦 Mensajería y envíos
  - General / Servicios locales
- Enlaces clicables en descripciones.
- Botón compartir.
- Folios tipo `PUB-123AB`.
- Solicitud de modificación y atendido verificada por últimos 4 dígitos.
- Panel admin unificado para editar, aprobar, ocultar o marcar atendido.

## Importante

Esta versión requiere correr el archivo SQL:

`supabase-v3.8-estructura-simple.sql`

Ese SQL crea una nueva tabla llamada `publicaciones` y migra los pedidos y ayudantes anteriores a la nueva estructura unificada.

## Publicación

Después de correr el SQL, sube a GitHub:

- index.html
- styles.css
- app.js
- README.md

Vercel publicará automáticamente.


## v3.8.1

- Pantalla principal más limpia.
- Se quitó la etiqueta de prueba pública municipal, el contador de revisión y el mensaje visible de sincronización.
- Botones principales renombrados a PUBLICA y PUBLICACIONES.
- Navegación inferior ajustada a Publicaciones / Publica.
- Botón morado con símbolo + y efecto visual suave.
