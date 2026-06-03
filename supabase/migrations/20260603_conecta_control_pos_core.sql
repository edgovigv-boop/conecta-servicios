-- Conecta Control POS Universal - Core schema
-- Basado en el modelo detectado del Excel TT10.xlsx y los 5 pilares:
-- 1) Efectivo 2) Inventario 3) Deudas 4) Acreedores 5) Activos.
--
-- IMPORTANTE:
-- Este archivo NO se ejecuta automaticamente. Revisar en Supabase SQL Editor antes de aplicar.
-- Primer perfil: Paypos / reposteria. Disenado para escalar a varios negocios y sucursales.

create extension if not exists pgcrypto;

-- =====================================================
-- Utilidades
-- =====================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================
-- Negocios, sucursales y usuarios
-- =====================================================
create table if not exists public.cc_businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  name text not null,
  business_type text,
  status text not null default 'active' check (status in ('active','paused','archived')),
  subscription_status text not null default 'pilot' check (subscription_status in ('pilot','trial','active','past_due','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_branches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  name text not null,
  address text,
  is_main boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  user_id uuid,
  role text not null default 'owner' check (role in ('owner','admin','seller','production','accountant','viewer')),
  branch_id uuid references public.cc_branches(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table if not exists public.cc_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  contact_type text not null check (contact_type in ('customer','supplier','employee','creditor','debtor','other')),
  name text not null,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- Catalogos: productos, inventario, precios, recetas
-- =====================================================
create table if not exists public.cc_inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  name text not null,
  item_type text not null default 'raw_material' check (item_type in ('raw_material','finished_product','packaging','supply','tool','asset','other')),
  unit text not null default 'piece',
  current_cost numeric(14,4) not null default 0,
  minimum_stock numeric(14,4) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.cc_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  inventory_item_id uuid references public.cc_inventory_items(id) on delete set null,
  name text not null,
  category text,
  sale_unit text not null default 'piece',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.cc_product_prices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  product_id uuid not null references public.cc_products(id) on delete cascade,
  price numeric(14,2) not null check (price >= 0),
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_recipes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  product_id uuid not null references public.cc_products(id) on delete cascade,
  name text not null,
  base_quantity numeric(14,4) not null default 1,
  base_unit text not null default 'piece',
  yield_quantity numeric(14,4) not null default 1,
  yield_unit text not null default 'piece',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.cc_recipes(id) on delete cascade,
  inventory_item_id uuid not null references public.cc_inventory_items(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity >= 0),
  unit text not null default 'piece',
  cost_snapshot numeric(14,4),
  created_at timestamptz not null default now()
);

-- =====================================================
-- Pilar 1: Efectivo / caja / arqueos
-- =====================================================
create table if not exists public.cc_cash_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  opened_by uuid,
  closed_by uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_cash numeric(14,2) not null default 0,
  expected_cash numeric(14,2) not null default 0,
  counted_cash numeric(14,2),
  difference numeric(14,2),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_cash_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  cash_session_id uuid references public.cc_cash_sessions(id) on delete set null,
  movement_type text not null check (movement_type in ('in','out','adjustment','withdrawal','deposit')),
  amount numeric(14,2) not null check (amount >= 0),
  source_type text,
  source_id uuid,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Pilar 2: Inventario
-- =====================================================
create table if not exists public.cc_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  inventory_item_id uuid not null references public.cc_inventory_items(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase','production_input','production_output','sale','waste','adjustment','transfer_in','transfer_out','return')),
  quantity numeric(14,4) not null,
  unit text not null default 'piece',
  unit_cost numeric(14,4) not null default 0,
  total_cost numeric(14,4) generated always as (quantity * unit_cost) stored,
  source_type text,
  source_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create or replace view public.cc_stock_balances as
select
  im.business_id,
  im.branch_id,
  im.inventory_item_id,
  ii.name as item_name,
  ii.item_type,
  ii.unit,
  sum(im.quantity) as current_quantity,
  sum(im.quantity * im.unit_cost) as estimated_value
from public.cc_inventory_movements im
join public.cc_inventory_items ii on ii.id = im.inventory_item_id
group by im.business_id, im.branch_id, im.inventory_item_id, ii.name, ii.item_type, ii.unit;

-- =====================================================
-- Ventas y cobros
-- =====================================================
create table if not exists public.cc_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  customer_id uuid references public.cc_contacts(id) on delete set null,
  sale_date timestamptz not null default now(),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid','partial','credit','cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_sale_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  sale_id uuid not null references public.cc_sales(id) on delete cascade,
  product_id uuid not null references public.cc_products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total numeric(14,2) generated always as (quantity * unit_price) stored,
  cost_estimate numeric(14,4) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  sale_id uuid references public.cc_sales(id) on delete set null,
  contact_id uuid references public.cc_contacts(id) on delete set null,
  payment_method text not null default 'cash' check (payment_method in ('cash','transfer','card','credit','advance','other')),
  amount numeric(14,2) not null check (amount >= 0),
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Compras, gastos y acreedores
-- =====================================================
create table if not exists public.cc_purchases (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  supplier_id uuid references public.cc_contacts(id) on delete set null,
  branch_id uuid references public.cc_branches(id) on delete set null,
  purchase_date timestamptz not null default now(),
  total numeric(14,2) not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid','partial','credit','cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_purchase_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  purchase_id uuid not null references public.cc_purchases(id) on delete cascade,
  inventory_item_id uuid not null references public.cc_inventory_items(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit text not null default 'piece',
  unit_cost numeric(14,4) not null check (unit_cost >= 0),
  total_cost numeric(14,4) generated always as (quantity * unit_cost) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  category text not null default 'other',
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  payment_method text not null default 'cash' check (payment_method in ('cash','transfer','card','credit','other')),
  expense_date timestamptz not null default now(),
  contact_id uuid references public.cc_contacts(id) on delete set null,
  source_type text,
  source_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- Pilar 3: Deudas por cobrar
create table if not exists public.cc_receivables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  contact_id uuid references public.cc_contacts(id) on delete set null,
  sale_id uuid references public.cc_sales(id) on delete set null,
  description text not null,
  original_amount numeric(14,2) not null check (original_amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  balance numeric(14,2) generated always as (original_amount - paid_amount) stored,
  due_date date,
  status text not null default 'pending' check (status in ('pending','partial','paid','overdue','cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pilar 4: Acreedores / deudas por pagar
create table if not exists public.cc_payables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  contact_id uuid references public.cc_contacts(id) on delete set null,
  purchase_id uuid references public.cc_purchases(id) on delete set null,
  description text not null,
  original_amount numeric(14,2) not null check (original_amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  balance numeric(14,2) generated always as (original_amount - paid_amount) stored,
  due_date date,
  status text not null default 'pending' check (status in ('pending','partial','paid','overdue','cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Pilar 5: Activos / patrimonio
create table if not exists public.cc_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  name text not null,
  asset_type text not null default 'equipment' check (asset_type in ('cash','equipment','vehicle','tool','furniture','deposit','inventory_value','other')),
  purchase_value numeric(14,2) not null default 0,
  current_value numeric(14,2) not null default 0,
  purchase_date date,
  status text not null default 'active' check (status in ('active','sold','lost','disposed','archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_asset_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  asset_id uuid not null references public.cc_assets(id) on delete cascade,
  movement_type text not null check (movement_type in ('add','remove','adjustment','depreciation','sale')),
  amount numeric(14,2) not null default 0,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Produccion
-- =====================================================
create table if not exists public.cc_production_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  branch_id uuid references public.cc_branches(id) on delete set null,
  produced_by uuid,
  production_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_production_outputs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  production_log_id uuid not null references public.cc_production_logs(id) on delete cascade,
  product_id uuid not null references public.cc_products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  unit text not null default 'piece',
  estimated_cost numeric(14,4) not null default 0,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Distribuciones / salidas a sucursales
-- =====================================================
create table if not exists public.cc_distributions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  from_branch_id uuid references public.cc_branches(id) on delete set null,
  to_branch_id uuid references public.cc_branches(id) on delete set null,
  distribution_date timestamptz not null default now(),
  status text not null default 'sent' check (status in ('draft','sent','received','cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cc_distribution_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.cc_businesses(id) on delete cascade,
  distribution_id uuid not null references public.cc_distributions(id) on delete cascade,
  product_id uuid not null references public.cc_products(id) on delete restrict,
  quantity numeric(14,4) not null check (quantity > 0),
  created_at timestamptz not null default now()
);

-- =====================================================
-- WhatsApp / lenguaje natural
-- =====================================================
create table if not exists public.cc_message_inbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.cc_businesses(id) on delete cascade,
  sender_phone text,
  raw_message text not null,
  interpreted_intent text,
  confidence numeric(5,4),
  status text not null default 'pending' check (status in ('pending','interpreted','confirmed','rejected','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.cc_message_actions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.cc_message_inbox(id) on delete cascade,
  action_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','applied','rejected','failed')),
  created_at timestamptz not null default now()
);

-- =====================================================
-- Auditoria
-- =====================================================
create table if not exists public.cc_audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.cc_businesses(id) on delete cascade,
  user_id uuid,
  action text not null,
  table_name text,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================
-- Vistas utiles para paneles
-- =====================================================
create or replace view public.cc_cash_session_summary as
select
  cs.id as cash_session_id,
  cs.business_id,
  cs.branch_id,
  cs.opened_at,
  cs.closed_at,
  cs.opening_cash,
  coalesce(sum(case when cm.movement_type in ('in','deposit') then cm.amount else 0 end),0) as cash_in,
  coalesce(sum(case when cm.movement_type in ('out','withdrawal') then cm.amount else 0 end),0) as cash_out,
  cs.opening_cash
    + coalesce(sum(case when cm.movement_type in ('in','deposit') then cm.amount else 0 end),0)
    - coalesce(sum(case when cm.movement_type in ('out','withdrawal') then cm.amount else 0 end),0) as calculated_expected_cash,
  cs.counted_cash,
  cs.difference,
  cs.status
from public.cc_cash_sessions cs
left join public.cc_cash_movements cm on cm.cash_session_id = cs.id
group by cs.id;

create or replace view public.cc_business_position as
select
  b.id as business_id,
  b.name as business_name,
  coalesce((select sum(current_value) from public.cc_assets a where a.business_id = b.id and a.status = 'active'),0) as assets_value,
  coalesce((select sum(estimated_value) from public.cc_stock_balances sb where sb.business_id = b.id),0) as inventory_value,
  coalesce((select sum(balance) from public.cc_receivables r where r.business_id = b.id and r.status in ('pending','partial','overdue')),0) as receivables_balance,
  coalesce((select sum(balance) from public.cc_payables p where p.business_id = b.id and p.status in ('pending','partial','overdue')),0) as payables_balance,
  coalesce((select sum(case when movement_type in ('in','deposit') then amount else -amount end) from public.cc_cash_movements cm where cm.business_id = b.id),0) as cash_net
from public.cc_businesses b;

-- =====================================================
-- Funciones MVP
-- =====================================================
create or replace function public.cc_close_cash_session(
  p_cash_session_id uuid,
  p_counted_cash numeric,
  p_notes text default null
)
returns public.cc_cash_sessions
language plpgsql
as $$
declare
  v_expected numeric(14,2);
  v_session public.cc_cash_sessions;
begin
  select calculated_expected_cash into v_expected
  from public.cc_cash_session_summary
  where cash_session_id = p_cash_session_id;

  update public.cc_cash_sessions
  set
    expected_cash = coalesce(v_expected, opening_cash),
    counted_cash = p_counted_cash,
    difference = p_counted_cash - coalesce(v_expected, opening_cash),
    notes = coalesce(p_notes, notes),
    closed_at = now(),
    status = 'closed',
    updated_at = now()
  where id = p_cash_session_id
  returning * into v_session;

  return v_session;
end;
$$;

-- =====================================================
-- Triggers updated_at
-- =====================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'cc_businesses','cc_branches','cc_contacts','cc_inventory_items','cc_products','cc_recipes',
    'cc_cash_sessions','cc_sales','cc_purchases','cc_receivables','cc_payables','cc_assets',
    'cc_production_logs','cc_distributions'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- =====================================================
-- Indices recomendados
-- =====================================================
create index if not exists idx_cc_branches_business on public.cc_branches(business_id);
create index if not exists idx_cc_contacts_business_type on public.cc_contacts(business_id, contact_type);
create index if not exists idx_cc_inventory_items_business_type on public.cc_inventory_items(business_id, item_type);
create index if not exists idx_cc_products_business_active on public.cc_products(business_id, active);
create index if not exists idx_cc_product_prices_product_date on public.cc_product_prices(product_id, valid_from desc);
create index if not exists idx_cc_recipe_items_recipe on public.cc_recipe_items(recipe_id);
create index if not exists idx_cc_inventory_movements_item_date on public.cc_inventory_movements(inventory_item_id, created_at desc);
create index if not exists idx_cc_inventory_movements_business_branch on public.cc_inventory_movements(business_id, branch_id, created_at desc);
create index if not exists idx_cc_cash_sessions_business_date on public.cc_cash_sessions(business_id, opened_at desc);
create index if not exists idx_cc_cash_movements_session on public.cc_cash_movements(cash_session_id, created_at desc);
create index if not exists idx_cc_cash_movements_business_date on public.cc_cash_movements(business_id, created_at desc);
create index if not exists idx_cc_sales_business_date on public.cc_sales(business_id, sale_date desc);
create index if not exists idx_cc_sales_branch_date on public.cc_sales(branch_id, sale_date desc);
create index if not exists idx_cc_sale_items_product on public.cc_sale_items(product_id);
create index if not exists idx_cc_payments_business_date on public.cc_payments(business_id, paid_at desc);
create index if not exists idx_cc_purchases_business_date on public.cc_purchases(business_id, purchase_date desc);
create index if not exists idx_cc_expenses_business_date on public.cc_expenses(business_id, expense_date desc);
create index if not exists idx_cc_receivables_business_status on public.cc_receivables(business_id, status);
create index if not exists idx_cc_payables_business_status on public.cc_payables(business_id, status);
create index if not exists idx_cc_assets_business_status on public.cc_assets(business_id, status);
create index if not exists idx_cc_production_business_date on public.cc_production_logs(business_id, production_date desc);
create index if not exists idx_cc_distributions_branch_date on public.cc_distributions(business_id, from_branch_id, to_branch_id, distribution_date desc);
create index if not exists idx_cc_message_inbox_business_status on public.cc_message_inbox(business_id, status, created_at desc);

-- =====================================================
-- Semilla opcional Paypos (comentada por seguridad)
-- Descomentar solo si se quiere crear el negocio piloto desde SQL.
-- =====================================================
-- insert into public.cc_businesses (name, business_type, subscription_status, notes)
-- values ('Paypos', 'reposteria', 'pilot', 'Primer usuario piloto de Conecta Control POS')
-- on conflict do nothing;
