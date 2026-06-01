# Conecta Servicios v6.5.4 — Piloto Conecta Control

## Qué agrega

Módulo aislado “Conecta Control” para el piloto de Postres Fer.

## Funciones

- Ruta nueva: /control
- Botón “Control” en navegación inferior
- Botón 📊 en menú flotante del home
- Simulador tipo WhatsApp
- Catálogo Postres Fer:
  - Pay de limón: $25
  - Arroz con leche: $25
  - Pay de queso: $25
  - Fresas con crema: $35
- Parser local sin IA externa
- Registros en localStorage:
  conecta_control_postres_fer_records
- Dashboard:
  - ventas
  - gastos
  - ganancia estimada
  - producto más vendido
  - cobros
  - deudas
  - inventario esperado
  - conteo real
  - diferencias
  - historial de asistente

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

## Commit sugerido

Agrega piloto Conecta Control para negocios

## Prueba recomendada

1. Abrir /control o tocar “Control”.
2. Probar:
   - Vendí 3 limón, 2 queso y 1 fresas
   - Compré leche 120, azúcar 80 y vasos 150
   - Produje 20 limón, 15 queso y 10 arroz
   - Conté 8 limón, 5 queso y 3 arroz
   - Merma 2 arroz
   - Pedido para mañana: Ana quiere 10 queso
   - Me deben 150 de Ana
   - Cobré 200 de Ana
3. Revisar dashboard e inventario.
4. Probar Inicio, Feed, Mensajes, Perfil y Admin.
