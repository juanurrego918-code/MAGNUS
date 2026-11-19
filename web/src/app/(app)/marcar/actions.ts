'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export async function marcarEntrada(form: FormData) {
  await requireSession('/marcar');
  const r = await callRpc('clock_in', { p_photo: String(form.get('photo') ?? '') });
  redirect('/marcar?' + (r.error ? `err=${encodeURIComponent(r.error)}` : 'ok=Entrada registrada'));
}
export async function marcarSalida(form: FormData) {
  await requireSession('/marcar');
  const r = await callRpc<{ hours_ord: number; hours_ext: number; hours_night: number; hours_fest: number }[]>('clock_out', { p_photo: String(form.get('photo') ?? '') });
  if (r.error) redirect('/marcar?err=' + encodeURIComponent(r.error));
  const h = r.data?.[0];
  redirect('/marcar?ok=' + encodeURIComponent(h ? `Salida registrada · ${h.hours_ord} h ordinarias, ${h.hours_ext} extra, ${h.hours_night} nocturnas, ${h.hours_fest} dominicales/festivas` : 'Salida registrada'));
}
