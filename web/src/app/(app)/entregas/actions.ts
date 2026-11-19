'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

const id = (v: FormDataEntryValue | null) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
function back(delivery: number | null, r: { error?: string }, ok: string): never {
  const base = delivery ? `/entregas/${delivery}` : '/entregas';
  redirect(base + '?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));
}

export async function cargar(form: FormData) {
  await requireSession('/entregas'); const d = id(form.get('delivery'));
  if (!d) back(null, { error: 'Entrega no válida.' }, '');
  back(d, await callRpc('mark_loaded', { p_delivery: d }), 'Marcada como cargada.');
}
export async function salir(form: FormData) {
  await requireSession('/entregas'); const d = id(form.get('delivery'));
  if (!d) back(null, { error: 'Entrega no válida.' }, '');
  back(d, await callRpc('start_route', { p_delivery: d }), 'En ruta.');
}
export async function entregar(form: FormData) {
  await requireSession('/entregas'); const d = id(form.get('delivery'));
  if (!d) back(null, { error: 'Entrega no válida.' }, '');
  const r = await callRpc('complete_delivery', {
    p_delivery: d, p_receiver: String(form.get('receiver') ?? '').slice(0, 80), p_photo_path: String(form.get('photo') ?? ''),
    p_signature_path: null, p_cod_method: form.get('method') ? String(form.get('method')) : null,
  });
  if (r.error) back(d, r, '');
  redirect('/entregas?ok=' + encodeURIComponent('Entrega registrada.'));
}
export async function novedad(form: FormData) {
  await requireSession('/entregas'); const d = id(form.get('delivery'));
  if (!d) back(null, { error: 'Entrega no válida.' }, '');
  const r = await callRpc('report_novelty', { p_delivery: d, p_reason: String(form.get('reason')), p_detail: String(form.get('detail') ?? '').slice(0, 300) });
  if (r.error) back(d, r, '');
  redirect('/entregas?ok=' + encodeURIComponent('Novedad reportada a administración.'));
}
