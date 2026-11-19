import { CircleCheck, CircleX, ClockAlert, TriangleAlert, CircleMinus, type LucideIcon } from 'lucide-react';

type Kind = 'ok' | 'bajo' | 'vence' | 'agotado' | 'inactivo';
const MAP: Record<Kind, { label: string; tone: string; Icon: LucideIcon }> = {
  ok: { label: 'Correcto', tone: 'ok', Icon: CircleCheck },
  bajo: { label: 'Bajo mínimo', tone: 'warn', Icon: TriangleAlert },
  vence: { label: 'Por vencer', tone: 'warn', Icon: ClockAlert },
  agotado: { label: 'Agotado', tone: 'err', Icon: CircleX },
  inactivo: { label: 'Inactivo', tone: 'mute', Icon: CircleMinus },
};

/** Estado siempre con color + ícono + texto (nunca solo color). */
export function Chip({ kind, label }: { kind: Kind; label?: string }) {
  const { label: l, tone, Icon } = MAP[kind];
  return <span className={`chip ${tone}`}><Icon size={14} aria-hidden />{label ?? l}</span>;
}
