"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pokemon } from "@/types/pokemon";
import { formatPokemonName } from "@/lib/utils";
import { Scale } from "lucide-react";
import TypeBadge from "./TypeBadge";
import Tooltip from "./Tooltip";
import PokemonCardFrame from "./PokemonCardFrame";
import LazyImage from "./LazyImage";
import { PokemonCardSkeletonWithData } from "./PokemonCard";

interface ModernPokemonCardProps {
  pokemon: Pokemon;
  isInComparison: boolean;
  onToggleComparison: (id: number) => void;
  onSelect?: (pokemon: Pokemon) => void;
  isSelected?: boolean;
  className?: string;
  density?: "3cols" | "6cols" | "9cols" | "10cols" | "list";
}

export default function ModernPokemonCard({
  pokemon,
  isInComparison,
  onToggleComparison,
  onSelect,
  isSelected = false,
  className = "",
  density = "6cols",
}: ModernPokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Check if this is a skeleton Pokemon (no real data loaded yet)
  const isSkeletonPokemon = pokemon.name.startsWith('pokemon-') || (pokemon.types?.length || 0) === 0;
  const hasTypes = (pokemon.types?.length || 0) > 0;
  const hasRealName = !pokemon.name.startsWith('pokemon-');
  
  // Add a retry mechanism for Pokemon that have real names but missing types
  const needsTypeRetry = hasRealName && !hasTypes;

  // Track small viewport to decide whether to enable tooltip
  const [isSmallViewport, setIsSmallViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.matchMedia('(max-width: 640px)').matches;
    } catch {
      return false;
    }
  });
  const lastMatchRef = useRef(isSmallViewport);
  const rafRef = useRef<number | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 640px)');

    // Stable handler that only updates when value actually changes, debounced to frame
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const next = 'matches' in e ? e.matches : (e as MediaQueryList).matches;
      if (next === lastMatchRef.current) return;
      lastMatchRef.current = next;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setIsSmallViewport(next);
        rafRef.current = null;
      });
    };

    // Support both modern and legacy APIs
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', onChange as EventListener);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        mq.removeEventListener('change', onChange as EventListener);
      };
    } else if (typeof (mq as any).addListener === 'function') {
      (mq as any).addListener(onChange);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        (mq as any).removeListener(onChange);
      };
    }
  }, []);

  // Use reliable sprite URLs with fallbacks
  const primaryImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
  const fallbackImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  const animatedUrl = `https://play.pokemonshowdown.com/sprites/ani/${pokemon.id}.gif`;
  const placeholderImageUrl = "/placeholder-pokemon.png";

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(pokemon);
    }
    // If no onSelect, navigate to detail page
    if (!onSelect) {
      router.push(`/pokemon/${pokemon.id}`);
    }
  };

  const handleMouseEnter = () => {
    // Prefetch the Pokemon detail page on hover for faster navigation
    if (typeof window !== 'undefined' && !onSelect) {
      router.prefetch(`/pokemon/${pokemon.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (onSelect) {
        onSelect(pokemon);
      } else {
        router.push(`/pokemon/${pokemon.id}`);
      }
    }
  };

  const handleComparisonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleComparison(pokemon.id);
  };

  const primaryType = pokemon.types[0]?.type.name || "normal";
  const accentColor = `var(--type-${primaryType})`;
  
  // Create gradient for multiple types
  const getAccentBarStyle = () => {
    if (pokemon.types.length > 1) {
      const colors = pokemon.types.map(type => `var(--type-${type.type.name})`);
      return {
        background: `linear-gradient(to right, ${colors.join(', ')})`,
      };
    }
    return { backgroundColor: accentColor };
  };

  const tooltipContent = (
    <div className="text-left">
      <div className="font-semibold mb-1">
        {hasRealName ? formatPokemonName(pokemon.name) : `Pokemon #${pokemon.id}`}
      </div>
      <div className="flex flex-wrap gap-1 justify-start">
        {hasTypes ? (
          pokemon.types.map((t) => (
            <TypeBadge key={t.type.name} type={t.type.name} className="text-xs px-2 py-0.5" />
          ))
        ) : (
          <div className="flex gap-1">
            <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
            <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )

  // On small viewports, the name/types can be hidden by design.
  // Provide an always-available tooltip for 3cols, 6cols, and 9cols densities when footer is not visible.
  const shouldUseTooltip = (density === '3cols' || density === '6cols' || density === '9cols' || density === '10cols') && !isInfoVisible
  
  // Debug logging to understand visibility detection
  if (pokemon.name === 'bulbasaur') {
    console.log(`🔍 Bulbasaur debug - density: ${density}, isInfoVisible: ${isInfoVisible}, shouldUseTooltip: ${shouldUseTooltip}`)
  }
  


  // Visibility detection for footer (name/types)
  useEffect(() => {
    const el = infoRef.current;
    const card = cardRef.current;
    if (!el || !card || typeof window === 'undefined') return;

    let io: IntersectionObserver | null = null;

    // Determine clipped container (outer card with overflow hidden)
    const clipContainer = (el.closest('.cq-card') as HTMLElement | null) || card;

    // IntersectionObserver: check if footer is largely visible within the clipped card
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry) return;
          // Consider visible if at least 50% of footer is within the container (reduced from 95%)
          const target = entry.target as HTMLElement;
          const targetHeight = Math.max(1, target.clientHeight);
          const intersectionHeight = entry.intersectionRect.height;
          const ratio = intersectionHeight / targetHeight;
          const mostlyVisible = (entry.isIntersecting && ratio >= 0.5);
          
          // Debug logging for Bulbasaur
          if (pokemon.name === 'bulbasaur') {
            console.log(`🔍 IntersectionObserver debug - isIntersecting: ${entry.isIntersecting}, ratio: ${ratio.toFixed(2)}, mostlyVisible: ${mostlyVisible}`)
          }
          
          setIsInfoVisible(mostlyVisible);
        },
        { root: clipContainer, threshold: [0, 0.5, 0.95, 1] }
      );
      io.observe(el);
    }

    // Fallback compute using geometry and styles
    const computeVisibility = () => {
      const style = window.getComputedStyle(el);
      let visible =
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity || '1') > 0 &&
        el.offsetParent !== null &&
        el.clientHeight > 0 &&
        el.clientWidth > 0;

      if (visible) {
        const footerRect = el.getBoundingClientRect();
        const boundRect = clipContainer.getBoundingClientRect();
        const isClipped =
          footerRect.bottom > boundRect.bottom ||
          footerRect.top < boundRect.top ||
          footerRect.left < boundRect.left ||
          footerRect.right > boundRect.right;
        const hasVisibleContent = el.scrollHeight > 0 && el.scrollWidth > 0;
        visible = visible && !isClipped && hasVisibleContent;
      }

      // Only update state if IntersectionObserver is not available
      if (!io) setIsInfoVisible(visible);
    };

    computeVisibility();

    const ResizeObs = (window as any).ResizeObserver;
    const ro = ResizeObs && !io
      ? new ResizeObs(() => {
          if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            computeVisibility();
            rafRef.current = null;
          });
        })
      : null;
    if (ro) {
      ro.observe(el);
      ro.observe(card);
      if (clipContainer) ro.observe(clipContainer);
    }

    const onWin = () => {
      // Only use geometry method if IntersectionObserver is not available
      if (!io) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          computeVisibility();
          rafRef.current = null;
        });
      }
    };
    window.addEventListener('resize', onWin);

    return () => {
      window.removeEventListener('resize', onWin);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
    };
  }, [density]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [pokemon.id]);

  // Retry loading for Pokemon that have real names but missing types
  useEffect(() => {
    if (needsTypeRetry) {
      // Trigger a re-render by dispatching a custom event that the viewport loading hook can listen to
      const event = new CustomEvent('pokemon-type-retry', { 
        detail: { pokemonId: pokemon.id } 
      });
      window.dispatchEvent(event);
    }
  }, [needsTypeRetry, pokemon.id]);

  // Compute container style: ensure stable layout to prevent jumpiness
  const containerStyle: React.CSSProperties = {
    height: 'auto',
    minHeight: 'fit-content',
    // Add CSS containment for better performance
    contain: 'layout style paint',
    // Add transform3d to enable hardware acceleration
    transform: 'translateZ(0)',
  };

  const artWrapperStyle = useMemo<React.CSSProperties>(() => {
    const top = density === '3cols' ? 40 : density === '6cols' ? 36 : 32
    const bottom = density === '3cols' ? 60 : 8
    return {
      width: '100%',
      marginTop: `${top}px`,
      marginBottom: `${bottom}px`,
      borderRadius: '0.5rem',
    }
  }, [density])

  // Always render the actual card structure - no more skeleton cards

  return (
    <PokemonCardFrame
      onClick={handleClick}
      className={className}
      density={density}
      isSelected={isSelected}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      aria-label={`View details for ${formatPokemonName(pokemon.name)}`}
      data-pokemon-id={pokemon.id}
      forceSquare={false}
    >
      {/* Type accent bar */}
      <div
        className="h-1 w-full"
        style={getAccentBarStyle()}
        aria-hidden="true"
      />

      {/* Card content */}
      {density === "list" ? (
        // List layout - clean horizontal list item
        <div className="flex items-center w-full">
          {/* Pokémon Image */}
          <div
            className="relative mr-3 sm:mr-4 w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-lg overflow-hidden"
          >
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-slate-200/80 dark:bg-slate-800/60">
                <div className="w-6 h-6 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                <span className="sr-only">Loading Pokémon artwork</span>
              </div>
            )}

            {/* Pokémon Image */}
            <LazyImage
              className="relative z-10 flex h-full w-full items-center justify-center"
              srcList={[primaryImageUrl, fallbackImageUrl, animatedUrl, placeholderImageUrl]}
              alt={formatPokemonName(pokemon.name)}
              imgClassName={`w-full h-full object-contain transition-all duration-500 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              imgStyle={{
                viewTransitionName: `pokemon-sprite-${pokemon.id}`,
                margin: 0,
                padding: 0,
                maxWidth: '100%',
                maxHeight: '100%'
              }}
              rootMargin="100px"
              threshold={0.1}
              unloadOffscreen={false}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />

            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 text-muted">
                <span className="text-xs">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xs font-mono text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">
                {pokemon.id !== 0 && `#${String(pokemon.id).padStart(3, "0")}`}
              </span>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-poke-blue transition-colors truncate">
                {hasRealName ? (
                  formatPokemonName(pokemon.name)
                ) : (
                  <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800/60 rounded animate-pulse" />
                )}
              </h3>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Type badges */}
              <div className="flex gap-1">
                {hasTypes ? (
                  pokemon.types.map((type) => (
                    <TypeBadge
                      key={type.type.name}
                      type={type.type.name}
                      className="transition-transform duration-200 group-hover:scale-105 text-xs"
                    />
                  ))
                ) : (
                  <div className="flex gap-1">
                    <div className="h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                    <div className="h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Comparison button */}
              <button
                onClick={handleComparisonClick}
                className={`
                  p-1.5 rounded-full transition-all duration-200 border
                  ${
                    isInComparison
                      ? "bg-blue-500 text-white border-blue-500 shadow-md"
                      : "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-500 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                `}
                aria-label={
                  isInComparison
                    ? "Remove from comparison"
                    : "Add to comparison"
                }
              >
                <Scale
                  className={`h-3 w-3 ${isInComparison ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      ) : (
          shouldUseTooltip ? (
            // Debug: Tooltip branch
            (() => { return (
            <Tooltip
              content={tooltipContent}
              position="top"
              variant="default"
              containViewport
              className="block w-full h-full z-[50]"
            >
              <div ref={cardRef} className="flex flex-col relative" style={containerStyle}>
                {/* Header */}
                <div className="absolute top-1 left-1 right-1 z-20 flex items-center justify-between bg-white/95 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow-sm">
                  <span className="text-slate-800 dark:text-gray-200 font-semibold text-xs sm:text-sm">{pokemon.id !== 0 && `#${String(pokemon.id).padStart(3, '0')}`}</span>
                  <button onClick={handleComparisonClick} className={`p-1 sm:p-1.5 rounded-full transition-all duration-200 border ${isInComparison ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-500 hover:bg-blue-500 hover:text-white hover:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 card-control`} aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}>
                    <Scale className={`h-3 w-3 sm:h-4 sm:w-4 ${isInComparison ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Image - natural aspect ratio */}
                <div className="relative flex w-full justify-center card-art" style={artWrapperStyle}>
                  <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-white/60 dark:bg-slate-900/40">
                    {!imageLoaded && !imageError && (
                      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 bg-slate-200/80 dark:bg-slate-800/60">
                        <div className="w-14 h-14 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                        <span className="sr-only">Loading Pokémon artwork</span>
                      </div>
                    )}
                    <LazyImage
                      className="absolute inset-0 z-10 flex items-center justify-center"
                      srcList={[primaryImageUrl, fallbackImageUrl, animatedUrl, placeholderImageUrl]}
                      alt={formatPokemonName(pokemon.name)}
                      imgClassName={`object-contain transition-all duration-500 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                      imgStyle={{
                        viewTransitionName: `pokemon-sprite-${pokemon.id}`,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block'
                      }}
                      rootMargin="100px"
                      threshold={0.1}
                      unloadOffscreen={false}
                      onLoad={() => setImageLoaded(true)}
                      onError={() => setImageError(true)}
                    />
                    {imageError && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/70 text-muted">
                        <span className="text-sm">?</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with types */}
                <div ref={infoRef} className="relative bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-1 py-1 shadow-sm mx-0.5 mb-0.5">
                  <h3 className={`font-semibold text-center card-name mb-0 dark:text-gray-100 ${density === '9cols' ? 'text-xs mb-1' : density === '6cols' ? 'text-sm' : 'text-sm'}`} style={{ color: '#111827', fontWeight: 600, marginBlockStart: '0', marginBlockEnd: '0px' }}>
                    {hasRealName ? (
                      formatPokemonName(pokemon.name)
                    ) : (
                      <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800/60 rounded animate-pulse mx-auto" />
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-0.5 justify-center card-badges">
                    {hasTypes ? (
                      pokemon.types.map((type) => (
                        <TypeBadge key={type.type.name} type={type.type.name} className={`transition-transform duration-200 group-hover:scale-105 ${density === '9cols' ? 'text-[9px] px-1 py-1' : 'text-xs px-2 py-1'}`} />
                      ))
                    ) : (
                      <div className="flex gap-1.5 justify-center">
                        <div className={`h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse ${density === '9cols' ? 'h-4 w-12' : 'h-6 w-16'}`} />
                        <div className={`h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse ${density === '9cols' ? 'h-4 w-8' : 'h-6 w-12'}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Tooltip>
            ); })()
          ) : (
            // Non-tooltip branch
            (() => { 
              return (
                <div ref={cardRef} className="flex flex-col relative" style={containerStyle}>
                  {/* Header */}
                  <div className="absolute top-1 left-1 right-1 z-20 flex items-center justify-between bg-white/95 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow-sm">
                    <span className="text-slate-800 dark:text-gray-200 font-semibold text-xs sm:text-sm">{pokemon.id !== 0 && `#${String(pokemon.id).padStart(3, '0')}`}</span>
                    <button onClick={handleComparisonClick} className={`p-1 sm:p-1.5 rounded-full transition-all duration-200 border ${isInComparison ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-300 border-gray-200 dark:border-gray-500 hover:bg-blue-500 hover:text-white hover:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 card-control`} aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}>
                      <Scale className={`h-3 w-3 sm:h-4 sm:w-4 ${isInComparison ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Image - natural aspect ratio */}
                  <div className="relative flex w-full justify-center card-art" style={artWrapperStyle}>
                    <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-white/60 dark:bg-slate-900/40">
                      {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 bg-slate-200/80 dark:bg-slate-800/60">
                          <div className="w-14 h-14 bg-slate-300/60 dark:bg-slate-700/60 rounded-full animate-pulse" />
                          <span className="sr-only">Loading Pokémon artwork</span>
                        </div>
                      )}
                      <LazyImage
                        className="absolute inset-0 z-10 flex items-center justify-center"
                        srcList={[primaryImageUrl, fallbackImageUrl, animatedUrl, placeholderImageUrl]}
                        alt={formatPokemonName(pokemon.name)}
                        imgClassName={`object-contain transition-all duration-500 ease-out ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                        imgStyle={{
                          viewTransitionName: `pokemon-sprite-${pokemon.id}`,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        rootMargin="100px"
                        threshold={0.1}
                        unloadOffscreen={false}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                      />
                      {imageError && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/70 text-muted">
                          <span className="text-sm">?</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer with types */}
                  <div ref={infoRef} className="relative bottom-0 left-0 right-0 z-20 bg-white/95 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg px-1 py-1 shadow-sm mx-0.5 mb-0.5">
                    <h3 className={`font-semibold text-center card-name mb-0 dark:text-gray-100 ${density === '9cols' ? 'text-xs' : density === '6cols' ? 'text-sm' : 'text-sm'}`} style={{ color: '#111827', fontWeight: 600, marginBlockStart: '0', marginBlockEnd: '0px' }}>
                      {hasRealName ? (
                        formatPokemonName(pokemon.name)
                      ) : (
                        <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800/60 rounded animate-pulse mx-auto" />
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-0.5 justify-center card-badges">
                      {hasTypes ? (
                        pokemon.types.map((type) => (
                          <TypeBadge key={type.type.name} type={type.type.name} className={`transition-transform duration-200 group-hover:scale-105 ${density === '9cols' ? 'text-[9px] px-1 py-1' : 'text-xs px-2 py-1'}`} />
                        ))
                      ) : (
                        <div className="flex gap-1.5 justify-center">
                          <div className={`h-6 w-16 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse ${density === '9cols' ? 'h-4 w-12' : 'h-6 w-16'}`} />
                          <div className={`h-6 w-12 rounded-full bg-slate-200/80 dark:bg-slate-800/60 animate-pulse ${density === '9cols' ? 'h-4 w-8' : 'h-6 w-12'}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          )
        )
      }
    </PokemonCardFrame>
  );
}
