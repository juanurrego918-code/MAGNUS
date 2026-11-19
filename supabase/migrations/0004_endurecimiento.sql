-- Endurecimiento tras revisar los avisos de seguridad de Supabase.
-- 1) La cola de bodega pasa de vista SECURITY DEFINER a función con verificación de rol.
drop view if exists public.warehouse_queue;
create or replace function public.warehouse_queue()
returns table (order_id bigint, code text, status text, turno integer, delivery_type text, delivery_window text,
               created_at timestamptz, client_name text, presentation text, product text, qty integer, units integer)
language sql stable security definer set search_path = public as $$
  select o.id, o.code, o.status, o.turno, o.delivery_type, o.delivery_window, o.created_at,
         c.name, pr.name, p.name, ol.qty, ol.units
  from public.orders o
  left join public.clients c on c.id = o.client_id
  join public.order_lines ol on ol.order_id = o.id
  join public.presentations pr on pr.id = ol.presentation_id
  join public.products p on p.id = pr.product_id
  where o.status in ('nuevo', 'alistado') and public.has_role('dueno', 'bodega')
  order by o.created_at, o.id
$$;
revoke execute on function public.warehouse_queue() from public, anon;
grant execute on function public.warehouse_queue() to authenticated;

-- 2) search_path fijo en funciones auxiliares.
alter function public.audit_immutable() set search_path = public;
alter function public.round_cop(numeric) set search_path = public;
alter function public.cop_text(numeric) set search_path = public;

-- 3) Funciones internas: solo las usan otras funciones del servidor, no se exponen por la API.
revoke execute on function public.price_for(bigint, bigint), public.volume_rate(numeric) from authenticated;
