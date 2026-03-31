import { TYPE_COLORS, type TypeName } from '@/lib/type/data';

// Server component: renders a color-consistent badge for a type
export default function TypeBadge({ type, className = '', as = 'span', withIcon = true }: { type: TypeName; className?: string; as?: 'span' | 'div' | 'button'; withIcon?: boolean }) {
  const color = TYPE_COLORS[type];
  const Comp: React.ElementType = as;
  return (
    <Comp
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium shadow-sm text-gray-900 dark:text-gray-100 ${className}`}
      style={{ backgroundColor: color + '26', borderColor: color + '66' }}
      aria-label={`Type ${type}`}
    >
      {withIcon && <span aria-hidden>{iconFor(type)}</span>}
      <span>{type}</span>
    </Comp>
  );
}

function iconFor(type: TypeName) {
  const m: Record<TypeName, string> = {
    Normal: '🔘', Fire: '🔥', Water: '💧', Grass: '🌿', Electric: '⚡', Ice: '❄️', Fighting: '🥊', Poison: '☠️', Ground: '⛰️', Flying: '🕊️', Psychic: '🔮', Bug: '🐛', Rock: '🪨', Ghost: '👻', Dragon: '🐉', Dark: '🌑', Steel: '⚙️', Fairy: '✨',
  } as const;
  return m[type];
}
