import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { Autoservicio } from './autoservicio';

export default async function Mostrador() {
  await requireSession('/mostrador');
  const sb = await supabaseServer();
  const [cats, prods, stock] = await Promise.all([
    sb.from('categories').select('id, name').order('name'),
    sb.from('products').select('id, name, brand, category_id, photo_path, presentations(id, name, units, price)').eq('active', true).order('name').limit(500),
    sb.from('product_stock').select('product_id, stock'),
  ]);
  const have = new Map((stock.data ?? []).map((s) => [s.product_id as number, s.stock as number]));
  const products = (prods.data ?? [])
    .filter((p) => (have.get(p.id) ?? 0) > 0)
    .map((p) => {
      const pres = [...(p.presentations as { id: number; name: string; units: number; price: number }[])].sort((a, b) => a.units - b.units)[0];
      return pres ? { id: p.id, name: p.name, brand: p.brand, cat: p.category_id, presentation: pres, available: Math.floor((have.get(p.id) ?? 0) / pres.units), photo: p.photo_path } : null;
    })
    .filter(Boolean);
  return <Autoservicio categories={cats.data ?? []} products={products as never} supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} />;
}
