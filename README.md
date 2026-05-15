# Conecta Servicios v4.8.3 — Reconstrucción visual controlada

Esta versión limpia la capa visual anterior y deja una arquitectura de estilos más estable para que el Home y Publicaciones se acerquen al diseño aprobado.

## Cambios principales

- `styles.css` fue reconstruido como hoja limpia v4.8.3.
- El CSS anterior queda guardado como `styles-legacy-v482.css` solo como respaldo, ya no se carga en la app.
- Home reconstruido con identidad visual morada, hero, botón central, tarjetas de mensajes/aprendizaje, contador e instalación.
- Navegación inferior de 5 accesos: Inicio, Para ti, Publica, Mensajes y Aprendizaje.
- Buscador corregido: un solo icono y campo desbloqueado.
- Al entrar desde “Publicaciones cerca de mí”, se abre Todo México, se limpian filtros y se muestran todos los registros activos. La ubicación solo ordena cercanos primero, no oculta registros.
- Si Estado es “Todo México”, Municipio queda deshabilitado para evitar listas incompletas o miles de municipios.
- Caché/PWA actualizado a v4.8.3.

## Prueba recomendada después de Vercel

1. Abrir en modo incógnito o borrar caché.
2. Entrar a Inicio.
3. Tocar “Publicaciones cerca de mí”.
4. Verificar que el primer filtro diga Todo México y municipio esté deshabilitado.
5. Confirmar que el resumen muestre el total de registros activos disponibles.
6. Probar escritura en el buscador.
