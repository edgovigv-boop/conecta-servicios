# Conecta Servicios v6.4.44 - Menú flotante en publicación

## Objetivo

Restaurar el estilo de menú superior flotante y transparente que se ve sobre cada publicación, tomando como referencia el ejemplo tipo TikTok, pero sin copiarlo directamente.

## Qué cambia

- El menú superior queda flotante y transparente.
- Se elimina `Siguiendo` de la parte superior porque ya existe en la barra inferior.
- El orden superior queda:
  - Municipio / zona
  - Carrito de mandado / tienda
  - Corazón / Para ti
  - Lupa / búsqueda
- `Tienda` deja de ser texto y se representa con carrito 🛒.
- `Para ti` deja de ser texto y se representa con corazón ♥.
- La lupa se mantiene como búsqueda.
- Los filtros Vendo / Ofrezco / Necesito se conservan, pero más ligeros y flotantes.
- Se mantiene la lógica de navegación y filtros.
- No se toca mensajes, perfil, Supabase, Storage ni SQL.

## Archivos modificados

- `app.js`
- `index.html`
- `boot-diagnostics.js`
- `service-worker.js`
- `manifest.json`
- `api/publications.js`
- `README-v6-4-44-menu-flotante-publicacion.md`

## No tocar

- `api/messages.js`
- `api/public-config.js`
- `api/video-diagnostics.js`
- `api/storage-diagnostics.js`
- `styles.css`
- `assets`
- `SQL`

## Commit sugerido

Restaura menu flotante de publicaciones

## Después de Vercel Ready

Abrir:

https://conecta-servicios.vercel.app/?v=6444

## Checklist

1. Confirmar que aparece `v6.4.44`.
2. Confirmar que arriba se ve: municipio/zona, carrito, corazón, lupa.
3. Confirmar que ya no aparece `Siguiendo` arriba.
4. Confirmar que `Siguiendo` sigue abajo.
5. Confirmar que el carrito abre tienda/mandados.
6. Confirmar que el corazón activa Para ti.
7. Confirmar que la lupa abre búsqueda.
8. Confirmar que Vendo/Ofrezco/Necesito siguen funcionando.
9. Confirmar que mensajes y perfil siguen funcionando.
