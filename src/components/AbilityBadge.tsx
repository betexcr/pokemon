import { typeColors } from '@/lib/utils';
import Tooltip from './Tooltip';

interface AbilityBadgeProps {
  ability: { name: string; is_hidden?: boolean; description?: string | null };
  className?: string;
}

// Map abilities to colors based on their nature/category
const getAbilityColor = (abilityName: string): string => {
  const name = abilityName.toLowerCase();
  
  // Fire-related abilities
  if (name.includes('fire') || name.includes('flame') || name.includes('burn') || name.includes('heat') || name.includes('solar') || name.includes('drought')) {
    return 'fire';
  }
  
  // Water-related abilities
  if (name.includes('water') || name.includes('rain') || name.includes('hydration') || name.includes('swift-swim') || name.includes('storm-drain')) {
    return 'water';
  }
  
  // Electric-related abilities
  if (name.includes('electric') || name.includes('static') || name.includes('lightning') || name.includes('volt') || name.includes('motor-drive')) {
    return 'electric';
  }
  
  // Grass/Plant-related abilities
  if (name.includes('grass') || name.includes('leaf') || name.includes('flower') || name.includes('harvest') || name.includes('overgrow') || name.includes('chlorophyll')) {
    return 'grass';
  }
  
  // Ice-related abilities
  if (name.includes('ice') || name.includes('snow') || name.includes('freeze') || name.includes('slush-rush')) {
    return 'ice';
  }
  
  // Fighting/Physical abilities
  if (name.includes('guts') || name.includes('huge-power') || name.includes('pure-power') || name.includes('skill-link') || name.includes('technician') || name.includes('adaptability')) {
    return 'fighting';
  }
  
  // Poison-related abilities
  if (name.includes('poison') || name.includes('toxic') || name.includes('corrosion')) {
    return 'poison';
  }
  
  // Ground-related abilities
  if (name.includes('sand') || name.includes('arena-trap') || name.includes('earth-eater')) {
    return 'ground';
  }
  
  // Flying-related abilities
  if (name.includes('levitate') || name.includes('wind') || name.includes('gale-wings')) {
    return 'flying';
  }
  
  // Psychic-related abilities
  if (name.includes('psychic') || name.includes('telepathy') || name.includes('magic') || name.includes('synchronize') || name.includes('trace')) {
    return 'psychic';
  }
  
  // Bug-related abilities
  if (name.includes('swarm') || name.includes('compound-eyes') || name.includes('tinted-lens')) {
    return 'bug';
  }
  
  // Rock-related abilities
  if (name.includes('rock') || name.includes('sturdy') || name.includes('solid-rock')) {
    return 'rock';
  }
  
  // Ghost-related abilities
  if (name.includes('cursed-body') || name.includes('frisk') || name.includes('infiltrator')) {
    return 'ghost';
  }
  
  // Dragon-related abilities
  if (name.includes('multiscale') || name.includes('marvel-scale')) {
    return 'dragon';
  }
  
  // Dark-related abilities
  if (name.includes('dark') || name.includes('intimidate') || name.includes('moxie') || name.includes('prankster')) {
    return 'dark';
  }
  
  // Steel-related abilities
  if (name.includes('steel') || name.includes('filter') || name.includes('heatproof')) {
    return 'steel';
  }
  
  // Fairy-related abilities
  if (name.includes('cute-charm') || name.includes('pixilate') || name.includes('fairy-aura')) {
    return 'fairy';
  }
  
  // Default to normal for unknown abilities
  return 'normal';
};

export default function AbilityBadge({ ability, className = '' }: AbilityBadgeProps) {
  const abilityType = getAbilityColor(ability.name);
  const colorClasses = typeColors[abilityType] || typeColors.normal;
  
  const formatAbilityName = (name: string) => {
    return name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {ability.description ? (
        <Tooltip content={ability.description} maxWidth="w-72" variant="ability" type={abilityType}>
          <button
            type="button"
            className="px-1.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap cursor-help"
            style={{
              backgroundColor: `var(--type-${abilityType})`,
              color: colorClasses.text === 'text-white' ? 'white' : 'black',
              borderColor: `var(--type-${abilityType})`,
              padding: '6px 6px'
            }}
          >
            {formatAbilityName(ability.name)}
          </button>
        </Tooltip>
      ) : (
        <button
          type="button"
          className="px-1.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap"
          style={{
            backgroundColor: `var(--type-${abilityType})`,
            color: colorClasses.text === 'text-white' ? 'white' : 'black',
            borderColor: `var(--type-${abilityType})`,
            padding: '6px 6px'
          }}
        >
          {formatAbilityName(ability.name)}
        </button>
      )}
    </div>
  );
}

