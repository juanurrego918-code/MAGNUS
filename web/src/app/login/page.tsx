'use client';
import { useActionState } from 'react';
import { login } from './actions';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <div className="login">
      <form action={action}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-magnus.png" alt="Magnus" style={{ height: 48, justifySelf: 'start' }} />
        <h1>Ingresar</h1>
        {state?.error && <div className="err-msg" role="alert">{state.error}</div>}
        <label>Correo<input name="email" type="email" autoComplete="username" required /></label>
        <label>Contraseña<input name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
        <button className="btn primary" disabled={pending} style={{ minHeight: 52 }}>{pending ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </div>
  );
}
