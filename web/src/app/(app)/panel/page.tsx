import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, diasHasta, fecha, num } from '@/lib/format';
import { Chip } from '@/components/Chip';

type Lot = { id: number; lot_code: string; expires_on: string; qty_units: number; product_id: number; products: { name: string } | null };

export default async function Panel() {
  await requireSession('/panel');
  const sb = await supabaseServer();
  const limit = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const [stock, lotsQ, costs, clients, logs, prods] = await Promise.all([
    sb.from('product_stock').select('product_id, stock, status'),
    sb.from('lots').select('id, lot_code, expires_on, qty_units, product_id, products(name)').gt('qty_units', 0).lte('expires_on', limit).order('expires_on'),
    sb.from('product_costs').select('product_id, cost'),
    sb.from('clients').select('id', { count: 'exact', head: true }).eq('active', true),
    sb.from('audit_log').select('id, who, action, detail, created_at').order('id', { ascending: false }).limit(6),
    sb.from('products').select('id, name').eq('active', true),
  ]);
  const st = stock.data ?? [];
  const critical = st.filter((r) => r.status === 'agotado' || r.status === 'bajo');
  const names = new Map((prods.data ?? []).map((p) => [p.id as number, p.name as string]));
  const cost = new Map((costs.data ?? []).map((c) => [c.product_id as number, Number(c.cost)]));
  const lots = (lotsQ.data ?? []) as unknown as Lot[];
  const atRisk = lots.reduce((a, l) => a + l.qty_units * (cost.get(l.product_id) ?? 0), 0);

  return (<>
    <h1>Panel general</h1>
    <p className="sub">Lo que necesita atención hoy.</p>
    <div className="kpis">
      <div className="card kpi"><div className="k">Productos activos</div><div className="v">{num(prods.data?.length)}</div></div>
      <div className="card kpi"><div className="k">Stock crítico</div><div className="v">{num(critical.length)}</div></div>
      <div className="card kpi"><div className="k">Lotes por vencer (30 días)</div><div className="v">{num(lots.length)}</div><div className="muted">Valor a costo: {cop(atRisk)}</div></div>
      <div className="card kpi"><div className="k">Clientes activos</div><div className="v">{num(clients.count)}</div></div>
    </div>
    <h2 className="sec">Stock crítico</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {critical.length === 0 && <tr><td className="empty">Todo el stock está por encima del mínimo.</td></tr>}
      {critical.sort((a, b) => (a.status === 'agotado' ? -1 : 1) - (b.status === 'agotado' ? -1 : 1)).map((r) => (
        <tr key={r.product_id}><td><b>{names.get(r.product_id)}</b></td><td className="num">{num(r.stock)} und</td><td><Chip kind={r.status as 'agotado' | 'bajo'} /></td></tr>))}
    </tbody></table></div>
    <h2 className="sec">Lotes por vencer</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {lots.length === 0 && <tr><td className="empty">No hay lotes por vencer en los próximos 30 días.</td></tr>}
      {lots.map((l) => (
        <tr key={l.id}><td><b>{l.products?.name}</b><div className="muted">Lote {l.lot_code}</div></td>
          <td>{fecha(l.expires_on)} <span className="muted">({diasHasta(l.expires_on)} días)</span></td>
          <td className="num">{num(l.qty_units)} und</td><td><Chip kind="vence" /></td></tr>))}
    </tbody></table></div>
    <h2 className="sec">Quién hizo qué</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {(logs.data ?? []).length === 0 && <tr><td className="empty">Aún no hay movimientos registrados.</td></tr>}
      {(logs.data ?? []).map((r) => <tr key={r.id}><td><b>{r.who}</b></td><td>{r.action}: {r.detail}</td>
        <td className="muted">{new Date(r.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour12: false })}</td></tr>)}
    </tbody></table></div>
  </>);
}
