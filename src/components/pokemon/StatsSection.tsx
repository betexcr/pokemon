import RadarChart from '../RadarChart';

type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats }: { stats: Stat[] }) {
  const cap = (s:string)=>s.replace("-", " ");
  
  // Use fixed max stat of 255 for proper scaling
  const maxStat = 255;
  
  // Stat colors - using reddish-brown like in Pokemon Red theme
  const getStatColor = (statName: string) => {
    // Use consistent reddish-brown color for all stats like in the image
    return 'bg-red-600';
  };

  // Get stat abbreviations like in the image
  const getStatAbbreviation = (statName: string) => {
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
          <li key={s.name} className="flex items-center gap-3">
            <span className="text-sm font-bold w-20">{getStatAbbreviation(s.name)}</span>
            <span className="text-sm tabular-nums font-bold w-8">{s.value}</span>
            <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getStatColor(s.name)}`}
                style={{ width: `${(s.value / maxStat) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <RadarChart data={radarData} size={300} />
      </div>
    </section>
  );
}
