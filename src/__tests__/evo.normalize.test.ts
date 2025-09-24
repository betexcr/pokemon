import { describe, it, expect } from 'vitest';
import sample from '@/data/evolutions.sample.json';
import { normalizeEvoGraph } from '@/lib/evo/normalize';
import type { EvoGraph } from '@/lib/evo/types';

describe('normalizeEvoGraph', () => {
  const normalized = normalizeEvoGraph(sample as unknown as EvoGraph);

  it('creates families with bases and maps', () => {
    expect(normalized.families.length).toBeGreaterThan(0);
    for (const fam of normalized.families) {
      expect(fam.speciesById.size).toBe(fam.species.length);
      expect(Array.isArray(fam.bases)).toBe(true);
    }
  });

  it('handles split evolutions (Eevee, Applin)', () => {
    const eevee = normalized.families.find((f) => f.familyId === 'eevee')!;
    expect(eevee.isBranched).toBe(true);
    const applin = normalized.families.find((f) => f.familyId === 'applin')!;
    expect(applin.isBranched).toBe(true);
  });

  it('remains acyclic by ignoring back edges', () => {
    // Inject an artificial cycle and expect it to be eliminated by safe edge rebuild
    const withCycle: EvoGraph = JSON.parse(JSON.stringify(sample));
    const fam = withCycle.families.find((f) => f.familyId === 'scyther')!;
    fam.edges.push({ from: 212, to: 123, method: { kind: 'special', hint: 'back edge' } } as any);
    const n2 = normalizeEvoGraph(withCycle);
    const sc = n2.families.find((f) => f.familyId === 'scyther')!;
    // Even with attempted cycle, outgoing from 212 should be empty or not include back edge
    const outs = sc.outgoing.get(212) || [];
    expect(outs.find((e) => e.to === 123)).toBeFalsy();
  });
});

