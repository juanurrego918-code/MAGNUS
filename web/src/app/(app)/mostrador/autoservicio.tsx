'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { confirmarPedido, type Resultado } from './actions';

type P = { id: number; name: string; brand: string | null; cat: number; presentation: { id: number; name: string; units: number; price: number }; available: number; photo: string | null };
const cop = (n: number) => '$ ' + Math.round(n).toLocaleString('es-CO');
const IDLE_MS = 60_000;

export function Autoservicio({ categories, products, supabaseUrl }: { categories: { id: number; name: string }[]; products: P[]; supabaseUrl: string }) {
  const [step, setStep] = useState<'inicio' | 'armar' | 'listo'>('inicio');
  const [cat, setCat] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [res, setRes] = useState<Resultado | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => { setCart({}); setRes(null); setCat(null); setStep('inicio'); };
  // Vuelve a la bienvenida tras 60 s sin tocar la pantalla.
  useEffect(() => {
    const arm = () => { if (timer.current) clearTimeout(timer.current); if (step !== 'inicio') timer.current = setTimeout(reset, IDLE_MS); };
    arm();
    window.addEventListener('pointerdown', arm);
    return () => { window.removeEventListener('pointerdown', arm); if (timer.current) clearTimeout(timer.current); };
  }, [step]);

  const shown = useMemo(() => products.filter((p) => cat === null || p.cat === cat), [products, cat]);
  const lines = products.filter((p) => cart[p.presentation.id] > 0);
  const total = lines.reduce((a, p) => a + p.presentation.price * cart[p.presentation.id], 0);
  const set = (p: P, d: number) => setCart((c) => ({ ...c, [p.presentation.id]: Math.max(0, Math.min(p.available, (c[p.presentation.id] ?? 0) + d)) }));
  const confirmar = () => start(async () => {
    const r = await confirmarPedido(lines.map((p) => ({ presentation_id: p.presentation.id, qty: cart[p.presentation.id] })));
    setRes(r); if (!r.error) setStep('listo');
  });

  const big = { minHeight: 64, fontSize: 18 } as const;
  if (step === 'inicio') return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh', textAlign: 'center', gap: 24 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-magnus.png" alt="Magnus" style={{ height: 80 }} />
      <h1 style={{ fontSize: 40, fontWeight: 800 }}>Arme su pedido aquí</h1>
      <button className="btn primary" style={{ minHeight: 96, fontSize: 24, padding: '0 48px', borderRadius: 18 }} onClick={() => setStep('armar')}>Tocar para empezar</button>
    </div>);
  if (step === 'listo') return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '80vh', textAlign: 'center', gap: 20 }} role="status">
      <div className="kpi k">Su número de turno</div>
      <div style={{ fontSize: 150, fontWeight: 800, border: '6px solid var(--ink)', borderRadius: 24, width: 280, height: 280, display: 'grid', placeItems: 'center' }}>{res?.turno}</div>
      <p style={{ fontSize: 22, maxWidth: 520 }}>Espere a que lo llamen en caja. Total a pagar: <b>{cop(res?.total ?? 0)}</b></p>
      <button className="btn" style={{ ...big, padding: '0 40px' }} onClick={reset}>Nuevo pedido</button>
    </div>);
  const img = (p: P) => p.photo ? `${supabaseUrl}/storage/v1/object/public/productos/${encodeURI(p.photo)}` : null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 330px', gap: 14, minHeight: '85vh' }}>
      <nav aria-label="Categorías" style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
        <button className="btn" style={{ ...big, background: cat === null ? 'var(--ink)' : undefined, color: cat === null ? 'var(--bg)' : undefined }} onClick={() => setCat(null)}>Todo</button>
        {categories.map((c) => <button key={c.id} className="btn" style={{ ...big, background: cat === c.id ? 'var(--ink)' : undefined, color: cat === c.id ? 'var(--bg)' : undefined }} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </nav>
      <section aria-label="Productos" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignContent: 'start' }}>
        {shown.map((p) => { const n = cart[p.presentation.id] ?? 0; const src = img(p); return (
          <div key={p.id} className="card" style={{ borderRadius: 18, display: 'grid', gap: 8 }}>
            <div style={{ height: 120, borderRadius: 12, background: 'repeating-linear-gradient(135deg, var(--ph, #E9E8EC), var(--ph, #E9E8EC) 8px, var(--sunk) 8px, var(--sunk) 16px)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt={p.name} style={{ height: '100%', objectFit: 'contain' }} /> : <span className="muted">Foto por definir</span>}
            </div>
            <b style={{ fontSize: 17 }}>{p.name}</b><span className="muted">{p.brand}</span>
            <b>{cop(p.presentation.price)} c/u</b>
            {n === 0 ? <button className="btn primary" style={big} onClick={() => set(p, 1)}>Agregar</button> : (
              <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 64px', alignItems: 'center', gap: 8 }}>
                <button className="btn" style={big} aria-label={`Quitar uno de ${p.name}`} onClick={() => set(p, -1)}>−</button>
                <b style={{ textAlign: 'center', fontSize: 24 }}>{n}</b>
                <button className="btn" style={big} aria-label={`Agregar uno de ${p.name}`} onClick={() => set(p, 1)} disabled={n >= p.available}>+</button>
              </div>)}
          </div>); })}
      </section>
      <aside className="card" style={{ display: 'grid', alignContent: 'start', gap: 10, borderRadius: 18 }} aria-label="Su pedido">
        <h2 style={{ margin: 0 }}>Su pedido</h2>
        {lines.length === 0 && <p className="muted">Aún no ha agregado productos.</p>}
        {lines.map((p) => <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span>{cart[p.presentation.id]} × {p.name}</span><b>{cop(cart[p.presentation.id] * p.presentation.price)}</b></div>)}
        <hr style={{ width: '100%', border: 0, borderTop: '1px solid var(--line)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22 }}><span>Total</span><b>{cop(total)}</b></div>
        <p className="muted" style={{ margin: 0 }}>El total final lo confirma el sistema (puede aplicar descuento por volumen).</p>
        {res?.error && <div className="err-msg" role="alert">{res.error}</div>}
        <button className="btn primary" style={{ minHeight: 80, fontSize: 20 }} disabled={!lines.length || pending} onClick={confirmar}>{pending ? 'Enviando…' : 'Confirmar pedido'}</button>
        <button className="btn" style={big} onClick={reset}>Cancelar pedido</button>
      </aside>
    </div>);
}
