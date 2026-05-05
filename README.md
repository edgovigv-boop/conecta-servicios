# Conecta Servicios v3.4 - versión piloto consolidada

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
