import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, num } from '@/lib/format';
import { hoyBogota } from '@/lib/quincena';

type Tipo = 'producto' | 'cliente' | 'vendedor' | 'reponer';
const TABS: [Tipo, string][] = [['producto', 'Por producto'], ['cliente', 'Por cliente'], ['vendedor', 'Por vendedor'], ['reponer', 'Qué reponer']];

export default async function Reportes({ searchParams }: { searchParams: Promise<{ tipo?: string; desde?: string; hasta?: string }> }) {
  await requireSession('/reportes');
  const sp = await searchParams;
  const hoy = hoyBogota();
  const tipo = (TABS.find(([k]) => k === sp.tipo)?.[0] ?? 'producto') as Tipo;
  const ok = (d?: string) => (d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : undefined);
  const hasta = ok(sp.hasta) ?? hoy, desde = ok(sp.desde) ?? hoy.slice(0, 8) + '01';
  const sb = await supabaseServer();
  const fn = { producto: 'report_by_product', cliente: 'report_by_client', vendedor: 'report_by_seller', reponer: 'report_reorder' }[tipo];
  const { data, error } = tipo === 'reponer' ? await sb.rpc(fn) : await sb.rpc(fn, { p_from: desde, p_to: hasta });
  const rows = (data ?? []) as Record<string, string | number | null>[];
  const sum = (k: string) => rows.reduce((a, r) => a + Number(r[k] ?? 0), 0);
  return (<>
    <h1>Reportes</h1>
    <p className="sub">Ventas facturadas (los pedidos anulados no cuentan). Los descuentos por volumen ya están aplicados.</p>
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }} aria-label="Tipo de reporte">
      {TABS.map(([k, l]) => <a key={k} className="btn" style={k === tipo ? { background: 'var(--ink)', color: 'var(--bg)' } : undefined} href={`/reportes?tipo=${k}&desde=${desde}&hasta=${hasta}`}>{l}</a>)}
    </nav>
    {tipo !== 'reponer' && (
      <form className="filters"><input type="hidden" name="tipo" value={tipo} />
        <label>Desde <input type="date" name="desde" defaultValue={desde} /></label><label>Hasta <input type="date" name="hasta" defaultValue={hasta} /></label>
        <button className="btn">Ver</button>
        <a className="btn" href={`/api/export/ventas?tipo=${tipo}&desde=${desde}&hasta=${hasta}`}>Exportar CSV</a></form>)}
    {error && <div className="err-msg" role="alert">No se pudo generar el reporte.</div>}
    {tipo === 'producto' && <div className="kpis"><div className="card kpi"><div className="k">Ingresos</div><div className="v">{cop(sum('revenue'))}</div></div><div className="card kpi"><div className="k">Margen</div><div className="v">{cop(sum('margin'))}</div></div><div className="card kpi"><div className="k">Unidades</div><div className="v">{num(sum('units'))}</div></div></div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      {tipo === 'producto' && <><thead><tr><th>Producto</th><th className="num">Unidades</th><th className="num">Ingresos</th><th className="num">Costo</th><th className="num">Margen</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="empty">Sin ventas en este período.</td></tr>}
        {rows.map((r) => <tr key={String(r.code)}><td><b>{r.name}</b><div className="muted">{r.code}</div></td><td className="num">{num(Number(r.units))}</td><td className="num">{cop(Number(r.revenue))}</td><td className="num">{cop(Number(r.cost))}</td><td className="num">{cop(Number(r.margin))}</td></tr>)}</tbody></>}
      {tipo === 'cliente' && <><thead><tr><th>Cliente</th><th className="num">Pedidos</th><th className="num">Ventas</th><th>Último pedido</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={4} className="empty">Sin ventas en este período.</td></tr>}
        {rows.map((r) => <tr key={String(r.client)}><td><b>{r.client}</b></td><td className="num">{num(Number(r.orders))}</td><td className="num">{cop(Number(r.revenue))}</td><td>{String(r.last_order ?? '')}</td></tr>)}</tbody></>}
      {tipo === 'vendedor' && <><thead><tr><th>Vendedor</th><th className="num">Pedidos</th><th className="num">Ventas</th><th className="num">Comisión 2 %</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={4} className="empty">Sin ventas en este período.</td></tr>}
        {rows.map((r) => <tr key={String(r.seller)}><td><b>{r.seller}</b></td><td className="num">{num(Number(r.orders))}</td><td className="num">{cop(Number(r.revenue))}</td><td className="num">{cop(Number(r.commission))}</td></tr>)}</tbody></>}
      {tipo === 'reponer' && <><thead><tr><th>Producto</th><th className="num">Existencias</th><th className="num">Mínimo</th><th className="num">Vendido 30 días</th><th className="num">Alcanza para</th></tr></thead><tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="empty">Nada por reponer por ahora.</td></tr>}
        {rows.map((r) => <tr key={String(r.code)}><td><b>{r.name}</b><div className="muted">{r.code}</div></td><td className="num">{num(Number(r.stock))}</td><td className="num">{num(Number(r.min_units))}</td><td className="num">{num(Number(r.sold_30d))}</td><td className="num">{r.days_left == null ? '—' : `${r.days_left} días`}</td></tr>)}</tbody></>}
    </table></div>
  </>);
}
