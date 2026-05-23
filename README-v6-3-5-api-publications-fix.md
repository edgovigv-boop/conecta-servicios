# Conecta Servicios v6.3.5 - API publications fix

## Qué corrige

El endpoint `/api/publications` seguía devolviendo:

```json
{"ok":false,"error":"PUBLICATIONS_API_ERROR","message":"fetch failed"}
```

Esta versión corrige el backend para:

- Limpiar espacios en `SUPABASE_URL`.
- Quitar `/rest/v1/` si se pegó por error en la URL.
- Quitar diagonales finales.
- Validar que la URL sea `https://...supabase.co`.
- Limpiar espacios en `SUPABASE_SERVICE_ROLE_KEY`.
- Agregar diagnóstico seguro sin mostrar llaves.

## Archivo a subir

Subir este archivo reemplazando el existente:

```text
api/publications.js
```

No necesitas subir `index.html`, `app.js` ni `styles.css` para esta corrección.

## Después de subir

Commit sugerido:

```text
Corrige API de publicaciones y diagnóstico Supabase
```

Cuando Vercel esté en Ready, abre:

```text
https://conecta-servicios.vercel.app/api/publications?debug=1
```

Debe mostrar algo parecido a:

```json
{
  "ok": true,
  "diagnostics": {
    "hasUrl": true,
    "hasServiceRoleKey": true,
    "validUrl": true,
    "supabaseHost": "qfneazokicmyrtcyukqy.supabase.co",
    "table": "connecta_publications"
  }
}
```

Luego abre:

```text
https://conecta-servicios.vercel.app/api/publications
```

Resultado esperado:

```json
{"ok":true,"posts":[]}
```

o con publicaciones.

## Si sigue fallando

- `validUrl:false`: el valor de `SUPABASE_URL` sigue mal.
- `hasServiceRoleKey:false`: falta la service role key.
- `supabaseHost` distinto al proyecto correcto: Vercel sigue usando otra URL.
- `SUPABASE_GET_FAILED`: ya conectó con Supabase, pero falta tabla o permisos.

No compartas la service role key ni la anon key en capturas.
