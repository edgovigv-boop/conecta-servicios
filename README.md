# Conecta Servicios v5.2.8

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


## v5.2.6 - Publicar visible inmediato

Corrección urgente del guardado de publicaciones. Ahora todos los flujos llaman a una función central `publishPost()` que:

- guarda la publicación localmente para verla al instante;
- sube multimedia a Supabase Storage cuando está disponible;
- guarda la publicación pública mediante `/api/publications`;
- refresca el muro;
- muestra estado `Pública` o `Borrador local` en Mis publicaciones;
- permite reintentar subir publicaciones locales al muro público.

No requiere SQL nuevo. Usa el SQL de v5.2.4 ya aplicado.


## v5.2.5 - Crear igual con DOLA y Meta IA

Cambios principales:

- El botón **+ Crear** inicia el flujo con DOLA tomando como inspiración la publicación visible del muro.
- El botón **Igual** abre DOLA con un prompt adaptado a la publicación elegida.
- DOLA recibe contexto de la publicación original y debe guiar al usuario paso a paso, sin copiar literal.
- Después de pegar el texto de DOLA, aparece el bloque **Generar video con Meta IA**.
- El botón de Meta IA copia un prompt de video vertical 9:16 y abre Meta IA.
- El usuario descarga el video desde Meta IA y lo sube en **Fotos / videos**.
- Se mantiene el respaldo actual: DOLA externo, multimedia, Supabase, muro público, controles solo en Perfil/Admin.

Nota: Meta IA no se integra por API en esta versión. Se usa como puente seguro: copiar prompt + abrir Meta IA.


## v5.2.7 - Botón PUBLICAR visible y scroll seguro

- Corrige el caso donde el botón final PUBLICAR quedaba detrás de la barra inferior.
- Desactiva el scroll tipo TikTok dentro del flujo Publicar para evitar rebote del formulario.
- Mantiene el snap tipo TikTok en Inicio, Buscar y Mis publicaciones.
- Agrega zona segura inferior para subir fotos/videos y publicar sin que el menú tape el botón.
- No requiere SQL nuevo.


## v5.2.8 - DOLA limpio y Meta IA estricta

Cambios acumulados sobre v5.2.7:

- El botón `+ Crear` y el botón `Igual` abren una pantalla limpia con un solo círculo central de DOLA.
- Se eliminan del flujo visual los mensajes de Próximamente, recuadros de prompt, instrucciones largas y botones sobrantes.
- El prompt queda oculto y se prepara automáticamente según la publicación visible, plantilla o publicación usada como inspiración.
- Al tocar el círculo, la app intenta usar DOLA dentro de Conecta si la API está disponible. Si no está disponible, copia el prompt oculto y abre DOLA externo sin mostrar el prompt al usuario.
- Al volver, aparece un único cuadro para pegar o recibir el texto limpio de DOLA.
- El botón `✏️ EDITAR Y TERMINAR` lleva a la edición final con Meta IA y multimedia.
- El prompt para Meta IA queda estricto: video 5:2 o 9:16, sin texto/letras/palabras dentro del video, solo imágenes, movimiento, música y transiciones.
- No requiere SQL nuevo. Usa el SQL del muro público v5.2.4 si ya fue aplicado.

### Commit sugerido

```text
Simplificar DOLA con círculo único y prompt Meta estricto v5.2.8
```
