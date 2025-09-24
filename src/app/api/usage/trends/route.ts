// API route for historical usage trends data
// GET /api/usage/trends?platform=&generation=&format=&months=6

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const platform = searchParams.get('platform') || 'SMOGON_SINGLES';
    const generation = searchParams.get('generation') || 'GEN9';
    const format = searchParams.get('format') || 'OU';
    const months = parseInt(searchParams.get('months') || '6');
    
    // Generate list of recent months for trend analysis
    const getRecentMonths = (count: number): string[] => {
      const months: string[] = [];
      const now = new Date();
      
      // Start from a known good month and go backwards
      const startYear = 2024;
      const startMonth = 10; // October 2024
      
      for (let i = 0; i < count; i++) {
        const date = new Date(startYear, startMonth - 1 - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
      }
      
      return months.reverse(); // Reverse to get chronological order
    };

    const monthsList = getRecentMonths(months);
    
    // Enhanced mock data with realistic trends
    const basePokemon = [
      { pokemonId: 25, name: 'Pikachu', baseUsage: 12.5 },
      { pokemonId: 6, name: 'Charizard', baseUsage: 11.2 },
      { pokemonId: 149, name: 'Dragonite', baseUsage: 9.8 },
      { pokemonId: 150, name: 'Mewtwo', baseUsage: 8.7 },
      { pokemonId: 130, name: 'Gyarados', baseUsage: 7.9 },
      { pokemonId: 143, name: 'Snorlax', baseUsage: 7.1 },
      { pokemonId: 9, name: 'Blastoise', baseUsage: 6.8 },
      { pokemonId: 3, name: 'Venusaur', baseUsage: 6.2 },
      { pokemonId: 18, name: 'Pidgeot', baseUsage: 5.9 },
      { pokemonId: 65, name: 'Alakazam', baseUsage: 5.4 },
      { pokemonId: 76, name: 'Golem', baseUsage: 5.1 },
      { pokemonId: 112, name: 'Rhydon', baseUsage: 4.8 }
    ];

    // Generate historical data with realistic trends
    const historicalData = monthsList.map((month, monthIndex) => {
      const data = basePokemon.map((pokemon, pokemonIndex) => {
        // Create realistic trends with some randomness
        const trendFactor = 1 + (Math.sin(monthIndex * 0.5 + pokemonIndex * 0.3) * 0.2);
        const randomVariation = 1 + (Math.random() - 0.5) * 0.3; // ±15% random variation
        const usagePercent = Math.max(0.1, pokemon.baseUsage * trendFactor * randomVariation);
        
        // Calculate rank based on usage (rough approximation)
        const rank = pokemonIndex + 1 + Math.floor((Math.random() - 0.5) * 3);
        
        return {
          pokemonId: pokemon.pokemonId,
          name: pokemon.name,
          pokemonName: pokemon.name,
          usagePercent: Math.round(usagePercent * 10) / 10,
          rank: Math.max(1, rank),
          sampleSize: 15000 + Math.floor(Math.random() * 5000),
          platform,
          generation,
          format,
          month
        };
      });

      // Sort by usage to get proper rankings
      data.sort((a, b) => b.usagePercent - a.usagePercent);
      
      return {
        month,
        data: data.map((pokemon, index) => ({
          ...pokemon,
          rank: index + 1
        }))
      };
    });

    const result = {
      historicalData,
      platform,
      generation,
      format,
      months: monthsList,
      metadata: {
        source: 'enhanced-mock-trends',
        lastUpdated: new Date().toISOString(),
        totalMonths: monthsList.length,
        pokemonCount: basePokemon.length
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in usage trends API:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
