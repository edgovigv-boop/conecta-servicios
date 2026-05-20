-- SQL opcional para Conecta Servicios v4.9.38 - Asistente de negocio configurable
-- No es necesario para probar el piloto localStorage.

-- supabase-business-messaging.sql
-- SQL OPCIONAL para producción real multiusuario de Conecta Servicios v4.9.38.
-- La versión entregada funciona en modo piloto con localStorage.
-- Aplicar este SQL solo cuando se decida persistir pedidos, citas y mensajes en Supabase.

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  business_name text not null,
  whatsapp text,
  municipality text,
  state text,
  membership_status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.business_menus (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.business_profiles(id) on delete cascade,
  publication_id text,
  name text not null,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.business_menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.business_menus(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.business_orders (
  id uuid primary key default gen_random_uuid(),
  publication_id text,
  business_id uuid references public.business_profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  order_type text default 'menu_order',
  delivery_type text,
  address text,
  notes text,
  total numeric(12,2) default 0,
  status text default 'Nuevo',
  payment_status text default 'Pago pendiente / acordar con negocio',
  created_at timestamptz default now()
);

create table if not exists public.business_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.business_orders(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0
);

create table if not exists public.business_messages (
  id uuid primary key default gen_random_uuid(),
  publication_id text,
  business_id uuid references public.business_profiles(id) on delete set null,
  order_id uuid references public.business_orders(id) on delete set null,
  appointment_id uuid null,
  thread_id text,
  sender_type text not null,
  sender_name text,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.business_appointments (
  id uuid primary key default gen_random_uuid(),
  publication_id text,
  business_id uuid references public.business_profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  preferred_date date,
  preferred_time time,
  need_description text,
  status text default 'Nueva solicitud',
  created_at timestamptz default now()
);
