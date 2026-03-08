"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import type { NormalizedEvoGraph, NormalizedFamily } from '@/lib/evo/types';
import { methodToText, normalizeEvoGraph } from '@/lib/evo/normalize';
import type { EvoFilters } from '@/lib/evo/types';
import EvoCard from './EvoCard';
import EvoSkeleton from './EvoSkeleton';
import Image from 'next/image';
import { formatPokemonName } from '@/lib/utils';

type Props = {
  data: NormalizedEvoGraph;
  filters: EvoFilters;
};

export default function EvoTree({ data, filters }: Props) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const PAGE_SIZE = 10;

  const { search: query, gens, methods, branchingOnly } = filters;
  const queryLc = query.toLowerCase();

  const [open, setOpen] = useState<number[]>([]);
  const [families, setFamilies] = useState(data.families);
  const [loaded, setLoaded] = useState({ offset: data.families.length, hasMore: true });
  const [isLoading, setIsLoading] = useState(false);

  const handlePokemonClick = useCallback((pokemonId: number) => {
    router.push(`/pokemon/${pokemonId}`);
  }, [router]);

  const genKey = gens.join(',');
  const methodKey = methods.join(',');

  // Track which filter combo the current families were fetched for so we know
  // when a client-side fetch is needed and can ignore stale server re-renders.
  // Initialised to '1_' because the server pre-fetches gen 1 data.
  const fetchedFilterKey = useRef<string | null>('1_');

  // Sync server data only on first mount (or if we haven't done a client fetch yet).
  // After a client-side gen/method fetch we must NOT overwrite with stale server data
  // that can arrive via an RSC refetch triggered by router.replace().
  useEffect(() => {
    if (fetchedFilterKey.current !== null) return;
    setFamilies(data.families);
    setLoaded({ offset: data.families.length, hasMore: true });
  }, [data.families]);

  // Fetch families when the selected generations change.
  // We skip the fetch only when the current families were already fetched for
  // this exact genKey (avoids re-fetching the same data).
  useEffect(() => {
    if (!genKey) return;
    if (fetchedFilterKey.current === `${genKey}_${methodKey}`) return;

    let aborted = false;
    setIsLoading(true);
    (async () => {
      try {
        const usp = new URLSearchParams();
        usp.set('gen', genKey);
        if (methodKey) usp.set('method', methodKey);
        usp.set('limit', '300');
        usp.set('offset', '0');
        const res = await fetch(`/api/evolutions?${usp.toString()}`);
        if (!res.ok || aborted) return;
        const json: NormalizedEvoGraph = await res.json();
        if (aborted) return;
        const next = normalizeEvoGraph(json as any);
        fetchedFilterKey.current = `${genKey}_${methodKey}`;
        setFamilies(next.families || []);
        setLoaded({ offset: next.families.length, hasMore: true });
      } catch {} finally {
        if (!aborted) setIsLoading(false);
      }
    })();
    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genKey]);

  // Fetch families when the selected methods change.
  useEffect(() => {
    if (!methodKey) return;
    if (fetchedFilterKey.current === `${genKey}_${methodKey}`) return;

    let aborted = false;
    setIsLoading(true);
    (async () => {
      try {
        const usp = new URLSearchParams();
        if (genKey) usp.set('gen', genKey);
        usp.set('method', methodKey);
        usp.set('limit', '300');
        usp.set('offset', '0');
        const res = await fetch(`/api/evolutions?${usp.toString()}`);
        if (!res.ok || aborted) return;
        const json: NormalizedEvoGraph = await res.json();
        if (aborted) return;
        const next = normalizeEvoGraph(json as any);
        fetchedFilterKey.current = `${genKey}_${methodKey}`;
        setFamilies(next.families || []);
        setLoaded({ offset: next.families.length, hasMore: true });
      } catch {} finally {
        if (!aborted) setIsLoading(false);
      }
    })();
    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methodKey]);

  const filteredFamilies = useMemo(() => {
    let fams = families.slice();

    if (queryLc) {
      fams = fams.filter((f) =>
        f.species.some((s) => s.name.toLowerCase().includes(queryLc))
      );
    }

    if (gens.length) {
      const genSet = new Set(gens);
      fams = fams.filter((f) => f.species.some((s) => genSet.has(String(s.gen))));
    }

    if (methods.length) {
      const methodSet = new Set(methods);
      fams = fams.filter((f) => {
        // Check if any edge in this family uses one of the specified methods
        return f.edges.some((e) => methodSet.has(e.method.kind));
      });
    }

    if (branchingOnly) {
      fams = fams.filter((f) => f.isBranched);
    }

    // Sort: branched first, then by base name
    fams.sort((a, b) => {
      if (a.isBranched !== b.isBranched) return Number(b.isBranched) - Number(a.isBranched);
      const an = a.bases.map((id) => a.speciesById.get(id)?.name || '').join(',');
      const bn = b.bases.map((id) => b.speciesById.get(id)?.name || '').join(',');
      return an.localeCompare(bn);
    });

    return fams;
  }, [families, queryLc, gens, methods, branchingOnly]);

  // Windowing: render in fixed-size chunks (10-by-10)
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const visible = filteredFamilies.slice(0, limit);

  async function fetchMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const usp = new URLSearchParams();
      if (gens.length) usp.set('gen', gens.join(','));
      if (methods.length) usp.set('method', methods.join(','));
      usp.set('offset', String(loaded.offset));
      usp.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/evolutions?${usp.toString()}`);
      if (!res.ok) {
        setLoaded((s) => ({ ...s, hasMore: false }));
        return;
      }
      const json: NormalizedEvoGraph = await res.json();
      const next = normalizeEvoGraph(json as any);
      const nextFamilies = next.families || [];

      if (nextFamilies.length === 0) {
        setLoaded((s) => ({ ...s, hasMore: false }));
        return;
      }

      setFamilies((prev) => {
        const seen = new Set(prev.map((f) => f.familyId));
        const merged = [...prev];
        for (const f of nextFamilies) if (!seen.has(f.familyId)) merged.push(f);
        return merged;
      });

      setLoaded((s) => ({
        offset: s.offset + nextFamilies.length,
        hasMore: nextFamilies.length >= PAGE_SIZE,
      }));
    } catch {
      setLoaded((s) => ({ ...s, hasMore: false }));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleShowMore() {
    if (isLoadingMore) return;

    if (visible.length < filteredFamilies.length) {
      setLimit((n) => n + PAGE_SIZE);
      return;
    }

    if (!loaded.hasMore) return;

    await fetchMore();
    setLimit((n) => n + PAGE_SIZE);
  }

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [queryLc, genKey, methodKey, branchingOnly]);

  // Infinite scroll: observe a sentinel near the bottom to auto-load more
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const handleShowMoreRef = useRef(handleShowMore);
  handleShowMoreRef.current = handleShowMore;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleShowMoreRef.current();
        }
      },
      { root: null, rootMargin: '400px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const displayItems = visible;

  if (isLoading && families.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EvoSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" role="list" aria-label="Evolution families">
      {displayItems.map((fam) => {
        const famIsOpen = open.some((id) => fam.bases.includes(id));
        return (
          <FamilyTree
            key={fam.familyId}
            fam={fam}
            isOpen={famIsOpen}
            onToggle={() => {
              const ids = fam.bases;
              setOpen((prev) =>
                ids.every((id) => prev.includes(id))
                  ? prev.filter((id) => !ids.includes(id))
                  : [...prev, ...ids.filter((id) => !prev.includes(id))]
              );
            }}
            reduce={reduce}
            onPokemonClick={handlePokemonClick}
          />
        );
      })}

      {/* Sentinel for IntersectionObserver auto-load */}
      <div ref={sentinelRef} className="h-1" aria-hidden />

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent"
          />
          <span className="ml-2 text-sm text-gray-500">Loading more families...</span>
        </div>
      )}
    </div>
  );
}

const BLUR_PLACEHOLDER =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

const FamilyTree = React.memo(function FamilyTree({
  fam,
  isOpen,
  onToggle,
  reduce,
  onPokemonClick,
}: {
  fam: NormalizedFamily;
  isOpen: boolean;
  onToggle: () => void;
  reduce: boolean;
  onPokemonClick: (id: number) => void;
}) {
  const bases = useMemo(
    () => fam.bases.map((id) => fam.speciesById.get(id)!).filter(Boolean),
    [fam.bases, fam.speciesById]
  );

  const [hasBeenOpened, setHasBeenOpened] = useState(isOpen);
  useEffect(() => {
    if (isOpen) setHasBeenOpened(true);
  }, [isOpen]);

  return (
    <section
      className="rounded-md border bg-white/60 dark:bg-gray-900/40"
      role="listitem"
      aria-label={`${bases.map((b) => b.name).join(', ')} family`}
    >
      <div
        className="flex items-center justify-between p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            aria-expanded={isOpen}
            className="h-8 w-8 grid place-items-center rounded border bg-gray-50 dark:bg-gray-800"
          >
            {isOpen ? '\u2212' : '+'}
          </button>
          <h2 className="font-semibold flex items-center gap-3">
            {bases.map((b) => (
              <span key={b.id} className="inline-flex items-center gap-2">
                <Image
                  src={`https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${String(b.id).padStart(4, '0')}/Normal.png`}
                  alt={formatPokemonName(b.name)}
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  priority={false}
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="w-14 h-14 rounded bg-white/50 dark:bg-black/40 object-contain"
                  onError={(e) => {
                    (e.currentTarget as any).src =
                      b.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${b.id}.png`;
                  }}
                />
                <span>{formatPokemonName(b.name)}</span>
              </span>
            ))}
          </h2>
          {fam.isBranched && (
            <span className="ml-2 text-xs rounded-full bg-purple-600 text-white px-2 py-0.5">Branched</span>
          )}
        </div>
        <span className="text-xs text-gray-500">{fam.species.length} species</span>
      </div>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.2 }}
        className="overflow-hidden"
      >
        {hasBeenOpened && (
          <div className="mt-3 pl-2">
            <FamilyEdges fam={fam} reduce={reduce} onPokemonClick={onPokemonClick} />
          </div>
        )}
      </motion.div>
    </section>
  );
});

const FamilyEdges = React.memo(function FamilyEdges({
  fam,
  reduce,
  onPokemonClick,
}: {
  fam: NormalizedFamily;
  reduce: boolean;
  onPokemonClick: (id: number) => void;
}) {
  const rows = useMemo(() => {
    const result: JSX.Element[] = [];
    const seen = new Set<string>();

    for (const s of fam.species) {
      const outs = fam.outgoing.get(s.id) || [];
      for (const e of outs) {
        const key = `${e.from}-${e.to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const from = fam.speciesById.get(e.from)!;
        const to = fam.speciesById.get(e.to)!;
        result.push(
          <div key={key} className="flex items-center gap-2 p-2">
            <EvoCard species={from} onClick={() => onPokemonClick(from.id)} />
            <svg width="80" height="8" aria-hidden>
              <line x1="4" y1="4" x2="76" y2="4" stroke="#9CA3AF" strokeWidth="2" strokeDasharray="72" strokeDashoffset={reduce ? 0 : 72}>
                {!reduce && <animate attributeName="stroke-dashoffset" from="72" to="0" dur="0.35s" fill="freeze" />}
              </line>
            </svg>
            <span
              title={methodToText(e.method)}
              className="text-xs rounded-full border bg-gray-50 dark:bg-gray-800 px-2 py-1"
            >
              {methodIcon(e.method.kind)} <span className="ml-1 align-middle">{methodToText(e.method)}</span>
            </span>
            <EvoCard species={to} onClick={() => onPokemonClick(to.id)} />
          </div>
        );
      }
    }
    return result;
  }, [fam, reduce, onPokemonClick]);

  return <div className="flex flex-col">{rows}</div>;
});

function methodIcon(kind: string) {
  switch (kind) {
    case 'stone':
      return '💎';
    case 'trade':
      return '🔁';
    case 'friendship':
      return '💖';
    case 'location':
      return '📍';
    case 'special':
      return '✨';
    default:
      return '⬡';
  }
}
