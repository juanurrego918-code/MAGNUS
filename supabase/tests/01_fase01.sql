-- Pruebas Fase 01: roles, costos ocultos, precios, descuentos, FEFO, ajustes e historial.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-000000000001','dueno@t'),('00000000-0000-0000-0000-000000000002','vend@t'),
 ('00000000-0000-0000-0000-000000000003','bod@t'),('00000000-0000-0000-0000-000000000004','cond@t');
insert into public.profiles (id, full_name, role) values
 ('00000000-0000-0000-0000-000000000001','Dueña Prueba','dueno'),
 ('00000000-0000-0000-0000-000000000002','Vendedor Prueba','vendedor'),
 ('00000000-0000-0000-0000-000000000003','Bodega Prueba','bodega'),
 ('00000000-0000-0000-0000-000000000004','Conductor Prueba','conductor');

create or replace function pg_temp.as_user(n int) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, false);
  execute 'set role authenticated';
end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end;
  raise exception 'FALLO: % debía fallar', label;
end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FALLO: %', label; end if; end $$;

-- Costos: solo el dueño
select pg_temp.as_user(1); select pg_temp.expect((select count(*) from product_costs) = 24, 'dueño ve costos');
select pg_temp.as_user(2); select pg_temp.expect((select count(*) from product_costs) = 0, 'vendedor NO ve costos');
select pg_temp.as_user(3); select pg_temp.expect((select count(*) from product_costs) = 0, 'bodega NO ve costos');
select pg_temp.as_user(4); select pg_temp.expect((select count(*) from product_costs) = 0, 'conductor NO ve costos');

-- Vendedor no edita precios ni catálogo
select pg_temp.as_user(2);
select pg_temp.expect(exists(select 1 from presentations), 'vendedor lee presentaciones');
update presentations set price = 1;
select pg_temp.as_admin();
select pg_temp.expect(not exists(select 1 from presentations where price = 1), 'vendedor NO puede cambiar precios (RLS filtra el update)');

-- Conductor no ve clientes completos ni lotes
select pg_temp.as_user(4);
select pg_temp.expect((select count(*) from clients) = 0, 'conductor NO lee clientes');
select pg_temp.expect((select count(*) from lots) = 0, 'conductor NO lee lotes');

-- Precio por lista: Distribuidor = base*0.96 redondeado a 50 (arroz 500 g unidad 2350 → 2250)
select pg_temp.as_admin();
select pg_temp.expect(public.price_for((select id from clients where nit='830.441.982-1'),
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='GR-0101' and pr.name='Unidad')) = 2250, 'precio Distribuidor 2350 → 2250');
select pg_temp.expect(public.price_for((select id from clients where nit='900.123.456-7'),
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='GR-0101' and pr.name='Unidad')) = 2350, 'precio Mayorista 2350');

-- Descuento por volumen
select pg_temp.expect(public.volume_rate(999999) = 0, 'sin descuento bajo $1.000.000');
select pg_temp.expect(public.volume_rate(1000000) = 0.03, '3 % desde $1.000.000');
select pg_temp.expect(public.volume_rate(3000000) = 0.05, '5 % desde $3.000.000');

select pg_temp.as_user(2);
-- FEFO: arroz 500 g tiene lotes 9d (340), 64d (900)... pedir 500 → 340 del primero + 160 del segundo
select pg_temp.expect((select qty from public.fefo_allocate((select id from products where code='GR-0101'), 500) where lot_code='L-24311') = 340, 'FEFO toma primero el lote que vence antes');
select pg_temp.expect((select sum(qty) from public.fefo_allocate((select id from products where code='GR-0101'), 500)) = 500, 'FEFO completa la cantidad');
select pg_temp.expect((select missing from public.fefo_allocate((select id from products where code='AC-0201'), 10) where missing > 0) = 10, 'FEFO informa faltante si agotado');

-- Ajuste de inventario: vendedor no puede; bodega sí, con motivo válido; queda en historial
select pg_temp.expect_fail($$select public.adjust_inventory((select id from lots limit 1), -1, 'Empaque roto')$$, 'vendedor NO ajusta inventario');
select pg_temp.as_user(3);
select pg_temp.expect_fail($$select public.adjust_inventory((select id from lots limit 1), -1, 'porque sí')$$, 'motivo inválido rechazado');
select pg_temp.expect_fail($$select public.adjust_inventory((select id from lots where lot_code='L-24360'), -9999, 'Error de conteo')$$, 'no permite inventario negativo');
select public.adjust_inventory((select id from lots where lot_code='L-24360'), -6, 'Empaque roto');
select pg_temp.as_admin();
select pg_temp.expect((select qty_units from lots where lot_code='L-24360') = 174, 'ajuste aplicado (180 − 6)');
select pg_temp.expect((select count(*) from audit_log where action='Ajuste de inventario' and who='Bodega Prueba') = 1, 'ajuste queda en el historial con quién lo hizo');

-- Historial inalterable
select pg_temp.expect_fail($$update audit_log set detail='x'$$, 'historial no se edita');
select pg_temp.expect_fail($$delete from audit_log$$, 'historial no se borra');
select pg_temp.expect_fail($$delete from inventory_movements$$, 'movimientos no se borran');

-- Solo dueño lee el historial
select pg_temp.as_user(3); select pg_temp.expect((select count(*) from audit_log) = 0, 'bodega NO lee el historial');
select pg_temp.as_user(1); select pg_temp.expect((select count(*) from audit_log) >= 1, 'dueño lee el historial');

-- Recepción de lote: bodega sí; fecha pasada no
select pg_temp.as_user(3);
select pg_temp.expect_fail($$select public.receive_lot((select id from products where code='AC-0201'), 'L-99999', current_date - 1, 10, 1::smallint)$$, 'vencimiento pasado rechazado');
select public.receive_lot((select id from products where code='AC-0201'), 'L-99999', current_date + 100, 144, 1::smallint);
select pg_temp.as_admin();
select pg_temp.expect((select stock from product_stock ps join products p on p.id=ps.product_id where p.code='AC-0201') = 144, 'recepción repone stock');

-- Sin sesión (anon) no ve nada
set role anon;
select pg_temp.expect_fail($$select count(*) from products$$, 'anon NO accede al catálogo');
reset role;
\echo 'TODAS LAS PRUEBAS PASARON'
