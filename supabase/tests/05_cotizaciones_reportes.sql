-- Pruebas: cotizaciones, reportes, carga masiva y sitio público.
\set ON_ERROR_STOP on
create or replace function pg_temp.as_user(n int) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin begin execute sql; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end; raise exception 'FALLO: % debía fallar', label; end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FALLO: %', label; end if; end $$;

create temp table ids as select
  (select id from clients where nit='830.441.982-1') as dist,
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='HA-0301' and pr.name like 'Paca%') as harina_paca;
grant select on ids to authenticated;

-- Cotización: caja la crea con precios del cliente; el vendedor no ve las de otros; se convierte una sola vez
select pg_temp.as_user(5);
create temp table c1 as select * from public.create_quote((select dist from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select harina_paca from ids),'qty',3)), 7);
grant select on c1 to authenticated;
select pg_temp.expect((select total from c1) = 270750, 'cotización: 3 pacas, 94.000 × 0,96 redondeado a 90.250 c/u = 270.750');
select pg_temp.expect_fail($$select * from public.create_quote((select dist from ids), '[]'::jsonb, 7)$$, 'cotización vacía rechazada');
select pg_temp.expect_fail($$select * from public.create_quote((select dist from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select harina_paca from ids),'qty',1)), 90)$$, 'vigencia máxima 60 días');
select pg_temp.as_user(2);
select pg_temp.expect((select count(*) from quotes) = 0, 'vendedor NO ve cotizaciones de otros');
select pg_temp.as_user(4);
select pg_temp.expect_fail($$select * from public.create_quote((select dist from ids), jsonb_build_array(jsonb_build_object('presentation_id',(select harina_paca from ids),'qty',1)), 7)$$, 'conductor NO cotiza');
select pg_temp.as_user(5);
create temp table cv as select * from public.convert_quote((select quote_id from c1), 'recoge', null, null, 'contado');
select pg_temp.expect((select total from cv) = 270750, 'convertir crea el pedido con el mismo total');
select pg_temp.expect_fail(format('select * from public.convert_quote(%s, ''recoge'', null, null, ''contado'')', (select quote_id from c1)), 'no se convierte dos veces');
select pg_temp.as_admin(); update quotes set status = 'abierta', order_id = null, valid_until = current_date - 1 where id = (select quote_id from c1);
select pg_temp.as_user(5);
select pg_temp.expect_fail(format('select * from public.convert_quote(%s, ''recoge'', null, null, ''contado'')', (select quote_id from c1)), 'cotización vencida no se convierte');

-- Reportes: solo el dueño; calculan sobre pedidos facturados
select pg_temp.as_user(3); select pg_temp.expect_fail($$select * from public.report_by_product(current_date - 30, current_date)$$, 'bodega NO ve reportes');
select pg_temp.as_user(2); select pg_temp.expect_fail($$select * from public.report_by_seller(current_date - 30, current_date)$$, 'vendedor NO ve reportes');
select pg_temp.as_user(5); select pg_temp.expect_fail($$select * from public.report_reorder()$$, 'caja NO ve reportes');
select pg_temp.as_admin();
-- Pedido facturado conocido: 2 und de AS-0640 a Mayorista (4.900 c/u, costo 3.600)
create temp table ventas as select 1;
select pg_temp.as_user(2);
create temp table vo as select * from public.create_order((select id from clients where nit='901.220.640-2'),
  jsonb_build_array(jsonb_build_object('presentation_id',(select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='AS-0640' and pr.name='Unidad'),'qty',2)),
  'recoge', null, null, 'contado', null, 'vendedor');
select pg_temp.as_user(3); select public.pick_order((select order_id from vo));
select pg_temp.as_user(5); select * from public.invoice_order((select order_id from vo), 'efectivo');
select pg_temp.as_user(1);
select pg_temp.expect((select (units, revenue, cost, margin) = (2, 9800, 7200, 2600) from public.report_by_product(current_date, current_date) where code = 'AS-0640'), 'reporte por producto: ingreso 9.800, costo 7.200, margen 2.600');
select pg_temp.expect((select revenue from public.report_by_client(current_date, current_date) where client = 'Cafetería Central') = (select sum(total) from orders where status='facturado' and client_id=(select id from clients where nit='901.220.640-2')), 'reporte por cliente = suma de sus pedidos facturados');
select pg_temp.expect((select commission from public.report_by_seller(current_date, current_date) where seller = 'Vendedor Prueba') = (select round(sum(total) * 0.02) from orders where status='facturado' and seller_id='00000000-0000-0000-0000-000000000002'), 'comisión del vendedor = 2 % de sus ventas facturadas');
select pg_temp.expect((select count(*) from public.report_reorder()) > 0, 'reporte de reposición lista productos bajos');

-- Carga masiva: revisión previa sin escribir, y aplicación
select pg_temp.as_user(2); select pg_temp.expect_fail($$select * from public.import_products('[]'::jsonb)$$, 'vendedor NO importa catálogo');
select pg_temp.as_user(1);
create temp table imp as select * from public.import_products($j$[
 {"code":"XX-0001","name":"Producto nuevo","brand":"Marca","category":"Granos","min_units":10,"cost":1000,"presentations":[{"name":"Unidad","units":1,"price":1500}]},
 {"code":"GR-0101","name":"Arroz blanco 500 g","category":"Granos","cost":1800,"presentations":[{"name":"Unidad","units":1,"price":2400}]},
 {"code":"mal","name":"Sin formato","category":"Granos","presentations":[{"name":"Unidad","units":1,"price":1}]},
 {"code":"XX-0002","name":"Sin costo","category":"Aseo","presentations":[{"name":"Unidad","units":1,"price":900}]},
 {"code":"XX-0003","name":"Sin presentación","category":"Aseo","presentations":[]}
]$j$::jsonb, false);
select pg_temp.expect((select count(*) from imp where status='ok') = 2 and (select count(*) from imp where status='advertencia') = 1 and (select count(*) from imp where status='rechazado') = 2, 'revisión: 2 ok, 1 advertencia, 2 rechazados');
select pg_temp.expect((select count(*) from products where code='XX-0001') = 0, 'la revisión no escribe nada');
select * from public.import_products('[{"code":"XX-0001","name":"Producto nuevo","brand":"Marca","category":"Granos","min_units":10,"cost":1000,"presentations":[{"name":"Unidad","units":1,"price":1500}]},{"code":"GR-0101","name":"Arroz blanco 500 g","category":"Granos","cost":1800,"presentations":[{"name":"Unidad","units":1,"price":2400}]}]'::jsonb, true);
select pg_temp.expect((select count(*) from products where code='XX-0001') = 1, 'aplicar crea el producto nuevo');
select pg_temp.expect((select price from presentations pr join products p on p.id=pr.product_id where p.code='GR-0101' and pr.name='Unidad') = 2400, 'aplicar actualiza el precio de uno existente');
select pg_temp.expect((select count(*) from audit_log where action='Carga de catálogo') = 1, 'la carga queda en el historial');

-- Sitio público: sin precios; contactos con validación y tope
select pg_temp.as_admin();
insert into recipes (slug, title, summary, servings, steps, published) values ('arroz-blanco', 'Arroz blanco', 'Clásico', 4, array['Lavar','Cocinar'], true), ('borrador', 'Borrador', null, 1, '{}', false);
insert into recipe_items (recipe_id, label) select id, '2 tazas de arroz' from recipes where slug='arroz-blanco';
set role anon;
select pg_temp.expect((select count(*) from public.public_catalog('arroz')) >= 1, 'anon ve el catálogo público');
select pg_temp.expect(pg_get_function_result('public.public_catalog(text,integer)'::regprocedure) !~ '\m(price|cost|stock|min_units)\M', 'el catálogo público no trae precios, costos ni existencias');
select pg_temp.expect((select count(*) from public.public_recipes()) = 1, 'solo se publican las recetas publicadas');
select pg_temp.expect((select array_length(items, 1) from public.public_recipe('arroz-blanco')) = 1, 'receta con ingredientes');
select pg_temp.expect((select count(*) from public.public_recipe('borrador')) = 0, 'receta no publicada no se ve');
select pg_temp.expect_fail($$select * from recipes$$, 'anon no lee la tabla de recetas');
select pg_temp.expect_fail($$select * from leads$$, 'anon no lee los contactos');
select public.submit_lead('Tienda Nueva', '310 555 1234', 'Quiero ser cliente');
select pg_temp.expect_fail($$select public.submit_lead('X', '3105551234', null)$$, 'nombre corto rechazado');
select pg_temp.expect_fail($$select public.submit_lead('Tienda Nueva', 'abc', null)$$, 'teléfono inválido rechazado');
select public.submit_lead('Tienda Nueva', '3105551234', 'otra'); select public.submit_lead('Tienda Nueva', '3105551234', 'otra');
select pg_temp.expect_fail($$select public.submit_lead('Tienda Nueva', '3105551234', 'otra más')$$, 'tope de 3 solicitudes por hora por teléfono');
select pg_temp.expect_fail($$select * from public.report_reorder()$$, 'anon NO ve reportes');
reset role;
select pg_temp.as_user(1); select pg_temp.expect((select count(*) from leads) = 3, 'el dueño ve los contactos recibidos'); select pg_temp.as_admin();
\echo 'COTIZACIONES, REPORTES Y SITIO: TODAS LAS PRUEBAS PASARON'

-- Edición de producto: solo dueño, con historial de cambios de precio
select pg_temp.as_user(2);
select pg_temp.expect_fail($$select public.update_product((select id from products where code='AS-0640'), 5, 3600, true, null, '[]')$$, 'vendedor NO edita productos');
select pg_temp.as_user(1);
select pg_temp.expect_fail($$select public.update_product((select id from products where code='AS-0640'), -1, 3600, true, null, '[]')$$, 'mínimo negativo rechazado');
select pg_temp.expect_fail($$select public.update_product((select id from products where code='AS-0640'), 5, 3600, true, null, jsonb_build_array(jsonb_build_object('id', (select id from presentations where product_id=(select id from products where code='GR-0101') limit 1), 'price', 100)))$$, 'no cambia precios de otro producto');
select public.update_product((select id from products where code='AS-0640'), 90, 3700, false, 'AS-0640/foto.jpg',
  jsonb_build_array(jsonb_build_object('id', (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='AS-0640' and pr.name='Unidad'), 'price', 5100)));
select pg_temp.as_admin();
select pg_temp.expect((select price from presentations pr join products p on p.id=pr.product_id where p.code='AS-0640' and pr.name='Unidad') = 5100, 'el precio se actualiza');
select pg_temp.expect((select active from products where code='AS-0640') = false and (select photo_path from products where code='AS-0640') = 'AS-0640/foto.jpg', 'se inactiva y guarda la foto');
select pg_temp.expect((select count(*) from audit_log where action='Catálogo' and detail like '%$ 4.900 → $ 5.100%' and detail like '%inactivado%') = 1, 'el cambio de precio y la inactivación quedan en el historial');
\echo 'EDICION DE PRODUCTO: TODAS LAS PRUEBAS PASARON'
