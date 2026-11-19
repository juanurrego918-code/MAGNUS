'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export async function iniciarTurno(form: FormData) {
  const s = await requireSession('/turno');
  const photo = String(form.get('photo') ?? '');
  const r = await callRpc('start_shift', { p_photo_path: photo });
  redirect('/turno' + (r.error ? `?err=${encodeURIComponent(r.error)}` : '?ok=Turno iniciado'));
  void s;
}

export async function terminarTurno() {
  await requireSession('/turno');
  const r = await callRpc<number>('end_shift', {});
  redirect('/turno' + (r.error ? `?err=${encodeURIComponent(r.error)}` : `?ok=${encodeURIComponent('Turno terminado. Efectivo a entregar en caja: $ ' + Math.round(Number(r.data ?? 0)).toLocaleString('es-CO'))}`));
}

export async function reportarUbicacion(lat: number, lng: number) {
  await requireSession('/turno');
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  await callRpc('report_location', { p_lat: lat, p_lng: lng });
}
