'use server';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';
import { parseCsv, rowsToProducts } from '@/lib/csv';

export type Revision = { error?: string; applied?: boolean; rows?: { code: string; status: string; message: string }[]; csv?: string };

export async function revisar(_: Revision | undefined, form: FormData): Promise<Revision> {
  await requireSession('/catalogo');
  const apply = form.get('apply') === '1';
  let text = '';
  if (apply) text = String(form.get('csv') ?? '');
  else {
    const f = form.get('file');
    if (!(f instanceof File) || f.size === 0) return { error: 'Elija un archivo CSV.' };
    if (f.size > 2 * 1024 * 1024) return { error: 'El archivo supera 2 MB.' };
    text = await f.text();
  }
  const { products, error } = rowsToProducts(parseCsv(text));
  if (error) return { error };
  const r = await callRpc<{ code: string; status: string; message: string }[]>('import_products', { p_rows: products, p_apply: apply });
  if (r.error) return { error: r.error };
  return { applied: apply, rows: r.data ?? [], csv: apply ? undefined : text };
}
