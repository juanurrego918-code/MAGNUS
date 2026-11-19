-- Magnus · Fase 01 · Base del sistema
-- Roles, catálogo, presentaciones, listas de precios, inventario por lotes (FEFO),
-- clientes e historial inalterable. RLS activo en todas las tablas.

create extension if not exists pgcrypto;

-- ───────── Tipos ─────────
create type public.app_role as enum
  ('dueno', 'vendedor', 'mostrador', 'caja', 'bodega', 'conductor', 'empleado');

-- ───────── Perfiles y roles ─────────
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null check (length(trim(full_name)) >= 3),
  role       public.app_role not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Rol del usuario autenticado. SECURITY DEFINER para evitar recursión de RLS.
create or replace function public.auth_role()
returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = 'dueno', false)
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_role() = any (roles), false)
$$;

-- ───────── Historial inalterable (quién hizo qué) ─────────
create table public.audit_log (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users (id),
  who        text not null,
  role       public.app_role,
  action     text not null,
  detail     text not null,
  created_at timestamptz not null default now()
);

create or replace function public.audit_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'El historial es inalterable';
end $$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_immutable();

create or replace function public.write_audit(p_action text, p_detail text)
returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_role public.app_role;
begin
  select full_name, role into v_name, v_role from public.profiles where id = auth.uid();
  insert into public.audit_log (user_id, who, role, action, detail)
  values (auth.uid(), coalesce(v_name, 'Sistema'), v_role, p_action, p_detail);
end $$;

-- ───────── Catálogo ─────────
create table public.categories (
  id   smallint generated always as identity primary key,
  name text not null unique
);

create table public.products (
  id          bigint generated always as identity primary key,
  code        text not null unique check (code ~ '^[A-Z]{2}-[0-9]{4}$'),
  ean         text unique,
  name        text not null check (length(trim(name)) >= 2),
  brand       text,
  category_id smallint not null references public.categories (id),
  min_units   integer not null default 0 check (min_units >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);

-- Costos en tabla aparte: solo el dueño los ve (vendedor, bodega y conductor nunca).
create table public.product_costs (
  product_id bigint primary key references public.products (id) on delete cascade,
  cost       numeric(14, 2) not null check (cost >= 0)
);

create table public.presentations (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  name       text not null,
  units      integer not null check (units >= 1),
  price      numeric(14, 2) not null check (price >= 0),
  unique (product_id, name)
);
create index presentations_product_idx on public.presentations (product_id);

-- ───────── Listas de precios y descuentos por volumen ─────────
create table public.price_lists (
  id       smallint generated always as identity primary key,
  name     text not null unique,
  factor   numeric(6, 4) not null check (factor > 0 and factor <= 2),
  round_to integer not null default 50 check (round_to >= 1)
);

create table public.discount_tiers (
  id        smallint generated always as identity primary key,
  min_total numeric(14, 2) not null unique check (min_total > 0),
  rate      numeric(5, 4) not null check (rate > 0 and rate < 1)
);

-- ───────── Bodegas e inventario por lotes ─────────
create table public.warehouses (
  id   smallint generated always as identity primary key,
  name text not null unique
);

create table public.lots (
  id           bigint generated always as identity primary key,
  product_id   bigint not null references public.products (id),
  lot_code     text not null check (lot_code ~ '^L-[0-9]{5}$'),
  expires_on   date not null,
  qty_units    integer not null default 0 check (qty_units >= 0),
  warehouse_id smallint not null references public.warehouses (id),
  created_at   timestamptz not null default now(),
  unique (product_id, lot_code, warehouse_id)
);
create index lots_fefo_idx on public.lots (product_id, expires_on) where qty_units > 0;

-- Libro de movimientos (solo se agrega, nunca se edita).
create table public.inventory_movements (
  id         bigint generated always as identity primary key,
  lot_id     bigint not null references public.lots (id),
  delta      integer not null check (delta <> 0),
  reason     text not null,
  ref        text,
  user_id    uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create trigger inventory_movements_immutable before update or delete on public.inventory_movements
  for each row execute function public.audit_immutable();

-- ───────── Clientes ─────────
create table public.clients (
  id            bigint generated always as identity primary key,
  name          text not null check (length(trim(name)) >= 2),
  nit           text not null unique,
  price_list_id smallint not null references public.price_lists (id),
  city          text,
  contact_name  text,
  contact_phone text,
  credit_days   smallint not null default 0 check (credit_days between 0 and 120),
  seller_id     uuid references public.profiles (id),
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.client_addresses (
  id        bigint generated always as identity primary key,
  client_id bigint not null references public.clients (id) on delete cascade,
  label     text not null,
  address   text not null
);

-- ───────── Reglas de negocio en el servidor ─────────

-- Precio de una presentación para un cliente según su lista (redondeado).
create or replace function public.price_for(p_client bigint, p_presentation bigint)
returns numeric language sql stable security definer set search_path = public as $$
  select (round(pr.price * pl.factor / pl.round_to) * pl.round_to)::numeric
  from public.presentations pr, public.clients c
  join public.price_lists pl on pl.id = c.price_list_id
  where pr.id = p_presentation and c.id = p_client
$$;

-- Tasa de descuento por volumen según el subtotal.
create or replace function public.volume_rate(p_subtotal numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(max(rate), 0) from (
    select rate from public.discount_tiers
    where min_total <= p_subtotal order by min_total desc limit 1
  ) t
$$;

-- Asigna unidades a lotes: primero vence, primero sale. Devuelve lo asignado y lo que falta.
create or replace function public.fefo_allocate(p_product bigint, p_units integer)
returns table (lot_id bigint, lot_code text, expires_on date, warehouse text, qty integer, missing integer)
language plpgsql stable security definer set search_path = public as $$
declare r record; left_units integer := p_units; take integer;
begin
  if p_units <= 0 then raise exception 'La cantidad debe ser mayor que cero'; end if;
  if not public.has_role('dueno', 'vendedor', 'mostrador', 'caja', 'bodega') then
    raise exception 'Sin permiso';
  end if;
  for r in
    select l.id, l.lot_code, l.expires_on, w.name as wname, l.qty_units
    from public.lots l join public.warehouses w on w.id = l.warehouse_id
    where l.product_id = p_product and l.qty_units > 0
    order by l.expires_on, l.id
  loop
    exit when left_units <= 0;
    take := least(r.qty_units, left_units);
    lot_id := r.id; lot_code := r.lot_code; expires_on := r.expires_on;
    warehouse := r.wname; qty := take; missing := 0;
    left_units := left_units - take;
    return next;
  end loop;
  if left_units > 0 then
    lot_id := null; lot_code := null; expires_on := null; warehouse := null; qty := 0; missing := left_units;
    return next;
  end if;
end $$;

-- Recibir mercancía: crea o suma al lote y registra el movimiento.
create or replace function public.receive_lot(
  p_product bigint, p_lot text, p_expires date, p_units integer, p_warehouse smallint)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_lot bigint;
begin
  if not public.has_role('dueno', 'bodega') then raise exception 'Sin permiso'; end if;
  if p_units <= 0 then raise exception 'La cantidad debe ser mayor que cero'; end if;
  if p_expires <= current_date then raise exception 'El vencimiento debe ser una fecha futura'; end if;
  insert into public.lots (product_id, lot_code, expires_on, qty_units, warehouse_id)
  values (p_product, p_lot, p_expires, p_units, p_warehouse)
  on conflict (product_id, lot_code, warehouse_id)
  do update set qty_units = public.lots.qty_units + excluded.qty_units
  returning id into v_lot;
  insert into public.inventory_movements (lot_id, delta, reason, ref, user_id)
  values (v_lot, p_units, 'Recepción', p_lot, auth.uid());
  perform public.write_audit('Recepción', format('Recibió %s und del lote %s (producto %s)', p_units, p_lot, p_product));
  return v_lot;
end $$;

-- Ajuste de inventario (acción sensible): motivo obligatorio, queda en el historial.
create or replace function public.adjust_inventory(p_lot bigint, p_delta integer, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_qty integer; v_code text;
begin
  if not public.has_role('dueno', 'bodega') then raise exception 'Sin permiso'; end if;
  if p_delta = 0 then raise exception 'El ajuste no puede ser cero'; end if;
  if p_reason not in ('Empaque roto', 'Producto vencido', 'Daño en transporte', 'Error de conteo') then
    raise exception 'Motivo no válido';
  end if;
  select qty_units, lot_code into v_qty, v_code from public.lots where id = p_lot for update;
  if not found then raise exception 'Lote no existe'; end if;
  if v_qty + p_delta < 0 then raise exception 'El ajuste dejaría el lote en negativo'; end if;
  update public.lots set qty_units = qty_units + p_delta where id = p_lot;
  insert into public.inventory_movements (lot_id, delta, reason, ref, user_id)
  values (p_lot, p_delta, p_reason, 'ajuste', auth.uid());
  perform public.write_audit('Ajuste de inventario', format('%s und lote %s · motivo: %s', p_delta, v_code, p_reason));
end $$;

-- Existencias y alertas por producto (sin costos).
create or replace view public.product_stock with (security_invoker = true) as
select p.id as product_id,
       coalesce(sum(l.qty_units), 0)::integer as stock,
       p.min_units,
       case when not p.active then 'inactivo'
            when coalesce(sum(l.qty_units), 0) <= 0 then 'agotado'
            when coalesce(sum(l.qty_units), 0) < p.min_units then 'bajo'
            else 'ok' end as status,
       min(l.expires_on) filter (where l.qty_units > 0) as next_expiry
from public.products p left join public.lots l on l.product_id = p.id
group by p.id;

-- ───────── RLS ─────────
alter table public.profiles            enable row level security;
alter table public.audit_log           enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_costs       enable row level security;
alter table public.presentations       enable row level security;
alter table public.price_lists         enable row level security;
alter table public.discount_tiers      enable row level security;
alter table public.warehouses          enable row level security;
alter table public.lots                enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.clients             enable row level security;
alter table public.client_addresses    enable row level security;

-- Perfiles: cada quien ve el suyo; el dueño ve y administra todos.
create policy profiles_self  on public.profiles for select using (id = auth.uid());
create policy profiles_owner on public.profiles for all using (public.is_owner()) with check (public.is_owner());

-- Historial: solo el dueño lee; nadie escribe directo (solo write_audit).
create policy audit_owner_read on public.audit_log for select using (public.is_owner());

-- Catálogo: lectura para roles operativos; escritura solo dueño.
create policy categories_read  on public.categories for select
  using (public.has_role('dueno', 'vendedor', 'mostrador', 'caja', 'bodega', 'conductor'));
create policy categories_write on public.categories for all using (public.is_owner()) with check (public.is_owner());

create policy products_read  on public.products for select
  using (public.has_role('dueno', 'vendedor', 'mostrador', 'caja', 'bodega', 'conductor'));
create policy products_write on public.products for all using (public.is_owner()) with check (public.is_owner());

create policy costs_owner on public.product_costs for all using (public.is_owner()) with check (public.is_owner());

create policy presentations_read  on public.presentations for select
  using (public.has_role('dueno', 'vendedor', 'mostrador', 'caja', 'bodega', 'conductor'));
create policy presentations_write on public.presentations for all using (public.is_owner()) with check (public.is_owner());

create policy price_lists_read  on public.price_lists for select
  using (public.has_role('dueno', 'vendedor', 'mostrador', 'caja'));
create policy price_lists_write on public.price_lists for all using (public.is_owner()) with check (public.is_owner());

create policy tiers_read  on public.discount_tiers for select
  using (public.has_role('dueno', 'vendedor', 'mostrador', 'caja'));
create policy tiers_write on public.discount_tiers for all using (public.is_owner()) with check (public.is_owner());

create policy warehouses_read  on public.warehouses for select
  using (public.has_role('dueno', 'bodega', 'caja', 'vendedor'));
create policy warehouses_write on public.warehouses for all using (public.is_owner()) with check (public.is_owner());

-- Lotes: lectura para dueño, bodega, caja y vendedor; escritura solo vía funciones (SECURITY DEFINER).
create policy lots_read on public.lots for select
  using (public.has_role('dueno', 'bodega', 'caja', 'vendedor', 'mostrador'));
create policy movements_read on public.inventory_movements for select
  using (public.has_role('dueno', 'bodega'));

-- Clientes: dueño, vendedor y caja los ven; solo dueño modifica.
create policy clients_read  on public.clients for select
  using (public.has_role('dueno', 'vendedor', 'caja'));
create policy clients_write on public.clients for all using (public.is_owner()) with check (public.is_owner());
create policy addresses_read  on public.client_addresses for select
  using (public.has_role('dueno', 'vendedor', 'caja', 'conductor'));
create policy addresses_write on public.client_addresses for all using (public.is_owner()) with check (public.is_owner());

-- ───────── Privilegios ─────────
revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.audit_log, public.categories, public.products,
  public.product_costs, public.presentations, public.price_lists, public.discount_tiers,
  public.warehouses, public.lots, public.inventory_movements, public.clients,
  public.client_addresses, public.product_stock to authenticated;
grant insert, update, delete on public.profiles, public.categories, public.products,
  public.product_costs, public.presentations, public.price_lists, public.discount_tiers,
  public.warehouses, public.clients, public.client_addresses to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.auth_role(), public.is_owner(), public.has_role(public.app_role[]), public.price_for(bigint, bigint),
  public.volume_rate(numeric), public.fefo_allocate(bigint, integer),
  public.receive_lot(bigint, text, date, integer, smallint),
  public.adjust_inventory(bigint, integer, text) to authenticated;
