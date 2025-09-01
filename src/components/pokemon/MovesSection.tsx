"use client";

import { useMemo, useState } from "react";
import TypeBadge from "@/components/TypeBadge";

type Move = {
  name: string;
  type: string;         // fire, water...
  damage_class: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  level_learned_at?: number | null;
};

const categories = ["physical","special","status"] as const;

export default function MovesSection({ moves }: { moves: Move[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<null | Move["damage_class"]>(null);
  const [type, setType] = useState<string>("");

  const filtered = useMemo(() => {
    let rows = moves;
    if (q) rows = rows.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
    if (cat) rows = rows.filter(m => m.damage_class === cat);
    if (type) rows = rows.filter(m => m.type === type);
    return rows.sort((a,b) => {
      // Sort by level first (null levels last), then by name
      const aLevel = a.level_learned_at ?? 999;
      const bLevel = b.level_learned_at ?? 999;
      if (aLevel !== bLevel) return aLevel - bLevel;
      return a.name.localeCompare(b.name);
    });
  }, [moves, q, cat, type]);

  return (
    <section id="moves" className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          className="h-10 w-full sm:w-72 rounded-xl border border-border bg-white dark:bg-surface px-3 text-sm"
          placeholder="Search moves…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <select className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                value={cat ?? ""} onChange={(e)=>setCat((e.target.value||null) as Move["damage_class"] | null)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
        </select>
        <select className="h-10 rounded-xl border border-border bg-surface px-3 text-sm"
                value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="">All types</option>
          {TYPE_ORDER.map(t => <option key={t} value={t}>{capitalize(t)}</option>)}
        </select>
        <span className="ml-auto text-xs text-muted">{filtered.length} moves</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg/90 backdrop-blur border-b border-border z-10">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left text-muted">
              <th>Move</th><th>Type</th><th>Cat.</th><th>Power</th><th>Acc.</th><th>PP</th><th>Lvl</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border">
            {filtered.map((m, index) => (
              <tr key={`${m.name}-${index}`} className="[&>td]:px-3 [&>td]:py-2">
                <td className="font-medium capitalize">{m.name}</td>
                <td><TypeBadge type={m.type} /></td>
                <td className="capitalize">{m.damage_class}</td>
                <td>{m.power ?? "—"}</td>
                <td>{m.accuracy ?? "—"}</td>
                <td>{m.pp ?? "—"}</td>
                <td>{m.level_learned_at ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const TYPE_ORDER = [
  "normal","fire","water","electric","grass","ice","fighting","poison","ground",
  "flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
];
const capitalize=(s:string)=>s[0].toUpperCase()+s.slice(1);
