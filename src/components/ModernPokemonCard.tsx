"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pokemon } from "@/types/pokemon";
import { formatPokemonName } from "@/lib/utils";
import { Scale } from "lucide-react";
import TypeBadge from "./TypeBadge";
import PokemonCardFrame from "./PokemonCardFrame";

interface ModernPokemonCardProps {
  pokemon: Pokemon;
  isInComparison: boolean;
  onToggleComparison: (id: number) => void;
  onSelect?: (pokemon: Pokemon) => void;
  isSelected?: boolean;
  className?: string;
  density?: "3cols" | "6cols" | "9cols" | "list";
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

  return (
    <PokemonCardFrame
      onClick={handleClick}
      className={className}
      density={density}
      isSelected={isSelected}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${formatPokemonName(pokemon.name)}`}
      data-pokemon-id={pokemon.id}
    >
      {/* Type accent bar */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      {/* Card content */}
      {density === "list" ? (
        // List layout - clean horizontal list item
        <div className="flex items-center w-full">
          {/* Pokémon Image */}
          <div className="relative rounded-lg flex items-center justify-center overflow-hidden mr-3 sm:mr-4 w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" style={{ padding: 0, backgroundColor: "transparent" }}>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-transparent animate-pulse rounded-lg" />
            )}

            {/* Pokémon Image */}
            <img
              src={primaryImageUrl}
              alt={formatPokemonName(pokemon.name)}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{
                viewTransitionName: `pokemon-sprite-${pokemon.id}`,
                margin: 0,
                padding: 0,
                maxWidth: "100%",
                maxHeight: "100%"
              }}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src === primaryImageUrl) {
                  // Try fallback URL
                  target.src = fallbackImageUrl;
                } else if (target.src === fallbackImageUrl) {
                  // Try animated URL
                  target.src = animatedUrl;
                } else if (target.src === animatedUrl) {
                  // Try placeholder
                  target.src = placeholderImageUrl;
                  setImageError(true);
                }
              }}
              loading="lazy"
            />

            {/* Loading GIF */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/loading.gif" alt="Loading" className="w-4 h-4 opacity-80" />
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <span className="text-xs">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info */}
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <span className="text-xs font-mono text-gray-500 font-medium flex-shrink-0">
                {pokemon.id !== 0 && `#${String(pokemon.id).padStart(3, "0")}`}
              </span>
              <h3 className="font-semibold text-gray-800 group-hover:text-poke-blue transition-colors truncate">
                {formatPokemonName(pokemon.name)}
              </h3>
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Type badges */}
              <div className="flex gap-1">
                {pokemon.types.map((type) => (
                  <TypeBadge
                    key={type.type.name}
                    type={type.type.name}
                    className="transition-transform duration-200 group-hover:scale-105 text-xs"
                  />
                ))}
              </div>

              {/* Comparison button */}
              <button
                onClick={handleComparisonClick}
                className={`
                  p-1.5 rounded-full transition-all duration-200 border
                  ${
                    isInComparison
                      ? "bg-blue-500 text-white border-blue-500 shadow-md"
                      : "bg-white text-gray-400 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
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
        // Grid layout for 3cols, 6cols, and 9cols
        <div
          className="flex flex-col relative"
          style={{ 
            height: density === "3cols" ? "180px" : density === "6cols" ? "140px" : "100px", // Balanced height - not too stretched
            minHeight: 'fit-content',
            aspectRatio: "1 / 1", // Make cards square
          }}
        >
          {/* Header: ID and Comparison - Absolutely positioned at top */}
          <div
            className="absolute top-1 left-1 right-1 z-20 flex items-center justify-between
                  bg-white/90 backdrop-blur-sm rounded-lg px-1.5 py-0.5 shadow-sm"
          >
            <span className="text-slate-800 font-semibold text-xs sm:text-sm">
              {pokemon.id !== 0 && `#${String(pokemon.id).padStart(3, "0")}`}
            </span>
            <button
              onClick={handleComparisonClick}
              className={`
                p-1 sm:p-1.5 rounded-full transition-all duration-200 border
                ${
                  isInComparison
                    ? "bg-blue-500 text-white border-blue-500 shadow-md"
                    : "bg-white text-gray-400 border-gray-200 hover:bg-blue-500 hover:text-white hover:border-blue-500"
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
              card-control
              `}
              aria-label={
                isInComparison ? "Remove from comparison" : "Add to comparison"
              }
            >
              <Scale
                className={`h-3 w-3 sm:h-4 sm:w-4 ${isInComparison ? "fill-current" : ""}`}
              />
            </button>
          </div>

          {/* Pokémon Image - Centered container that fills available space */}
          <div
            className="relative flex items-center justify-center overflow-hidden card-art flex-1"
            style={{
              width: "100%",
              padding: 0, // Remove all padding
              marginTop: density === "3cols" ? "20px" : density === "6cols" ? "16px" : "12px", // Space for header
              marginBottom: density === "3cols" ? "20px" : density === "6cols" ? "16px" : "12px", // Space for footer
              borderRadius: "0.5rem", // Apply border radius to container
              backgroundColor: "transparent", // Remove background color
              minHeight: 0, // Allow flex shrinking
            }}
          >
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-transparent animate-pulse" />
            )}

            <img
              src={primaryImageUrl}
              alt={formatPokemonName(pokemon.name)}
              className={`
                object-contain transition-opacity duration-300
                ${imageLoaded ? "opacity-100" : "opacity-0"}
              `}
              style={{
                viewTransitionName: `pokemon-sprite-${pokemon.id}`,
                maxHeight: "100%", // Fill the entire container height
                maxWidth: "100%", // Fill the entire container width
                width: "auto", // Let width adjust to maintain aspect ratio
                height: "auto", // Let height adjust to maintain aspect ratio
                objectFit: "contain",
                display: "block",
                margin: "auto", // Center the image
                padding: 0, // Remove all padding
              }}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src === primaryImageUrl) {
                  // Try fallback URL
                  target.src = fallbackImageUrl;
                } else if (target.src === fallbackImageUrl) {
                  // Try animated URL
                  target.src = animatedUrl;
                } else if (target.src === animatedUrl) {
                  // Try placeholder
                  target.src = placeholderImageUrl;
                  setImageError(true);
                }
              }}
              loading="lazy"
            />

            {/* Loading GIF */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/loading.gif" alt="Loading" className="w-6 h-6 opacity-80" />
              </div>
            )}

            {/* Error state */}
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center text-muted">
                <span className="text-2xl">?</span>
              </div>
            )}
          </div>

          {/* Pokémon Info - Absolutely positioned at bottom */}
          <div className="absolute bottom-0.5 left-0.5 right-0.5 z-20 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-sm">
            {/* Name */}
            <h3
              className={`font-semibold text-center group-hover:text-poke-blue transition-colors card-name mb-0 ${
                density === "9cols"
                  ? "text-xs"
                  : density === "6cols"
                  ? "text-xs"
                  : "text-xs sm:text-sm"
              }`}
              style={{
                color: "#1f2937",
                fontWeight: "600",
                marginBlockStart: "0",
                marginBlockEnd: "0px",
              }}
            >
              {pokemon.name ? formatPokemonName(pokemon.name) : "No Name"}
            </h3>

            {/* Type badges */}
            <div className="flex flex-wrap gap-0.5 justify-center card-badges">
              {pokemon.types && pokemon.types.length > 0 ? (
                pokemon.types.map((type) => (
                  <TypeBadge
                    key={type.type.name}
                    type={type.type.name}
                    className={`transition-transform duration-200 group-hover:scale-105 ${
                      density === "9cols"
                        ? "text-xs px-2 py-1"
                        : "text-xs px-2 py-1"
                    }`}
                  />
                ))
              ) : (
                <span className="text-xs text-gray-500">No Types</span>
              )}
            </div>
          </div>
        </div>
      )}
    </PokemonCardFrame>
  );
}
