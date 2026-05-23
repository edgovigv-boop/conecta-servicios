# Conecta Servicios v6.3.4 - Formulario estable

## Qué corrige

Esta versión corrige el problema crítico donde no se podía escribir en la descripción.

## Causa probable

La app estaba sincronizando y renderizando pantallas mientras el usuario estaba en el formulario de publicación. En móviles eso puede hacer que el campo de descripción pierda foco, se borre o no permita escribir.

## Cambios

- La sincronización automática ya no renderiza mientras estás en la pantalla de publicar.
- El polling se pausa mientras estás escribiendo una publicación.
- La descripción se guarda como borrador interno mientras escribes.
- La zona y categoría también se guardan como borrador.
- La vista previa de multimedia se hizo más compacta.
- El campo de descripción está más grande y arriba.
- Después de elegir foto/video, la app enfoca la descripción.
- Se mantiene la lógica de publicar primero los datos básicos y luego multimedia.

## Archivos para subir

- index.html
- styles.css
- app.js
- manifest.json
- service-worker.js
- README-v6-3-4-formulario-estable.md

## No tocar

- api
- assets

## Commit sugerido

Corrige formulario de publicación y escritura de descripción

## Prueba rápida

1. Subir archivos.
2. Abrir app.
3. Tocar +.
4. Elegir foto o video.
5. Tocar descripción.
6. Escribir varias líneas.
7. Esperar 10 segundos sin publicar.
8. Confirmar que no se borra ni se cierra teclado.
9. Agregar zona y categoría.
10. Publicar.
