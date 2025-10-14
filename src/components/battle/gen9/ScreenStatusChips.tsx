import { cn } from '@/lib/utils';

type ScreenKey = 'reflect' | 'lightScreen' | 'auroraVeil' | 'safeguard' | 'tailwind';

const SCREEN_META: Record<ScreenKey, { label: string; tone: string }> = {
  reflect: { label: 'Reflect', tone: 'border-border bg-surface text-text' },
  lightScreen: { label: 'Light Screen', tone: 'border-border bg-surface text-text' },
  auroraVeil: { label: 'Aurora Veil', tone: 'border-border bg-surface text-text' },
  safeguard: { label: 'Safeguard', tone: 'border-border bg-surface text-text' },
  tailwind: { label: 'Tailwind', tone: 'border-border bg-surface text-text' },
};

interface ScreenStatusChipsProps {
  screens?: Partial<Record<ScreenKey, { turns: number } | undefined>>;
}

export function ScreenStatusChips({ screens }: ScreenStatusChipsProps) {
  if (!screens) return null;
  const entries = Object.entries(screens) as Array<[ScreenKey, { turns: number } | undefined]>;
  const active = entries.filter(([, value]) => (value?.turns ?? 0) > 0);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {active.map(([key, value]) => {
        const meta = SCREEN_META[key];
        if (!meta) return null;
        return (
          <span
            key={key}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur',
              meta.tone
            )}
          >
            {meta.label}
            <span className="rounded-full bg-white/20 px-1 text-[10px] text-white/90">{value?.turns ?? 0}</span>
          </span>
        );
      })}
    </div>
  );
}

