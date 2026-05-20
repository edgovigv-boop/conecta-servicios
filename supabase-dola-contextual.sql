-- SQL OPCIONAL FUTURO — DOLA contextual Conecta
-- No aplicar automáticamente para el piloto v4.9.50.
-- Usar solo cuando se decida persistir DOLA en Supabase para multiusuario real.

create table if not exists dola_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  origin text,
  section_origin text,
  template_id text,
  publication_id text,
  context jsonb default '{}'::jsonb,
  messages jsonb default '[]'::jsonb,
  generated_text text,
  created_at timestamptz default now()
);

create table if not exists dola_filtered_requests (
  id uuid primary key default gen_random_uuid(),
  publication_id text,
  requester_name text,
  requester_contact text,
  summary text,
  answers jsonb default '[]'::jsonb,
  status text default 'Nueva',
  created_at timestamptz default now()
);

create table if not exists dola_media_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text unique,
  category text,
  asset_url text not null,
  asset_type text default 'image',
  active boolean default true,
  created_at timestamptz default now()
);
