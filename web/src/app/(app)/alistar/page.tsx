import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { callRpc } from '@/lib/rpc';
import { num } from '@/lib/format';

type Q = { order_id: number; code: string; status: string; turno: number | null; client_name: string | null; delivery_type: string; delivery_window: string | null; product: string; presentation: string; qty: number; units: number };

async function alistar(form: FormData) {
  'use server';
  await requireSession('/alistar');
  const id = Number(form.get('order'));
  if (Number.isInteger(id) && id > 0) await callRpc('pick_order', { p_order: id });
  revalidatePath('/alistar');
}

export default async function Alistar() {
  await requireSession('/alistar');
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('warehouse_queue');
  const rows = (data ?? []) as Q[];
  const orders = [...new Map(rows.map((r) => [r.order_id, r])).values()];
  return (<>
    <h1>Pedidos por alistar</h1>
    <p className="sub">Al alistar, el sistema toma primero el lote que vence primero y deja registro de cuál salió.</p>
    {error && <div className="err-msg" role="alert">No se pudo cargar la cola de bodega.</div>}
    {orders.length === 0 && <div className="card empty">No hay pedidos pendientes.</div>}
    <div style={{ display: 'grid', gap: 14 }}>
      {orders.map((o) => (
        <section key={o.order_id} className="card">
          <b>{o.code}</b>{o.turno ? ` · Turno ${o.turno}` : ''} · {o.client_name ?? 'Mostrador'} · {o.delivery_type === 'domicilio' ? `Domicilio ${o.delivery_window}` : 'Recoge en punto'}
          <ul>{rows.filter((r) => r.order_id === o.order_id).map((r, i) => <li key={i}>{r.product} — {num(r.qty)} × {r.presentation} ({num(r.units)} und)</li>)}</ul>
          {o.status === 'nuevo'
            ? <form action={alistar}><input type="hidden" name="order" value={o.order_id} /><button className="btn primary" style={{ minHeight: 56 }}>Alistar pedido (primero vence, primero sale)</button></form>
            : <span className="chip ok">Alistado · pasa a caja</span>}
        </section>))}
    </div>
  </>);
}
