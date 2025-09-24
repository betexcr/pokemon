"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import type { NormalizedEvoGraph, NormalizedFamily } from '@/lib/evo/types';
import { methodToText, normalizeEvoGraph } from '@/lib/evo/normalize';
import EvoCard from './EvoCard';
import EvoSkeleton from './EvoSkeleton';
import Image from 'next/image';
import { formatPokemonName } from '@/lib/utils';

type Props = {
  data: NormalizedEvoGraph;
};

export default function EvoTree({ data }: Props) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  const PAGE_SIZE = 10;

  const query = (sp.get('search') || '').toLowerCase();
  const gens = (sp.get('gen') || '').split(',').filter(Boolean);
  const methods = (sp.get('method') || '').split(',').filter(Boolean);
  const branchingOnly = sp.get('branchingOnly') === '1' || sp.get('branchingOnly') === 'true';
  const openParam = (sp.get('open') || '').split(',').map((s) => Number(s)).filter(Boolean);

  const [open, setOpen] = useState<number[]>(openParam);
  const [families, setFamilies] = useState(data.families);
  const [loaded, setLoaded] = useState({ offset: data.families.length, hasMore: true });
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Navigation handler for Pokemon detail pages
  const handlePokemonClick = useCallback((pokemonId: number) => {
    router.push(`/pokemon/${pokemonId}`);
  }, [router]);

  useEffect(() => {
    setOpen(openParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.get('open')]);

  // Handle filter loading state - show loading during actual API calls
  useEffect(() => {
    const hasFilters = gens.length > 0 || methods.length > 0 || branchingOnly;
    if (hasFilters) {
      // Show loading immediately when filters are applied
      setIsFilterLoading(true);
    } else {
      setIsFilterLoading(false);
    }
  }, [gens.length, methods.length, branchingOnly]);

  function setOpenParam(next: number[]) {
    const usp = new URLSearchParams(sp.toString());
    if (next.length) usp.set('open', next.join(','));
    else usp.delete('open');
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    setOpen(next);
  }

  function toggleOpen(id: number) {
    const next = open.includes(id) ? open.filter((x) => x !== id) : [...open, id];
    setOpenParam(next);
  }

  useEffect(() => {
    // If the server provided a new dataset (e.g., full refresh), sync local state
    setFamilies(data.families);
    setLoaded({ offset: data.families.length, hasMore: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.families]);

  // When generation filter changes via URL (client-side), proactively fetch a fresh dataset
  // But only if we don't already have the right data from server-side rendering
  useEffect(() => {
    const genKey = gens.join(',');
    if (!genKey) return; // no gen filter -> keep current dataset and rely on pagination

    // Check if we already have data that matches the current generation filter
    // If the server already provided the right data, don't make another request
    const hasMatchingData = families.some(family => 
      family.species.some(species => gens.includes(String(species.gen)))
    );
    
    // Only fetch if we don't have matching data or if we have very few families (indicating incomplete data)
    if (hasMatchingData && families.length > 10) return;

    let aborted = false;
    setIsInitialLoading(true);
    (async () => {
      try {
        const usp = new URLSearchParams();
        usp.set('gen', genKey);
        usp.set('limit', String(PAGE_SIZE * 30)); // initial bulk to populate view
        usp.set('offset', '0');
        const res = await fetch(`/api/evolutions?${usp.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json: NormalizedEvoGraph = await res.json();
        if (aborted) return;
        const next = normalizeEvoGraph(json as any);
        setFamilies(next.families || []);
        setLoaded({ offset: next.families.length, hasMore: true });
      } catch {}
      finally {
        if (!aborted) {
          setIsInitialLoading(false);
          setIsFilterLoading(false);
        }
      }
    })();

    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gens.join(',')]);

  // When method filter changes via URL (client-side), proactively fetch a fresh dataset
  // But only if we don't already have the right data from server-side rendering
  useEffect(() => {
    const methodKey = methods.join(',');
    if (!methodKey) return; // no method filter -> keep current dataset and rely on pagination

    // Check if we already have data that matches the current method filter
    // If the server already provided the right data, don't make another request
    const hasMatchingData = families.some(family => 
      family.edges.some(edge => methods.includes(edge.method.kind))
    );
    
    // Only fetch if we don't have matching data or if we have very few families (indicating incomplete data)
    if (hasMatchingData && families.length > 10) return;

    let aborted = false;
    setIsInitialLoading(true);
    (async () => {
      try {
        const usp = new URLSearchParams();
        usp.set('method', methodKey);
        usp.set('limit', String(PAGE_SIZE * 30)); // initial bulk to populate view
        usp.set('offset', '0');
        const res = await fetch(`/api/evolutions?${usp.toString()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json: NormalizedEvoGraph = await res.json();
        if (aborted) return;
        const next = normalizeEvoGraph(json as any);
        setFamilies(next.families || []);
        setLoaded({ offset: next.families.length, hasMore: true });
      } catch {}
      finally {
        if (!aborted) {
          setIsInitialLoading(false);
          setIsFilterLoading(false);
        }
      }
    })();

    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods.join(',')]);

  const filteredFamilies = useMemo(() => {
    let fams = families.slice();

    // Only log in development and when there are significant changes
    if (process.env.NODE_ENV === 'development' && families.length > 0) {
      console.log('Filtering families:', {
        totalFamilies: families.length,
        query: query || 'none',
        gens: gens.length || 'all',
        methods: methods.length || 'all',
        branchingOnly
      });
    }

    if (query) {
      const queryLower = query.toLowerCase();
      fams = fams.filter((f) =>
        f.species.some((s) => s.name.toLowerCase().includes(queryLower))
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
  }, [families, query, gens, methods, branchingOnly]);

  // Windowing: render in fixed-size chunks (10-by-10)
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const visible = filteredFamilies.slice(0, limit);
  
  // For generation-filtered or method-filtered data, we should only show "Show more" if we haven't displayed all families yet
  // or if we're not in filtering mode and there might be more data
  const hasFiltering = gens.length > 0 || methods.length > 0;
  const canShowMore = hasFiltering 
    ? visible.length < filteredFamilies.length 
    : (visible.length < filteredFamilies.length || loaded.hasMore);

  async function fetchMore() {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const usp = new URLSearchParams();
      const genParam = sp.get('gen');
      const methodParam = sp.get('method');
      
      if (genParam) usp.set('gen', genParam);
      if (methodParam) usp.set('method', methodParam);
      
      // For generation-filtered or method-filtered data, we need to be more careful with offset calculation
      // If we have filtering, we should start from the total families we already have
      const hasFiltering = genParam || methodParam;
      const currentOffset = hasFiltering ? families.length : loaded.offset;
      usp.set('offset', String(currentOffset));
      usp.set('limit', String(PAGE_SIZE));
      
      const res = await fetch(`/api/evolutions?${usp.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load more');
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
      
      // Update offset based on whether we're in generation mode or not
      if (genParam) {
        setLoaded((s) => ({ offset: families.length + nextFamilies.length, hasMore: nextFamilies.length >= PAGE_SIZE }));
      } else {
        setLoaded((s) => ({ offset: s.offset + nextFamilies.length, hasMore: nextFamilies.length >= PAGE_SIZE }));
      }
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Auto-fetch more when searching yields no local results, one page at a time.
  useEffect(() => {
    if (!query) return;
    if (filteredFamilies.length > 0) return;
    if (!loaded.hasMore) return;
    if (isLoadingMore) return;
    // Fetch next page; effect will re-run after state updates
    handleShowMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filteredFamilies.length, loaded.hasMore, isLoadingMore]);

  // Search-based loading for better performance when searching
  useEffect(() => {
    if (!query || query.length < 2) return;
    
    let aborted = false;
    setIsInitialLoading(true);
    
    (async () => {
      try {
        const searchParams = new URLSearchParams();
        searchParams.set('q', query);
        if (gens.length) {
          searchParams.set('gen', gens.join(','));
        }
        
        const res = await fetch(`/api/evolutions/search?${searchParams.toString()}`, { 
          cache: 'no-store' 
        });
        if (!res.ok) return;
        const json = await res.json();
        if (aborted) return;
        
        // Merge search results with existing families
        setFamilies(prev => {
          const seen = new Set(prev.map(f => f.familyId));
          const newFamilies = json.families.filter((f: any) => !seen.has(f.familyId));
          return [...prev, ...newFamilies];
        });
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        if (!aborted) {
          setIsInitialLoading(false);
          setIsFilterLoading(false);
        }
      }
    })();

    return () => { aborted = true; };
  }, [query, gens.join(',')]);

  async function handleShowMore() {
    if (isLoadingMore) return;
    
    // Prefer revealing already-filtered local items first
    if (visible.length < filteredFamilies.length) {
      setLimit((n) => n + PAGE_SIZE);
      return;
    }
    
    // If we're in filtering mode and have shown all families, don't fetch more
    if (hasFiltering && visible.length >= filteredFamilies.length) {
      return;
    }
    
    // If we've shown all locally available filtered items but there are more on the server, fetch then reveal
    if (loaded.hasMore) {
      await fetchMore();
      setLimit((n) => n + PAGE_SIZE);
    }
  }

  // When filters/search change, reset visible count
  useEffect(() => {
    setLimit(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, gens.join(','), methods.join(','), branchingOnly]);

  // Infinite scroll: observe a sentinel near the bottom to trigger fetchMore
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!canShowMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoadingMore && canShowMore) {
          handleShowMore();
        }
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canShowMore, isLoadingMore, sentinelRef.current]);

  // Optimize rendering by reducing the initial batch size for better performance
  const MAX_INITIAL_RENDER = 20; // Render fewer items initially for better performance
  const shouldLimitInitial = visible.length > MAX_INITIAL_RENDER && !query && gens.length === 0;
  const displayItems = shouldLimitInitial ? visible.slice(0, MAX_INITIAL_RENDER) : visible;

  // Show loading skeleton when initial loading, but keep header and filters visible
  if (isInitialLoading) {
    return (
      <div className="flex flex-col gap-4">
        <EvoSkeleton />
      </div>
    );
  }

  // Show filter loading state when filters are being applied
  if (isFilterLoading) {
    return (
      <div className="flex flex-col gap-4">
        {/* Show a subtle loading indicator instead of full-screen loading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-8"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center mb-4"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-white text-xl"
            >
              ⚡
            </motion.div>
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-3 text-sm text-gray-600 dark:text-gray-400"
          >
            {methods.length > 0 && `Finding ${methods.join(', ')} evolutions...`}
            {gens.length > 0 && `Filtering by ${gens.join(', ')}...`}
            {branchingOnly && 'Showing branched evolutions only...'}
            {!methods.length && !gens.length && !branchingOnly && 'Processing filters...'}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" role="list" aria-label="Evolution families">
      {displayItems.map((fam) => (
        <FamilyTree
          key={fam.familyId}
          fam={fam}
          open={open}
          onToggle={toggleOpen}
          reduce={reduce}
          onPokemonClick={handlePokemonClick}
        />)
      )}
      {shouldLimitInitial && visible.length > MAX_INITIAL_RENDER && (
        <div className="flex justify-center">
          <button 
            type="button" 
            className="px-4 py-2 rounded border text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40" 
            onClick={() => setLimit(visible.length)}
          >
            Show all {visible.length} families
          </button>
        </div>
      )}
      {canShowMore && (
        <div className="flex justify-center">
          <button 
            type="button" 
            className="px-3 py-1.5 rounded border text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" 
            onClick={handleShowMore} 
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent"
                />
                Loading more...
              </>
            ) : (
              'Show more'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function FamilyTree({ fam, open, onToggle, reduce, onPokemonClick }: { fam: NormalizedFamily; open: number[]; onToggle: (id: number) => void; reduce: boolean; onPokemonClick: (id: number) => void }) {
  const bases = fam.bases.map((id) => fam.speciesById.get(id)!).filter(Boolean);
  const isOpen = open.some((id) => fam.bases.includes(id));

  const content = (
    <div className="mt-3 pl-2">
      {renderFamilyFlat(fam, reduce, onPokemonClick)}
    </div>
  );

  return (
    <section className="rounded-md border bg-white/60 dark:bg-gray-900/40" role="listitem" aria-label={`${bases.map((b) => b.name).join(', ')} family`}>
      <div
        className="flex items-center justify-between p-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onClick={() => bases.forEach((b) => onToggle(b.id))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            bases.forEach((b) => onToggle(b.id));
          }
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); bases.forEach((b) => onToggle(b.id)); }}
            aria-expanded={isOpen}
            className="h-8 w-8 grid place-items-center rounded border bg-gray-50 dark:bg-gray-800"
          >
            {isOpen ? '−' : '+'}
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
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  className="w-14 h-14 rounded bg-white/50 dark:bg-black/40 object-contain"
                  onError={(e) => {
                    (e.currentTarget as any).src = b.sprite || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${b.id}.png`
                  }}
                />
                <span>{formatPokemonName(b.name)}</span>
              </span>
            ))}
          </h2>
          {fam.isBranched && <span className="ml-2 text-xs rounded-full bg-purple-600 text-white px-2 py-0.5">Branched</span>}
        </div>
        <span className="text-xs text-gray-500">{fam.species.length} species</span>
      </div>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'tween', duration: 0.2 }}
        className="overflow-hidden"
      >
        {content}
      </motion.div>
    </section>
  );
}

// Minimal, readable layout: flat list of edges with badges between nodes.
function renderFamilyFlat(fam: NormalizedFamily, reduce: boolean, onPokemonClick: (id: number) => void) {
  const rows: JSX.Element[] = [];
  const seen = new Set<string>();
  const [hoverTarget, setHoverTarget] = (typeof window !== 'undefined') ? (window as any).__evoHover || [null, null] : [null, null];
  fam.species.forEach((s) => {
    const outs = fam.outgoing.get(s.id) || [];
    if (outs.length === 0) return;
    outs.forEach((e) => {
      const key = `${e.from}-${e.to}`;
      if (seen.has(key)) return;
      seen.add(key);
      const to = fam.speciesById.get(e.to)!;
      rows.push(
        <div key={key} className="flex items-center gap-2 p-2">
          <EvoCard 
            species={fam.speciesById.get(e.from)!} 
            onClick={() => onPokemonClick(fam.speciesById.get(e.from)!.id)}
          />
          <svg width="80" height="8" aria-hidden>
            <line
              x1="4"
              y1="4"
              x2="76"
              y2="4"
              stroke="#9CA3AF"
              strokeWidth="2"
              strokeDasharray="72"
              strokeDashoffset={reduce ? 0 : 72}
            >
              {!reduce && (
                <animate attributeName="stroke-dashoffset" from="72" to="0" dur="0.35s" fill="freeze" />
              )}
            </line>
          </svg>
          <span
            role="img"
            aria-label={methodToText(e.method)}
            title={methodToText(e.method)}
            className="text-xs rounded-full border bg-gray-50 dark:bg-gray-800 px-2 py-1"
            onMouseEnter={() => {
              (window as any).__evoHover = [e.to, Date.now()];
            }}
            onMouseLeave={() => {
              (window as any).__evoHover = [null, Date.now()];
            }}
          >
            {methodIcon(e.method.kind)} <span className="ml-1 align-middle">{methodToText(e.method)}</span>
          </span>
          <div className={(typeof window !== 'undefined' && (window as any).__evoHover?.[0] === e.to) ? 'ring-2 ring-blue-500 rounded' : ''}>
            <EvoCard 
              species={to} 
              onClick={() => onPokemonClick(to.id)}
            />
          </div>
        </div>
      );
    });
  });
  return <div className="flex flex-col">{rows}</div>;
}

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
