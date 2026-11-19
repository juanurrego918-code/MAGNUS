import { requireSession } from '@/lib/session';
import { navFor, ROLE_LABEL } from '@/lib/roles';
import { Nav } from '@/components/Nav';
import { logout } from '../login/actions';
import { supabaseServer } from '@/lib/supabase/server';
import { GpsTracker } from '@/components/GpsTracker';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  let sharing = false;
  if (s.role === 'conductor') {
    const sb = await supabaseServer();
    const { data } = await sb.from('driver_shifts').select('id').is('ended_at', null).maybeSingle();
    sharing = !!data;
  }
  return (
    <div className="shell">
      <aside className="side">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-magnus.png" alt="Magnus" />
        <Nav items={navFor(s.role)} />
        <div className="who"><b>{s.name}</b>{ROLE_LABEL[s.role]}
          <form action={logout}><button className="btn" style={{ marginTop: 10, minHeight: 36 }}>Cerrar sesión</button></form>
        </div>
      </aside>
      <main className="main">
        {sharing && <><div role="status" style={{ background: 'var(--ink)', color: 'var(--bg)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontWeight: 700 }}>📍 Ubicación compartida con administración · solo durante el turno</div><GpsTracker /></>}
        {children}
      </main>
    </div>
  );
}
