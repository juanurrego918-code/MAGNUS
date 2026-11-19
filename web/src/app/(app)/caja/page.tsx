import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha } from '@/lib/format';
import { abonar, anular, cerrarCaja, facturar } from './actions';

type O = { id: number; code: string; turno: number | null; total: number; pay_method: string; clients: { name: string } | null };
type R = { invoice_id: number; number: string; total: number; due_on: string; balance: number; status: string; client_id: number | null };
const CHIP: Record<string, [string, string]> = { vencida: ['err', '✕ Vencida'], por_vencer: ['warn', '⏰ Vence pronto'], al_dia: ['ok', '✓ Al día'], pagada: ['ok', '✓ Pagada'] };

export default async function Caja({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/caja');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [ordersQ, recQ, clientsQ] = await Promise.all([
    sb.from('orders').select('id, code, turno, total, pay_method, clients(name)').eq('status', 'alistado').order('id'),
    sb.from('receivables').select('*').gt('balance', 0).order('due_on'),
    sb.from('clients').select('id, name'),
  ]);
  const orders = (ordersQ.data ?? []) as unknown as O[];
  const rec = (recQ.data ?? []) as R[];
  const names = new Map((clientsQ.data ?? []).map((c) => [c.id as number, c.name as string]));
  const sum = (f: (r: R) => boolean) => rec.filter(f).reduce((a, r) => a + Number(r.balance), 0);
  return (<>
    <h1>Cobrar y cartera</h1>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}

    <h2 className="sec">Por cobrar y facturar</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Pedido</th><th>Cliente</th><th className="num">Total</th><th>Facturar con</th></tr></thead>
      <tbody>
        {orders.length === 0 && <tr><td colSpan={4} className="empty">No hay pedidos alistados esperando caja.</td></tr>}
        {orders.map((o) => (
          <tr key={o.id}><td><b>{o.code}</b>{o.turno ? <div className="muted">Turno {o.turno}</div> : null}</td><td>{o.clients?.name ?? 'Mostrador'}</td><td className="num">{cop(o.total)}</td>
            <td><form action={facturar} style={{ display: 'flex', gap: 8 }}><input type="hidden" name="order" value={o.id} />
              <select name="method" defaultValue={o.pay_method === 'credito' ? 'credito' : o.pay_method === 'contra_entrega' ? 'contra_entrega' : 'efectivo'} aria-label="Medio de pago" style={{ minHeight: 44 }}>
                <option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="datafono">Datáfono</option>
                <option value="credito">Crédito</option><option value="contra_entrega">Contra entrega</option></select>
              <button className="btn primary">Facturar y cobrar {cop(o.total)}</button></form></td></tr>))}
      </tbody></table></div>

    <h2 className="sec">Cartera</h2>
    <div className="kpis">
      <div className="card kpi"><div className="k">Total por cobrar</div><div className="v">{cop(sum(() => true))}</div></div>
      <div className="card kpi"><div className="k">Vencida</div><div className="v">{cop(sum((r) => r.status === 'vencida'))}</div></div>
      <div className="card kpi"><div className="k">Vence en 5 días</div><div className="v">{cop(sum((r) => r.status === 'por_vencer'))}</div></div>
    </div>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Factura</th><th>Cliente</th><th>Vence</th><th className="num">Saldo</th><th>Estado</th><th>Abono</th><th>Anular</th></tr></thead>
      <tbody>
        {rec.length === 0 && <tr><td colSpan={7} className="empty">No hay saldos pendientes.</td></tr>}
        {rec.map((r) => { const [tone, label] = CHIP[r.status] ?? ['mute', r.status]; return (
          <tr key={r.invoice_id}><td><b>{r.number}</b></td><td>{r.client_id ? names.get(r.client_id) : 'Mostrador'}</td><td>{fecha(r.due_on)}</td><td className="num">{cop(r.balance)}</td>
            <td><span className={`chip ${tone}`}>{label}</span></td>
            <td><form action={abonar} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="invoice" value={r.invoice_id} />
              <input name="amount" inputMode="numeric" placeholder="Valor" required aria-label="Valor del abono" style={{ width: 110, minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 8px' }} />
              <select name="method" aria-label="Medio" style={{ minHeight: 44 }}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="datafono">Datáfono</option></select>
              <button className="btn">Abonar</button></form></td>
            <td><form action={anular} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="invoice" value={r.invoice_id} />
              <input name="reason" placeholder="Motivo (mín. 5 letras)" required minLength={5} maxLength={200} aria-label="Motivo de anulación" style={{ width: 160, minHeight: 44, border: '1px solid var(--err-line)', borderRadius: 8, padding: '0 8px' }} />
              <button className="btn" style={{ borderColor: 'var(--err-line)', color: 'var(--err)' }}>Anular</button></form></td></tr>); })}
      </tbody></table></div>

    <h2 className="sec">Cuadre de caja</h2>
    <form action={cerrarCaja} className="card" style={{ display: 'grid', gap: 10, maxWidth: 480 }}>
      <label>Base de caja<input name="base" inputMode="numeric" defaultValue="300000" required style={{ width: '100%', minHeight: 44 }} /></label>
      <label>Efectivo contado<input name="counted" inputMode="numeric" required style={{ width: '100%', minHeight: 44 }} /></label>
      <label>Observación (obligatoria si hay diferencia)<input name="notes" maxLength={200} style={{ width: '100%', minHeight: 44 }} /></label>
      <button className="btn primary">Cerrar caja</button>
    </form>
  </>);
}
