import { useEffect, useMemo, useState } from "react";
import { contestFunFacts, type ContestFact } from "@/data/contests/funFacts";

type Options = {
  intervalMs?: number;
  filterTags?: ContestFact["tags"];
  bucketIds?: string[]; // if provided, rotate within specific IDs
};

export function useRotatingFact(opts: Options = {}) {
  const { intervalMs = 12000, filterTags, bucketIds } = opts;

  const pool = useMemo(() => {
    let list: ContestFact[] = contestFunFacts;
    if (filterTags && filterTags.length) {
      list = list.filter(f => f.tags.some(t => filterTags.includes(t)));
    }
    if (bucketIds && bucketIds.length) {
      const set = new Set(bucketIds);
      list = list.filter(f => set.has(f.id));
    }
    return list.length ? list : contestFunFacts;
  }, [filterTags, bucketIds]);

  const [index, setIndex] = useState(0);
  const [fact, setFact] = useState<ContestFact>(pool[0]);

  useEffect(() => {
    setIndex(0);
    setFact(pool[0]);
  }, [pool]);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(prev => {
        const next = (prev + 1) % pool.length;
        setFact(pool[next]);
        return next;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, pool]);

  return { fact, index, total: pool.length };
}
