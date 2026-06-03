-- Paypos seed data for Conecta Control POS Universal
-- Requiere ejecutar antes:
-- 1) supabase/migrations/20260603_conecta_control_pos_core.sql
-- 2) supabase/migrations/20260603_conecta_control_pos_functions.sql
--
-- IMPORTANTE:
-- Este archivo es semilla de prueba/piloto. Ejecutar solo en un proyecto Supabase de prueba
-- o cuando ya se confirme que se quiere crear el negocio Paypos en la base.

-- =====================================================
-- Crear negocio y sucursal principal
-- =====================================================
insert into public.cc_businesses (name, business_type, subscription_status, notes)
select 'Paypos', 'reposteria', 'pilot', 'Primer usuario piloto de Conecta Control POS'
where not exists (
  select 1 from public.cc_businesses where name = 'Paypos'
);

insert into public.cc_branches (business_id, name, is_main)
select b.id, 'Sucursal principal', true
from public.cc_businesses b
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_branches br where br.business_id = b.id and br.name = 'Sucursal principal'
  );

-- =====================================================
-- Contactos de ejemplo
-- =====================================================
insert into public.cc_contacts (business_id, contact_type, name, notes)
select b.id, 'employee', 'Maria', 'Ayudante de produccion / ventas'
from public.cc_businesses b
where b.name = 'Paypos'
  and not exists (select 1 from public.cc_contacts c where c.business_id = b.id and c.name = 'Maria');

insert into public.cc_contacts (business_id, contact_type, name, notes)
select b.id, 'customer', 'Ana', 'Cliente de ejemplo para pedidos y saldos'
from public.cc_businesses b
where b.name = 'Paypos'
  and not exists (select 1 from public.cc_contacts c where c.business_id = b.id and c.name = 'Ana');

insert into public.cc_contacts (business_id, contact_type, name, notes)
select b.id, 'supplier', 'Proveedor general', 'Proveedor de insumos de ejemplo'
from public.cc_businesses b
where b.name = 'Paypos'
  and not exists (select 1 from public.cc_contacts c where c.business_id = b.id and c.name = 'Proveedor general');

-- =====================================================
-- Items de inventario: productos terminados
-- =====================================================
insert into public.cc_inventory_items (business_id, name, item_type, unit, current_cost, minimum_stock)
select b.id, x.name, 'finished_product', 'piece', x.cost, 0
from public.cc_businesses b
cross join (values
  ('Pay de limon', 0::numeric),
  ('Pay de queso', 0::numeric),
  ('Arroz con leche', 0::numeric),
  ('Fresas con crema', 0::numeric)
) as x(name, cost)
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_inventory_items ii where ii.business_id = b.id and ii.name = x.name
  );

-- =====================================================
-- Items de inventario: materias primas / insumos
-- =====================================================
insert into public.cc_inventory_items (business_id, name, item_type, unit, current_cost, minimum_stock)
select b.id, x.name, x.item_type, x.unit, x.cost, x.minimum_stock
from public.cc_businesses b
cross join (values
  ('Fresa fresca', 'raw_material', 'g', 0.025::numeric, 1000::numeric),
  ('Media crema', 'raw_material', 'g', 0.060::numeric, 500::numeric),
  ('Leche condensada', 'raw_material', 'g', 0.0733::numeric, 500::numeric),
  ('Vainilla', 'raw_material', 'g', 0.100::numeric, 50::numeric),
  ('Vasos', 'packaging', 'piece', 1.00::numeric, 20::numeric),
  ('Galleta', 'raw_material', 'g', 0.040::numeric, 500::numeric),
  ('Queso crema', 'raw_material', 'g', 0.080::numeric, 500::numeric),
  ('Limones', 'raw_material', 'piece', 2.00::numeric, 10::numeric)
) as x(name, item_type, unit, cost, minimum_stock)
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_inventory_items ii where ii.business_id = b.id and ii.name = x.name
  );

-- =====================================================
-- Productos vendibles
-- =====================================================
insert into public.cc_products (business_id, inventory_item_id, name, category, sale_unit)
select b.id, ii.id, ii.name, 'postres', 'piece'
from public.cc_businesses b
join public.cc_inventory_items ii on ii.business_id = b.id
where b.name = 'Paypos'
  and ii.name in ('Pay de limon','Pay de queso','Arroz con leche','Fresas con crema')
  and not exists (
    select 1 from public.cc_products p where p.business_id = b.id and p.name = ii.name
  );

-- =====================================================
-- Precios de venta actuales
-- =====================================================
insert into public.cc_product_prices (business_id, product_id, price, valid_from)
select b.id, p.id, x.price, current_date
from public.cc_businesses b
join public.cc_products p on p.business_id = b.id
join (values
  ('Pay de limon', 25::numeric),
  ('Pay de queso', 25::numeric),
  ('Arroz con leche', 25::numeric),
  ('Fresas con crema', 35::numeric)
) as x(name, price) on x.name = p.name
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_product_prices pp where pp.product_id = p.id and pp.valid_from = current_date
  );

-- =====================================================
-- Receta ejemplo opcional: Fresas con crema
-- Base 1000g, rinde 10 vasitos.
-- Esta receta es de prueba; Fer puede modificarla desde la app cuando conectemos UI a Supabase.
-- =====================================================
insert into public.cc_recipes (business_id, product_id, name, base_quantity, base_unit, yield_quantity, yield_unit)
select b.id, p.id, 'Fresas con crema - receta base de prueba', 1000, 'g', 10, 'piece'
from public.cc_businesses b
join public.cc_products p on p.business_id = b.id and p.name = 'Fresas con crema'
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_recipes r where r.product_id = p.id and r.name = 'Fresas con crema - receta base de prueba'
  );

insert into public.cc_recipe_items (recipe_id, inventory_item_id, quantity, unit, cost_snapshot)
select r.id, ii.id, x.quantity, 'g', ii.current_cost
from public.cc_businesses b
join public.cc_recipes r on r.business_id = b.id and r.name = 'Fresas con crema - receta base de prueba'
join (values
  ('Fresa fresca', 600::numeric),
  ('Media crema', 240::numeric),
  ('Leche condensada', 150::numeric),
  ('Vainilla', 10::numeric)
) as x(name, quantity) on true
join public.cc_inventory_items ii on ii.business_id = b.id and ii.name = x.name
where b.name = 'Paypos'
  and not exists (
    select 1 from public.cc_recipe_items ri where ri.recipe_id = r.id and ri.inventory_item_id = ii.id
  );

-- =====================================================
-- Caja inicial de prueba
-- =====================================================
select public.cc_get_or_create_open_cash_session(
  b.id,
  br.id,
  0,
  null
)
from public.cc_businesses b
join public.cc_branches br on br.business_id = b.id and br.is_main = true
where b.name = 'Paypos';

-- =====================================================
-- Inventario inicial de prueba
-- Estas entradas simulan lo disponible antes del primer dia conectado.
-- =====================================================
insert into public.cc_inventory_movements (
  business_id, branch_id, inventory_item_id, movement_type,
  quantity, unit, unit_cost, source_type, notes
)
select b.id, br.id, ii.id, 'adjustment', x.quantity, ii.unit, ii.current_cost, 'seed', 'Inventario inicial de prueba Paypos'
from public.cc_businesses b
join public.cc_branches br on br.business_id = b.id and br.is_main = true
join (values
  ('Pay de limon', 20::numeric),
  ('Pay de queso', 10::numeric),
  ('Arroz con leche', 10::numeric),
  ('Fresas con crema', 10::numeric),
  ('Fresa fresca', 2000::numeric),
  ('Media crema', 1000::numeric),
  ('Leche condensada', 1000::numeric),
  ('Vainilla', 100::numeric),
  ('Vasos', 100::numeric)
) as x(name, quantity) on true
join public.cc_inventory_items ii on ii.business_id = b.id and ii.name = x.name
where b.name = 'Paypos'
  and not exists (
    select 1
    from public.cc_inventory_movements im
    where im.business_id = b.id
      and im.inventory_item_id = ii.id
      and im.source_type = 'seed'
      and im.notes = 'Inventario inicial de prueba Paypos'
  );

-- =====================================================
-- Pruebas manuales sugeridas despues de ejecutar la semilla
-- NO se ejecutan automaticamente. Descomentar solo para probar.
-- =====================================================
-- Venta en efectivo: Vendí 6 pays de limon
-- select public.cc_register_sale(
--   (select id from public.cc_businesses where name = 'Paypos'),
--   (select id from public.cc_branches where name = 'Sucursal principal' and business_id = (select id from public.cc_businesses where name = 'Paypos')),
--   jsonb_build_array(jsonb_build_object(
--     'product_id', (select id from public.cc_products where name = 'Pay de limon' and business_id = (select id from public.cc_businesses where name = 'Paypos')),
--     'quantity', 6
--   )),
--   'cash',
--   null,
--   null,
--   'Venta de prueba Paypos',
--   null
-- );
--
-- Compra en efectivo: Compré insumos $180
-- select public.cc_register_expense(
--   (select id from public.cc_businesses where name = 'Paypos'),
--   (select id from public.cc_branches where name = 'Sucursal principal' and business_id = (select id from public.cc_businesses where name = 'Paypos')),
--   'insumos',
--   'Compra de leche, vasos y galletas',
--   180,
--   'cash',
--   null,
--   null
-- );
--
-- Producción: Preparé 10 fresas con crema
-- select public.cc_register_production(
--   (select id from public.cc_businesses where name = 'Paypos'),
--   (select id from public.cc_branches where name = 'Sucursal principal' and business_id = (select id from public.cc_businesses where name = 'Paypos')),
--   (select id from public.cc_products where name = 'Fresas con crema' and business_id = (select id from public.cc_businesses where name = 'Paypos')),
--   10,
--   'Produccion de prueba',
--   null
-- );
