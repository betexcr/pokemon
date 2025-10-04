"use client";

import { useMemo, useState } from "react";
import TypeBadgeWithEffectiveness from "@/components/TypeBadgeWithEffectiveness";
import Tooltip from "@/components/Tooltip";
import { MoveSkeleton } from "@/components/skeletons/PokemonDetailsSkeleton";

type Move = {
  name: string;
  type: string;         // fire, water...
  damage_class: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number | null;
  level_learned_at?: number | null;
  learn_method?: string;
  short_effect?: string | null;
};

const categories = ["physical","special","status"] as const;


export default function MovesSection({ moves, pokemonTypes = [], loading = false }: { moves: Move[]; pokemonTypes?: string[]; loading?: boolean }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<null | Move["damage_class"]>(null);
  const [type, setType] = useState<string>("");
  const [showAllMoves, setShowAllMoves] = useState(false);
  const [sortField, setSortField] = useState<keyof Move | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');


  const filtered = useMemo(() => {
    let rows = moves;
    
    // Filter by learn method (show only level-up moves by default)
    if (!showAllMoves) {
      rows = rows.filter(m => m.learn_method === 'level-up');
    }
    
    if (q) rows = rows.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
    if (cat) rows = rows.filter(m => m.damage_class === cat);
    if (type) rows = rows.filter(m => m.type === type);
    
    // Apply sorting
    if (sortField) {
      rows = rows.sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];
        
        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = sortField === 'name' ? '' : 999;
        if (bValue === null || bValue === undefined) bValue = sortField === 'name' ? '' : 999;
        
        // Handle numeric fields
        if (sortField === 'power' || sortField === 'accuracy' || sortField === 'pp' || sortField === 'level_learned_at') {
          const aNum = Number(aValue);
          const bNum = Number(bValue);
          if (isNaN(aNum) && isNaN(bNum)) return 0;
          if (isNaN(aNum)) return 1;
          if (isNaN(bNum)) return -1;
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // Handle string fields
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    } else {
      // Default sorting: by level first (null levels last), then by name
      rows = rows.sort((a,b) => {
        const aLevel = a.level_learned_at ?? 999;
        const bLevel = b.level_learned_at ?? 999;
        if (aLevel !== bLevel) return aLevel - bLevel;
        return a.name.localeCompare(b.name);
      });
    }
    
    return rows;
  }, [moves, q, cat, type, showAllMoves, sortField, sortDirection]);

  const handleSort = (field: keyof Move) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Move) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <section id="moves" className="mx-auto w-full px-4 py-8 space-y-4 text-center">
      <div className="flex flex-wrap items-center gap-2 justify-center">
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
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showAllMoves}
            onChange={(e) => setShowAllMoves(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-muted">Show HM/TM/Other moves</span>
        </label>
        <span className="ml-auto text-xs text-muted">{filtered.length} moves</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-bg border-b border-border z-10">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left text-muted">
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('name')}
              >
                Move {getSortIcon('name')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('type')}
              >
                Type {getSortIcon('type')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('damage_class')}
              >
                Cat. {getSortIcon('damage_class')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('power')}
              >
                Power {getSortIcon('power')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('accuracy')}
              >
                Acc. {getSortIcon('accuracy')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('pp')}
              >
                PP {getSortIcon('pp')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('level_learned_at')}
              >
                Lvl {getSortIcon('level_learned_at')}
              </th>
              <th 
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
                onClick={() => handleSort('learn_method')}
              >
                Method {getSortIcon('learn_method')}
              </th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-b [&>tr]:border-border">
            {loading || filtered.length === 0 ? (
              // Show skeleton rows when loading
              [1, 2, 3, 4, 5, 6].map((index) => (
                <tr key={`skeleton-${index}`} className="[&>td]:px-3 [&>td]:py-2">
                  <td className="font-medium">
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse"></div>
                  </td>
                  <td>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
                  </td>
                </tr>
              ))
            ) : (
              filtered.map((m, index) => (
                <tr key={`${m.name}-${index}`} className="[&>td]:px-3 [&>td]:py-2">
                  <td className="font-medium capitalize">
                    {m.short_effect ? (
                      <Tooltip content={m.short_effect} maxWidth="w-[22rem]" variant="move" type={m.type} damageClass={m.damage_class}>
                        <span className="cursor-help">
                          {m.name}
                        </span>
                      </Tooltip>
                    ) : (
                      <span>{m.name}</span>
                    )}
                  </td>
                  <td><TypeBadgeWithEffectiveness type={m.type} /></td>
                  <td className="capitalize">{m.damage_class}</td>
                  <td>{m.power ?? "—"}</td>
                  <td>{m.accuracy ?? "—"}</td>
                  <td>{m.pp ?? "—"}</td>
                  <td>{m.level_learned_at ?? "—"}</td>
                  <td className="capitalize text-xs">{formatLearnMethod(m.learn_method)}</td>
                </tr>
              ))
            )}
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

const formatLearnMethod = (method: string | undefined): string => {
  if (!method) return "—";
  
  const methodMap: Record<string, string> = {
    'level-up': 'Level',
    'machine': 'TM/HM',
    'egg': 'Egg',
    'tutor': 'Tutor',
    'form-change': 'Form',
    'light-ball-egg': 'Light Ball',
    'stadium-surfing-pikachu': 'Stadium',
    'xd-shadow': 'XD Shadow',
    'xd-purification': 'XD Purify',
    'colosseum-purification': 'Colosseum',
    'xd': 'XD',
    'colosseum': 'Colosseum',
    'event': 'Event',
    'dream-world': 'Dream World',
    'gen-iv-hgss': 'HGSS',
    'gen-v-pan': 'Pan',
    'gen-vi-oras': 'ORAS',
    'gen-vii-ultra-sun-ultra-moon': 'USUM',
    'gen-viii-crown-tundra': 'Crown Tundra',
    'gen-ix': 'Gen IX',
    'unknown': '—'
  };
  
  return methodMap[method] || capitalize(method.replace(/-/g, ' '));
};
