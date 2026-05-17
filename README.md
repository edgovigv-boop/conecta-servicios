# Conecta Servicios v4.8.6 — Presentación inversionistas

Versión preparada para subir a GitHub/Vercel sin tocar Supabase.

## Enfoque

Esta versión estabiliza la experiencia visual y deja la app lista para revisión de usuarios e inversionistas.

## Cambios incluidos

- Home más limpio y orientado a presentación.
- Hero aclarado para que la escena sea más visible y no se vea como captura pegada.
- Header del Home simplificado: solo texto “Conecta Servicios”.
- CTA “Oportunidades para ti” conservado con glow y protagonismo.
- Botón “Publicaciones cerca de mí” con movimiento sutil.
- Pantalla de publicaciones más limpia:
  - Estado,
  - Municipio,
  - buscador compacto,
  - barra lateral flotante.
- Al entrar a publicaciones, “Todo” queda activo por defecto.
- Estado default: “Todo México”.
- Municipio queda deshabilitado cuando está seleccionado “Todo México”.
- Buscador con una sola lupa y placeholder corto.
- Se quitó texto pesado de resultados para que las publicaciones sean protagonistas.
- Barra lateral de categorías queda más baja y sin riel blanco.
- Se actualizó el catálogo local de municipios para que Hidalgo no quede vacío.
- Mensajes inteligentes queda como chat piloto limpio.
- Aprendizaje queda como rutas/cursos gratuitos en botones.
- PWA mantiene ícono simple azul con símbolo +.
- Cache/manifest/service worker actualizados a v4.8.6.

## Validación rápida

1. Subir estos archivos al repositorio conectado a Vercel.
2. Esperar el despliegue automático.
3. Probar en incógnito o borrar caché del navegador.
4. Revisar:
   - Home visualmente limpio.
   - Publicaciones muestra registros al entrar.
   - Estado inicia en Todo México.
   - Municipio queda desactivado hasta elegir estado.
   - Hidalgo muestra municipios reales al seleccionarlo.
   - Buscador acepta texto.
   - Barra lateral no tapa filtros.
   - Chat y Aprendizaje abren correctamente.
