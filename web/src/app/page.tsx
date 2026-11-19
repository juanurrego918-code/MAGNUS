import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { requireSession } from '@/lib/session';
import { homeFor } from '@/lib/roles';
import { SiteShell } from '@/components/SiteShell';

export default async function Home() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) { const s = await requireSession(); redirect(homeFor(s.role)); }
  return (
    <SiteShell>
      <section style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
        <h1 style={{ fontSize: 40, lineHeight: 1.1 }}>Su proveedor mayorista de abarrotes</h1>
        <p style={{ fontSize: 18, maxWidth: 640 }} className="muted">Más de 800 productos para tiendas, restaurantes, panaderías y hoteles, con domicilio y precios por lista de cliente.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/contacto" className="btn primary" style={{ minHeight: 52 }}>Quiero ser cliente</Link>
          <Link href="/productos" className="btn" style={{ minHeight: 52 }}>Ver productos</Link>
          <Link href="/recetas" className="btn" style={{ minHeight: 52 }}>Ver recetas</Link>
        </div>
      </section>
    </SiteShell>);
}
