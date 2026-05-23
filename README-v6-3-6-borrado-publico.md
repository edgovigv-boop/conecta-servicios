# Conecta Servicios v6.3.6 - Borrado público sincronizado

## Qué corrige

Después de que el muro público ya quedó funcionando entre celulares, se detectó que al borrar una publicación desaparecía del celular donde se borraba, pero seguía apareciendo en otro celular.

## Causa

El frontend quitaba la publicación localmente antes de confirmar el borrado en Supabase. Además, el endpoint DELETE puede fallar si el `ownerId` local no coincide exactamente.

## Solución aplicada

Esta versión cambia el borrado por un borrado suave público:

- Al borrar, la publicación se marca como `status: "eliminada"`.
- Esa marca se sincroniza con `/api/publications` usando POST.
- Todos los celulares filtran publicaciones con `status: "eliminada"`.
- Si no logra sincronizar, la app avisa que no pudo borrar en el muro público.

## Archivo a subir

Sube/reemplaza solo:

```text
app.js
```

## No tocar

- api
- assets
- index.html
- styles.css
- manifest.json
- service-worker.js

## Commit sugerido

Corrige borrado público sincronizado

## Cómo probar

1. Publica una foto ligera.
2. Confirma que aparece en el otro celular.
3. Borra la publicación desde el celular que la creó.
4. En el otro celular refresca o espera unos segundos.
5. La publicación debe desaparecer.

## Nota

La publicación puede seguir existiendo como registro interno en Supabase, pero marcada como eliminada. La app ya no la muestra.
