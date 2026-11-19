-- Magnus · Fase 03 · Reparto: domicilios, turno del conductor, GPS solo durante el turno,
-- evidencia de entrega, novedades, cobro contra entrega y enlace de seguimiento para el cliente.

create table public.deliveries (
  id             bigint generated always as identity primary key,
  order_id       bigint not null unique references public.orders (id) on delete cascade,
  driver_id      uuid references public.profiles (id),
  seq            integer check (seq is null or seq > 0),
  status         text not null default 'por_alistar'
                 check (status in ('por_alistar', 'cargado', 'en_ruta', 'entregado', 'novedad')),
  tracking_token uuid not null unique default gen_random_uuid(),
  cod_amount     numeric(14, 2) not null default 0 check (cod_amount >= 0),
  cod_method     text check (cod_method in ('efectivo', 'transferencia')),
  loaded_at      timestamptz,
  departed_at    timestamptz,
  delivered_at   timestamptz,
  receiver_name  text,
  photo_path     text,
  signature_path text,
  novelty_reason text check (novelty_reason in ('No estaba', 'Rechazó el pedido', 'Faltó producto', 'Dirección errada')),
  novelty_detail text,
  created_at     timestamptz not null default now()
);
create index deliveries_driver_idx on public.deliveries (driver_id, status);

create table public.driver_shifts (
  id               bigint generated always as identity primary key,
  driver_id        uuid not null references public.profiles (id),
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  start_photo_path text
);
create unique index one_open_shift_per_driver on public.driver_shifts (driver_id) where ended_at is null;

create table public.driver_locations (
  id          bigint generated always as identity primary key,
  shift_id    bigint not null references public.driver_shifts (id),
  driver_id   uuid not null references public.profiles (id),
  lat         numeric(9, 6) not null check (lat between -90 and 90),
  lng         numeric(9, 6) not null check (lng between -180 and 180),
  recorded_at timestamptz not null default now()
);
create index driver_locations_driver_idx on public.driver_locations (driver_id, recorded_at desc);

-- Todo pedido a domicilio genera su entrega automáticamente.
create or replace function public.create_delivery_for_order()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.delivery_type = 'domicilio' then
    insert into public.deliveries (order_id, cod_amount)
    values (new.id, case when new.pay_method = 'contra_entrega' then new.total else 0 end);
  end if;
  return new;
end $$;
create trigger orders_create_delivery after insert on public.orders
  for each row execute function public.create_delivery_for_order();

-- Turno abierto del usuario actual (o null).
create or replace function public.open_shift_id() returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.driver_shifts where driver_id = auth.uid() and ended_at is null
$$;

-- ───────── Administración: asignar conductor y orden de ruta ─────────
create or replace function public.assign_delivery(p_delivery bigint, p_driver uuid, p_seq integer)
returns void language plpgsql security definer set search_path = public as $$
declare d record; v_code text;
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  if p_seq is not null and p_seq <= 0 then raise exception 'El orden debe ser mayor que cero'; end if;
  select * into d from public.deliveries where id = p_delivery for update;
  if not found then raise exception 'Entrega no existe'; end if;
  if d.status in ('en_ruta', 'entregado') then raise exception 'La entrega ya salió o fue entregada'; end if;
  if p_driver is not null and not exists (select 1 from public.profiles where id = p_driver and role = 'conductor' and active) then
    raise exception 'El usuario no es un conductor activo';
  end if;
  update public.deliveries set driver_id = p_driver, seq = p_seq,
    status = case when status = 'novedad' then 'por_alistar' else status end,
    novelty_reason = case when status = 'novedad' then null else novelty_reason end,
    novelty_detail = case when status = 'novedad' then null else novelty_detail end
  where id = p_delivery;
  select code into v_code from public.orders where id = d.order_id;
  perform public.write_audit('Reparto', format('Asignó %s a conductor (orden %s)', v_code, coalesce(p_seq::text, 'sin definir')));
end $$;

-- ───────── Conductor: turno y ubicación ─────────
create or replace function public.start_shift(p_photo_path text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if not public.has_role('conductor') then raise exception 'Sin permiso'; end if;
  if coalesce(trim(p_photo_path), '') = '' then raise exception 'La foto de entrada es obligatoria'; end if;
  if left(p_photo_path, 37) <> auth.uid()::text || '/' then raise exception 'Ruta de foto no válida'; end if;
  if public.open_shift_id() is not null then raise exception 'Ya tiene un turno abierto'; end if;
  insert into public.driver_shifts (driver_id, start_photo_path) values (auth.uid(), p_photo_path) returning id into v_id;
  perform public.write_audit('Turno', 'Inició turno de reparto');
  return v_id;
end $$;

-- Devuelve el efectivo cobrado contra entrega durante el turno (a entregar en caja).
create or replace function public.end_shift()
returns numeric language plpgsql security definer set search_path = public as $$
declare s record; v_cash numeric;
begin
  if not public.has_role('conductor') then raise exception 'Sin permiso'; end if;
  select * into s from public.driver_shifts where driver_id = auth.uid() and ended_at is null for update;
  if not found then raise exception 'No tiene un turno abierto'; end if;
  if exists (select 1 from public.deliveries where driver_id = auth.uid() and status = 'en_ruta') then
    raise exception 'Tiene entregas en ruta sin cerrar';
  end if;
  update public.driver_shifts set ended_at = now() where id = s.id;
  select coalesce(sum(cod_amount), 0) into v_cash from public.deliveries
    where driver_id = auth.uid() and status = 'entregado' and cod_method = 'efectivo' and delivered_at >= s.started_at;
  perform public.write_audit('Turno', format('Terminó turno de reparto · efectivo a entregar %s', public.cop_text(v_cash)));
  return v_cash;
end $$;

-- Solo con turno abierto; ignora puntos con menos de 5 s de diferencia.
create or replace function public.report_location(p_lat numeric, p_lng numeric)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_shift bigint; v_last timestamptz;
begin
  if not public.has_role('conductor') then raise exception 'Sin permiso'; end if;
  v_shift := public.open_shift_id();
  if v_shift is null then raise exception 'La ubicación solo se comparte durante el turno'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Ubicación no válida';
  end if;
  select max(recorded_at) into v_last from public.driver_locations where shift_id = v_shift;
  if v_last is not null and v_last > now() - interval '5 seconds' then return false; end if;
  insert into public.driver_locations (shift_id, driver_id, lat, lng) values (v_shift, auth.uid(), p_lat, p_lng);
  return true;
end $$;

-- ───────── Conductor: entregas ─────────
create or replace function public.my_deliveries()
returns table (delivery_id bigint, seq integer, status text, order_code text, client_name text, address text,
               delivery_window text, contact_phone text, cod_amount numeric)
language sql stable security definer set search_path = public as $$
  select d.id, d.seq, d.status, o.code, c.name, o.delivery_addr, o.delivery_window, c.contact_phone, d.cod_amount
  from public.deliveries d
  join public.orders o on o.id = d.order_id
  left join public.clients c on c.id = o.client_id
  where d.driver_id = auth.uid() and public.has_role('conductor')
  order by d.seq nulls last, d.id
$$;

-- Productos que lleva (sin precios).
create or replace function public.my_delivery_items(p_delivery bigint)
returns table (product text, presentation text, qty integer)
language sql stable security definer set search_path = public as $$
  select p.name, pr.name, ol.qty
  from public.deliveries d
  join public.order_lines ol on ol.order_id = d.order_id
  join public.presentations pr on pr.id = ol.presentation_id
  join public.products p on p.id = pr.product_id
  where d.id = p_delivery and d.driver_id = auth.uid() and public.has_role('conductor')
$$;

create or replace function public._driver_delivery(p_delivery bigint, p_expect text[])
returns public.deliveries language plpgsql security definer set search_path = public as $$
declare d public.deliveries;
begin
  if not public.has_role('conductor') then raise exception 'Sin permiso'; end if;
  if public.open_shift_id() is null then raise exception 'Inicie su turno primero'; end if;
  select * into d from public.deliveries where id = p_delivery and driver_id = auth.uid() for update;
  if not found then raise exception 'Entrega no encontrada'; end if;
  if not (d.status = any (p_expect)) then raise exception 'La entrega está en estado "%" y no admite esta acción', d.status; end if;
  return d;
end $$;

create or replace function public.mark_loaded(p_delivery bigint)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliveries; v_status text;
begin
  d := public._driver_delivery(p_delivery, array['por_alistar']);
  select status into v_status from public.orders where id = d.order_id;
  if v_status not in ('alistado', 'facturado') then raise exception 'El pedido aún no está alistado por bodega'; end if;
  update public.deliveries set status = 'cargado', loaded_at = now() where id = p_delivery;
end $$;

create or replace function public.start_route(p_delivery bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform public._driver_delivery(p_delivery, array['cargado']);
  update public.deliveries set status = 'en_ruta', departed_at = now() where id = p_delivery;
end $$;

create or replace function public.complete_delivery(
  p_delivery bigint, p_receiver text, p_photo_path text, p_signature_path text, p_cod_method text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliveries; v_inv record; v_code text; v_uid text := auth.uid()::text;
begin
  d := public._driver_delivery(p_delivery, array['en_ruta']);
  if length(trim(coalesce(p_receiver, ''))) < 3 then raise exception 'Escriba el nombre de quien recibe (mínimo 3 caracteres)'; end if;
  if coalesce(trim(p_photo_path), '') = '' then raise exception 'La foto de la entrega es obligatoria'; end if;
  if left(p_photo_path, 37) <> v_uid || '/' or (p_signature_path is not null and left(p_signature_path, 37) <> v_uid || '/') then
    raise exception 'Ruta de archivo no válida';
  end if;
  if d.cod_amount > 0 and p_cod_method not in ('efectivo', 'transferencia') then raise exception 'Indique el medio con el que pagó el cliente'; end if;
  update public.deliveries set status = 'entregado', delivered_at = now(), receiver_name = trim(p_receiver),
    photo_path = p_photo_path, signature_path = p_signature_path,
    cod_method = case when d.cod_amount > 0 then p_cod_method end
  where id = p_delivery;
  -- Si la factura ya existe, el cobro contra entrega salda su cartera.
  if d.cod_amount > 0 then
    select i.id, public.invoice_balance(i.id) as bal into v_inv from public.invoices i
      where i.order_id = d.order_id and not i.annulled;
    if found and v_inv.bal > 0 then
      insert into public.payments (invoice_id, amount, method, created_by) values (v_inv.id, v_inv.bal, p_cod_method, auth.uid());
    end if;
  end if;
  select code into v_code from public.orders where id = d.order_id;
  perform public.write_audit('Entrega', format('Entregó %s a %s', v_code, trim(p_receiver)));
end $$;

create or replace function public.report_novelty(p_delivery bigint, p_reason text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
declare d public.deliveries; v_code text;
begin
  d := public._driver_delivery(p_delivery, array['cargado', 'en_ruta']);
  if p_reason not in ('No estaba', 'Rechazó el pedido', 'Faltó producto', 'Dirección errada') then raise exception 'Motivo no válido'; end if;
  update public.deliveries set status = 'novedad', novelty_reason = p_reason,
    novelty_detail = nullif(trim(coalesce(p_detail, '')), '') where id = p_delivery;
  select code into v_code from public.orders where id = d.order_id;
  perform public.write_audit('Novedad de entrega', format('%s · %s', v_code, p_reason));
end $$;

-- ───────── Seguimiento para el cliente: estado y ventana, nunca ubicación ni montos ─────────
create or replace function public.track_delivery(p_token uuid)
returns table (order_code text, status text, delivery_window text, delivered_at timestamptz)
language sql stable security definer set search_path = public as $$
  select o.code, d.status, o.delivery_window, d.delivered_at
  from public.deliveries d join public.orders o on o.id = d.order_id
  where d.tracking_token = p_token
$$;

-- ───────── RLS ─────────
alter table public.deliveries       enable row level security;
alter table public.driver_shifts    enable row level security;
alter table public.driver_locations enable row level security;

create policy deliveries_read on public.deliveries for select using (
  public.has_role('dueno', 'caja') or (public.has_role('conductor') and driver_id = auth.uid()));
create policy shifts_read on public.driver_shifts for select using (
  public.has_role('dueno') or (public.has_role('conductor') and driver_id = auth.uid()));
create policy locations_read on public.driver_locations for select using (public.has_role('dueno'));

-- ───────── Privilegios ─────────
grant select on public.deliveries, public.driver_shifts, public.driver_locations to authenticated;
grant execute on function
  public.assign_delivery(bigint, uuid, integer), public.start_shift(text), public.end_shift(),
  public.report_location(numeric, numeric), public.my_deliveries(), public.my_delivery_items(bigint),
  public.mark_loaded(bigint), public.start_route(bigint),
  public.complete_delivery(bigint, text, text, text, text), public.report_novelty(bigint, text, text) to authenticated;
grant execute on function public.track_delivery(uuid) to anon, authenticated;
revoke execute on function public.open_shift_id(), public._driver_delivery(bigint, text[]), public.create_delivery_for_order() from public, anon, authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.track_delivery(uuid) to anon;
