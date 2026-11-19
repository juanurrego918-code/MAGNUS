'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { slugify } from '@/lib/slug';

const back = (r: { error?: string }, ok: string): never => redirect('/sitio?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));
const lines = (v: FormDataEntryValue | null, max: number) => String(v ?? '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, max).map((x) => x.slice(0, 300));

export async function crearReceta(form: FormData) {
  await requireSession('/sitio');
  const title = String(form.get('title') ?? '').trim().slice(0, 100);
  const slug = slugify(title);
  const servings = Number(form.get('servings') || 0);
  const items = lines(form.get('items'), 40), steps = lines(form.get('steps'), 40);
  if (title.length < 3 || slug.length < 3) back({ error: 'Escriba un título de al menos 3 letras.' }, '');
  if (!items.length || !steps.length) back({ error: 'Agregue ingredientes y pasos (uno por línea).' }, '');
  const sb = await supabaseServer();
  const { data, error } = await sb.from('recipes').insert({ slug, title, summary: String(form.get('summary') ?? '').slice(0, 200) || null, servings: servings > 0 ? Math.min(servings, 100) : null, steps, published: form.get('publish') === 'on' }).select('id').single();
  if (error || !data) back({ error: 'No se pudo crear la receta (¿ya existe una con ese título?).' }, '');
  const ins = await sb.from('recipe_items').insert(items.map((label) => ({ recipe_id: data!.id, label })));
  back({ error: ins.error ? 'La receta se creó, pero fallaron los ingredientes.' : undefined }, 'Receta creada.');
}

export async function publicar(form: FormData) {
  await requireSession('/sitio');
  const id = Number(form.get('id'));
  if (!Number.isInteger(id) || id <= 0) back({ error: 'Receta no válida.' }, '');
  const sb = await supabaseServer();
  const { error } = await sb.from('recipes').update({ published: form.get('to') === '1' }).eq('id', id);
  back({ error: error ? 'No se pudo cambiar el estado.' : undefined }, form.get('to') === '1' ? 'Receta publicada.' : 'Receta oculta.');
}

export async function eliminarReceta(form: FormData) {
  await requireSession('/sitio');
  const id = Number(form.get('id'));
  if (form.get('confirm') !== 'on') back({ error: 'Marque la confirmación para eliminar.' }, '');
  if (!Number.isInteger(id) || id <= 0) back({ error: 'Receta no válida.' }, '');
  const sb = await supabaseServer();
  const { error } = await sb.from('recipes').delete().eq('id', id);
  back({ error: error ? 'No se pudo eliminar.' : undefined }, 'Receta eliminada.');
}
