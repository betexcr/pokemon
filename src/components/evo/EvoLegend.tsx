import { methodToText } from '@/lib/evo/normalize';

// Simple legend explaining method badges. Server component.
export default function EvoLegend() {
  const samples = [
    { kind: 'stone', item: 'Fire Stone' },
    { kind: 'trade', item: 'Metal Coat' },
    { kind: 'friendship', time: 'night' },
    { kind: 'location', place: 'Moss Rock' },
    { kind: 'special', hint: 'Hold device upside down' },
  ] as const;

  return (
    <div className="inline-flex flex-wrap items-center gap-2" aria-label="Evolution method legend">
      {samples.map((m, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800"
          role="img"
          aria-label={methodToText(m as any)}
        >
          <span aria-hidden>
            {m.kind === 'stone' && '💎'}
            {m.kind === 'trade' && '🔁'}
            {m.kind === 'friendship' && '💖'}
            {m.kind === 'location' && '📍'}
            {m.kind === 'special' && '✨'}
          </span>
          <span>{methodToText(m as any)}</span>
        </span>
      ))}
    </div>
  );
}

