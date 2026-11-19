'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

const back = (r: { error?: string }, ok: string): never => redirect('/inventario?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));

export async function recibir(form: FormData) {
  await requireSession('/inventario');
  const product = Number(form.get('product')), units = Number(form.get('units')), wh = Number(form.get('warehouse') ?? 1);
  const lot = String(form.get('lot') ?? '').trim().toUpperCase(), exp = String(form.get('expires') ?? '');
  if (!Number.isInteger(product) || product <= 0 || !Number.isInteger(units) || units <= 0 || units > 1_000_000 || !Number.isInteger(wh) || wh <= 0) back({ error: 'Revise producto, unidades y bodega.' }, '');
  if (!/^L-\d{5}$/.test(lot)) back({ error: 'El lote debe tener el formato L-00000.' }, '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(exp)) back({ error: 'Escriba la fecha de vencimiento.' }, '');
  back(await callRpc('receive_lot', { p_product: product, p_lot: lot, p_expires: exp, p_units: units, p_warehouse: wh }), 'Recepción registrada.');
}

export async function ajustar(form: FormData) {
  await requireSession('/inventario');
  const lot = Number(form.get('lot')), delta = Number(form.get('delta'));
  if (form.get('confirm') !== 'on') back({ error: 'Marque la confirmación del ajuste.' }, '');
  if (!Number.isInteger(lot) || lot <= 0 || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1_000_000) back({ error: 'Revise el lote y las unidades (use un número negativo para merma).' }, '');
  back(await callRpc('adjust_inventory', { p_lot: lot, p_delta: delta, p_reason: String(form.get('reason') ?? '') }), 'Ajuste aplicado. Quedó en el historial.');
}
