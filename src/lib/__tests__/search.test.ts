import { searchPokemonByName } from '@/lib/api'

describe('searchPokemonByName', () => {
  it('includes calyrex-shadow when searching for calyrex', async () => {
    const results = await searchPokemonByName('calyrex')
    const names = results.map(r => r.name)
    expect(names).toEqual(expect.arrayContaining(['calyrex-shadow']))
  }, 30000)
})


