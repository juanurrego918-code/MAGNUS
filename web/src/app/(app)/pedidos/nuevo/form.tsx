'use client';
import { useActionState, useMemo, useState } from 'react';
import { crearPedido } from '../actions';

type P = { id: number; name: string; code: string; presentations: { id: number; name: string; price: number }[] };

export function NuevoPedido({ clients, products }: { clients: { id: number; name: string; credit_days: number }[]; products: P[] }) {
  const [state, action, pending] = useActionState(crearPedido, undefined);
  const [q, setQ] = useState('');
  const [delivery, setDelivery] = useState('domicilio');
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? products.filter((p) => p.name.toLowerCase().includes(t) || p.code.toLowerCase().includes(t)) : products;
  }, [q, products]);
  return (
    <form action={action} style={{ display: 'grid', gap: 16 }}>
      {state?.error && <div className="err-msg" role="alert">{state.error}</div>}
      <div className="filters">
        <select name="client" required aria-label="Cliente" defaultValue="">
          <option value="" disabled>Elija el cliente</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="delivery" value={delivery} onChange={(e) => setDelivery(e.target.value)} aria-label="Entrega">
          <option value="domicilio">Domicilio</option><option value="recoge">Recoge en punto</option>
        </select>
        {delivery === 'domicilio' && <>
          <input name="addr" placeholder="Dirección de entrega" required maxLength={200} aria-label="Dirección" />
          <select name="window" aria-label="Ventana de entrega"><option>08:00–11:00</option><option>11:00–14:00</option><option>14:00–17:00</option></select>
        </>}
        <select name="pay" aria-label="Forma de pago" defaultValue="contado">
          <option value="contado">Contado</option><option value="credito">Crédito</option>
          {delivery === 'domicilio' && <option value="contra_entrega">Contra entrega</option>}
        </select>
        <input name="note" placeholder="Nota para bodega (opcional)" maxLength={300} aria-label="Nota" />
      </div>
      <input placeholder="Buscar producto por nombre o código" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar producto" style={{ minHeight: 44, border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 12px', maxWidth: 420 }} />
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table><thead><tr><th>Producto</th><th>Presentación</th><th className="num">Precio lista</th><th className="num">Cantidad</th></tr></thead>
          <tbody>
            {shown.flatMap((p) => p.presentations.map((pr, i) => (
              <tr key={pr.id}>
                <td>{i === 0 && <><b>{p.name}</b><div className="muted">{p.code}</div></>}</td><td>{pr.name}</td>
                <td className="num">$ {Math.round(pr.price).toLocaleString('es-CO')}</td>
                <td className="num"><input name={`qty_${pr.id}`} type="number" min={0} max={100000} step={1} defaultValue="" aria-label={`Cantidad de ${p.name} ${pr.name}`} style={{ width: 90, minHeight: 44, textAlign: 'right', border: '1px solid var(--line-2)', borderRadius: 8, padding: '0 8px' }} /></td>
              </tr>)))}
          </tbody></table>
      </div>
      <div><button className="btn primary" disabled={pending}>{pending ? 'Enviando…' : 'Enviar a bodega'}</button></div>
    </form>
  );
}
