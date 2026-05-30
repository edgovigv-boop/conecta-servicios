# Conecta Servicios v6.4.85 — Tienda admin y avatar en nube

## Qué corrige

1. Carrito/Tienda en modo admin:
   - al tocar el carrito desde admin abre Tienda global
   - muestra publicaciones VENDO visibles
   - conserva la posibilidad de abrir tiendas locales desde tarjetas de tiendas

2. Foto de perfil:
   - al cambiar foto de perfil, la imagen se sube a Supabase Storage
   - se guarda como URL pública https
   - se aplica a publicaciones propias con ownerAvatar seguro
   - otros celulares pueden ver la foto cuando la publicación se sincronice

## Qué NO cambia

- No toca diseño general.
- No toca mensajes globales admin.
- No cambia userId.
- No reclama publicaciones como propias.
- No guarda base64 pesado en el muro público.

## Commit sugerido

Corrige tienda admin y avatar visible en nube

## Prueba recomendada

1. Celular admin:
   - activar admin
   - tocar carrito
   - debe decir Tienda global y mostrar VENDO

2. Celular fiel o celular de esposa, donde sí existe foto:
   - entrar a Perfil
   - tocar Guardar perfil
   - debe decir que la foto queda visible en otros celulares
   - esperar unos segundos
   - revisar desde otro celular que la publicación muestre foto

Si no aparece la foto, vuelve a seleccionar la foto desde “Cambiar foto” para forzar subida a nube.
