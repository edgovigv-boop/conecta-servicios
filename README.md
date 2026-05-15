# Conecta Servicios v4.8.5 — ajustes finales para revisión

Versión preparada para subir a GitHub/Vercel.

## Cambios incluidos

- Se descongelaron los tres controles superiores de Publicaciones:
  - Estado
  - Municipio
  - Buscador
- Se mantuvo la barra de categorías del lado derecho más abajo.
- Los íconos de categorías ahora flotan como botones independientes, sin riel blanco de fondo.
- El botón central inferior quedó solo con el símbolo +, sin texto debajo.
- Mensajes inteligentes quedó más limpio:
  - sin texto introductorio largo,
  - sin panel informativo final,
  - solo chat, opciones rápidas y acciones.
- Aprendizaje ahora muestra cursos/rutas como botones, no solo guías internas.
- Se quitaron los botones genéricos debajo del buscador de cursos.
- En el Home se quitó el ícono de Conecta que no estaba quedando bien y se dejó solo el texto “Conecta Servicios”.
- El PWA ahora usa un ícono simple: círculo azul con símbolo +.
- Caché/versión actualizados a v4.8.5 para evitar que el teléfono conserve la versión anterior.

## Validación rápida

1. Subir los archivos al repositorio conectado a Vercel.
2. Esperar el despliegue.
3. Probar en modo incógnito o borrar caché.
4. Revisar:
   - Publicaciones: los filtros ya no quedan fijos al hacer scroll.
   - Barra derecha: íconos flotantes sin fondo tipo riel.
   - Mensajes: pantalla limpia de chat.
   - Aprendizaje: cursos mostrados como botones.
   - Home/PWA: texto Conecta Servicios y nuevo ícono azul con +.
