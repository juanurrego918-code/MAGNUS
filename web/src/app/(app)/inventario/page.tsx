import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { diasHasta, fecha, num } from '@/lib/format';
import { Chip } from '@/components/Chip';
import { ajustar, recibir } from './actions';

type Lot = { id: number; lot_code: string; expires_on: string; qty_units: number; products: { code: string; name: string } | null; warehouses: { name: string } | null };
const inp = { minHeight: 56, border: '1px solid var(--line-2)', borderRadius: 10, padding: '0 12px' } as const;

export default async function Inventario({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/inventario');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [lotsQ, prodsQ, whQ] = await Promise.all([
    sb.from('lots').select('id, lot_code, expires_on, qty_units, products(code, name), warehouses(name)').gt('qty_units', 0).order('expires_on').limit(500),
    sb.from('products').select('id, name, code').eq('active', true).order('name').limit(500),
    sb.from('warehouses').select('id, name').order('name'),
  ]);
  const lots = (lotsQ.data ?? []) as unknown as Lot[];
  return (<>
    <h1>Inventario por lotes</h1>
    <p className="sub">Primero vence, primero sale. Los lotes están ordenados por fecha de vencimiento.</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {(sp.err || lotsQ.error) && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err ?? 'No se pudo cargar el inventario. Intente de nuevo.'}</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead><tr><th>Producto</th><th>Lote</th><th>Bodega</th><th>Vence</th><th className="num">Unidades</th><th>Estado</th></tr></thead>
        <tbody>
          {lots.length === 0 && <tr><td colSpan={6} className="empty">No hay lotes con existencias.</td></tr>}
          {lots.map((l) => {
            const d = diasHasta(l.expires_on);
            return (
              <tr key={l.id}>
                <td><b>{l.products?.name}</b><div className="muted">{l.products?.code}</div></td>
                <td>{l.lot_code}</td><td>{l.warehouses?.name}</td>
                <td>{fecha(l.expires_on)} <span className="muted">({d < 0 ? 'vencido' : `en ${d} días`})</span></td>
                <td className="num">{num(l.qty_units)}</td>
                <td>{d < 0 ? <Chip kind="agotado" label="Vencido" /> : d <= 30 ? <Chip kind="vence" /> : <Chip kind="ok" />}</td>
              </tr>);
          })}
        </tbody>
      </table>
    </div>
    <h2 className="sec">Recibir mercancía</h2>
    <form action={recibir} className="card" style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
      <select name="product" required defaultValue="" aria-label="Producto" style={inp}><option value="" disabled>Producto</option>{(prodsQ.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.code}</option>)}</select>
      <input name="units" type="number" min={1} required placeholder="Unidades recibidas" aria-label="Unidades" style={inp} />
      <input name="lot" required placeholder="Lote (L-00000)" pattern="L-[0-9]{5}" aria-label="Lote" style={inp} />
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>Vencimiento<input name="expires" type="date" required style={inp} /></label>
      <select name="warehouse" aria-label="Bodega" style={inp}>{(whQ.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select>
      <button className="btn primary" style={{ minHeight: 60 }}>Registrar recepción</button>
    </form>
    <h2 className="sec">Ajuste o merma</h2>
    <form action={ajustar} className="card" style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
      <select name="lot" required defaultValue="" aria-label="Lote" style={inp}><option value="" disabled>Lote</option>{lots.map((l) => <option key={l.id} value={l.id}>{l.products?.name} · {l.lot_code} ({num(l.qty_units)} und)</option>)}</select>
      <input name="delta" type="number" required placeholder="Unidades (negativo = merma)" aria-label="Unidades" style={inp} />
      <select name="reason" required defaultValue="" aria-label="Motivo" style={inp}><option value="" disabled>Motivo</option><option>Empaque roto</option><option>Producto vencido</option><option>Daño en transporte</option><option>Error de conteo</option></select>
      <label style={{ display: 'flex', gap: 10 }}><input type="checkbox" name="confirm" required style={{ width: 22, height: 22 }} /><span>Confirmo el ajuste. Quedará en el historial con mi nombre.</span></label>
      <button className="btn" style={{ minHeight: 60 }}>Aplicar ajuste</button>
    </form>
  </>);
}
