'use client';

import type { BattleConditions } from '@/lib/battle-conditions';
import { terrainInfo, weatherInfo } from '@/lib/battle-display';

function turnsOf(conditions: BattleConditions | null | undefined, id: string): number | undefined {
  return conditions?.field?.find((t) => t.id === id)?.turns;
}

/** Current weather and terrain, always shown on the battle field (icons match the battle guide). */
export default function FieldIndicator({ conditions }: { conditions: BattleConditions | null | undefined }) {
  const field = conditions?.field ?? [];
  const weatherKind = field.find((t) => t.id.startsWith('weather-'))?.id.slice('weather-'.length);
  const terrainKind = field.find((t) => t.id.startsWith('terrain-'))?.id.slice('terrain-'.length);
  const weather = weatherInfo(weatherKind);
  const terrain = terrainInfo(terrainKind);
  const weatherTurns = weatherKind ? turnsOf(conditions, `weather-${weatherKind}`) : undefined;
  const terrainTurns = terrainKind ? turnsOf(conditions, `terrain-${terrainKind}`) : undefined;

  const pill = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium';
  const turnsLabel = (n?: number) => (typeof n === 'number' ? ` · ${n} turn${n === 1 ? '' : 's'} left` : '');

  return (
    <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Weather and terrain" data-testid="field-indicator">
      <span
        className={`${pill} ${weather ? 'border-sky-500/50 bg-sky-500/10 text-sky-900 dark:text-sky-100' : 'border-border bg-surface/80 text-muted'}`}
        title={weather?.effect ?? 'No weather in effect'}
        data-testid="field-weather"
      >
        <span aria-hidden>{weather?.icon ?? '🌤️'}</span>
        {weather ? `${weather.name}${turnsLabel(weatherTurns)}` : 'Clear weather'}
      </span>
      <span
        className={`${pill} ${terrain ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100' : 'border-border bg-surface/80 text-muted'}`}
        title={terrain?.effect ?? 'No terrain in effect'}
        data-testid="field-terrain"
      >
        <span aria-hidden>{terrain?.icon ?? '⬜'}</span>
        {terrain ? `${terrain.name}${turnsLabel(terrainTurns)}` : 'No terrain'}
      </span>
    </div>
  );
}
