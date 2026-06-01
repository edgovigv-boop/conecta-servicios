# Conecta Servicios v6.5.9 — Precios no cantidades

## Qué corrige

En una frase como:

"Vendí cuatro tacos de suadero fueron 120 dos tacos de tripa fueron 70 y dos tacos al pastor 60..."

la versión anterior podía interpretar "al pastor 60" como 60 tacos al pastor, cuando 60 era el total de esos dos tacos.

## Cambio

- Si ya existe "cantidad + producto" en una venta, se ignora "producto + número" como cantidad.
- Ese número se toma como total cercano de la venta.
- Mejora gastos terminados en conectores como "fueron 75 y también".

## Resultado esperado con el dictado de prueba

Ventas:
- 4 suadero = $120
- 2 tripa = $70
- 2 al pastor = $60
Total ventas: $250

Gastos:
- tortillas = $75
- refrescos = $400
Total gastos: $475

Producto más vendido:
- suadero (4), no al pastor (62)

## Commit sugerido

Evita confundir totales con cantidades en Conecta Control
