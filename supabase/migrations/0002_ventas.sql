-- Magnus · Fase 02 · Ventas, bodega (alistado FEFO), facturación, cartera y cuadre de caja.
-- El servidor calcula precios, descuentos y totales: el navegador solo manda producto y cantidad.

create sequence public.order_seq   start 10482;
create sequence public.invoice_seq start 3388;
create sequence public.turno_seq   start 15;

-- ───────── Tablas ─────────
create table public.orders (
  id            bigint generated always as identity primary key,
  code          text not null unique default ('PED-' || nextval('public.order_seq')),
  client_id     bigint references public.clients (id),
  seller_id     uuid references public.profiles (id),
  channel       text not null check (channel in ('vendedor', 'mostrador')),
  turno         integer,
  status        text not null default 'nuevo' check (status in ('nuevo', 'alistado', 'facturado', 'anulado')),
  delivery_type text not null check (delivery_type in ('domicilio', 'recoge')),
  delivery_addr text,
  delivery_window text check (delivery_window in ('08:00–11:00', '11:00–14:00', '14:00–17:00')),
  pay_method    text not null check (pay_method in ('contado', 'credito', 'contra_entrega')),
  note          text,
  subtotal      numeric(14, 2) not null,
  discount_rate numeric(5, 4) not null,
  discount      numeric(14, 2) not null,
  total         numeric(14, 2) not null,
  created_at    timestamptz not null default now(),
  check (channel <> 'vendedor' or (client_id is not null and seller_id is not null)),
  check (pay_method <> 'contra_entrega' or delivery_type = 'domicilio')
);
create index orders_status_idx on public.orders (status, created_at);
create index orders_seller_idx on public.orders (seller_id);

create table public.order_lines (
  id              bigint generated always as identity primary key,
  order_id        bigint not null references public.orders (id) on delete cascade,
  presentation_id bigint not null references public.presentations (id),
  qty             integer not null check (qty > 0),
  units           integer not null check (units > 0),
  unit_price      numeric(14, 2) not null check (unit_price >= 0)
);
create index order_lines_order_idx on public.order_lines (order_id);

-- Trazabilidad: qué lote salió en cada línea.
create table public.order_picks (
  id            bigint generated always as identity primary key,
  order_line_id bigint not null references public.order_lines (id) on delete cascade,
  lot_id        bigint not null references public.lots (id),
  units         integer not null check (units > 0)
);
create index order_picks_lot_idx on public.order_picks (lot_id);

create table public.invoices (
  id           bigint generated always as identity primary key,
  number       text not null unique default ('FE-' || nextval('public.invoice_seq')),
  order_id     bigint not null unique references public.orders (id),
  method       text not null check (method in ('efectivo', 'transferencia', 'datafono', 'credito', 'contra_entrega')),
  total        numeric(14, 2) not null,
  due_on       date not null,
  -- El envío a la DIAN lo hace un proveedor autorizado (por definir); aquí solo se guarda el estado.
  dian_status  text not null default 'pendiente' check (dian_status in ('pendiente', 'enviada', 'aceptada', 'rechazada')),
  annulled     boolean not null default false,
  annul_reason text,
  created_by   uuid references auth.users (id),
  created_at   timestamptz not null default now()
);

create table public.payments (
  id         bigint generated always as identity primary key,
  invoice_id bigint not null references public.invoices (id),
  amount     numeric(14, 2) not null check (amount > 0),
  method     text not null check (method in ('efectivo', 'transferencia', 'datafono')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create trigger payments_immutable before update or delete on public.payments
  for each row execute function public.audit_immutable();

create table public.cash_closes (
  id         bigint generated always as identity primary key,
  day        date not null unique,
  base       numeric(14, 2) not null check (base >= 0),
  expected   numeric(14, 2) not null,
  counted    numeric(14, 2) not null check (counted >= 0),
  diff       numeric(14, 2) not null,
  notes      text,
  closed_by  uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create trigger cash_closes_immutable before update or delete on public.cash_closes
  for each row execute function public.audit_immutable();

-- ───────── Funciones ─────────

create or replace function public.round_cop(n numeric) returns numeric
language sql immutable as $$ select round(n) $$;

-- Crea un pedido. p_lines = [{"presentation_id": 1, "qty": 2}, ...]
create or replace function public.create_order(
  p_client bigint, p_lines jsonb, p_delivery_type text, p_addr text, p_window text,
  p_pay_method text, p_note text default null, p_channel text default 'vendedor')
returns table (order_id bigint, code text, turno integer, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  l jsonb; v_pres record; v_units integer; v_price numeric; v_sub numeric := 0;
  v_rate numeric; v_disc numeric; v_total numeric; v_order bigint; v_code text; v_turno integer;
  v_credit smallint; v_avail integer; v_need jsonb := '{}'::jsonb; v_key text;
begin
  if p_channel = 'vendedor' and not public.has_role('dueno', 'vendedor') then raise exception 'Sin permiso'; end if;
  if p_channel = 'mostrador' and not public.has_role('dueno', 'mostrador') then raise exception 'Sin permiso'; end if;
  if p_channel not in ('vendedor', 'mostrador') then raise exception 'Canal no válido'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'El pedido no tiene productos'; end if;
  if p_channel = 'vendedor' and p_client is null then raise exception 'Falta el cliente'; end if;
  if p_pay_method = 'contra_entrega' and p_delivery_type <> 'domicilio' then raise exception 'Contra entrega solo aplica a domicilio'; end if;
  if p_delivery_type = 'domicilio' and (coalesce(trim(p_addr), '') = '' or p_window is null) then
    raise exception 'El domicilio necesita dirección y ventana de entrega';
  end if;
  if p_client is not null then
    select credit_days into v_credit from public.clients where id = p_client and active;
    if not found then raise exception 'Cliente no existe'; end if;
    if p_pay_method = 'credito' and v_credit = 0 then raise exception 'El cliente no tiene crédito'; end if;
  elsif p_pay_method = 'credito' then
    raise exception 'El crédito requiere un cliente';
  end if;

  -- Validar líneas y stock acumulado por producto (varias presentaciones del mismo producto suman).
  for l in select * from jsonb_array_elements(p_lines) loop
    if coalesce((l ->> 'qty')::integer, 0) <= 0 then raise exception 'Cantidad no válida'; end if;
    select pr.*, p.active as p_active into v_pres from public.presentations pr
      join public.products p on p.id = pr.product_id where pr.id = (l ->> 'presentation_id')::bigint;
    if not found or not v_pres.p_active then raise exception 'Producto no disponible'; end if;
    v_key := v_pres.product_id::text;
    v_need := jsonb_set(v_need, array[v_key], to_jsonb(coalesce((v_need ->> v_key)::integer, 0) + (l ->> 'qty')::integer * v_pres.units));
  end loop;
  for v_key in select jsonb_object_keys(v_need) loop
    select coalesce(sum(qty_units), 0) into v_avail from public.lots where product_id = v_key::bigint;
    if v_avail < (v_need ->> v_key)::integer then
      raise exception 'No hay existencias suficientes para el producto %', v_key;
    end if;
  end loop;

  -- Totales calculados en el servidor
  for l in select * from jsonb_array_elements(p_lines) loop
    select * into v_pres from public.presentations where id = (l ->> 'presentation_id')::bigint;
    v_price := case when p_client is null then v_pres.price else public.price_for(p_client, v_pres.id) end;
    v_sub := v_sub + v_price * (l ->> 'qty')::integer;
  end loop;
  v_rate := public.volume_rate(v_sub);
  v_disc := public.round_cop(v_sub * v_rate);
  v_total := v_sub - v_disc;
  if p_channel = 'mostrador' then v_turno := nextval('public.turno_seq'); end if;

  insert into public.orders (client_id, seller_id, channel, turno, delivery_type, delivery_addr, delivery_window,
                             pay_method, note, subtotal, discount_rate, discount, total)
  values (p_client, case when p_channel = 'vendedor' then auth.uid() end, p_channel, v_turno, p_delivery_type,
          nullif(trim(p_addr), ''), p_window, p_pay_method, nullif(trim(p_note), ''), v_sub, v_rate, v_disc, v_total)
  returning id, orders.code into v_order, v_code;

  for l in select * from jsonb_array_elements(p_lines) loop
    select * into v_pres from public.presentations where id = (l ->> 'presentation_id')::bigint;
    v_price := case when p_client is null then v_pres.price else public.price_for(p_client, v_pres.id) end;
    insert into public.order_lines (order_id, presentation_id, qty, units, unit_price)
    values (v_order, v_pres.id, (l ->> 'qty')::integer, (l ->> 'qty')::integer * v_pres.units, v_price);
  end loop;

  perform public.write_audit('Pedido', format('Creó %s por %s', v_code, public.cop_text(v_total)));
  return query select v_order, v_code, v_turno, v_total;
end $$;

create or replace function public.cop_text(n numeric) returns text
language sql immutable as $$ select '$ ' || replace(to_char(round(n), 'FM999G999G999G999'), ',', '.') $$;

-- Bodega alista el pedido: asigna lotes por FEFO, descuenta stock y deja trazabilidad.
create or replace function public.pick_order(p_order bigint)
returns void language plpgsql security definer set search_path = public as $$
declare o record; ln record; a record; v_code text;
begin
  if not public.has_role('dueno', 'bodega') then raise exception 'Sin permiso'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Pedido no existe'; end if;
  if o.status <> 'nuevo' then raise exception 'El pedido ya fue alistado'; end if;
  for ln in select ol.id, ol.units, pr.product_id from public.order_lines ol
            join public.presentations pr on pr.id = ol.presentation_id where ol.order_id = p_order loop
    for a in
      select l.id as lot_id, least(l.qty_units, ln.units - coalesce(sum(l.qty_units) over (order by l.expires_on, l.id rows between unbounded preceding and 1 preceding), 0))::integer as take
      from public.lots l where l.product_id = ln.product_id and l.qty_units > 0 order by l.expires_on, l.id
    loop
      if a.take <= 0 then exit; end if;
      update public.lots set qty_units = qty_units - a.take where id = a.lot_id;
      insert into public.inventory_movements (lot_id, delta, reason, ref, user_id) values (a.lot_id, -a.take, 'Venta', o.code, auth.uid());
      insert into public.order_picks (order_line_id, lot_id, units) values (ln.id, a.lot_id, a.take);
    end loop;
    if (select coalesce(sum(units), 0) from public.order_picks where order_line_id = ln.id) < ln.units then
      raise exception 'No hay existencias suficientes para alistar %', o.code;
    end if;
  end loop;
  update public.orders set status = 'alistado' where id = p_order;
  perform public.write_audit('Alistado', format('Alistó %s', o.code));
end $$;

-- Caja factura un pedido alistado. Efectivo/transferencia/datáfono quedan pagados; crédito y contra entrega quedan en cartera.
create or replace function public.invoice_order(p_order bigint, p_method text)
returns table (invoice_id bigint, number text)
language plpgsql security definer set search_path = public as $$
declare o record; v_credit smallint := 0; v_due date; v_id bigint; v_num text;
begin
  if not public.has_role('dueno', 'caja') then raise exception 'Sin permiso'; end if;
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'Pedido no existe'; end if;
  if o.status <> 'alistado' then raise exception 'El pedido debe estar alistado para facturar'; end if;
  if p_method not in ('efectivo', 'transferencia', 'datafono', 'credito', 'contra_entrega') then raise exception 'Medio de pago no válido'; end if;
  if p_method = 'contra_entrega' and o.delivery_type <> 'domicilio' then raise exception 'Contra entrega solo aplica a domicilio'; end if;
  if p_method = 'credito' then
    if o.client_id is null then raise exception 'El crédito requiere un cliente'; end if;
    select credit_days into v_credit from public.clients where id = o.client_id;
    if v_credit = 0 then raise exception 'El cliente no tiene crédito'; end if;
  end if;
  v_due := current_date + case when p_method = 'credito' then v_credit else 0 end;
  insert into public.invoices (order_id, method, total, due_on, created_by)
  values (p_order, p_method, o.total, v_due, auth.uid()) returning id, invoices.number into v_id, v_num;
  if p_method in ('efectivo', 'transferencia', 'datafono') then
    insert into public.payments (invoice_id, amount, method, created_by) values (v_id, o.total, p_method, auth.uid());
  end if;
  update public.orders set status = 'facturado' where id = p_order;
  perform public.write_audit('Factura', format('Facturó %s → %s', o.code, v_num));
  return query select v_id, v_num;
end $$;

create or replace function public.invoice_balance(p_invoice bigint) returns numeric
language sql stable security definer set search_path = public as $$
  select i.total - coalesce((select sum(amount) from public.payments where invoice_id = i.id), 0)
  from public.invoices i where i.id = p_invoice
$$;

create or replace function public.register_payment(p_invoice bigint, p_amount numeric, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare v_bal numeric; v_num text; v_ann boolean;
begin
  if not public.has_role('dueno', 'caja') then raise exception 'Sin permiso'; end if;
  select number, annulled into v_num, v_ann from public.invoices where id = p_invoice for update;
  if not found then raise exception 'Factura no existe'; end if;
  if v_ann then raise exception 'La factura está anulada'; end if;
  if p_amount <= 0 then raise exception 'El abono debe ser mayor que cero'; end if;
  v_bal := public.invoice_balance(p_invoice);
  if p_amount > v_bal then raise exception 'El abono supera el saldo (%)', public.cop_text(v_bal); end if;
  insert into public.payments (invoice_id, amount, method, created_by) values (p_invoice, p_amount, p_method, auth.uid());
  perform public.write_audit('Abono', format('%s sobre %s', public.cop_text(p_amount), v_num));
end $$;

-- Anular factura (acción sensible): motivo obligatorio y queda en el historial.
-- El inventario NO se reintegra automáticamente: la decisión de reingreso se toma con bodega (pendiente de definir).
create or replace function public.annul_invoice(p_invoice bigint, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_num text; v_order bigint; v_ann boolean;
begin
  if not public.has_role('dueno', 'caja') then raise exception 'Sin permiso'; end if;
  if length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'El motivo debe tener al menos 5 caracteres'; end if;
  select number, order_id, annulled into v_num, v_order, v_ann from public.invoices where id = p_invoice for update;
  if not found then raise exception 'Factura no existe'; end if;
  if v_ann then raise exception 'La factura ya está anulada'; end if;
  update public.invoices set annulled = true, annul_reason = trim(p_reason) where id = p_invoice;
  update public.orders set status = 'anulado' where id = v_order;
  perform public.write_audit('Anulación de factura', format('%s · motivo: %s', v_num, trim(p_reason)));
end $$;

-- Cuadre de caja del día: efectivo esperado = base + pagos en efectivo de hoy.
create or replace function public.close_cash(p_base numeric, p_counted numeric, p_notes text default null)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_exp numeric; v_diff numeric;
begin
  if not public.has_role('dueno', 'caja') then raise exception 'Sin permiso'; end if;
  select p_base + coalesce(sum(p.amount), 0) into v_exp from public.payments p
    join public.invoices i on i.id = p.invoice_id
    where p.method = 'efectivo' and not i.annulled and (p.created_at at time zone 'America/Bogota')::date = (now() at time zone 'America/Bogota')::date;
  v_diff := p_counted - v_exp;
  if v_diff <> 0 and length(trim(coalesce(p_notes, ''))) < 5 then raise exception 'Con diferencia en caja debe escribir una observación'; end if;
  insert into public.cash_closes (day, base, expected, counted, diff, notes, closed_by)
  values ((now() at time zone 'America/Bogota')::date, p_base, v_exp, p_counted, v_diff, nullif(trim(p_notes), ''), auth.uid());
  perform public.write_audit('Cierre de caja', format('Esperado %s · contado %s · diferencia %s', public.cop_text(v_exp), public.cop_text(p_counted), public.cop_text(v_diff)));
  return v_diff;
end $$;

-- Cartera: saldo y estado por factura.
create or replace view public.receivables with (security_invoker = true) as
select i.id as invoice_id, i.number, i.order_id, o.client_id, i.total, i.due_on,
       i.total - coalesce(sum(p.amount), 0) as balance,
       case when i.total - coalesce(sum(p.amount), 0) <= 0 then 'pagada'
            when i.due_on < current_date then 'vencida'
            when i.due_on <= current_date + 5 then 'por_vencer'
            else 'al_dia' end as status
from public.invoices i join public.orders o on o.id = i.order_id
left join public.payments p on p.invoice_id = i.id
where not i.annulled
group by i.id, o.client_id;

-- Cola de bodega: sin precios ni clientes con crédito (bodega no ve montos).
create or replace view public.warehouse_queue as
select o.id as order_id, o.code, o.status, o.turno, o.delivery_type, o.delivery_window, o.created_at,
       c.name as client_name, pr.name as presentation, p.name as product, ol.qty, ol.units
from public.orders o
left join public.clients c on c.id = o.client_id
join public.order_lines ol on ol.order_id = o.id
join public.presentations pr on pr.id = ol.presentation_id
join public.products p on p.id = pr.product_id
where o.status in ('nuevo', 'alistado') and public.has_role('dueno', 'bodega');

-- ───────── RLS ─────────
alter table public.orders      enable row level security;
alter table public.order_lines enable row level security;
alter table public.order_picks enable row level security;
alter table public.invoices    enable row level security;
alter table public.payments    enable row level security;
alter table public.cash_closes enable row level security;

create policy orders_read on public.orders for select using (
  public.has_role('dueno', 'caja') or (public.has_role('vendedor') and seller_id = auth.uid()));
create policy lines_read on public.order_lines for select using (
  exists (select 1 from public.orders o where o.id = order_id));
create policy picks_read on public.order_picks for select using (public.has_role('dueno', 'caja', 'bodega'));
create policy invoices_read on public.invoices for select using (
  public.has_role('dueno', 'caja') or exists (select 1 from public.orders o where o.id = order_id and o.seller_id = auth.uid()));
create policy payments_read on public.payments for select using (public.has_role('dueno', 'caja'));
create policy closes_read on public.cash_closes for select using (public.has_role('dueno', 'caja'));

-- ───────── Privilegios ─────────
grant select on public.orders, public.order_lines, public.order_picks, public.invoices, public.payments,
  public.cash_closes, public.receivables, public.warehouse_queue to authenticated;
grant execute on function
  public.create_order(bigint, jsonb, text, text, text, text, text, text),
  public.pick_order(bigint), public.invoice_order(bigint, text), public.register_payment(bigint, numeric, text),
  public.annul_invoice(bigint, text), public.close_cash(numeric, numeric, text), public.cop_text(numeric) to authenticated;
revoke execute on function public.round_cop(numeric), public.invoice_balance(bigint) from public, anon, authenticated;
revoke execute on function public.cop_text(numeric) from anon;
revoke execute on all functions in schema public from public, anon;
