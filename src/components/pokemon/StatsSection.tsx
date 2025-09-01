type Stat = { name: string; value: number }; // HP, attack, defense, special-attack, special-defense, speed

export default function StatsSection({ stats }: { stats: Stat[] }) {
  const cap = (s:string)=>s.replace("-", " ");
  return (
    <section id="stats" className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h3 className="text-lg font-semibold">Base Stats</h3>
      <ul className="space-y-3">
        {stats.map(s => (
          <li key={s.name} className="grid grid-cols-[140px_1fr_auto] items-center gap-3">
            <span className="capitalize text-sm text-muted">{cap(s.name)}</span>
            <div className="h-2 rounded bg-border/50">
              <div
                className="h-2 rounded bg-poke-red transition-[width] duration-700"
                style={{ width: `${Math.min(s.value, 150) / 1.5}%` }}
              />
            </div>
            <span className="text-sm tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>

      {/* Radar placeholder (hook up chart lib later) */}
      <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
        Radar chart placeholder (HP/Atk/Def/Sp.Atk/Sp.Def/Speed)
      </div>
    </section>
  );
}
