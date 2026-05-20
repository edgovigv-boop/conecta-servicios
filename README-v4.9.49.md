# Conecta Servicios v4.9.49 — DOLA asistente interno

Esta versión ordena el sistema de bots internos bajo la identidad **DOLA**, el asistente dentro de Conecta Servicios.

## Modelo

La publicación sigue siendo la pieza principal del feed. Cada publicación tiene un solo botón principal: **Mensaje**.

Ese botón abre:

- **DOLA**, si el anunciante eligió atención interna.
- **WhatsApp**, si el anunciante eligió contacto directo.

No deben mostrarse ambos canales al mismo tiempo.

## Nombres por tipo de publicación

- Solicitante: **DOLA Bot de contacto**
- Agente: **DOLA Bot de atención a solicitudes**
- Negocio: **DOLA Bot de atención a clientes**

## Aviso de uso

Antes de usar DOLA por primera vez, se muestra un aviso breve indicando que DOLA organiza información para crear publicaciones y atender solicitudes dentro de Conecta Servicios.

## Modo piloto

No requiere SQL nuevo para probar. Usa localStorage para configuración, respuestas y aceptación del aviso.

## Archivos

- app.js
- styles.css
- service-worker.js
- manifest.json
- vercel.json
- PATCH-INDEX-v4.9.49.txt
- CHECKLIST-v4.9.49.txt
- INSTRUCCIONES-CODEX-v4.9.49.txt
- NO_REQUIERE_SQL_NUEVO.txt

## Commit sugerido

Renombrar Chatbot Conecta a DOLA y ordenar asistente interno por publicación
