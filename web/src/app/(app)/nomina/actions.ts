'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

const back = (r: { error?: string }, ok: string): never => redirect('/nomina?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));
const day = /^\d{4}-\d{2}-\d{2}$/;

export async function calcular(form: FormData) {
  await requireSession('/nomina');
  const start = String(form.get('start')), end = String(form.get('end'));
  if (!day.test(start) || !day.test(end)) back({ error: 'Período no válido.' }, '');
  back(await callRpc('compute_payroll', { p_start: start, p_end: end }), 'Prenómina calculada.');
}

export async function pagar(form: FormData) {
  await requireSession('/nomina');
  const run = Number(form.get('run'));
  if (form.get('confirm') !== 'on') back({ error: 'Marque la confirmación para pagar.' }, '');
  if (!Number.isInteger(run) || run <= 0) back({ error: 'Nómina no válida.' }, '');
  back(await callRpc('pay_payroll', { p_run: run }), 'Nómina pagada y bloqueada. Quedó en el historial.');
}
