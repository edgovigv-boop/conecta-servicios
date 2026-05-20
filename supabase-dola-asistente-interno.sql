-- SQL opcional futuro para DOLA en producción multiusuario.
-- No aplicar automáticamente en v4.9.49.

create table if not exists public.dola_publication_configs (
  id uuid primary key default gen_random_uuid(),
  publication_id text not null,
  owner_id text,
  publication_type text check (publication_type in ('solicitante','agente','negocio')),
  contact_channel text not null default 'dola' check (contact_channel in ('dola','whatsapp')),
  questions jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dola_requests (
  id uuid primary key default gen_random_uuid(),
  publication_id text not null,
  config_id uuid references public.dola_publication_configs(id) on delete set null,
  requester_name text,
  requester_contact text,
  summary text,
  answers jsonb not null default '[]'::jsonb,
  status text not null default 'nueva' check (status in ('nueva','en_revision','atendida','cerrada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
