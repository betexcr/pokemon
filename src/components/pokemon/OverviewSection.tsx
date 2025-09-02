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
};

export default function OverviewSection({
  types, abilities, flavorText, genus, heightM, weightKg, baseExp
}: Props) {
  return (
    <section id="overview" className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted">
        <Stat label="Height" value={`${heightM} m`} icon="📏" />
        <Stat label="Weight" value={`${weightKg} kg`} icon="🏋️" />
        <Stat label="Base Exp" value={baseExp} icon="⚡" />
        <Stat label="Types" value={<div className="flex flex-wrap justify-center gap-2">{types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t}/>)}</div>} icon="🧪" />
      </div>

      {/* Abilities */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Abilities</h3>
        <div className="flex flex-wrap gap-3">
          {abilities.map((ability, index) => (
            <AbilityBadge 
              key={`${ability.name}-${index}`}
              ability={ability}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Description</h3>
        <p className="max-w-2xl leading-7">{flavorText}</p>
        {genus && (
          <span className="inline-block rounded-full px-4 py-2 text-sm bg-surface">
            {genus}
          </span>
        )}
      </div>
    </section>
  );
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
