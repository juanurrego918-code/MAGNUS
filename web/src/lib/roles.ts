export type Role = 'dueno' | 'vendedor' | 'mostrador' | 'caja' | 'bodega' | 'conductor' | 'empleado';

export const ROLE_LABEL: Record<Role, string> = {
  dueno: 'Dueño / administración', vendedor: 'Vendedor', mostrador: 'Mostrador', caja: 'Caja',
  bodega: 'Bodega', conductor: 'Conductor', empleado: 'Empleado',
};

export type NavItem = { href: string; label: string; icon: string };

/** Menú por rol: cada uno ve solo lo suyo. La seguridad real está en RLS; esto es solo navegación. */
const NAV: Record<Role, NavItem[]> = {
  dueno: [
    { href: '/panel', label: 'Panel general', icon: 'layout-dashboard' },
    { href: '/pedidos', label: 'Pedidos', icon: 'shopping-cart' },
    { href: '/alistar', label: 'Pedidos por alistar', icon: 'package-check' },
    { href: '/caja', label: 'Cobrar y cartera', icon: 'receipt' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
    { href: '/inventario', label: 'Inventario por lotes', icon: 'boxes' },
    { href: '/clientes', label: 'Clientes', icon: 'users' },
    { href: '/domicilios', label: 'Domicilios', icon: 'truck' },
    { href: '/historial', label: 'Historial', icon: 'history' },
  ],
  vendedor: [
    { href: '/pedidos', label: 'Pedidos', icon: 'shopping-cart' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
    { href: '/clientes', label: 'Clientes', icon: 'users' },
  ],
  mostrador: [{ href: '/catalogo', label: 'Catálogo', icon: 'book-open' }],
  caja: [
    { href: '/caja', label: 'Cobrar y cartera', icon: 'receipt' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
    { href: '/clientes', label: 'Clientes', icon: 'users' },
  ],
  bodega: [
    { href: '/alistar', label: 'Pedidos por alistar', icon: 'package-check' },
    { href: '/inventario', label: 'Inventario por lotes', icon: 'boxes' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
  ],
  conductor: [
    { href: '/turno', label: 'Mi turno', icon: 'clock' },
    { href: '/entregas', label: 'Entregas del día', icon: 'truck' },
  ],
  empleado: [],
};

export function navFor(role: Role): NavItem[] { return NAV[role]; }
export function homeFor(role: Role): string { return NAV[role][0]?.href ?? '/sin-acceso'; }
export function canSee(role: Role, path: string): boolean {
  return NAV[role].some((i) => path === i.href || path.startsWith(i.href + '/'));
}
export function canSeeCosts(role: Role): boolean { return role === 'dueno'; }
