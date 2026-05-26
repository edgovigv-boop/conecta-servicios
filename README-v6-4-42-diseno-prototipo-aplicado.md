# Conecta Servicios v6.4.42 - Diseño del prototipo aplicado a app real

## Objetivo
Aplicar el lenguaje visual del HTML de rediseño/prototipo a la app real, sin convertir la app en una maqueta estática.

## Importante
El HTML del prototipo no se puede pegar directamente como `index.html` porque eso reemplazaría la app real por pantallas fijas y rompería mensajes, perfil, publicaciones, edición, multimedia y Supabase.

En esta versión se tradujo su sistema visual a las clases reales de la app:
- azul rey, blanco y gris claro
- encabezado blanco profesional
- chips de categoría limpios
- multimedia protagonista
- información superpuesta con degradado
- botones principales estilo app móvil
- herramientas del dueño ordenadas abajo
- barra inferior blanca y completa
- sin altavoces duplicados

## Qué cambia
- Rediseña visualmente el feed real.
- Ajusta header, filtros, publicaciones, botones, herramientas y barra inferior.
- Oculta controles duplicados de audio/altavoz.
- Mantiene herramientas del dueño solo en publicaciones propias.
- Mantiene paneles de edición, multimedia y encuadre.

## Qué conserva
- Mensajes.
- Perfil.
- Identidad/ownerId.
- Publicaciones reales.
- Editar aquí.
- Guardar y volver.
- Encuadre.
- Multimedia.
- Completo.
- Borrar.
- Supabase Storage.

## Qué NO toca
- No toca `api/messages.js`.
- No toca Supabase.
- No toca Storage.
- No toca SQL.
- No cambia endpoints.
- No reemplaza la app por el prototipo HTML.

## Archivos modificados
- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-42-diseno-prototipo-aplicado.md`

## No tocar al subir
- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido
Aplica diseño visual del prototipo a app real

## Después de Vercel Ready
Abrir:
https://conecta-servicios.vercel.app/?v=6442

## Checklist
1. Confirmar que aparece `v6.4.42`.
2. Confirmar que el feed se ve con diseño azul/blanco/gris.
3. Confirmar que no aparecen altavoces duplicados.
4. Confirmar que la barra inferior está completa.
5. Confirmar que herramientas del dueño aparecen abajo.
6. Confirmar que visitante no ve herramientas del dueño.
7. Probar mensaje visitante → dueño.
8. Probar perfil.
9. Probar Editar aquí → Guardar y volver.
10. Probar Encuadre.
11. Probar Multimedia.
