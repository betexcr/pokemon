export type NatureStat = 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'

export interface Nature {
  value: NatureName
  label: string
  increasedStat: NatureStat | null
  decreasedStat: NatureStat | null
}

export type NatureName =
  | 'hardy'
  | 'lonely'
  | 'brave'
  | 'adamant'
  | 'naughty'
  | 'bold'
  | 'docile'
  | 'relaxed'
  | 'impish'
  | 'lax'
  | 'timid'
  | 'hasty'
  | 'serious'
  | 'jolly'
  | 'naive'
  | 'modest'
  | 'mild'
  | 'quiet'
  | 'bashful'
  | 'rash'
  | 'calm'
  | 'gentle'
  | 'sassy'
  | 'careful'
  | 'quirky'

export const NATURES: Nature[] = [
  { value: 'hardy', label: 'Hardy', increasedStat: null, decreasedStat: null },
  { value: 'lonely', label: 'Lonely', increasedStat: 'attack', decreasedStat: 'defense' },
  { value: 'brave', label: 'Brave', increasedStat: 'attack', decreasedStat: 'speed' },
  { value: 'adamant', label: 'Adamant', increasedStat: 'attack', decreasedStat: 'special-attack' },
  { value: 'naughty', label: 'Naughty', increasedStat: 'attack', decreasedStat: 'special-defense' },
  { value: 'bold', label: 'Bold', increasedStat: 'defense', decreasedStat: 'attack' },
  { value: 'docile', label: 'Docile', increasedStat: null, decreasedStat: null },
  { value: 'relaxed', label: 'Relaxed', increasedStat: 'defense', decreasedStat: 'speed' },
  { value: 'impish', label: 'Impish', increasedStat: 'defense', decreasedStat: 'special-attack' },
  { value: 'lax', label: 'Lax', increasedStat: 'defense', decreasedStat: 'special-defense' },
  { value: 'timid', label: 'Timid', increasedStat: 'speed', decreasedStat: 'attack' },
  { value: 'hasty', label: 'Hasty', increasedStat: 'speed', decreasedStat: 'defense' },
  { value: 'serious', label: 'Serious', increasedStat: null, decreasedStat: null },
  { value: 'jolly', label: 'Jolly', increasedStat: 'speed', decreasedStat: 'special-attack' },
  { value: 'naive', label: 'Naive', increasedStat: 'speed', decreasedStat: 'special-defense' },
  { value: 'modest', label: 'Modest', increasedStat: 'special-attack', decreasedStat: 'attack' },
  { value: 'mild', label: 'Mild', increasedStat: 'special-attack', decreasedStat: 'defense' },
  { value: 'quiet', label: 'Quiet', increasedStat: 'special-attack', decreasedStat: 'speed' },
  { value: 'bashful', label: 'Bashful', increasedStat: null, decreasedStat: null },
  { value: 'rash', label: 'Rash', increasedStat: 'special-attack', decreasedStat: 'special-defense' },
  { value: 'calm', label: 'Calm', increasedStat: 'special-defense', decreasedStat: 'attack' },
  { value: 'gentle', label: 'Gentle', increasedStat: 'special-defense', decreasedStat: 'defense' },
  { value: 'sassy', label: 'Sassy', increasedStat: 'special-defense', decreasedStat: 'speed' },
  { value: 'careful', label: 'Careful', increasedStat: 'special-defense', decreasedStat: 'special-attack' },
  { value: 'quirky', label: 'Quirky', increasedStat: null, decreasedStat: null }
]

export const DEFAULT_NATURE: NatureName = 'hardy'

export function getNature(value: NatureName): Nature {
  const fallback = NATURES[0]
  return NATURES.find(nature => nature.value === value) || fallback
}
