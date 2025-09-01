import clsx from "clsx";

type Props = {
  label: string;           // e.g. "HP"
  value: number;           // e.g. 45
  max?: number;            // visual cap (default 150 for Pokémon base stats)
  min?: number;            // default 0
  className?: string;      // extra spacing, etc.
  colorClass?: string;     // override fill color (default Poké red)
};

export default function StatsSlider({
  label,
  value,
  max = 150,
  min = 0,
  className,
  colorClass = "bg-red-500",
}: Props) {
  const clamped = Math.max(min, Math.min(value, max));
  const pct = ((clamped - min) / (max - min)) * 100;

  return (
    <div className={clsx("w-full", className)}>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-base font-semibold">{label}</span>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="tabular-nums">{value}</span>
          <span className="text-muted tabular-nums">/ {max}</span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative h-8 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 shadow-inner"
        style={{ backgroundColor: '#e5e7eb' }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-700 ease-out shadow-lg z-20"
          style={{ 
            width: `${pct}%`,
            minWidth: pct > 0 ? '8px' : '0px',
            backgroundColor: colorClass.includes('red') ? '#ef4444' : 
                             colorClass.includes('orange') ? '#f97316' :
                             colorClass.includes('blue') ? '#3b82f6' :
                             colorClass.includes('purple') ? '#a855f7' :
                             colorClass.includes('green') ? '#22c55e' :
                             colorClass.includes('yellow') ? '#eab308' : '#6b7280'
          }}
        />
      </div>
    </div>
  );
}
