'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

const back = (r: { error?: string }, ok: string): never => redirect('/cotizaciones?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));

export async function cotizar(form: FormData) {
  await requireSession('/cotizaciones');
  const client = Number(form.get('client'));
  const days = Number(form.get('days') ?? 7);
  const lines: { presentation_id: number; qty: number }[] = [];
  for (const [k, v] of form.entries()) {
    const m = /^qty_(\d+)$/.exec(k); const qty = Number(v);
    if (m && Number.isInteger(qty) && qty > 0 && qty <= 100000) lines.push({ presentation_id: Number(m[1]), qty });
  }
  if (!Number.isInteger(client) || client <= 0) back({ error: 'Elija un cliente.' }, '');
  if (!lines.length) back({ error: 'Agregue al menos un producto con cantidad.' }, '');
  back(await callRpc('create_quote', { p_client: client, p_lines: lines, p_valid_days: Number.isInteger(days) ? days : 7 }), 'Cotización creada.');
}

export async function convertir(form: FormData) {
  await requireSession('/cotizaciones');
  const id = Number(form.get('quote'));
  if (!Number.isInteger(id) || id <= 0) back({ error: 'Cotización no válida.' }, '');
  const dom = form.get('delivery') === 'domicilio';
  back(await callRpc('convert_quote', {
    p_quote: id, p_delivery_type: dom ? 'domicilio' : 'recoge', p_addr: dom ? String(form.get('addr') ?? '').slice(0, 200) : null,
    p_window: dom ? String(form.get('window')) : null, p_pay_method: String(form.get('pay') ?? 'contado'),
  }), 'Convertida en pedido y enviada a bodega.');
}
