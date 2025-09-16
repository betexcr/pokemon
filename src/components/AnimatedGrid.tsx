"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Pokemon } from "@/types/pokemon";

interface AnimatedGridProps {
  items: Pokemon[];
  mode: "grid" | "list";
  onPokemonSelect: (pokemon: Pokemon) => void;
  selectedPokemon?: Pokemon | null;
  comparisonList: number[];
  onToggleComparison: (id: number) => void;
}

export default function AnimatedGrid({ 
  items, 
  mode, 
  onPokemonSelect, 
  selectedPokemon, 
  comparisonList, 
  onToggleComparison 
}: AnimatedGridProps) {
  const isGrid = mode === "grid";
  
  return (
    <motion.div
      layout
      className={isGrid 
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" 
        : "space-y-2"
      }
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <AnimatePresence initial={false}>
        {items.map((pokemon, i) => (
          <motion.div
            key={pokemon.id}
            layout
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18, delay: i * 0.012, ease: "easeOut" }}
            className="group relative"
          >
            {/* Use existing PokemonCard component structure */}
            <div className="relative rounded-xl border bg-surface hover:shadow-lg transition-shadow cursor-pointer">
              <button
                onClick={() => onPokemonSelect(pokemon)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ viewTransitionName: `pokemon-${pokemon.id}` } as React.CSSProperties}
                    className="shrink-0 rounded-lg bg-white/60 p-2"
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                      alt={pokemon.name}
                      width={72}
                      height={72}
                      className="h-18 w-18 object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate capitalize">{pokemon.name}</p>
                    {pokemon.id !== 0 && <p className="text-xs text-muted">#{String(pokemon.id).padStart(4, "0")}</p>}
                  </div>
                </div>
              </button>
              
              {/* Comparison toggle button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComparison(pokemon.id);
                }}
                className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                  comparisonList.includes(pokemon.id)
                    ? "bg-poke-blue text-white"
                    : "bg-surface text-muted hover:bg-poke-blue hover:text-white"
                }`}
                title={comparisonList.includes(pokemon.id) ? "Remove from comparison" : "Add to comparison"}
              >
                {comparisonList.includes(pokemon.id) ? "✓" : "+"}
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
