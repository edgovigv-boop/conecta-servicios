# Conecta Servicios v5.2.12

## Cambios de esta versión

- Corrige únicamente el regreso desde DOLA hacia Conecta Servicios.
- Antes de abrir DOLA, guarda un contexto temporal de publicación:
  - origen del flujo: `+`, `Crear Igual` u oportunidad;
  - plantilla seleccionada;
  - publicación original si aplica;
  - prompt oculto;
  - borrador temporal.
- Al volver desde DOLA, Conecta restaura directamente el editor final de publicación.
- Si hay texto generado por DOLA, se carga como borrador editable.
- Se conservan las funciones normales del editor:
  - editar texto;
  - seleccionar zona/categoría;
  - subir fotos/videos;
  - usar Meta IA si aplica;
  - publicar.
- No requiere SQL nuevo.
- No modifica Supabase, Storage, muro, Admin, videos ni otros módulos.

## Variables de entorno

Se conservan las mismas variables ya configuradas en Vercel:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET=publication-media
```

## Subida a GitHub

Sube todo el contenido del paquete excepto archivos SQL si hubiera alguno.

## Commit sugerido

```text
Corregir regreso de DOLA al editor de publicación v5.2.12
```

---

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

## v5.2.10 - DOLA prompt oculto y retorno automático

Corrección enfocada únicamente en el flujo de DOLA:

- Al abrir DOLA desde `+ Crear`, `Crear Igual` o una oportunidad, la app prepara el `hiddenPrompt` sin mostrarlo al usuario.
- La app intenta enviar ese prompt automáticamente mediante:
  1. URL con parámetros `prompt`, `source`, `session` y `return_url`.
  2. `postMessage` al tab abierto de DOLA, si DOLA lo soporta.
  3. Fallback obligatorio al portapapeles.
- Al volver a Conecta, la app intenta recuperar automáticamente el resultado desde:
  1. `postMessage`, si DOLA envía el resultado.
  2. Parámetros de URL como `dolaText`, `dola_result` o `result`.
  3. Lectura del portapapeles al recuperar foco, si el navegador lo permite.
- El texto generado se inserta en el editor de DOLA/Conecta mediante asignación de valor y eventos `input` y `change`, para que quede editable.

Nota técnica: por seguridad del navegador, una app no puede escribir directamente dentro de una página externa de otro dominio si esa página no acepta `postMessage`, parámetros URL o una integración oficial. Por eso se conserva fallback de portapapeles.

No requiere SQL nuevo.


## v5.2.10 - DOLA inyección ida y vuelta

Corrección puntual del puente DOLA:

- Envía `hiddenPrompt` por `postMessage` con origen validado.
- Intenta inyectar el prompt si el editor es accesible.
- Usa fallback con `navigator.clipboard.writeText`.
- Al volver a Conecta, intenta recibir `generatedText` por `postMessage`, URL, storage o portapapeles.
- Inyecta el texto en el editor de publicación disparando eventos `input` y `change`.
- Agrega logs con prefijo `[DOLA_BRIDGE]`.
- No requiere SQL nuevo.

Limitación técnica: si DOLA externo no acepta `postMessage`, parámetros, iframe bridge o API oficial, el navegador no permite manipular su editor directamente por seguridad. En ese caso se conserva el fallback de portapapeles.


## v5.2.11 - DOLA portapapeles asistido

Corrección puntual del puente DOLA para que el usuario no se pierda cuando Android/Chrome pide permiso para pegar o leer información.

Cambios:
- Se mantiene postMessage con origen validado.
- Se conserva la inyección en editores accesibles con eventos input y change.
- Si se usa portapapeles, Conecta muestra primero un aviso humano antes del permiso del navegador.
- Al volver desde DOLA, Conecta pide permiso de forma guiada y coloca el texto generado en el editor.
- Si falla la inyección, muestra un cuadro editable y el botón “Usar este texto en mi publicación”.
- No toca Supabase, Storage, videos, Admin, Meta IA, muro ni diseño general.

No requiere SQL nuevo.


## v5.2.14-dola-opcional-editor-rapido

Flujo agregado: **Publicación rápida / Abuelita friendly**.

- Al tocar **Crear / +**, la primera pantalla muestra un solo campo grande: **¿Qué quieres publicar?**
- Se agregan chips visuales: Vendo algo, Ofrezco servicio, Necesito ayuda, Busco trabajo, Ofrezco viaje, Busco viaje, Envío o mandado, Negocio local y Otro.
- El botón **PREPARAR MI PUBLICACIÓN** convierte el texto libre en un borrador editable con tipo/categoría sugeridos.
- Se mantiene la opción **DOLA** para mejorar o generar la publicación desde el texto libre.
- Se agregó soporte inicial de dictado por voz si el navegador lo permite.
- No requiere SQL nuevo.

Commit sugerido: `Agregar publicación rápida abuelita friendly v5.2.13`


## v5.2.14 - DOLA opcional dentro del editor rápido

- La pantalla intermedia con círculo grande de DOLA ya no se usa como paso obligatorio.
- DOLA queda como ayuda opcional dentro del editor rápido mediante un botón circular pequeño/mediano.
- Al tocar DOLA se abre un modal sencillo con pasos cortos: copiar, abrir DOLA, pegar, mejorar, copiar respuesta y regresar.
- El usuario permanece en el editor rápido: pega la respuesta final en el mismo campo “¿Qué quieres publicar?” y continúa con “PREPARAR MI PUBLICACIÓN”.
- No requiere SQL nuevo.
