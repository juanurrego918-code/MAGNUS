'use server';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

export type Resultado = { error?: string; turno?: number; code?: string; total?: number };

export async function confirmarPedido(lines: { presentation_id: number; qty: number }[]): Promise<Resultado> {
  await requireSession('/mostrador');
  const clean = (Array.isArray(lines) ? lines : []).filter((l) => Number.isInteger(l.presentation_id) && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 1000).slice(0, 100);
  if (!clean.length) return { error: 'Agregue al menos un producto.' };
  const r = await callRpc<{ order_id: number; code: string; turno: number; total: number }[]>('create_order', {
    p_client: null, p_lines: clean, p_delivery_type: 'recoge', p_addr: null, p_window: null, p_pay_method: 'contado', p_note: null, p_channel: 'mostrador',
  });
  if (r.error) return { error: r.error };
  const row = r.data?.[0];
  return row ? { turno: row.turno, code: row.code, total: Number(row.total) } : { error: 'No se pudo crear el pedido.' };
}
