import TypeBadge from "@/components/TypeBadge";
import AbilityBadge from "@/components/AbilityBadge";

type Props = {
  types: string[];
  abilities: { name: string; is_hidden?: boolean }[];
  flavorText: string;           // species flavor text (cleaned)
  genus?: string;               // "Seed Pokémon"
  heightM: number;              // meters
  weightKg: number;             // kilograms
  baseExp: number;
  stats?: { name: string; value: number }[];  // Pokemon stats
};

export default function OverviewSection({
  types, abilities, flavorText, genus, heightM, weightKg, baseExp, stats
}: Props) {
  return (
    <section id="overview" className="mx-auto w-full px-4 py-8 space-y-8">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted">
        <Stat label="Height" value={`${heightM} m`} icon="📏" />
        <Stat label="Weight" value={`${weightKg} kg`} icon="🏋️" />
        <Stat label="Base Exp" value={baseExp} icon="⚡" />
        <Stat label="Types" value={<div className="flex flex-wrap justify-center gap-2">{types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t}/>)}</div>} icon="🧪" />
      </div>

      {/* Battle Stats */}
      {stats && stats.length > 0 && (
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">Battle Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map(stat => (
              <Stat 
                key={stat.name}
                label={getStatLabel(stat.name)} 
                value={stat.value} 
                icon={getStatIcon(stat.name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Abilities */}
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Abilities</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          {abilities.map((ability, index) => (
            <AbilityBadge 
              key={`${ability.name}-${index}`}
              ability={ability}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Description</h3>
        <p className="leading-7">{flavorText}</p>
        {genus && (
          <span className="inline-block rounded-full px-4 py-2 text-sm bg-surface">
            {genus}
          </span>
        )}
      </div>
    </section>
  );
}

// Helper functions for stat display
function getStatLabel(statName: string): string {
  switch (statName.toLowerCase()) {
    case 'hp': return 'HP';
    case 'attack': return 'ATK';
    case 'defense': return 'DEF';
    case 'special-attack': return 'SPA';
    case 'special-defense': return 'SPD';
    case 'speed': return 'SPE';
    default: return statName.toUpperCase();
  }
}

function getStatIcon(statName: string): string {
  switch (statName.toLowerCase()) {
    case 'hp': return '❤️';
    case 'attack': return '⚔️';
    case 'defense': return '🛡️';
    case 'special-attack': return '✨';
    case 'special-defense': return '🔮';
    case 'speed': return '💨';
    default: return '📊';
  }
}

function Stat({label, value, icon}:{label:string; value:React.ReactNode; icon:string}) {
  return (
    <div className="rounded-xl bg-surface p-4 text-center">
      <div className="text-xs text-muted">{icon} {label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
const capitalize=(s:string)=>s[0].toUpperCase()+s.slice(1);
