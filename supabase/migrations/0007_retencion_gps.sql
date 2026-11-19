-- Decisiones de Juan: (1) solo se asigna a conductores con turno abierto; (2) el GPS se conserva 7 días (Ley 1581).
create index if not exists driver_locations_recorded_idx on public.driver_locations (recorded_at);

create or replace function public.purge_old_locations()
returns integer language plpgsql security definer set search_path = public as $$
declare v_n integer;
begin
  delete from public.driver_locations where recorded_at < now() - interval '7 days';
  get diagnostics v_n = row_count;
  return v_n;
end $$;
revoke execute on function public.purge_old_locations() from public, anon, authenticated;

-- Limpieza diaria (3:15 a. m. hora Colombia = 8:15 UTC) si pg_cron está disponible.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('magnus-purgar-gps', '15 8 * * *', 'select public.purge_old_locations()');
  end if;
end $$;

create or replace function public.assign_delivery(p_delivery bigint, p_driver uuid, p_seq integer)
returns void language plpgsql security definer set search_path = public as $$
declare d record; v_code text;
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  if p_seq is not null and p_seq <= 0 then raise exception 'El orden debe ser mayor que cero'; end if;
  select * into d from public.deliveries where id = p_delivery for update;
  if not found then raise exception 'Entrega no existe'; end if;
  if d.status in ('en_ruta', 'entregado') then raise exception 'La entrega ya salió o fue entregada'; end if;
  if p_driver is not null then
    if not exists (select 1 from public.profiles where id = p_driver and role = 'conductor' and active) then
      raise exception 'El usuario no es un conductor activo';
    end if;
    if not exists (select 1 from public.driver_shifts where driver_id = p_driver and ended_at is null) then
      raise exception 'El conductor no tiene turno abierto';
    end if;
  end if;
  update public.deliveries set driver_id = p_driver, seq = p_seq,
    status = case when status = 'novedad' then 'por_alistar' else status end,
    novelty_reason = case when status = 'novedad' then null else novelty_reason end,
    novelty_detail = case when status = 'novedad' then null else novelty_detail end
  where id = p_delivery;
  select code into v_code from public.orders where id = d.order_id;
  perform public.write_audit('Reparto', format('Asignó %s a conductor (orden %s)', v_code, coalesce(p_seq::text, 'sin definir')));
end $$;
