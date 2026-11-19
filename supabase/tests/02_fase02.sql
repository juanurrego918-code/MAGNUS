-- Pruebas Fase 02: pedidos (precios y descuentos del servidor), alistado FEFO, facturación, cartera, anulación y cuadre.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values
 ('00000000-0000-0000-0000-000000000005','caja@t'),('00000000-0000-0000-0000-000000000006','most@t');
insert into public.profiles (id, full_name, role) values
 ('00000000-0000-0000-0000-000000000005','Caja Prueba','caja'),
 ('00000000-0000-0000-0000-000000000006','Mostrador Prueba','mostrador');

create or replace function pg_temp.as_user(n int) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin begin execute sql; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end; raise exception 'FALLO: % debía fallar', label; end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FALLO: %', label; end if; end $$;

-- ids de ayuda
create temp table ids as select
  (select id from clients where nit='830.441.982-1') as dist,       -- Distribuidor con crédito
  (select id from clients where nit='900.123.456-7') as mayo,
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='GR-0101' and pr.name='Unidad') as arroz_und,
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='GR-0101' and pr.name like 'Bulto%') as arroz_bulto,
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='AC-0210') as aceite18;
grant select on ids to authenticated;
update clients set credit_days = 30 where nit = '830.441.982-1';
update clients set credit_days = 0 where nit = '900.123.456-7';

-- Vendedor crea pedido: el precio lo pone el servidor aunque el cliente intente mandar otro
select pg_temp.as_user(2);
select pg_temp.expect_fail($$select * from public.create_order((select dist from ids), '[]'::jsonb, 'recoge', null, null, 'contado')$$, 'pedido vacío rechazado');
select pg_temp.expect_fail($$select * from public.create_order((select mayo from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select arroz_und from ids),'qty',1)), 'recoge', null, null, 'credito')$$, 'crédito sin cupo rechazado');
select pg_temp.expect_fail($$select * from public.create_order((select mayo from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select arroz_und from ids),'qty',1)), 'recoge', null, null, 'contra_entrega')$$, 'contra entrega solo domicilio');
select pg_temp.expect_fail($$select * from public.create_order((select mayo from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select aceite18 from ids),'qty',9999)), 'recoge', null, null, 'contado')$$, 'no vende más de lo que hay');
select pg_temp.expect_fail($$select * from public.create_order((select mayo from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select arroz_und from ids),'qty',0)), 'recoge', null, null, 'contado')$$, 'cantidad cero rechazada');

-- 10 bultos de arroz (50 und) a Distribuidor: precio 109000*0.96=104640 → redondeado a 50 = 104650; 10 → 1.046.500 → 3 % desc
create temp table o1 as select * from public.create_order((select dist from ids),
  jsonb_build_array(jsonb_build_object('presentation_id',(select arroz_bulto from ids),'qty',10)),
  'domicilio', 'Av. Indumil # 4-20, Soacha', '08:00–11:00', 'credito', 'prueba', 'vendedor');
select pg_temp.as_admin();
select pg_temp.expect((select unit_price from order_lines where order_id=(select order_id from o1)) = 104650, 'precio de lista calculado en el servidor (Distribuidor)');
select pg_temp.expect((select subtotal from orders where id=(select order_id from o1)) = 1046500, 'subtotal 1.046.500');
select pg_temp.expect((select discount from orders where id=(select order_id from o1)) = 31395, 'descuento por volumen 3 % = 31.395');
select pg_temp.expect((select total from orders where id=(select order_id from o1)) = 1015105, 'total 1.015.105');

-- Vendedor solo ve sus pedidos; mostrador no ve pedidos; bodega no ve montos
select pg_temp.as_user(2); select pg_temp.expect((select count(*) from orders) = 1, 'vendedor ve sus pedidos');
select pg_temp.expect((select count(*) from invoices) = 0, 'vendedor aún sin facturas');
select pg_temp.as_user(6);
select pg_temp.expect((select count(*) from orders) = 0, 'mostrador NO lee pedidos ajenos');
create temp table o2 as select * from public.create_order(null,
  jsonb_build_array(jsonb_build_object('presentation_id',(select arroz_und from ids),'qty',2)), 'recoge', null, null, 'contado', null, 'mostrador');
select pg_temp.expect((select turno from o2) is not null, 'mostrador recibe número de turno');
select pg_temp.expect((select total from o2) = 4700, 'mostrador paga precio Mayorista (2 × 2.350)');
select pg_temp.expect_fail($$select * from public.create_order(null, '[]'::jsonb, 'recoge', null, null, 'contado', null, 'vendedor')$$, 'mostrador no usa canal vendedor');
select pg_temp.as_user(3);
select pg_temp.expect((select count(*) from orders) = 0, 'bodega NO lee pedidos con montos');
select pg_temp.expect((select count(*) from warehouse_queue) >= 2, 'bodega ve la cola sin precios');
select pg_temp.expect(not exists (select 1 from information_schema.columns where table_name='warehouse_queue' and column_name in ('total','unit_price','subtotal')), 'la cola de bodega no tiene columnas de dinero');

-- Facturar antes de alistar no se puede
select pg_temp.as_user(5);
select pg_temp.expect_fail(format('select * from public.invoice_order(%s, ''credito'')', (select order_id from o1)), 'no factura un pedido sin alistar');
select pg_temp.as_user(2);
select pg_temp.expect_fail(format('select public.pick_order(%s)', (select order_id from o1)), 'vendedor NO alista');

-- Bodega alista por FEFO y deja trazabilidad
select pg_temp.as_admin();
create temp table before_stock as select sum(qty_units) q from lots where product_id=(select id from products where code='GR-0101');
select pg_temp.as_user(3);
select public.pick_order((select order_id from o1));
select pg_temp.as_admin();
select pg_temp.expect((select q - (select sum(qty_units) from lots where product_id=(select id from products where code='GR-0101')) from before_stock) = 500, 'alistar descuenta 500 und del inventario');
select pg_temp.expect((select count(*) from order_picks where order_line_id in (select id from order_lines where order_id=(select order_id from o1))) >= 1, 'trazabilidad: queda el lote de cada línea');
select pg_temp.expect((select lot_id from order_picks where order_line_id in (select id from order_lines where order_id=(select order_id from o1)) order by id limit 1) = (select id from lots where lot_code='L-24311'), 'sale primero el lote que vence primero (FEFO)');
select pg_temp.as_user(3);
select pg_temp.expect_fail(format('select public.pick_order(%s)', (select order_id from o1)), 'no se alista dos veces');

-- Caja factura a crédito → cartera
select pg_temp.as_user(5);
create temp table i1 as select * from public.invoice_order((select order_id from o1), 'credito');
select pg_temp.expect((select number from i1) like 'FE-%', 'se genera número de factura');
select pg_temp.expect((select balance from receivables where invoice_id=(select invoice_id from i1)) = 1015105, 'a crédito queda todo en cartera');
select pg_temp.expect((select due_on from invoices where id=(select invoice_id from i1)) = current_date + 30, 'vence según días de crédito del cliente');
select pg_temp.expect_fail(format('select public.register_payment(%s, 99999999, ''efectivo'')', (select invoice_id from i1)), 'abono no puede superar el saldo');
select public.register_payment((select invoice_id from i1), 15105, 'transferencia');
select pg_temp.expect((select balance from receivables where invoice_id=(select invoice_id from i1)) = 1000000, 'abono parcial baja el saldo');
select pg_temp.expect((select status from receivables where invoice_id=(select invoice_id from i1)) = 'al_dia', 'cartera al día');
select pg_temp.as_admin(); update invoices set due_on = current_date - 3 where id=(select invoice_id from i1);
select pg_temp.as_user(5);
select pg_temp.expect((select status from receivables where invoice_id=(select invoice_id from i1)) = 'vencida', 'cartera vencida si pasó la fecha');
select pg_temp.expect_fail($$update payments set amount = 1$$, 'abonos no se editan');
select pg_temp.as_user(2);
select pg_temp.expect_fail(format('select public.register_payment(%s, 100, ''efectivo'')', (select invoice_id from i1)), 'vendedor NO registra abonos');
select pg_temp.expect_fail(format('select public.annul_invoice(%s, ''motivo largo'')', (select invoice_id from i1)), 'vendedor NO anula facturas');

-- Pedido de mostrador: pago en efectivo, cuadre de caja
select pg_temp.as_user(3); select public.pick_order((select order_id from o2));
select pg_temp.as_user(5);
create temp table i2 as select * from public.invoice_order((select order_id from o2), 'efectivo');
select pg_temp.expect((select balance from receivables where invoice_id=(select invoice_id from i2)) = 0, 'efectivo queda pagado');
select pg_temp.expect_fail($$select public.close_cash(300000, 300000, null)$$, 'cierre con diferencia exige observación');
select pg_temp.expect(public.close_cash(300000, 304700, null) = 0, 'cuadre: base + efectivo del día = contado');
select pg_temp.expect_fail($$select public.close_cash(300000, 304700, null)$$, 'solo un cierre por día');

-- Anulación: motivo mínimo, queda en historial, factura sale de cartera
select pg_temp.expect_fail(format('select public.annul_invoice(%s, ''no'')', (select invoice_id from i1)), 'anular exige motivo de 5+ caracteres');
select public.annul_invoice((select invoice_id from i1), 'Error en el cliente');
select pg_temp.as_admin();
select pg_temp.expect((select annulled from invoices where id=(select invoice_id from i1)), 'factura anulada');
select pg_temp.expect((select status from orders where id=(select order_id from o1)) = 'anulado', 'pedido queda anulado');
select pg_temp.expect((select count(*) from receivables where invoice_id=(select invoice_id from i1)) = 0, 'anulada sale de la cartera');
select pg_temp.expect((select count(*) from audit_log where action='Anulación de factura' and who='Caja Prueba') = 1, 'anulación queda en el historial');
select pg_temp.as_user(5);
select pg_temp.expect_fail(format('select public.annul_invoice(%s, ''otra vez por error'')', (select invoice_id from i1)), 'no se anula dos veces');
\echo 'FASE 02: TODAS LAS PRUEBAS PASARON'
