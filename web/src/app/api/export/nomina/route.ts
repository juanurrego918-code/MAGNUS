import { NextResponse } from 'next/server';
import { isOwnerRequest } from '@/lib/session-owner';
import { supabaseServer } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';

/** Nómina para el contador: una fila por empleado de la quincena indicada. */
export async function GET(req: Request) {
  if (!(await isOwnerRequest())) return new NextResponse('Sin permiso', { status: 403 });
  const run = Number(new URL(req.url).searchParams.get('run'));
  if (!Number.isInteger(run) || run <= 0) return new NextResponse('Nómina no válida', { status: 400 });
  const sb = await supabaseServer();
  const { data: r } = await sb.from('payroll_runs').select('period_start, period_end, status').eq('id', run).maybeSingle();
  if (!r) return new NextResponse('No existe', { status: 404 });
  const { data } = await sb.from('payroll_lines').select('base_salary, absent_days, hours_ord, hours_ext, hours_night, hours_fest, basic, ext_pay, night_pay, fest_pay, transport, gross, health, pension, net, employees(full_name)').eq('run_id', run).order('employee_id');
  const head = ['Empleado', 'Salario base', 'Días sin marcar', 'Horas ordinarias', 'Horas extra', 'Horas nocturnas', 'Horas dominicales/festivas', 'Básico quincenal', 'Extras', 'Recargo nocturno', 'Dominicales/festivos', 'Auxilio transporte', 'Devengado', 'Salud', 'Pensión', 'Neto'];
  const rows = ((data ?? []) as unknown as { employees: { full_name: string } | null; [k: string]: unknown }[]).map((l) => [l.employees?.full_name ?? '', l.base_salary, l.absent_days, l.hours_ord, l.hours_ext, l.hours_night, l.hours_fest, l.basic, l.ext_pay, l.night_pay, l.fest_pay, l.transport, l.gross, l.health, l.pension, l.net] as (string | number)[]);
  return new NextResponse(toCsv([head, ...rows]), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="nomina-${r.period_start}_${r.period_end}${r.status === 'pagada' ? '' : '-prenomina'}.csv"`, 'Cache-Control': 'no-store' } });
}
