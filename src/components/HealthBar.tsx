import clsx from "clsx";

type Props = {
  currentHp: number;
  maxHp: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

export default function HealthBar({
  currentHp,
  maxHp,
  className,
  showLabel = false,
  size = 'md'
}: Props) {
  const hpPercentage = (currentHp / maxHp) * 100;
  
  // Determine color based on HP percentage
  const getHealthColor = (percentage: number) => {
    if (percentage > 60) return '#22c55e'; // green-500
    if (percentage > 30) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const getHealthColorClass = (percentage: number) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const fillColor = getHealthColor(hpPercentage);
  
  // Size configurations
  const sizeConfig = {
    sm: { height: 12, textSize: 'text-xs' },
    md: { height: 16, textSize: 'text-sm' },
    lg: { height: 20, textSize: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <div className={clsx("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between">
          <span className={clsx("font-medium text-text", config.textSize)}>HP</span>
          <span className={clsx("font-medium text-text", config.textSize)}>
            {currentHp} / {maxHp}
          </span>
        </div>
      )}

      <div
        role="progressbar"
        aria-label="Health Points"
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={currentHp}
        className="relative w-full overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-600 shadow-inner"
        style={{ 
          height: `${config.height}px`,
          backgroundColor: '#f3f4f6',
          backgroundClip: 'padding-box'
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out shadow-sm z-20"
          style={{ 
            width: `${hpPercentage}%`,
            minWidth: hpPercentage > 0 ? '4px' : '0px',
            backgroundColor: fillColor
          }}
        />
        
        {/* Optional: Add a subtle gradient overlay for more visual appeal */}
        <div
          className="absolute left-0 top-0 h-full rounded-full opacity-20"
          style={{ 
            width: `${hpPercentage}%`,
            background: `linear-gradient(90deg, ${fillColor} 0%, ${fillColor}80 100%)`
          }}
        />
      </div>
    </div>
  );
}
