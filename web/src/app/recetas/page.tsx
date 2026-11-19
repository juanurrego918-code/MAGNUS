import Link from 'next/link';
import { SiteShell } from '@/components/SiteShell';
import { anonClient } from '@/lib/answer';

export const metadata = { title: 'Recetas · Magnus' };

export default async function Recetas() {
  const { data } = await anonClient().rpc('public_recipes');
  const rows = (data ?? []) as { slug: string; title: string; summary: string | null; servings: number | null }[];
  return (
    <SiteShell>
      <h1>Recetas</h1>
      <p className="sub">Ideas para cocinar con los productos de Magnus.</p>
      {rows.length === 0 && <div className="card empty">Pronto publicaremos nuestras primeras recetas.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {rows.map((r) => <Link key={r.slug} href={`/recetas/${r.slug}`} className="card" style={{ textDecoration: 'none' }}><b style={{ fontSize: 18 }}>{r.title}</b><div className="muted">{r.summary}</div>{r.servings && <div className="muted">Para {r.servings} personas</div>}</Link>)}
      </div>
    </SiteShell>);
}
