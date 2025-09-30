"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pokemon } from "@/types/pokemon";
import TypeBadge from "@/components/TypeBadge";
import AbilityBadge from "@/components/AbilityBadge";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";
import Tooltip from './Tooltip'
import { generateBasicRomaji, getPokemonJapaneseName, getJapaneseNameInfo } from '@/lib/japaneseNames'
import { getMatchup } from "@/lib/getMatchup";
import TypeBadgeWithTooltip from "@/components/TypeBadgeWithTooltip";
import { getBestPokemonDBSprite, getPokemonDBFallbackURLs, hasPokemonDBShinySprite } from "@/lib/pokemonDbSprites";
import { getAvailablePortraits, getPortraitURL, PortraitExpression } from "@/lib/pmdPortraits";
import { isSpecialForm, getSpecialFormInfo } from '@/lib/specialForms';
import { usePmdAnimations } from '@/components/HeroPmdSprite';
import HeroPmdSprite from '@/components/HeroPmdSprite';

interface PokemonHeroProps {
  pokemon: Pokemon;
  abilities?: { name: string; is_hidden?: boolean; description?: string | null }[];
  flavorText?: string;
  genus?: string;
  hasGenderDifferences?: boolean;
}

export default function PokemonHero({ pokemon, abilities, flavorText, genus, hasGenderDifferences = false }: PokemonHeroProps) {
  const router = useRouter();
  const vtName = `pokemon-sprite-${pokemon.id}`;
  const reduce = useReducedMotionPref();
  const [showAura, setShowAura] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [style, setStyle] = useState<'official' | 'sprite' | 'portrait' | 'pmd' | 'fallback'>('official');
  const [orientation, setOrientation] = useState<'front' | 'back'>('front');
  const [selectedPortrait, setSelectedPortrait] = useState<string>('Normal.png');
  const [availablePortraits, setAvailablePortraits] = useState<PortraitExpression[]>([]);
  const [showPortraitDropdown, setShowPortraitDropdown] = useState(false);
  const portraitDropdownRef = useRef<HTMLDivElement>(null);
  
  // PMD state
  const { anims: pmdAnims, error: pmdError } = usePmdAnimations(pokemon.id);
  const [selectedPmdAnim, setSelectedPmdAnim] = useState<string>('');
  const [showPmdDropdown, setShowPmdDropdown] = useState(false);
  const pmdDropdownRef = useRef<HTMLDivElement>(null);
  // Helper function to get the appropriate default generation for a Pokemon
  const getDefaultGeneration = (pokemonId: number): 'gen1' | 'gen1rb' | 'gen1rg' | 'gen1frlg' | 'gen2' | 'gen2g' | 'gen2s' | 'gen3' | 'gen3rs' | 'gen3frlg' | 'gen4' | 'gen4dp' | 'gen5' | 'gen5ani' | 'gen6' | 'gen6ani' | 'gen7' | 'gen8' | 'gen9' | 'home' | 'go' => {
    // Select the highest generation available for this Pokemon
    if (pokemonId >= 906) return 'gen9'; // Gen 9 Pokemon (Sprigatito onwards)
    if (pokemonId >= 810) return 'gen8'; // Gen 8 Pokemon (Grookey onwards)
    if (pokemonId >= 722) return 'gen7'; // Gen 7 Pokemon (Rowlet onwards)
    if (pokemonId >= 650) return 'gen6'; // Gen 6 Pokemon (Chespin onwards)
    if (pokemonId >= 494) return 'gen5'; // Gen 5 Pokemon (Victini onwards)
    if (pokemonId >= 387) return 'gen4'; // Gen 4 Pokemon (Turtwig onwards)
    if (pokemonId >= 252) return 'gen3'; // Gen 3 Pokemon (Treecko onwards)
    if (pokemonId >= 152) return 'gen2'; // Gen 2 Pokemon (Chikorita onwards)
    return 'gen1'; // Gen 1 Pokemon (Bulbasaur onwards)
  };

  const [generation, setGeneration] = useState<'gen1' | 'gen1rb' | 'gen1rg' | 'gen1frlg' | 'gen2' | 'gen2g' | 'gen2s' | 'gen3' | 'gen3rs' | 'gen3frlg' | 'gen4' | 'gen4dp' | 'gen5' | 'gen5ani' | 'gen6' | 'gen6ani' | 'gen7' | 'gen8' | 'gen9' | 'home' | 'go'>(getDefaultGeneration(pokemon.id));
  const [imageSrc, setImageSrc] = useState<string>('');

  // Update generation when Pokemon changes
  useEffect(() => {
    setGeneration(getDefaultGeneration(pokemon.id));
  }, [pokemon.id]);

  // Update image source when generation, style, shiny, gender, or orientation changes
  useEffect(() => {
    const female = gender === 'female';
    const shiny = isShiny;
    const official = pokemon.sprites.other['official-artwork'];
    const home = pokemon.sprites.other.home;
    const base = pokemon.sprites;
    
    // Helper to pick base/front/back sprite
    const pickBase = () => {
      if (orientation === 'back') {
        if (female) {
          if (shiny && base.back_shiny_female) return base.back_shiny_female;
          if (!shiny && base.back_female) return base.back_female;
        }
        if (shiny && base.back_shiny) return base.back_shiny;
        if (base.back_default) return base.back_default;
      } else {
        if (female) {
          if (shiny && base.front_shiny_female) return base.front_shiny_female;
          if (!shiny && base.front_female) return base.front_female;
        }
        if (shiny && base.front_shiny) return base.front_shiny;
        if (base.front_default) return base.front_default;
      }
      return null;
    };

    let newSrc = '';
    
    switch (style) {
      case 'official': {
        if (!female) {
          if (shiny && official.front_shiny) newSrc = official.front_shiny;
          if (!shiny && official.front_default) newSrc = official.front_default;
        }
        // fallback chain continues to HOME/base below
        if (!newSrc) {
          // Try HOME sprites as fallback
          if (orientation === 'front') {
            if (female) {
              if (shiny && home.front_shiny_female) newSrc = home.front_shiny_female;
              if (!shiny && home.front_female) newSrc = home.front_female;
            } else {
              if (shiny && home.front_shiny) newSrc = home.front_shiny;
              if (!shiny && home.front_default) newSrc = home.front_default;
            }
          }
          // HOME generally doesn't provide back; fallback to base
          if (!newSrc) {
            const basePick = pickBase();
            if (basePick) newSrc = basePick;
          }
        }
        break;
      }
      case 'sprite': {
        // Use PokemonDB for newer generations (Gen 7+) and Gen 6 for newer Pokemon, Showdown for older ones
        if (['gen7', 'gen8', 'gen9'].includes(generation) || (generation === 'gen6' && pokemon.id > 721)) {
          newSrc = getBestPokemonDBSprite(pokemon.name, generation, shiny, orientation === 'back');
        } else {
          // Use generation-specific sprites from Pokémon Showdown for older generations
          const mappedSpecies = mapPokemonNameToShowdown(pokemon.name);
          
          // Handle gen5ani and gen6ani as animated GIFs
          if (generation === 'gen5ani') {
            const shinyFolder = shiny ? (orientation === 'back' ? 'gen5ani-back-shiny' : 'gen5ani-shiny') : (orientation === 'back' ? 'gen5ani-back' : 'gen5ani');
            newSrc = `https://play.pokemonshowdown.com/sprites/${shinyFolder}/${mappedSpecies}.gif`;
          } else if (generation === 'gen6ani') {
            const shinyFolder = shiny ? (orientation === 'back' ? 'ani-back-shiny' : 'ani-shiny') : (orientation === 'back' ? 'ani-back' : 'ani');
            newSrc = `https://play.pokemonshowdown.com/sprites/${shinyFolder}/${mappedSpecies}.gif`;
          } else {
            // Regular generation sprites
            const genFolder = generation;
            const shinySuffix = shiny ? '-shiny' : '';
            const orientationSuffix = orientation === 'back' ? '-back' : '';
            const folder = `${genFolder}${orientationSuffix}${shinySuffix}`;
            newSrc = `https://play.pokemonshowdown.com/sprites/${folder}/${mappedSpecies}.png`;
          }
        }
        break;
      }
      case 'portrait': {
        // Use PMD Collab portrait path with selected expression
        newSrc = getPortraitURL(pokemon.id, selectedPortrait);
        break;
      }
      case 'pmd': {
        // PMD animations are handled by HeroPmdSprite component
        newSrc = '';
        break;
      }
      case 'fallback': {
        // Use PokeAPI fallback sprite
        newSrc = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
        break;
      }
    }

    // Global fallback
    if (!newSrc) {
      newSrc = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.id}.png`;
    }
    
    
    setImageSrc(newSrc);
  }, [generation, style, isShiny, gender, orientation, pokemon.id, pokemon.name, selectedPortrait]);

  // Fetch available portraits when Pokemon changes
  useEffect(() => {
    const fetchPortraits = async () => {
      try {
        const portraits = await getAvailablePortraits(pokemon.id);
        setAvailablePortraits(portraits);
        // Reset to Normal portrait when Pokemon changes
        setSelectedPortrait('Normal.png');
      } catch (error) {
        console.error('Failed to fetch portraits:', error);
        // Set default portrait on error
        setAvailablePortraits([{ name: 'normal', filename: 'Normal.png', displayName: 'Normal' }]);
        setSelectedPortrait('Normal.png');
      }
    };

    fetchPortraits();
  }, [pokemon.id]);

  // Initialize PMD animation when available
  useEffect(() => {
    if (pmdAnims && pmdAnims.length > 0 && !selectedPmdAnim) {
      setSelectedPmdAnim(pmdAnims[0].name);
    }
  }, [pmdAnims, selectedPmdAnim]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (portraitDropdownRef.current && !portraitDropdownRef.current.contains(event.target as Node)) {
        setShowPortraitDropdown(false);
      }
      if (pmdDropdownRef.current && !pmdDropdownRef.current.contains(event.target as Node)) {
        setShowPmdDropdown(false);
      }
    };

    if (showPortraitDropdown || showPmdDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPortraitDropdown, showPmdDropdown]);

  // Get primary type for background color
  const primaryType = pokemon.types[0]?.type.name || 'normal';

  // Navigation functions
  const navigateToPokemon = (id: number) => {
    router.push(`/pokemon/${id}`);
  };

  const goToPrevious = () => {
    if (pokemon.id > 1) {
      navigateToPokemon(pokemon.id - 1);
    }
  };

  const goToNext = () => {
    // Handle navigation for special forms and regular Pokemon
    if (isSpecialForm(pokemon.id)) {
      // If we're at the last special form (10082), go to next regular Pokemon
      if (pokemon.id >= 10082) {
        navigateToPokemon(1026); // Go to next regular Pokemon after special forms
      } else {
        navigateToPokemon(pokemon.id + 1);
      }
    } else {
      // Regular Pokemon navigation
      if (pokemon.id < 1025) {
        navigateToPokemon(pokemon.id + 1);
      }
    }
  };

  // Function to get type effectiveness for all types against the Pokemon's types
  const getTypeEffectiveness = () => {
    const pokemonTypes = pokemon.types.map(t => t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1));
    const matchups = getMatchup(pokemonTypes);
    
    // Combine all effectiveness data
    const allEffectiveness = [
      ...matchups.x4.map(t => ({ type: t.toLowerCase(), effectiveness: 4, multiplier: 'x4' })),
      ...matchups.x2.map(t => ({ type: t.toLowerCase(), effectiveness: 2, multiplier: 'x2' })),
      ...matchups.x0_5.map(t => ({ type: t.toLowerCase(), effectiveness: 0.5, multiplier: 'x0.5' })),
      ...matchups.x0_25.map(t => ({ type: t.toLowerCase(), effectiveness: 0.25, multiplier: 'x0.25' })),
      ...matchups.x0.map(t => ({ type: t.toLowerCase(), effectiveness: 0, multiplier: 'x0' }))
    ];
    
    return allEffectiveness;
  };

  // TypeBadge with tooltip component
  const TypeBadgeWithTooltip = ({ type, className }: { type: string; className?: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
    const [tooltipAlignment, setTooltipAlignment] = useState<'left' | 'center' | 'right'>('center');
    
    // Get type weaknesses using the getMatchup function
    const matchups = getMatchup([type.charAt(0).toUpperCase() + type.slice(1)]);
    
    // Categorize what types are effective against this type
    const weakTo = matchups.x4.concat(matchups.x2).map(t => ({ type: t.toLowerCase(), multiplier: matchups.x4.includes(t) ? '4x' : '2x' }));
    const resists = matchups.x0_5.map(t => ({ type: t.toLowerCase(), multiplier: '0.5x' }));
    const quarterResists = matchups.x0_25.map(t => ({ type: t.toLowerCase(), multiplier: '0.25x' }));
    const immune = matchups.x0.map(t => ({ type: t.toLowerCase(), multiplier: '0x' }));
    
    return (
      <div className="relative inline-block">
        <div
          onMouseEnter={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const tooltipHeight = 200; // Approximate tooltip height
            const tooltipWidth = 256; // w-64 = 16rem = 256px
            const margin = 16; // 1rem margin from edge
            
            // Check vertical positioning
            if (rect.top < tooltipHeight + 20) {
              setTooltipPosition('bottom');
            } else {
              setTooltipPosition('top');
            }
            
            // Find the actual content container bounds - try multiple selectors
            let contentContainer = e.currentTarget.closest('.max-w-7xl, .container, main, [class*="max-w"]');
            
            // If no container found, try to find the main content area
            if (!contentContainer) {
              contentContainer = e.currentTarget.closest('[class*="grid"], [class*="flex"], .pokemon-details, .pokemon-hero') || document.body;
            }
            
            const containerRect = contentContainer.getBoundingClientRect();
            
            // Check horizontal positioning within the viewport
            const tooltipCenterX = rect.left + rect.width / 2;
            const tooltipLeft = tooltipCenterX - tooltipWidth / 2;
            const tooltipRight = tooltipCenterX + tooltipWidth / 2;
            
            // Use viewport bounds for better alignment
            const viewportLeft = margin;
            const viewportRight = window.innerWidth - margin;
            
            if (tooltipLeft < viewportLeft) {
              // Too far left, align to left edge of viewport
              setTooltipAlignment('left');
            } else if (tooltipRight > viewportRight) {
              // Too far right, align to right edge of viewport
              setTooltipAlignment('right');
            } else {
              // Center is fine
              setTooltipAlignment('center');
            }
            
            setShowTooltip(true);
          }}
          onMouseLeave={() => setShowTooltip(false)}
          className="inline-block"
        >
          <TypeBadge type={type} className={className} />
        </div>
        
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`absolute z-50 max-w-[min(16rem,calc(100vw-4rem))] ${
              tooltipPosition === 'top' 
                ? 'bottom-full mb-2' 
                : 'top-full mt-2'
            } ${
              tooltipAlignment === 'left'
                ? 'left-0'
                : tooltipAlignment === 'right'
                ? 'right-0'
                : 'left-1/2 transform -translate-x-1/2'
            }`}
          >
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs rounded-lg p-2 shadow-xl border border-gray-200 dark:border-gray-600 w-64 max-w-[min(16rem,calc(100vw-4rem))]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <TypeBadge type={type} className="text-sm px-2 py-1" />
                <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">Type Weaknesses</span>
              </div>
              
              {/* Four panels layout */}
              <div className="grid grid-cols-4 gap-1">
                {/* Double Weak (4x) */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5">
                  <h4 className="font-semibold text-xs mb-1 text-red-800 dark:text-red-200">Double Weak (4x)</h4>
                  <div className="space-y-0.5">
                    {matchups.x4.length > 0 ? (
                      matchups.x4.map((type) => (
                        <div key={type} className="flex items-center">
                          <TypeBadge type={type.toLowerCase()} className="text-xs px-1 py-0.5" />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                {/* Weak to (2x) */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-1.5">
                  <h4 className="font-semibold text-xs mb-1 text-orange-800 dark:text-orange-200">Weak to (2x)</h4>
                  <div className="space-y-0.5">
                    {matchups.x2.length > 0 ? (
                      matchups.x2.map((type) => (
                        <div key={type} className="flex items-center">
                          <TypeBadge type={type.toLowerCase()} className="text-xs px-1 py-0.5" />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                {/* Resists (0.5x) */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-1.5">
                  <h4 className="font-semibold text-xs mb-1 text-green-800 dark:text-green-200">Resists (0.5x)</h4>
                  <div className="space-y-0.5">
                    {matchups.x0_5.length > 0 ? (
                      matchups.x0_5.map((type) => (
                        <div key={type} className="flex items-center">
                          <TypeBadge type={type.toLowerCase()} className="text-xs px-1 py-0.5" />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                {/* Quarter Resists (0.25x) */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5">
                  <h4 className="font-semibold text-xs mb-1 text-blue-800 dark:text-blue-200">Quarter Resists (0.25x)</h4>
                  <div className="space-y-0.5">
                    {matchups.x0_25.length > 0 ? (
                      matchups.x0_25.map((type) => (
                        <div key={type} className="flex items-center">
                          <TypeBadge type={type.toLowerCase()} className="text-xs px-1 py-0.5" />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
                
                {/* Immune (0x) */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-1.5">
                  <h4 className="font-semibold text-xs mb-1 text-gray-800 dark:text-gray-200">Immune (0x)</h4>
                  <div className="space-y-0.5">
                    {matchups.x0.length > 0 ? (
                      matchups.x0.map((type) => (
                        <div key={type} className="flex items-center">
                          <TypeBadge type={type.toLowerCase()} className="text-xs px-1 py-0.5" />
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className={`absolute w-0 h-0 ${
              tooltipAlignment === 'left'
                ? 'left-4'
                : tooltipAlignment === 'right'
                ? 'right-4'
                : 'left-1/2 transform -translate-x-1/2'
            } ${
              tooltipPosition === 'top'
                ? 'top-full border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800'
                : 'bottom-full border-l-4 border-r-4 border-b-4 border-transparent border-b-white dark:border-b-gray-800'
            }`}></div>
          </motion.div>
        )}
      </div>
    );
  };

  // Helper function to map Pokémon names to Showdown sprite names
  const mapPokemonNameToShowdown = (name: string): string => {
    const base = name.toLowerCase().trim();
    const exceptions: Record<string, string> = {
      // Showdown uses a dot for Mr. Mime
      'mr-mime': 'mr.mime',
      // Mime Jr. drops hyphen and dot
      'mime-jr': 'mimejr',
      // Mr. Rime (Galar) uses a dot
      'mr-rime': 'mr.rime',
      // Ho-Oh uses "hooh" in Showdown
      'ho-oh': 'hooh',
      // Type: Null variations
      'type-null': 'typenull',
      // Jangmo-o family
      'jangmo-o': 'jangmoo',
      'hakamo-o': 'hakamo-o',
      'kommo-o': 'kommoo',
      // Porygon-Z
      'porygon-z': 'porygonz',
      // Nidoran variations
      'nidoran-f': 'nidoranf',
      'nidoran-m': 'nidoranm',
      // Deoxys forms
      'deoxys-attack': 'deoxysattack',
      'deoxys-defense': 'deoxysdefense',
      'deoxys-speed': 'deoxysspeed',
      // Wormadam forms
      'wormadam-plant': 'wormadam',
      'wormadam-sandy': 'wormadamsandy',
      'wormadam-trash': 'wormadamtrash',
      // Rotom forms
      'rotom-heat': 'rotomheat',
      'rotom-wash': 'rotomwash',
      'rotom-frost': 'rotomfrost',
      'rotom-fan': 'rotomfan',
      'rotom-mow': 'rotommow',
      // Giratina forms
      'giratina-origin': 'giratinaorigin',
      // Shaymin forms
      'shaymin-sky': 'shayminsky',
      // Arceus forms (simplified - just use base form for most)
      'arceus-fighting': 'arceus',
      'arceus-flying': 'arceus',
      'arceus-poison': 'arceus',
      'arceus-ground': 'arceus',
      'arceus-rock': 'arceus',
      'arceus-bug': 'arceus',
      'arceus-ghost': 'arceus',
      'arceus-steel': 'arceus',
      'arceus-fire': 'arceus',
      'arceus-water': 'arceus',
      'arceus-grass': 'arceus',
      'arceus-electric': 'arceus',
      'arceus-psychic': 'arceus',
      'arceus-ice': 'arceus',
      'arceus-dragon': 'arceus',
      'arceus-dark': 'arceus',
      'arceus-fairy': 'arceus',
      // Basculin forms
      'basculin-red-striped': 'basculin',
      'basculin-blue-striped': 'basculinbluestriped',
      // Darmanitan forms
      'darmanitan-zen': 'darmanitanzen',
      'darmanitan-galar': 'darmanitangalar',
      'darmanitan-galar-zen': 'darmanitangalarzen',
      // Deerling forms
      'deerling-summer': 'deerling',
      'deerling-autumn': 'deerlingautumn',
      'deerling-winter': 'deerlingwinter',
      // Sawsbuck forms
      'sawsbuck-summer': 'sawsbuck',
      'sawsbuck-autumn': 'sawsbuckautumn',
      'sawsbuck-winter': 'sawsbuckwinter',
      // Tornadus forms
      'tornadus-therian': 'tornadustherian',
      // Thundurus forms
      'thundurus-therian': 'thundurustherian',
      // Landorus forms
      'landorus-therian': 'landorustherian',
      // Kyurem forms
      'kyurem-black': 'kyuremblack',
      'kyurem-white': 'kyuremwhite',
      // Keldeo forms
      'keldeo-resolute': 'keldeoresolute',
      // Meloetta forms
      'meloetta-pirouette': 'meloettapirouette',
      // Genesect forms
      'genesect-douse': 'genesectdouse',
      'genesect-shock': 'genesectshock',
      'genesect-burn': 'genesectburn',
      'genesect-chill': 'genesectchill',
      // Vivillon forms (simplified - use base form)
      'vivillon-polar': 'vivillon',
      'vivillon-tundra': 'vivillon',
      'vivillon-continental': 'vivillon',
      'vivillon-garden': 'vivillon',
      'vivillon-elegant': 'vivillon',
      'vivillon-meadow': 'vivillon',
      'vivillon-modern': 'vivillon',
      'vivillon-marine': 'vivillon',
      'vivillon-archipelago': 'vivillon',
      'vivillon-high-plains': 'vivillon',
      'vivillon-sandstorm': 'vivillon',
      'vivillon-river': 'vivillon',
      'vivillon-monsoon': 'vivillon',
      'vivillon-savanna': 'vivillon',
      'vivillon-sun': 'vivillon',
      'vivillon-ocean': 'vivillon',
      'vivillon-jungle': 'vivillon',
      'vivillon-fancy': 'vivillon',
      'vivillon-pokeball': 'vivillon',
      // Flabébé forms
      'flabebe-yellow': 'flabebeyellow',
      'flabebe-orange': 'flabebeorange',
      'flabebe-blue': 'flabebeblue',
      'flabebe-white': 'flabebewhite',
      // Floette forms
      'floette-yellow': 'floetteyellow',
      'floette-orange': 'floetteorange',
      'floette-blue': 'floetteblue',
      'floette-white': 'floettewhite',
      'floette-eternal': 'floetteeternal',
      // Florges forms
      'florges-yellow': 'florgesyellow',
      'florges-orange': 'florgesorange',
      'florges-blue': 'florgesblue',
      'florges-white': 'florgeswhite',
      // Furfrou forms (simplified - use base form)
      'furfrou-heart': 'furfrou',
      'furfrou-star': 'furfrou',
      'furfrou-diamond': 'furfrou',
      'furfrou-debutante': 'furfrou',
      'furfrou-matron': 'furfrou',
      'furfrou-dandy': 'furfrou',
      'furfrou-la-reine': 'furfrou',
      'furfrou-kabuki': 'furfrou',
      'furfrou-pharaoh': 'furfrou',
      // Meowstic forms
      'meowstic-female': 'meowsticf',
      // Aegislash forms
      'aegislash-blade': 'aegislashblade',
      // Pumpkaboo forms
      'pumpkaboo-small': 'pumpkaboosmall',
      'pumpkaboo-large': 'pumpkaboolarge',
      'pumpkaboo-super': 'pumpkaboosuper',
      // Gourgeist forms
      'gourgeist-small': 'gourgeistsmall',
      'gourgeist-large': 'gourgeistlarge',
      'gourgeist-super': 'gourgeistsuper',
      // Xerneas forms
      'xerneas-neutral': 'xerneas',
      // Zygarde forms
      'zygarde-10': 'zygarde10',
      'zygarde-complete': 'zygardecomplete',
      // Hoopa forms
      'hoopa-unbound': 'hoopaunbound',
      // Oricorio forms
      'oricorio-pom-pom': 'oricoriopompom',
      'oricorio-pau': 'oricoriopau',
      'oricorio-sensu': 'oricoriosensu',
      // Lycanroc forms
      'lycanroc-midnight': 'lycanrocmidnight',
      'lycanroc-dusk': 'lycanrocdusk',
      // Wishiwashi forms
      'wishiwashi-school': 'wishiwashischool',
      // Silvally forms
      'silvally-fighting': 'silvally',
      'silvally-flying': 'silvally',
      'silvally-poison': 'silvally',
      'silvally-ground': 'silvally',
      'silvally-rock': 'silvally',
      'silvally-bug': 'silvally',
      'silvally-ghost': 'silvally',
      'silvally-steel': 'silvally',
      'silvally-fire': 'silvally',
      'silvally-water': 'silvally',
      'silvally-grass': 'silvally',
      'silvally-electric': 'silvally',
      'silvally-psychic': 'silvally',
      'silvally-ice': 'silvally',
      'silvally-dragon': 'silvally',
      'silvally-dark': 'silvally',
      'silvally-fairy': 'silvally',
      // Minior forms
      'minior-red-meteor': 'minior',
      'minior-orange-meteor': 'minior',
      'minior-yellow-meteor': 'minior',
      'minior-green-meteor': 'minior',
      'minior-blue-meteor': 'minior',
      'minior-indigo-meteor': 'minior',
      'minior-violet-meteor': 'minior',
      'minior-red': 'miniorred',
      'minior-orange': 'miniororange',
      'minior-yellow': 'minioryellow',
      'minior-green': 'miniorgreen',
      'minior-blue': 'miniorblue',
      'minior-indigo': 'miniorindigo',
      'minior-violet': 'miniorviolet',
      // Mimikyu forms
      'mimikyu-busted': 'mimikyubusted',
      // Necrozma forms
      'necrozma-dawn-wings': 'necrozmadawnwings',
      'necrozma-dusk-mane': 'necrozmaduskmane',
      'necrozma-ultra': 'necrozmaultra',
      // Magearna forms
      'magearna-original': 'magearnaoriginal',
      // Cramorant forms
      'cramorant-gulping': 'cramorantgulping',
      'cramorant-gorging': 'cramorantgorging',
      // Toxtricity forms
      'toxtricity-low-key': 'toxtricitylowkey',
      // Sinistea forms
      'sinistea-antique': 'sinisteaantique',
      // Polteageist forms
      'polteageist-antique': 'polteageistantique',
      // Alcremie forms (simplified - use base form)
      'alcremie-vanilla-cream': 'alcremie',
      'alcremie-ruby-cream': 'alcremie',
      'alcremie-matcha-cream': 'alcremie',
      'alcremie-mint-cream': 'alcremie',
      'alcremie-lemon-cream': 'alcremie',
      'alcremie-salted-cream': 'alcremie',
      'alcremie-ruby-swirl': 'alcremie',
      'alcremie-caramel-swirl': 'alcremie',
      'alcremie-rainbow-swirl': 'alcremie',
      // Eiscue forms
      'eiscue-noice': 'eiscuenoice',
      // Indeedee forms
      'indeedee-female': 'indeedee',
      // Morpeko forms
      'morpeko-hangry': 'morpekohangry',
      // Zacian forms
      'zacian-crowned': 'zaciancrowned',
      // Zamazenta forms
      'zamazenta-crowned': 'zamazentacrowned',
      // Eternatus forms
      'eternatus-eternamax': 'eternatuseternamax',
      // Urshifu forms
      'urshifu-rapid-strike': 'urshifurapidstrike',
      // Zarude forms
      'zarude-dada': 'zarudedada',
      // Calyrex forms
      'calyrex-ice': 'calyrexice',
      'calyrex-shadow': 'calyrexshadow',
      // Enamorus forms
      'enamorus-therian': 'enamorustherian',
      // Basculegion forms
      'basculegion-female': 'basculegionf',
      // Oinkologne forms
      'oinkologne-female': 'oinkolognef',
      // Dudunsparce forms
      'dudunsparce-three-segment': 'dudunsparcethreesegment',
      // Tatsugiri forms
      'tatsugiri-droopy': 'tatsugiridroopy',
      'tatsugiri-stretchy': 'tatsugiristretchy',
      // Palafin forms
      'palafin-hero': 'palafinhero',
      // Maushold forms
      'maushold-family-of-three': 'mausholdfamilyofthree',
      // Squawkabilly forms
      'squawkabilly-yellow': 'squawkabillyyellow',
      'squawkabilly-white': 'squawkabillywhite',
      // Gimmighoul forms
      'gimmighoul-roaming': 'gimmighoulroaming',
      // Gholdengo forms
      'gholdengo-chest': 'gholdengochest',
      // Wooper forms
      'wooper-paldea': 'wooperpaldea',
      // Tauros forms
      'tauros-paldea-combat': 'taurospaldeacombat',
      'tauros-paldea-blaze': 'taurospaldeablaze',
      'tauros-paldea-aqua': 'taurospaldeaaqua',
      // Girafarig forms
      'girafarig-farigiraf': 'girafarigfarigiraf',
      // Primeape forms
      'primeape-annihilape': 'primeapeannihilape',
      // Dunsparce forms
      'dunsparce-dudunsparce': 'dunsparcedudunsparce',
      // Dudunsparce forms
      'dudunsparce-two-segment': 'dudunsparcetwosegment',
      // Poltchageist forms
      'poltchageist-artisan': 'poltchageistartisan',
      // Sinistcha forms
      'sinistcha-masterpiece': 'sinistchamasterpiece',
      // Okidogi forms
      'okidogi-loyal-three': 'okidogiloyalthree',
      // Munkidori forms
      'munkidori-loyal-three': 'munkidoriloyalthree',
      // Fezandipiti forms
      'fezandipiti-loyal-three': 'fezandipitiloyalthree',
      // Ogerpon forms
      'ogerpon-wellspring': 'ogerponwellspring',
      'ogerpon-hearthflame': 'ogerponhearthflame',
      'ogerpon-cornerstone': 'ogerponcornerstone',
      // Terapagos forms
      'terapagos-terastal': 'terapagosterastal',
      'terapagos-stellar': 'terapagostellar',
      // Pecharunt forms
      'pecharunt-malicious': 'pecharuntmalicious'
    };
    
    const hyphenated = base.replace(/\s+/g, '-');
    return exceptions[hyphenated] || hyphenated;
  };

  // Helper function to check if a sprite is available for a specific generation
  const isSpriteAvailable = (gen: string, pokemonName: string, orientation: 'front' | 'back', shiny: boolean, gender: 'male' | 'female'): boolean => {
    // Some generations don't have certain Pokémon
    const pokemonId = pokemon.id;
    const mappedName = mapPokemonNameToShowdown(pokemonName);
    
    // Special handling for Gen 6 - newer Pokemon use PokemonDB GO sprites
    if (gen === 'gen6' && pokemonId > 721) {
      // For newer Pokemon (Gen 7+), assume they're available in GO
      return true;
    }
    
    // Special handling for Gen 7-9 - use PokemonDB sprites
    if (['gen7', 'gen8', 'gen9'].includes(gen)) {
      // PokemonDB provides mostly front sprites; treat back and female variants as unavailable
      if (orientation === 'back') return false;
      if (gender === 'female') return false;
      if (shiny) {
        if (gen === 'gen9') return true; // SV/HOME: treat shiny as available
        if (gen === 'gen8') return true; // SwSh/HOME: treat shiny as available
        if (gen === 'gen7') {
          // Gen 7 shinies are reliably available for Gen 7 natives
          return pokemon.id >= 722 && pokemon.id <= 809;
        }
      }
      return true;
    }
    
    // Check if Pokémon exists in that generation
    const generationRanges: Record<string, { start: number; end: number }> = {
      'gen1': { start: 1, end: 151 },
      'gen1rb': { start: 1, end: 151 },
      'gen1rg': { start: 1, end: 151 },
      'gen1frlg': { start: 1, end: 151 },
      'gen2': { start: 1, end: 251 },
      'gen2g': { start: 1, end: 251 },
      'gen2s': { start: 1, end: 251 },
      'gen3': { start: 1, end: 386 },
      'gen3rs': { start: 1, end: 386 },
      'gen3frlg': { start: 1, end: 151 }, // FireRed/LeafGreen only have Gen 1 Pokémon
      'gen4': { start: 1, end: 493 },
      'gen4dp': { start: 1, end: 493 },
      'gen5': { start: 1, end: 649 },
      'gen5ani': { start: 1, end: 649 }, // Gen 5 animated sprites
      'gen6': { start: 1, end: 721 }, // Gen 6 original Pokemon only (newer ones use PokemonDB)
      'gen6ani': { start: 1, end: 721 } // Gen 6 animated sprites (formerly GIF) - only up to Gen 6
    };

    const range = generationRanges[gen];
    if (!range || pokemonId < range.start || pokemonId > range.end) {
      return false;
    }

    // Some specific Pokémon don't have sprites in certain generations
    const unavailableInGen: Record<string, number[]> = {
      'gen1': [],
      'gen1rb': [],
      'gen1rg': [],
      'gen1frlg': [],
      'gen2': [],
      'gen2g': [],
      'gen2s': [],
      'gen3': [],
      'gen3rs': [],
      'gen3frlg': [],
      'gen4': [],
      'gen4dp': [],
      'gen5': [],
      'gen5ani': [],
      'gen6': [],
      'gen6ani': []
    };

    if (unavailableInGen[gen]?.includes(pokemonId)) {
      return false;
    }

    // Check if shiny sprites are available for this generation
    // Early generations (Gen 1-2) had limited shiny support
    if (shiny) {
      const shinySupportedGenerations = ['gen2', 'gen2g', 'gen2s', 'gen3', 'gen3rs', 'gen3frlg', 'gen4', 'gen4dp', 'gen5', 'gen5ani', 'gen6', 'gen6ani'];
      if (!shinySupportedGenerations.includes(gen)) {
        return false;
      }
    }

        // Check if back sprites are available for this generation
        // Some generations don't have back sprites on Pokémon Showdown
        if (orientation === 'back') {
          const backSpriteSupportedGenerations = ['gen1', 'gen1rb', 'gen1rg', 'gen2', 'gen2g', 'gen2s', 'gen3', 'gen3rs', 'gen4', 'gen4dp', 'gen5', 'gen5ani', 'gen6ani'];
          if (!backSpriteSupportedGenerations.includes(gen)) {
            return false;
          }
        }

    return true;
  };

  // Helper function to check if female sprites are available for a generation
  const hasFemaleSprites = (gen: string, pokemonName: string): boolean => {
    // Most generation sprites don't have gender differences
    // Only newer generations (Gen 4+) and some specific cases have gender differences
    const pokemonId = pokemon.id;
    
    // Pokémon with known gender differences in sprites
    const genderDifferencePokemon = [
      25, // Pikachu
      26, // Raichu
      41, // Zubat
      42, // Golbat
      64, // Kadabra
      65, // Alakazam
      84, // Doduo
      85, // Dodrio
      97, // Hypno
      111, // Rhyhorn
      112, // Rhydon
      118, // Goldeen
      119, // Seaking
      123, // Scyther
      124, // Jynx
      129, // Magikarp
      130, // Gyarados
      133, // Eevee
      134, // Vaporeon
      135, // Jolteon
      136, // Flareon
      143, // Snorlax
      144, // Articuno
      145, // Zapdos
      146, // Moltres
      150, // Mewtwo
      151, // Mew
      // Add more as needed
    ];

    // Only newer generations typically have gender differences in sprites
    const hasGenderDifferences = ['gen4', 'gen4dp', 'gen5', 'gen5ani', 'gen6', 'gen6ani'].includes(gen);
    
    return hasGenderDifferences && genderDifferencePokemon.includes(pokemonId);
  };

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

  // Determine availability of front/back based on current selections
  const female = gender === 'female';
  const shiny = isShiny;
  const official = pokemon.sprites.other['official-artwork'];
  const home = pokemon.sprites.other.home;
  const base = pokemon.sprites;

  const hasFront = (() => {
    switch (style) {
      case 'official':
      case 'portrait':
      case 'fallback':
        return true; // Only front conceptually
      case 'sprite':
        // Generation sprites are assumed to exist for front view
        return true;
    }
  })();

  const hasBack = (() => {
    switch (style) {
      case 'official':
      case 'portrait':
      case 'fallback':
        return false; // No back assets for these
      case 'sprite':
        // Check if back sprites are available for the current generation
        return isSpriteAvailable(generation, pokemon.name, 'back', isShiny, gender);
    }
  })();

  // Determine whether current style/orientation supports female or shiny variants
  const hasFemaleForSelection = (() => {
    switch (style) {
      case 'official':
        // HOME may provide female variants used as fallback
        return !!(home?.front_female || home?.front_shiny_female);
      case 'portrait':
      case 'fallback':
        return false; // Not differentiated by gender
      case 'sprite': {
        // Check if the current generation supports female sprites for this Pokémon
        return hasFemaleSprites(generation, pokemon.name);
      }
    }
  })();

  const hasShinyForSelection = (() => {
    switch (style) {
      case 'portrait':
      case 'fallback':
        return false;
      case 'official':
        // Allow shiny via Official or HOME fallbacks (including female if available)
        if (female) return !!home?.front_shiny_female;
        return !!(official.front_shiny || home?.front_shiny);
      case 'sprite': {
        // For PokemonDB-powered gens we can fall back to PokeAPI shiny assets, so allow shiny
        if (generation === 'gen8' || generation === 'gen9' || generation === 'gen7') {
          return true;
        }
        // Gen 6 newer Pokémon via GO sprites
        if (generation === 'gen6' && pokemon.id > 721) {
          return true;
        }
        // For older generations using Showdown, check availability strictly
        return isSpriteAvailable(generation, pokemon.name, orientation, true, gender);
      }
    }
  })();

  // Auto-correct orientation when unavailable
  useEffect(() => {
    if (orientation === 'back' && !hasBack && hasFront) {
      setOrientation('front');
    } else if (orientation === 'front' && !hasFront && hasBack) {
      setOrientation('back');
    }
  }, [style, gender, isShiny, hasBack, hasFront, generation]);

  // Auto-correct gender/shiny when unsupported for current selection
  useEffect(() => {
    if (gender === 'female' && !hasFemaleForSelection) {
      setGender('male');
    }
    if (isShiny && !hasShinyForSelection) {
      setIsShiny(false);
    }
  }, [style, orientation, gender, isShiny, hasFemaleForSelection, hasShinyForSelection]);


  // Auto-correct generation and shiny when current combination is not available
  useEffect(() => {
    if (style === 'sprite' && !isSpriteAvailable(generation, pokemon.name, orientation, isShiny, gender)) {
      // Find the first available combination
      const availableGenerations = [
        'gen1', 'gen1rb', 'gen1rg', 'gen1frlg', 'gen2', 'gen2g', 'gen2s', 
        'gen3', 'gen3rs', 'gen3frlg', 'gen4', 'gen4dp', 'gen5', 'gen5ani', 'gen6', 'gen6ani',
        'gen7', 'gen8', 'gen9'
      ];
      
      // First try to find a generation that supports the current shiny state
      let firstAvailable = availableGenerations.find(gen => 
        isSpriteAvailable(gen, pokemon.name, orientation, isShiny, gender)
      );
      
      // If no generation supports the current shiny state, try with non-shiny
      if (!firstAvailable && isShiny) {
        firstAvailable = availableGenerations.find(gen => 
          isSpriteAvailable(gen, pokemon.name, orientation, false, gender)
        );
        if (firstAvailable) {
          setIsShiny(false);
        }
      }
      
      if (firstAvailable) {
        setGeneration(firstAvailable as typeof generation);
      }
    }
  }, [style, generation, pokemon.name, orientation, isShiny, gender]);
  
  return (
    <header 
      className="relative mb-6 rounded-2xl border border-border bg-surface p-6 overflow-visible"
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
          {/* Navigation Buttons - Desktop Only */}
          <div className="hidden lg:flex items-center gap-4 order-1">
            <button
              onClick={goToPrevious}
              disabled={pokemon.id <= 1}
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              title={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
            >
              <ChevronLeft className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
            </button>
          </div>

          {/* Pokemon Image */}
          <div
            style={{ viewTransitionName: vtName } as React.CSSProperties}
            className="rounded-xl bg-white/70 dark:bg-zinc-800/70 p-3 flex-shrink-0 order-2 lg:order-2"
          >
            {style !== 'pmd' && imageSrc && (
              <Image 
                src={imageSrc}
                alt={pokemon.name}
                width={140} 
                height={140} 
                className={`h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 object-contain`} 
                priority 
                onError={() => {
                  // Fallback to PokeAPI sprite if PokemonDB sprite fails
                  // Respect the current shiny state
                  const fallbackPath = isShiny ? `shiny/${pokemon.id}` : `${pokemon.id}`;
                  setImageSrc(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fallbackPath}.png`);
                }}
              />
            )}
            {style === 'pmd' && selectedPmdAnim && (
              <div className="h-32 w-32 sm:h-36 sm:w-36 lg:h-40 lg:w-40 flex items-center justify-center">
                <HeroPmdSprite pokemonId={pokemon.id} animName={selectedPmdAnim} scale={2} />
              </div>
            )}
          </div>
          
          {/* Pokemon Info - Side Layout on Desktop, Below on Mobile */}
          <div className="min-w-0 flex-1 order-3 lg:order-3 text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-text">
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </h1>
              
              {/* Special Form Indicators */}
              {pokemon.special_form && (
                <div className="mt-2 flex flex-wrap gap-2 justify-center lg:justify-start">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    pokemon.special_form.type === 'mega' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                  }`}>
                    {pokemon.special_form.type === 'mega' ? '⚡ Mega Evolution' : '🔥 Primal Reversion'}
                    {pokemon.special_form.variant && ` ${pokemon.special_form.variant}`}
                  </span>
                  
                  <Tooltip
                    variant="info"
                    content={pokemon.special_form.description}
                    title="Special Form Description"
                    className="cursor-help"
                  >
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Base: {pokemon.special_form.base_pokemon_name}
                    </span>
                  </Tooltip>
                </div>
              )}
            </div>
            
            {pokemon.id !== 0 && (
              <div className="flex items-center gap-2 justify-center lg:justify-start mt-1">
                <p className="text-muted text-base sm:text-lg lg:text-xl">
                  #{String(pokemon.id).padStart(4, "0")}
                </p>
                {(() => {
                  // Use special form Japanese name if available, otherwise fall back to regular
                  const japaneseName = pokemon.special_form?.japanese_name || getPokemonJapaneseName(pokemon.id)
                  if (japaneseName) {
                    return (
                      <Tooltip
                        variant="japanese"
                        content={typeof japaneseName === 'string' ? japaneseName : japaneseName.japanese}
                        title="Japanese Name"
                        romaji={typeof japaneseName === 'string' ? '' : japaneseName.romaji}
                        meaning={typeof japaneseName === 'string' ? '' : japaneseName.meaning}
                        explanation={typeof japaneseName === 'string' ? '' : japaneseName.explanation}
                        className="cursor-help"
                      >
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
                          {typeof japaneseName === 'string' ? japaneseName : japaneseName.japanese}
                        </span>
                      </Tooltip>
                    )
                  }
                  return null
                })()}
              </div>
            )}
            
            <div className="mt-3 flex gap-2 flex-wrap justify-center lg:justify-start">
              {pokemon.types.map((typeObj) => (
                <TypeBadgeWithTooltip 
                  key={typeObj.type.name} 
                  type={typeObj.type.name} 
                  className="text-sm sm:text-base"
                />
              ))}
            </div>

            {/* Image style selector */}
            <div className="mt-4 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              {/* Style selector */}
              <div ref={portraitDropdownRef} className="inline-flex rounded-lg border border-border relative">
                {[
                  { key: 'official', label: 'Official' },
                  { key: 'portrait', label: 'Portrait', hasDropdown: true },
                  { key: 'pmd', label: 'Animation', hasDropdown: true },
                  { key: 'sprite', label: 'Sprite' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (opt.key === 'portrait' && opt.hasDropdown) {
                        setStyle('portrait');
                        setShowPortraitDropdown(!showPortraitDropdown);
                        setShowPmdDropdown(false);
                      } else if (opt.key === 'pmd' && opt.hasDropdown) {
                        setStyle('pmd');
                        setShowPmdDropdown(!showPmdDropdown);
                        setShowPortraitDropdown(false);
                      } else {
                        setStyle(opt.key as typeof style);
                        setShowPortraitDropdown(false);
                        setShowPmdDropdown(false);
                      }
                    }}
                    className={`px-3 py-1 text-sm flex items-center gap-1 relative ${style === opt.key ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                  >
                    {opt.label}
                    {opt.hasDropdown && (
                      <svg 
                        className="w-3 h-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                ))}
                
                {/* Portrait dropdown menu - positioned outside of buttons */}
                {showPortraitDropdown && style === 'portrait' && (
                  <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-lg shadow-xl z-[100] min-w-[140px] max-h-60 overflow-y-auto">
                    {availablePortraits.map((portrait) => (
                      <button
                        key={portrait.filename}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPortrait(portrait.filename);
                          setShowPortraitDropdown(false);
                        }}
                        className={`w-full px-4 py-2 text-sm text-left first:rounded-t-lg last:rounded-b-lg hover:bg-surface-hover transition-colors ${
                          selectedPortrait === portrait.filename ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium' : ''
                        }`}
                      >
                        {portrait.displayName}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* PMD dropdown menu - positioned outside of buttons */}
                {showPmdDropdown && style === 'pmd' && (
                  <div className="absolute top-full left-0 mt-2 bg-surface border border-border rounded-lg shadow-xl z-[100] min-w-[140px] max-h-60 overflow-y-auto">
                    {pmdAnims && pmdAnims.length > 0 ? (
                      pmdAnims.map((anim) => (
                        <button
                          key={anim.name}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPmdAnim(anim.name);
                            setShowPmdDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-sm text-left first:rounded-t-lg last:rounded-b-lg hover:bg-surface-hover transition-colors ${
                            selectedPmdAnim === anim.name ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium' : ''
                          }`}
                        >
                          {anim.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-muted">
                        {pmdError ? 'Error loading animations' : 'No PMD sprites found'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Always-available appearance selectors (Normal/Shiny) */}
            <div className="mt-2 flex items-center justify-center lg:justify-start gap-3 flex-wrap">
              <AnimatePresence initial={false}>
              {style !== 'portrait' && style !== 'pmd' && (
              <motion.div
                key="shiny-controls"
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="inline-flex rounded-lg border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setIsShiny(false)}
                  className={`px-3 py-1 text-sm ${!isShiny ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setIsShiny(true)}
                  disabled={!hasShinyForSelection}
                  className={`px-3 py-1 text-sm ${isShiny ? 'bg-surface text-text' : 'bg-transparent text-muted'} ${!hasShinyForSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!hasShinyForSelection ? `Shiny not available for ${pokemon.name} in ${style === 'sprite' ? generation : 'official'}` : 'Shiny'}
                >
                  Shiny
                </button>
              </motion.div>
              )}
              </AnimatePresence>
            </div>

            {/* Sprite-specific selectors: animate in when Sprite is selected */}
            <AnimatePresence initial={false}>
              {style === 'sprite' && (
                <motion.div
                  key="sprite-controls"
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-2 flex items-center justify-center lg:justify-start gap-3 flex-wrap"
                >
              {/* Generation selector */}
              <div className={`inline-flex rounded-lg overflow-hidden flex-wrap border border-border`}>
                  {[
                    // Unified generation list with PokemonDB integration for newer generations
                    { key: 'gen1', label: 'Gen 1', group: 'gen1' },
                    { key: 'gen1rb', label: 'R/B', group: 'gen1' },
                    { key: 'gen1rg', label: 'R/G', group: 'gen1' },
                    { key: 'gen1frlg', label: 'FR/LG', group: 'gen1' },
                    { key: 'gen2', label: 'Gen 2', group: 'gen2' },
                    { key: 'gen2g', label: 'G/S', group: 'gen2' },
                    { key: 'gen2s', label: 'Crystal', group: 'gen2' },
                    { key: 'gen3', label: 'Gen 3', group: 'gen3' },
                    { key: 'gen3rs', label: 'R/S', group: 'gen3' },
                    { key: 'gen3frlg', label: 'FR/LG', group: 'gen3' },
                    { key: 'gen4', label: 'Gen 4', group: 'gen4' },
                    { key: 'gen4dp', label: 'D/P', group: 'gen4' },
                    { key: 'gen5', label: 'Gen 5', group: 'gen5' },
                    { key: 'gen5ani', label: 'Gen 5 Ani', group: 'gen5' },
                    { key: 'gen6', label: 'Gen 6', group: 'gen6' },
                    { key: 'gen6ani', label: 'Gen 6 Ani', group: 'gen6' },
                    { key: 'gen7', label: 'Gen 7', group: 'gen7' },
                    { key: 'gen8', label: 'Gen 8', group: 'gen8' },
                    { key: 'gen9', label: 'Gen 9', group: 'gen9' }
                  ].map(opt => {
                    // Check availability for generation sprites
                    let isAvailable = false;
                    
                    if (['gen7', 'gen8', 'gen9'].includes(opt.key)) {
                      // Use isSpriteAvailable to reflect orientation/shiny/gender constraints for newer gens
                      isAvailable = isSpriteAvailable(opt.key, pokemon.name, orientation, isShiny, gender);
                    } else {
                      // For older generations using Showdown, use existing logic
                      isAvailable = isSpriteAvailable(opt.key, pokemon.name, orientation, isShiny, gender);
                    }
                    
                    const isDisabled = !isAvailable;
                    
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          if (isAvailable) {
                            setGeneration(opt.key as typeof generation);
                            setStyle('sprite'); // Switch to sprite style when selecting a generation
                          }
                        }}
                        disabled={isDisabled}
                        className={`px-2 py-1 text-xs ${
                          (style === 'sprite' && generation === opt.key)
                            ? 'bg-surface text-text'
                            : isDisabled
                              ? 'bg-transparent text-muted opacity-30 cursor-not-allowed'
                              : 'bg-transparent text-muted hover:bg-surface/50'
                        }`}
                        title={isDisabled ? `Not available for ${pokemon.name}` : opt.label}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

              {/* Orientation selector */}
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOrientation('front')}
                  disabled={!hasFront}
                  className={`px-3 py-1 text-sm ${orientation === 'front' ? 'bg-surface text-text' : 'bg-transparent text-muted'} ${!hasFront ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('back')}
                  disabled={!hasBack}
                  className={`px-3 py-1 text-sm ${orientation === 'back' ? 'bg-surface text-text' : 'bg-transparent text-muted'} ${!hasBack ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!hasBack ? `Back sprites not available for ${generation}` : 'Back'}
                >
                  Back
                </button>
              </div>

              {/* Gender selector (also visible within sprite controls) */}
              <div className="inline-flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`px-3 py-1 text-sm ${gender === 'male' ? 'bg-surface text-text' : 'bg-transparent text-muted'}`}
                >
                  ♂ Male
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  disabled={!hasFemaleForSelection}
                  className={`px-3 py-1 text-sm ${gender === 'female' ? 'bg-surface text-text' : 'bg-transparent text-muted'} ${!hasFemaleForSelection ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  ♀ Female
                </button>
              </div>
              
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons - Desktop Only */}
          <div className="hidden lg:flex items-center gap-4 order-4">
            <button
              onClick={goToNext}
              disabled={pokemon.id >= 1025}
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              title={`Next Pokémon (#${String(pokemon.id + 1).padStart(4, "0")})`}
            >
              <ChevronRight className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
            </button>
          </div>
        </div>

        {/* Quick Stats Row - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted">
          <Stat label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} icon="📏" />
          <Stat label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} icon="🏋️" />
          <Stat label="Base Exp" value={pokemon.base_experience} icon="⚡" />
          <Stat label="Types" value={<div className="flex flex-wrap justify-center gap-1">{pokemon.types.map((t, index) => <TypeBadgeWithTooltip key={`${t.type.name}-${index}`} type={t.type.name}/>)}</div>} icon="🧪" />
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

        {/* Mobile Navigation Buttons */}
        <div className="flex lg:hidden items-center justify-center gap-4 mt-4">
          <button
            onClick={goToPrevious}
            disabled={pokemon.id <= 1}
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            title={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
          >
            <ChevronLeft className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
          </button>
          <button
            onClick={goToNext}
            disabled={pokemon.id >= 1025}
            className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
            title={`Next Pokémon (#${String(pokemon.id + 1).padStart(4, "0")})`}
          >
            <ChevronRight className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
          </button>
        </div>

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
