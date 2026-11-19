import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha, num } from '@/lib/format';
import { hoyBogota, quincenaAnterior, quincenaDe } from '@/lib/quincena';
import { calcular, pagar } from './actions';

type Run = { id: number; period_start: string; period_end: string; status: string; total_net: number; paid_at: string | null };
type Line = { employee_id: number; absent_days: number; hours_ext: number; hours_night: number; hours_fest: number; basic: number; ext_pay: number; night_pay: number; fest_pay: number; transport: number; health: number; pension: number; net: number; employees: { full_name: string } | null };

export default async function Nomina({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; run?: string }> }) {
  await requireSession('/nomina');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const hoy = hoyBogota();
  const actual = quincenaDe(hoy), anterior = quincenaAnterior(actual);
  const { data: runsData } = await sb.from('payroll_runs').select('id, period_start, period_end, status, total_net, paid_at').order('period_start', { ascending: false }).limit(24);
  const runs = (runsData ?? []) as Run[];
  const sel = runs.find((r) => String(r.id) === sp.run) ?? runs[0];
  let lines: Line[] = [];
  if (sel) {
    const { data } = await sb.from('payroll_lines').select('employee_id, absent_days, hours_ext, hours_night, hours_fest, basic, ext_pay, night_pay, fest_pay, transport, health, pension, net, employees(full_name)').eq('run_id', sel.id).order('employee_id');
    lines = (data ?? []) as unknown as Line[];
  }
  const canPay = sel && sel.status === 'prenomina' && sel.period_end < hoy;
  return (<>
    <h1>Nómina</h1>
    <p className="sub">Quincenal. Los porcentajes y valores son de referencia y deben validarse con el contador antes de pagar.</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {[anterior, actual].map((q) => (
        <form key={q.start} action={calcular}><input type="hidden" name="start" value={q.start} /><input type="hidden" name="end" value={q.end} />
          <button className="btn">Calcular {fecha(q.start)} – {fecha(q.end)}</button></form>))}
    </div>

    {sel ? (<>
      <h2 className="sec">Quincena {fecha(sel.period_start)} – {fecha(sel.period_end)} · {sel.status === 'pagada' ? <span className="chip ok">🔒 Pagada {fecha(sel.paid_at)}</span> : <span className="chip warn">⏰ Prenómina</span>} <a className="btn" style={{ minHeight: 36, marginLeft: 8 }} href={`/api/export/nomina?run=${sel.id}`}>Exportar para el contador</a></h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
        <thead><tr><th>Empleado</th><th className="num">Básico</th><th className="num">Extra</th><th className="num">Nocturno</th><th className="num">Dom./fest.</th><th className="num">Auxilio</th><th className="num">Salud + pensión</th><th className="num">Neto</th><th className="num">Sin marcar</th></tr></thead>
        <tbody>
          {lines.length === 0 && <tr><td colSpan={9} className="empty">No hay empleados activos en esta nómina.</td></tr>}
          {lines.map((l) => <tr key={l.employee_id}><td><b>{l.employees?.full_name}</b><div className="muted">{num(l.hours_ext)} h extra · {num(l.hours_night)} h noct. · {num(l.hours_fest)} h fest.</div></td>
            <td className="num">{cop(l.basic)}</td><td className="num">{cop(l.ext_pay)}</td><td className="num">{cop(l.night_pay)}</td><td className="num">{cop(l.fest_pay)}</td>
            <td className="num">{cop(l.transport)}</td><td className="num">− {cop(Number(l.health) + Number(l.pension))}</td><td className="num"><b>{cop(l.net)}</b></td><td className="num">{l.absent_days}</td></tr>)}
          <tr><td colSpan={7}><b>Total neto a pagar</b></td><td className="num"><b>{cop(sel.total_net)}</b></td><td /></tr>
        </tbody></table></div>
      {canPay && (
        <form action={pagar} className="card" style={{ display: 'grid', gap: 10, maxWidth: 520, marginTop: 14 }}>
          <input type="hidden" name="run" value={sel.id} />
          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}><input type="checkbox" name="confirm" required style={{ width: 22, height: 22, marginTop: 2 }} />
            <span>Confirmo que revisé la prenómina y quiero pagar {cop(sel.total_net)}. Una vez pagada <b>no se podrá modificar</b> y quedará en el historial con mi nombre.</span></label>
          <button className="btn primary">Pagar nómina</button>
        </form>)}
      {sel.status === 'prenomina' && !canPay && <p className="muted">La quincena aún no termina: se podrá pagar después del {fecha(sel.period_end)}.</p>}
    </>) : <div className="card empty" style={{ marginTop: 12 }}>Aún no hay nóminas. Calcule una quincena arriba.</div>}

    <h2 className="sec">Historial</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {runs.length === 0 && <tr><td className="empty">Sin nóminas registradas.</td></tr>}
      {runs.map((r) => <tr key={r.id}><td><a href={`/nomina?run=${r.id}`}>{fecha(r.period_start)} – {fecha(r.period_end)}</a></td><td>{r.status === 'pagada' ? <span className="chip ok">🔒 Pagada</span> : <span className="chip warn">Prenómina</span>}</td><td className="num">{cop(r.total_net)}</td></tr>)}
    </tbody></table></div>
  </>);
}
