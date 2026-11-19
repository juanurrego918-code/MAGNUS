import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha } from '@/lib/format';
import { horaBogota, hoyBogota } from '@/lib/quincena';
import { crearEmpleado, decidir, programar } from './actions';

type Emp = { id: number; full_name: string; position: string; area: string; base_salary: number; profile_id: string | null; active: boolean };
const inp = { minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px' } as const;

export default async function Equipo({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/equipo');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const hoy = hoyBogota();
  const [empQ, attQ, schQ, reqQ, profQ] = await Promise.all([
    sb.from('employees').select('id, full_name, position, area, base_salary, profile_id, active').order('full_name'),
    sb.from('attendance').select('employee_id, clock_in, clock_out, in_photo_path').eq('work_date', hoy),
    sb.from('schedules').select('employee_id, work_date, start_time, end_time').gte('work_date', hoy).order('work_date').limit(60),
    sb.from('time_requests').select('id, employee_id, type, for_date, detail').eq('status', 'pendiente').order('id'),
    sb.from('profiles').select('id, full_name, role').eq('active', true).neq('role', 'dueno').order('full_name'),
  ]);
  const emps = (empQ.data ?? []) as Emp[];
  const att = new Map((attQ.data ?? []).map((a) => [a.employee_id as number, a]));
  const todaySch = new Map((schQ.data ?? []).filter((x) => x.work_date === hoy).map((x) => [x.employee_id as number, x]));
  const linked = new Set(emps.map((e) => e.profile_id));
  const name = (id: number) => emps.find((e) => e.id === id)?.full_name ?? '—';
  const present = emps.filter((e) => e.active && att.has(e.id)).length;
  return (<>
    <h1>Equipo</h1>
    <p className="sub">{present} de {emps.filter((e) => e.active).length} presentes hoy.</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}

    <h2 className="sec">Asistencia de hoy</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Empleado</th><th>Turno</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead>
      <tbody>
        {emps.length === 0 && <tr><td colSpan={5} className="empty">Aún no hay empleados registrados.</td></tr>}
        {emps.filter((e) => e.active).map((e) => { const a = att.get(e.id); const t = todaySch.get(e.id);
          const late = a && t && horaBogota(a.clock_in) > t.start_time.slice(0, 5);
          return (<tr key={e.id}><td><b>{e.full_name}</b><div className="muted">{e.position} · {e.area}</div></td>
            <td>{t ? `${t.start_time.slice(0, 5)} – ${t.end_time.slice(0, 5)}` : '—'}</td><td>{horaBogota(a?.clock_in)}</td><td>{horaBogota(a?.clock_out)}</td>
            <td>{!a ? <span className="chip mute">Sin marcar</span> : late ? <span className="chip warn">⏰ Tarde</span> : <span className="chip ok">✓ A tiempo</span>}</td></tr>); })}
      </tbody></table></div>

    <h2 className="sec">Solicitudes pendientes</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {(reqQ.data ?? []).length === 0 && <tr><td className="empty">No hay solicitudes pendientes.</td></tr>}
      {(reqQ.data ?? []).map((r) => (
        <tr key={r.id}><td><b>{name(r.employee_id)}</b> · {r.type}<div className="muted">{fecha(r.for_date)} · {r.detail}</div></td>
          <td><form action={decidir} style={{ display: 'flex', gap: 8 }}><input type="hidden" name="request" value={r.id} />
            <button className="btn primary" name="decision" value="aprobar">Aprobar</button>
            <button className="btn" name="decision" value="rechazar">Rechazar</button></form></td></tr>))}
    </tbody></table></div>
    <p className="muted">Aprobar un cambio de turno no modifica el calendario: ajuste el turno abajo.</p>

    <h2 className="sec">Programar turno</h2>
    <form action={programar} className="filters">
      <select name="employee" required defaultValue="" aria-label="Empleado" style={inp}><option value="" disabled>Empleado</option>{emps.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
      <input type="date" name="date" required defaultValue={hoy} aria-label="Fecha" style={inp} />
      <input type="time" name="start" required defaultValue="07:00" aria-label="Entrada" style={inp} />
      <input type="time" name="end" required defaultValue="16:00" aria-label="Salida" style={inp} />
      <button className="btn primary">Guardar turno</button>
    </form>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {(schQ.data ?? []).length === 0 && <tr><td className="empty">No hay turnos programados desde hoy.</td></tr>}
      {(schQ.data ?? []).map((t) => <tr key={`${t.employee_id}-${t.work_date}`}><td><b>{name(t.employee_id)}</b></td><td>{fecha(t.work_date)}</td><td>{t.start_time.slice(0, 5)} – {t.end_time.slice(0, 5)}</td></tr>)}
    </tbody></table></div>

    <h2 className="sec">Empleados</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table>
      <thead><tr><th>Nombre</th><th>Cargo</th><th>Área</th><th className="num">Salario base</th><th>Usuario</th></tr></thead>
      <tbody>{emps.map((e) => <tr key={e.id}><td><b>{e.full_name}</b></td><td>{e.position}</td><td>{e.area}</td><td className="num">{cop(e.base_salary)}</td><td>{e.profile_id ? '✓ Enlazado' : 'Sin usuario'}</td></tr>)}</tbody></table></div>
    <form action={crearEmpleado} className="filters" style={{ marginTop: 14 }}>
      <input name="name" required minLength={3} placeholder="Nombre completo" aria-label="Nombre" style={inp} />
      <input name="position" required placeholder="Cargo" aria-label="Cargo" style={inp} />
      <select name="area" aria-label="Área" style={inp}>{['Ventas', 'Bodega', 'Caja', 'Reparto', 'Administración'].map((a) => <option key={a}>{a}</option>)}</select>
      <input name="salary" required inputMode="numeric" placeholder="Salario base" aria-label="Salario base" style={inp} />
      <select name="profile" defaultValue="" aria-label="Usuario" style={inp}><option value="">Sin usuario</option>{(profQ.data ?? []).filter((p) => !linked.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select>
      <button className="btn">Crear empleado</button>
    </form>
  </>);
}
