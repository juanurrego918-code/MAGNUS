'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';
import { supabaseServer } from '@/lib/supabase/server';

const back = (r: { error?: string }, ok: string): never => redirect('/equipo?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function decidir(form: FormData) {
  await requireSession('/equipo');
  const id = Number(form.get('request'));
  if (!Number.isInteger(id) || id <= 0) back({ error: 'Solicitud no válida.' }, '');
  const approve = form.get('decision') === 'aprobar';
  back(await callRpc('decide_request', { p_request: id, p_approve: approve }), approve ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
}

export async function programar(form: FormData) {
  await requireSession('/equipo');
  const emp = Number(form.get('employee')); const date = String(form.get('date') ?? '');
  const t = /^\d{2}:\d{2}$/;
  const start = String(form.get('start') ?? ''), end = String(form.get('end') ?? '');
  if (!Number.isInteger(emp) || emp <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !t.test(start) || !t.test(end)) back({ error: 'Revise empleado, fecha y horas.' }, '');
  back(await callRpc('set_schedule', { p_emp: emp, p_date: date, p_start: start, p_end: end }), 'Turno guardado.');
}

export async function crearEmpleado(form: FormData) {
  await requireSession('/equipo');
  const name = String(form.get('name') ?? '').trim(); const position = String(form.get('position') ?? '').trim();
  const area = String(form.get('area') ?? ''); const salary = Number(String(form.get('salary') ?? '').replace(/[.\s$]/g, ''));
  const profile = String(form.get('profile') ?? '');
  if (name.length < 3 || position.length < 2 || !Number.isFinite(salary) || salary <= 0 || (profile && !uuid.test(profile))) back({ error: 'Revise nombre, cargo y salario.' }, '');
  const sb = await supabaseServer();
  const { error } = await sb.from('employees').insert({ full_name: name, position, area, base_salary: salary, profile_id: profile || null });
  back({ error: error ? 'No se pudo crear el empleado. Revise los datos (el usuario no puede estar en dos fichas).' : undefined }, 'Empleado creado.');
}
