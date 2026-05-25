# Conecta Servicios v6.4.41 - Layout limpio estable

## Objetivo

Reconstruir de forma limpia el layout móvil del feed, sin seguir acumulando parches visuales.

## Base usada

Se tomó como base la v6.4.34 porque era la última base funcional antes de los intentos de altura/layout v6.4.35 a v6.4.40.

## Qué se limpió

- Se eliminó/neutralizó el bloque que dejaba `.post-body` en flujo normal y provocaba que la publicación creciera debajo de la multimedia.
- Se quitó la capa visual acumulada de herramientas que agregaba el falso elemento `Herramientas`.
- Se consolidó el layout móvil del feed en una sola sección CSS:
  - `v6.4.41-layout-limpio-estable`
- Se ocultaron duplicidades visuales de audio/altavoz para evitar los dos iconos cancelados.
- Se mantuvieron las herramientas reales del dueño dentro del bloque inferior.

## Qué se corrigió

- La publicación ya no debe verse como tarjeta larguísima.
- La multimedia vuelve a ocupar el fondo principal.
- La información queda superpuesta sobre foto/video.
- El bloque inferior no agrega altura extra al feed.
- La barra inferior queda completa y fija.
- Las herramientas del dueño quedan ordenadas abajo.
- No aparecen dos controles de audio/altavoz.
- La zona/cobertura queda visible dentro del bloque inferior.

## Qué se conservó

- Perfil.
- Mensajes.
- Recepción de mensajes por identidad/ownerId.
- Publicaciones reales.
- Editar aquí.
- Guardar y volver.
- Encuadre.
- Encuadre por foto.
- Multimedia.
- Completo.
- Borrar.
- Reintentar cuando aplique.

## Qué NO se tocó

- No se tocó `api/messages.js`.
- No se cambió Supabase.
- No se cambió Storage.
- No se cambió SQL.
- No se cambiaron endpoints.
- No se cambió el modelo de datos.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-41-layout-limpio-estable.md`

## No tocar al subir

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Reconstruye layout movil estable sin parches acumulados

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6441

## Checklist

1. Confirmar que aparece `v6.4.41`.
2. Confirmar que no hay altavoces duplicados.
3. Confirmar que la publicación no se ve larguísima.
4. Confirmar que foto/video ocupa el fondo principal.
5. Confirmar que la información está sobre la multimedia.
6. Confirmar que herramientas aparecen abajo, no arriba.
7. Confirmar que barra inferior está completa.
8. Probar `...leer` y `...ocultar`.
9. Probar carrusel.
10. Probar Encuadre por foto.
11. Probar Editar aquí → Guardar y volver.
12. Probar Multimedia.
13. Enviar mensaje desde celular visitante y recibirlo en celular dueño.
14. Confirmar que Perfil sigue visible.
