# Conecta Servicios v4.9.25 — Hotfix Feed y Encuestas

Correcciones enfocadas:

- Feed inicial: el Home vuelve a cargar publicaciones al abrir la app, sin depender de tocar “Para ti”.
- Hacerlo real: redirige a la publicación guiada tipo encuesta/wizard para Solicitantes, Agentes, Negocios, Servicios y Crecimiento.
- Embajadores y Aprendizaje conservan sus rutas actuales.
- Botón +: mantiene el plus azul, pero la pantalla de acciones queda más equilibrada visualmente.
- Explorar: vuelve a usar registros reales activos de Supabase, mientras el Home conserva las publicaciones piloto tipo feed.
- Home: se agrega acceso a Oficina y acceso Admin cuando se entra con `?admin=1`.
- PWA/cache actualizado a v4.9.25.

## Validación rápida

1. Abrir `/` y confirmar que el feed aparece sin tocar “Para ti”.
2. Tocar “Hacerlo real” en una publicación de solicitantes, agentes, negocios, servicios y crecimiento.
3. Confirmar que se abre el formulario guiado para publicar una oportunidad similar.
4. Tocar el botón `+` inferior y revisar que las opciones se vean equilibradas.
5. Tocar Explorar y confirmar que se muestran registros reales activos.
6. Entrar con `?admin=1` y confirmar que aparece acceso de administración.
