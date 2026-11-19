import Link from 'next/link';
import { ChatWidget } from './ChatWidget';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)', padding: '12px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/" aria-label="Magnus, inicio"><picture>{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/logo-magnus.png" alt="Magnus" style={{ height: 36 }} /></picture></Link>
        <nav aria-label="Principal" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontWeight: 600 }}>
          <Link href="/productos">Productos</Link><Link href="/recetas">Recetas</Link><Link href="/contacto">Contacto</Link>
        </nav>
        <Link href="/login" className="btn" style={{ marginLeft: 'auto', minHeight: 40 }}>Ingresar al sistema</Link>
      </header>
      <main style={{ padding: '28px 20px', maxWidth: 1100, width: '100%', margin: '0 auto' }}>{children}</main>
      <footer style={{ padding: '16px 20px', borderTop: '1px solid var(--line)', fontSize: 13 }} className="muted">
        Magnus Company Colombia · <Link href="/privacidad">Aviso de privacidad</Link> · Desarrollado por SYSMOOO
      </footer>
      <ChatWidget />
    </div>);
}
