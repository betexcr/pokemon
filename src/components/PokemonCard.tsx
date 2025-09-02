"use client";

import Link from "next/link";
import { useMemo } from "react";
import clsx from "clsx";
import TypeBadge from "./TypeBadge";
import { getPokemonMainPageImage } from "@/lib/api";
import { useRouter } from "next/navigation";

/**
 * Polished Pokédex card
 * - Consistent layout & aspect ratio
 * - Type-colored accent bar + subtle gradient
 * - Favorite toggle stored in localStorage
 * - Accessible labels, no CLS (fixed artwork box)
 */
export default function PokemonCard({
  pokemon,
  isFavorite,
  onToggleFavorite,
  onSelect,
  isSelected,
  mode = "grid", // "grid" | "list" (list uses wider image row)
  cardSize = 'compact',
}: {
  pokemon: {
    id: number;
    name: string;
    types: Array<{ type: { name: string } }>;
  };
  isFavorite: boolean;
  onToggleFavorite: (id: number) => void;
  onSelect?: (pokemon: { id: number; name: string; types: Array<{ type: { name: string } }> }) => void;
  isSelected?: boolean;
  mode?: "grid" | "list";
  cardSize?: 'cozy' | 'compact' | 'ultra';
}) {
  const title = `${formatPokemonName(pokemon.name)} #${String(pokemon.id).padStart(4, "0")}`;
  const img = getPokemonMainPageImage(pokemon.id);
  const types = pokemon.types.map(t => t.type.name);

  // primary type color -> use as accent + gradient
  const primaryType = types[0]?.toLowerCase() || "normal";
  const accent = `var(--type-${primaryType})`;
  const gradient = useMemo(
    () => ({
      background:
        mode === "grid"
          ? `linear-gradient(180deg, color-mix(in oklab, ${accent} 12%, transparent) 0%, transparent 60%)`
          : undefined,
    }),
    [accent, mode]
  );

  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (onSelect) {
      onSelect(pokemon);
    } else {
      // Navigate to detail page
      router.push(`/pokemon/${pokemon.id}`);
    }
  };

  return (
    <Link
      href={`/pokemon/${pokemon.id}`}
      aria-label={title}
      onClick={handleClick}
      className={clsx(
        "group relative rounded-2xl border border-border bg-surface shadow-card transition no-underline text-text",
        "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poke-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        mode === "grid"
          ? "overflow-hidden"
          : "grid grid-cols-[minmax(140px,200px)_1fr] gap-4 overflow-hidden",
        isSelected && "ring-2 ring-poke-blue ring-offset-2"
      )}
      style={{
        ...gradient,
        viewTransitionName: onSelect ? undefined : `pokemon-${pokemon.id}`
      }}
    >
      {/* Type accent bar (top) */}
      <div
        className="h-1.5 w-full rounded-t-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      {/* Favorite heart */}
      <button
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          onToggleFavorite(pokemon.id);
        }}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={clsx(
          "absolute right-3 top-3 z-10 rounded-full bg-white/90 dark:bg-black/40 backdrop-blur p-2 shadow",
          "transition transform hover:scale-110",
          isFavorite && "ring-2 ring-poke-red"
        )}
      >
        {isFavorite ? "❤️" : "♡"}
      </button>

      {/* Artwork */}
      <div
        className={clsx(
          "bg-white/60 dark:bg-white/5 flex items-center justify-center",
          mode === "grid" 
            ? (cardSize === 'cozy' ? 'art-cozy-grid' : cardSize === 'compact' ? 'art-compact-grid' : 'art-ultra-grid')
            : (cardSize === 'cozy' ? 'art-cozy-list' : cardSize === 'compact' ? 'art-compact-list' : 'art-ultra-list')
        )}
      >
        <img
          src={img}
          alt={formatPokemonName(pokemon.name)}
          loading="lazy"
          width={512}
          height={512}
          className={clsx(
            "mx-auto h-auto w-auto max-h-full max-w-full object-contain transition-transform duration-300",
            "group-hover:scale-[1.04]",
            cardSize === 'cozy' ? "p-4" : cardSize === 'compact' ? "p-3.5" : "p-3"
          )}
          onError={(e) => {
            e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
          }}
        />
      </div>

      {/* Info */}
      <div className={clsx(
        "p-4",
        mode === "list" && "pr-5"
      )}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={clsx(
            "capitalize font-semibold tracking-tight text-text",
            cardSize === 'cozy' ? "text-base sm:text-lg" : cardSize === 'compact' ? "text-sm sm:text-base" : "text-sm"
          )}>
            {formatPokemonName(pokemon.name)}
          </h3>
          <span className="text-xs text-muted font-mono">
            #{String(pokemon.id).padStart(4, "0")}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </Link>
  );
}

// Helper function
function formatPokemonName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
}

// Skeleton loading component
export function PokemonCardSkeleton({ density = 'comfy' }: { density?: 'comfy' | 'compact' }) {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-surface">
      <div className="h-1.5 w-full rounded-t-2xl bg-border/40" />
      <div className="aspect-square bg-border/40" />
      <div className={clsx(
        "p-4 space-y-3",
        density === 'compact' ? "p-3" : "p-4"
      )}>
        <div className="flex items-baseline justify-between">
          <div className="h-5 w-2/3 bg-border/60 rounded" />
          <div className="h-3 w-1/4 bg-border/50 rounded" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-border/50 rounded-full" />
          <div className="h-6 w-12 bg-border/50 rounded-full" />
        </div>
      </div>
    </div>
  )
}
