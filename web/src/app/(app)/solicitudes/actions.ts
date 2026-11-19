'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export async function pedir(form: FormData) {
  await requireSession('/solicitudes');
  const date = String(form.get('date') ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/solicitudes?err=' + encodeURIComponent('Elija una fecha válida.'));
  const r = await callRpc('create_request', { p_type: String(form.get('type')), p_for_date: date, p_detail: String(form.get('detail') ?? '').slice(0, 300) });
  redirect('/solicitudes?' + (r.error ? `err=${encodeURIComponent(r.error)}` : 'ok=Solicitud enviada a administración'));
}
