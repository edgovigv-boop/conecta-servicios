# Conecta Servicios v4.9.51 — Dola.com externo copiar/pegar

## Objetivo

Esta versión corrige el enfoque anterior: Conecta Servicios ya no intenta replicar una experiencia DOLA interna con muchas pantallas. En su lugar, usa **Dola.com** como herramienta externa de apoyo, de forma parecida a como se puede abrir WhatsApp.

## Modelo

Conecta Servicios se mantiene como:

- feed limpio tipo red social;
- plantillas;
- publicaciones;
- explorar;
- perfil;
- membresía;
- embajadores y apartados estrella.

Dola.com se usa para:

- conversar con el usuario;
- ayudar a crear una publicación;
- ordenar la solicitud;
- preparar texto final para copiar;
- filtrar interesados;
- preparar mensaje listo para WhatsApp del anunciante cuando corresponda.

## Flujo al crear publicación

1. El usuario toca una plantilla.
2. Conecta muestra un puente simple hacia Dola.com.
3. Conecta genera un prompt contextual.
4. El usuario copia el prompt y abre Dola.com.
5. Conversa en Dola.com.
6. Copia el resultado final.
7. Regresa a Conecta y pega el texto.
8. Conecta intenta organizar la publicación.

## Flujo al contactar anunciante

1. El explorador toca “Mensaje”.
2. Conecta prepara un prompt para Dola.com con contexto de la publicación.
3. Dola.com ayuda a filtrar la solicitud.
4. El usuario obtiene un mensaje claro para enviar por WhatsApp o usar dentro de Conecta.

## Aviso

Dola.com es una herramienta externa. No se debe prometer integración directa ni automatización total si no existe API oficial. El usuario copia y pega de forma controlada.

## SQL

No requiere SQL nuevo para probar.

## Archivos principales

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json
- PATCH-INDEX-v4.9.51.txt
- CHECKLIST-v4.9.51.txt
- INSTRUCCIONES-CODEX-v4.9.51.txt

## Commit sugerido

Usar Dola.com externo para crear publicaciones y filtrar contactos v4.9.51
