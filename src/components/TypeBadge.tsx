import { typeColors } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  className?: string;
  variant?: 'button' | 'span';
}

export default function TypeBadge({ type, className = '', variant = 'button' }: TypeBadgeProps) {
  const colorClasses = typeColors[type] || typeColors.normal;
  
  const baseClasses = `px-3 py-1 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap ${className}`;
  const style = {
    backgroundColor: `var(--type-${type})`,
    color: colorClasses.text === 'text-white' ? 'white' : 'black',
    borderColor: `var(--type-${type})`
  };
  
  if (variant === 'span') {
    return (
      <span className={baseClasses} style={style}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  }
  
  return (
    <button
      type="button"
      className={baseClasses}
      style={style}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  );
}
