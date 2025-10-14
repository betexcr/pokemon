import { Sun, CloudRain, CloudFog, Snowflake, Sandstorm, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type WeatherKind = 'sun' | 'rain' | 'sandstorm' | 'snow' | 'none';
type TerrainKind = 'electric' | 'grassy' | 'misty' | 'psychic' | 'none';

const WEATHER_META: Record<WeatherKind, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  sun: { label: 'Harsh Sunlight', icon: Sun, tone: 'border-border bg-surface text-text' },
  rain: { label: 'Rain', icon: CloudRain, tone: 'border-border bg-surface text-text' },
  sandstorm: { label: 'Sandstorm', icon: Sandstorm, tone: 'border-border bg-surface text-text' },
  snow: { label: 'Snow', icon: Snowflake, tone: 'border-border bg-surface text-text' },
  none: { label: 'Clear Skies', icon: CloudFog, tone: 'border-border bg-surface text-text' },
};

const TERRAIN_META: Record<TerrainKind, { label: string; tone: string }> = {
  electric: { label: 'Electric Terrain', tone: 'text-text border-accent/40 bg-surface/70' },
  grassy: { label: 'Grassy Terrain', tone: 'text-text border-accent/40 bg-surface/70' },
  misty: { label: 'Misty Terrain', tone: 'text-text border-accent/40 bg-surface/70' },
  psychic: { label: 'Psychic Terrain', tone: 'text-text border-accent/40 bg-surface/70' },
  none: { label: 'No Terrain', tone: 'text-muted border-border bg-surface/80' },
};

interface FieldWeatherBannerProps {
  weather?: { kind?: WeatherKind; turns?: number; source?: string | null } | null;
  terrain?: { kind?: TerrainKind; turns?: number; source?: string | null } | null;
}

export function FieldWeatherBanner({ weather, terrain }: FieldWeatherBannerProps) {
  const weatherKind = weather?.kind ?? 'none';
  const weatherMeta = WEATHER_META[weatherKind] ?? WEATHER_META.none;
  const WeatherIcon = weatherMeta.icon;
  const weatherTurns = weather?.turns ?? null;

  const terrainKind = terrain?.kind ?? 'none';
  const terrainMeta = TERRAIN_META[terrainKind] ?? TERRAIN_META.none;
  const terrainTurns = terrain?.turns ?? null;

  const showTerrain = terrainKind !== 'none';
  const showWeather = weatherKind !== 'none';

  if (!showTerrain && !showWeather) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <CloudFog className="h-4 w-4 text-slate-200/80" />
          Clear conditions
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-between rounded-2xl border border-border px-4 py-2 text-xs shadow-card backdrop-blur', weatherMeta.tone)}>
      <div className="flex items-center gap-2 text-text">
        <WeatherIcon className="h-4 w-4" />
        <span className="font-semibold uppercase tracking-wide">{weatherMeta.label}</span>
        {showWeather && weatherTurns !== null && (
          <span className="rounded-full border border-border/40 bg-surface/70 px-2 py-0.5 text-[10px] font-semibold text-text">
            {weatherTurns}
          </span>
        )}
        {weather?.source && (
          <span className="text-[10px] text-muted">({weather.source})</span>
        )}
      </div>
      {showTerrain && (
        <div className={cn('flex items-center gap-2 rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-wide', terrainMeta.tone)}>
          <Zap className="h-3 w-3" />
          {terrainMeta.label}
          {terrainTurns !== null && <span className="rounded-full bg-surface px-1 text-[10px] text-text">{terrainTurns}</span>}
        </div>
      )}
    </div>
  );
}

