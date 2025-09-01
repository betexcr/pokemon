import { TYPE_LABELS, typeChipClasses } from '@/lib/typeColors'

export default function TypeBadge({ type }: { type: string }) {
  const label = TYPE_LABELS[type.toLowerCase()] ?? type;
  return (
    <span className={typeChipClasses(type)} aria-label={`Type: ${label}`}>
      {label}
    </span>
  )
}
