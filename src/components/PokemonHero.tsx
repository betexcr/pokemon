"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Pokemon } from "@/types/pokemon";
import TypeBadge from "@/components/TypeBadge";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";

interface PokemonHeroProps {
  pokemon: Pokemon;
}

export default function PokemonHero({ pokemon }: PokemonHeroProps) {
  const vtName = `pokemon-sprite-${pokemon.id}`;
  const reduce = useReducedMotionPref();
  const [showAura, setShowAura] = useState(false);

  // Get primary type for background color
  const primaryType = pokemon.types[0]?.type.name || 'normal';

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
      className="relative mb-6 rounded-2xl border border-border bg-surface p-4 overflow-hidden"
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
      
      <div className="relative flex items-center gap-4">
        <div
          style={{ viewTransitionName: vtName } as React.CSSProperties}
          className="rounded-xl bg-white/70 dark:bg-zinc-800/70 p-3"
        >
          <Image 
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`}
            alt={pokemon.name}
            width={140} 
            height={140} 
            className="h-36 w-36 object-contain" 
            priority 
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
            }}
          />
        </div>
        
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight capitalize text-text">
            {pokemon.name}
          </h1>
          {pokemon.id !== 0 && <p className="text-muted">#{String(pokemon.id).padStart(4, "0")}</p>}
          
          <div className="mt-2 flex gap-2 flex-wrap">
            {pokemon.types.map((typeObj) => (
              <TypeBadge 
                key={typeObj.type.name} 
                type={typeObj.type.name} 
              />
            ))}
          </div>
          
          {/* Stats summary */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="text-center">
              <div className="font-semibold text-text">HP</div>
              <div className="text-muted">
                {pokemon.stats.find(s => s.stat.name === 'hp')?.base_stat || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-text">ATK</div>
              <div className="text-muted">
                {pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-text">DEF</div>
              <div className="text-muted">
                {pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
