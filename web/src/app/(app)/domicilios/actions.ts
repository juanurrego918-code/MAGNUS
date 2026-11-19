'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export async function asignar(form: FormData) {
  await requireSession('/domicilios');
  const d = Number(form.get('delivery'));
  const driver = String(form.get('driver') ?? '');
  const seq = form.get('seq') ? Number(form.get('seq')) : null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!Number.isInteger(d) || d <= 0 || (driver && !uuid.test(driver)) || (seq !== null && (!Number.isInteger(seq) || seq <= 0))) {
    redirect('/domicilios?err=' + encodeURIComponent('Revise el conductor y el orden de la ruta.'));
  }
  const r = await callRpc('assign_delivery', { p_delivery: d, p_driver: driver || null, p_seq: seq });
  redirect('/domicilios?' + (r.error ? `err=${encodeURIComponent(r.error)}` : 'ok=Asignación guardada'));
}
