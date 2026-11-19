import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { safeTerm } from '@/lib/search';

type C = { id: number; name: string; nit: string; city: string | null; credit_days: number; contact_name: string | null; price_lists: { name: string } | null };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession('/clientes');
  const q = safeTerm((await searchParams).q);
  const sb = await supabaseServer();
  let query = sb.from('clients').select('id, name, nit, city, credit_days, contact_name, price_lists(name)').eq('active', true).order('name').limit(300);
  if (q) query = query.or(`name.ilike.%${q}%,nit.ilike.%${q}%`);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as C[];
  return (<>
    <h1>Clientes</h1>
    <p className="sub">{rows.length} clientes.</p>
    <form className="filters" role="search">
      <input name="q" defaultValue={q} placeholder="Buscar por nombre o NIT" aria-label="Buscar" />
      <button className="btn">Buscar</button>
    </form>
    {error && <div className="err-msg" role="alert">No se pudo cargar la lista de clientes.</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead><tr><th>Cliente</th><th>NIT</th><th>Lista de precios</th><th>Ciudad</th><th>Contacto</th><th className="num">Crédito</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={6} className="empty">No hay clientes con ese filtro.</td></tr>}
          {rows.map((c) => (
            <tr key={c.id}><td><b>{c.name}</b></td><td>{c.nit}</td><td>{c.price_lists?.name}</td><td>{c.city}</td>
              <td>{c.contact_name ?? '—'}</td><td className="num">{c.credit_days ? `${c.credit_days} días` : 'Contado'}</td></tr>))}
        </tbody>
      </table>
    </div>
  </>);
}
