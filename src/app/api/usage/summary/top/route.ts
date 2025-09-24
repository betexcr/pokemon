// API route for top usage summary
// GET /api/usage/summary/top?platform=&generation=&format=&month=&limit=50

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-static';
import { getTopUsage } from '@/lib/usage/firestore';
import { Platform, Generation, Format } from '@/types/usage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const platform = searchParams.get('platform') as Platform | null;
    const generation = searchParams.get('generation') as Generation | null;
    const format = searchParams.get('format') as Format | null;
    const month = searchParams.get('month');
    const limit = searchParams.get('limit');
    
    // If required params missing, return placeholder instead of 400
    if (!platform || !generation || !format || !month) {
      const nowMonth = new Date().toISOString().slice(0, 7)
      const data = [
        { pokemonId: 25, name: 'Pikachu', usagePercent: 8.5, rank: 1, sampleSize: 10000 },
        { pokemonId: 6, name: 'Charizard', usagePercent: 7.2, rank: 2, sampleSize: 10000 },
        { pokemonId: 149, name: 'Dragonite', usagePercent: 6.0, rank: 3, sampleSize: 10000 }
      ]
      return NextResponse.json({
        platform: platform || 'SMOGON_SINGLES',
        generation: generation || 'GEN9',
        format: format || 'OU',
        month: month || nowMonth,
        data,
        statistics: {
          total: data.length,
          totalUsage: data.reduce((s, r) => s + r.usagePercent, 0),
          averageUsage: Math.round((data.reduce((s, r) => s + r.usagePercent, 0) / data.length) * 100) / 100,
          medianUsage: data[1].usagePercent,
          topGainers: data.slice(0, 2),
          topLosers: data.slice(-2).reverse()
        },
        metadata: { sampleSize: 10000, lastUpdated: new Date().toISOString(), source: 'placeholder' }
      })
    }
    
    // Validate parameter values
    const errors: string[] = [];
    
    if (!['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL'].includes(platform)) {
      errors.push('Invalid platform. Must be SMOGON_SINGLES, VGC_OFFICIAL, or BSS_OFFICIAL');
    }
    
    if (!['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'].includes(generation)) {
      errors.push('Invalid generation. Must be GEN5, GEN6, GEN7, GEN8, or GEN9');
    }
    
    if (!/^\d{4}-\d{2}$/.test(month)) {
      errors.push('Invalid month format. Must be YYYY-MM');
    }
    
    if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 1000)) {
      errors.push('Invalid limit. Must be between 1 and 1000');
    }
    
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: errors },
        { status: 400 }
      );
    }
    
    // Get top usage data
    const limitNumber = limit ? Number(limit) : 50;
    const topUsage = await getTopUsage(platform, generation, format, month, limitNumber);
    
    // Calculate additional statistics
    const totalUsage = topUsage.reduce((sum, row) => sum + row.usagePercent, 0);
    const averageUsage = topUsage.length > 0 ? totalUsage / topUsage.length : 0;
    const medianUsage = topUsage.length > 0 ? 
      topUsage[Math.floor(topUsage.length / 2)].usagePercent : 0;
    
    // Find top movers (compared to previous month would require additional data)
    const topGainers = topUsage.slice(0, 5); // Top 5 by usage
    const topLosers = topUsage.slice(-5).reverse(); // Bottom 5 by usage
    
    const result = {
      platform,
      generation,
      format,
      month,
      data: topUsage,
      statistics: {
        total: topUsage.length,
        totalUsage,
        averageUsage: Math.round(averageUsage * 100) / 100,
        medianUsage: Math.round(medianUsage * 100) / 100,
        topGainers,
        topLosers
      },
      metadata: {
        sampleSize: topUsage[0]?.sampleSize,
        lastUpdated: new Date().toISOString(),
        source: topUsage[0]?.source
      }
    };
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in usage summary top API:', error);
    
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
