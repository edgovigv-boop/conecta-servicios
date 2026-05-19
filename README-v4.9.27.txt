Conecta Servicios v4.9.27 — Hotfix navegación real

Cambios:
- Restaura las secciones de encuesta guiada y publicación paso a paso que faltaban en el HTML.
- Corrige que los botones Necesito algo / Ofrezco algo / Quiero ganar dinero aparecieran globalmente. Ahora solo se muestran en Oportunidades al tocar el +.
- Refuerza la carga inicial del feed para que no quede en blanco.
- Mantiene Hacerlo real conectado a publicación guiada, encuestas, Chat de negocios, Embajadores y Aprendizaje según categoría.
- No toca Supabase.
- Cache/PWA actualizado a v4.9.27.

Validación:
1. Abrir la app: debe aparecer el feed sin tocar Para ti.
2. Tocar + inferior: deben aparecer solo ahí los tres botones.
3. Salir a Inicio/Publicaciones/Embajadores: esos tres botones ya no deben quedarse abajo.
4. Probar Hacerlo real en solicitante, agente, negocio, servicio, crecimiento, embajadores y aprendizaje.
5. Probar Explorar para ver registros reales.
6. Probar ?admin=1 para acceso administrativo.
