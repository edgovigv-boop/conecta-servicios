# Conecta Servicios v4.9.40 — Publicar con Asistente integrado

## Objetivo
Integrar el **Asistente de publicación** dentro del modelo principal de la app, sin botones flotantes, y establecer el modelo freemium:

- **Gratis:** publicación básica sencilla.
- **Membresía:** Asistente avanzado para recibir pedidos, citas, cotizaciones, solicitudes o mensajes filtrados.

## Cambios principales

1. **Publicación básica gratis**
   - Título.
   - Descripción.
   - Categoría.
   - Municipio / zona.
   - Foto opcional.
   - Contacto básico.
   - Visibilidad normal.

2. **Asistente avanzado con membresía**
   - Pedido con menú.
   - Cita.
   - Contacto directo.
   - Cotización.
   - Solicitud de servicio.
   - Viaje compartido.
   - Envío o mensajería.
   - Ofrecer ayuda / responder necesidad.

3. **Integración en barra inferior**
   - Se elimina el acceso flotante del asistente.
   - El acceso anterior de asistente/orientación de la barra inferior se sustituye por **Asistente**.
   - El botón abre el centro de solicitudes y asistentes de publicaciones.

4. **Flujo de publicar**
   - El botón `+` se mantiene.
   - Ya no se bloquea la publicación básica por falta de membresía.
   - En la pantalla final se muestra el mensaje freemium:

   > Tu publicación básica es gratis. Activa la membresía para recibir pedidos, citas, cotizaciones o mensajes filtrados.

5. **Admin libre**
   - Admin puede publicar, activar asistentes, probar flujos y supervisar sin membresía.

## SQL

No requiere SQL nuevo para probar en piloto.

El archivo `supabase-publication-assistant.sql` queda como base opcional futura para producción real multiusuario.

## Archivos modificados

- `app.js`
- `styles.css`
- `service-worker.js`
- `manifest.json`
- `PATCH-INDEX-v4.9.40.txt`
- `CHECKLIST-v4.9.40.txt`
- `INSTRUCCIONES-CODEX-v4.9.40.txt`

## Commit sugerido

```text
Integrar modelo freemium y Asistente de publicación en barra inferior v4.9.40
```
