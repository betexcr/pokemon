import { NextResponse } from 'next/server'

export const revalidate = 604800

interface SpeciesListResponse {
  results: Array<{ name: string; url: string }>
}

/**
 * GET /api/trends/species — compact list of every Pokémon species ({ id, slug })
 * for the Trends search box.
 */
export async function GET() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=2000', {
      next: { revalidate: 604800 },
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to load species list' }, { status: 502 })
    }
    const data = (await res.json()) as SpeciesListResponse
    const species = data.results
      .map((entry) => {
        const match = /\/pokemon-species\/(\d+)\/?$/.exec(entry.url)
        return match ? { id: Number(match[1]), slug: entry.name } : null
      })
      .filter((entry): entry is { id: number; slug: string } => entry !== null)
      .sort((a, b) => a.id - b.id)
    return NextResponse.json(
      { species },
      { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' } }
    )
  } catch (error) {
    console.error('trends/species failed:', error)
    return NextResponse.json({ error: 'Failed to load species list' }, { status: 502 })
  }
}
