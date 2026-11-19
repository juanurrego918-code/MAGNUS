'use server';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/session';
import { callRpc } from '@/lib/rpc';

const id = (v: FormDataEntryValue | null) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : null; };
const money = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? '').replace(/[.\s$]/g, '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null; };

async function done(r: { error?: string }, ok: string): Promise<never> {
  redirect('/caja?' + (r.error ? `err=${encodeURIComponent(r.error)}` : `ok=${encodeURIComponent(ok)}`));
}

export async function facturar(form: FormData) {
  await requireSession('/caja');
  const order = id(form.get('order'));
  const method = String(form.get('method'));
  if (!order) return done({ error: 'Pedido no válido.' }, '');
  return done(await callRpc('invoice_order', { p_order: order, p_method: method }), 'Factura generada.');
}
export async function abonar(form: FormData) {
  await requireSession('/caja');
  const inv = id(form.get('invoice')); const amount = money(form.get('amount'));
  if (!inv || !amount) return done({ error: 'Revise el valor del abono.' }, '');
  return done(await callRpc('register_payment', { p_invoice: inv, p_amount: amount, p_method: String(form.get('method')) }), 'Abono registrado.');
}
export async function anular(form: FormData) {
  await requireSession('/caja');
  const inv = id(form.get('invoice'));
  if (!inv) return done({ error: 'Factura no válida.' }, '');
  return done(await callRpc('annul_invoice', { p_invoice: inv, p_reason: String(form.get('reason') ?? '') }), 'Factura anulada. Quedó en el historial.');
}
export async function cerrarCaja(form: FormData) {
  await requireSession('/caja');
  const base = money(form.get('base')); const counted = money(form.get('counted'));
  if (base === null || counted === null) return done({ error: 'Revise los valores de base y efectivo contado.' }, '');
  return done(await callRpc('close_cash', { p_base: base, p_counted: counted, p_notes: String(form.get('notes') ?? '') }), 'Caja cerrada.');
}
