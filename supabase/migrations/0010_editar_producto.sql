-- Edición de producto desde la web: una sola función del servidor, solo dueño, con historial.
-- p_prices = [{"id": 12, "price": 2400}, ...]
create or replace function public.update_product(
  p_id bigint, p_min integer, p_cost numeric, p_active boolean, p_photo text, p_prices jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_code text; v_old boolean; v_changes text := ''; x jsonb; v_prev numeric; v_new numeric; v_name text;
begin
  if not public.is_owner() then raise exception 'Sin permiso'; end if;
  if p_min < 0 then raise exception 'El mínimo no puede ser negativo'; end if;
  if p_cost is not null and p_cost < 0 then raise exception 'El costo no puede ser negativo'; end if;
  if coalesce(p_photo, '') <> '' and p_photo !~ '^[a-zA-Z0-9/_.-]{3,120}$' then raise exception 'Foto no válida'; end if;
  select code, active into v_code, v_old from public.products where id = p_id for update;
  if not found then raise exception 'Producto no existe'; end if;
  update public.products set min_units = p_min, active = p_active,
    photo_path = case when coalesce(p_photo, '') <> '' then p_photo else photo_path end where id = p_id;
  if p_cost is not null and p_cost > 0 then
    insert into public.product_costs (product_id, cost) values (p_id, p_cost)
    on conflict (product_id) do update set cost = excluded.cost;
  end if;
  if p_prices is not null and jsonb_typeof(p_prices) = 'array' then
    for x in select * from jsonb_array_elements(p_prices) loop
      v_new := (x ->> 'price')::numeric;
      if v_new is null or v_new < 0 then raise exception 'Precio no válido'; end if;
      select price, name into v_prev, v_name from public.presentations where id = (x ->> 'id')::bigint and product_id = p_id;
      if not found then raise exception 'Presentación no pertenece al producto'; end if;
      if v_prev <> v_new then
        update public.presentations set price = v_new where id = (x ->> 'id')::bigint;
        v_changes := v_changes || format(' %s: %s → %s;', v_name, public.cop_text(v_prev), public.cop_text(v_new));
      end if;
    end loop;
  end if;
  if v_old <> p_active then v_changes := v_changes || case when p_active then ' activado;' else ' inactivado;' end; end if;
  perform public.write_audit('Catálogo', format('Editó %s.%s', v_code, coalesce(nullif(v_changes, ''), ' sin cambios de precio')));
end $$;
revoke execute on function public.update_product(bigint, integer, numeric, boolean, text, jsonb) from public, anon;
grant execute on function public.update_product(bigint, integer, numeric, boolean, text, jsonb) to authenticated;
