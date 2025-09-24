// API route for monthly usage data queries
// GET /api/usage/monthly?platform=&generation=&format=&month=&pokemonId=

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-static';
import { realDataFetcher } from '@/lib/usage/realDataFetcher';
import { UsageQuery, Platform, Generation, Format } from '@/types/usage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters (single-select)
    const platform = searchParams.get('platform') as Platform | null;
    const generation = searchParams.get('generation') as Generation | null;
    const format = searchParams.get('format') as Format | null;
    const month = searchParams.get('month');
    const pokemonId = searchParams.get('pokemonId');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    
    // Validate parameters
    const errors: string[] = [];
    
    if (platform && !['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL'].includes(platform)) {
      errors.push('Invalid platform. Must be SMOGON_SINGLES, VGC_OFFICIAL, or BSS_OFFICIAL');
    }
    
    if (generation && !['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'].includes(generation)) {
      errors.push('Invalid generation. Must be GEN5, GEN6, GEN7, GEN8, or GEN9');
    }
    
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      errors.push('Invalid month format. Must be YYYY-MM');
    }
    
    if (pokemonId && (isNaN(Number(pokemonId)) || Number(pokemonId) < 1)) {
      errors.push('Invalid pokemonId. Must be a positive number');
    }
    
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 1000)) {
      errors.push('Invalid limit. Must be between 1 and 1000');
    }
    
    if (offset && (isNaN(Number(offset)) || Number(offset) < 0)) {
      errors.push('Invalid offset. Must be non-negative');
    }
    
    // If parameters are invalid or missing, respond with placeholder data instead of 400
    if (errors.length > 0 || !platform || !generation || !format) {
      const nowMonth = new Date().toISOString().slice(0, 7);
      
      // Enhanced mock data with actual competitive Pokemon
      const currentPlatform = platform || 'SMOGON_SINGLES';
      const currentGeneration = generation || 'GEN9';
      const currentFormat = format || 'OU';
      const currentMonth = month || nowMonth;
      
      // Helper function to add source to mock data
      const addSource = (pokemon: any) => ({
        ...pokemon,
        source: { label: 'Mock Data Source', collectedAt: new Date().toISOString() }
      });
      
      const mockPokemon = [
        addSource({ pokemonId: 25, name: 'Pikachu', pokemonName: 'Pikachu', usagePercent: 12.5, rank: 1, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 6, name: 'Charizard', pokemonName: 'Charizard', usagePercent: 11.2, rank: 2, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 149, name: 'Dragonite', pokemonName: 'Dragonite', usagePercent: 9.8, rank: 3, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 150, name: 'Mewtwo', pokemonName: 'Mewtwo', usagePercent: 8.7, rank: 4, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 130, name: 'Gyarados', pokemonName: 'Gyarados', usagePercent: 7.9, rank: 5, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 143, name: 'Snorlax', pokemonName: 'Snorlax', usagePercent: 7.1, rank: 6, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 9, name: 'Blastoise', pokemonName: 'Blastoise', usagePercent: 6.8, rank: 7, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 3, name: 'Venusaur', pokemonName: 'Venusaur', usagePercent: 6.2, rank: 8, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 18, name: 'Pidgeot', pokemonName: 'Pidgeot', usagePercent: 5.9, rank: 9, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 65, name: 'Alakazam', pokemonName: 'Alakazam', usagePercent: 5.4, rank: 10, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 76, name: 'Golem', pokemonName: 'Golem', usagePercent: 5.1, rank: 11, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 112, name: 'Rhydon', pokemonName: 'Rhydon', usagePercent: 4.8, rank: 12, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 131, name: 'Lapras', pokemonName: 'Lapras', usagePercent: 4.5, rank: 13, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 94, name: 'Gengar', pokemonName: 'Gengar', usagePercent: 4.2, rank: 14, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 68, name: 'Machamp', pokemonName: 'Machamp', usagePercent: 3.9, rank: 15, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 103, name: 'Exeggutor', pokemonName: 'Exeggutor', usagePercent: 3.6, rank: 16, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 59, name: 'Arcanine', pokemonName: 'Arcanine', usagePercent: 3.3, rank: 17, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 87, name: 'Dewgong', pokemonName: 'Dewgong', usagePercent: 3.0, rank: 18, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 91, name: 'Cloyster', pokemonName: 'Cloyster', usagePercent: 2.8, rank: 19, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 124, name: 'Jynx', pokemonName: 'Jynx', usagePercent: 2.6, rank: 20, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 107, name: 'Hitmonchan', pokemonName: 'Hitmonchan', usagePercent: 2.4, rank: 21, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 106, name: 'Hitmonlee', pokemonName: 'Hitmonlee', usagePercent: 2.2, rank: 22, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 95, name: 'Onix', pokemonName: 'Onix', usagePercent: 2.0, rank: 23, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 115, name: 'Kangaskhan', pokemonName: 'Kangaskhan', usagePercent: 1.8, rank: 24, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 113, name: 'Chansey', pokemonName: 'Chansey', usagePercent: 1.6, rank: 25, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 101, name: 'Electrode', pokemonName: 'Electrode', usagePercent: 1.4, rank: 26, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 89, name: 'Muk', pokemonName: 'Muk', usagePercent: 1.2, rank: 27, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 82, name: 'Magneton', pokemonName: 'Magneton', usagePercent: 1.0, rank: 28, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 85, name: 'Dodrio', pokemonName: 'Dodrio', usagePercent: 0.8, rank: 29, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth }),
        addSource({ pokemonId: 97, name: 'Hypno', pokemonName: 'Hypno', usagePercent: 0.6, rank: 30, sampleSize: 15000, platform: currentPlatform, generation: currentGeneration, format: currentFormat, month: currentMonth })
      ];
      
      const placeholder = {
        data: mockPokemon,
        total: mockPokemon.length,
        month: month || nowMonth,
        platform: platform || 'SMOGON_SINGLES',
        generation: generation || 'GEN9',
        format: format || 'OU',
        metadata: { source: 'enhanced-mock', lastUpdated: new Date().toISOString(), sampleSize: 15000 }
      };
      return NextResponse.json(placeholder, { status: 200 });
    }
    
    // Build query object
    const query: UsageQuery = {
      platform: platform || undefined,
      generation: generation || undefined,
      format: format || undefined,
      month: month || undefined,
      pokemonId: pokemonId ? Number(pokemonId) : undefined,
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0
    };
    
                const monthParam = month || new Date().toISOString().slice(0, 7);

                // Fetch real data from external sources
                let realData;
                try {
                  realData = await realDataFetcher.fetchUsageData({
                    platform,
                    generation,
                    format,
                    month: monthParam,
                    limit: query.limit
                  });
                } catch (fetchErr) {
                  // Enhanced mock data for better visualization
                  const addSource = (pokemon: any) => ({
                    ...pokemon,
                    source: { label: 'Mock Data Source', collectedAt: new Date().toISOString() }
                  });
                  
                  const mockPokemon = [
                    addSource({ pokemonId: 25, name: 'Pikachu', pokemonName: 'Pikachu', usagePercent: 12.5, rank: 1, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 6, name: 'Charizard', pokemonName: 'Charizard', usagePercent: 11.2, rank: 2, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 149, name: 'Dragonite', pokemonName: 'Dragonite', usagePercent: 9.8, rank: 3, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 150, name: 'Mewtwo', pokemonName: 'Mewtwo', usagePercent: 8.7, rank: 4, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 130, name: 'Gyarados', pokemonName: 'Gyarados', usagePercent: 7.9, rank: 5, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 143, name: 'Snorlax', pokemonName: 'Snorlax', usagePercent: 7.1, rank: 6, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 9, name: 'Blastoise', pokemonName: 'Blastoise', usagePercent: 6.8, rank: 7, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 3, name: 'Venusaur', pokemonName: 'Venusaur', usagePercent: 6.2, rank: 8, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 18, name: 'Pidgeot', pokemonName: 'Pidgeot', usagePercent: 5.9, rank: 9, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 65, name: 'Alakazam', pokemonName: 'Alakazam', usagePercent: 5.4, rank: 10, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 76, name: 'Golem', pokemonName: 'Golem', usagePercent: 5.1, rank: 11, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 112, name: 'Rhydon', pokemonName: 'Rhydon', usagePercent: 4.8, rank: 12, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 131, name: 'Lapras', pokemonName: 'Lapras', usagePercent: 4.5, rank: 13, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 94, name: 'Gengar', pokemonName: 'Gengar', usagePercent: 4.2, rank: 14, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 68, name: 'Machamp', pokemonName: 'Machamp', usagePercent: 3.9, rank: 15, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 103, name: 'Exeggutor', pokemonName: 'Exeggutor', usagePercent: 3.6, rank: 16, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 59, name: 'Arcanine', pokemonName: 'Arcanine', usagePercent: 3.3, rank: 17, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 87, name: 'Dewgong', pokemonName: 'Dewgong', usagePercent: 3.0, rank: 18, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 91, name: 'Cloyster', pokemonName: 'Cloyster', usagePercent: 2.8, rank: 19, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 124, name: 'Jynx', pokemonName: 'Jynx', usagePercent: 2.6, rank: 20, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 107, name: 'Hitmonchan', pokemonName: 'Hitmonchan', usagePercent: 2.4, rank: 21, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 106, name: 'Hitmonlee', pokemonName: 'Hitmonlee', usagePercent: 2.2, rank: 22, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 95, name: 'Onix', pokemonName: 'Onix', usagePercent: 2.0, rank: 23, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 115, name: 'Kangaskhan', pokemonName: 'Kangaskhan', usagePercent: 1.8, rank: 24, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 113, name: 'Chansey', pokemonName: 'Chansey', usagePercent: 1.6, rank: 25, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 101, name: 'Electrode', pokemonName: 'Electrode', usagePercent: 1.4, rank: 26, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 89, name: 'Muk', pokemonName: 'Muk', usagePercent: 1.2, rank: 27, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 82, name: 'Magneton', pokemonName: 'Magneton', usagePercent: 1.0, rank: 28, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 85, name: 'Dodrio', pokemonName: 'Dodrio', usagePercent: 0.8, rank: 29, sampleSize: 15000, platform, generation, format, month: monthParam }),
                    addSource({ pokemonId: 97, name: 'Hypno', pokemonName: 'Hypno', usagePercent: 0.6, rank: 30, sampleSize: 15000, platform, generation, format, month: monthParam })
                  ];

                  const placeholder = {
                    data: mockPokemon,
                    total: mockPokemon.length,
                    month: monthParam,
                    platform,
                    generation,
                    format,
                    metadata: { source: 'enhanced-mock', lastUpdated: new Date().toISOString(), sampleSize: 15000 }
                  };
                  return NextResponse.json(placeholder, { status: 200 });
                }
                
                // Transform to API response format
                const result = {
                  data: realData,
                  total: realData.length,
                  month: monthParam,
                  platform,
                  generation,
                  format,
                  metadata: {
                    source: 'real',
                    lastUpdated: new Date().toISOString(),
                    sampleSize: realData.reduce((sum, row) => sum + (row.sampleSize || 0), 0)
                  }
                };
                
                return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in usage monthly API:', error);
    
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
