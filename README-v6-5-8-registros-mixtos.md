# Conecta Servicios v6.5.8 — Registros mixtos en Conecta Control

## Qué corrige

Cuando el usuario dicta un día normal con ventas y compras en el mismo mensaje, Conecta Control ya no debe clasificar todo como GASTO.

Ejemplo real:

Vendí cuatro tacos de suadero fueron 120 dos tacos de tripa fueron 70 y dos tacos al pastor 60 y también compré 5 kg de tortillas fueron 75 y compré una caja de refrescos de coca-cola con 24 piezas a $400

Ahora intenta separarlo en movimientos:
- VENTA
- GASTO
- GASTO

## Mejoras incluidas

- Separa mensajes largos por palabras clave: vendí, compré, gasté, cobré, deben, pedido, etc.
- Soporta ventas con total dicho:
  "cuatro tacos de suadero fueron 120"
- Soporta gastos con unidades y precio:
  "5 kg de tortillas fueron 75"
  "caja de refrescos con 24 piezas a 400"
- Mejora aliases de catálogo:
  "Tacos de suadero" también entiende "suadero".
- Si en configuración alguien puso "tripa y al pastor", lo divide en productos separados para mejorar reconocimiento.

## Commit sugerido

Separa ventas y gastos en registros mixtos

## Prueba recomendada

1. Reiniciar control.
2. Crear negocio:
   Venta de tacos
   Comida
   tacos de suadero, longaniza, bistec, tripa y al pastor
3. Dictar:
   Vendí cuatro tacos de suadero fueron 120 dos tacos de tripa fueron 70 y dos tacos al pastor 60 y también compré 5 kg de tortillas fueron 75 y compré una caja de refrescos de coca-cola con 24 piezas a $400
4. Confirmar que no se registra todo como GASTO.
