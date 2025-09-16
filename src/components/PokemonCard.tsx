"use client";

import Link from "next/link";
import { useMemo } from "react";
import clsx from "clsx";
import TypeBadge from "./TypeBadge";
import { getPokemonMainPageImage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { PokeballLink } from "./TransitionLink";
import LinkWithTransition from "./LinkWithTransition";

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
  isInComparison = false,
  onToggleComparison,
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
  cardSize?: 'cozy' | 'compact' | 'ultra' | 'list';
  isInComparison?: boolean;
  onToggleComparison?: (id: number) => void;
}) {
  const title = `${formatPokemonName(pokemon.name)}${pokemon.id === 0 ? '' : ` #${String(pokemon.id).padStart(4, "0")}`}`;
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

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleComparison) {
      onToggleComparison(pokemon.id);
    }
  };

  return (
    <LinkWithTransition href={`/pokemon/${pokemon.id}`} transitionType="shared-element">
      <div
        aria-label={title}
        className={clsx(
          "group relative rounded-2xl border border-border bg-surface shadow-card transition cursor-pointer text-text",
          "hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-poke-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          mode === "grid"
            ? "overflow-hidden flex flex-col"
            : "grid grid-cols-[minmax(140px,200px)_1fr] gap-4 overflow-hidden",
          isSelected && "ring-2 ring-poke-blue ring-offset-2"
        )}
        style={{
          ...gradient
        }}
      >
      {/* Type accent bar (top) */}
      <div
        className="h-1.5 w-full rounded-t-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      {/* First row - absolutely positioned */}
      <div className="absolute top-1 left-1 right-1 z-20 flex items-center justify-between">
        {/* Pokemon number - avoid backdrop blur on very small views to not obscure sprite */}
        {pokemon.id !== 0 && (
          <span className="text-xs text-muted font-mono bg-white/90 dark:bg-black/40 px-2 py-1 rounded sm:backdrop-blur shadow-sm">
            #{String(pokemon.id).padStart(4, "0")}
          </span>
        )}
        
        {/* Comparison button */}
        {onToggleComparison && (
          <button
            onClick={handleComparisonClick}
            className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 border flex items-center gap-1.5",
              isInComparison 
                ? 'bg-poke-blue text-white border-poke-blue shadow-md' 
                : 'bg-white/90 dark:bg-black/40 text-gray-500 border-gray-200 hover:bg-poke-blue hover:text-white hover:border-poke-blue sm:backdrop-blur'
            )}
            aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
          >
            <Scale className={`h-3 w-3 ${isInComparison ? 'fill-current' : ''}`} />
            <span className="text-xs">{isInComparison ? 'Remove' : 'Compare'}</span>
          </button>
        )}
      </div>

      {/* Favorite heart */}
      <button
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          onToggleFavorite(pokemon.id);
        }}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={clsx(
          "absolute right-1 top-1 z-10 rounded-full bg-white/90 dark:bg-black/40 p-2 shadow sm:backdrop-blur",
          "transition transform hover:scale-110",
          isFavorite && "ring-2 ring-poke-red"
        )}
      >
        {isFavorite ? "❤️" : "♡"}
      </button>

      {/* Artwork - large but fully visible */}
      <div
        className={clsx(
          "bg-white/60 dark:bg-white/5 flex items-center justify-center rounded-t-2xl flex-1 min-h-0 overflow-visible",
          mode === "grid" ? "w-full" : "w-full"
        )}
        style={{
          minHeight: mode === "grid" ? "55%" : "auto",
          padding: mode === "grid" ? "16px" : "12px"
        }}
      >
        <img
          src={img}
          alt={formatPokemonName(pokemon.name)}
          loading="lazy"
          width={512}
          height={512}
          className={clsx(
            "mx-auto max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-300",
            "group-hover:scale-[1.04]"
          )}
          style={{
            maxHeight: "calc(100% - 32px)",
            maxWidth: "calc(100% - 32px)",
            viewTransitionName: `pokemon-sprite-${pokemon.id}`
          }}
          onError={(e) => {
            e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
          }}
        />
      </div>

      {/* Info - Absolutely positioned at bottom */}
      <div className={clsx(
        "absolute bottom-1 left-1 right-1 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-sm flex-shrink-0",
        mode === "list" && "pr-3 sm:pr-5"
      )}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className={clsx(
            "capitalize font-semibold tracking-tight text-text text-center w-full",
            cardSize === 'cozy' ? "text-sm sm:text-base lg:text-lg" : 
            cardSize === 'compact' ? "text-xs sm:text-sm lg:text-base" : 
            "text-xs sm:text-sm"
          )}>
            {formatPokemonName(pokemon.name)}
          </h3>
        </div>

        <div className="mt-1 sm:mt-1.5 flex flex-wrap gap-1 sm:gap-1.5 justify-center">
          {types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
      </div>
    </LinkWithTransition>
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
