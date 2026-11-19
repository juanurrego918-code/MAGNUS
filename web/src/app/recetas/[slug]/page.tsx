import { notFound } from 'next/navigation';
import { SiteShell } from '@/components/SiteShell';
import { anonClient } from '@/lib/answer';

export default async function Receta({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) notFound();
  const { data } = await anonClient().rpc('public_recipe', { p_slug: slug });
  const r = ((data ?? []) as { title: string; summary: string | null; servings: number | null; steps: string[]; items: string[] }[])[0];
  if (!r) notFound();
  return (
    <SiteShell>
      <h1>{r.title}</h1>
      <p className="sub">{r.summary}{r.servings ? ` · Para ${r.servings} personas` : ''}</p>
      <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        <section className="card"><h2 className="sec" style={{ marginTop: 0 }}>Ingredientes</h2><ul>{r.items.map((i, n) => <li key={n}>{i}</li>)}</ul></section>
        <section className="card"><h2 className="sec" style={{ marginTop: 0 }}>Preparación</h2><ol>{r.steps.map((s, n) => <li key={n} style={{ marginBottom: 6 }}>{s}</li>)}</ol></section>
      </div>
    </SiteShell>);
}
