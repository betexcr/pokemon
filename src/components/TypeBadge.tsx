import { typeColors } from '@/lib/utils';

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export default function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const colorClasses = typeColors[type] || typeColors.normal;
  
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
        ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}
        ${className}
      `}
      style={{ 
        backgroundColor: `var(--type-${type})`,
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
      }}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}
