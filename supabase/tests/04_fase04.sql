-- Pruebas Fase 04: asistencia con foto, horas y recargos, ausencias, solicitudes y nómina.
\set ON_ERROR_STOP on
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000008','emp@t');
insert into public.profiles (id, full_name, role) values ('00000000-0000-0000-0000-000000000008','Empleada Prueba','empleado');
insert into public.employees (profile_id, full_name, position, area, base_salary) values
  ('00000000-0000-0000-0000-000000000008', 'Empleada Prueba', 'Auxiliar', 'Bodega', 2100000),
  (null, 'Otro Empleado', 'Cajero', 'Caja', 1750000);

create or replace function pg_temp.as_user(n int) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.as_admin() returns void language plpgsql as $$
begin execute 'reset role'; perform set_config('request.jwt.claim.sub','',false); end $$;
create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin begin execute sql; exception when others then raise notice 'OK   % (%)', label, sqlerrm; return; end; raise exception 'FALLO: % debía fallar', label; end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK   %', label; else raise exception 'FALLO: %', label; end if; end $$;

-- Horas: lunes 2026-05-04 de 14:00 a 23:00 Bogotá (9 h) → 8 ord + 1 ext; noche 19–23 = 4 h; sin festivo
select pg_temp.as_admin();
select pg_temp.expect((select (total, ord, ext, night, fest) = (9, 8, 1, 4, 0) from public.shift_hours('2026-05-04 14:00-05', '2026-05-04 23:00-05')), 'horas: 9 h = 8 ordinarias + 1 extra, 4 nocturnas');
select pg_temp.expect((select (total, fest) = (8, 8) from public.shift_hours('2026-05-17 08:00-05', '2026-05-17 16:00-05')), 'domingo: todas las horas son dominicales');
select pg_temp.expect((select fest from public.shift_hours('2026-05-18 08:00-05', '2026-05-18 16:00-05')) = 8, 'festivo (18/05/2026): todas dominicales/festivas');
select pg_temp.expect((select (night, fest) = (6, 0) from public.shift_hours('2026-05-04 22:00-05', '2026-05-05 04:00-05')), 'turno que cruza medianoche: 6 h nocturnas');

-- Asistencia: foto obligatoria y propia; una entrada por día
select pg_temp.as_user(8);
select pg_temp.expect_fail($$select public.clock_in('')$$, 'foto de entrada obligatoria');
select pg_temp.expect_fail($$select public.clock_in('00000000-0000-0000-0000-000000000004/a.jpg')$$, 'no acepta foto de otra persona');
select public.clock_in('00000000-0000-0000-0000-000000000008/in.jpg') is not null;
select pg_temp.expect_fail($$select public.clock_in('00000000-0000-0000-0000-000000000008/in2.jpg')$$, 'solo una entrada por día');
select pg_temp.expect_fail($$select * from public.clock_out('00000000-0000-0000-0000-000000000008/out.jpg')$$, 'no se marca salida con menos de un minuto');
select pg_temp.as_user(2);
select pg_temp.expect_fail($$select public.clock_in('00000000-0000-0000-0000-000000000002/in.jpg')$$, 'un usuario sin ficha de empleado no marca');
select pg_temp.expect((select count(*) from attendance) = 0 and (select count(*) from employees) = 0, 'otros roles NO ven asistencia ni empleados (ni sueldos)');

-- Cierra la asistencia con horas conocidas (como administrador de pruebas) para validar la nómina
select pg_temp.as_admin();
update attendance set work_date = '2026-05-04', clock_in = '2026-05-04 14:00-05', clock_out = '2026-05-04 23:00-05', out_photo_path = 'x' where employee_id = (select id from employees where full_name='Empleada Prueba');
-- 2 turnos programados: 04/05 (trabajado) y 05/05 (ausente); el 06/05 con permiso aprobado
insert into schedules (employee_id, work_date, start_time, end_time)
  select id, d::date, '14:00', '22:00' from employees, generate_series('2026-05-04'::date, '2026-05-06'::date, '1 day') d where full_name='Empleada Prueba';

-- Solicitudes
select pg_temp.as_user(8);
select pg_temp.expect_fail($$select public.create_request('Vacaciones', current_date, 'Quiero vacaciones largas')$$, 'tipo de solicitud válido');
select pg_temp.expect_fail($$select public.create_request('Permiso', current_date, 'no')$$, 'motivo mínimo 5 caracteres');
select pg_temp.expect(public.create_request('Permiso', current_date + 3, 'Cita médica') > 0, 'el empleado crea una solicitud válida');
select pg_temp.expect_fail($$select public.create_request('Permiso', current_date - 30, 'Cita médica vieja')$$, 'no se piden permisos de hace más de 7 días');
select pg_temp.as_admin();
create temp table rq as with i as (insert into time_requests (employee_id, type, for_date, detail) select id, 'Permiso', '2026-05-06', 'Cita médica' from employees where full_name='Empleada Prueba' returning id) select id from i;
grant select on rq to authenticated;
select pg_temp.as_user(8);
select pg_temp.expect_fail($$select public.decide_request((select id from rq), true)$$, 'el empleado NO aprueba solicitudes');
select pg_temp.as_user(1);
select public.decide_request((select id from rq), true);
select pg_temp.expect_fail($$select public.decide_request((select id from rq), false)$$, 'no se resuelve dos veces');
select pg_temp.expect((select count(*) from audit_log where action='Solicitud aprobada') = 1, 'la aprobación queda en el historial');

-- Nómina: período inválido, cálculo, pago
select pg_temp.expect_fail($$select public.compute_payroll('2026-05-03', '2026-05-17')$$, 'solo quincenas (1–15 o 16–fin de mes)');
select pg_temp.as_user(8);
select pg_temp.expect_fail($$select public.compute_payroll('2026-05-01', '2026-05-15')$$, 'el empleado NO calcula nómina');
select pg_temp.as_user(1);
create temp table run as select public.compute_payroll('2026-05-01', '2026-05-15') id;
grant select on run to authenticated;
-- Empleada: básico = 2.100.000/2 − 1 ausencia (05/05) × 2.100.000/30 = 1.050.000 − 70.000 = 980.000 (el 06/05 tiene permiso)
select pg_temp.expect((select absent_days from payroll_lines where employee_id=(select id from employees where full_name='Empleada Prueba') and run_id=(select id from run)) = 1, 'ausencia sin permiso cuenta 1 día; el día con permiso aprobado no');
select pg_temp.expect((select basic from payroll_lines where employee_id=(select id from employees where full_name='Empleada Prueba') and run_id=(select id from run)) = 980000, 'básico quincenal descuenta la ausencia (980.000)');
-- hora = 2.100.000/210 = 10.000; extra 1 h ×1.25 = 12.500; nocturno 4 h × 10.000 × 0.35 = 14.000
select pg_temp.expect((select ext_pay from payroll_lines where employee_id=(select id from employees where full_name='Empleada Prueba')) = 12500, 'hora extra diurna con recargo 25 % (12.500)');
select pg_temp.expect((select night_pay from payroll_lines where employee_id=(select id from employees where full_name='Empleada Prueba')) = 14000, 'recargo nocturno 35 % sobre 4 h (14.000)');
-- bruto = 980.000 + 12.500 + 14.000 = 1.006.500; salud/pensión 4 % = 40.260 c/u; neto = 1.006.500 + 100.000 − 80.520 = 1.025.980
select pg_temp.expect((select net from payroll_lines where employee_id=(select id from employees where full_name='Empleada Prueba')) = 1025980, 'neto = bruto + auxilio − salud − pensión (1.025.980)');
select pg_temp.expect((select count(*) from payroll_lines where run_id=(select id from run)) = 2, 'la prenómina incluye a todos los empleados activos');
-- recalcular antes de pagar no duplica
select public.compute_payroll('2026-05-01', '2026-05-15');
select pg_temp.expect((select count(*) from payroll_lines where run_id=(select id from run)) = 2, 'recalcular no duplica líneas');
-- pagar
select pg_temp.as_user(2);
select pg_temp.expect_fail($$select public.pay_payroll((select id from run))$$, 'vendedor NO paga nómina');
select pg_temp.as_user(1);
select public.pay_payroll((select id from run));
select pg_temp.expect((select status from payroll_runs where id=(select id from run)) = 'pagada', 'nómina pagada');
select pg_temp.expect((select count(*) from audit_log where action='Nómina pagada') = 1, 'el pago queda en el historial');
select pg_temp.expect_fail($$select public.pay_payroll((select id from run))$$, 'no se paga dos veces');
select pg_temp.expect_fail($$select public.compute_payroll('2026-05-01', '2026-05-15')$$, 'una nómina pagada no se recalcula');
select pg_temp.as_admin();
select pg_temp.expect_fail($$update payroll_lines set net = 1$$, 'nómina pagada: líneas bloqueadas');
select pg_temp.expect_fail($$delete from payroll_lines$$, 'nómina pagada: no se borran líneas');
select pg_temp.expect_fail($$insert into payroll_lines (run_id, employee_id, base_salary, absent_days, hours_ord, hours_ext, hours_night, hours_fest, basic, ext_pay, night_pay, fest_pay, transport, gross, health, pension, net) select id, 1, 1, 0,0,0,0,0,0,0,0,0,0,0,0,0,0 from payroll_runs$$, 'nómina pagada: no se agregan líneas');
select pg_temp.expect_fail($$delete from payroll_runs$$, 'nómina pagada: no se borra');
-- la quincena en curso no se puede pagar
select pg_temp.as_user(1);
create temp table run2 as select public.compute_payroll(
  case when extract(day from current_date) <= 15 then date_trunc('month', current_date)::date else (date_trunc('month', current_date) + interval '15 days')::date end,
  case when extract(day from current_date) <= 15 then (date_trunc('month', current_date) + interval '14 days')::date else (date_trunc('month', current_date) + interval '1 month - 1 day')::date end) id;
grant select on run2 to authenticated;
select pg_temp.expect_fail($$select public.pay_payroll((select id from run2))$$, 'no se paga una quincena que no ha terminado');

-- Desprendible y privacidad de sueldos
select pg_temp.as_user(8);
select pg_temp.expect((select net from public.my_payslips() limit 1) = 1025980, 'la empleada ve su desprendible pagado');
select pg_temp.expect((select count(*) from payroll_lines) = 0 and (select count(*) from payroll_runs) = 0, 'la empleada NO lee la tabla de nómina');
select pg_temp.expect((select count(*) from employees) = 1, 'la empleada solo ve su propia ficha');
select pg_temp.expect((select count(*) from public.my_payroll_estimate('2026-05-01', '2026-05-15')) = 1, 'la empleada ve su estimado');
select pg_temp.as_user(4);
select pg_temp.expect((select count(*) from public.my_payslips()) = 0, 'quien no es empleado no ve desprendibles');

-- Fotos: cualquier empleado sube a su carpeta
select pg_temp.as_user(8);
insert into storage.objects (bucket_id, name, owner) values ('evidencias', '00000000-0000-0000-0000-000000000008/in.jpg', '00000000-0000-0000-0000-000000000008');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('evidencias', '00000000-0000-0000-0000-000000000004/x.jpg')$$, 'empleado NO sube a la carpeta de otro');
select pg_temp.as_admin();
\echo 'FASE 04: TODAS LAS PRUEBAS PASARON'
