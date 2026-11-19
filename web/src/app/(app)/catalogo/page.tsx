import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { canSeeCosts } from '@/lib/roles';
import { cop, num } from '@/lib/format';
import { safeTerm } from '@/lib/search';
import { Chip } from '@/components/Chip';

type Row = {
  id: number; code: string; ean: string | null; name: string; brand: string | null; active: boolean; min_units: number;
  categories: { name: string } | null; presentations: { id: number; name: string; units: number; price: number }[];
  product_costs: { cost: number } | null;
};

export default async function Catalogo({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string }> }) {
  const s = await requireSession('/catalogo');
  const sp = await searchParams;
  const q = safeTerm(sp.q);
  const cat = /^\d+$/.test(sp.cat ?? '') ? Number(sp.cat) : null;
  const costs = canSeeCosts(s.role);
  const sb = await supabaseServer();

  const cats = (await sb.from('categories').select('id, name').order('name')).data ?? [];
  let query = sb.from('products')
    .select(`id, code, ean, name, brand, active, min_units, categories(name), presentations(id, name, units, price)${costs ? ', product_costs(cost)' : ''}`)
    .order('code').limit(300);
  if (q) query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%,brand.ilike.%${q}%,ean.eq.${q}`);
  if (cat) query = query.eq('category_id', cat);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];
  const stock = new Map(((await sb.from('product_stock').select('product_id, stock, status')).data ?? [])
    .map((r) => [r.product_id as number, r as { stock: number; status: 'ok' | 'bajo' | 'agotado' | 'inactivo' }]));

  return (<>
    <h1>Catálogo</h1>
    <p className="sub">{rows.length} productos{q || cat ? ' con el filtro actual' : ''}.{costs && <> · <a href="/catalogo/importar">Carga masiva desde CSV</a></>}</p>
    <form className="filters" role="search">
      <input name="q" defaultValue={q} placeholder="Buscar por nombre, código, marca o código de barras" aria-label="Buscar" />
      <select name="cat" defaultValue={cat ?? ''} aria-label="Categoría">
        <option value="">Todas las categorías</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="btn">Buscar</button>
    </form>
    {error && <div className="err-msg" role="alert">No se pudo cargar el catálogo. Intente de nuevo.</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead><tr><th>Código</th><th>Producto</th><th>Presentaciones y precio lista Mayorista</th><th className="num">Existencias</th>{costs && <th className="num">Costo · margen</th>}<th>Estado</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={costs ? 6 : 5} className="empty">No hay productos con ese filtro.</td></tr>}
          {rows.map((p) => {
            const st = stock.get(p.id);
            const base = p.presentations.find((x) => x.units === 1) ?? p.presentations[0];
            const margin = costs && p.product_costs && base ? Math.round(((base.price - p.product_costs.cost) / base.price) * 100) : null;
            return (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{costs ? <a href={`/catalogo/${p.id}`}><b>{p.name}</b></a> : <b>{p.name}</b>}<div className="muted">{[p.brand, p.categories?.name].filter(Boolean).join(' · ')}</div></td>
                <td>{p.presentations.map((x) => `${x.name}: ${cop(x.price)}`).join(' · ')}</td>
                <td className="num">{num(st?.stock)} und</td>
                {costs && <td className="num">{p.product_costs ? cop(p.product_costs.cost) : '—'}{margin !== null && <div className="muted">{margin} %</div>}</td>}
                <td><Chip kind={st?.status ?? (p.active ? 'ok' : 'inactivo')} /></td>
              </tr>);
          })}
        </tbody>
      </table>
    </div>
  </>);
}
