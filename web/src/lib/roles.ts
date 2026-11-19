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
    { href: '/cotizaciones', label: 'Cotizaciones', icon: 'file-text' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
    { href: '/inventario', label: 'Inventario por lotes', icon: 'boxes' },
    { href: '/clientes', label: 'Clientes', icon: 'users' },
    { href: '/domicilios', label: 'Domicilios', icon: 'truck' },
    { href: '/equipo', label: 'Equipo', icon: 'user-check' },
    { href: '/nomina', label: 'Nómina', icon: 'wallet' },
    { href: '/reportes', label: 'Reportes', icon: 'bar-chart' },
    { href: '/sitio', label: 'Sitio web', icon: 'globe' },
    { href: '/historial', label: 'Historial', icon: 'history' },
  ],
  vendedor: [
    { href: '/pedidos', label: 'Pedidos', icon: 'shopping-cart' },
    { href: '/cotizaciones', label: 'Cotizaciones', icon: 'file-text' },
    { href: '/catalogo', label: 'Catálogo', icon: 'book-open' },
    { href: '/clientes', label: 'Clientes', icon: 'users' },
  ],
  mostrador: [{ href: '/mostrador', label: 'Pedido en tienda', icon: 'monitor' }],
  caja: [
    { href: '/caja', label: 'Cobrar y cartera', icon: 'receipt' },
    { href: '/cotizaciones', label: 'Cotizaciones', icon: 'file-text' },
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

/** Todo el personal con ficha de empleado marca asistencia, pide permisos y ve sus desprendibles. */
const SELF: NavItem[] = [
  { href: '/marcar', label: 'Marcar asistencia', icon: 'alarm-clock' },
  { href: '/solicitudes', label: 'Mis solicitudes', icon: 'file-text' },
  { href: '/desprendibles', label: 'Mis pagos', icon: 'wallet' },
];
const STAFF: Role[] = ['vendedor', 'caja', 'bodega', 'conductor', 'empleado'];
const items = (role: Role): NavItem[] => (STAFF.includes(role) ? [...NAV[role], ...SELF] : NAV[role]);

export function navFor(role: Role): NavItem[] { return items(role); }
export function homeFor(role: Role): string { return items(role)[0]?.href ?? '/sin-acceso'; }
export function canSee(role: Role, path: string): boolean {
  return items(role).some((i) => path === i.href || path.startsWith(i.href + '/'));
}
export function canSeeCosts(role: Role): boolean { return role === 'dueno'; }
