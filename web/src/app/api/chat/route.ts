import { NextResponse } from 'next/server';
import { answer } from '@/lib/answer';

const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 20;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'x';
  if (limited(ip)) return NextResponse.json({ text: 'Demasiados mensajes seguidos. Intente de nuevo en un minuto.' }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ text: 'Mensaje no válido.' }, { status: 400 }); }
  const message = (body as { message?: unknown })?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 300) return NextResponse.json({ text: 'Escriba un mensaje de hasta 300 caracteres.' }, { status: 400 });
  return NextResponse.json(await answer(message), { headers: { 'Cache-Control': 'no-store' } });
}
