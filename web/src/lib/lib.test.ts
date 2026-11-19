import { describe, expect, it } from 'vitest';
import { cop, diasHasta, fecha, num } from './format';
import { canSee, canSeeCosts, homeFor, navFor } from './roles';
import { safeTerm } from './search';

describe('formato Colombia', () => {
  it('moneda con punto de miles', () => { expect(cop(1234567)).toBe('$ 1.234.567'); expect(cop(null)).toBe('$ 0'); });
  it('número', () => expect(num(1840)).toBe('1.840'));
  it('fecha dd/mm/aaaa', () => { expect(fecha('2026-11-17')).toBe('17/11/2026'); expect(fecha(null)).toBe('—'); });
  it('días hasta', () => expect(diasHasta('2026-11-27', new Date(2026, 10, 17))).toBe(10));
});
describe('roles', () => {
  it('solo el dueño ve costos', () => {
    expect(canSeeCosts('dueno')).toBe(true);
    for (const r of ['vendedor', 'mostrador', 'caja', 'bodega', 'conductor', 'empleado'] as const) expect(canSeeCosts(r)).toBe(false);
  });
  it('cada rol ve solo su menú', () => {
    expect(canSee('vendedor', '/historial')).toBe(false);
    expect(canSee('bodega', '/clientes')).toBe(false);
    expect(canSee('dueno', '/historial')).toBe(true);
    expect(navFor('empleado').map((i) => i.href)).toEqual(['/marcar', '/solicitudes', '/desprendibles']);
    expect(homeFor('empleado')).toBe('/marcar');
    expect(homeFor('mostrador')).toBe('/mostrador');
    expect(homeFor('dueno')).toBe('/panel');
  });
});
describe('búsqueda segura', () => {
  it('quita caracteres de filtro', () => expect(safeTerm('a%b,c(d)*e\\f')).toBe('a b c d e f'));
  it('limita largo', () => expect(safeTerm('x'.repeat(200)).length).toBe(60));
});

describe('menú Fase 02', () => {
  it('cada rol llega a su pantalla de trabajo', () => {
    expect(canSee('vendedor', '/pedidos/nuevo')).toBe(true);
    expect(canSee('bodega', '/alistar')).toBe(true);
    expect(canSee('caja', '/caja')).toBe(true);
    expect(canSee('vendedor', '/caja')).toBe(false);
    expect(canSee('bodega', '/caja')).toBe(false);
    expect(canSee('caja', '/alistar')).toBe(false);
    expect(homeFor('vendedor')).toBe('/pedidos');
    expect(homeFor('bodega')).toBe('/alistar');
    expect(homeFor('caja')).toBe('/caja');
  });
});

describe('menú Fase 03', () => {
  it('el conductor solo ve turno y entregas', () => {
    expect(navFor('conductor').map((i) => i.href).slice(0, 2)).toEqual(['/turno', '/entregas']);
    expect(canSee('conductor', '/entregas/12')).toBe(true);
    expect(canSee('conductor', '/clientes')).toBe(false);
    expect(canSee('conductor', '/domicilios')).toBe(false);
    expect(homeFor('conductor')).toBe('/turno');
  });
  it('solo el dueño asigna domicilios', () => {
    expect(canSee('dueno', '/domicilios')).toBe(true);
    for (const r of ['vendedor', 'caja', 'bodega', 'mostrador'] as const) expect(canSee(r, '/domicilios')).toBe(false);
  });
});

import { hoyBogota, horaBogota, quincenaAnterior, quincenaDe } from './quincena';
describe('menú Fase 04', () => {
  it('el personal marca asistencia; solo el dueño ve equipo y nómina', () => {
    for (const r of ['vendedor', 'caja', 'bodega', 'conductor', 'empleado'] as const) {
      expect(canSee(r, '/marcar')).toBe(true);
      expect(canSee(r, '/desprendibles')).toBe(true);
      expect(canSee(r, '/nomina')).toBe(false);
      expect(canSee(r, '/equipo')).toBe(false);
    }
    expect(canSee('dueno', '/nomina')).toBe(true);
    expect(canSee('dueno', '/equipo')).toBe(true);
    expect(canSee('mostrador', '/marcar')).toBe(false);
    expect(canSee('mostrador', '/caja')).toBe(false);
    expect(canSee('vendedor', '/reportes')).toBe(false);
    expect(canSee('caja', '/cotizaciones')).toBe(true);
    expect(canSee('dueno', '/reportes')).toBe(true);
  });
});
describe('quincenas', () => {
  it('primera y segunda quincena', () => {
    expect(quincenaDe('2026-11-15')).toEqual({ start: '2026-11-01', end: '2026-11-15' });
    expect(quincenaDe('2026-11-16')).toEqual({ start: '2026-11-16', end: '2026-11-30' });
    expect(quincenaDe('2026-02-20')).toEqual({ start: '2026-02-16', end: '2026-02-28' });
    expect(quincenaDe('2028-02-20')).toEqual({ start: '2028-02-16', end: '2028-02-29' });
  });
  it('quincena anterior', () => {
    expect(quincenaAnterior({ start: '2026-11-16', end: '2026-11-30' })).toEqual({ start: '2026-11-01', end: '2026-11-15' });
    expect(quincenaAnterior({ start: '2026-01-01', end: '2026-01-15' })).toEqual({ start: '2025-12-16', end: '2025-12-31' });
  });
  it('fecha y hora de Bogotá', () => {
    expect(hoyBogota(new Date('2026-11-20T03:00:00Z'))).toBe('2026-11-19');
    expect(horaBogota('2026-11-19T20:30:00Z')).toBe('15:30');
    expect(horaBogota(null)).toBe('—');
  });
});

import { parseCsv, rowsToProducts, toCsv } from './csv';
import { detectIntent } from './chatbot';
describe('csv', () => {
  it('lee comillas, saltos y separador ;', () => {
    expect(parseCsv('a,b\n"x,1","y ""z"""\n')).toEqual([['a', 'b'], ['x,1', 'y "z"']]);
    expect(parseCsv('a;b\n1;2\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('neutraliza fórmulas al exportar', () => {
    expect(toCsv([['=CMD()', 5, '-3']])).toContain("'=CMD()");
    expect(toCsv([['=CMD()', 5, '-3']])).toContain(",5,");
    expect(toCsv([['a,b']])).toContain('"a,b"');
  });
  it('agrupa presentaciones por producto', () => {
    const r = rowsToProducts(parseCsv('Código,Nombre,Categoría,Presentación,Unidades,Precio,Costo\nGR-0101,Arroz,Granos,Unidad,1,"2.350",1780\nGR-0101,Arroz,Granos,Paca,25,56500,1780\n'));
    expect(r.products).toHaveLength(1);
    expect(r.products[0].presentations).toEqual([{ name: 'Unidad', units: 1, price: 2350 }, { name: 'Paca', units: 25, price: 56500 }]);
    expect(r.products[0].cost).toBe(1780);
    expect(rowsToProducts(parseCsv('a,b\n1,2')).error).toMatch(/Faltan columnas/);
  });
});
describe('asistente', () => {
  it('detecta intenciones', () => {
    expect(detectIntent('Hola').intent).toBe('saludo');
    expect(detectIntent('¿Tienen arroz?').intent).toBe('producto');
    expect(detectIntent('¿Tienen arroz?').term).toBe('arroz');
    expect(detectIntent('receta de arroz con pollo')).toEqual({ intent: 'receta', term: 'arroz con pollo' });
    expect(detectIntent('hacen domicilio?').intent).toBe('domicilio');
    expect(detectIntent('quiero ser cliente').intent).toBe('pedido');
    expect(detectIntent('xyz').intent).toBe('ayuda');
  });
});

import { createHmac } from 'node:crypto';
import { extractTexts, verifySignature } from './whatsapp';
import { slugify } from './slug';
describe('whatsapp', () => {
  const secret = 's3cret', body = '{"a":1}';
  const sig = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  it('verifica la firma de Meta', () => {
    expect(verifySignature(body, sig, secret)).toBe(true);
    expect(verifySignature(body + ' ', sig, secret)).toBe(false);
    expect(verifySignature(body, 'sha256=00', secret)).toBe(false);
    expect(verifySignature(body, null, secret)).toBe(false);
    expect(verifySignature(body, sig, '')).toBe(false);
  });
  it('extrae solo mensajes de texto válidos', () => {
    const p = { entry: [{ changes: [{ value: { messages: [{ from: '573001112233', type: 'text', text: { body: 'hola' } }, { from: 'x', type: 'text', text: { body: 'malo' } }, { from: '573001112233', type: 'image' }] } }] }] };
    expect(extractTexts(p)).toEqual([{ from: '573001112233', text: 'hola' }]);
    expect(extractTexts(null)).toEqual([]);
  });
});
describe('slug', () => { it('limpia acentos y símbolos', () => { expect(slugify('Arroz con Pollo ¡Fácil!')).toBe('arroz-con-pollo-facil'); }); });
