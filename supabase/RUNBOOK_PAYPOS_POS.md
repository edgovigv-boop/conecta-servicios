# Conecta Control POS / Paypos - Runbook de prueba en Supabase

Este documento explica cómo validar el motor de Conecta Control POS antes de conectar la app `/paypos/` a Supabase.

## Objetivo

Probar que el modelo de base de datos y las funciones operativas funcionen correctamente para el primer piloto Paypos.

El motor debe comprobar:

1. Negocio Paypos creado.
2. Sucursal principal creada.
3. Productos y precios cargados.
4. Inventario inicial cargado.
5. Receta base de prueba cargada.
6. Caja abierta.
7. Venta en efectivo funcionando.
8. Gasto en efectivo funcionando.
9. Compra de inventario funcionando.
10. Producción descontando ingredientes y agregando producto terminado.
11. Deuda por cobrar funcionando.
12. Acreedor por pagar funcionando.
13. Arqueo de caja calculando diferencia.

---

## Archivos creados

### 1. Modelo base

`supabase/migrations/20260603_conecta_control_pos_core.sql`

Crea tablas, vistas, índices y función de cierre de arqueo.

### 2. Funciones operativas

`supabase/migrations/20260603_conecta_control_pos_functions.sql`

Crea funciones para:

- abrir caja
- registrar movimiento de caja
- registrar venta
- registrar compra
- registrar producción
- registrar gasto
- registrar deuda por cobrar
- registrar acreedor por pagar

### 3. Semilla Paypos

`supabase/seeds/20260603_paypos_seed.sql`

Crea datos iniciales de prueba:

- negocio Paypos
- sucursal principal
- productos
- precios
- inventario inicial
- receta de prueba
- caja inicial

### 4. Verificación básica

`supabase/tests/20260603_paypos_verify_basic.sql`

Consulta si todo quedó creado correctamente.

### 5. Prueba operativa

`supabase/tests/20260603_paypos_operational_tests.sql`

Ejecuta movimientos de prueba y revisa resultados.

---

## Orden de ejecución en Supabase

Entrar a Supabase → SQL Editor → New Query.

Ejecutar en este orden:

```text
1. supabase/migrations/20260603_conecta_control_pos_core.sql
2. supabase/migrations/20260603_conecta_control_pos_functions.sql
3. supabase/seeds/20260603_paypos_seed.sql
4. supabase/tests/20260603_paypos_verify_basic.sql
5. supabase/tests/20260603_paypos_operational_tests.sql
```

Recomendación: ejecutar primero en un proyecto Supabase de prueba.

---

## Qué revisar después del archivo 4

Después de ejecutar:

`20260603_paypos_verify_basic.sql`

Debe aparecer:

- Paypos como negocio.
- Sucursal principal.
- Productos:
  - Pay de limon
  - Pay de queso
  - Arroz con leche
  - Fresas con crema
- Precios:
  - 25
  - 25
  - 25
  - 35
- Receta base de prueba para Fresas con crema.
- Ingredientes de receta.
- Inventario inicial.
- Caja abierta.

---

## Qué revisar después del archivo 5

Después de ejecutar:

`20260603_paypos_operational_tests.sql`

Debe observarse:

### Caja

Se deben registrar entradas y salidas:

- Venta 6 Pay de limon: entrada de efectivo.
- Gasto de insumos: salida de efectivo.
- Compra de vasos: salida de efectivo.
- Venta parcial de Ana: entrada parcial.

### Inventario

Debe cambiar:

- Pay de limon baja por venta.
- Vasos suben por compra.
- Ingredientes de Fresas con crema bajan por producción.
- Fresas con crema suben por producción y luego bajan por venta.

### Deudas

Debe aparecer una deuda por cobrar de Ana.

### Acreedores

Debe aparecer una deuda por pagar al Proveedor general.

---

## Si aparece un error

Copiar el mensaje completo de Supabase y pegarlo en ChatGPT.

Errores comunes esperados:

- Tabla ya existe: puede ser normal si el script se ejecutó antes.
- Violación de llave única: puede indicar que la semilla ya fue insertada.
- Columna no encontrada: hay que corregir el SQL.
- Función no existe: faltó ejecutar el archivo de funciones.

---

## Después de validar correctamente

Cuando los SQL funcionen, el siguiente paso técnico será conectar `/paypos/` a Supabase.

Nueva fase:

1. Crear cliente Supabase para Paypos.
2. Leer productos desde Supabase.
3. Leer inventario desde Supabase.
4. Registrar ventas usando `cc_register_sale`.
5. Registrar gastos usando `cc_register_expense`.
6. Registrar producción usando `cc_register_production`.
7. Mostrar caja esperada desde `cc_cash_session_summary`.
8. Crear vista de supervisión para Edgar.

Ruta sugerida futura:

`/paypos/admin/`

Objetivo:

Que Edgar pueda ver lo que Fer registra en tiempo real.
