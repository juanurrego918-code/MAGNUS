import { requireSession } from '@/lib/session';
import { navFor, ROLE_LABEL } from '@/lib/roles';
import { Nav } from '@/components/Nav';
import { logout } from '../login/actions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
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
      <main className="main">{children}</main>
    </div>
  );
}
