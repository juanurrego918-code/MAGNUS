-- Pruebas Fase 03: asignación, turno, GPS solo en turno, entrega con evidencia, novedades, cobro y seguimiento.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000007','cond2@t');
insert into public.profiles (id, full_name, role) values ('00000000-0000-0000-0000-000000000007','Conductor Dos','conductor');

create or replace function pg_temp.as_user(n int) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin begin execute sql; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end; raise exception 'FALLO: % debía fallar', label; end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FALLO: %', label; end if; end $$;

create temp table ids as select
  (select id from clients where nit='901.220.640-2') as cafe,   -- Mayorista sin crédito
  (select pr.id from presentations pr join products p on p.id=pr.product_id where p.code='BE-0710' and pr.name='Unidad') as choco;
grant select on ids to authenticated;
\set u4 '00000000-0000-0000-0000-000000000004'
\set u7 '00000000-0000-0000-0000-000000000007'

-- Pedido a domicilio contra entrega → se crea la entrega con el monto a cobrar
select pg_temp.as_user(2);
create temp table o1 as select * from public.create_order((select cafe from ids),
  jsonb_build_array(jsonb_build_object('presentation_id',(select choco from ids),'qty',10)),
  'domicilio','Cra. 7 # 18-30, Centro','08:00–11:00','contra_entrega',null,'vendedor');
grant select on o1 to authenticated;
select pg_temp.as_admin();
select pg_temp.expect((select cod_amount from deliveries where order_id=(select order_id from o1)) = 92000, 'la entrega nace con el monto contra entrega (10 × 9.200)');
create temp table d1 as select id from deliveries where order_id=(select order_id from o1);
grant select on d1 to authenticated;

-- Asignación: solo el dueño, solo a conductores
select pg_temp.as_user(2);
select pg_temp.expect_fail($$select public.assign_delivery((select id from d1), '00000000-0000-0000-0000-000000000004', 1)$$, 'vendedor NO asigna conductores');
select pg_temp.as_user(1);
select pg_temp.expect_fail($$select public.assign_delivery((select id from d1), '00000000-0000-0000-0000-000000000003', 1)$$, 'no se asigna a quien no es conductor');
select pg_temp.expect_fail($$select public.assign_delivery((select id from d1), '00000000-0000-0000-0000-000000000004', 0)$$, 'orden de ruta debe ser positivo');
select pg_temp.expect_fail($$select public.assign_delivery((select id from d1), '00000000-0000-0000-0000-000000000004', 1)$$, 'no se asigna a un conductor sin turno abierto');

-- Conductor sin turno no opera; con foto ajena no inicia turno
select pg_temp.as_user(4);
select pg_temp.expect_fail($$select public.mark_loaded((select id from d1))$$, 'sin turno no puede operar');
select pg_temp.expect_fail($$select public.report_location(4.65, -74.1)$$, 'GPS rechazado fuera de turno');
select pg_temp.expect_fail($$select public.start_shift('')$$, 'foto de entrada obligatoria');
select pg_temp.expect_fail($$select public.start_shift('00000000-0000-0000-0000-000000000007/foto.jpg')$$, 'no acepta foto de otra persona');
select public.start_shift(:'u4' || '/entrada.jpg');
select pg_temp.as_user(1); select public.assign_delivery((select id from d1), :'u4', 1); select pg_temp.as_user(4);
select pg_temp.expect_fail(format('select public.start_shift(%L)', :'u4' || '/otra.jpg'), 'no abre dos turnos');

-- GPS: rangos, límite de frecuencia, y solo el dueño lo lee
select pg_temp.expect_fail($$select public.report_location(120, -74.1)$$, 'latitud fuera de rango');
select pg_temp.expect(public.report_location(4.65, -74.1) = true, 'GPS se registra con turno abierto');
select pg_temp.expect(public.report_location(4.66, -74.1) = false, 'GPS ignora puntos con menos de 5 s');
select pg_temp.expect((select count(*) from driver_locations) = 0, 'conductor NO lee ubicaciones');
select pg_temp.as_user(1);
select pg_temp.expect((select count(*) from driver_locations) = 1, 'dueño lee ubicaciones');

-- Cargar exige pedido alistado; otro conductor no ve ni toca la entrega
select pg_temp.as_user(4);
select pg_temp.expect_fail($$select public.mark_loaded((select id from d1))$$, 'no carga un pedido sin alistar');
select pg_temp.as_user(3); select public.pick_order((select order_id from o1));
select pg_temp.as_user(5); select public.invoice_order((select order_id from o1), 'contra_entrega');
select pg_temp.as_user(7);
select pg_temp.expect((select count(*) from my_deliveries()) = 0, 'otro conductor NO ve la entrega');
select pg_temp.expect((select count(*) from deliveries) = 0, 'otro conductor NO lee la tabla de entregas');
select pg_temp.as_admin(); insert into driver_shifts (driver_id, start_photo_path) values (:'u7', :'u7' || '/e.jpg');
select pg_temp.as_user(7);
select pg_temp.expect_fail($$select public.mark_loaded((select id from d1))$$, 'otro conductor NO opera la entrega');
select pg_temp.as_user(4);
select pg_temp.expect((select count(*) from my_deliveries()) = 1, 'el conductor ve su entrega');
select pg_temp.expect((select count(*) from my_delivery_items((select id from d1))) = 1, 've los productos que lleva');
select pg_temp.expect(pg_get_function_result('public.my_delivery_items(bigint)'::regprocedure) !~ '(price|total|cost)', 'la lista del conductor no trae precios');
select public.mark_loaded((select id from d1));
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'Ana', 'x', null, 'efectivo')$$, 'no entrega sin salir a ruta');
select public.start_route((select id from d1));

-- Entrega: validaciones de evidencia y cobro
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'An', '00000000-0000-0000-0000-000000000004/f.jpg', null, 'efectivo')$$, 'nombre de 3+ caracteres');
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'Ana Gómez', '', null, 'efectivo')$$, 'foto de entrega obligatoria');
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'Ana Gómez', '00000000-0000-0000-0000-000000000007/f.jpg', null, 'efectivo')$$, 'foto debe ser del propio conductor');
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'Ana Gómez', '00000000-0000-0000-0000-000000000004/f.jpg', null, null)$$, 'contra entrega exige medio de cobro');
select pg_temp.expect_fail($$select public.end_shift()$$, 'no termina turno con entrega en ruta');
select public.complete_delivery((select id from d1), 'Ana Gómez', :'u4' || '/entrega.jpg', null, 'efectivo');
select pg_temp.expect_fail($$select public.complete_delivery((select id from d1), 'Ana Gómez', '00000000-0000-0000-0000-000000000004/f.jpg', null, 'efectivo')$$, 'no se entrega dos veces');
select pg_temp.as_admin();
select pg_temp.expect((select balance from receivables where order_id=(select order_id from o1)) is null or (select count(*) from receivables where order_id=(select order_id from o1) and balance > 0) = 0, 'el cobro contra entrega salda la cartera de la factura');
select pg_temp.expect((select count(*) from audit_log where action='Entrega') = 1, 'la entrega queda en el historial');

-- Fin de turno: devuelve el efectivo a entregar en caja y apaga el GPS
select pg_temp.as_user(4);
select pg_temp.expect(public.end_shift() = 92000, 'fin de turno: efectivo a entregar = 92.000');
select pg_temp.expect_fail($$select public.report_location(4.65, -74.1)$$, 'GPS apagado al terminar el turno');
select pg_temp.expect_fail($$select public.end_shift()$$, 'no termina un turno que no existe');

-- Novedad y reasignación
select pg_temp.as_user(2);
create temp table o2 as select * from public.create_order((select cafe from ids),
  jsonb_build_array(jsonb_build_object('presentation_id',(select choco from ids),'qty',1)),
  'domicilio','Cra. 7 # 18-30, Centro','11:00–14:00','contado',null,'vendedor');
select pg_temp.as_admin();
create temp table d2 as select id from deliveries where order_id=(select order_id from o2);
grant select on d2 to authenticated;
select pg_temp.expect((select cod_amount from deliveries where id=(select id from d2)) = 0, 'contado: sin cobro en la entrega');
select pg_temp.as_user(4); select public.start_shift(:'u4' || '/entrada2.jpg');
select pg_temp.as_user(1); select public.assign_delivery((select id from d2), :'u4', 2);
select pg_temp.as_user(3); select public.pick_order((select order_id from o2));
select pg_temp.as_user(4);
select public.mark_loaded((select id from d2)); select public.start_route((select id from d2));
select pg_temp.expect_fail($$select public.report_novelty((select id from d2), 'porque sí', null)$$, 'motivo de novedad válido');
select public.report_novelty((select id from d2), 'No estaba', 'Local cerrado');
select pg_temp.as_admin();
select pg_temp.expect((select status from deliveries where id=(select id from d2)) = 'novedad', 'la novedad cambia el estado');
select pg_temp.as_user(1); select public.assign_delivery((select id from d2), :'u4', 1);
select pg_temp.as_admin();
select pg_temp.expect((select status from deliveries where id=(select id from d2)) = 'por_alistar' and (select novelty_reason from deliveries where id=(select id from d2)) is null, 'reasignar una novedad la deja lista de nuevo');

-- Seguimiento público: estado sin ubicación ni montos
create temp table tok as select tracking_token t from deliveries where id=(select id from d1);
grant select on tok to anon;
set role anon;
select pg_temp.expect((select status from public.track_delivery((select t from tok))) = 'entregado', 'cliente consulta el estado con su enlace');
select pg_temp.expect((select count(*) from public.track_delivery(gen_random_uuid())) = 0, 'enlace inválido no devuelve nada');
select pg_temp.expect(pg_get_function_result('public.track_delivery(uuid)'::regprocedure) !~ '\m(lat|lng|price|total|cod_amount|driver\w*)\M', 'el seguimiento no expone ubicación, montos ni conductor');
select pg_temp.expect_fail($$select * from deliveries$$, 'anon no lee la tabla de entregas');
reset role;
\echo 'FASE 03: TODAS LAS PRUEBAS PASARON'

-- Fotos (storage): el conductor sube solo a su carpeta; el dueño las ve; otros no
select pg_temp.as_user(4);
insert into storage.objects (bucket_id, name, owner) values ('evidencias', '00000000-0000-0000-0000-000000000004/prueba.jpg', '00000000-0000-0000-0000-000000000004');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('evidencias', '00000000-0000-0000-0000-000000000007/ajena.jpg')$$, 'conductor NO sube a la carpeta de otro');
select pg_temp.as_user(2);
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('evidencias', '00000000-0000-0000-0000-000000000004/x.jpg')$$, 'otro rol NO sube a la carpeta del conductor');
select pg_temp.expect((select count(*) from storage.objects) = 0, 'vendedor NO ve las fotos');
select pg_temp.as_user(1);
select pg_temp.expect((select count(*) from storage.objects) = 1, 'dueño ve las fotos de entrega');
select pg_temp.as_admin();
\echo 'FASE 03 (fotos): TODAS LAS PRUEBAS PASARON'

-- Retención de GPS: 7 días
select pg_temp.as_admin();
insert into driver_locations (shift_id, driver_id, lat, lng, recorded_at)
  select id, driver_id, 4.6, -74.1, now() - interval '8 days' from driver_shifts limit 1;
insert into driver_locations (shift_id, driver_id, lat, lng, recorded_at)
  select id, driver_id, 4.6, -74.1, now() - interval '6 days' from driver_shifts limit 1;
select pg_temp.expect(public.purge_old_locations() = 1, 'la purga borra solo puntos de más de 7 días');
select pg_temp.expect((select count(*) from driver_locations where recorded_at < now() - interval '7 days') = 0, 'no quedan puntos de más de 7 días');
select pg_temp.as_user(1);
select pg_temp.expect_fail($$select public.purge_old_locations()$$, 'el dueño tampoco puede llamar la purga desde la API');
select pg_temp.as_admin();
\echo 'RETENCION GPS: TODAS LAS PRUEBAS PASARON'
