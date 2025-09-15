'use client'

import type { Champion } from '@/lib/gym_champions'

const TRAINER_SPRITES_BASE_PATH = '/trainer-sprites'

// Explicit filename mappings for common champions/leaders we support first.
// Extend this map over time when we need additional trainers.
const explicitFilenameMap: Record<string, string> = {
  // Gen 1
  brock: 'brock.png',
  misty: 'misty.png',
  'lt-surge': 'lt-surge.png',
  erika: 'erika.png',
  koga: 'koga.png',
  sabrina: 'sabrina.png',
  blaine: 'blaine.png',
  giovanni: 'giovanni.png',
  lorelei: 'lorelei.png',
  bruno: 'bruno.png',
  agatha: 'agatha.png',
  lance: 'lance.png',
  blue: 'blue.png',

  // Gen 2
  falkner: 'falkner.png',
  bugsy: 'bugsy.png',
  whitney: 'whitney.png',
  morty: 'morty.png',
  chuck: 'chuck.png',
  jasmine: 'jasmine.png',
  pryce: 'pryce.png',
  clair: 'clair.png',
  will: 'will.png',
  karen: 'karen.png',

  // Gen 3
  roxanne: 'roxanne.png',
  brawly: 'brawly.png',
  wattson: 'wattson.png',
  flannery: 'flannery.png',
  norman: 'norman.png',
  winona: 'winona.png',
  'tate-liza': 'tate-liza-hoenn.png', // PS uses a hoenn suffix for some sprites
  wallace: 'wallace.png',
  sidney: 'sidney.png',
  phoebe: 'phoebe.png',
  glacia: 'glacia.png',
  drake: 'drake.png',
  steven: 'steven.png',
}

function normalizeNameToKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

  const candidates = [
    `${key}.png`,
    gen === 1 ? `${key}-gen1.png` : '',
    gen === 2 ? `${key}-gen2.png` : '',
    gen === 3 ? `${key}-gen3.png` : '',
    `${key}-gen4.png`,
    `${key}-gen5.png`,
    `${key}-gen6.png`,
    `${key}-gen7.png`,
    `${key}-gen8.png`,
    `${key}-gen9.png`,
    region === 'kanto' ? `${key}-kanto.png` : '',
    region === 'johto' ? `${key}-johto.png` : '',
    region === 'hoenn' ? `${key}-hoenn.png` : '',
    `${key}-sinnoh.png`,
    `${key}-unova.png`,
    `${key}-kalos.png`,
    `${key}-alola.png`,
    `${key}-galar.png`,
    `${key}-paldea.png`,
  ].filter(Boolean)

  // We cannot check file existence on the client; we optimistically pick the first.
  // If it 404s, our <img onError> handler should fall back.
  return `${TRAINER_SPRITES_BASE_PATH}/${candidates[0]}`
}

export function getTrainerSpriteUrl(champion: Champion): string {
  // Prefer id prefix (e.g., 'brock-kanto' -> 'brock') then name
  const idPrefix = champion.id.split('-')[0]
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


