import type {
  Edge,
  EvoGraph,
  Family,
  NormalizedEvoGraph,
  NormalizedFamily,
  Species,
} from './types';

// Basic DAG check and normalization. Ensures maps are built and cycles are avoided.
export function normalizeEvoGraph(input: EvoGraph): NormalizedEvoGraph {
  const families: NormalizedFamily[] = input.families.map((fam) => normalizeFamily(fam));
  return { families };
}

function normalizeFamily(fam: Family): NormalizedFamily {
  // Ensure each species has a sprite URL; default to PokeAPI static sprite
  const withSprites: Species[] = fam.species.map((s) => {
    if (s.sprite && s.sprite.length > 0) return s;
    return {
      ...s,
      sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${s.id}.png`
    };
  });

  const speciesById = new Map<number, Species>();
  withSprites.forEach((s) => speciesById.set(s.id, s));

  const incoming = new Map<number, Edge[]>();
  const outgoing = new Map<number, Edge[]>();

  // Filter out edges that point to unknown nodes or create immediate self loops
  const edges = fam.edges.filter((e) => e.from !== e.to && speciesById.has(e.from) && speciesById.has(e.to));

  for (const e of edges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    outgoing.get(e.from)!.push(e);
    incoming.get(e.to)!.push(e);
  }

  // Find bases: nodes with no incoming
  const ids = withSprites.map((s) => s.id);
  const bases = ids.filter((id) => !incoming.has(id));

  // Simple cycle detection via DFS. If cycles detected, drop offending edges.
  // We perform a DFS from each base and collect reachable edges; any edge not reachable from any base
  // and that forms a back edge will be ignored in the normalized maps.
  const visited = new Set<number>();
  const temp = new Set<number>();
  const safeEdges = new Set<Edge>();

  const dfs = (node: number) => {
    if (temp.has(node)) return; // avoid infinite loops
    temp.add(node);
    const outs = outgoing.get(node) || [];
    for (const e of outs) {
      if (temp.has(e.to)) {
        // back edge detected — skip adding
        continue;
      }
      safeEdges.add(e);
      if (!visited.has(e.to)) dfs(e.to);
    }
    temp.delete(node);
    visited.add(node);
  };

  if (bases.length === 0 && ids.length > 0) {
    // If no base is found (weird data), pick the lowest id as a pseudo-base to traverse
    dfs(Math.min(...ids));
  } else {
    for (const b of bases) dfs(b);
  }

  // Rebuild incoming/outgoing using only safeEdges
  const nIncoming = new Map<number, Edge[]>();
  const nOutgoing = new Map<number, Edge[]>();
  for (const e of safeEdges) {
    if (!nOutgoing.has(e.from)) nOutgoing.set(e.from, []);
    if (!nIncoming.has(e.to)) nIncoming.set(e.to, []);
    nOutgoing.get(e.from)!.push(e);
    nIncoming.get(e.to)!.push(e);
  }

  const isBranched = Array.from(nOutgoing.values()).some((arr) => arr.length > 1);

  return {
    ...fam,
    species: withSprites,
    speciesById,
    incoming: nIncoming,
    outgoing: nOutgoing,
    bases,
    isBranched,
  };
}

export function methodToText(method: Edge['method']): string {
  switch (method.kind) {
    case 'level':
      return `Level ${method.level}`;
    case 'stone':
      return `${method.item}`;
    case 'trade':
      return method.item ? `Trade + ${method.item}` : 'Trade';
    case 'friendship':
      return method.time ? `High Friendship @ ${method.time}` : 'High Friendship';
    case 'location':
      return method.place;
    case 'move':
      return `Learn ${method.move}`;
    case 'affection':
      return method.move ? `High Affection + ${method.move}` : 'High Affection';
    case 'time':
      return method.time === 'day' ? 'Daytime' : 'Nighttime';
    case 'weather':
      return method.weather;
    case 'heldItem':
      return `Level up while holding ${method.item}`;
    case 'version':
      return method.version;
    case 'special':
      return method.hint;
    default:
      return 'Special';
  }
}

