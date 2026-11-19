import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha } from '@/lib/format';

type P = { period_start: string; period_end: string; paid_at: string; basic: number; ext_pay: number; night_pay: number; fest_pay: number; transport: number; health: number; pension: number; net: number };

export default async function Desprendibles() {
  await requireSession('/desprendibles');
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('my_payslips');
  const rows = (data ?? []) as P[];
  return (<>
    <h1>Mis pagos</h1>
    <p className="sub">Desprendibles de las quincenas ya pagadas.</p>
    {error && <div className="err-msg" role="alert">No se pudieron cargar sus pagos.</div>}
    {rows.length === 0 && <div className="card empty">Aún no tiene pagos registrados.</div>}
    <div style={{ display: 'grid', gap: 14, maxWidth: 560 }}>
      {rows.map((p) => (
        <section key={p.period_start} className="card">
          <b>{fecha(p.period_start)} – {fecha(p.period_end)}</b> <span className="chip ok">🔒 Pagada {fecha(p.paid_at)}</span>
          <table><tbody>
            <tr><td>Básico quincenal</td><td className="num">{cop(p.basic)}</td></tr>
            <tr><td>Horas extra</td><td className="num">{cop(p.ext_pay)}</td></tr>
            <tr><td>Recargo nocturno</td><td className="num">{cop(p.night_pay)}</td></tr>
            <tr><td>Dominicales y festivos</td><td className="num">{cop(p.fest_pay)}</td></tr>
            <tr><td>Auxilio de transporte</td><td className="num">{cop(p.transport)}</td></tr>
            <tr><td>Salud</td><td className="num">− {cop(p.health)}</td></tr>
            <tr><td>Pensión</td><td className="num">− {cop(p.pension)}</td></tr>
            <tr><td><b>Neto pagado</b></td><td className="num"><b>{cop(p.net)}</b></td></tr>
          </tbody></table>
        </section>))}
    </div>
  </>);
}
