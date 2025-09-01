import RadarChart from '../RadarChart';

type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats }: { stats: Stat[] }) {
  const cap = (s:string)=>s.replace("-", " ");
  
  // Calculate max stat for proper scaling
  const maxStat = Math.max(...stats.map(s => s.value));
  
  // Stat colors based on type
  const getStatColor = (statName: string) => {
    switch (statName.toLowerCase()) {
      case 'hp': return 'bg-red-500';
      case 'attack': return 'bg-orange-500';
      case 'defense': return 'bg-blue-500';
      case 'special-attack': return 'bg-purple-500';
      case 'special-defense': return 'bg-green-500';
      case 'speed': return 'bg-yellow-500';
      default: return 'bg-poke-red';
    }
  };

  // Convert stats to radar chart format
  const radarData = [{
    name: 'Stats',
    stats: {
      hp: stats.find(s => s.name === 'hp')?.value || 0,
      attack: stats.find(s => s.name === 'attack')?.value || 0,
      defense: stats.find(s => s.name === 'defense')?.value || 0,
      'special-attack': stats.find(s => s.name === 'special-attack')?.value || 0,
      'special-defense': stats.find(s => s.name === 'special-defense')?.value || 0,
      speed: stats.find(s => s.name === 'speed')?.value || 0,
    }
  }];

  return (
    <section id="stats" className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h3 className="text-lg font-semibold">Base Stats</h3>
      <ul className="space-y-3">
        {stats.map(s => (
          <li key={s.name} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
            <span className="capitalize text-sm text-muted">{cap(s.name)}</span>
            <div className="h-2 rounded bg-border/50">
              <div
                className={`h-2 rounded transition-[width] duration-700 ${getStatColor(s.name)}`}
                style={{ width: `${(s.value / maxStat) * 100}%` }}
              />
            </div>
            <span className="text-sm tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>

      {/* Radar Chart */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h4 className="text-sm font-semibold mb-4 text-center">Stat Distribution</h4>
        <div className="flex justify-center">
          <RadarChart data={radarData} size={300} />
        </div>
      </div>
    </section>
  );
}
