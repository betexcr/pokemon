import { Shield, WebHook, Droplets, Mountain } from 'lucide-react';
import { cn } from '@/lib/utils';

type HazardKey = 'stealthRock' | 'spikes' | 'toxicSpikes' | 'stickyWeb' | 'gMaxVineLash' | 'gMaxWildfire';

const HAZARD_DETAILS: Record<HazardKey, { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  stealthRock: { label: 'Stealth Rock', icon: Mountain, tone: 'text-text' },
  spikes: { label: 'Spikes', icon: Shield, tone: 'text-text' },
  toxicSpikes: { label: 'Toxic Spikes', icon: Droplets, tone: 'text-text' },
  stickyWeb: { label: 'Sticky Web', icon: WebHook, tone: 'text-text' },
  gMaxVineLash: { label: 'G-Max Vine Lash', icon: Droplets, tone: 'text-text' },
  gMaxWildfire: { label: 'G-Max Wildfire', icon: Droplets, tone: 'text-text' },
};

interface HazardIconProps {
  hazard: HazardKey;
  value?: number | { turns: number } | boolean;
  active?: boolean;
}

export function HazardIcon({ hazard, value, active = true }: HazardIconProps) {
  const detail = HAZARD_DETAILS[hazard];
  if (!detail) return null;
  const Icon = detail.icon;

  let badge: string | null = null;
  if (typeof value === 'number') {
    badge = value > 0 ? `${value}` : null;
  } else if (typeof value === 'object' && value?.turns) {
    badge = `${value.turns}`;
  }

  return (
    <div className={cn('relative flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm', !active && 'opacity-30', detail.tone)} title={detail.label}>
      <Icon className="h-4 w-4" />
      {badge && (
        <span className="absolute -right-1 -top-1 inline-flex min-h-[14px] min-w-[14px] items-center justify-center rounded-full border border-border bg-surface px-1 text-[10px] font-semibold text-text">
          {badge}
        </span>
      )}
    </div>
  );
}

export function HazardRow({ hazards }: { hazards: Partial<Record<HazardKey, number | { turns: number } | boolean>> }) {
  const entries = Object.entries(hazards) as Array<[HazardKey, number | { turns: number } | boolean]>;
  const activeEntries = entries.filter(([key, val]) => {
    if (typeof val === 'number') return val > 0;
    if (typeof val === 'object') return (val?.turns ?? 0) > 0;
    return Boolean(val);
  });
  if (activeEntries.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {activeEntries.map(([key, val]) => (
        <HazardIcon key={key} hazard={key} value={val} />
      ))}
    </div>
  );
}

