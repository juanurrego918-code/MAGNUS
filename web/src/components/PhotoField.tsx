'use client';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase/client';

/** Toma la foto, la sube al bucket privado "evidencias" (carpeta del usuario) y deja la ruta en un campo oculto. */
export function PhotoField({ name, uid, label, prefix }: { name: string; uid: string; label: string; prefix: string }) {
  const [path, setPath] = useState('');
  const [state, setState] = useState<'idle' | 'uploading' | 'error'>('idle');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) { setState('error'); return; }
    setState('uploading');
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const target = `${uid}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabaseBrowser().storage.from('evidencias').upload(target, file, { contentType: file.type });
    if (error) { setState('error'); setPath(''); return; }
    setPath(target); setState('idle');
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label className="btn" style={{ minHeight: 64, cursor: 'pointer' }}>
        <Camera size={22} aria-hidden /> {path ? 'Foto lista · tomar otra' : label}
        <input type="file" accept="image/*" capture="environment" onChange={onFile} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
      </label>
      <input type="hidden" name={name} value={path} />
      {state === 'uploading' && <span className="muted" role="status">Subiendo foto…</span>}
      {state === 'error' && <span className="err-msg" role="alert">No se pudo subir la foto. Revise la señal y que sea JPG, PNG o WebP de máximo 5 MB.</span>}
      {path && state === 'idle' && <span className="chip ok" role="status">✓ Foto guardada</span>}
    </div>
  );
}
