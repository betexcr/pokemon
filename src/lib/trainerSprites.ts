'use client'

import type { Champion } from '@/lib/gym_champions'

const TRAINER_SPRITES_BASE_PATH = '/trainer-sprites'

// Explicit filename mappings for special-cased names or known PS aliases.
// Keep this list minimal to avoid forcing non-existent files; prefer candidates below.
const explicitFilenameMap: Record<string, string> = {
  // Common Kanto leaders
  brock: 'brock.png',
  misty: 'misty.png',
  erika: 'erika.png',
  koga: 'koga.png',
  sabrina: 'sabrina.png',
  blaine: 'blaine.png',
  giovanni: 'giovanni.png',
  bruno: 'bruno.png',
  lance: 'lance.png',
  blue: 'blue.png',

  // Hoenn / others
  roxanne: 'roxanne.png',
  brawly: 'brawly.png',
  wattson: 'wattson.png',
  flannery: 'flannery.png',
  norman: 'norman.png',
  winona: 'winona.png',
  wallace: 'wallace.png',
  sidney: 'sidney.png',
  phoebe: 'phoebe.png',
  glacia: 'glacia.png',
  drake: 'drake.png',
  steven: 'steven.png',

  // Showdown alias specials
  // Prefer newest via candidates; keep alias only when name differs entirely
  // e.g., Lt. Surge -> ltsurge handled by hyphenless; do not force a gen
  wake: 'crasherwake.png', // PS uses crasherwake
  tateliza: 'tateandliza-gen6.png', // PS uses tateandliza, prefer newest gen6
  // Also add fallback mapping for gen3 folder
  'tateandliza': 'tateandliza-gen3.png', // For gen3 fallback
}

function normalizeNameToKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Some IDs include regions or titles (e.g., 'lt-surge-kanto', 'kalos-elite-malva').
// Strip known region/title tokens from both ends, preserving the trainer name in the middle.
function deriveTrainerKeyFromId(id: string, fallbackName?: string): string {
  const tokens = id.toLowerCase().split('-').filter(Boolean)
  const suffixBlacklist = new Set([
    'kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea',
    'elite','champion','champ','leader','kahuna','top','four','b2w2','usum'
  ])

  let start = 0
  let end = tokens.length - 1

  // Drop leading region words like 'kalos'
  while (start <= end && suffixBlacklist.has(tokens[start])) start++
  // Drop trailing region/title words
  while (end >= start && suffixBlacklist.has(tokens[end])) end--

  const pruned = tokens.slice(start, end + 1)
  if (pruned.length > 0) return pruned.join('-')

  // Fallback to name without parentheses
  if (fallbackName) {
    const nameOnly = fallbackName.replace(/\([^)]*\)/g, '').trim()
    return normalizeNameToKey(nameOnly)
  }
  return normalizeNameToKey(id)
}

export function getTrainerSpriteUrlByKey(trainerKey: string, opts?: { gen?: number; region?: string }): string {
  const key = normalizeNameToKey(trainerKey)

  // 1) explicit map
  if (explicitFilenameMap[key]) {
    return `${TRAINER_SPRITES_BASE_PATH}/${explicitFilenameMap[key]}`
  }

  // 2) common variants to try
  const gen = opts?.gen
  const region = opts?.region

  const hyphenless = key.replace(/-/g, '')

  // Prefer newest available variants first
  const baseVariants = [
    // Prefer "right-most" on Showdown listings: often plain, then LGPE/newest
    'lgpe','gen9','gen8','gen7','gen6xy','gen6','gen5bw2','gen5','gen4dp','gen4','gen3rs','gen3jp','gen3','gen2jp','gen2','gen1rb','gen1'
  ]

  const withForms = (k: string) => [
    // Try plain first (often the newest/right-most), then LGPE/newer gens
    `${k}.png`,
    ...baseVariants.map(v => `${k}-${v}.png`),
  ]

  const regionVariants = [
    region === 'kanto' ? `${key}-kanto.png` : '',
    region === 'johto' ? `${key}-johto.png` : '',
    region === 'hoenn' ? `${key}-hoenn.png` : '',
    `${key}-sinnoh.png`,
    `${key}-unova.png`,
    `${key}-kalos.png`,
    `${key}-alola.png`,
    `${key}-galar.png`,
    `${key}-paldea.png`,
  ]

  const candidates = [
    // Try hyphenless first (e.g., ltsurge), then hyphenated
    ...withForms(hyphenless),
    ...withForms(key),
    ...regionVariants,
  ].filter(Boolean)

  // Always prefer PS trainer-sprites path first (newest variants)
  const primary = `${TRAINER_SPRITES_BASE_PATH}/${candidates[0]}`

  // For gens 1-3, provide a fallback to local gen folders
  // The component's onError handler will use this fallback
  const generation = opts?.gen
  if (generation && generation >= 1 && generation <= 3) {
    const genFolder = `/gen${generation}`
    // Handle special cases where the filename differs from the key
    const specialFallbacks: Record<string, string> = {
      'tateliza': 'tateandliza',
    }
    const fallbackKey = specialFallbacks[hyphenless] || hyphenless
    const genCandidates = [
      `${genFolder}/${fallbackKey}.png`,
      `${genFolder}/${key}.png`,
    ]
    // Store the fallback path in a data attribute or return both paths
    // For now, return the primary PS path and let component handle fallback
  }

  return primary
}

export function getTrainerSpriteUrl(champion: Champion): string {
  // Prefer derived key from id (handles regions/titles) then name
  const idPrefix = deriveTrainerKeyFromId(champion.id, champion.name)
  const genName = (champion.generation || '').toLowerCase()
  const gen = genName.includes('iii') || genName.includes('3') ? 3
    : genName.includes('ii') || genName.includes('2') ? 2
    : genName.includes('i') || genName.includes('1') ? 1
    : undefined
  const region = gen === 1 ? 'kanto' : gen === 2 ? 'johto' : gen === 3 ? 'hoenn' : undefined

  const byId = getTrainerSpriteUrlByKey(idPrefix, { gen, region })
  if (byId) return byId
  return getTrainerSpriteUrlByKey(champion.name, { gen, region })
}

export function getTrainerSpriteUrls(champion: Champion): { primary: string; fallback?: string } {
  // Prefer derived key from id (handles regions/titles) then name
  const idPrefix = deriveTrainerKeyFromId(champion.id, champion.name)
  const genName = (champion.generation || '').toLowerCase()
  const gen = genName.includes('iii') || genName.includes('3') ? 3
    : genName.includes('ii') || genName.includes('2') ? 2
    : genName.includes('i') || genName.includes('1') ? 1
    : undefined
  const region = gen === 1 ? 'kanto' : gen === 2 ? 'johto' : gen === 3 ? 'hoenn' : undefined

  const primary = getTrainerSpriteUrl(champion)
  
  // Generate fallback path for gens 1-3
  let fallback: string | undefined
  if (gen && gen >= 1 && gen <= 3) {
    const key = normalizeNameToKey(idPrefix || champion.name)
    const hyphenless = key.replace(/-/g, '')
    
    // Handle special cases where the filename differs from the key
    const specialFallbacks: Record<string, string> = {
      'tateliza': 'tateandliza',
    }
    const fallbackKey = specialFallbacks[hyphenless] || hyphenless
    // Files are in main directory with gen suffix, not in gen folders
    fallback = `${TRAINER_SPRITES_BASE_PATH}/${fallbackKey}-gen${gen}.png`
  }

  return { primary, fallback }
}


