'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

type State = { error?: string } | undefined;

export async function crearPedido(_: State, form: FormData): Promise<State> {
  await requireSession('/pedidos');
  const client = Number(form.get('client'));
  const lines: { presentation_id: number; qty: number }[] = [];
  for (const [k, v] of form.entries()) {
    const m = /^qty_(\d+)$/.exec(k);
    const qty = Number(v);
    if (m && Number.isInteger(qty) && qty > 0 && qty <= 100000) lines.push({ presentation_id: Number(m[1]), qty });
  }
  if (!Number.isInteger(client) || client <= 0) return { error: 'Elija un cliente.' };
  if (lines.length === 0) return { error: 'Agregue al menos un producto con cantidad.' };
  const delivery = String(form.get('delivery'));
  const r = await callRpc('create_order', {
    p_client: client, p_lines: lines, p_delivery_type: delivery === 'domicilio' ? 'domicilio' : 'recoge',
    p_addr: String(form.get('addr') ?? '').slice(0, 200), p_window: delivery === 'domicilio' ? String(form.get('window')) : null,
    p_pay_method: String(form.get('pay')), p_note: String(form.get('note') ?? '').slice(0, 300), p_channel: 'vendedor',
  });
  if (r.error) return { error: r.error };
  redirect('/pedidos');
}
