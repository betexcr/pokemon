import { afterEach, describe, expect, it, vi } from 'vitest'
import { PopularityNotFoundError, getPokemonPopularity, resetPopularityCacheForTests } from '../popularityService'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const species = {
  id: 25,
  name: 'pikachu',
  generation: { name: 'generation-i' },
  names: [
    { name: 'ピカチュウ', language: { name: 'ja-hrkt' } },
    { name: 'Pikachu', language: { name: 'en' } },
    { name: 'Pikachu', language: { name: 'de' } },
  ],
}

describe('getPokemonPopularity', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
    resetPopularityCacheForTests()
  })

  it('resolves titles per edition and aggregates Wikimedia monthly pageviews', async () => {
    const calls: string[] = []
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      calls.push(url)
      expect((init?.headers as Record<string, string>)['User-Agent']).toMatch(/PokeDexTrends/)

      if (url === 'https://pokeapi.co/api/v2/pokemon-species/pikachu') return json(species)
      if (url.startsWith('https://en.wikipedia.org/w/api.php')) {
        expect(new URL(url).searchParams.get('titles')).toBe('Pikachu (Pokémon)|Pikachu')
        return json({ query: { pages: [{ title: 'Pikachu (Pokémon)', missing: true }, { title: 'Pikachu' }] } })
      }
      if (url.startsWith('https://ja.wikipedia.org/w/api.php')) {
        return json({ query: { pages: [{ title: 'ピカチュウ (ポケモン)', missing: true }, { title: 'ピカチュウ' }] } })
      }
      if (url.startsWith('https://de.wikipedia.org/w/api.php')) {
        return json({ error: 'boom' }, 500)
      }
      if (url.includes('/en.wikipedia/all-access/user/Pikachu/monthly/2016010100/')) {
        return json({ items: [{ timestamp: '2025010100', views: 3100 }] })
      }
      if (url.includes(`/ja.wikipedia/all-access/user/${encodeURIComponent('ピカチュウ')}/monthly/`)) {
        return json({ items: [{ timestamp: '2025010100', views: 310 }] })
      }
      throw new Error(`Unexpected fetch ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const now = new Date(Date.UTC(2025, 2, 10))
    const result = await getPokemonPopularity('pikachu', now)

    expect(result.pokemon).toEqual({ id: 25, slug: 'pikachu', name: 'Pikachu', generation: 1 })
    expect(result.complete).toBe(false) // de lookup failed
    expect(calls.some((url) => url.endsWith('/monthly/2016010100/2025022800'))).toBe(true)

    const en = result.editions.find((e) => e.lang === 'en')!
    expect(en.titles).toEqual(['Pikachu'])
    expect(en.urls).toEqual(['https://en.wikipedia.org/wiki/Pikachu'])
    expect(en.totalViews).toBe(3100)

    const de = result.editions.find((e) => e.lang === 'de')!
    expect(de.error).toBeTruthy()
    expect(de.titles).toEqual([])

    // Editions without a localised name are skipped without requests.
    expect(result.editions.find((e) => e.lang === 'ko')!.localName).toBeNull()
    expect(calls.some((url) => url.includes('ko.wikipedia'))).toBe(false)

    const jan = result.monthly.find((p) => p.month === '2025-01')!
    expect(jan.values).toEqual({ Global: 110, English: 100, Asia: 10, Europe: 0 })
    expect(result.yearly.at(-1)).toMatchObject({ year: 2025, partial: true })
  })

  it('throws PopularityNotFoundError for unknown species', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({}, 404)))
    await expect(getPokemonPopularity('notapokemon')).rejects.toBeInstanceOf(PopularityNotFoundError)
  })

  it('retries Wikimedia 429s using Retry-After and only caches complete results', async () => {
    let enLookups = 0
    let speciesCalls = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.startsWith('https://pokeapi.co/')) {
        speciesCalls += 1
        return json({ id: 133, name: 'eevee', generation: { name: 'generation-i' }, names: [{ name: 'Eevee', language: { name: 'en' } }] })
      }
      if (url.startsWith('https://en.wikipedia.org/w/api.php')) {
        enLookups += 1
        if (enLookups === 1) return new Response('slow down', { status: 429, headers: { 'Retry-After': '0' } })
        return json({ query: { pages: [{ title: 'Eevee (Pokémon)', missing: true }, { title: 'Eevee' }] } })
      }
      if (url.includes('/en.wikipedia/all-access/user/Eevee/')) {
        return json({ items: [{ timestamp: '2025010100', views: 31 }] })
      }
      throw new Error(`Unexpected fetch ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const now = new Date(Date.UTC(2025, 2, 10))
    const first = await getPokemonPopularity('eevee', now)
    expect(enLookups).toBe(2)
    expect(first.complete).toBe(true)
    expect(first.editions.find((e) => e.lang === 'en')!.titles).toEqual(['Eevee'])

    await getPokemonPopularity('eevee', now)
    expect(speciesCalls).toBe(1) // served from cache
  })

  it('gives up on long Retry-After and does not cache the failure', async () => {
    let speciesCalls = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.startsWith('https://pokeapi.co/')) {
          speciesCalls += 1
          return json({ id: 133, name: 'eevee', names: [{ name: 'Eevee', language: { name: 'en' } }] })
        }
        return new Response('slow down', { status: 429, headers: { 'Retry-After': '60' } })
      })
    )
    await expect(getPokemonPopularity('eevee')).rejects.toThrow(/rate limited/)
    await expect(getPokemonPopularity('eevee')).rejects.toThrow(/rate limited/)
    expect(speciesCalls).toBe(2)
  })
})
