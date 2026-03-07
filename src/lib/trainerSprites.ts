'use client'

import type { Champion } from '@/lib/gym_champions'

const BASE = '/assets/trainers'

// Explicit mapping from derived trainer key -> filename in public/assets/trainers/.
// Prefer "-masters" variants for higher-quality modern art when available.
const TRAINER_SPRITE_MAP: Record<string, string> = {
  // Kanto Gym Leaders
  'brock': 'brock-masters.png',
  'misty': 'misty-masters.png',
  'lt-surge': 'ltsurge.png',
  'ltsurge': 'ltsurge.png',
  'erika': 'erika.png',
  'koga': 'koga.png',
  'sabrina': 'sabrina-masters.png',
  'blaine': 'blaine.png',
  'giovanni': 'giovanni.png',
  // Kanto Elite Four
  'lorelei': 'lorelei-lgpe.png',
  'bruno': 'bruno.png',
  'agatha': 'agatha-lgpe.png',
  'lance': 'lance.png',
  'blue': 'blue.png',

  // Johto Gym Leaders
  'falkner': 'falkner-gen2.png',
  'bugsy': 'bugsy-gen2.png',
  'whitney': 'whitney-masters.png',
  'morty': 'morty-masters.png',
  'chuck': 'chuck-gen2.png',
  'jasmine': 'jasmine-masters.png',
  'pryce': 'pryce-gen2.png',
  'clair': 'clair-masters.png',
  // Johto Elite Four
  'will': 'will-gen2.png',
  'karen': 'karen-gen2.png',

  // Hoenn Gym Leaders
  'roxanne': 'roxanne-masters.png',
  'brawly': 'brawly-gen6.png',
  'wattson': 'wattson-gen3.png',
  'flannery': 'flannery-gen6.png',
  'norman': 'norman-gen6.png',
  'winona': 'winona-gen6.png',
  'tate-liza': 'tateandliza-gen6.png',
  'tateandliza': 'tateandliza-gen6.png',
  'wallace': 'wallace-masters.png',
  // Hoenn Elite Four
  'sidney': 'sidney-gen3.png',
  'phoebe': 'phoebe-masters.png',
  'glacia': 'glacia-gen3.png',
  'drake': 'drake-gen3.png',
  'steven': 'steven-masters.png',

  // Sinnoh Gym Leaders
  'roark': 'roark.png',
  'gardenia': 'gardenia-masters.png',
  'maylene': 'maylene.png',
  'wake': 'crasherwake.png',
  'crasherwake': 'crasherwake.png',
  'fantina': 'fantina.png',
  'byron': 'byron.png',
  'candice': 'candice-masters.png',
  'volkner': 'volkner-masters.png',
  // Sinnoh Elite Four
  'aaron': 'aaron.png',
  'bertha': 'bertha.png',
  'flint': 'flint.png',
  'lucian': 'lucian.png',
  'cynthia': 'cynthia-masters.png',

  // Unova Gym Leaders
  'cilan': 'cilan.png',
  'chili': 'chili.png',
  'cress': 'cress.png',
  'lenora': 'lenora.png',
  'burgh': 'burgh-masters.png',
  'elesa': 'elesa-masters.png',
  'clay': 'clay.png',
  'skyla': 'skyla-masters.png',
  'brycen': 'brycen.png',
  'drayden': 'drayden.png',
  // Unova Elite Four
  'shauntal': 'shauntal.png',
  'grimsley': 'grimsley-masters.png',
  'caitlin': 'caitlin-masters.png',
  'marshal': 'marshal.png',
  'alder': 'alder.png',
  'iris': 'iris-masters.png',

  // Kalos Gym Leaders
  'viola': 'viola-masters.png',
  'grant': 'grant.png',
  'korrina': 'korrina-masters.png',
  'ramos': 'ramos.png',
  'clemont': 'clemont.png',
  'valerie': 'valerie.png',
  'olympia': 'olympia.png',
  'wulfric': 'wulfric.png',
  // Kalos Elite Four
  'malva': 'malva.png',
  'siebold': 'siebold-masters.png',
  'wikstrom': 'wikstrom.png',
  'drasna': 'drasna.png',
  'diantha': 'diantha-masters.png',

  // Alola Kahunas / Elite Four
  'hala': 'hala.png',
  'olivia': 'olivia.png',
  'nanu': 'nanu.png',
  'hapu': 'hapu.png',
  'acerola': 'acerola-masters.png',
  'kahili': 'kahili.png',
  'kukui': 'kukui.png',
  'hau': 'hau-masters.png',
  'molayne': 'molayne.png',

  // Galar Gym Leaders
  'milo': 'milo.png',
  'nessa': 'nessa-masters.png',
  'kabu': 'kabu.png',
  'bea': 'bea-masters.png',
  'allister': 'allister-masters.png',
  'opal': 'opal.png',
  'gordie': 'gordie.png',
  'melony': 'melony.png',
  'piers': 'piers-masters.png',
  'raihan': 'raihan-masters.png',
  'leon': 'leon-masters.png',

  // Paldea Gym Leaders
  'katy': 'katy.png',
  'brassius': 'brassius.png',
  'iono': 'iono.png',
  'kofu': 'kofu.png',
  'larry': 'larry.png',
  'ryme': 'ryme.png',
  'tulip': 'tulip.png',
  'grusha': 'grusha.png',
  'geeta': 'geeta.png',
  'poppy': 'poppy.png',
  'hassel': 'hassel.png',
}

function normalizeNameToKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Strip region/title tokens from champion IDs to get the trainer name.
function deriveTrainerKeyFromId(id: string, fallbackName?: string): string {
  const tokens = id.toLowerCase().split('-').filter(Boolean)
  const noise = new Set([
    'kanto','johto','hoenn','sinnoh','unova','kalos','alola','galar','paldea',
    'elite','champion','champ','leader','kahuna','top','four','b2w2','usum'
  ])

  let start = 0
  let end = tokens.length - 1
  while (start <= end && noise.has(tokens[start])) start++
  while (end >= start && noise.has(tokens[end])) end--

  const pruned = tokens.slice(start, end + 1)
  if (pruned.length > 0) return pruned.join('-')

  if (fallbackName) {
    const nameOnly = fallbackName.replace(/\([^)]*\)/g, '').trim()
    return normalizeNameToKey(nameOnly)
  }
  return normalizeNameToKey(id)
}

function resolveFilename(key: string): string {
  const normalized = normalizeNameToKey(key)
  if (TRAINER_SPRITE_MAP[normalized]) return TRAINER_SPRITE_MAP[normalized]

  const hyphenless = normalized.replace(/-/g, '')
  if (TRAINER_SPRITE_MAP[hyphenless]) return TRAINER_SPRITE_MAP[hyphenless]

  // Fallback: try common filename patterns
  return `${hyphenless}.png`
}

export function getTrainerSpriteUrl(champion: Champion): string {
  const trainerKey = deriveTrainerKeyFromId(champion.id, champion.name)
  const filename = resolveFilename(trainerKey)
  return `${BASE}/${filename}`
}

export function getTrainerSpriteUrlByKey(trainerKey: string): string {
  const filename = resolveFilename(trainerKey)
  return `${BASE}/${filename}`
}

export function getTrainerSpriteUrls(champion: Champion): { primary: string; fallback?: string } {
  return { primary: getTrainerSpriteUrl(champion) }
}
