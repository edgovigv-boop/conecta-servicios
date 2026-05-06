# Conecta Servicios v3.5 - ajustes de piloto

Esta versión reúne los cambios principales del piloto para reducir despliegues pequeños en Netlify.

## Incluye

- Conexión a Supabase para pedidos y perfiles.
- Publicaciones nuevas en revisión antes de mostrarse.
- Panel administrador oculto con `?admin=1`.
- Pedidos atendidos para cerrar solicitudes temporales sin borrarlas.
- Contacto enmascarado tipo `xxxxxx3145`.
- Oficina de registro únicamente por WhatsApp.
- Filtros más claros por estado y municipio.
- Texto visible de ubicación consultada: `Mostrando resultados para: Municipio, Estado`.
- Aviso de privacidad y términos básicos para piloto.

## Importante

No necesitas correr SQL nuevo si ya aplicaste las versiones anteriores hasta v3.3.2.

Para Netlify, sube el ZIP completo o arrastra la carpeta completa del proyecto.

## Acceso administrador

Abre tu sitio con:

```text
https://tu-sitio.netlify.app?admin=1
```

Luego entra con el PIN del piloto.

> Nota: el PIN en frontend no es seguridad real. Para una versión formal conviene usar Supabase Auth.


## Cambios v3.5

- Al presionar atrás desde Inicio, la app muestra: “Presiona atrás otra vez para salir”.
- La pantalla inicial muestra primero las acciones principales para reducir lectura inicial.
- El aviso de piloto se reubicó debajo de los botones principales.
- Al enviar un pedido o perfil, se abre WhatsApp con un mensaje listo para avisar a la oficina.

Nota: WhatsApp no permite enviar mensajes automáticamente desde una web sin intervención del usuario. La app abre el chat con el texto preparado y la persona debe tocar Enviar.
