import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { ProductPhoto } from '@/components/ProductPhoto';
import { guardarProducto } from './actions';

const inp = { minHeight: 48, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px' } as const;

export default async function EditarProducto({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const s = await requireSession('/catalogo');
  if (s.role !== 'dueno') return <div className="card empty">Solo administración edita el catálogo.</div>;
  const { id } = await params; const sp = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const sb = await supabaseServer();
  const { data: p } = await sb.from('products').select('id, code, name, brand, active, min_units, photo_path, presentations(id, name, price), product_costs(cost)').eq('id', Number(id)).maybeSingle();
  if (!p) notFound();
  const cost = (p.product_costs as unknown as { cost: number } | null)?.cost ?? '';
  return (<>
    <h1>{p.name}</h1>
    <p className="sub">{p.code}{p.brand ? ` · ${p.brand}` : ''}</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <form action={guardarProducto} className="card" style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <input type="hidden" name="id" value={p.id} />
      <h2 className="sec" style={{ margin: 0 }}>Precios (lista Mayorista)</h2>
      {(p.presentations as { id: number; name: string; price: number }[]).map((pr) => (
        <label key={pr.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px', alignItems: 'center', gap: 8 }}>{pr.name}<input name={`price_${pr.id}`} inputMode="numeric" defaultValue={Math.round(pr.price)} style={{ ...inp, textAlign: 'right' }} /></label>))}
      <label style={{ display: 'grid', gridTemplateColumns: '1fr 160px', alignItems: 'center', gap: 8 }}>Costo por unidad<input name="cost" inputMode="numeric" defaultValue={cost === '' ? '' : Math.round(Number(cost))} style={{ ...inp, textAlign: 'right' }} /></label>
      <label style={{ display: 'grid', gridTemplateColumns: '1fr 160px', alignItems: 'center', gap: 8 }}>Mínimo en unidades<input name="min_units" type="number" min={0} defaultValue={p.min_units} style={{ ...inp, textAlign: 'right' }} /></label>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="checkbox" name="active" defaultChecked={p.active} style={{ width: 22, height: 22 }} /> Activo (visible para vender y en el sitio)</label>
      <ProductPhoto code={p.code} />
      <p className="muted" style={{ margin: 0 }}>Los cambios de precio y la inactivación quedan en el historial.</p>
      <button className="btn primary">Guardar producto</button>
    </form>
  </>);
}
