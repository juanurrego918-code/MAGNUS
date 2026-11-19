import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { diasHasta, fecha, num } from '@/lib/format';
import { Chip } from '@/components/Chip';

type Lot = { id: number; lot_code: string; expires_on: string; qty_units: number; products: { code: string; name: string } | null; warehouses: { name: string } | null };

export default async function Inventario() {
  await requireSession('/inventario');
  const sb = await supabaseServer();
  const { data, error } = await sb.from('lots')
    .select('id, lot_code, expires_on, qty_units, products(code, name), warehouses(name)')
    .gt('qty_units', 0).order('expires_on').limit(500);
  const lots = (data ?? []) as unknown as Lot[];
  return (<>
    <h1>Inventario por lotes</h1>
    <p className="sub">Primero vence, primero sale. Los lotes están ordenados por fecha de vencimiento.</p>
    {error && <div className="err-msg" role="alert">No se pudo cargar el inventario. Intente de nuevo.</div>}
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
  </>);
}
