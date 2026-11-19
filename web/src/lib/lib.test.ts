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
    expect(navFor('conductor')).toEqual([]);
    expect(homeFor('conductor')).toBe('/sin-acceso');
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
