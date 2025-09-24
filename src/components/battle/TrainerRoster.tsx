'use client';

import React, { useState, useEffect } from 'react';
import { Champion } from '@/lib/gym_champions';
import Tooltip from '@/components/Tooltip';
import { getTrainerSpriteUrl, getTrainerSpriteUrls } from '@/lib/trainerSprites';

// Custom Trainer Tooltip Component
interface TrainerTooltipProps {
  children: React.ReactNode;
  champion: Champion;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showTooltip?: string | null;
  onTrainerHover?: (championId: string | null) => void;
  isMobile?: boolean;
}

const TrainerTooltip: React.FC<TrainerTooltipProps> = ({ 
  children, 
  champion, 
  position = 'top',
  className = '',
  showTooltip,
  onTrainerHover,
  isMobile = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  };

  const getTrainerDescription = (champion: Champion): string => {
    const descriptions: Record<string, string> = {
      // Gen 1 Gym Leaders
      'brock-kanto': 'The Rock-type Gym Leader of Pewter City. Known for his sturdy defense and unshakeable determination.',
      'misty-kanto': 'The Water-type Gym Leader of Cerulean City. A skilled swimmer with a passion for Water-type Pokémon.',
      'lt-surge-kanto': 'The Electric-type Gym Leader of Vermilion City. A former military man who uses electric warfare tactics.',
      'erika-kanto': 'The Grass-type Gym Leader of Celadon City. A gentle soul who loves flowers and nature.',
      'koga-kanto': 'The Poison-type Gym Leader of Fuchsia City. A master of ninja techniques and stealth.',
      'sabrina-kanto': 'The Psychic-type Gym Leader of Saffron City. Possesses incredible psychic powers.',
      'blaine-kanto': 'The Fire-type Gym Leader of Cinnabar Island. A scientist who studies volcanic activity.',
      'giovanni-kanto': 'The Ground-type Gym Leader of Viridian City. Leader of Team Rocket with a dark past.',
      
      // Gen 1 Elite Four
      'lorelei-kanto': 'The Ice-type Elite Four member. Specializes in powerful Ice-type attacks.',
      'bruno-kanto': 'The Fighting-type Elite Four member. A martial artist with incredible physical strength.',
      'agatha-kanto': 'The Ghost-type Elite Four member. An elderly trainer with decades of experience.',
      'lance-kanto': 'The Dragon-type Elite Four member and Champion. A master of rare Dragon-type Pokémon.',
      'blue-kanto': 'The final Champion of Kanto. A rival trainer who became the strongest.',
      
      // Gen 2 Gym Leaders
      'falkner-johto': 'The Flying-type Gym Leader of Violet City. Son of the former Gym Leader.',
      'bugsy-johto': 'The Bug-type Gym Leader of Azalea Town. A young expert on Bug-type Pokémon.',
      'whitney-johto': 'The Normal-type Gym Leader of Goldenrod City. Known for her Miltank\'s Rollout attack.',
      'morty-johto': 'The Ghost-type Gym Leader of Ecruteak City. Studies the legendary Pokémon of the towers.',
      'chuck-johto': 'The Fighting-type Gym Leader of Cianwood City. A martial artist who trains on the beach.',
      'jasmine-johto': 'The Steel-type Gym Leader of Olivine City. Cares for the sick Ampharos at the lighthouse.',
      'pryce-johto': 'The Ice-type Gym Leader of Mahogany Town. An elderly trainer with years of experience.',
      'clair-johto': 'The Dragon-type Gym Leader of Blackthorn City. Lance\'s cousin and a Dragon-type specialist.',
      
      // Gen 2 Elite Four
      'will-johto': 'The Psychic-type Elite Four member. Uses powerful Psychic-type attacks.',
      'koga-johto': 'The Poison-type Elite Four member. Formerly a Gym Leader, now an Elite Four member.',
      'karen-johto': 'The Dark-type Elite Four member. Believes in using Pokémon with strong hearts.',
      'lance-johto': 'The Dragon-type Champion of Johto. A master of Dragon-type Pokémon.',
      
      // Gen 3 Gym Leaders
      'roxanne-hoenn': 'The Rock-type Gym Leader of Rustboro City. A teacher who studies fossils.',
      'brawly-hoenn': 'The Fighting-type Gym Leader of Dewford Town. A surfer who trains on the beach.',
      'wattson-hoenn': 'The Electric-type Gym Leader of Mauville City. An elderly man who loves electricity.',
      'flannery-hoenn': 'The Fire-type Gym Leader of Lavaridge Town. A young trainer with fiery passion.',
      'norman-hoenn': 'The Normal-type Gym Leader of Petalburg City. The player\'s father.',
      'winona-hoenn': 'The Flying-type Gym Leader of Fortree City. A graceful trainer who soars through the sky.',
      'tate-liza-hoenn': 'The Psychic-type Gym Leaders of Mossdeep City. Twin siblings who battle together.',
      'wallace-hoenn': 'The Water-type Gym Leader of Sootopolis City. A master of Water-type Pokémon.',
      
      // Gen 3 Elite Four
      'sidney-hoenn': 'The Dark-type Elite Four member. A tough trainer with a wild personality.',
      'phoebe-hoenn': 'The Ghost-type Elite Four member. A cheerful trainer who loves Ghost-type Pokémon.',
      'glacia-hoenn': 'The Ice-type Elite Four member. A graceful trainer from a cold region.',
      'drake-hoenn': 'The Dragon-type Elite Four member. A veteran trainer with years of experience.',
      'steven-hoenn': 'The Steel-type Champion of Hoenn. A collector of rare stones and Steel-type Pokémon.'
    };
    
    return descriptions[champion.id] || `${champion.name} is a skilled trainer specializing in their team's type.`;
  };

  // Determine if tooltip should be shown
  const shouldShowTooltip = showTooltip === champion.id || isOpen;

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => {
        if (!isMobile && onTrainerHover) {
          onTrainerHover(champion.id);
        }
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        if (!isMobile && onTrainerHover) {
          onTrainerHover(null);
        }
        setIsOpen(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isMobile) {
          setIsOpen(prev => !prev);
        }
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        if (isMobile) {
          setIsOpen(prev => !prev);
        }
      }}
    >
      {children}
      <div 
        className={`pointer-events-none absolute z-50 ${positionClasses[position]} rounded-2xl p-4 md:p-6 text-sm leading-relaxed shadow-2xl dark:shadow-3xl ring-1 ring-gray-200/20 dark:ring-gray-700/30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-out ${
          shouldShowTooltip ? 'opacity-100' : 'opacity-0'
        } max-w-[92vw] md:w-[500px]`}
      >
        <div className="space-y-3">
          {/* Team Name as Title */}
          <div className="text-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{champion.team.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{champion.generation}</p>
          </div>
          
          {/* Trainer Description */}
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {getTrainerDescription(champion)}
          </div>
          
          {/* Pokemon Team Images */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">Team:</p>
            <div className="flex flex-wrap gap-3 justify-center">
              {champion.team.slots.map((slot, index) => (
                <div key={index} className="flex flex-col items-center space-y-1">
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${slot.id}.png`}
                    alt={`Pokemon ${slot.id}`}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain bg-white rounded border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-pokemon.png';
                    }}
                  />
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Lv.{slot.level}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Arrow */}
        <div className={`absolute ${
          position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2' : 
          position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2' :
          position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2' :
          'right-full top-1/2 transform -translate-y-1/2'
        } w-3 h-3 rotate-45 bg-white dark:bg-gray-800 shadow-lg`} />
      </div>
    </div>
  );
};

interface TrainerRosterProps {
  champions: Champion[];
  selectedChampionId: string;
  onChampionSelect: (championId: string) => void;
  generationFilter: string;
  onGenerationFilterChange: (generation: string) => void;
  showTooltip?: string | null;
  onTrainerHover?: (championId: string | null) => void;
  isMobile?: boolean;
}

export default function TrainerRoster({
  champions,
  selectedChampionId,
  onChampionSelect,
  generationFilter,
  onGenerationFilterChange,
  showTooltip,
  onTrainerHover,
  isMobile: propIsMobile = false
}: TrainerRosterProps) {
  const [isMobile, setIsMobile] = useState(propIsMobile);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get unique generations from all champions
  const availableGenerations = [...new Set(
    champions.map(c => c.generation)
  )].sort();

  // Filter champions by selected generation, or show all
  const filteredChampions = generationFilter 
    ? champions.filter(champion => champion.generation === generationFilter)
    : champions;


  // Resolve trainer image paths from downloaded sprites
  const getTrainerImagePaths = (champion: Champion) => getTrainerSpriteUrls(champion);



  return (
    <div className="space-y-4">
      {/* Generation Filter */}
      <div>
        <label className="block text-sm font-bold mb-2 text-black dark:text-gray-100">Generation Filter</label>
        <select
          className="w-full px-3 py-2 border border-border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-black dark:text-gray-100 font-medium"
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
        <h3 className="text-lg font-bold text-black dark:text-gray-100">Select Your Opponent</h3>
        
        {/* Responsive roster grid */}
        <div className="grid gap-3 grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {filteredChampions.map((champion) => {
            const isSelected = selectedChampionId === champion.id;
            const { primary: imagePath, fallback } = getTrainerImagePaths(champion);
            
            return (
              <TrainerTooltip
                key={champion.id}
                champion={champion}
                position="top"
                className="cursor-pointer"
                showTooltip={showTooltip}
                onTrainerHover={onTrainerHover}
                isMobile={isMobile}
              >
                <div
                  className={`
                    relative group transition-all duration-200
                    ${isSelected 
                      ? 'ring-2 ring-poke-blue ring-offset-2 ring-offset-bg scale-105' 
                      : 'hover:scale-105 hover:ring-2 hover:ring-poke-blue/50 hover:ring-offset-1 hover:ring-offset-bg'
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Trainer clicked:', champion.name, champion.id);
                    onChampionSelect(champion.id);
                  }}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Select ${champion.name}`}
                >
                  {/* Trainer Card */}
                  <div className={`
                    bg-gradient-to-b from-surface to-surface/80 
                    border-2 rounded-xl p-3 sm:p-4 text-center
                    ${isSelected 
                      ? 'border-poke-blue shadow-lg shadow-poke-blue/20' 
                      : 'border-border hover:border-poke-blue/50'
                    }
                    transition-all duration-200
                  `}>
                    {/* Trainer Image - Enhanced */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
                      <img
                        src={imagePath}
                        alt={champion.name}
                        width={80}
                        height={80}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-lg border border-white/20 shadow-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          // Prevent infinite loops by checking if we've already tried the fallback
                          if (fallback && !target.src.includes('/gen') && !target.src.includes('profile-placeholder')) {
                            target.src = fallback;
                          } else {
                            // Fallback to placeholder if no fallback path or fallback also fails
                            target.src = '/profile-placeholder.png';
                            target.className = 'w-full h-full object-contain rounded-lg bg-gray-200 border border-white/20 shadow-lg';
                          }
                        }}
                      />
                    </div>

                    {/* Trainer Name */}
                    <div className="text-[11px] sm:text-xs font-semibold text-black dark:text-gray-100 truncate">
                      {champion.name.split(' ')[0]}
                    </div>
                    
                    {/* Generation Badge */}
                    <div className="text-[10px] sm:text-xs font-medium text-gray-800 dark:text-gray-400 mt-0.5">
                      {champion.generation.split(' ')[0]}
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-poke-blue rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </TrainerTooltip>
            );
          })}
        </div>

      </div>
    </div>
  );
}
