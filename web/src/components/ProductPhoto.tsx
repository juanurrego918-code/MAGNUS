'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

/** Sube la foto del producto al bucket público "productos" (solo el dueño puede escribir). */
export function ProductPhoto({ code }: { code: string }) {
  const [path, setPath] = useState(''); const [state, setState] = useState<'idle' | 'uploading' | 'error'>('idle');
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 3 * 1024 * 1024) { setState('error'); return; }
    setState('uploading');
    const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
    const target = `${code}/${Date.now()}.${ext}`;
    const { error } = await supabaseBrowser().storage.from('productos').upload(target, f, { contentType: f.type });
    if (error) { setState('error'); setPath(''); return; }
    setPath(target); setState('idle');
  }
  return (<div style={{ display: 'grid', gap: 6 }}>
    <input type="file" accept="image/*" onChange={onFile} aria-label="Foto del producto" style={{ minHeight: 44 }} />
    <input type="hidden" name="photo" value={path} />
    {state === 'uploading' && <span className="muted" role="status">Subiendo…</span>}
    {state === 'error' && <span className="err-msg" role="alert">No se pudo subir (JPG, PNG o WebP de máximo 3 MB).</span>}
    {path && <span className="chip ok">✓ Foto lista; guarde para aplicarla</span>}
  </div>);
}
