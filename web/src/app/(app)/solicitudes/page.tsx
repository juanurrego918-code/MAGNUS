import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { fecha } from '@/lib/format';
import { hoyBogota } from '@/lib/quincena';
import { pedir } from './actions';

const TONE: Record<string, [string, string]> = { pendiente: ['warn', '⏰ Pendiente'], aprobada: ['ok', '✓ Aprobada'], rechazada: ['err', '✕ Rechazada'] };

export default async function Solicitudes({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/solicitudes');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from('time_requests').select('id, type, for_date, detail, status').order('id', { ascending: false }).limit(30);
  return (<>
    <h1>Mis solicitudes</h1>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <form action={pedir} className="card" style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
      <select name="type" required aria-label="Tipo" style={{ minHeight: 52 }}><option>Permiso</option><option>Cambio de turno</option></select>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>Para el día<input type="date" name="date" required defaultValue={hoyBogota()} style={{ minHeight: 52 }} /></label>
      <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>Cuéntenos el motivo<input name="detail" required minLength={5} maxLength={300} style={{ minHeight: 52, border: '1px solid var(--line-2)', borderRadius: 10, padding: '0 12px' }} /></label>
      <button className="btn primary" style={{ minHeight: 56 }}>Enviar solicitud</button>
    </form>
    <h2 className="sec">Enviadas</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {(data ?? []).length === 0 && <tr><td className="empty">Aún no ha enviado solicitudes.</td></tr>}
      {(data ?? []).map((r) => { const [tone, label] = TONE[r.status] ?? ['mute', r.status]; return (
        <tr key={r.id}><td><b>{r.type}</b><div className="muted">{fecha(r.for_date)} · {r.detail}</div></td><td><span className={`chip ${tone}`}>{label}</span></td></tr>); })}
    </tbody></table></div>
  </>);
}
