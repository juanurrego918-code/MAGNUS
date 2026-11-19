import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { supabaseServer } from '@/lib/supabase/server';
import { PhotoField } from '@/components/PhotoField';
import { cop } from '@/lib/format';
import { cargar, entregar, novedad, salir } from '../actions';
import { STATUS } from '@/lib/delivery';

type D = { delivery_id: number; status: string; order_code: string; client_name: string | null; address: string; delivery_window: string; contact_phone: string | null; cod_amount: number };
const big = { minHeight: 68, width: '100%', fontSize: 17 } as const;

export default async function Detalle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const s = await requireSession('/entregas');
  const { id } = await params; const sp = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  const sb = await supabaseServer();
  const { data } = await sb.rpc('my_deliveries');
  const d = ((data ?? []) as D[]).find((x) => x.delivery_id === Number(id));
  if (!d) notFound();
  const { data: items } = await sb.rpc('my_delivery_items', { p_delivery: d.delivery_id });
  const [tone, label] = STATUS[d.status] ?? ['mute', d.status];
  const hidden = <input type="hidden" name="delivery" value={d.delivery_id} />;
  return (<>
    <h1>{d.client_name ?? 'Mostrador'}</h1>
    <p className="sub">{d.order_code} · <span className={`chip ${tone}`}>{label}</span></p>
    {sp.ok && <div className="chip ok" role="status" style={{ marginBottom: 12 }}>✓ {sp.ok}</div>}
    {sp.err && <div className="err-msg" role="alert" style={{ marginBottom: 12 }}>{sp.err}</div>}
    <div className="card" style={{ display: 'grid', gap: 8, maxWidth: 560, marginBottom: 16 }}>
      <div><b>Dirección:</b> {d.address}</div><div><b>Ventana:</b> {d.delivery_window}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a className="btn" style={{ minHeight: 56 }} target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.address)}`}>Abrir mapa</a>
        {d.contact_phone && /^[0-9 +()-]+$/.test(d.contact_phone) && <a className="btn" style={{ minHeight: 56 }} href={`tel:${d.contact_phone.replace(/\s/g, '')}`}>Llamar</a>}
      </div>
      {d.cod_amount > 0 && <div style={{ fontSize: 22 }}><b>Cobrar {cop(d.cod_amount)}</b></div>}
      <div><b>Lleva:</b><ul style={{ margin: '4px 0 0' }}>{(items ?? []).map((i: { product: string; presentation: string; qty: number }, n: number) => <li key={n}>{i.qty} × {i.presentation} — {i.product}</li>)}</ul></div>
    </div>
    <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      {d.status === 'por_alistar' && <form action={cargar}>{hidden}<button className="btn primary" style={big}>Marcar cargado</button></form>}
      {d.status === 'cargado' && <form action={salir}>{hidden}<button className="btn primary" style={big}>Salir a ruta</button></form>}
      {d.status === 'en_ruta' && <form action={entregar} className="card" style={{ display: 'grid', gap: 12 }}>
        {hidden}<h2 className="sec" style={{ margin: 0 }}>Llegué · registrar entrega</h2>
        <PhotoField name="photo" uid={s.id} prefix={`entrega-${d.delivery_id}`} label="Tomar foto de la entrega" />
        <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>Nombre de quien recibe<input name="receiver" required minLength={3} maxLength={80} autoComplete="off" style={{ minHeight: 56, border: '1px solid var(--line-2)', borderRadius: 12, padding: '0 14px' }} /></label>
        {d.cod_amount > 0 && <label style={{ display: 'grid', gap: 6, fontWeight: 600 }}>Cobro de {cop(d.cod_amount)} · medio<select name="method" required defaultValue="" style={{ minHeight: 56 }}><option value="" disabled>Elija</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></label>}
        <button className="btn primary" style={big}>Confirmar entrega</button>
      </form>}
      {(d.status === 'cargado' || d.status === 'en_ruta') && <form action={novedad} className="card" style={{ display: 'grid', gap: 10 }}>
        {hidden}<h2 className="sec" style={{ margin: 0 }}>Reportar novedad</h2>
        <select name="reason" required defaultValue="" aria-label="Motivo" style={{ minHeight: 56 }}><option value="" disabled>Motivo</option><option>No estaba</option><option>Rechazó el pedido</option><option>Faltó producto</option><option>Dirección errada</option></select>
        <input name="detail" maxLength={300} placeholder="Detalle (opcional)" aria-label="Detalle" style={{ minHeight: 56, border: '1px solid var(--line-2)', borderRadius: 12, padding: '0 14px' }} />
        <button className="btn" style={{ ...big, borderColor: 'var(--err-line)', color: 'var(--err)' }}>Reportar novedad</button>
      </form>}
    </div>
  </>);
}
