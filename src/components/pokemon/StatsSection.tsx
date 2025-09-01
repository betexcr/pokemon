import RadarChart from '../RadarChart';
import StatsSlider from './StatsSlider';

type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats }: { stats: Stat[] }) {
  // Use fixed max stat of 255 for proper scaling
  const maxStat = 255;
  
  // Stat colors - different color for each stat
  const getStatColor = (statName: string) => {
    switch (statName.toLowerCase()) {
      case 'hp': return 'bg-red-500';
      case 'attack': return 'bg-orange-500';
      case 'defense': return 'bg-blue-500';
      case 'special-attack': return 'bg-purple-500';
      case 'special-defense': return 'bg-green-500';
      case 'speed': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Get stat abbreviations like in the image
  const getStatLabel = (statName: string) => {
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
      <div className="space-y-4">
        {stats.map(s => (
          <StatsSlider
            key={s.name}
            label={getStatLabel(s.name)}
            value={s.value}
            max={maxStat}
            className="py-2"
            colorClass={getStatColor(s.name)}
          />
        ))}
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <RadarChart data={radarData} size={300} />
      </div>
    </section>
  );
}
