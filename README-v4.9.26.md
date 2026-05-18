# Conecta Servicios v4.9.26 — Rescate funcional: encuestas + Chat de negocios

Esta versión mantiene el Home tipo feed social y corrige la navegación crítica.

## Cambios principales

- El feed del Home se fuerza a cargar al abrir la app para evitar pantalla en blanco.
- El botón **Hacerlo real** vuelve a redirigir a flujos funcionales:
  - Solicitantes → publicación guiada tipo encuesta/plantilla.
  - Servicios → publicación guiada tipo encuesta/plantilla.
  - Agentes → encuesta de agente o mandados según la publicación piloto.
  - Negocios → Chat de negocios / activación de negocio.
  - Crecimiento → Agentes de crecimiento / campaña por comisión.
  - Embajadores → Embajadores Conecta.
  - Aprendizaje → Aprendizaje.
- Se recupera explícitamente **Chat de negocios** como flujo propio, sin confundirlo con el Asistente de orientación.
- El botón **+** conserva el diseño azul y abre oportunidades; “Quiero ganar dinero” ahora muestra rutas claras.
- El acceso a oficina y admin se mantiene; admin se habilita con `?admin=1`.
- Explorar mantiene el regreso a registros reales activos.
- No toca Supabase.

## Validación sugerida

1. Abrir la app y confirmar que el Home no queda en blanco.
2. Probar **Hacerlo real** en publicaciones de solicitantes, agentes, negocios, servicios y crecimiento.
3. Probar una publicación de negocio y confirmar que abre **Chat de negocios**.
4. Probar el botón **+** inferior.
5. Abrir Explorar y confirmar registros reales.
6. Entrar con `?admin=1` y confirmar acceso de administración.
