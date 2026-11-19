-- Magnus · Cotizaciones, reportes, carga masiva, fotos de producto, recetas, contactos y catálogo público.

-- ───────── create_order se divide: núcleo interno + envoltura con permisos ─────────
create or replace function public._create_order(
  p_seller uuid, p_client bigint, p_lines jsonb, p_delivery_type text, p_addr text, p_window text,
  p_pay_method text, p_note text, p_channel text)
returns table (order_id bigint, code text, turno integer, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  l jsonb; v_pres record; v_price numeric; v_sub numeric := 0;
  v_rate numeric; v_disc numeric; v_total numeric; v_order bigint; v_code text; v_turno integer;
  v_credit smallint; v_avail integer; v_need jsonb := '{}'::jsonb; v_key text;
begin
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
  values (p_client, case when p_channel = 'vendedor' then p_seller end, p_channel, v_turno, p_delivery_type,
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
revoke execute on function public._create_order(uuid, bigint, jsonb, text, text, text, text, text, text) from public, anon, authenticated;

create or replace function public.create_order(
  p_client bigint, p_lines jsonb, p_delivery_type text, p_addr text, p_window text,
  p_pay_method text, p_note text default null, p_channel text default 'vendedor')
returns table (order_id bigint, code text, turno integer, total numeric)
language plpgsql security definer set search_path = public as $$
begin
  if p_channel = 'vendedor' and not public.has_role('dueno', 'vendedor') then raise exception 'Sin permiso'; end if;
  if p_channel = 'mostrador' and not public.has_role('dueno', 'mostrador') then raise exception 'Sin permiso'; end if;
  return query select * from public._create_order(auth.uid(), p_client, p_lines, p_delivery_type, p_addr, p_window, p_pay_method, p_note, p_channel);
end $$;
grant execute on function public.create_order(bigint, jsonb, text, text, text, text, text, text) to authenticated;

-- ───────── Cotizaciones ─────────
create sequence public.quote_seq start 221;
create table public.quotes (
  id          bigint generated always as identity primary key,
  code        text not null unique default ('COT-' || lpad(nextval('public.quote_seq')::text, 4, '0')),
  client_id   bigint not null references public.clients (id),
  created_by  uuid references auth.users (id),
  valid_until date not null,
  status      text not null default 'abierta' check (status in ('abierta', 'convertida')),
  subtotal    numeric(14, 2) not null,
  discount    numeric(14, 2) not null,
  total       numeric(14, 2) not null,
  order_id    bigint references public.orders (id),
  created_at  timestamptz not null default now()
);
create table public.quote_lines (
  id              bigint generated always as identity primary key,
  quote_id        bigint not null references public.quotes (id) on delete cascade,
  presentation_id bigint not null references public.presentations (id),
  qty             integer not null check (qty > 0),
  unit_price      numeric(14, 2) not null
);

create or replace function public.create_quote(p_client bigint, p_lines jsonb, p_valid_days integer default 7)
returns table (quote_id bigint, code text, total numeric)
language plpgsql security definer set search_path = public as $$
declare l jsonb; v_pres record; v_price numeric; v_sub numeric := 0; v_disc numeric; v_id bigint; v_code text;
begin
  if not public.has_role('dueno', 'caja', 'vendedor') then raise exception 'Sin permiso'; end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then raise exception 'La cotización no tiene productos'; end if;
  if p_valid_days not between 1 and 60 then raise exception 'La vigencia debe ser de 1 a 60 días'; end if;
  if not exists (select 1 from public.clients where id = p_client and active) then raise exception 'Cliente no existe'; end if;
  for l in select * from jsonb_array_elements(p_lines) loop
    if coalesce((l ->> 'qty')::integer, 0) <= 0 then raise exception 'Cantidad no válida'; end if;
    select pr.* into v_pres from public.presentations pr join public.products p on p.id = pr.product_id
      where pr.id = (l ->> 'presentation_id')::bigint and p.active;
    if not found then raise exception 'Producto no disponible'; end if;
    v_sub := v_sub + public.price_for(p_client, v_pres.id) * (l ->> 'qty')::integer;
  end loop;
  v_disc := public.round_cop(v_sub * public.volume_rate(v_sub));
  insert into public.quotes (client_id, created_by, valid_until, subtotal, discount, total)
  values (p_client, auth.uid(), current_date + p_valid_days, v_sub, v_disc, v_sub - v_disc) returning id, quotes.code into v_id, v_code;
  for l in select * from jsonb_array_elements(p_lines) loop
    insert into public.quote_lines (quote_id, presentation_id, qty, unit_price)
    values (v_id, (l ->> 'presentation_id')::bigint, (l ->> 'qty')::integer, public.price_for(p_client, (l ->> 'presentation_id')::bigint));
  end loop;
  perform public.write_audit('Cotización', format('Creó %s por %s', v_code, public.cop_text(v_sub - v_disc)));
  return query select v_id, v_code, v_sub - v_disc;
end $$;

-- Convierte la cotización en pedido (precios vigentes, no los de la cotización) y lo envía a bodega.
create or replace function public.convert_quote(p_quote bigint, p_delivery_type text, p_addr text, p_window text, p_pay_method text)
returns table (order_id bigint, code text, total numeric)
language plpgsql security definer set search_path = public as $$
declare q public.quotes; v_lines jsonb; o record;
begin
  if not public.has_role('dueno', 'caja', 'vendedor') then raise exception 'Sin permiso'; end if;
  select * into q from public.quotes where id = p_quote for update;
  if not found then raise exception 'Cotización no existe'; end if;
  if q.status <> 'abierta' then raise exception 'La cotización ya fue convertida'; end if;
  if q.valid_until < current_date then raise exception 'La cotización está vencida'; end if;
  select jsonb_agg(jsonb_build_object('presentation_id', presentation_id, 'qty', qty)) into v_lines from public.quote_lines where quote_id = p_quote;
  select * into o from public._create_order(auth.uid(), q.client_id, v_lines, p_delivery_type, p_addr, p_window, p_pay_method, 'Desde ' || q.code, 'vendedor');
  update public.quotes set status = 'convertida', order_id = o.order_id where id = p_quote;
  return query select o.order_id, o.code, o.total;
end $$;

-- ───────── Reportes (solo dueño) ─────────
-- Ventas facturadas: ingreso de cada línea = precio × cantidad × (1 − descuento del pedido); costo = unidades × costo.
create or replace function public.report_by_product(p_from date, p_to date)
returns table (code text, name text, units bigint, revenue numeric, cost numeric, margin numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  return query
  select p.code, p.name, sum(ol.units)::bigint,
         round(sum(ol.unit_price * ol.qty * (1 - o.discount_rate)))::numeric,
         round(sum(ol.units * coalesce(pc.cost, 0)))::numeric,
         round(sum(ol.unit_price * ol.qty * (1 - o.discount_rate)) - sum(ol.units * coalesce(pc.cost, 0)))::numeric
  from public.orders o
  join public.order_lines ol on ol.order_id = o.id
  join public.presentations pr on pr.id = ol.presentation_id
  join public.products p on p.id = pr.product_id
  left join public.product_costs pc on pc.product_id = p.id
  where o.status = 'facturado' and (o.created_at at time zone 'America/Bogota')::date between p_from and p_to
  group by p.code, p.name order by 4 desc;
end $$;

create or replace function public.report_by_client(p_from date, p_to date)
returns table (client text, orders bigint, revenue numeric, last_order date)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  return query
  select coalesce(c.name, 'Mostrador'), count(*)::bigint, sum(o.total)::numeric, max((o.created_at at time zone 'America/Bogota')::date)
  from public.orders o left join public.clients c on c.id = o.client_id
  where o.status = 'facturado' and (o.created_at at time zone 'America/Bogota')::date between p_from and p_to
  group by coalesce(c.name, 'Mostrador') order by 3 desc;
end $$;

create or replace function public.report_by_seller(p_from date, p_to date)
returns table (seller text, orders bigint, revenue numeric, commission numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  return query
  select coalesce(pf.full_name, 'Mostrador'), count(*)::bigint, sum(o.total)::numeric, round(sum(o.total) * 0.02)::numeric
  from public.orders o left join public.profiles pf on pf.id = o.seller_id
  where o.status = 'facturado' and (o.created_at at time zone 'America/Bogota')::date between p_from and p_to
  group by coalesce(pf.full_name, 'Mostrador') order by 3 desc;
end $$;

-- Qué reponer: existencias vs. mínimo y venta de los últimos 30 días.
create or replace function public.report_reorder()
returns table (code text, name text, stock bigint, min_units integer, sold_30d bigint, days_left numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  return query
  with s as (
    select p.id, p.code as pcode, p.name as pname, p.min_units as pmin,
           coalesce((select sum(l.qty_units) from public.lots l where l.product_id = p.id), 0)::bigint as stk,
           coalesce((select sum(ol.units) from public.order_lines ol join public.orders o on o.id = ol.order_id
                     join public.presentations pr on pr.id = ol.presentation_id
                     where pr.product_id = p.id and o.status = 'facturado' and o.created_at > now() - interval '30 days'), 0)::bigint as sold
    from public.products p where p.active)
  select s.pcode, s.pname, s.stk, s.pmin, s.sold,
         case when s.sold > 0 then round(s.stk / (s.sold / 30.0), 1) end
  from s where s.stk < s.pmin * 1.5 or (s.sold > 0 and s.stk / (s.sold / 30.0) < 15)
  order by s.stk::numeric / greatest(s.pmin, 1);
end $$;

-- ───────── Carga masiva de catálogo (con revisión previa) ─────────
-- p_rows: [{"code":"GR-0101","ean":"...","name":"...","brand":"...","category":"Granos","min_units":600,"cost":1780,
--           "presentations":[{"name":"Unidad","units":1,"price":2350}]}]
-- Con p_apply = false solo valida. Devuelve una fila por producto con estado ok | advertencia | rechazado.
create or replace function public.import_products(p_rows jsonb, p_apply boolean default false)
returns table (code text, status text, message text)
language plpgsql security definer set search_path = public as $$
declare r jsonb; pr jsonb; v_code text; v_msg text; v_cat smallint; v_pid bigint; v_exists boolean; v_err boolean; v_warn text;
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'El archivo no tiene productos'; end if;
  if jsonb_array_length(p_rows) > 2000 then raise exception 'Máximo 2000 productos por carga'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    v_code := upper(trim(coalesce(r ->> 'code', ''))); v_msg := ''; v_err := false; v_warn := '';
    if v_code !~ '^[A-Z]{2}-[0-9]{4}$' then v_err := true; v_msg := 'Código inválido (formato AA-0000)'; end if;
    if length(trim(coalesce(r ->> 'name', ''))) < 2 then v_err := true; v_msg := v_msg || ' · Falta el nombre'; end if;
    if length(trim(coalesce(r ->> 'category', ''))) < 2 then v_err := true; v_msg := v_msg || ' · Falta la categoría'; end if;
    if jsonb_typeof(r -> 'presentations') <> 'array' or jsonb_array_length(r -> 'presentations') = 0 then v_err := true; v_msg := v_msg || ' · Sin presentaciones'; end if;
    if not v_err then
      for pr in select * from jsonb_array_elements(r -> 'presentations') loop
        if coalesce((pr ->> 'units')::integer, 0) < 1 or coalesce((pr ->> 'price')::numeric, -1) < 0 or length(trim(coalesce(pr ->> 'name', ''))) < 1 then
          v_err := true; v_msg := v_msg || ' · Presentación inválida';
        end if;
      end loop;
    end if;
    if not v_err and coalesce((r ->> 'cost')::numeric, 0) <= 0 then v_warn := ' · Sin costo (no habrá margen)'; end if;
    if v_err then
      code := coalesce(nullif(v_code, ''), '(sin código)'); status := 'rechazado'; message := trim(both ' ·' from v_msg); return next; continue;
    end if;
    select exists (select 1 from public.products where products.code = v_code) into v_exists;
    if p_apply then
      select id into v_cat from public.categories where name = trim(r ->> 'category');
      if v_cat is null then insert into public.categories (name) values (trim(r ->> 'category')) returning id into v_cat; end if;
      insert into public.products (code, ean, name, brand, category_id, min_units)
      values (v_code, nullif(trim(r ->> 'ean'), ''), trim(r ->> 'name'), nullif(trim(r ->> 'brand'), ''), v_cat, coalesce((r ->> 'min_units')::integer, 0))
      on conflict on constraint products_code_key do update set ean = excluded.ean, name = excluded.name, brand = excluded.brand, category_id = excluded.category_id, min_units = excluded.min_units
      returning id into v_pid;
      if coalesce((r ->> 'cost')::numeric, 0) > 0 then
        insert into public.product_costs (product_id, cost) values (v_pid, (r ->> 'cost')::numeric)
        on conflict (product_id) do update set cost = excluded.cost;
      end if;
      for pr in select * from jsonb_array_elements(r -> 'presentations') loop
        insert into public.presentations (product_id, name, units, price)
        values (v_pid, trim(pr ->> 'name'), (pr ->> 'units')::integer, (pr ->> 'price')::numeric)
        on conflict (product_id, name) do update set units = excluded.units, price = excluded.price;
      end loop;
    end if;
    code := v_code; status := case when v_warn <> '' then 'advertencia' else 'ok' end;
    message := trim(both ' ·' from (case when v_exists then 'Actualiza un producto existente' else 'Producto nuevo' end || v_warn));
    return next;
  end loop;
  if p_apply then
    perform public.write_audit('Carga de catálogo', format('Importó %s productos', jsonb_array_length(p_rows)));
  end if;
end $$;

-- ───────── Fotos de producto, recetas, contactos y catálogo público ─────────
alter table public.products add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy productos_escribir on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.is_owner());
create policy productos_actualizar on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.is_owner()) with check (bucket_id = 'productos' and public.is_owner());

create table public.recipes (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  title       text not null check (length(trim(title)) >= 3),
  summary     text,
  servings    integer check (servings is null or servings > 0),
  steps       text[] not null default '{}',
  published   boolean not null default false,
  created_at  timestamptz not null default now()
);
create table public.recipe_items (
  id         bigint generated always as identity primary key,
  recipe_id  bigint not null references public.recipes (id) on delete cascade,
  label      text not null,
  product_id bigint references public.products (id)
);

create table public.leads (
  id         bigint generated always as identity primary key,
  name       text not null,
  phone      text not null,
  message    text,
  created_at timestamptz not null default now()
);

-- Contacto desde el sitio público: validado y con tope por teléfono (anti-spam básico).
create or replace function public.submit_lead(p_name text, p_phone text, p_message text)
returns void language plpgsql security definer set search_path = public as $$
declare v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if length(trim(coalesce(p_name, ''))) < 3 or length(p_name) > 80 then raise exception 'Escriba su nombre'; end if;
  if v_phone !~ '^\+?[0-9]{7,15}$' then raise exception 'Escriba un teléfono válido'; end if;
  if length(coalesce(p_message, '')) > 500 then raise exception 'El mensaje es muy largo (máximo 500 caracteres)'; end if;
  if (select count(*) from public.leads where phone = v_phone and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Ya recibimos su solicitud. Le contactaremos pronto';
  end if;
  insert into public.leads (name, phone, message) values (trim(p_name), v_phone, nullif(trim(p_message), ''));
end $$;

-- Catálogo público: sin precios, costos ni existencias.
create or replace function public.public_catalog(p_search text default null, p_limit integer default 60)
returns table (code text, name text, brand text, category text, photo_path text)
language sql stable security definer set search_path = public as $$
  select p.code, p.name, p.brand, c.name, p.photo_path
  from public.products p join public.categories c on c.id = p.category_id
  where p.active and (p_search is null or p.name ilike '%' || replace(replace(left(p_search, 60), '%', ''), '_', '') || '%')
  order by p.name limit least(greatest(p_limit, 1), 200)
$$;

create or replace function public.public_recipes()
returns table (slug text, title text, summary text, servings integer)
language sql stable security definer set search_path = public as $$
  select slug, title, summary, servings from public.recipes where published order by title
$$;

create or replace function public.public_recipe(p_slug text)
returns table (slug text, title text, summary text, servings integer, steps text[], items text[])
language sql stable security definer set search_path = public as $$
  select r.slug, r.title, r.summary, r.servings, r.steps,
         coalesce((select array_agg(i.label order by i.id) from public.recipe_items i where i.recipe_id = r.id), '{}')
  from public.recipes r where r.published and r.slug = p_slug
$$;

alter table public.quotes       enable row level security;
alter table public.quote_lines  enable row level security;
alter table public.recipes      enable row level security;
alter table public.recipe_items enable row level security;
alter table public.leads        enable row level security;

create policy quotes_read on public.quotes for select using (
  public.has_role('dueno', 'caja') or (public.has_role('vendedor') and created_by = auth.uid()));
create policy quote_lines_read on public.quote_lines for select using (exists (select 1 from public.quotes q where q.id = quote_id));
create policy recipes_owner on public.recipes for all using (public.is_owner()) with check (public.is_owner());
create policy recipe_items_owner on public.recipe_items for all using (public.is_owner()) with check (public.is_owner());
create policy leads_owner on public.leads for select using (public.is_owner());

revoke all on public.quotes, public.quote_lines, public.recipes, public.recipe_items, public.leads from anon, authenticated;
grant select on public.quotes, public.quote_lines, public.leads to authenticated;
grant select, insert, update, delete on public.recipes, public.recipe_items to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.create_quote(bigint, jsonb, integer), public.convert_quote(bigint, text, text, text, text),
  public.report_by_product(date, date), public.report_by_client(date, date), public.report_by_seller(date, date),
  public.report_reorder(), public.import_products(jsonb, boolean) to authenticated;
grant execute on function public.submit_lead(text, text, text), public.public_catalog(text, integer),
  public.public_recipes(), public.public_recipe(text), public.track_delivery(uuid) to anon, authenticated;
