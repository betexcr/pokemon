import Link from "next/link";
import TypeBadge from "@/components/TypeBadge";
import Image from "next/image";
import { formatPokemonName } from "@/lib/utils";
import { EvolutionSkeleton } from "@/components/skeletons/PokemonDetailsSkeleton";
import { methodIcon } from "@/lib/evo/method";
import { methodToText } from "@/lib/evo/normalize";
import type { Method } from "@/lib/evo/types";

type Node = { id: number; name: string; types: string[]; condition?: string; parentId?: number | null; method?: Method };

/**
 * Evolution family as a tree: each Pokémon, then a column of what it evolves into, each behind an
 * arrow with the evolution method (same icons and wording as /evolutions/). Branches such as
 * Applin → Flapple / Appletun / Dipplin → Hydrapple read correctly instead of as one long line.
 */
export default function EvolutionSection({
  chain,
  selectedSprite = 'default',
  loading = false,
  currentId,
}: {
  chain: Node[];
  selectedSprite?: 'default' | 'shiny';
  loading?: boolean;
  currentId?: number;
}) {
  if (loading) {
    return (
      <section id="evolution" className="mx-auto w-full px-4 py-4 space-y-4 text-center">
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <EvolutionSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!chain || !chain.length) return null;

  // Older data without parent links: treat the list as a straight line
  const hasParents = chain.some((n) => n.parentId != null);
  const nodes: Node[] = hasParents ? chain : chain.map((n, i) => ({ ...n, parentId: i === 0 ? null : chain[i - 1].id }));
  const childrenOf = (id: number | null) => nodes.filter((n) => (n.parentId ?? null) === id);
  const roots = childrenOf(null);
  // Wide families (Eevee, Applin) use smaller cards so the tree stays readable
  const compact = nodes.some((n) => childrenOf(n.id).length > 2);

  const renderTree = (node: Node): JSX.Element => {
    const children = childrenOf(node.id);
    return (
      <div key={node.id} className="flex items-center">
        <EvoNodeCard node={node} selectedSprite={selectedSprite} compact={compact} isCurrent={node.id === currentId} />
        {children.length > 0 && (
          // Many branches (Eevee) go in a grid instead of one very tall column
          <div className={children.length > 3 ? 'grid grid-cols-2 gap-3 lg:grid-cols-3' : 'flex flex-col gap-3'}>
            {children.map((child) => (
              <div key={child.id} className="flex items-center">
                <MethodArrow method={child.method} fallback={child.condition} />
                {renderTree(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="evolution" className="mx-auto w-full py-4 text-center">
      {/* w-max + mx-auto: centred when it fits, fully scrollable (never clipped) when it doesn't */}
      <div className="overflow-x-auto pb-4">
        <div className="mx-auto flex w-max flex-col items-start gap-4 px-2">
          {roots.map((root) => renderTree(root))}
        </div>
      </div>
    </section>
  );
}

function MethodArrow({ method, fallback }: { method?: Method; fallback?: string }) {
  const text = method ? methodToText(method) : fallback ?? 'Evolves';
  return (
    <div className="flex w-28 flex-shrink-0 flex-col items-center gap-1 px-2 text-xs text-muted sm:w-36">
      <span
        title={text}
        className="max-w-full rounded-full border border-border bg-gray-50 px-2 py-1 leading-tight text-text dark:bg-gray-800"
      >
        <span aria-hidden>{methodIcon(method?.kind ?? 'special')}</span> <span className="align-middle">{text}</span>
      </span>
      <span aria-hidden className="text-lg leading-none">→</span>
    </div>
  );
}

function EvoNodeCard({
  node,
  selectedSprite,
  compact,
  isCurrent,
}: {
  node: Node;
  selectedSprite: 'default' | 'shiny';
  compact: boolean;
  isCurrent: boolean;
}) {
  const primaryType = node.types[0] || 'normal';
  const secondaryType = node.types[1] || null;
  const imageUrl = selectedSprite === 'shiny'
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${node.id}.png`
    : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${node.id}.png`;
  const artSize = compact ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-24 h-24 sm:w-32 sm:h-32';

  return (
    <Link href={`/pokemon/${node.id}`} className="group block flex-shrink-0" aria-current={isCurrent ? 'page' : undefined}>
      <div
        className={`relative overflow-hidden rounded-xl border bg-surface transition-all duration-200 hover:shadow-card ${isCurrent ? 'border-poke-blue ring-2 ring-poke-blue/40' : 'border-border'}`}
        style={{
          background: secondaryType
            ? `linear-gradient(180deg,
                  color-mix(in oklab, var(--type-${primaryType}) 16%, transparent) 0%,
                  color-mix(in oklab, var(--type-${secondaryType}) 16%, transparent) 60%)`
            : `linear-gradient(180deg, color-mix(in oklab, var(--type-${primaryType}) 14%, transparent) 0%, transparent 60%)`,
        }}
      >
        {/* Type accent bar */}
        <div
          className="h-1.5 w-full"
          style={secondaryType
            ? { backgroundImage: `linear-gradient(90deg, var(--type-${primaryType}) 0%, var(--type-${secondaryType}) 100%)` }
            : { backgroundColor: `var(--type-${primaryType})` }}
        />
        <div className="flex items-center justify-center p-2">
          <div className={`relative flex flex-shrink-0 items-center justify-center ${artSize}`}>
            <Image
              src={imageUrl}
              alt={formatPokemonName(node.name)}
              width={160}
              height={160}
              className="h-full w-full object-contain"
              sizes="128px"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${node.id}.png`;
              }}
            />
          </div>
        </div>
        <div className="px-2 pb-2 text-center">
          <div className="text-sm font-semibold">{formatPokemonName(node.name)}</div>
          <div className="mt-1 flex justify-center gap-1">
            {node.types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t} className="text-xs" />)}
          </div>
        </div>
      </div>
    </Link>
  );
}
