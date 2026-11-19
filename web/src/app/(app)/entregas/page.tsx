import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { cop } from '@/lib/format';
import { STATUS } from '@/lib/delivery';

type D = { delivery_id: number; seq: number | null; status: string; order_code: string; client_name: string | null; address: string; delivery_window: string; cod_amount: number };

export default async function Entregas({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireSession('/entregas');
  const sp = await searchParams;
  const sb = await supabaseServer();
  const { data, error } = await sb.rpc('my_deliveries');
  const rows = (data ?? []) as D[];
  const done = rows.filter((r) => r.status === 'entregado').length;
  return (<>
    <h1>Entregas del día</h1>
    <p className="sub">{done} de {rows.length} entregadas.</p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {error && <div className="err-msg" role="alert">No se pudieron cargar las entregas. Se reintentará al volver la señal.</div>}
    {rows.length === 0 && <div className="card empty">No tiene entregas asignadas.</div>}
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((r) => { const [tone, label] = STATUS[r.status] ?? ['mute', r.status]; const next = r.status !== 'entregado' && !rows.some((x) => x.status !== 'entregado' && (x.seq ?? 999) < (r.seq ?? 999)); return (
        <Link key={r.delivery_id} href={`/entregas/${r.delivery_id}`} className="card" style={{ textDecoration: 'none', minHeight: 68, border: next ? '2px solid var(--red)' : undefined, opacity: r.status === 'entregado' ? .6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <b style={{ fontSize: 18 }}>{r.seq ? `${r.seq}. ` : ''}{r.client_name ?? 'Mostrador'}</b><span className={`chip ${tone}`}>{label}</span>
          </div>
          <div className="muted">{r.address} · {r.delivery_window}</div>
          {r.cod_amount > 0 && <div><b>Cobrar {cop(r.cod_amount)}</b></div>}
        </Link>); })}
    </div>
  </>);
}
