-- Paypos Admin Snapshot RPC
-- Ejecutar en Supabase si /paypos/admin/ abre pero muestra "Sin datos todavía".
--
-- Esta funcion crea una lectura resumida de Paypos para el panel de supervisión.
-- No expone la secret key y evita tener que dar permisos directos de lectura a todas las tablas.

create or replace function public.cc_paypos_admin_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_payload jsonb;
begin
  select id into v_business_id
  from public.cc_businesses
  where name = 'Paypos'
  limit 1;

  if v_business_id is null then
    return jsonb_build_object(
      'ok', false,
      'error', 'No se encontro el negocio Paypos. Ejecuta primero la semilla Paypos.'
    );
  end if;

  select jsonb_build_object(
    'ok', true,
    'business', (
      select to_jsonb(b)
      from public.cc_businesses b
      where b.id = v_business_id
    ),
    'cash', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select *
        from public.cc_cash_session_summary
        where business_id = v_business_id
        order by opened_at desc
        limit 5
      ) x
    ), '[]'::jsonb),
    'stock', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select *
        from public.cc_stock_balances
        where business_id = v_business_id
        order by item_type asc, item_name asc
      ) x
    ), '[]'::jsonb),
    'receivables', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select
          r.id,
          r.description,
          r.original_amount,
          r.paid_amount,
          r.balance,
          r.status,
          r.created_at,
          c.name as contact_name
        from public.cc_receivables r
        left join public.cc_contacts c on c.id = r.contact_id
        where r.business_id = v_business_id
        order by r.created_at desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'payables', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select
          p.id,
          p.description,
          p.original_amount,
          p.paid_amount,
          p.balance,
          p.status,
          p.created_at,
          c.name as contact_name
        from public.cc_payables p
        left join public.cc_contacts c on c.id = p.contact_id
        where p.business_id = v_business_id
        order by p.created_at desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'sales', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select id, sale_date, subtotal, discount, total, payment_status, notes
        from public.cc_sales
        where business_id = v_business_id
        order by sale_date desc
        limit 30
      ) x
    ), '[]'::jsonb),
    'position', coalesce((
      select to_jsonb(x)
      from (
        select *
        from public.cc_business_position
        where business_id = v_business_id
        limit 1
      ) x
    ), '{}'::jsonb)
  ) into v_payload;

  return v_payload;
end;
$$;

grant execute on function public.cc_paypos_admin_snapshot() to anon, authenticated;

-- Prueba rapida despues de ejecutar:
-- select public.cc_paypos_admin_snapshot();
