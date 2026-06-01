# Conecta Servicios v6.5.7 — Configurador inteligente de Conecta Control

## Qué agrega

Conecta Control deja de ser solo piloto Postres Fer y ahora inicia como producto universal:

- Pantalla de bienvenida
- "Empezar mi control"
- Configurador inteligente de negocio
- Preguntas simples por pasos
- Panel diario personalizado
- Demo Postres Fer como ejemplo cargable
- Registros genéricos en:
  conecta_control_business_records
- Configuración en:
  conecta_control_business_config

## Flujo

Si no hay configuración:
- muestra "Organiza tu negocio"

Si el usuario empieza:
- pregunta nombre del negocio
- pregunta tipo de negocio
- pregunta qué vende u ofrece
- pregunta qué quiere controlar primero
- pregunta si maneja productos, servicios, citas o pedidos
- pregunta si quiere saber ganancia diaria

Si ya hay configuración:
- muestra Registro Inteligente y dashboard adaptado

## Seguridad

No toca:
- Supabase
- publicaciones
- mensajes
- perfil
- admin
- tienda
- video
- carrusel
- scroll

## Commit sugerido

Agrega configurador inteligente para Conecta Control

## Pruebas

1. Ir a Control.
2. Si ya hay demo, usar "Reiniciar mi control".
3. Empezar mi control.
4. Crear un negocio de tacos, doctor, ferretería o servicios.
5. Revisar panel.
6. Probar demo Postres Fer.
