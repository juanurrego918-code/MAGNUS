import { createClient } from '@supabase/supabase-js';
import { detectIntent, FIXED, productReply, recipeReply, type Reply } from './chatbot';

export function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
}

/** Responde con datos públicos (catálogo sin precios y recetas publicadas). Sin IA externa ni datos privados. */
export async function answer(message: string): Promise<Reply> {
  const { intent, term } = detectIntent(message);
  if (intent === 'producto') {
    const { data } = await anonClient().rpc('public_catalog', { p_search: term ?? '', p_limit: 5 });
    return productReply(term ?? '', (data ?? []) as { name: string; brand: string | null }[]);
  }
  if (intent === 'receta') {
    const { data } = await anonClient().rpc('public_recipes');
    const all = (data ?? []) as { slug: string; title: string }[];
    const t = (term ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const found = t ? all.filter((r) => r.title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t.split(' ')[0])) : all;
    return recipeReply(term, found);
  }
  return FIXED[intent];
}
