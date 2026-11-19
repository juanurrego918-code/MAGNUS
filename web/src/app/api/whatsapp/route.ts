import { NextResponse } from 'next/server';
import { answer } from '@/lib/answer';
import { extractTexts, verifySignature } from '@/lib/whatsapp';

// Variables (solo nombres; los valores los entrega el dueño): WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, SITE_URL
export async function GET(req: Request) {
  const u = new URL(req.url); const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) return new NextResponse('WhatsApp no está configurado', { status: 503 });
  if (u.searchParams.get('hub.mode') === 'subscribe' && u.searchParams.get('hub.verify_token') === token) return new NextResponse(u.searchParams.get('hub.challenge') ?? '', { status: 200 });
  return new NextResponse('Prohibido', { status: 403 });
}

export async function POST(req: Request) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return new NextResponse('WhatsApp no está configurado', { status: 503 });
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'), secret)) return new NextResponse('Firma no válida', { status: 401 });
  let payload: unknown;
  try { payload = JSON.parse(raw); } catch { return new NextResponse('JSON no válido', { status: 400 }); }
  const token = process.env.WHATSAPP_TOKEN, phone = process.env.WHATSAPP_PHONE_ID, site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  for (const m of extractTexts(payload).slice(0, 5)) {
    if (!token || !phone) continue;
    const r = await answer(m.text);
    const links = (r.links ?? []).map((l) => `${l.label}: ${site}${l.href}`).join('\n');
    await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(phone)}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: m.from, type: 'text', text: { body: (r.text + (links ? `\n\n${links}` : '')).slice(0, 1500) } }),
    }).catch(() => undefined);
  }
  return new NextResponse('ok', { status: 200 });
}
