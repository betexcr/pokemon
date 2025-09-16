"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Pokemon } from "@/types/pokemon";
import TypeBadge from "@/components/TypeBadge";
import AbilityBadge from "@/components/AbilityBadge";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface PokemonHeroProps {
  pokemon: Pokemon;
  abilities?: { name: string; is_hidden?: boolean; description?: string | null }[];
  flavorText?: string;
  genus?: string;
}

export default function PokemonHero({ pokemon, abilities, flavorText, genus }: PokemonHeroProps) {
  const vtName = `pokemon-sprite-${pokemon.id}`;
  const reduce = useReducedMotionPref();
  const [showAura, setShowAura] = useState(false);

  // Get primary type for background color
  const primaryType = pokemon.types[0]?.type.name || 'normal';

  // Helper functions for stat display
  const getStatLabel = (statName: string): string => {
    switch (statName.toLowerCase()) {
      case 'hp': return 'HP';
      case 'attack': return 'ATK';
      case 'defense': return 'DEF';
      case 'special-attack': return 'SPA';
      case 'special-defense': return 'SPD';
      case 'speed': return 'SPE';
      default: return statName.toUpperCase();
    }
  };

  const getStatIcon = (statName: string): string => {
    switch (statName.toLowerCase()) {
      case 'hp': return '❤️';
      case 'attack': return '⚔️';
      case 'defense': return '🛡️';
      case 'special-attack': return '✨';
      case 'special-defense': return '🔮';
      case 'speed': return '💨';
      default: return '📊';
    }
  };

  // Trigger aura pulse on mount
  useEffect(() => {
    if (!reduce) {
      setShowAura(true);
      const timer = setTimeout(() => setShowAura(false), 200);
      return () => clearTimeout(timer);
    }
  }, [reduce]);
  
  return (
    <header 
      className="relative mb-6 rounded-2xl border border-border bg-surface p-6 overflow-hidden"
      style={{ 
        '--type-color': `var(--type-${primaryType}-color, #60a5fa)` 
      } as React.CSSProperties}
    >
      {/* Type aura background pulse */}
      <motion.div 
        className="pointer-events-none absolute inset-0 opacity-30 blur-2xl"
        aria-hidden
        style={{ 
          background: `radial-gradient(40% 40% at 50% 50%, var(--type-color) 0%, transparent 60%)` 
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={showAura ? { scale: 1.2, opacity: 0.6 } : { scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />
      
      <div className="relative space-y-6">
        {/* Pokemon Header - Responsive Layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6">
          {/* Pokemon Image */}
          <div
            style={{ viewTransitionName: vtName } as React.CSSProperties}
            className="rounded-xl bg-white/70 dark:bg-zinc-800/70 p-3 flex-shrink-0 order-1 lg:order-1"
          >
            <Image 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
              alt={pokemon.name}
              width={140} 
              height={140} 
              className="h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 object-contain" 
              priority 
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
              }}
            />
          </div>
          
          {/* Pokemon Info - Side Layout on Desktop, Below on Mobile */}
          <div className="min-w-0 flex-1 order-2 lg:order-2 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight capitalize text-text">
              {pokemon.name}
            </h1>
            {pokemon.id !== 0 && (
              <p className="text-muted text-base sm:text-lg lg:text-xl mt-1">
                #{String(pokemon.id).padStart(4, "0")}
              </p>
            )}
            
            <div className="mt-3 flex gap-2 flex-wrap justify-center lg:justify-start">
              {pokemon.types.map((typeObj) => (
                <TypeBadge 
                  key={typeObj.type.name} 
                  type={typeObj.type.name} 
                  className="text-sm sm:text-base"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats Row - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted">
          <Stat label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} icon="📏" />
          <Stat label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} icon="🏋️" />
          <Stat label="Base Exp" value={pokemon.base_experience} icon="⚡" />
          <Stat label="Types" value={<div className="flex flex-wrap justify-center gap-1">{pokemon.types.map((t, index) => <TypeBadge key={`${t.type.name}-${index}`} type={t.type.name}/>)}</div>} icon="🧪" />
        </div>

        {/* Battle Stats */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-center">Battle Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
            {pokemon.stats.map(stat => (
              <Stat 
                key={stat.stat.name}
                label={getStatLabel(stat.stat.name)} 
                value={stat.base_stat} 
                icon={getStatIcon(stat.stat.name)}
              />
            ))}
          </div>
        </div>

        {/* Abilities */}
        {abilities && abilities.length > 0 && (
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">Abilities</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {abilities.map((ability, index) => (
                <AbilityBadge 
                  key={`${ability.name}-${index}`}
                  ability={ability}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {flavorText && (
          <div className="space-y-2 text-center">
            <h3 className="text-lg font-semibold">Description</h3>
            <p className="leading-7 text-muted">{flavorText}</p>
            {genus && (
              <span className="inline-block rounded-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700">
                {genus}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function Stat({label, value, icon}:{label:string; value:React.ReactNode; icon:string}) {
  return (
    <div className="rounded-xl bg-white/50 dark:bg-zinc-800/50 p-3 text-center">
      <div className="text-xs text-muted">{icon} {label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
