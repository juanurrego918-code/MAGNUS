'use client';
import { useActionState } from 'react';
import { revisar, type Revision } from './actions';

const TONE: Record<string, string> = { ok: 'ok', advertencia: 'warn', rechazado: 'err' };
const LABEL: Record<string, string> = { ok: '✓ Válido', advertencia: '⚠ Advertencia', rechazado: '✕ Rechazado' };

export function ImportForm() {
  const [res, action, pending] = useActionState<Revision | undefined, FormData>(revisar, undefined);
  const rows = res?.rows ?? [];
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const valid = count('ok') + count('advertencia');
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 900 }}>
      <form action={action} className="card" style={{ display: 'grid', gap: 10 }}>
        <p style={{ margin: 0 }}>Suba un CSV con las columnas: <code>codigo, ean, nombre, marca, categoria, minimo, costo, presentacion, unidades, precio</code> (una fila por presentación). Primero se revisa; nada se guarda hasta que confirme.</p>
        <input type="file" name="file" accept=".csv,text/csv" aria-label="Archivo CSV" style={{ minHeight: 44 }} />
        <button className="btn" disabled={pending}>{pending ? 'Revisando…' : 'Revisar archivo'}</button>
      </form>
      {res?.error && <div className="err-msg" role="alert">{res.error}</div>}
      {res?.applied && <div className="chip ok" role="status">✓ Carga aplicada ({rows.length} productos). Quedó en el historial.</div>}
      {rows.length > 0 && !res?.applied && (<>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="chip ok">{count('ok')} válidos</span><span className="chip warn">{count('advertencia')} con advertencia</span><span className="chip err">{count('rechazado')} rechazados</span>
        </div>
        <div className="card" style={{ padding: 0, overflowX: 'auto', maxHeight: 420 }}><table><tbody>
          {rows.map((r, i) => <tr key={i}><td><b>{r.code}</b></td><td><span className={`chip ${TONE[r.status]}`}>{LABEL[r.status]}</span></td><td>{r.message}</td></tr>)}
        </tbody></table></div>
        {valid > 0 && (
          <form action={action} className="card" style={{ display: 'grid', gap: 10 }}>
            <input type="hidden" name="apply" value="1" /><input type="hidden" name="csv" value={res?.csv ?? ''} />
            <p style={{ margin: 0 }}>Se importarán <b>{valid}</b> productos y se omitirán los rechazados. Los códigos que ya existen se actualizan.</p>
            <button className="btn primary" disabled={pending}>{pending ? 'Importando…' : `Importar ${valid} productos`}</button>
          </form>)}
      </>)}
    </div>);
}
