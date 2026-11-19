import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { PhotoField } from '@/components/PhotoField';
import { iniciarTurno, terminarTurno } from './actions';

export default async function Turno({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const s = await requireSession('/turno');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from('driver_shifts').select('id, started_at').is('ended_at', null).maybeSingle();
  return (<>
    <h1>Mi turno</h1>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    {data ? (
      <div className="card" style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
        <p style={{ margin: 0 }}>Turno abierto desde las <b>{new Date(data.started_at).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour12: false, hour: '2-digit', minute: '2-digit' })}</b>.</p>
        <p className="muted" style={{ margin: 0 }}>Su ubicación se comparte con administración mientras esta aplicación esté abierta. Se apaga al terminar el turno.</p>
        <form action={terminarTurno}><button className="btn" style={{ minHeight: 64, width: '100%' }}>Terminar turno</button></form>
      </div>
    ) : (
      <form action={iniciarTurno} className="card" style={{ display: 'grid', gap: 14, maxWidth: 520 }}>
        <p style={{ margin: 0 }}>Al iniciar, se comparte su ubicación con administración <b>solo durante el turno</b>. Verá un aviso fijo mientras esté activa.</p>
        <PhotoField name="photo" uid={s.id} prefix="entrada" label="Tomar foto de entrada" />
        <button className="btn primary" style={{ minHeight: 68 }}>Iniciar turno y compartir ubicación</button>
      </form>
    )}
  </>);
}
