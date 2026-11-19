'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, Boxes, Users, History, ShoppingCart, Receipt, PackageCheck, type LucideIcon } from 'lucide-react';
import type { NavItem } from '@/lib/roles';

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard, 'book-open': BookOpen, boxes: Boxes, users: Users, history: History,
  'shopping-cart': ShoppingCart, receipt: Receipt, 'package-check': PackageCheck,
};

export function Nav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Principal">
      {items.map((i) => {
        const Icon = ICONS[i.icon] ?? BookOpen;
        const active = path === i.href || path.startsWith(i.href + '/');
        return <Link key={i.href} href={i.href} aria-current={active ? 'page' : undefined}><Icon size={18} aria-hidden />{i.label}</Link>;
      })}
    </nav>
  );
}
