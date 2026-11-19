/** Quincenas colombianas: del 1 al 15 y del 16 al último día del mes. Fechas en texto aaaa-mm-dd. */
export type Quincena = { start: string; end: string };

const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate(); // m = 1..12

export function quincenaDe(iso: string): Quincena {
  const y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
  return d <= 15
    ? { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-15` }
    : { start: `${y}-${pad(m)}-16`, end: `${y}-${pad(m)}-${pad(lastDay(y, m))}` };
}
export function quincenaAnterior(q: Quincena): Quincena {
  const y = +q.start.slice(0, 4), m = +q.start.slice(5, 7);
  if (q.start.endsWith('-16')) return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-15` };
  const py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1;
  return { start: `${py}-${pad(pm)}-16`, end: `${py}-${pad(pm)}-${pad(lastDay(py, pm))}` };
}
export function hoyBogota(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
}
export function horaBogota(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour12: false, hour: '2-digit', minute: '2-digit' });
}
