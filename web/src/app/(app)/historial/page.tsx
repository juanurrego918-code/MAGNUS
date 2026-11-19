import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { ROLE_LABEL, type Role } from '@/lib/roles';

export default async function Historial() {
  await requireSession('/historial');
  const sb = await supabaseServer();
  const { data, error } = await sb.from('audit_log').select('id, who, role, action, detail, created_at').order('id', { ascending: false }).limit(200);
  return (<>
    <h1>Historial</h1>
    <p className="sub">Registro inalterable de quién hizo qué.</p>
    {error && <div className="err-msg" role="alert">No se pudo cargar el historial.</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead><tr><th>Fecha y hora</th><th>Quién</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>
          {(data ?? []).length === 0 && <tr><td colSpan={4} className="empty">Aún no hay movimientos registrados.</td></tr>}
          {(data ?? []).map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota', hour12: false })}</td>
              <td><b>{r.who}</b><div className="muted">{r.role ? ROLE_LABEL[r.role as Role] : ''}</div></td>
              <td>{r.action}</td><td>{r.detail}</td>
            </tr>))}
        </tbody>
      </table>
    </div>
  </>);
}
