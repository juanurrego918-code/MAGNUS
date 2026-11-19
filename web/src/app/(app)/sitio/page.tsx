import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { fecha } from '@/lib/format';
import { horaBogota } from '@/lib/quincena';
import { crearReceta, eliminarReceta, publicar } from './actions';

const inp = { minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px', width: '100%' } as const;

export default async function Sitio({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  await requireSession('/sitio');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const [rec, leads] = await Promise.all([
    sb.from('recipes').select('id, slug, title, published, servings').order('id', { ascending: false }),
    sb.from('leads').select('id, name, phone, message, created_at').order('id', { ascending: false }).limit(50),
  ]);
  return (<>
    <h1>Sitio web</h1>
    <p className="sub">Recetas del sitio público y contactos que llegan desde el formulario.</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}

    <h2 className="sec">Contactos recibidos</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><thead><tr><th>Fecha</th><th>Nombre</th><th>Teléfono</th><th>Mensaje</th></tr></thead><tbody>
      {(leads.data ?? []).length === 0 && <tr><td colSpan={4} className="empty">Aún no hay contactos.</td></tr>}
      {(leads.data ?? []).map((l) => <tr key={l.id}><td>{fecha(l.created_at)} {horaBogota(l.created_at)}</td><td><b>{l.name}</b></td><td><a href={`tel:${l.phone}`}>{l.phone}</a></td><td>{l.message ?? '—'}</td></tr>)}
    </tbody></table></div>

    <h2 className="sec">Recetas</h2>
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}><table><tbody>
      {(rec.data ?? []).length === 0 && <tr><td className="empty">Aún no hay recetas.</td></tr>}
      {(rec.data ?? []).map((r) => (
        <tr key={r.id}><td><b>{r.title}</b><div className="muted">/recetas/{r.slug}</div></td>
          <td>{r.published ? <span className="chip ok">✓ Publicada</span> : <span className="chip mute">Oculta</span>}</td>
          <td><form action={publicar} style={{ display: 'inline' }}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="to" value={r.published ? '0' : '1'} /><button className="btn">{r.published ? 'Ocultar' : 'Publicar'}</button></form></td>
          <td><form action={eliminarReceta} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="hidden" name="id" value={r.id} /><label style={{ display: 'flex', gap: 4 }}><input type="checkbox" name="confirm" required /> Confirmo</label><button className="btn" style={{ borderColor: 'var(--err-line)', color: 'var(--err)' }}>Eliminar</button></form></td></tr>))}
    </tbody></table></div>

    <h2 className="sec">Nueva receta</h2>
    <form action={crearReceta} className="card" style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
      <input name="title" required minLength={3} maxLength={100} placeholder="Título" aria-label="Título" style={inp} />
      <input name="summary" maxLength={200} placeholder="Resumen corto" aria-label="Resumen" style={inp} />
      <input name="servings" type="number" min={1} max={100} placeholder="Porciones" aria-label="Porciones" style={inp} />
      <textarea name="items" required rows={5} placeholder={'Ingredientes (uno por línea)\n2 tazas de arroz'} aria-label="Ingredientes" style={{ ...inp, padding: 10 }} />
      <textarea name="steps" required rows={5} placeholder={'Pasos (uno por línea)\nLavar el arroz'} aria-label="Pasos" style={{ ...inp, padding: 10 }} />
      <label style={{ display: 'flex', gap: 8 }}><input type="checkbox" name="publish" /> Publicar ahora</label>
      <button className="btn primary">Crear receta</button>
    </form>
  </>);
}
