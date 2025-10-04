'use client'

import type { Champion } from '@/lib/gym_champions'

const TRAINER_SPRITES_BASE_PATH = '/gen1' // Default to gen1, will be overridden per generation

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
  const gen = opts?.gen || 1 // Default to gen1
  const genPath = `/gen${gen}`

  // Handle special filename mappings
  const specialFilenameMap: Record<string, Record<number, string>> = {
    'lt-surge': { 1: 'lt-surge.png', 2: 'lt-surge.png' },
    'tate-liza': { 3: 'tate-liza.png' },
    'tateandliza': { 3: 'tate-liza.png' },
  }

  // Check for special mappings first
  if (specialFilenameMap[key] && specialFilenameMap[key][gen]) {
    return `${genPath}/${specialFilenameMap[key][gen]}`
  }

  // Check explicit map
  if (explicitFilenameMap[key]) {
    return `${genPath}/${explicitFilenameMap[key]}`
  }

  // Try different variations of the key
  const hyphenless = key.replace(/-/g, '')
  
  // Common candidates to try
  const candidates = [
    `${key}.png`,
    `${hyphenless}.png`,
  ]

  // Return the first candidate path
  return `${genPath}/${candidates[0]}`
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
  const primary = getTrainerSpriteUrl(champion)
  
  // Generate fallback path for different generations
  const idPrefix = deriveTrainerKeyFromId(champion.id, champion.name)
  const genName = (champion.generation || '').toLowerCase()
  const gen = genName.includes('iii') || genName.includes('3') ? 3
    : genName.includes('ii') || genName.includes('2') ? 2
    : genName.includes('i') || genName.includes('1') ? 1
    : 1

  let fallback: string | undefined
  
  // Try fallback to gen1 if not already gen1
  if (gen !== 1) {
    const key = normalizeNameToKey(idPrefix || champion.name)
    const hyphenless = key.replace(/-/g, '')
    
    // Handle special cases where the filename differs from the key
    const specialFallbacks: Record<string, string> = {
      'tateliza': 'tate-liza',
      'tateandliza': 'tate-liza',
    }
    const fallbackKey = specialFallbacks[hyphenless] || hyphenless
    fallback = `/gen1/${fallbackKey}.png`
  }

  return { primary, fallback }
}


