import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop, fecha } from '@/lib/format';

type O = { id: number; code: string; status: string; total: number; created_at: string; channel: string; clients: { name: string } | null };
const LABEL: Record<string, string> = { nuevo: 'Nuevo · en bodega', alistado: 'Alistado · en caja', facturado: 'Facturado', anulado: 'Anulado' };

export default async function Pedidos() {
  const s = await requireSession('/pedidos');
  const sb = await supabaseServer();
  const { data, error } = await sb.from('orders').select('id, code, status, total, created_at, channel, clients(name)').order('id', { ascending: false }).limit(100);
  const rows = (data ?? []) as unknown as O[];
  return (<>
    <h1>Pedidos</h1>
    <p className="sub">{s.role === 'vendedor' ? 'Sus pedidos.' : 'Todos los pedidos.'}</p>
    {(s.role === 'vendedor' || s.role === 'dueno') && <p><Link className="btn primary" href="/pedidos/nuevo">Nuevo pedido</Link></p>}
    {error && <div className="err-msg" role="alert">No se pudieron cargar los pedidos.</div>}
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table>
        <thead><tr><th>Pedido</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th className="num">Total</th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="empty">Aún no hay pedidos.</td></tr>}
          {rows.map((o) => <tr key={o.id}><td><b>{o.code}</b></td><td>{o.clients?.name ?? 'Mostrador'}</td><td>{fecha(o.created_at)}</td><td>{LABEL[o.status] ?? o.status}</td><td className="num">{cop(o.total)}</td></tr>)}
        </tbody>
      </table>
    </div>
  </>);
}
