"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Pokemon } from "@/types/pokemon";
import AbilityBadge from "@/components/AbilityBadge";
import { useReducedMotionPref } from "@/hooks/useReducedMotionPref";
import Tooltip from './Tooltip'
import { getPokemonJapaneseName } from '@/lib/japaneseNames'
import TypeBadgeWithTooltip from "@/components/TypeBadgeWithTooltip";

import { getBestPokemonDBSprite } from "@/lib/pokemonDbSprites";
import { getAvailablePortraits, getPortraitURL, PortraitExpression } from "@/lib/pmdPortraits";
import { isSpecialForm, getSpecialFormInfo } from '@/lib/specialForms';
import { fetchAllPokemonIds } from '@/lib/api';
import { usePmdAnimations } from '@/components/HeroPmdSprite';
import HeroPmdSprite from '@/components/HeroPmdSprite';
import { AbilitySkeleton, DescriptionSkeleton, GenusSkeleton } from '@/components/skeletons/PokemonDetailsSkeleton';

const showdownExceptions: Record<string, string> = {
  'mr-mime': 'mr.mime', 'mime-jr': 'mimejr', 'mr-rime': 'mr.rime',
  'ho-oh': 'hooh', 'type-null': 'typenull',
  'jangmo-o': 'jangmoo', 'hakamo-o': 'hakamo-o', 'kommo-o': 'kommoo',
  'porygon-z': 'porygonz', 'nidoran-f': 'nidoranf', 'nidoran-m': 'nidoranm',
  'deoxys-attack': 'deoxysattack', 'deoxys-defense': 'deoxysdefense', 'deoxys-speed': 'deoxysspeed',
  'wormadam-plant': 'wormadam', 'wormadam-sandy': 'wormadamsandy', 'wormadam-trash': 'wormadamtrash',
  'rotom-heat': 'rotomheat', 'rotom-wash': 'rotomwash', 'rotom-frost': 'rotomfrost',
  'rotom-fan': 'rotomfan', 'rotom-mow': 'rotommow',
  'giratina-origin': 'giratinaorigin', 'shaymin-sky': 'shayminsky',
  'arceus-fighting': 'arceus', 'arceus-flying': 'arceus', 'arceus-poison': 'arceus',
  'arceus-ground': 'arceus', 'arceus-rock': 'arceus', 'arceus-bug': 'arceus',
  'arceus-ghost': 'arceus', 'arceus-steel': 'arceus', 'arceus-fire': 'arceus',
  'arceus-water': 'arceus', 'arceus-grass': 'arceus', 'arceus-electric': 'arceus',
  'arceus-psychic': 'arceus', 'arceus-ice': 'arceus', 'arceus-dragon': 'arceus',
  'arceus-dark': 'arceus', 'arceus-fairy': 'arceus',
  'basculin-red-striped': 'basculin', 'basculin-blue-striped': 'basculinbluestriped',
  'darmanitan-zen': 'darmanitanzen', 'darmanitan-galar': 'darmanitangalar',
  'darmanitan-galar-zen': 'darmanitangalarzen',
  'deerling-summer': 'deerling', 'deerling-autumn': 'deerlingautumn', 'deerling-winter': 'deerlingwinter',
  'sawsbuck-summer': 'sawsbuck', 'sawsbuck-autumn': 'sawsbuckautumn', 'sawsbuck-winter': 'sawsbuckwinter',
  'tornadus-therian': 'tornadustherian', 'thundurus-therian': 'thundurustherian',
  'landorus-therian': 'landorustherian',
  'kyurem-black': 'kyuremblack', 'kyurem-white': 'kyuremwhite',
  'keldeo-resolute': 'keldeoresolute', 'meloetta-pirouette': 'meloettapirouette',
  'genesect-douse': 'genesectdouse', 'genesect-shock': 'genesectshock',
  'genesect-burn': 'genesectburn', 'genesect-chill': 'genesectchill',
  'vivillon-polar': 'vivillon', 'vivillon-tundra': 'vivillon', 'vivillon-continental': 'vivillon',
  'vivillon-garden': 'vivillon', 'vivillon-elegant': 'vivillon', 'vivillon-meadow': 'vivillon',
  'vivillon-modern': 'vivillon', 'vivillon-marine': 'vivillon', 'vivillon-archipelago': 'vivillon',
  'vivillon-high-plains': 'vivillon', 'vivillon-sandstorm': 'vivillon', 'vivillon-river': 'vivillon',
  'vivillon-monsoon': 'vivillon', 'vivillon-savanna': 'vivillon', 'vivillon-sun': 'vivillon',
  'vivillon-ocean': 'vivillon', 'vivillon-jungle': 'vivillon', 'vivillon-fancy': 'vivillon',
  'vivillon-pokeball': 'vivillon',
  'flabebe-yellow': 'flabebeyellow', 'flabebe-orange': 'flabebeorange',
  'flabebe-blue': 'flabebeblue', 'flabebe-white': 'flabebewhite',
  'floette-yellow': 'floetteyellow', 'floette-orange': 'floetteorange',
  'floette-blue': 'floetteblue', 'floette-white': 'floettewhite', 'floette-eternal': 'floetteeternal',
  'florges-yellow': 'florgesyellow', 'florges-orange': 'florgesorange',
  'florges-blue': 'florgesblue', 'florges-white': 'florgeswhite',
  'furfrou-heart': 'furfrou', 'furfrou-star': 'furfrou', 'furfrou-diamond': 'furfrou',
  'furfrou-debutante': 'furfrou', 'furfrou-matron': 'furfrou', 'furfrou-dandy': 'furfrou',
  'furfrou-la-reine': 'furfrou', 'furfrou-kabuki': 'furfrou', 'furfrou-pharaoh': 'furfrou',
  'meowstic-female': 'meowsticf', 'aegislash-blade': 'aegislashblade',
  'pumpkaboo-small': 'pumpkaboosmall', 'pumpkaboo-large': 'pumpkaboolarge', 'pumpkaboo-super': 'pumpkaboosuper',
  'gourgeist-small': 'gourgeistsmall', 'gourgeist-large': 'gourgeistlarge', 'gourgeist-super': 'gourgeistsuper',
  'xerneas-neutral': 'xerneas', 'zygarde-10': 'zygarde10', 'zygarde-complete': 'zygardecomplete',
  'hoopa-unbound': 'hoopaunbound',
  'oricorio-pom-pom': 'oricoriopompom', 'oricorio-pau': 'oricoriopau', 'oricorio-sensu': 'oricoriosensu',
  'lycanroc-midnight': 'lycanrocmidnight', 'lycanroc-dusk': 'lycanrocdusk',
  'wishiwashi-school': 'wishiwashischool',
  'silvally-fighting': 'silvally', 'silvally-flying': 'silvally', 'silvally-poison': 'silvally',
  'silvally-ground': 'silvally', 'silvally-rock': 'silvally', 'silvally-bug': 'silvally',
  'silvally-ghost': 'silvally', 'silvally-steel': 'silvally', 'silvally-fire': 'silvally',
  'silvally-water': 'silvally', 'silvally-grass': 'silvally', 'silvally-electric': 'silvally',
  'silvally-psychic': 'silvally', 'silvally-ice': 'silvally', 'silvally-dragon': 'silvally',
  'silvally-dark': 'silvally', 'silvally-fairy': 'silvally',
  'minior-red-meteor': 'minior', 'minior-orange-meteor': 'minior', 'minior-yellow-meteor': 'minior',
  'minior-green-meteor': 'minior', 'minior-blue-meteor': 'minior', 'minior-indigo-meteor': 'minior',
  'minior-violet-meteor': 'minior',
  'minior-red': 'miniorred', 'minior-orange': 'miniororange', 'minior-yellow': 'minioryellow',
  'minior-green': 'miniorgreen', 'minior-blue': 'miniorblue', 'minior-indigo': 'miniorindigo',
  'minior-violet': 'miniorviolet',
  'mimikyu-busted': 'mimikyubusted',
  'necrozma-dawn-wings': 'necrozmadawnwings', 'necrozma-dusk-mane': 'necrozmaduskmane',
  'necrozma-ultra': 'necrozmaultra', 'magearna-original': 'magearnaoriginal',
  'cramorant-gulping': 'cramorantgulping', 'cramorant-gorging': 'cramorantgorging',
  'toxtricity-low-key': 'toxtricitylowkey',
  'sinistea-antique': 'sinisteaantique', 'polteageist-antique': 'polteageistantique',
  'alcremie-vanilla-cream': 'alcremie', 'alcremie-ruby-cream': 'alcremie',
  'alcremie-matcha-cream': 'alcremie', 'alcremie-mint-cream': 'alcremie',
  'alcremie-lemon-cream': 'alcremie', 'alcremie-salted-cream': 'alcremie',
  'alcremie-ruby-swirl': 'alcremie', 'alcremie-caramel-swirl': 'alcremie',
  'alcremie-rainbow-swirl': 'alcremie',
  'eiscue-noice': 'eiscuenoice', 'indeedee-female': 'indeedee', 'morpeko-hangry': 'morpekohangry',
  'zacian-crowned': 'zaciancrowned', 'zamazenta-crowned': 'zamazentacrowned',
  'eternatus-eternamax': 'eternatuseternamax', 'urshifu-rapid-strike': 'urshifurapidstrike',
  'zarude-dada': 'zarudedada', 'calyrex-ice': 'calyrexice', 'calyrex-shadow': 'calyrexshadow',
  'enamorus-therian': 'enamorustherian', 'basculegion-female': 'basculegionf',
  'oinkologne-female': 'oinkolognef', 'dudunsparce-three-segment': 'dudunsparcethreesegment',
  'tatsugiri-droopy': 'tatsugiridroopy', 'tatsugiri-stretchy': 'tatsugiristretchy',
  'palafin-hero': 'palafinhero', 'maushold-family-of-three': 'mausholdfamilyofthree',
  'squawkabilly-yellow': 'squawkabillyyellow', 'squawkabilly-white': 'squawkabillywhite',
  'gimmighoul-roaming': 'gimmighoulroaming', 'gholdengo-chest': 'gholdengochest',
  'wooper-paldea': 'wooperpaldea',
  'tauros-paldea-combat': 'taurospaldeacombat', 'tauros-paldea-blaze': 'taurospaldeablaze',
  'tauros-paldea-aqua': 'taurospaldeaaqua',
  'girafarig-farigiraf': 'girafarigfarigiraf', 'primeape-annihilape': 'primeapeannihilape',
  'dunsparce-dudunsparce': 'dunsparcedudunsparce', 'dudunsparce-two-segment': 'dudunsparcetwosegment',
  'poltchageist-artisan': 'poltchageistartisan', 'sinistcha-masterpiece': 'sinistchamasterpiece',
  'okidogi-loyal-three': 'okidogiloyalthree', 'munkidori-loyal-three': 'munkidoriloyalthree',
  'fezandipiti-loyal-three': 'fezandipitiloyalthree',
  'ogerpon-wellspring': 'ogerponwellspring', 'ogerpon-hearthflame': 'ogerponhearthflame',
  'ogerpon-cornerstone': 'ogerponcornerstone',
  'terapagos-terastal': 'terapagosterastal', 'terapagos-stellar': 'terapagostellar',
  'pecharunt-malicious': 'pecharuntmalicious',
};

function mapPokemonNameToShowdown(name: string): string {
  const hyphenated = name.toLowerCase().trim().replace(/\s+/g, '-');
  return showdownExceptions[hyphenated] || hyphenated;
}

interface PokemonHeroProps {
  pokemon: Pokemon;
  abilities?: { name: string; is_hidden?: boolean; description?: string | null }[];
  flavorText?: string;
  genus?: string;
  hasGenderDifferences?: boolean;
  isLegendary?: boolean;
  isMythical?: boolean;
  isUltraBeast?: boolean;
  loading?: boolean;
}

export default function PokemonHero({ pokemon, abilities, flavorText, genus, hasGenderDifferences = false, isLegendary = false, isMythical = false, isUltraBeast = false, loading = false }: PokemonHeroProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const vtName = `pokemon-sprite-${pokemon.id}`;
  const reduce = useReducedMotionPref();
  const [hydratedArtQueryKey, setHydratedArtQueryKey] = useState<string>('');
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
  const allIdsRef = useRef<number[]>([]);
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
  const currentArtQueryKey = `${pokemon.id}:${searchParams.toString()}`;
  const validStyles = new Set(['official', 'sprite', 'portrait', 'pmd', 'fallback']);
  const validGenders = new Set(['male', 'female']);
  const validOrientations = new Set(['front', 'back']);
  const validGenerations = new Set([
    'gen1', 'gen1rb', 'gen1rg', 'gen1frlg',
    'gen2', 'gen2g', 'gen2s',
    'gen3', 'gen3rs', 'gen3frlg',
    'gen4', 'gen4dp',
    'gen5', 'gen5ani',
    'gen6', 'gen6ani',
    'gen7', 'gen8', 'gen9',
    'home', 'go'
  ]);

  const parseArtParam = (value: string | null) => {
    const parsed = {
      style: 'official' as typeof style,
      generation: getDefaultGeneration(pokemon.id) as typeof generation,
      orientation: 'front' as typeof orientation,
      gender: 'male' as typeof gender,
      portrait: 'Normal.png',
      anim: '',
    };
    if (!value) return parsed;
    if (validStyles.has(value)) {
      parsed.style = value as typeof style;
      return parsed;
    }

    const [kind, ...rest] = value.split(':');
    if (!validStyles.has(kind || '')) return parsed;

    if (kind === 'portrait') {
      parsed.style = 'portrait';
      parsed.portrait = rest.join(':') || 'Normal.png';
      return parsed;
    }
    if (kind === 'pmd') {
      parsed.style = 'pmd';
      parsed.anim = rest.join(':');
      return parsed;
    }
    if (kind === 'sprite') {
      parsed.style = 'sprite';
      const [gen, orient, genGender] = rest;
      if (validGenerations.has(gen || '')) parsed.generation = gen as typeof generation;
      if (validOrientations.has(orient || '')) parsed.orientation = orient as typeof orientation;
      if (validGenders.has(genGender || '')) parsed.gender = genGender as typeof gender;
      return parsed;
    }

    parsed.style = kind as typeof style;
    return parsed;
  };

  const serializeArtParam = () => {
    switch (style) {
      case 'portrait':
        return `portrait:${selectedPortrait || 'Normal.png'}`;
      case 'pmd':
        return selectedPmdAnim ? `pmd:${selectedPmdAnim}` : 'pmd';
      case 'sprite':
        return `sprite:${generation}:${orientation}:${gender}`;
      case 'fallback':
        return 'fallback';
      case 'official':
      default:
        return 'official';
    }
  };

  // Hydrate art controls from URL so links preserve the selected artwork.
  useEffect(() => {
    const art = parseArtParam(searchParams.get('art'));

    // Backward-compatible fallback for old links using split art_* params.
    const legacyGender = searchParams.get('art_gender');
    const legacyOrient = searchParams.get('art_orient');
    const legacyGen = searchParams.get('art_gen');
    const legacyPortrait = searchParams.get('art_portrait');
    const legacyAnim = searchParams.get('art_anim');

    setStyle(art.style);
    setGender(validGenders.has(legacyGender || '') ? (legacyGender as typeof gender) : art.gender);
    setOrientation(validOrientations.has(legacyOrient || '') ? (legacyOrient as typeof orientation) : art.orientation);
    setIsShiny((searchParams.get('shiny') === '1' || searchParams.get('shiny') === 'true') || (searchParams.get('art_shiny') === '1' || searchParams.get('art_shiny') === 'true'));
    setGeneration(validGenerations.has(legacyGen || '') ? (legacyGen as typeof generation) : art.generation);
    setSelectedPortrait(legacyPortrait || art.portrait || 'Normal.png');
    setSelectedPmdAnim(legacyAnim || art.anim || '');
    setHydratedArtQueryKey(currentArtQueryKey);
  }, [pokemon.id, searchParams, currentArtQueryKey]);

  // Sync art controls back to URL query string for shareable links.
  useEffect(() => {
    if (hydratedArtQueryKey !== currentArtQueryKey) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('art', serializeArtParam());
    if (isShiny) {
      params.set('shiny', '1');
    } else {
      params.delete('shiny');
    }

    // Remove legacy split params to keep the URL to one art param + optional shiny.
    ['art_gender', 'art_orient', 'art_shiny', 'art_gen', 'art_portrait', 'art_anim'].forEach((key) => params.delete(key));

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery === currentQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [
    hydratedArtQueryKey,
    currentArtQueryKey,
    router,
    pathname,
    searchParams,
    pokemon.id,
    style,
    gender,
    orientation,
    isShiny,
    generation,
    selectedPortrait,
    selectedPmdAnim,
  ]);

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
    let cancelled = false;
    const fetchPortraits = async () => {
      try {
        const portraits = await getAvailablePortraits(pokemon.id);
        if (cancelled) return;
        setAvailablePortraits(portraits);
        const requestedPortrait = parseArtParam(searchParams.get('art')).portrait || searchParams.get('art_portrait');
        const hasRequestedPortrait = requestedPortrait && portraits.some(p => p.filename === requestedPortrait);
        setSelectedPortrait(hasRequestedPortrait ? requestedPortrait : 'Normal.png');
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to fetch portraits:', error);
        setAvailablePortraits([{ name: 'normal', filename: 'Normal.png', displayName: 'Normal' }]);
        setSelectedPortrait(parseArtParam(searchParams.get('art')).portrait || searchParams.get('art_portrait') || 'Normal.png');
      }
    };

    fetchPortraits();
    return () => { cancelled = true; };
  }, [pokemon.id, searchParams]);

  // Initialize PMD animation when available
  useEffect(() => {
    if (!pmdAnims || pmdAnims.length === 0) return;
    const requestedAnim = parseArtParam(searchParams.get('art')).anim || searchParams.get('art_anim');
    if (requestedAnim && pmdAnims.some(anim => anim.name === requestedAnim)) {
      if (selectedPmdAnim !== requestedAnim) {
        setSelectedPmdAnim(requestedAnim);
      }
      return;
    }
    if (!selectedPmdAnim || !pmdAnims.some(anim => anim.name === selectedPmdAnim)) {
      setSelectedPmdAnim(pmdAnims[0].name);
    }
  }, [pmdAnims, selectedPmdAnim, searchParams]);

  useEffect(() => {
    fetchAllPokemonIds().then(ids => { allIdsRef.current = ids; }).catch(() => {});
  }, []);

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
    const query = searchParams.toString();
    router.push(query ? `/pokemon/${id}?${query}` : `/pokemon/${id}`);
  };

  const goToPrevious = () => {
    const ids = allIdsRef.current;
    if (ids.length > 0) {
      const idx = ids.indexOf(pokemon.id);
      if (idx > 0) navigateToPokemon(ids[idx - 1]);
    } else if (pokemon.id > 1 && pokemon.id <= 1025) {
      navigateToPokemon(pokemon.id - 1);
    }
  };

  const goToNext = () => {
    const ids = allIdsRef.current;
    if (ids.length > 0) {
      const idx = ids.indexOf(pokemon.id);
      if (idx >= 0 && idx < ids.length - 1) navigateToPokemon(ids[idx + 1]);
    } else if (pokemon.id >= 1 && pokemon.id < 1025) {
      navigateToPokemon(pokemon.id + 1);
    }
  };

  // Helper function to check if a sprite is available for a specific generation
  const isSpriteAvailable = (gen: string, pokemonName: string, orientation: 'front' | 'back', shiny: boolean, gender: 'male' | 'female'): boolean => {
    const pokemonId = pokemon.id;
    
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
      className="relative mb-3 rounded-2xl border border-border bg-surface p-4 overflow-visible"
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
      
      <div className="relative space-y-3">
        {/* Pokemon Header - Responsive Layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
          {/* Navigation Buttons - Desktop Only */}
          <div className="hidden lg:flex items-center gap-4 order-1">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={pokemon.id <= 1}
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              title={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
              aria-label={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
            >
              <ChevronLeft className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
            </button>
          </div>

          {/* Pokemon Image — on mobile wrapped in a row with nav buttons */}
          <div className="flex lg:contents items-center gap-3 order-2">
            <button
              type="button"
              onClick={goToPrevious}
              disabled={pokemon.id <= 1}
              className="lg:hidden group flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex-shrink-0"
              title={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
              aria-label={`Previous Pokémon (#${String(pokemon.id - 1).padStart(4, "0")})`}
            >
              <ChevronLeft className="h-5 w-5 text-muted group-hover:text-text transition-colors" />
            </button>
          <div
            style={{ viewTransitionName: vtName } as React.CSSProperties}
            className="rounded-xl bg-white/70 dark:bg-zinc-800/70 p-3 flex-shrink-0"
          >
            {style !== 'pmd' && imageSrc && (
              <Image 
                src={imageSrc}
                alt={pokemon.name}
                width={288} 
                height={288} 
                className={`h-40 w-40 sm:h-52 sm:w-52 lg:h-64 lg:w-64 object-contain`} 
                priority 
                onError={() => {
                  const fallbackPath = isShiny ? `shiny/${pokemon.id}` : `${pokemon.id}`;
                  setImageSrc(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fallbackPath}.png`);
                }}
              />
            )}
            {style === 'pmd' && (
              <div className="h-40 w-40 sm:h-52 sm:w-52 lg:h-64 lg:w-64 flex items-center justify-center">
                {selectedPmdAnim ? (
                  <HeroPmdSprite pokemonId={pokemon.id} animName={selectedPmdAnim} scale={3} />
                ) : (
                  <div className="text-muted text-xs text-center">
                    {pmdError ? 'Animations unavailable' : pmdAnims === null ? 'Loading...' : 'No animations found'}
                  </div>
                )}
              </div>
            )}
          </div>
            <button
              type="button"
              onClick={goToNext}
              disabled={allIdsRef.current.length > 0 ? allIdsRef.current.indexOf(pokemon.id) >= allIdsRef.current.length - 1 : pokemon.id >= 1025}
              className="lg:hidden group flex items-center justify-center w-10 h-10 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100 flex-shrink-0"
              title="Next Pokémon"
              aria-label="Next Pokémon"
            >
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-text transition-colors" />
            </button>
          </div>
          
          {/* Pokemon Info - Side Layout on Desktop, Below on Mobile */}
          <div className="min-w-0 flex-1 order-3 lg:order-3 text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-text">
                {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}
              </h1>
              
              {/* Legendary / Mythical / Ultra Beast Badges */}
              {(isLegendary || isMythical || isUltraBeast) && (
                <div className="mt-2 flex flex-wrap gap-2 justify-center lg:justify-start">
                  {isLegendary && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Legendary
                    </span>
                  )}
                  {isMythical && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      Mythical
                    </span>
                  )}
                  {isUltraBeast && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-700/50">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 14c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z"/></svg>
                      Ultra Beast
                    </span>
                  )}
                </div>
              )}

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
                    {...(opt.key === 'portrait' ? { 'aria-expanded': showPortraitDropdown } : opt.key === 'pmd' ? { 'aria-expanded': showPmdDropdown } : {})}
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
              type="button"
              onClick={goToNext}
              disabled={allIdsRef.current.length > 0 ? allIdsRef.current.indexOf(pokemon.id) >= allIdsRef.current.length - 1 : pokemon.id >= 1025}
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-border bg-surface hover:bg-surface/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
              title="Next Pokémon"
              aria-label="Next Pokémon"
            >
              <ChevronRight className="h-6 w-6 text-muted group-hover:text-text transition-colors" />
            </button>
          </div>
        </div>

        {/* Quick Stats Row - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted">
          <Stat label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} icon="📏" />
          <Stat label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} icon="🏋️" />
          <Stat label="Base Exp" value={pokemon.base_experience} icon="⚡" />
          <Stat label="Types" value={<div className="flex flex-wrap justify-center gap-1">{pokemon.types.map((t, index) => <TypeBadgeWithTooltip key={`${t.type.name}-${index}`} type={t.type.name}/>)}</div>} icon="🧪" />
        </div>

        {/* Battle Stats */}
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-center">Battle Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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
        {(loading || (abilities && abilities.length > 0)) && (
          <div className="space-y-1.5 text-center">
            <h3 className="text-base font-semibold">Abilities</h3>
            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
              {loading || !abilities || abilities.length === 0 ? (
                // Show skeleton abilities when loading
                [1, 2, 3].map((index) => (
                  <AbilitySkeleton key={`ability-skeleton-${index}`} />
                ))
              ) : (
                abilities.map((ability, index) => (
                  <AbilityBadge 
                    key={`${ability.name}-${index}`}
                    ability={ability}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {(loading || flavorText) && (
          <div className="space-y-1.5 text-center">
            <h3 className="text-base font-semibold">Description</h3>
            {loading || !flavorText ? (
              <DescriptionSkeleton />
            ) : (
              <p className="leading-6 text-sm text-muted">{flavorText}</p>
            )}
            {loading || genus ? (
              <div className="flex justify-center">
                {loading ? (
                  <GenusSkeleton />
                ) : (
                  <span className="inline-block rounded-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700">
                    {genus}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}

function Stat({label, value, icon}:{label:string; value:React.ReactNode; icon:string}) {
  return (
    <div className="rounded-xl bg-white/50 dark:bg-zinc-800/50 p-2 text-center">
      <div className="text-xs text-muted">{icon} {label}</div>
      <div className="mt-0.5 font-semibold text-sm">{value}</div>
    </div>
  );
}
