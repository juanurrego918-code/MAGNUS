import { SiteShell } from '@/components/SiteShell';
import { anonClient } from '@/lib/answer';
import { safeTerm } from '@/lib/search';

export const metadata = { title: 'Productos · Magnus' };
type P = { code: string; name: string; brand: string | null; category: string; photo_path: string | null };

export default async function Productos({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = safeTerm((await searchParams).q);
  const { data, error } = await anonClient().rpc('public_catalog', { p_search: q || null, p_limit: 120 });
  const rows = (data ?? []) as P[];
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return (
    <SiteShell>
      <h1>Productos</h1>
      <p className="sub">Catálogo de Magnus. Los precios dependen de su lista de cliente: <a href="/contacto">hable con un asesor</a>.</p>
      <form className="filters" role="search"><input name="q" defaultValue={q} placeholder="Buscar producto" aria-label="Buscar producto" /><button className="btn">Buscar</button></form>
      {error && <div className="err-msg" role="alert">No se pudo cargar el catálogo. Intente de nuevo.</div>}
      {rows.length === 0 && !error && <div className="card empty">No encontramos productos con esa búsqueda.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {rows.map((p) => (
          <article key={p.code} className="card" style={{ display: 'grid', gap: 6 }}>
            <div style={{ height: 130, borderRadius: 10, background: 'repeating-linear-gradient(135deg, #E9E8EC, #E9E8EC 8px, var(--sunk) 8px, var(--sunk) 16px)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {p.photo_path ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`${base}/storage/v1/object/public/productos/${encodeURI(p.photo_path)}`} alt={p.name} loading="lazy" style={{ height: '100%', objectFit: 'contain' }} /> : <span className="muted">Foto por definir</span>}
            </div>
            <b>{p.name}</b><span className="muted">{[p.brand, p.category].filter(Boolean).join(' · ')}</span>
          </article>))}
      </div>
    </SiteShell>);
}
