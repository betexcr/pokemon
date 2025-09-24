import { top50Pokemon } from './top50Pokemon'

function padDex(num: number): string {
  return String(num).padStart(4, '0')
}

// Prefer portraits for compact, square loading indicators
export const PMD_TOP50_PORTRAITS: string[] = top50Pokemon.map(p => `/assets/pmd/${padDex(p.nationalNumber)}/portrait/Normal.png`)

// Common idle sprite sheet, useful if needed elsewhere
export const PMD_TOP50_SPRITES_IDLE: string[] = top50Pokemon.map(p => `/assets/pmd/${padDex(p.nationalNumber)}/sprite/Idle-Anim.png`)

// Common walk sprite sheet (usually animated). Prefer this for loaders.
export const PMD_TOP50_SPRITES_WALK: string[] = top50Pokemon.map(p => `/assets/pmd/${padDex(p.nationalNumber)}/sprite/Walk-Anim.png`)

// Dex directory strings for runtime construction
export const PMD_TOP50_DEXES: string[] = top50Pokemon.map(p => padDex(p.nationalNumber))



