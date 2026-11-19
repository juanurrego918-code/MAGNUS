import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifica la firma X-Hub-Signature-256 de Meta con el secreto de la app (comparación en tiempo constante). */
export function verifySignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header || !secret || !header.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  let got: Buffer;
  try { got = Buffer.from(header.slice(7), 'hex'); } catch { return false; }
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export type Incoming = { from: string; text: string };

/** Extrae los mensajes de texto del payload del webhook de WhatsApp Cloud API. */
export function extractTexts(payload: unknown): Incoming[] {
  const out: Incoming[] = [];
  const entries = (payload as { entry?: unknown[] })?.entry;
  if (!Array.isArray(entries)) return out;
  for (const e of entries) for (const c of ((e as { changes?: unknown[] })?.changes ?? [])) {
    const msgs = (c as { value?: { messages?: unknown[] } })?.value?.messages;
    if (!Array.isArray(msgs)) continue;
    for (const m of msgs as { from?: string; type?: string; text?: { body?: string } }[]) {
      if (m?.type === 'text' && typeof m.from === 'string' && /^\d{7,15}$/.test(m.from) && typeof m.text?.body === 'string') out.push({ from: m.from, text: m.text.body.slice(0, 500) });
    }
  }
  return out;
}
