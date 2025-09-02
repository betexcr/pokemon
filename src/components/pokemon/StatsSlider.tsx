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
  max = 255,
  min = 0,
  className,
  colorClass = "bg-red-500",
}: Props) {
  const clamped = Math.max(min, Math.min(value, max));
  const pct = ((clamped - min) / (max - min)) * 100;

  const getColorValue = (colorClass: string) => {
    if (colorClass.includes('red')) return '#ef4444';
    if (colorClass.includes('orange')) return '#f97316';
    if (colorClass.includes('blue')) return '#3b82f6';
    if (colorClass.includes('purple')) return '#a855f7';
    if (colorClass.includes('green')) return '#22c55e';
    if (colorClass.includes('yellow')) return '#eab308';
    return '#6b7280';
  };

  const fillColor = getColorValue(colorClass);
  const TRACK_HEIGHT_PX = 24; // enforce explicit height

  return (
    <div className={clsx("w-full", className)}>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-base font-semibold text-text">{label}</span>
        <div className="flex items-baseline gap-2 text-sm">
          <span className="tabular-nums font-medium text-text">{value}</span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className="relative w-full overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-inner"
        style={{ 
          height: `${TRACK_HEIGHT_PX}px`,
          backgroundColor: '#f3f4f6',
          backgroundClip: 'padding-box'
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out shadow-lg z-20"
          style={{ 
            width: `${pct}%`,
            minWidth: pct > 0 ? '12px' : '0px',
            backgroundColor: fillColor
          }}
        />
      </div>
    </div>
  );
}
