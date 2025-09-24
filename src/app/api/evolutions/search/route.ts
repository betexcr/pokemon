import { NextResponse } from 'next/server';
import { buildEvoGraph } from '@/lib/evo/build';

export const revalidate = 3600; // 1 hour

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('q');
  const genParam = searchParams.get('gen');
  
  if (!searchQuery || searchQuery.length < 2) {
    return NextResponse.json({ families: [] }, { status: 400 });
  }

  try {
    // For search, we'll load a larger batch to find matching families
    // This is more efficient than loading all families just to search
    const gens = genParam ? genParam.split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n)) : undefined;
    const data = await buildEvoGraph({ 
      gens, // Respect generation filter in search
      offset: 0, 
      limit: 100 // Load more for search to have better results
    });

    // Filter families that contain Pokemon matching the search query
    const query = searchQuery.toLowerCase();
    const matchingFamilies = data.families.filter(family => 
      family.species.some(species => 
        species.name.toLowerCase().includes(query)
      )
    );

    return NextResponse.json({
      families: matchingFamilies,
      total: matchingFamilies.length,
      query: searchQuery
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, max-age=1800', // 30 minutes cache for search
        'X-Cache': 'miss'
      }
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
