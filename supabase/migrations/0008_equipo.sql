-- Magnus · Fase 04 · Equipo: empleados, turnos, asistencia con foto, solicitudes y nómina quincenal.
-- Porcentajes y valores de nómina son de REFERENCIA (tabla payroll_settings): deben validarse con el contador.

create table public.employees (
  id          bigint generated always as identity primary key,
  profile_id  uuid unique references public.profiles (id),
  full_name   text not null check (length(trim(full_name)) >= 3),
  position    text not null,
  area        text not null check (area in ('Ventas', 'Bodega', 'Caja', 'Reparto', 'Administración')),
  base_salary numeric(14, 2) not null check (base_salary > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.payroll_settings (
  singleton     boolean primary key default true check (singleton),
  hours_month   integer not null default 210 check (hours_month > 0),
  daily_hours   numeric(4, 2) not null default 8 check (daily_hours > 0),
  ext_rate      numeric(5, 4) not null default 0.25,
  night_rate    numeric(5, 4) not null default 0.35,
  holiday_rate  numeric(5, 4) not null default 0.90,
  night_from    integer not null default 19 check (night_from between 0 and 23),
  night_to      integer not null default 6 check (night_to between 0 and 23),
  transport_aid numeric(14, 2) not null default 100000,
  health_rate   numeric(5, 4) not null default 0.04,
  pension_rate  numeric(5, 4) not null default 0.04
);
insert into public.payroll_settings default values;

create table public.holidays (
  day  date primary key,
  name text not null
);
-- Festivos de Colombia 2026 (validar contra el calendario oficial).
insert into public.holidays (day, name) values
 ('2026-01-01', 'Año Nuevo'), ('2026-01-12', 'Reyes Magos'), ('2026-03-23', 'San José'),
 ('2026-04-02', 'Jueves Santo'), ('2026-04-03', 'Viernes Santo'), ('2026-05-01', 'Día del Trabajo'),
 ('2026-05-18', 'Ascensión del Señor'), ('2026-06-08', 'Corpus Christi'), ('2026-06-15', 'Sagrado Corazón'),
 ('2026-06-29', 'San Pedro y San Pablo'), ('2026-07-20', 'Día de la Independencia'), ('2026-08-07', 'Batalla de Boyacá'),
 ('2026-08-17', 'Asunción de la Virgen'), ('2026-10-12', 'Día de la Raza'), ('2026-11-02', 'Todos los Santos'),
 ('2026-11-16', 'Independencia de Cartagena'), ('2026-12-08', 'Inmaculada Concepción'), ('2026-12-25', 'Navidad');

create table public.schedules (
  id          bigint generated always as identity primary key,
  employee_id bigint not null references public.employees (id) on delete cascade,
  work_date   date not null,
  start_time  time not null,
  end_time    time not null check (end_time <> start_time),
  unique (employee_id, work_date)
);

create table public.attendance (
  id             bigint generated always as identity primary key,
  employee_id    bigint not null references public.employees (id),
  work_date      date not null,
  clock_in       timestamptz not null default now(),
  clock_out      timestamptz,
  in_photo_path  text not null,
  out_photo_path text,
  unique (employee_id, work_date),
  check (clock_out is null or clock_out > clock_in)
);

create table public.time_requests (
  id          bigint generated always as identity primary key,
  employee_id bigint not null references public.employees (id),
  type        text not null check (type in ('Permiso', 'Cambio de turno')),
  for_date    date not null,
  detail      text not null check (length(trim(detail)) between 5 and 300),
  status      text not null default 'pendiente' check (status in ('pendiente', 'aprobada', 'rechazada')),
  decided_by  uuid references auth.users (id),
  decided_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table public.payroll_runs (
  id           bigint generated always as identity primary key,
  period_start date not null,
  period_end   date not null,
  status       text not null default 'prenomina' check (status in ('prenomina', 'pagada')),
  settings     jsonb not null,
  total_net    numeric(14, 2) not null default 0,
  paid_at      timestamptz,
  paid_by      uuid references auth.users (id),
  created_at   timestamptz not null default now(),
  unique (period_start, period_end),
  check (period_end >= period_start)
);

create table public.payroll_lines (
  id          bigint generated always as identity primary key,
  run_id      bigint not null references public.payroll_runs (id) on delete cascade,
  employee_id bigint not null references public.employees (id),
  base_salary numeric(14, 2) not null,
  absent_days integer not null,
  hours_ord   numeric(8, 2) not null,
  hours_ext   numeric(8, 2) not null,
  hours_night numeric(8, 2) not null,
  hours_fest  numeric(8, 2) not null,
  basic       numeric(14, 2) not null,
  ext_pay     numeric(14, 2) not null,
  night_pay   numeric(14, 2) not null,
  fest_pay    numeric(14, 2) not null,
  transport   numeric(14, 2) not null,
  gross       numeric(14, 2) not null,
  health      numeric(14, 2) not null,
  pension     numeric(14, 2) not null,
  net         numeric(14, 2) not null,
  unique (run_id, employee_id)
);

-- La nómina pagada no se puede alterar.
create or replace function public.payroll_locked() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_status text; v_run bigint;
begin
  if tg_table_name = 'payroll_runs' then
    if tg_op = 'DELETE' then
      if old.status = 'pagada' then raise exception 'La nómina pagada no se puede alterar'; end if;
      return old;
    end if;
    if old.status = 'pagada' then raise exception 'La nómina pagada no se puede alterar'; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then v_run := old.run_id; else v_run := new.run_id; end if;
  select status into v_status from public.payroll_runs where id = v_run;
  if v_status = 'pagada' then raise exception 'La nómina pagada no se puede alterar'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger payroll_runs_locked before update or delete on public.payroll_runs
  for each row execute function public.payroll_locked();
create trigger payroll_lines_locked before insert or update or delete on public.payroll_lines
  for each row execute function public.payroll_locked();

-- ───────── Funciones de apoyo ─────────
create or replace function public.my_employee_id() returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.employees where profile_id = auth.uid() and active
$$;

create or replace function public.bogota_today() returns date
language sql stable set search_path = public as $$ select (now() at time zone 'America/Bogota')::date $$;

-- Horas de un turno trabajado: ordinarias, extra, nocturnas y dominicales/festivas (cada minuto se clasifica).
create or replace function public.shift_hours(p_in timestamptz, p_out timestamptz)
returns table (total numeric, ord numeric, ext numeric, night numeric, fest numeric)
language plpgsql stable security definer set search_path = public as $$
declare s public.payroll_settings; v_total numeric; v_night numeric; v_fest numeric; v_out timestamptz;
begin
  select * into s from public.payroll_settings;
  v_out := least(p_out, p_in + interval '24 hours');
  select count(*) / 60.0,
         count(*) filter (where extract(hour from lt) >= s.night_from or extract(hour from lt) < s.night_to) / 60.0,
         count(*) filter (where extract(dow from lt) = 0 or exists (select 1 from public.holidays h where h.day = lt::date)) / 60.0
    into v_total, v_night, v_fest
  from (select gs at time zone 'America/Bogota' as lt
        from generate_series(date_trunc('minute', p_in), date_trunc('minute', v_out) - interval '1 minute', interval '1 minute') gs) m;
  return query select round(v_total, 2), round(least(v_total, s.daily_hours), 2),
                      round(greatest(v_total - s.daily_hours, 0), 2), round(v_night, 2), round(v_fest, 2);
end $$;

-- Cálculo de una quincena para un empleado (no guarda nada).
create or replace function public.payroll_calc(p_emp bigint, p_start date, p_end date)
returns table (base_salary numeric, absent_days integer, hours_ord numeric, hours_ext numeric, hours_night numeric, hours_fest numeric,
               basic numeric, ext_pay numeric, night_pay numeric, fest_pay numeric, transport numeric, gross numeric,
               health numeric, pension numeric, net numeric)
language plpgsql stable security definer set search_path = public as $$
declare s public.payroll_settings; e public.employees; a record; h record;
  v_abs integer; v_ord numeric := 0; v_ext numeric := 0; v_night numeric := 0; v_fest numeric := 0; v_hr numeric;
  v_basic numeric; v_extp numeric; v_nightp numeric; v_festp numeric; v_gross numeric; v_h numeric; v_p numeric;
begin
  select * into s from public.payroll_settings;
  select * into e from public.employees where id = p_emp;
  if not found then raise exception 'Empleado no existe'; end if;
  for a in select clock_in, clock_out from public.attendance
           where employee_id = p_emp and work_date between p_start and p_end and clock_out is not null loop
    select * into h from public.shift_hours(a.clock_in, a.clock_out);
    v_ord := v_ord + h.ord; v_ext := v_ext + h.ext; v_night := v_night + h.night; v_fest := v_fest + h.fest;
  end loop;
  -- Ausencia: turno programado ya pasado, sin marcación y sin permiso aprobado ese día.
  select count(*) into v_abs from public.schedules sc
    where sc.employee_id = p_emp and sc.work_date between p_start and least(p_end, public.bogota_today() - 1)
      and not exists (select 1 from public.attendance att where att.employee_id = p_emp and att.work_date = sc.work_date)
      and not exists (select 1 from public.time_requests r where r.employee_id = p_emp and r.type = 'Permiso'
                      and r.status = 'aprobada' and r.for_date = sc.work_date);
  v_hr := e.base_salary / s.hours_month;
  v_basic := round(e.base_salary / 2 - v_abs * e.base_salary / 30);
  v_extp := round(v_ext * v_hr * (1 + s.ext_rate));
  v_nightp := round(v_night * v_hr * s.night_rate);
  v_festp := round(v_fest * v_hr * s.holiday_rate);
  v_gross := v_basic + v_extp + v_nightp + v_festp;
  v_h := round(v_gross * s.health_rate); v_p := round(v_gross * s.pension_rate);
  return query select e.base_salary, v_abs, v_ord, v_ext, v_night, v_fest, v_basic, v_extp, v_nightp, v_festp,
                      s.transport_aid, v_gross + s.transport_aid, v_h, v_p, v_gross + s.transport_aid - v_h - v_p;
end $$;

-- ───────── Empleado: asistencia con foto ─────────
create or replace function public.clock_in(p_photo text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_emp bigint := public.my_employee_id(); v_in timestamptz;
begin
  if v_emp is null then raise exception 'Su usuario no está registrado como empleado'; end if;
  if coalesce(trim(p_photo), '') = '' then raise exception 'La foto de entrada es obligatoria'; end if;
  if left(p_photo, 37) <> auth.uid()::text || '/' then raise exception 'Ruta de foto no válida'; end if;
  if exists (select 1 from public.attendance where employee_id = v_emp and work_date = public.bogota_today()) then
    raise exception 'Ya marcó la entrada hoy';
  end if;
  insert into public.attendance (employee_id, work_date, in_photo_path)
  values (v_emp, public.bogota_today(), p_photo) returning clock_in into v_in;
  return v_in;
end $$;

create or replace function public.clock_out(p_photo text)
returns table (hours_ord numeric, hours_ext numeric, hours_night numeric, hours_fest numeric)
language plpgsql security definer set search_path = public as $$
declare v_emp bigint := public.my_employee_id(); a public.attendance; h record;
begin
  if v_emp is null then raise exception 'Su usuario no está registrado como empleado'; end if;
  if coalesce(trim(p_photo), '') = '' then raise exception 'La foto de salida es obligatoria'; end if;
  if left(p_photo, 37) <> auth.uid()::text || '/' then raise exception 'Ruta de foto no válida'; end if;
  select * into a from public.attendance where employee_id = v_emp and clock_out is null
    and clock_in > now() - interval '24 hours' order by clock_in desc limit 1 for update;
  if not found then raise exception 'No tiene una entrada abierta'; end if;
  if now() - a.clock_in < interval '1 minute' then raise exception 'Espere un minuto antes de marcar la salida'; end if;
  update public.attendance set clock_out = now(), out_photo_path = p_photo where id = a.id;
  select * into h from public.shift_hours(a.clock_in, now());
  return query select h.ord, h.ext, h.night, h.fest;
end $$;

-- ───────── Empleado: solicitudes, desprendibles y estimado ─────────
create or replace function public.create_request(p_type text, p_for_date date, p_detail text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_emp bigint := public.my_employee_id(); v_id bigint;
begin
  if v_emp is null then raise exception 'Su usuario no está registrado como empleado'; end if;
  if p_type not in ('Permiso', 'Cambio de turno') then raise exception 'Tipo de solicitud no válido'; end if;
  if p_for_date is null or p_for_date < public.bogota_today() - 7 then raise exception 'La fecha no es válida'; end if;
  if length(trim(coalesce(p_detail, ''))) < 5 then raise exception 'Cuente el motivo en al menos 5 caracteres'; end if;
  insert into public.time_requests (employee_id, type, for_date, detail) values (v_emp, p_type, p_for_date, trim(p_detail)) returning id into v_id;
  return v_id;
end $$;

create or replace function public.my_payroll_estimate(p_start date, p_end date)
returns table (base_salary numeric, absent_days integer, hours_ord numeric, hours_ext numeric, hours_night numeric, hours_fest numeric,
               basic numeric, ext_pay numeric, night_pay numeric, fest_pay numeric, transport numeric, gross numeric,
               health numeric, pension numeric, net numeric)
language plpgsql stable security definer set search_path = public as $$
declare v_emp bigint := public.my_employee_id();
begin
  if v_emp is null then raise exception 'Su usuario no está registrado como empleado'; end if;
  return query select * from public.payroll_calc(v_emp, p_start, p_end);
end $$;

create or replace function public.my_payslips()
returns table (period_start date, period_end date, paid_at timestamptz, basic numeric, ext_pay numeric, night_pay numeric,
               fest_pay numeric, transport numeric, health numeric, pension numeric, net numeric)
language sql stable security definer set search_path = public as $$
  select r.period_start, r.period_end, r.paid_at, l.basic, l.ext_pay, l.night_pay, l.fest_pay, l.transport, l.health, l.pension, l.net
  from public.payroll_lines l join public.payroll_runs r on r.id = l.run_id
  where r.status = 'pagada' and l.employee_id = public.my_employee_id()
  order by r.period_start desc
$$;

-- ───────── Administración ─────────
create or replace function public.set_schedule(p_emp bigint, p_date date, p_start time, p_end time)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  if p_start = p_end then raise exception 'La hora de salida debe ser distinta de la de entrada'; end if;
  insert into public.schedules (employee_id, work_date, start_time, end_time) values (p_emp, p_date, p_start, p_end)
  on conflict (employee_id, work_date) do update set start_time = excluded.start_time, end_time = excluded.end_time;
end $$;

create or replace function public.decide_request(p_request bigint, p_approve boolean, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare r public.time_requests; v_name text;
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  select * into r from public.time_requests where id = p_request for update;
  if not found then raise exception 'Solicitud no existe'; end if;
  if r.status <> 'pendiente' then raise exception 'La solicitud ya fue resuelta'; end if;
  update public.time_requests set status = case when p_approve then 'aprobada' else 'rechazada' end,
    decided_by = auth.uid(), decided_at = now() where id = p_request;
  select full_name into v_name from public.employees where id = r.employee_id;
  perform public.write_audit(case when p_approve then 'Solicitud aprobada' else 'Solicitud rechazada' end,
    format('%s de %s para el %s', r.type, v_name, r.for_date));
end $$;

-- Calcula (o recalcula) la prenómina de una quincena. Una nómina pagada no se recalcula.
create or replace function public.compute_payroll(p_start date, p_end date)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_run public.payroll_runs; e record; c record; v_ok boolean; v_total numeric;
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  v_ok := (extract(day from p_start) = 1 and extract(day from p_end) = 15 and date_trunc('month', p_start) = date_trunc('month', p_end))
       or (extract(day from p_start) = 16 and p_end = (date_trunc('month', p_start) + interval '1 month - 1 day')::date);
  if not v_ok then raise exception 'El período debe ser una quincena (1 a 15, o 16 a fin de mes)'; end if;
  select * into v_run from public.payroll_runs where period_start = p_start and period_end = p_end for update;
  if found and v_run.status = 'pagada' then raise exception 'Esa nómina ya fue pagada'; end if;
  if not found then
    insert into public.payroll_runs (period_start, period_end, settings)
    select p_start, p_end, to_jsonb(s) - 'singleton' from public.payroll_settings s returning * into v_run;
  else
    delete from public.payroll_lines where run_id = v_run.id;
    update public.payroll_runs set settings = (select to_jsonb(s) - 'singleton' from public.payroll_settings s) where id = v_run.id;
  end if;
  for e in select id from public.employees where active order by id loop
    select * into c from public.payroll_calc(e.id, p_start, p_end);
    insert into public.payroll_lines (run_id, employee_id, base_salary, absent_days, hours_ord, hours_ext, hours_night, hours_fest,
      basic, ext_pay, night_pay, fest_pay, transport, gross, health, pension, net)
    values (v_run.id, e.id, c.base_salary, c.absent_days, c.hours_ord, c.hours_ext, c.hours_night, c.hours_fest,
      c.basic, c.ext_pay, c.night_pay, c.fest_pay, c.transport, c.gross, c.health, c.pension, c.net);
  end loop;
  select coalesce(sum(net), 0) into v_total from public.payroll_lines where run_id = v_run.id;
  update public.payroll_runs set total_net = v_total where id = v_run.id;
  return v_run.id;
end $$;

-- Pagar nómina (acción sensible): solo cuando la quincena terminó; queda bloqueada y en el historial.
create or replace function public.pay_payroll(p_run bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r public.payroll_runs; v_total numeric;
begin
  if not public.has_role('dueno') then raise exception 'Sin permiso'; end if;
  select * into r from public.payroll_runs where id = p_run for update;
  if not found then raise exception 'Nómina no existe'; end if;
  if r.status = 'pagada' then raise exception 'Esa nómina ya fue pagada'; end if;
  if r.period_end >= public.bogota_today() then raise exception 'La quincena aún no termina'; end if;
  select coalesce(sum(net), 0) into v_total from public.payroll_lines where run_id = p_run;
  if v_total <= 0 then raise exception 'La nómina no tiene valores para pagar'; end if;
  update public.payroll_runs set status = 'pagada', paid_at = now(), paid_by = auth.uid(), total_net = v_total where id = p_run;
  perform public.write_audit('Nómina pagada', format('Quincena %s a %s por %s', r.period_start, r.period_end, public.cop_text(v_total)));
end $$;

-- ───────── RLS ─────────
alter table public.employees        enable row level security;
alter table public.payroll_settings enable row level security;
alter table public.holidays         enable row level security;
alter table public.schedules        enable row level security;
alter table public.attendance       enable row level security;
alter table public.time_requests    enable row level security;
alter table public.payroll_runs     enable row level security;
alter table public.payroll_lines    enable row level security;

create policy employees_owner on public.employees for all using (public.is_owner()) with check (public.is_owner());
create policy employees_self  on public.employees for select using (profile_id = auth.uid());
create policy settings_owner  on public.payroll_settings for all using (public.is_owner()) with check (public.is_owner());
create policy holidays_owner  on public.holidays for all using (public.is_owner()) with check (public.is_owner());
create policy holidays_read   on public.holidays for select using (auth.uid() is not null);
create policy schedules_owner on public.schedules for select using (public.is_owner());
create policy schedules_self  on public.schedules for select using (employee_id = public.my_employee_id());
create policy attendance_owner on public.attendance for select using (public.is_owner());
create policy attendance_self  on public.attendance for select using (employee_id = public.my_employee_id());
create policy requests_owner on public.time_requests for select using (public.is_owner());
create policy requests_self  on public.time_requests for select using (employee_id = public.my_employee_id());
create policy runs_owner  on public.payroll_runs for select using (public.is_owner());
create policy lines_owner on public.payroll_lines for select using (public.is_owner());

-- Fotos de asistencia: cualquier usuario con perfil activo sube a su carpeta.
drop policy if exists evidencias_subir on storage.objects;
create policy evidencias_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = auth.uid()::text and public.auth_role() is not null);

-- ───────── Privilegios ─────────
revoke all on public.employees, public.payroll_settings, public.holidays, public.schedules, public.attendance,
  public.time_requests, public.payroll_runs, public.payroll_lines from anon, authenticated;
grant select on public.employees, public.payroll_settings, public.holidays, public.schedules, public.attendance,
  public.time_requests, public.payroll_runs, public.payroll_lines to authenticated;
grant insert, update on public.employees, public.payroll_settings to authenticated;
grant insert, update, delete on public.holidays to authenticated;
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.clock_in(text), public.clock_out(text), public.create_request(text, date, text),
  public.my_payroll_estimate(date, date), public.my_payslips(), public.set_schedule(bigint, date, time, time),
  public.decide_request(bigint, boolean, text), public.compute_payroll(date, date), public.pay_payroll(bigint),
  public.my_employee_id(), public.bogota_today() to authenticated;
revoke execute on function public.shift_hours(timestamptz, timestamptz), public.payroll_calc(bigint, date, date), public.payroll_locked() from public, anon, authenticated;
grant execute on function public.track_delivery(uuid) to anon;
