'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export async function guardarProducto(form: FormData) {
  const s = await requireSession('/catalogo');
  const id = Number(form.get('id'));
  const back = (q: string): never => redirect(`/catalogo/${id}?${q}`);
  if (s.role !== 'dueno' || !Number.isInteger(id) || id <= 0) back('err=' + encodeURIComponent('Sin permiso.'));
  const min = Number(form.get('min_units')), cost = Number(String(form.get('cost') ?? '').replace(/[.\s$]/g, '') || 0);
  const prices: { id: number; price: number }[] = [];
  for (const [k, v] of form.entries()) {
    const m = /^price_(\d+)$/.exec(k); const price = Number(String(v).replace(/[.\s$]/g, ''));
    if (m && Number.isFinite(price) && price >= 0) prices.push({ id: Number(m[1]), price });
  }
  if (!Number.isInteger(min) || min < 0 || !Number.isFinite(cost) || cost < 0) back('err=' + encodeURIComponent('Revise el mínimo y el costo.'));
  const r = await callRpc('update_product', { p_id: id, p_min: min, p_cost: cost || null, p_active: form.get('active') === 'on', p_photo: String(form.get('photo') ?? ''), p_prices: prices });
  back(r.error ? 'err=' + encodeURIComponent(r.error) : 'ok=' + encodeURIComponent('Producto guardado.'));
}
