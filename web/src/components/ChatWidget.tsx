'use client';
import { useState } from 'react';

type Msg = { from: 'yo' | 'bot'; text: string; links?: { label: string; href: string }[] };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: 'bot', text: '¡Hola! Soy el asistente de Magnus. Pregúnteme por productos, recetas o domicilios.' }]);
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim(); if (!t || busy) return;
    setText(''); setBusy(true); setMsgs((m) => [...m, { from: 'yo', text: t }]);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: t }) });
      const j = await r.json();
      setMsgs((m) => [...m, { from: 'bot', text: String(j.text ?? 'No pude responder.'), links: Array.isArray(j.links) ? j.links : undefined }]);
    } catch { setMsgs((m) => [...m, { from: 'bot', text: 'No pude conectarme. Intente de nuevo.' }]); }
    setBusy(false);
  }
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 20 }}>
      {open && (
        <section aria-label="Asistente de Magnus" className="card" style={{ width: 'min(360px, calc(100vw - 32px))', height: 460, display: 'grid', gridTemplateRows: '1fr auto', marginBottom: 10, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowY: 'auto', padding: 12, display: 'grid', gap: 8, alignContent: 'start' }} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} style={{ justifySelf: m.from === 'yo' ? 'end' : 'start', maxWidth: '85%', background: m.from === 'yo' ? 'var(--ink)' : 'var(--sunk)', color: m.from === 'yo' ? 'var(--bg)' : 'var(--ink)', borderRadius: 12, padding: '8px 12px', whiteSpace: 'pre-line' }}>
                {m.text}
                {m.links?.map((l) => <div key={l.href}><a href={l.href} style={{ color: 'inherit', fontWeight: 700 }}>{l.label}</a></div>)}
              </div>))}
          </div>
          <form onSubmit={send} style={{ display: 'flex', gap: 6, padding: 8, borderTop: '1px solid var(--line)' }}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Escriba su pregunta" aria-label="Mensaje" style={{ flex: 1, minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 10px' }} />
            <button className="btn primary" disabled={busy}>Enviar</button>
          </form>
        </section>)}
      <button className="btn primary" onClick={() => setOpen((o) => !o)} aria-expanded={open} style={{ borderRadius: 999 }}>{open ? 'Cerrar' : '💬 Asistente'}</button>
    </div>);
}
