-- Paypos operational tests
-- Ejecutar despues de core + functions + seed.
-- Recomendado: proyecto Supabase de prueba.

-- Venta en efectivo: Vendí 6 pays de limon
select public.cc_register_sale(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select br.id from public.cc_branches br join public.cc_businesses b on b.id = br.business_id where b.name = 'Paypos' and br.is_main = true limit 1),
  jsonb_build_array(jsonb_build_object(
    'product_id', (select p.id from public.cc_products p join public.cc_businesses b on b.id = p.business_id where b.name = 'Paypos' and p.name = 'Pay de limon' limit 1),
    'quantity', 6
  )),
  'cash',
  null,
  null,
  'Test: venta 6 pays de limon',
  null
) as sale_id;

-- Gasto en efectivo: compré insumos $180
select public.cc_register_expense(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select br.id from public.cc_branches br join public.cc_businesses b on b.id = br.business_id where b.name = 'Paypos' and br.is_main = true limit 1),
  'insumos',
  'Test: compra de leche, vasos y galletas',
  180,
  'cash',
  null,
  null
) as expense_id;

-- Compra de inventario: 100 vasos a $1
select public.cc_register_purchase(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select br.id from public.cc_branches br join public.cc_businesses b on b.id = br.business_id where b.name = 'Paypos' and br.is_main = true limit 1),
  (select c.id from public.cc_contacts c join public.cc_businesses b on b.id = c.business_id where b.name = 'Paypos' and c.name = 'Proveedor general' limit 1),
  jsonb_build_array(jsonb_build_object(
    'inventory_item_id', (select ii.id from public.cc_inventory_items ii join public.cc_businesses b on b.id = ii.business_id where b.name = 'Paypos' and ii.name = 'Vasos' limit 1),
    'quantity', 100,
    'unit', 'piece',
    'unit_cost', 1
  )),
  'cash',
  null,
  'Test: compra 100 vasos',
  null
) as purchase_id;

-- Produccion: Preparé 10 fresas con crema
select public.cc_register_production(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select br.id from public.cc_branches br join public.cc_businesses b on b.id = br.business_id where b.name = 'Paypos' and br.is_main = true limit 1),
  (select p.id from public.cc_products p join public.cc_businesses b on b.id = p.business_id where b.name = 'Paypos' and p.name = 'Fresas con crema' limit 1),
  10,
  'Test: produccion 10 fresas con crema',
  null
) as production_id;

-- Venta parcial: Ana da $200 y queda saldo por cobrar
select public.cc_register_sale(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select br.id from public.cc_branches br join public.cc_businesses b on b.id = br.business_id where b.name = 'Paypos' and br.is_main = true limit 1),
  jsonb_build_array(jsonb_build_object(
    'product_id', (select p.id from public.cc_products p join public.cc_businesses b on b.id = p.business_id where b.name = 'Paypos' and p.name = 'Fresas con crema' limit 1),
    'quantity', 10
  )),
  'cash',
  (select c.id from public.cc_contacts c join public.cc_businesses b on b.id = c.business_id where b.name = 'Paypos' and c.name = 'Ana' limit 1),
  200,
  'Test: Ana anticipo 200 y queda saldo',
  null
) as partial_sale_id;

-- Acreedor manual: debo $500 al proveedor
select public.cc_register_payable(
  (select id from public.cc_businesses where name = 'Paypos'),
  (select c.id from public.cc_contacts c join public.cc_businesses b on b.id = c.business_id where b.name = 'Paypos' and c.name = 'Proveedor general' limit 1),
  'Test: deuda pendiente con proveedor',
  500,
  current_date + 7,
  null
) as payable_id;

-- Ver caja despues de movimientos
select
  css.opening_cash,
  css.cash_in,
  css.cash_out,
  css.calculated_expected_cash,
  css.status
from public.cc_cash_session_summary css
join public.cc_businesses b on b.id = css.business_id
where b.name = 'Paypos'
order by css.opened_at desc;

-- Ver inventario final
select
  sb.item_name,
  sb.item_type,
  sb.unit,
  sb.current_quantity
from public.cc_businesses b
join public.cc_stock_balances sb on sb.business_id = b.id
where b.name = 'Paypos'
order by sb.item_type, sb.item_name;

-- Ver deudas y acreedores
select 'receivable' as kind, c.name as contact, r.description, r.balance, r.status
from public.cc_receivables r
left join public.cc_contacts c on c.id = r.contact_id
join public.cc_businesses b on b.id = r.business_id
where b.name = 'Paypos'
union all
select 'payable' as kind, c.name as contact, p.description, p.balance, p.status
from public.cc_payables p
left join public.cc_contacts c on c.id = p.contact_id
join public.cc_businesses b on b.id = p.business_id
where b.name = 'Paypos'
order by kind, contact;
