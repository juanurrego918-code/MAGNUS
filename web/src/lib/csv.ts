/** CSV mínimo y seguro: lectura con comillas y escritura que neutraliza fórmulas de Excel (=, +, -, @). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  const src = text.replace(/^﻿/, '');
  const delim = (src.split('\n')[0] ?? '').split(';').length > (src.split('\n')[0] ?? '').split(',').length ? ';' : ',';
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  return rows;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && typeof v !== 'number') s = "'" + s;
    return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  return '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
}

export type ImportRow = { code: string; ean?: string; name: string; brand?: string; category: string; min_units: number; cost: number; presentations: { name: string; units: number; price: number }[] };

/** Columnas: codigo, ean, nombre, marca, categoria, minimo, costo, presentacion, unidades, precio (una fila por presentación). */
export function rowsToProducts(rows: string[][]): { products: ImportRow[]; error?: string } {
  if (rows.length < 2) return { products: [], error: 'El archivo está vacío.' };
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const head = rows[0].map(norm);
  const idx = (n: string) => head.indexOf(n);
  const need = ['codigo', 'nombre', 'categoria', 'presentacion', 'unidades', 'precio'];
  const missing = need.filter((n) => idx(n) < 0);
  if (missing.length) return { products: [], error: `Faltan columnas: ${missing.join(', ')}.` };
  const num = (v: string | undefined) => Number(String(v ?? '').replace(/[$\s]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || 0;
  const map = new Map<string, ImportRow>();
  for (const r of rows.slice(1)) {
    const g = (n: string) => (idx(n) >= 0 ? (r[idx(n)] ?? '').trim() : '');
    const code = g('codigo').toUpperCase();
    let p = map.get(code);
    if (!p) { p = { code, ean: g('ean') || undefined, name: g('nombre'), brand: g('marca') || undefined, category: g('categoria'), min_units: Math.round(num(g('minimo'))), cost: num(g('costo')), presentations: [] }; map.set(code, p); }
    p.presentations.push({ name: g('presentacion'), units: Math.round(num(g('unidades'))), price: num(g('precio')) });
  }
  return { products: [...map.values()] };
}
