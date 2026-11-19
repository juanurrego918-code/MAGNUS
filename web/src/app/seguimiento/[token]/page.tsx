import { createClient } from '@supabase/supabase-js';
import { fecha } from '@/lib/format';

const TEXT: Record<string, string> = {
  por_alistar: 'Estamos preparando su pedido.', cargado: 'Su pedido está cargado y saldrá pronto.',
  en_ruta: 'Su pedido va en camino.', entregado: 'Su pedido fue entregado.', novedad: 'Tuvimos una novedad con su entrega. Nos comunicaremos con usted.',
};

/** Página pública: solo estado y ventana de entrega. Nunca ubicación exacta, montos ni datos del conductor. */
export default async function Seguimiento({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
  let row: { order_code: string; status: string; delivery_window: string | null; delivered_at: string | null } | undefined;
  if (valid) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data } = await sb.rpc('track_delivery', { p_token: token });
    row = (data ?? [])[0];
  }
  return (
    <div className="login"><div style={{ maxWidth: 440, display: 'grid', gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-magnus.png" alt="Magnus" style={{ height: 44, justifySelf: 'start' }} />
      {row ? (<>
        <h1>Pedido {row.order_code}</h1>
        <div className="card" role="status"><b style={{ fontSize: 18 }}>{TEXT[row.status] ?? 'Estamos procesando su pedido.'}</b>
          {row.delivery_window && row.status !== 'entregado' && <p className="muted" style={{ margin: '8px 0 0' }}>Ventana de entrega: {row.delivery_window}</p>}
          {row.delivered_at && <p className="muted" style={{ margin: '8px 0 0' }}>Entregado el {fecha(row.delivered_at)}</p>}</div>
      </>) : (<><h1>Enlace no válido</h1><p className="sub">Revise el enlace que le enviaron o comuníquese con Magnus.</p></>)}
    </div></div>
  );
}
