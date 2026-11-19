'use client';
import { useActionState } from 'react';
import { enviarContacto } from './actions';

export function ContactForm() {
  const [st, action, pending] = useActionState(enviarContacto, undefined);
  if (st?.ok) return <div className="card" role="status"><b>¡Gracias!</b> Recibimos sus datos. Un asesor de Magnus le contactará pronto.</div>;
  const f = { minHeight: 52, border: '1px solid var(--line-2)', borderRadius: 10, padding: '0 14px' } as const;
  return (
    <form action={action} className="card" style={{ display: 'grid', gap: 12, maxWidth: 520 }}>
      {st?.error && <div className="err-msg" role="alert">{st.error}</div>}
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>Nombre o negocio<input name="name" required minLength={3} maxLength={80} autoComplete="name" style={f} /></label>
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>Teléfono o WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" maxLength={30} style={f} /></label>
      <label style={{ display: 'grid', gap: 4, fontWeight: 600 }}>¿Qué necesita? (opcional)<textarea name="message" maxLength={500} rows={3} style={{ ...f, padding: 12 }} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <p className="muted" style={{ margin: 0, fontSize: 13 }}>Usaremos sus datos solo para contactarle. Más en el <a href="/privacidad">aviso de privacidad</a>.</p>
      <button className="btn primary" disabled={pending} style={{ minHeight: 56 }}>{pending ? 'Enviando…' : 'Quiero que me contacten'}</button>
    </form>);
}
