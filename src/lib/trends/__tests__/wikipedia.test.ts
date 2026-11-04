import { describe, expect, it } from 'vitest'
import {
  aggregatePageviews,
  candidateTitles,
  lastCompleteMonth,
  pickLocalizedName,
  selectArticleTitles,
  toSpeciesSlug,
  type PageviewItem,
  type WikiQueryResponse,
} from '../wikipedia'
import { normalizeRegion, speciesDisplayName } from '../data'

const EN = [' (Pokémon)']

describe('selectArticleTitles', () => {
  it('uses the bare article when the qualified title is missing', () => {
    const response: WikiQueryResponse = {
      query: { pages: [{ title: 'Pikachu (Pokémon)', missing: true }, { title: 'Pikachu' }] },
    }
    expect(selectArticleTitles('Pikachu', EN, response)).toEqual(['Pikachu'])
  })

  it('counts the redirect and the article when the qualified title redirects to the bare article', () => {
    const response: WikiQueryResponse = {
      query: {
        redirects: [{ from: 'Eevee (Pokémon)', to: 'Eevee' }],
        pages: [{ title: 'Eevee' }],
      },
    }
    expect(selectArticleTitles('Eevee', EN, response)).toEqual(['Eevee (Pokémon)', 'Eevee'])
  })

  it('skips a disambiguation bare title and keeps the qualified redirect without the list target', () => {
    const response: WikiQueryResponse = {
      query: {
        redirects: [{ from: 'Ditto (Pokémon)', to: 'List of generation I Pokémon' }],
        pages: [
          { title: 'List of generation I Pokémon' },
          { title: 'Ditto', pageprops: { disambiguation: '' } },
        ],
      },
    }
    expect(selectArticleTitles('Ditto', EN, response)).toEqual(['Ditto (Pokémon)'])
  })

  it('ignores an unrelated bare article when a qualified title exists elsewhere', () => {
    const response: WikiQueryResponse = {
      query: {
        redirects: [{ from: 'Golem (Pokémon)', to: 'List of generation I Pokémon' }],
        pages: [{ title: 'List of generation I Pokémon' }, { title: 'Golem' }],
      },
    }
    expect(selectArticleTitles('Golem', EN, response)).toEqual(['Golem (Pokémon)'])
  })

  it('counts a bare redirect into a list article when no qualified title exists', () => {
    const response: WikiQueryResponse = {
      query: {
        redirects: [{ from: 'Snom', to: 'List of generation VIII Pokémon' }],
        pages: [{ title: 'Snom (Pokémon)', missing: true }, { title: 'List of generation VIII Pokémon' }],
      },
    }
    expect(selectArticleTitles('Snom', EN, response)).toEqual(['Snom'])
  })

  it('follows normalisation and variant conversion', () => {
    const response: WikiQueryResponse = {
      query: {
        converted: [{ from: '皮卡丘', to: '皮卡丘' }],
        normalized: [{ from: 'pikachu', to: 'Pikachu' }],
        pages: [{ title: 'Pikachu' }, { title: 'pikachu (Pokémon)', missing: true }],
      },
    }
    expect(selectArticleTitles('pikachu', [' (Pokémon)'], response)).toEqual(['Pikachu'])
  })

  it('returns nothing when every candidate is missing', () => {
    const response: WikiQueryResponse = {
      query: { pages: [{ title: 'Snom (Pokémon)', missing: true }, { title: 'Snom', missing: true }] },
    }
    expect(selectArticleTitles('Snom', EN, response)).toEqual([])
  })
})

describe('aggregatePageviews', () => {
  const now = new Date(Date.UTC(2026, 2, 15)) // 2026-03-15 → last complete month 2026-02

  function monthly(year: number, months: number[], views: number): PageviewItem[] {
    return months.map((m) => ({ timestamp: `${year}${String(m).padStart(2, '0')}0100`, views }))
  }

  it('computes average daily views per region and per year, with Global as the sum', () => {
    const result = aggregatePageviews(
      [
        { lang: 'en', region: 'English', items: monthly(2025, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3650 / 12) },
        { lang: 'ja', region: 'Asia', items: monthly(2025, [1], 310) },
        { lang: 'en', region: 'English', items: monthly(2026, [1, 2], 590) },
      ],
      { now, startYear: 2025 }
    )

    expect(result.coverage).toEqual({ start: '2025-01', end: '2026-02' })
    const y2025 = result.yearly.find((p) => p.year === 2025)!
    expect(y2025.partial).toBe(false)
    expect(y2025.values.English).toBe(10)
    expect(y2025.values.Asia).toBe(Math.round((310 / 365) * 10) / 10)
    expect(y2025.values.Global).toBe(Math.round(((3650 + 310) / 365) * 10) / 10)
    expect(y2025.values.Europe).toBe(0)

    const y2026 = result.yearly.find((p) => p.year === 2026)!
    expect(y2026.partial).toBe(true)
    expect(y2026.values.English).toBe(Math.round((1180 / 59) * 10) / 10)

    const jan = result.monthly.find((p) => p.month === '2025-01')!
    expect(jan.values.Asia).toBe(10)
    expect(result.monthly.filter((p) => p.month.startsWith('2026-'))).toHaveLength(2)
    expect(result.totalsByLang.en).toBeCloseTo(3650 + 1180)
  })

  it('ignores data for the current (incomplete) month and before the start year', () => {
    const result = aggregatePageviews(
      [{ lang: 'en', region: 'English', items: [...monthly(2026, [3], 999), ...monthly(2015, [12], 999), ...monthly(2026, [1], 31)] }],
      { now, startYear: 2016 }
    )
    // February not yet published → coverage falls back one month rather than counting it as zero.
    expect(result.coverage?.end).toBe('2026-01')
    expect(result.monthly.find((p) => p.month === '2026-03')).toBeUndefined()
    expect(result.monthly.find((p) => p.month === '2026-02')).toBeUndefined()
    expect(result.monthly.find((p) => p.month === '2026-01')!.values.English).toBe(1)
    expect(result.yearly[0].year).toBe(2016)
  })

  it('returns an empty result when no views exist', () => {
    const result = aggregatePageviews([{ lang: 'en', region: 'English', items: [] }], { now })
    expect(result.coverage).toBeNull()
    expect(result.yearly).toEqual([])
  })
})

describe('helpers', () => {
  it('lastCompleteMonth handles January rollover', () => {
    expect(lastCompleteMonth(new Date(Date.UTC(2026, 0, 10)))).toBe('2025-12')
  })

  it('candidateTitles puts qualified titles first and dedupes', () => {
    expect(candidateTitles(' Pikachu ', [' (Pokémon)'])).toEqual(['Pikachu (Pokémon)', 'Pikachu'])
    expect(candidateTitles('', [' (Pokémon)'])).toEqual([])
  })

  it('pickLocalizedName respects language priority', () => {
    const names = [
      { name: 'ピカチュウ', language: { name: 'ja-Hrkt' } },
      { name: 'Pikachu', language: { name: 'en' } },
    ]
    expect(pickLocalizedName(names, ['ja-Hrkt', 'ja'])).toBe('ピカチュウ')
    expect(pickLocalizedName(names, ['ko'])).toBeNull()
  })

  it.each([
    ['Mr. Mime', 'mr-mime'],
    ['Nidoran♀', 'nidoran-f'],
    ["Farfetch'd", 'farfetchd'],
    ['Type: Null', 'type-null'],
    ['Flabébé', 'flabebe'],
    ['Ho-Oh', 'ho-oh'],
    ['Tapu Koko', 'tapu-koko'],
    ['Pikachu', 'pikachu'],
  ])('toSpeciesSlug(%s) = %s and round-trips through speciesDisplayName', (name, slug) => {
    expect(toSpeciesSlug(name)).toBe(slug)
    expect(toSpeciesSlug(speciesDisplayName(slug))).toBe(slug)
  })

  it('normalizeRegion maps retired region keys', () => {
    expect(normalizeRegion('Global')).toBe('Global')
    expect(normalizeRegion('US')).toBe('English')
    expect(normalizeRegion('EU')).toBe('Europe')
    expect(normalizeRegion('Mars')).toBeUndefined()
  })
})
