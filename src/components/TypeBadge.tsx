import { typeColors } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export default function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const colorClasses = typeColors[type] || typeColors.normal;
  
  return (
    <button
      type="button"
      className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${className}`}
      style={{
        backgroundColor: `var(--type-${type})`,
        color: colorClasses.text === 'text-white' ? 'white' : 'black',
        borderColor: `var(--type-${type})`
      }}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );
}
