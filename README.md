# Conecta Servicios v5.2.4

## Cambios principales

- Controles de usuario **solo en Perfil → Mis publicaciones**.
- En el muro general / explorador ya no aparece botón de borrar.
- Admin mantiene panel completo para editar, ocultar, activar y borrar.
- Muro con estilo visual tipo TikTok: multimedia vertical 9:16, texto y acciones encima con transparencia.
- Scroll con snap: cada publicación se centra al deslizar.
- Preparación para muro público multi-dispositivo con Supabase vía `/api/publications`.
- Fotos/videos se mantienen como antes en modo local; si configuras Supabase Storage, se intentan subir a `publication-media`.

## Modo local

La app funciona sin SQL ni credenciales, pero las publicaciones quedan en el dispositivo.

## Para que las publicaciones se vean en otros celulares

Configura en Vercel estas variables de entorno:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
SUPABASE_STORAGE_BUCKET=publication-media
```

Luego ejecuta el archivo:

```text
supabase-v5.2.4-muro-publico.sql
```

La `SERVICE_ROLE_KEY` solo se usa en backend serverless y no se expone al navegador.

Para videos/fotos públicas, usa el bucket de Supabase Storage:

```text
publication-media
```

Nota: para producción final se recomienda integrar Supabase Auth y reglas RLS por usuario. En esta versión se usa un identificador local por dispositivo para distinguir publicaciones propias.

## Pruebas recomendadas

1. Crear publicación en un celular.
2. Confirmar que aparece en Mis publicaciones.
3. Confirmar que aparece en Inicio y Explorar.
4. Con Supabase configurado, abrir otro celular y confirmar que aparece.
5. Confirmar que en el muro no aparece Borrar.
6. Entrar a Perfil → Mis publicaciones y confirmar Editar / Borrar.
7. Entrar a Admin y confirmar editar / ocultar / activar / borrar.
8. Subir video y confirmar reproducción.
9. Confirmar estilo vertical 9:16 tipo TikTok.
10. Deslizar y confirmar snap por publicación.
