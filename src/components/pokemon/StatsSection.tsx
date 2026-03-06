import { useRef, useState, useEffect } from 'react';
import MultiPokemonRadarChart from '../MultiPokemonRadarChart';
import StatsSlider from './StatsSlider';
import { StatSkeleton } from '@/components/skeletons/PokemonDetailsSkeleton';

type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats, name, loading = false }: { stats: Stat[]; name?: string; loading?: boolean }) {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsHeight, setStatsHeight] = useState<number | null>(null);

  useEffect(() => {
    if (!statsRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setStatsHeight(entry.contentRect.height);
    });
    ro.observe(statsRef.current);
    return () => ro.disconnect();
  }, []);
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
    <section id="stats" className="mx-auto w-full px-4 py-2">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Stat bars – left 2/3 */}
        <div ref={statsRef} className="min-w-0 md:w-2/3 md:shrink-0 space-y-3">
          {loading || stats.length === 0 ? (
            ['HP', 'ATK', 'DEF', 'SPA', 'SPD', 'SPE'].map((label, index) => (
              <StatSkeleton key={index} />
            ))
          ) : (
            stats.filter(s => s && s.name).map(s => (
              <StatsSlider
                key={s.name}
                label={getStatLabel(s.name)}
                value={s.value}
                max={maxStat}
                colorClass={getStatColor(s.name)}
              />
            ))
          )}
        </div>

        {/* Radar chart – right 1/3, height matches stats column */}
        <div
          className="min-w-0 md:w-1/3 flex justify-center items-center"
          style={statsHeight ? { height: statsHeight } : undefined}
        >
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
      </div>
    </section>
  );
}
