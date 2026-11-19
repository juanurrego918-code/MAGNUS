import { NextResponse } from 'next/server';
import { isOwnerRequest } from '@/lib/session-owner';
import { supabaseServer } from '@/lib/supabase/server';
import { toCsv } from '@/lib/csv';

export async function GET(req: Request) {
  if (!(await isOwnerRequest())) return new NextResponse('Sin permiso', { status: 403 });
  const u = new URL(req.url);
  const from = u.searchParams.get('desde') ?? '', to = u.searchParams.get('hasta') ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return new NextResponse('Fechas no válidas', { status: 400 });
  const sb = await supabaseServer();
  const kind = u.searchParams.get('tipo');
  const fn = kind === 'cliente' ? 'report_by_client' : kind === 'vendedor' ? 'report_by_seller' : 'report_by_product';
  const { data, error } = await sb.rpc(fn, { p_from: from, p_to: to });
  if (error) return new NextResponse('No se pudo generar el reporte', { status: 500 });
  const rows = (data ?? []) as Record<string, string | number>[];
  const head = rows[0] ? Object.keys(rows[0]) : [];
  const body = toCsv([head, ...rows.map((r) => head.map((h) => r[h]))]);
  return new NextResponse(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="ventas-${kind ?? 'producto'}-${from}_${to}.csv"`, 'Cache-Control': 'no-store' } });
}
