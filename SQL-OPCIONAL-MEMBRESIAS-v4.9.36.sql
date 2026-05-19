-- Conecta Servicios v4.9.36
-- SQL OPCIONAL PARA PRODUCCIÓN MULTIUSUARIO
-- No ejecutar automáticamente. Revisar RLS, autenticación y permisos antes de usar en producción.

create extension if not exists pgcrypto;

create table if not exists public.conecta_usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre_publico text not null,
  whatsapp text,
  estado_nombre text,
  municipio text,
  codigo_embajador text,
  estado_membresia text not null default 'sin_membresia'
    check (estado_membresia in ('sin_membresia','pendiente','activa','vencida','cancelada')),
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.conecta_membresias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.conecta_usuarios(id) on delete cascade,
  estado text not null default 'pendiente'
    check (estado in ('pendiente','activa','vencida','cancelada')),
  monto_mxn numeric(10,2) not null default 98,
  fecha_solicitud timestamptz not null default now(),
  fecha_inicio timestamptz,
  fecha_vencimiento timestamptz,
  referencia_pago text,
  metodo_pago text,
  activado_por text,
  notas text,
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.conecta_embajadores_referidos (
  id uuid primary key default gen_random_uuid(),
  codigo_embajador text not null,
  usuario_id uuid references public.conecta_usuarios(id) on delete set null,
  nombre_referido text,
  whatsapp_referido text,
  estado text not null default 'interesado',
  monto_membresia_mxn numeric(10,2) not null default 98,
  comision_embajador_mxn numeric(10,2) not null default 50,
  membresia_id uuid references public.conecta_membresias(id) on delete set null,
  notas text,
  fecha_creacion timestamptz not null default now(),
  fecha_actualizacion timestamptz not null default now()
);

create table if not exists public.conecta_pagos_membresia (
  id uuid primary key default gen_random_uuid(),
  membresia_id uuid references public.conecta_membresias(id) on delete cascade,
  usuario_id uuid references public.conecta_usuarios(id) on delete set null,
  codigo_embajador text,
  monto_mxn numeric(10,2) not null default 98,
  comision_embajador_mxn numeric(10,2) not null default 50,
  estado text not null default 'por_confirmar'
    check (estado in ('por_confirmar','confirmado','rechazado','reembolsado')),
  referencia_pago text,
  comprobante_url text,
  notas text,
  fecha_creacion timestamptz not null default now(),
  fecha_confirmacion timestamptz
);

create index if not exists idx_conecta_usuarios_whatsapp on public.conecta_usuarios(whatsapp);
create index if not exists idx_conecta_usuarios_codigo_embajador on public.conecta_usuarios(codigo_embajador);
create index if not exists idx_conecta_membresias_usuario on public.conecta_membresias(usuario_id);
create index if not exists idx_conecta_membresias_estado on public.conecta_membresias(estado);
create index if not exists idx_conecta_referidos_codigo on public.conecta_embajadores_referidos(codigo_embajador);
create index if not exists idx_conecta_pagos_estado on public.conecta_pagos_membresia(estado);

alter table public.conecta_usuarios enable row level security;
alter table public.conecta_membresias enable row level security;
alter table public.conecta_embajadores_referidos enable row level security;
alter table public.conecta_pagos_membresia enable row level security;

-- Recomendación de seguridad:
-- 1) Usar Supabase Auth o un backend propio para activar membresías.
-- 2) No permitir que el cliente público cambie estado_membresia a 'activa'.
-- 3) Crear policies específicas después de definir el flujo de autenticación.
-- 4) Si se necesita piloto público sin Auth, usar una tabla separada de solicitudes con INSERT limitado.
