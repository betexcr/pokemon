'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Champion } from '@/lib/gym_champions';

interface TrainerRosterProps {
  champions: Champion[];
  selectedChampionId: string;
  onChampionSelect: (championId: string) => void;
  generationFilter: string;
  onGenerationFilterChange: (generation: string) => void;
}

export default function TrainerRoster({
  champions,
  selectedChampionId,
  onChampionSelect,
  generationFilter,
  onGenerationFilterChange
}: TrainerRosterProps) {
  const [hoveredChampion, setHoveredChampion] = useState<string | null>(null);

  // Get unique generations
  const availableGenerations = [...new Set(champions.map(c => c.generation))].sort();

  // Filter champions by generation
  const filteredChampions = generationFilter 
    ? champions.filter(champion => champion.generation === generationFilter)
    : champions;

  // Get trainer image path with proper mapping
  const getTrainerImagePath = (champion: Champion): string => {
    const generation = champion.generation.toLowerCase().replace(' ', '');
    const trainerId = champion.id.split('-')[0]; // Get the trainer name part
    
    // Map trainer IDs to actual image filenames
    const trainerImageMap: Record<string, string> = {
      // Gen 1
      'brock': 'brock',
      'misty': 'misty', 
      'lt': 'lt-surge',
      'erika': 'erika',
      'koga': 'koga',
      'sabrina': 'sabrina',
      'blaine': 'blaine',
      'giovanni': 'giovanni',
      'lorelei': 'lorelei',
      'bruno': 'bruno',
      'agatha': 'agatha',
      'lance': 'lance',
      'blue': 'blue',
      
      // Gen 2
      'falkner': 'falkner',
      'bugsy': 'bugsy',
      'whitney': 'whitney',
      'morty': 'morty',
      'chuck': 'chuck',
      'jasmine': 'jasmine',
      'pryce': 'pryce',
      'clair': 'clair',
      'will': 'will',
      'karen': 'karen',
      'janine': 'janine',
      
      // Gen 3
      'roxanne': 'roxanne',
      'brawly': 'brawly',
      'wattson': 'wattson',
      'flannery': 'flannery',
      'norman': 'norman',
      'winona': 'winona',
      'tate': 'tate-liza', // Special case for Tate & Liza
      'wallace': 'wallace',
      'sidney': 'sidney',
      'phoebe': 'phoebe',
      'glacia': 'glacia',
      'drake': 'drake',
      'steven': 'steven'
    };
    
    const imageName = trainerImageMap[trainerId] || trainerId;
    return `/gen${generation.charAt(0)}/${imageName}.png`;
  };


  return (
    <div className="space-y-4">
      {/* Generation Filter */}
      <div>
        <label className="block text-sm font-medium mb-2 text-text">Generation Filter</label>
        <select
          className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text"
          value={generationFilter}
          onChange={(e) => onGenerationFilterChange(e.target.value)}
        >
          <option value="">All Generations</option>
          {availableGenerations.map(generation => (
            <option key={generation} value={generation}>{generation}</option>
          ))}
        </select>
      </div>

      {/* Street Fighter Style Roster */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text">Select Your Opponent</h3>
        
        {/* Roster Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredChampions.map((champion) => {
            const isSelected = selectedChampionId === champion.id;
            const isHovered = hoveredChampion === champion.id;
            const imagePath = getTrainerImagePath(champion);
            
            return (
              <div
                key={champion.id}
                className={`
                  relative group cursor-pointer transition-all duration-200
                  ${isSelected 
                    ? 'ring-2 ring-poke-blue ring-offset-2 ring-offset-bg scale-105' 
                    : 'hover:scale-105 hover:ring-2 hover:ring-poke-blue/50 hover:ring-offset-1 hover:ring-offset-bg'
                  }
                `}
                onClick={() => onChampionSelect(champion.id)}
                onMouseEnter={() => setHoveredChampion(champion.id)}
                onMouseLeave={() => setHoveredChampion(null)}
              >
                {/* Trainer Card */}
                <div className={`
                  bg-gradient-to-b from-surface to-surface/80 
                  border-2 rounded-lg p-3 text-center
                  ${isSelected 
                    ? 'border-poke-blue shadow-lg shadow-poke-blue/20' 
                    : 'border-border hover:border-poke-blue/50'
                  }
                  transition-all duration-200
                `}>
                  {/* Trainer Image */}
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <Image
                      src={imagePath}
                      alt={champion.name}
                      fill
                      className="object-cover rounded-md"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-pokemon.png';
                        target.className = 'object-contain rounded-md bg-gray-200';
                      }}
                    />
                  </div>

                  {/* Trainer Name */}
                  <div className="text-xs font-medium text-text truncate">
                    {champion.name.split(' ')[0]}
                  </div>
                  
                  {/* Generation Badge */}
                  <div className="text-xs text-muted mt-1">
                    {champion.generation.split(' ')[0]}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-poke-blue rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-10">
                    <div className="font-medium">{champion.name}</div>
                    <div className="text-gray-300">{champion.team.name}</div>
                    <div className="text-gray-400">{champion.generation}</div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Champion Info */}
        {selectedChampionId && (
          <div className="mt-4 p-4 bg-surface border border-border rounded-lg">
            {(() => {
              const selectedChampion = champions.find(c => c.id === selectedChampionId);
              if (!selectedChampion) return null;
              
              return (
                <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12">
                    <Image
                      src={getTrainerImagePath(selectedChampion)}
                      alt={selectedChampion.name}
                      fill
                      className="object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-pokemon.png';
                        target.className = 'object-contain rounded-md bg-gray-200';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text">{selectedChampion.name}</h4>
                    <p className="text-sm text-muted">{selectedChampion.team.name}</p>
                    <p className="text-xs text-muted">{selectedChampion.generation}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
