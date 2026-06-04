-- Conecta Control / Paypos - Private security layer
-- Ejecutar despues de las migraciones core y functions.
-- Objetivo: preparar Paypos para acceso privado con Supabase Auth y RLS.
--
-- IMPORTANTE:
-- Este archivo NO carga datos reales de Fer.
-- Los datos reales deben vivir en Supabase, no en archivos publicos del repositorio.

-- =====================================================
-- 1) Bloquear funcion publica anterior de snapshot Paypos
-- =====================================================
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'cc_paypos_admin_snapshot'
  ) then
    revoke execute on function public.cc_paypos_admin_snapshot() from anon;
    revoke execute on function public.cc_paypos_admin_snapshot() from authenticated;
  end if;
end $$;

-- =====================================================
-- 2) Funciones de seguridad
-- =====================================================
create or replace function public.cc_is_business_member(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cc_businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.cc_business_users bu
    where bu.business_id = p_business_id
      and bu.user_id = auth.uid()
      and bu.active = true
  );
$$;

create or replace function public.cc_is_business_owner(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cc_businesses b
    where b.id = p_business_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.cc_business_users bu
    where bu.business_id = p_business_id
      and bu.user_id = auth.uid()
      and bu.active = true
      and bu.role in ('owner','admin')
  );
$$;

grant execute on function public.cc_is_business_member(uuid) to authenticated;
grant execute on function public.cc_is_business_owner(uuid) to authenticated;

-- =====================================================
-- 3) RPC privado: resumen por negocio autenticado
-- =====================================================
create or replace function public.cc_private_business_snapshot(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.cc_is_business_member(p_business_id) then
    raise exception 'Access denied for this business';
  end if;

  select jsonb_build_object(
    'ok', true,
    'business', (
      select jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'business_type', b.business_type,
        'subscription_status', b.subscription_status
      )
      from public.cc_businesses b
      where b.id = p_business_id
    ),
    'cash', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select *
        from public.cc_cash_session_summary
        where business_id = p_business_id
        order by opened_at desc
        limit 5
      ) x
    ), '[]'::jsonb),
    'stock', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select *
        from public.cc_stock_balances
        where business_id = p_business_id
        order by item_type asc, item_name asc
      ) x
    ), '[]'::jsonb),
    'receivables', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select r.id, r.description, r.original_amount, r.paid_amount, r.balance, r.status, r.created_at, c.name as contact_name
        from public.cc_receivables r
        left join public.cc_contacts c on c.id = r.contact_id
        where r.business_id = p_business_id
        order by r.created_at desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'payables', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select p.id, p.description, p.original_amount, p.paid_amount, p.balance, p.status, p.created_at, c.name as contact_name
        from public.cc_payables p
        left join public.cc_contacts c on c.id = p.contact_id
        where p.business_id = p_business_id
        order by p.created_at desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'sales', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select id, sale_date, subtotal, discount, total, payment_status, notes
        from public.cc_sales
        where business_id = p_business_id
        order by sale_date desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'position', coalesce((
      select to_jsonb(x)
      from (
        select *
        from public.cc_business_position
        where business_id = p_business_id
        limit 1
      ) x
    ), '{}'::jsonb)
  ) into v_payload;

  return v_payload;
end;
$$;

grant execute on function public.cc_private_business_snapshot(uuid) to authenticated;
revoke execute on function public.cc_private_business_snapshot(uuid) from anon;

-- =====================================================
-- 4) Activar RLS
-- =====================================================
alter table public.cc_businesses enable row level security;
alter table public.cc_branches enable row level security;
alter table public.cc_business_users enable row level security;
alter table public.cc_contacts enable row level security;
alter table public.cc_inventory_items enable row level security;
alter table public.cc_products enable row level security;
alter table public.cc_product_prices enable row level security;
alter table public.cc_recipes enable row level security;
alter table public.cc_recipe_items enable row level security;
alter table public.cc_cash_sessions enable row level security;
alter table public.cc_cash_movements enable row level security;
alter table public.cc_inventory_movements enable row level security;
alter table public.cc_sales enable row level security;
alter table public.cc_sale_items enable row level security;
alter table public.cc_payments enable row level security;
alter table public.cc_purchases enable row level security;
alter table public.cc_purchase_items enable row level security;
alter table public.cc_expenses enable row level security;
alter table public.cc_receivables enable row level security;
alter table public.cc_payables enable row level security;
alter table public.cc_assets enable row level security;
alter table public.cc_asset_movements enable row level security;
alter table public.cc_production_logs enable row level security;
alter table public.cc_production_outputs enable row level security;
alter table public.cc_distributions enable row level security;
alter table public.cc_distribution_items enable row level security;
alter table public.cc_message_inbox enable row level security;
alter table public.cc_message_actions enable row level security;
alter table public.cc_audit_logs enable row level security;

-- =====================================================
-- 5) Politicas principales
-- =====================================================

drop policy if exists cc_businesses_member_select on public.cc_businesses;
create policy cc_businesses_member_select on public.cc_businesses
for select to authenticated
using (owner_id = auth.uid() or public.cc_is_business_member(id));

drop policy if exists cc_businesses_owner_update on public.cc_businesses;
create policy cc_businesses_owner_update on public.cc_businesses
for update to authenticated
using (public.cc_is_business_owner(id))
with check (public.cc_is_business_owner(id));

drop policy if exists cc_business_users_member_select on public.cc_business_users;
create policy cc_business_users_member_select on public.cc_business_users
for select to authenticated
using (public.cc_is_business_member(business_id));

drop policy if exists cc_business_users_owner_write on public.cc_business_users;
create policy cc_business_users_owner_write on public.cc_business_users
for all to authenticated
using (public.cc_is_business_owner(business_id))
with check (public.cc_is_business_owner(business_id));

-- Tablas con business_id directo: lectura/escritura para miembros del negocio

do $$
declare
  t text;
begin
  foreach t in array array[
    'cc_branches','cc_contacts','cc_inventory_items','cc_products','cc_product_prices','cc_recipes',
    'cc_cash_sessions','cc_cash_movements','cc_inventory_movements','cc_sales','cc_sale_items',
    'cc_payments','cc_purchases','cc_purchase_items','cc_expenses','cc_receivables','cc_payables',
    'cc_assets','cc_asset_movements','cc_production_logs','cc_production_outputs','cc_distributions',
    'cc_distribution_items','cc_message_inbox','cc_audit_logs'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_member_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.cc_is_business_member(business_id))', t || '_member_select', t);

    execute format('drop policy if exists %I on public.%I', t || '_member_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.cc_is_business_member(business_id))', t || '_member_insert', t);

    execute format('drop policy if exists %I on public.%I', t || '_member_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.cc_is_business_member(business_id)) with check (public.cc_is_business_member(business_id))', t || '_member_update', t);
  end loop;
end $$;

-- Tablas dependientes sin business_id directo o con dependencia por parent

drop policy if exists cc_recipe_items_member_select on public.cc_recipe_items;
create policy cc_recipe_items_member_select on public.cc_recipe_items
for select to authenticated
using (exists (
  select 1 from public.cc_recipes r
  where r.id = recipe_id and public.cc_is_business_member(r.business_id)
));

drop policy if exists cc_recipe_items_member_insert on public.cc_recipe_items;
create policy cc_recipe_items_member_insert on public.cc_recipe_items
for insert to authenticated
with check (exists (
  select 1 from public.cc_recipes r
  where r.id = recipe_id and public.cc_is_business_member(r.business_id)
));

drop policy if exists cc_recipe_items_member_update on public.cc_recipe_items;
create policy cc_recipe_items_member_update on public.cc_recipe_items
for update to authenticated
using (exists (
  select 1 from public.cc_recipes r
  where r.id = recipe_id and public.cc_is_business_member(r.business_id)
))
with check (exists (
  select 1 from public.cc_recipes r
  where r.id = recipe_id and public.cc_is_business_member(r.business_id)
));

-- message_actions depende de message_inbox

drop policy if exists cc_message_actions_member_select on public.cc_message_actions;
create policy cc_message_actions_member_select on public.cc_message_actions
for select to authenticated
using (exists (
  select 1 from public.cc_message_inbox mi
  where mi.id = message_id and public.cc_is_business_member(mi.business_id)
));

drop policy if exists cc_message_actions_member_write on public.cc_message_actions;
create policy cc_message_actions_member_write on public.cc_message_actions
for all to authenticated
using (exists (
  select 1 from public.cc_message_inbox mi
  where mi.id = message_id and public.cc_is_business_member(mi.business_id)
))
with check (exists (
  select 1 from public.cc_message_inbox mi
  where mi.id = message_id and public.cc_is_business_member(mi.business_id)
));

-- =====================================================
-- 6) Nota operativa
-- =====================================================
-- Para activar Paypos privado:
-- 1. Crear usuario de Fer en Supabase Auth.
-- 2. Actualizar owner_id del negocio Paypos con el auth.uid de Fer.
-- 3. Insertar business_user para Edgar como admin si se requiere supervisión.
-- 4. Cargar catálogo real desde Excel en tablas privadas, no en GitHub.
