import { cn } from '@/lib/utils';

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-type-normal/20 border-type-normal/40 text-type-normal',
  fire: 'bg-type-fire/20 border-type-fire/40 text-type-fire',
  water: 'bg-type-water/20 border-type-water/40 text-type-water',
  electric: 'bg-type-electric/20 border-type-electric/40 text-type-electric',
  grass: 'bg-type-grass/20 border-type-grass/40 text-type-grass',
  ice: 'bg-type-ice/20 border-type-ice/40 text-type-ice',
  fighting: 'bg-type-fighting/20 border-type-fighting/40 text-type-fighting',
  poison: 'bg-type-poison/20 border-type-poison/40 text-type-poison',
  ground: 'bg-type-ground/20 border-type-ground/40 text-type-ground',
  flying: 'bg-type-flying/20 border-type-flying/40 text-type-flying',
  psychic: 'bg-type-psychic/20 border-type-psychic/40 text-type-psychic',
  bug: 'bg-type-bug/20 border-type-bug/40 text-type-bug',
  rock: 'bg-type-rock/20 border-type-rock/40 text-type-rock',
  ghost: 'bg-type-ghost/20 border-type-ghost/40 text-type-ghost',
  dragon: 'bg-type-dragon/20 border-type-dragon/40 text-type-dragon',
  dark: 'bg-type-dark/20 border-type-dark/40 text-type-dark',
  steel: 'bg-type-steel/20 border-type-steel/40 text-type-steel',
  fairy: 'bg-type-fairy/20 border-type-fairy/40 text-type-fairy',
};

export function TypePill({ type }: { type?: string | null }) {
  if (!type) return null;
  const key = type.toLowerCase();
  const style = TYPE_COLORS[key] ?? TYPE_COLORS.normal;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm',
        style
      )}
    >
      {key}
    </span>
  );
}

export function TypePillList({ types }: { types: Array<string | null | undefined> }) {
  if (!types?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {types.map((entry, idx) => (
        <TypePill key={`${entry ?? 'unknown'}-${idx}`} type={entry ?? undefined} />
      ))}
    </div>
  );
}

