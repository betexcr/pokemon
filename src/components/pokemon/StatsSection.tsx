import MultiPokemonRadarChart from '../MultiPokemonRadarChart';
import StatsSlider from './StatsSlider';

type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats, name }: { stats: Stat[]; name?: string }) {
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
    if (!statName) return 'UNK';
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
    <section id="stats" className="mx-auto w-full px-4 py-4 space-y-6">
      {/* Radar on top */}
      <div className="flex justify-center">
        <MultiPokemonRadarChart
          pokemons={[{
            id: 0,
            name: name || 'current',
            stats: [
              { stat: { name: 'hp' }, base_stat: stats.find(s => s.name === 'hp')?.value || 0 },
              { stat: { name: 'attack' }, base_stat: stats.find(s => s.name === 'attack')?.value || 0 },
              { stat: { name: 'defense' }, base_stat: stats.find(s => s.name === 'defense')?.value || 0 },
              { stat: { name: 'special-attack' }, base_stat: stats.find(s => s.name === 'special-attack')?.value || 0 },
              { stat: { name: 'special-defense' }, base_stat: stats.find(s => s.name === 'special-defense')?.value || 0 },
              { stat: { name: 'speed' }, base_stat: stats.find(s => s.name === 'speed')?.value || 0 }
            ]
          }]}
        />
      </div>

      {/* Stat bars below */}
      <div className="space-y-6">
        {stats.filter(s => s && s.name).map(s => (
          <StatsSlider
            key={s.name}
            label={getStatLabel(s.name)}
            value={s.value}
            max={maxStat}
            className="py-1"
            colorClass={getStatColor(s.name)}
          />
        ))}
      </div>
    </section>
  );
}
