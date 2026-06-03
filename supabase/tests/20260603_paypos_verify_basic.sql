-- Paypos basic verification
-- Ejecutar despues de core + functions + seed.

-- 1) Negocio y sucursal
select
  b.id as business_id,
  b.name as business,
  br.id as branch_id,
  br.name as branch
from public.cc_businesses b
left join public.cc_branches br on br.business_id = b.id
where b.name = 'Paypos';

-- 2) Productos y precios
select
  p.name as product,
  pp.price,
  pp.valid_from
from public.cc_businesses b
join public.cc_products p on p.business_id = b.id
left join public.cc_product_prices pp on pp.product_id = p.id
where b.name = 'Paypos'
order by p.name;

-- 3) Recetas
select
  r.name as recipe,
  p.name as product,
  r.base_quantity,
  r.base_unit,
  r.yield_quantity,
  r.yield_unit
from public.cc_businesses b
join public.cc_recipes r on r.business_id = b.id
join public.cc_products p on p.id = r.product_id
where b.name = 'Paypos';

-- 4) Ingredientes de receta
select
  r.name as recipe,
  ii.name as ingredient,
  ri.quantity,
  ri.unit,
  ii.current_cost
from public.cc_businesses b
join public.cc_recipes r on r.business_id = b.id
join public.cc_recipe_items ri on ri.recipe_id = r.id
join public.cc_inventory_items ii on ii.id = ri.inventory_item_id
where b.name = 'Paypos'
order by r.name, ii.name;

-- 5) Inventario actual
select
  sb.item_name,
  sb.item_type,
  sb.unit,
  sb.current_quantity,
  sb.estimated_value
from public.cc_businesses b
join public.cc_stock_balances sb on sb.business_id = b.id
where b.name = 'Paypos'
order by sb.item_type, sb.item_name;

-- 6) Caja abierta
select
  css.cash_session_id,
  css.opening_cash,
  css.cash_in,
  css.cash_out,
  css.calculated_expected_cash,
  css.counted_cash,
  css.difference,
  css.status
from public.cc_cash_session_summary css
join public.cc_businesses b on b.id = css.business_id
where b.name = 'Paypos'
order by css.opened_at desc;
