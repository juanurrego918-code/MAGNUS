import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { PhotoField } from '@/components/PhotoField';
import { cop, fecha, num } from '@/lib/format';
import { horaBogota, hoyBogota, quincenaDe } from '@/lib/quincena';
import { marcarEntrada, marcarSalida } from './actions';

type Est = { base_salary: number; absent_days: number; hours_ord: number; hours_ext: number; hours_night: number; hours_fest: number; basic: number; ext_pay: number; night_pay: number; fest_pay: number; transport: number; health: number; pension: number; net: number };

export default async function Marcar({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const s = await requireSession('/marcar');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const hoy = hoyBogota();
  const q = quincenaDe(hoy);
  const [empQ, attQ, schQ, estQ] = await Promise.all([
    sb.from('employees').select('id, full_name').maybeSingle(),
    sb.from('attendance').select('work_date, clock_in, clock_out').order('clock_in', { ascending: false }).limit(1),
    sb.from('schedules').select('work_date, start_time, end_time').gte('work_date', hoy).order('work_date').limit(7),
    sb.rpc('my_payroll_estimate', { p_start: q.start, p_end: q.end }),
  ]);
  const emp = empQ.data;
  const last = attQ.data?.[0];
  const open = last && !last.clock_out && last.work_date === hoy;
  const done = last && last.clock_out && last.work_date === hoy;
  const est = ((estQ.data ?? []) as Est[])[0];
  return (<>
    <h1>Marcar asistencia</h1>
    {!emp && <div className="err-msg" role="alert">Su usuario aún no tiene ficha de empleado. Pídale a administración que la cree.</div>}
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    {emp && (<>
      <div className="card" style={{ maxWidth: 520, display: 'grid', gap: 14 }}>
        <div style={{ fontSize: 14 }} className="muted">{fecha(hoy)}</div>
        {!last || last.work_date !== hoy ? (
          <form action={marcarEntrada} style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0 }}>Aún no ha marcado la entrada de hoy.</p>
            <PhotoField name="photo" uid={s.id} prefix="asistencia-entrada" label="Tomar foto de entrada" />
            <button className="btn primary" style={{ minHeight: 64 }}>Marcar entrada</button>
          </form>
        ) : open ? (
          <form action={marcarSalida} style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0 }}>Entró a las <b>{horaBogota(last.clock_in)}</b>.</p>
            <PhotoField name="photo" uid={s.id} prefix="asistencia-salida" label="Tomar foto de salida" />
            <button className="btn primary" style={{ minHeight: 64 }}>Marcar salida</button>
          </form>
        ) : done ? <p style={{ margin: 0 }}>Hoy trabajó de <b>{horaBogota(last.clock_in)}</b> a <b>{horaBogota(last.clock_out)}</b>. ¡Gracias!</p> : null}
      </div>
      <h2 className="sec">Mis próximos turnos</h2>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
        {(schQ.data ?? []).length === 0 && <tr><td className="empty">No tiene turnos programados.</td></tr>}
        {(schQ.data ?? []).map((t) => <tr key={t.work_date}><td><b>{fecha(t.work_date)}</b></td><td>{t.start_time.slice(0, 5)} – {t.end_time.slice(0, 5)}</td></tr>)}
      </tbody></table></div>
      {est && (<>
        <h2 className="sec">Quincena en curso ({fecha(q.start)} – {fecha(q.end)})</h2>
        <div className="card" style={{ maxWidth: 520 }}>
          <p className="muted" style={{ marginTop: 0 }}>Estimado con lo marcado hasta hoy. El valor final lo confirma administración.</p>
          <table><tbody>
            <tr><td>Horas ordinarias</td><td className="num">{num(est.hours_ord)}</td></tr>
            <tr><td>Horas extra</td><td className="num">{num(est.hours_ext)}</td></tr>
            <tr><td>Horas nocturnas</td><td className="num">{num(est.hours_night)}</td></tr>
            <tr><td>Horas dominicales y festivas</td><td className="num">{num(est.hours_fest)}</td></tr>
            <tr><td>Días sin marcar</td><td className="num">{est.absent_days}</td></tr>
            <tr><td><b>Neto estimado</b></td><td className="num"><b>{cop(est.net)}</b></td></tr>
          </tbody></table>
        </div>
      </>)}
    </>)}
  </>);
}
