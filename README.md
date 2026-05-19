# Conecta Servicios v4.9.36.2 — Hotfix Mi acceso en Mis publicaciones

Entrega consolidada sobre v4.9.36.1.

## Cambios incluidos

- Mantiene acceso admin visible con PIN.
- Mantiene ruta directa `/embajadores`.
- Mantiene plus blanco en el botón principal de publicar.
- Mueve el acceso de usuario/membresía al apartado **Mis publicaciones**.
- Retira visualmente el botón flotante de **Mi acceso** para que el usuario lo encuentre dentro de su espacio natural.
- Actualiza service worker para romper caché.

## Archivos a reemplazar en la raíz

```text
app.js
styles.css
service-worker.js
manifest.json
```

## Index.html

Aplicar el archivo `PATCH-INDEX-v4.9.36.2.txt`.

## SQL

No requiere SQL nuevo para esta prueba piloto.

## Commit sugerido

```text
Ubicar Mi acceso dentro de Mis publicaciones v4.9.36.2
```
