import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha } from '@/lib/format';
import { cotizar, convertir } from './actions';

type Q = { id: number; code: string; status: string; valid_until: string; total: number; clients: { name: string } | null };
const inp = { minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px' } as const;

export default async function Cotizaciones({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/cotizaciones');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [qs, clients, prods] = await Promise.all([
    sb.from('quotes').select('id, code, status, valid_until, total, clients(name)').order('id', { ascending: false }).limit(60),
    sb.from('clients').select('id, name').eq('active', true).order('name'),
    sb.from('products').select('id, name, code, presentations(id, name)').eq('active', true).order('name').limit(300),
  ]);
  const rows = (qs.data ?? []) as unknown as Q[];
  const hoy = new Date().toISOString().slice(0, 10);
  return (<>
    <h1>Cotizaciones</h1>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Cotización</th><th>Cliente</th><th>Vigencia</th><th className="num">Total</th><th>Acción</th></tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="empty">Aún no hay cotizaciones.</td></tr>}
        {rows.map((q) => { const vencida = q.valid_until < hoy; return (
          <tr key={q.id}><td><b>{q.code}</b></td><td>{q.clients?.name}</td>
            <td>{fecha(q.valid_until)} {q.status === 'abierta' && vencida && <span className="chip err">✕ Vencida</span>}</td><td className="num">{cop(q.total)}</td>
            <td>{q.status === 'convertida' ? <span className="chip ok">✓ Convertida</span> : vencida ? '—' : (
              <form action={convertir} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><input type="hidden" name="quote" value={q.id} />
                <select name="delivery" aria-label="Entrega" style={inp}><option value="recoge">Recoge</option><option value="domicilio">Domicilio</option></select>
                <input name="addr" placeholder="Dirección (si es domicilio)" aria-label="Dirección" style={inp} maxLength={200} />
                <select name="window" aria-label="Ventana" style={inp}><option>08:00–11:00</option><option>11:00–14:00</option><option>14:00–17:00</option></select>
                <select name="pay" aria-label="Pago" style={inp}><option value="contado">Contado</option><option value="credito">Crédito</option><option value="contra_entrega">Contra entrega</option></select>
                <button className="btn primary">Convertir en pedido</button></form>)}</td></tr>); })}
      </tbody></table></div>
    <h2 className="sec">Nueva cotización</h2>
    <form action={cotizar} style={{ display: 'grid', gap: 12 }}>
      <div className="filters">
        <select name="client" required defaultValue="" aria-label="Cliente" style={inp}><option value="" disabled>Cliente</option>{(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label>Vigencia (días) <input name="days" type="number" min={1} max={60} defaultValue={7} style={{ ...inp, width: 80 }} /></label>
      </div>
      <div className="card" style={{ padding: 0, overflowX: 'auto', maxHeight: 420 }}><table>
        <thead><tr><th>Producto</th><th>Presentación</th><th className="num">Cantidad</th></tr></thead>
        <tbody>{(prods.data ?? []).flatMap((p) => (p.presentations as { id: number; name: string }[]).map((pr, i) => (
          <tr key={pr.id}><td>{i === 0 && <><b>{p.name}</b><div className="muted">{p.code}</div></>}</td><td>{pr.name}</td>
            <td className="num"><input name={`qty_${pr.id}`} type="number" min={0} max={100000} aria-label={`Cantidad de ${p.name} ${pr.name}`} style={{ ...inp, width: 90, textAlign: 'right' }} /></td></tr>)))}</tbody></table></div>
      <div><button className="btn primary">Crear cotización</button></div>
    </form>
  </>);
}
