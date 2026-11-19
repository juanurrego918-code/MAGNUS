/** Formatos de Colombia: $ 1.234.567 · dd/mm/aaaa · 24 h. */
export function cop(n: number | null | undefined): string {
  return '$ ' + Math.round(n ?? 0).toLocaleString('es-CO');
}
export function num(n: number | null | undefined): string {
  return Math.round(n ?? 0).toLocaleString('es-CO');
}
export function fecha(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
export function diasHasta(iso: string, hoy: Date = new Date()): number {
  const a = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
  const b = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return Math.round((a - b) / 864e5);
}
