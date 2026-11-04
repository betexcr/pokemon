import { SPECIES_NAMES_BY_DEX } from './speciesNames.generated';

/**
 * Showdown-style id: lowercase ASCII letters/digits only.
 * "Mr. Mime" → "mrmime", "Flabébé" → "flabebe", "Nidoran♀" → "nidoranf", "Type: Null" → "typenull".
 */
export function toSpeciesId(name: string): string {
  return name
    .replace(/♀/g, 'f')
    .replace(/♂/g, 'm')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const DEX_BY_ID: ReadonlyMap<string, number> = new Map(
  SPECIES_NAMES_BY_DEX.map((name, index) => [toSpeciesId(name), index + 1])
);

export interface ResolvedSpecies {
  /** National Pokédex number of the base species, or null if unknown. */
  dexId: number | null;
  /** Base species name as written in the source (e.g. "Landorus"). */
  baseName: string;
  /** Forme suffix (e.g. "Therian", "Rapid-Strike"), or null for the base form. */
  forme: string | null;
  /** Pokémon Showdown sprite id (e.g. "landorus-therian", "urshifu-rapidstrike"). */
  spriteId: string;
}

/**
 * Resolve a Smogon/Showdown species name ("Landorus-Therian", "Ting-Lu", "Samurott-Hisui",
 * "Urshifu-Rapid-Strike", "Nidoran-F") to its dex number and forme. Hyphenated base names
 * (Ting-Lu, Ho-Oh, Kommo-o, Porygon-Z) win because the longest matching prefix is tried first.
 */
export function resolveSpecies(name: string): ResolvedSpecies {
  const parts = name.trim().split('-');
  for (let i = parts.length; i >= 1; i -= 1) {
    const base = parts.slice(0, i).join('-');
    const dexId = DEX_BY_ID.get(toSpeciesId(base));
    if (dexId) {
      const forme = i < parts.length ? parts.slice(i).join('-') : null;
      return {
        dexId,
        baseName: base,
        forme,
        spriteId: toSpeciesId(base) + (forme ? `-${toSpeciesId(forme)}` : ''),
      };
    }
  }
  return { dexId: null, baseName: name, forme: null, spriteId: toSpeciesId(name) };
}

/** National dex number for a species name (base species for formes), or 0 when unknown. */
export function dexIdForSpecies(name: string): number {
  return resolveSpecies(name).dexId ?? 0;
}

const POKEAPI_SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const SHOWDOWN_SPRITES = 'https://play.pokemonshowdown.com/sprites';

/**
 * Image candidates for a usage row, best first. Base forms use official artwork by dex number;
 * alternate formes (regional, Therian, Rapid Strike, …) use Showdown's per-forme sprites so the
 * picture matches the forme, falling back to the base species artwork.
 */
export function usageSpriteUrls(name: string, size: 'large' | 'medium' = 'large'): string[] {
  const { dexId, forme, spriteId } = resolveSpecies(name);
  const showdown = [`${SHOWDOWN_SPRITES}/dex/${spriteId}.png`, `${SHOWDOWN_SPRITES}/gen5/${spriteId}.png`];
  const artwork = dexId
    ? [
        size === 'large'
          ? `${POKEAPI_SPRITES}/other/official-artwork/${dexId}.png`
          : `${POKEAPI_SPRITES}/other/home/${dexId}.png`,
        `${POKEAPI_SPRITES}/${dexId}.png`,
      ]
    : [];
  const ordered = forme ? [...showdown, ...artwork] : [...artwork, ...showdown];
  return [...ordered, '/placeholder-pokemon.png'];
}
