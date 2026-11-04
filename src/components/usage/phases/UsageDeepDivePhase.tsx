'use client';

import { useState, useEffect, useMemo } from 'react';
import LazyImage from '@/components/LazyImage';
import { usageSpriteUrls } from '@/lib/usage/species';
import type { UsageFilters, UsagePhaseState, UsagePhase, UsageRow, UsageSubstats } from '@/types/usage';

interface UsageDeepDivePhaseProps {
  filters: UsageFilters;
  phaseState: UsagePhaseState;
  onPhaseChange: (phase: UsagePhase, selectedPokemonId?: number, selectedPokemonName?: string) => void;
  onMonthResolved?: (requestedMonth: string, resolvedMonth: string) => void;
}

interface MonthlyResponse {
  data: UsageRow[];
  metadata: {
    resolvedMonth?: string;
    totalBattles?: number;
    source?: string;
  };
}

interface SubstatsResponse {
  pokemonName: string;
  month: string;
  substats: UsageSubstats | null;
  sourceUrl?: string;
}

type PctEntry = { name: string; pct: number };

const LIST_LIMIT = 10;

function PctList({ title, entries, color, note }: { title: string; entries?: PctEntry[]; color: string; note?: string }) {
  if (!entries || entries.length === 0) return null;
  const max = Math.max(...entries.map((e) => e.pct), 1);
  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {note && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{note}</p>}
      <ul className="space-y-2 mt-2">
        {entries.slice(0, LIST_LIMIT).map((entry) => (
          <li key={entry.name} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-gray-900 dark:text-gray-100" title={entry.name}>
              {entry.name}
            </span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className={`${color} h-2 rounded-full`} style={{ width: `${(entry.pct / max) * 100}%` }} />
            </div>
            <span className="w-16 text-right text-sm tabular-nums text-gray-600 dark:text-gray-400">
              {entry.pct.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function UsageDeepDivePhase({ filters, phaseState }: UsageDeepDivePhaseProps) {
  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(phaseState.data.selectedPokemonName ?? null);

  const [details, setDetails] = useState<SubstatsResponse | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // 1. Ranking for the selected format/month (used for the picker and headline numbers).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const params = new URLSearchParams();
        if (filters.platforms[0]) params.set('platform', filters.platforms[0]);
        if (filters.generations[0]) params.set('generation', filters.generations[0]);
        if (filters.formats[0]) params.set('format', filters.formats[0]);
        if (filters.month) params.set('month', filters.month);
        if (filters.top50Only) params.set('top50Only', 'true');
        const response = await fetch(`/api/usage/monthly?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: MonthlyResponse = await response.json();
        if (!cancelled) setMonthly(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setMonthly(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filters, retryKey]);

  const rows = useMemo(() => monthly?.data ?? [], [monthly]);
  const month = monthly?.metadata?.resolvedMonth ?? filters.month;

  // Keep a valid selection: requested name → requested dex id → top-ranked Pokémon.
  useEffect(() => {
    if (rows.length === 0) return;
    if (selectedName && rows.some((row) => row.pokemonName === selectedName)) return;
    const wantedName = phaseState.data.selectedPokemonName;
    const wantedId = phaseState.data.selectedPokemonId;
    const next =
      (wantedName && rows.find((row) => row.pokemonName === wantedName)) ||
      (wantedId && rows.find((row) => row.pokemonId === wantedId)) ||
      rows[0];
    setSelectedName(next.pokemonName);
  }, [rows, selectedName, phaseState.data.selectedPokemonName, phaseState.data.selectedPokemonId]);

  const selected = rows.find((row) => row.pokemonName === selectedName) ?? null;

  // 2. Moveset details (moves, items, spreads, …) for the selected Pokémon.
  useEffect(() => {
    if (!selected || !month) return;
    let cancelled = false;
    setDetailsLoading(true);
    setDetailsError(null);
    setDetails(null);
    (async () => {
      try {
        const params = new URLSearchParams({
          platform: selected.platform,
          generation: selected.generation,
          format: selected.format,
          month,
          name: selected.pokemonName,
        });
        const response = await fetch(`/api/usage/pokemon?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result: SubstatsResponse = await response.json();
        if (!cancelled) setDetails(result);
      } catch (err) {
        if (!cancelled) setDetailsError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !selected) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-gray-700 dark:text-gray-300">{error ? 'No Data Available' : 'No data found'}</div>
        {error && <div className="text-sm text-gray-500">{error}</div>}
        <button
          type="button"
          onClick={() => setRetryKey((k) => k + 1)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const sub = details?.substats ?? null;
  const topSpread = sub?.spreads?.[0];
  const commonMoves = sub?.moves?.slice(0, 4).map((m) => m.name) ?? [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Deep Dive Analysis</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Moves, items, abilities, Tera types, EV spreads and teammates from Smogon&apos;s moveset statistics
        </p>
      </div>

      {/* Picker */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label htmlFor="deepdive-pokemon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Pokémon for analysis:
        </label>
        <select
          id="deepdive-pokemon"
          value={selected.pokemonName}
          onChange={(e) => setSelectedName(e.target.value)}
          className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          {rows.map((row) => (
            <option key={row.pokemonName} value={row.pokemonName}>
              #{row.rank} {row.pokemonName} ({row.usagePercent.toFixed(2)}%)
            </option>
          ))}
        </select>
      </div>

      {/* Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 shrink-0">
            <LazyImage
              key={selected.pokemonName}
              srcList={usageSpriteUrls(selected.pokemonName, 'large')}
              alt={selected.pokemonName}
              width={80}
              height={80}
              imgClassName="w-20 h-20 object-contain"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selected.pokemonName}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              #{selected.rank} in {selected.format.replace(/_/g, ' ')} · {month}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">#{selected.rank}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Usage rank</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selected.usagePercent.toFixed(2)}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">of teams (weighted)</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {selected.sampleSize?.toLocaleString() ?? '—'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Teams using it</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {monthly?.metadata?.totalBattles?.toLocaleString() ?? '—'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Battles in format</div>
          </div>
        </div>
      </div>

      {detailsLoading && (
        <div className="flex items-center justify-center gap-3 py-10 text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          Loading moveset statistics…
        </div>
      )}

      {!detailsLoading && (detailsError || (details && !sub)) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-4 text-sm text-amber-900 dark:text-amber-200">
          {detailsError
            ? `Couldn't load moveset statistics (${detailsError}).`
            : `Smogon's moveset statistics for ${month} don't include ${selected.pokemonName}.`}
        </div>
      )}

      {sub && (
        <>
          {/* Most common choices, built only from the top entry of each real distribution */}
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Most common choices</h3>
            <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mb-3">
              The most popular option in each category. They are counted separately, so this is not necessarily one
              exact set.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-blue-900 dark:text-blue-100">
              {sub.items?.[0] && (
                <div><dt className="inline font-semibold">Item: </dt><dd className="inline">{sub.items[0].name} ({sub.items[0].pct.toFixed(1)}%)</dd></div>
              )}
              {sub.abilities?.[0] && (
                <div><dt className="inline font-semibold">Ability: </dt><dd className="inline">{sub.abilities[0].name} ({sub.abilities[0].pct.toFixed(1)}%)</dd></div>
              )}
              {sub.teraTypes?.[0] && (
                <div><dt className="inline font-semibold">Tera type: </dt><dd className="inline">{sub.teraTypes[0].name} ({sub.teraTypes[0].pct.toFixed(1)}%)</dd></div>
              )}
              {topSpread && (
                <div><dt className="inline font-semibold">Spread: </dt><dd className="inline">{topSpread.nature} {topSpread.evs} ({topSpread.pct.toFixed(1)}%)</dd></div>
              )}
              {commonMoves.length > 0 && (
                <div className="sm:col-span-2"><dt className="inline font-semibold">Moves: </dt><dd className="inline">{commonMoves.join(' / ')}</dd></div>
              )}
            </dl>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PctList
              title="Moves"
              entries={sub.moves}
              color="bg-blue-500"
              note="Share of sets running each move. Sets have up to 4 moves, so these add up to about 400%."
            />
            <PctList title="Items" entries={sub.items} color="bg-green-500" />
            <PctList title="Abilities" entries={sub.abilities} color="bg-purple-500" />
            <PctList title="Tera types" entries={sub.teraTypes} color="bg-pink-500" />
            <PctList
              title="Teammates"
              entries={sub.teammates}
              color="bg-amber-500"
              note="Pokémon most often on the same team."
            />
            {sub.spreads && sub.spreads.length > 0 && (
              <PctList
                title="EV spreads"
                entries={sub.spreads.map((s) => ({ name: `${s.nature} ${s.evs}`, pct: s.pct }))}
                color="bg-teal-500"
                note="Nature and HP/Atk/Def/SpA/SpD/Spe EVs."
              />
            )}
          </div>
        </>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Source:{' '}
        {details?.sourceUrl ? (
          <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
            Smogon moveset statistics ({month})
          </a>
        ) : (
          selected.source?.label ?? 'Smogon usage statistics'
        )}
      </p>
    </div>
  );
}
