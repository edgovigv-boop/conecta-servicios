-- Supabase opcional para v4.9.39-asistente-publicaciones
-- NO es necesario para probar el modo piloto con localStorage.
-- Sirve para producción real multiusuario.

create table if not exists publication_assistants (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid,
  owner_user_id uuid,
  title text not null,
  public_name text,
  phone text,
  state text,
  municipality text,
  interaction_type text not null check (interaction_type in ('menu_order','appointment','direct_message','quote_request','service_request','ride_request','delivery_request','help_response')),
  description text,
  status text not null default 'draft_membership',
  membership_required boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists publication_assistant_menu_items (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid references publication_assistants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists publication_assistant_requests (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid references publication_assistants(id) on delete cascade,
  publication_id uuid,
  request_type text not null,
  customer_name text,
  customer_phone text,
  delivery_type text,
  address text,
  preferred_date date,
  preferred_time time,
  notes text,
  total numeric(10,2) default 0,
  status text not null default 'Nuevo',
  payment_status text default 'Pago pendiente / acordar con publicante',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists publication_assistant_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references publication_assistant_requests(id) on delete cascade,
  item_name text not null,
  quantity integer default 1,
  unit_price numeric(10,2) default 0,
  subtotal numeric(10,2) default 0
);

create table if not exists publication_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid references publication_assistants(id) on delete cascade,
  request_id uuid references publication_assistant_requests(id) on delete cascade,
  thread_id text,
  sender_type text not null,
  sender_name text,
  customer_phone text,
  message text not null,
  status text default 'En conversación',
  created_at timestamptz default now()
);
