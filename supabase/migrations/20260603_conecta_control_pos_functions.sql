-- Conecta Control POS Universal - Operational functions
-- Requiere ejecutar antes: 20260603_conecta_control_pos_core.sql
--
-- Objetivo del MVP:
-- - Registrar ventas, compras, produccion, gastos, deudas y acreedores.
-- - Generar movimientos de inventario y caja.
-- - Preparar el flujo para Paypos y para negocios universales.

-- =====================================================
-- Caja: abrir / obtener caja abierta
-- =====================================================
create or replace function public.cc_get_or_create_open_cash_session(
  p_business_id uuid,
  p_branch_id uuid default null,
  p_opening_cash numeric default 0,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_session_id uuid;
begin
  select id into v_session_id
  from public.cc_cash_sessions
  where business_id = p_business_id
    and status = 'open'
    and (branch_id is not distinct from p_branch_id)
  order by opened_at desc
  limit 1;

  if v_session_id is null then
    insert into public.cc_cash_sessions (
      business_id, branch_id, opened_by, opening_cash, expected_cash, status
    ) values (
      p_business_id, p_branch_id, p_user_id, coalesce(p_opening_cash, 0), coalesce(p_opening_cash, 0), 'open'
    ) returning id into v_session_id;
  end if;

  return v_session_id;
end;
$$;

-- =====================================================
-- Caja: registrar movimiento simple
-- =====================================================
create or replace function public.cc_add_cash_movement(
  p_business_id uuid,
  p_branch_id uuid,
  p_movement_type text,
  p_amount numeric,
  p_description text default null,
  p_source_type text default null,
  p_source_id uuid default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_session_id uuid;
  v_movement_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'El monto de caja debe ser mayor a cero';
  end if;

  if p_movement_type not in ('in','out','adjustment','withdrawal','deposit') then
    raise exception 'Tipo de movimiento de caja invalido: %', p_movement_type;
  end if;

  v_session_id := public.cc_get_or_create_open_cash_session(p_business_id, p_branch_id, 0, p_user_id);

  insert into public.cc_cash_movements (
    business_id, branch_id, cash_session_id, movement_type, amount,
    source_type, source_id, description, created_by
  ) values (
    p_business_id, p_branch_id, v_session_id, p_movement_type, p_amount,
    p_source_type, p_source_id, p_description, p_user_id
  ) returning id into v_movement_id;

  return v_movement_id;
end;
$$;

-- =====================================================
-- Registrar venta
-- p_items ejemplo:
-- [
--   {"product_id":"uuid", "quantity":6, "unit_price":25},
--   {"product_id":"uuid", "quantity":10}
-- ]
-- Si unit_price no viene, toma el ultimo precio activo de cc_product_prices.
-- =====================================================
create or replace function public.cc_register_sale(
  p_business_id uuid,
  p_branch_id uuid,
  p_items jsonb,
  p_payment_method text default 'cash',
  p_customer_id uuid default null,
  p_paid_amount numeric default null,
  p_notes text default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_price numeric;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_paid numeric := 0;
  v_balance numeric := 0;
  v_status text;
  v_inventory_item_id uuid;
  v_product_name text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta requiere al menos un producto';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);

    select coalesce((v_item->>'unit_price')::numeric, pp.price)
    into v_price
    from public.cc_products pr
    left join lateral (
      select price
      from public.cc_product_prices
      where product_id = pr.id
        and valid_from <= current_date
        and (valid_to is null or valid_to >= current_date)
      order by valid_from desc
      limit 1
    ) pp on true
    where pr.id = v_product_id;

    if v_qty <= 0 then
      raise exception 'Cantidad invalida para producto %', v_product_id;
    end if;
    if v_price is null then
      raise exception 'No se encontro precio para producto %', v_product_id;
    end if;

    v_subtotal := v_subtotal + (v_qty * v_price);
  end loop;

  v_total := v_subtotal;
  v_paid := coalesce(p_paid_amount, case when p_payment_method = 'credit' then 0 else v_total end);
  v_balance := greatest(v_total - v_paid, 0);
  v_status := case
    when v_paid <= 0 and v_total > 0 then 'credit'
    when v_balance > 0 then 'partial'
    else 'paid'
  end;

  insert into public.cc_sales (
    business_id, branch_id, customer_id, subtotal, discount, total,
    payment_status, notes, created_by
  ) values (
    p_business_id, p_branch_id, p_customer_id, v_subtotal, 0, v_total,
    v_status, p_notes, p_user_id
  ) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;

    select pr.inventory_item_id, pr.name,
      coalesce((v_item->>'unit_price')::numeric, pp.price)
    into v_inventory_item_id, v_product_name, v_price
    from public.cc_products pr
    left join lateral (
      select price
      from public.cc_product_prices
      where product_id = pr.id
        and valid_from <= current_date
        and (valid_to is null or valid_to >= current_date)
      order by valid_from desc
      limit 1
    ) pp on true
    where pr.id = v_product_id;

    insert into public.cc_sale_items (
      business_id, sale_id, product_id, quantity, unit_price, cost_estimate
    ) values (
      p_business_id, v_sale_id, v_product_id, v_qty, v_price, 0
    );

    if v_inventory_item_id is not null then
      insert into public.cc_inventory_movements (
        business_id, branch_id, inventory_item_id, movement_type,
        quantity, unit, unit_cost, source_type, source_id, notes, created_by
      ) values (
        p_business_id, p_branch_id, v_inventory_item_id, 'sale',
        -v_qty, 'piece', 0, 'sale', v_sale_id,
        'Venta: ' || coalesce(v_product_name, v_product_id::text), p_user_id
      );
    end if;
  end loop;

  if v_paid > 0 then
    insert into public.cc_payments (
      business_id, sale_id, contact_id, payment_method, amount, notes, created_by
    ) values (
      p_business_id, v_sale_id, p_customer_id, p_payment_method, v_paid,
      'Pago de venta', p_user_id
    );

    if p_payment_method = 'cash' then
      perform public.cc_add_cash_movement(
        p_business_id, p_branch_id, 'in', v_paid,
        'Venta en efectivo', 'sale', v_sale_id, p_user_id
      );
    end if;
  end if;

  if v_balance > 0 then
    insert into public.cc_receivables (
      business_id, contact_id, sale_id, description,
      original_amount, paid_amount, status, created_by
    ) values (
      p_business_id, p_customer_id, v_sale_id,
      'Saldo pendiente de venta', v_balance, 0,
      case when v_paid > 0 then 'partial' else 'pending' end,
      p_user_id
    );
  end if;

  return v_sale_id;
end;
$$;

-- =====================================================
-- Registrar compra de inventario
-- p_items ejemplo:
-- [
--   {"inventory_item_id":"uuid", "quantity":600, "unit":"g", "unit_cost":0.05},
--   {"inventory_item_id":"uuid", "quantity":10, "unit":"piece", "unit_cost":2}
-- ]
-- =====================================================
create or replace function public.cc_register_purchase(
  p_business_id uuid,
  p_branch_id uuid,
  p_supplier_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_payment_method text default 'cash',
  p_paid_amount numeric default null,
  p_notes text default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_purchase_id uuid;
  v_item jsonb;
  v_inventory_item_id uuid;
  v_qty numeric;
  v_unit text;
  v_unit_cost numeric;
  v_total numeric := 0;
  v_paid numeric := 0;
  v_balance numeric := 0;
  v_status text;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La compra requiere al menos un insumo o producto';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((v_item->>'quantity')::numeric, 0);
    v_unit_cost := coalesce((v_item->>'unit_cost')::numeric, 0);
    if v_qty <= 0 or v_unit_cost < 0 then
      raise exception 'Compra con cantidad o costo invalido';
    end if;
    v_total := v_total + (v_qty * v_unit_cost);
  end loop;

  v_paid := coalesce(p_paid_amount, case when p_payment_method = 'credit' then 0 else v_total end);
  v_balance := greatest(v_total - v_paid, 0);
  v_status := case
    when v_paid <= 0 and v_total > 0 then 'credit'
    when v_balance > 0 then 'partial'
    else 'paid'
  end;

  insert into public.cc_purchases (
    business_id, supplier_id, branch_id, total, payment_status, notes, created_by
  ) values (
    p_business_id, p_supplier_id, p_branch_id, v_total, v_status, p_notes, p_user_id
  ) returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_inventory_item_id := (v_item->>'inventory_item_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;
    v_unit := coalesce(v_item->>'unit', 'piece');
    v_unit_cost := (v_item->>'unit_cost')::numeric;

    insert into public.cc_purchase_items (
      business_id, purchase_id, inventory_item_id, quantity, unit, unit_cost
    ) values (
      p_business_id, v_purchase_id, v_inventory_item_id, v_qty, v_unit, v_unit_cost
    );

    insert into public.cc_inventory_movements (
      business_id, branch_id, inventory_item_id, movement_type,
      quantity, unit, unit_cost, source_type, source_id, notes, created_by
    ) values (
      p_business_id, p_branch_id, v_inventory_item_id, 'purchase',
      v_qty, v_unit, v_unit_cost, 'purchase', v_purchase_id, 'Compra de inventario', p_user_id
    );

    update public.cc_inventory_items
    set current_cost = v_unit_cost, updated_at = now()
    where id = v_inventory_item_id;
  end loop;

  if v_paid > 0 and p_payment_method = 'cash' then
    perform public.cc_add_cash_movement(
      p_business_id, p_branch_id, 'out', v_paid,
      'Compra en efectivo', 'purchase', v_purchase_id, p_user_id
    );
  end if;

  if v_balance > 0 then
    insert into public.cc_payables (
      business_id, contact_id, purchase_id, description,
      original_amount, paid_amount, status, created_by
    ) values (
      p_business_id, p_supplier_id, v_purchase_id,
      'Saldo pendiente de compra', v_balance, 0,
      case when v_paid > 0 then 'partial' else 'pending' end,
      p_user_id
    );
  end if;

  return v_purchase_id;
end;
$$;

-- =====================================================
-- Registrar produccion
-- Descuenta ingredientes segun receta activa y agrega producto terminado.
-- =====================================================
create or replace function public.cc_register_production(
  p_business_id uuid,
  p_branch_id uuid,
  p_product_id uuid,
  p_quantity numeric,
  p_notes text default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_log_id uuid;
  v_output_id uuid;
  v_recipe_id uuid;
  v_yield numeric;
  v_product_inventory_item_id uuid;
  v_recipe_item record;
  v_needed numeric;
  v_input_cost numeric;
  v_total_cost numeric := 0;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'La produccion requiere cantidad mayor a cero';
  end if;

  select id, yield_quantity into v_recipe_id, v_yield
  from public.cc_recipes
  where business_id = p_business_id
    and product_id = p_product_id
    and active = true
  order by created_at desc
  limit 1;

  select inventory_item_id into v_product_inventory_item_id
  from public.cc_products
  where id = p_product_id and business_id = p_business_id;

  insert into public.cc_production_logs (
    business_id, branch_id, produced_by, notes
  ) values (
    p_business_id, p_branch_id, p_user_id, p_notes
  ) returning id into v_log_id;

  if v_recipe_id is not null then
    for v_recipe_item in
      select ri.inventory_item_id, ri.quantity, ri.unit, ii.current_cost
      from public.cc_recipe_items ri
      join public.cc_inventory_items ii on ii.id = ri.inventory_item_id
      where ri.recipe_id = v_recipe_id
    loop
      v_needed := (v_recipe_item.quantity / nullif(v_yield, 0)) * p_quantity;
      v_input_cost := coalesce(v_recipe_item.current_cost, 0);
      v_total_cost := v_total_cost + (v_needed * v_input_cost);

      insert into public.cc_inventory_movements (
        business_id, branch_id, inventory_item_id, movement_type,
        quantity, unit, unit_cost, source_type, source_id, notes, created_by
      ) values (
        p_business_id, p_branch_id, v_recipe_item.inventory_item_id, 'production_input',
        -v_needed, v_recipe_item.unit, v_input_cost,
        'production', v_log_id, 'Consumo de ingrediente por produccion', p_user_id
      );
    end loop;
  end if;

  insert into public.cc_production_outputs (
    business_id, production_log_id, product_id, quantity, unit, estimated_cost
  ) values (
    p_business_id, v_log_id, p_product_id, p_quantity, 'piece', v_total_cost
  ) returning id into v_output_id;

  if v_product_inventory_item_id is not null then
    insert into public.cc_inventory_movements (
      business_id, branch_id, inventory_item_id, movement_type,
      quantity, unit, unit_cost, source_type, source_id, notes, created_by
    ) values (
      p_business_id, p_branch_id, v_product_inventory_item_id, 'production_output',
      p_quantity, 'piece', case when p_quantity > 0 then v_total_cost / p_quantity else 0 end,
      'production', v_log_id, 'Entrada de producto terminado', p_user_id
    );
  end if;

  return v_log_id;
end;
$$;

-- =====================================================
-- Registrar gasto operativo
-- =====================================================
create or replace function public.cc_register_expense(
  p_business_id uuid,
  p_branch_id uuid,
  p_category text,
  p_description text,
  p_amount numeric,
  p_payment_method text default 'cash',
  p_contact_id uuid default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_expense_id uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'El gasto requiere monto mayor a cero';
  end if;

  insert into public.cc_expenses (
    business_id, branch_id, category, description, amount,
    payment_method, contact_id, created_by
  ) values (
    p_business_id, p_branch_id, coalesce(p_category, 'other'), p_description, p_amount,
    p_payment_method, p_contact_id, p_user_id
  ) returning id into v_expense_id;

  if p_payment_method = 'cash' then
    perform public.cc_add_cash_movement(
      p_business_id, p_branch_id, 'out', p_amount,
      p_description, 'expense', v_expense_id, p_user_id
    );
  elsif p_payment_method = 'credit' then
    insert into public.cc_payables (
      business_id, contact_id, description, original_amount, paid_amount, status, created_by
    ) values (
      p_business_id, p_contact_id, p_description, p_amount, 0, 'pending', p_user_id
    );
  end if;

  return v_expense_id;
end;
$$;

-- =====================================================
-- Deudas por cobrar y acreedores manuales
-- =====================================================
create or replace function public.cc_register_receivable(
  p_business_id uuid,
  p_contact_id uuid,
  p_description text,
  p_amount numeric,
  p_due_date date default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.cc_receivables (
    business_id, contact_id, description, original_amount, paid_amount, due_date, status, created_by
  ) values (
    p_business_id, p_contact_id, p_description, p_amount, 0, p_due_date, 'pending', p_user_id
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.cc_register_payable(
  p_business_id uuid,
  p_contact_id uuid,
  p_description text,
  p_amount numeric,
  p_due_date date default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid;
begin
  insert into public.cc_payables (
    business_id, contact_id, description, original_amount, paid_amount, due_date, status, created_by
  ) values (
    p_business_id, p_contact_id, p_description, p_amount, 0, p_due_date, 'pending', p_user_id
  ) returning id into v_id;
  return v_id;
end;
$$;
