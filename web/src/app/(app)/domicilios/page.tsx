import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { STATUS } from '@/lib/delivery';
import { cop } from '@/lib/format';
import { asignar } from './actions';

type D = {
  id: number; seq: number | null; status: string; driver_id: string | null; tracking_token: string; cod_amount: number;
  novelty_reason: string | null; novelty_detail: string | null;
  orders: { code: string; delivery_addr: string | null; delivery_window: string | null; clients: { name: string } | null } | null;
};

export default async function Domicilios({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/domicilios');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [dQ, driversQ, shiftsQ, locQ] = await Promise.all([
    sb.from('deliveries').select('id, seq, status, driver_id, tracking_token, cod_amount, novelty_reason, novelty_detail, orders(code, delivery_addr, delivery_window, clients(name))').order('id', { ascending: false }).limit(150),
    sb.from('profiles').select('id, full_name').eq('role', 'conductor').eq('active', true).order('full_name'),
    sb.from('driver_shifts').select('driver_id').is('ended_at', null),
    sb.from('driver_locations').select('driver_id, lat, lng, recorded_at').order('recorded_at', { ascending: false }).limit(200),
  ]);
  const rows = (dQ.data ?? []) as unknown as D[];
  const drivers = driversQ.data ?? [];
  const onShift = new Set((shiftsQ.data ?? []).map((s) => s.driver_id));
  const lastLoc = new Map<string, { lat: number; lng: number; recorded_at: string }>();
  for (const l of locQ.data ?? []) if (!lastLoc.has(l.driver_id)) lastLoc.set(l.driver_id, l);
  const unassigned = rows.filter((r) => !r.driver_id && r.status !== 'entregado').length;
  return (<>
    <h1>Domicilios</h1>
    <p className="sub">{unassigned > 0 ? `${unassigned} sin conductor asignado.` : 'Todos los domicilios tienen conductor.'}</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Pedido</th><th>Cliente y destino</th><th>Estado</th><th>Conductor y orden</th><th>Seguimiento</th></tr></thead>
      <tbody>
        {rows.length === 0 && <tr><td colSpan={5} className="empty">No hay domicilios todavía.</td></tr>}
        {rows.map((r) => { const [tone, label] = STATUS[r.status] ?? ['mute', r.status]; const locked = r.status === 'en_ruta' || r.status === 'entregado'; return (
          <tr key={r.id} style={!r.driver_id && !locked ? { background: 'var(--warn-tint)' } : undefined}>
            <td><b>{r.orders?.code}</b>{r.cod_amount > 0 && <div className="muted">Cobra {cop(r.cod_amount)}</div>}</td>
            <td><b>{r.orders?.clients?.name ?? 'Mostrador'}</b><div className="muted">{r.orders?.delivery_addr} · {r.orders?.delivery_window}</div></td>
            <td><span className={`chip ${tone}`}>{label}</span>{r.novelty_reason && <div className="muted">{r.novelty_reason}{r.novelty_detail ? `: ${r.novelty_detail}` : ''}</div>}</td>
            <td>{locked ? (drivers.find((d) => d.id === r.driver_id)?.full_name ?? '—') : (
              <form action={asignar} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="delivery" value={r.id} />
                <select name="driver" defaultValue={r.driver_id ?? ''} aria-label="Conductor" style={{ minHeight: 44 }}>
                  <option value="">Sin asignar</option>
                  {drivers.map((d) => <option key={d.id} value={d.id} disabled={!onShift.has(d.id)}>{d.full_name}{onShift.has(d.id) ? '' : ' (sin turno)'}</option>)}
                </select>
                <input name="seq" type="number" min={1} defaultValue={r.seq ?? ''} placeholder="Orden" aria-label="Orden en la ruta" style={{ width: 80, minHeight: 44 }} />
                <button className="btn">Guardar</button></form>)}</td>
            <td><code style={{ fontSize: 12 }}>/seguimiento/{r.tracking_token}</code></td>
          </tr>); })}
      </tbody></table></div>
    <h2 className="sec">Conductores</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Conductor</th><th>Turno</th><th>Última ubicación</th></tr></thead>
      <tbody>
        {drivers.length === 0 && <tr><td colSpan={3} className="empty">No hay conductores registrados.</td></tr>}
        {drivers.map((d) => { const l = lastLoc.get(d.id); return (
          <tr key={d.id}><td><b>{d.full_name}</b></td>
            <td>{onShift.has(d.id) ? <span className="chip ok">✓ En turno</span> : <span className="chip mute">Sin turno</span>}</td>
            <td>{l && onShift.has(d.id) ? <a href={`https://www.google.com/maps/search/?api=1&query=${l.lat},${l.lng}`} target="_blank" rel="noopener noreferrer">Ver en mapa</a> : '—'}{l && onShift.has(d.id) ? <span className="muted"> · {new Date(l.recorded_at).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour12: false, hour: '2-digit', minute: '2-digit' })}</span> : null}</td></tr>); })}
      </tbody></table></div>
  </>);
}
