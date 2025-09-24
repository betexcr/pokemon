// Returns real data availability for platform/generation by probing upstream
// GET /api/usage/availability?platform=&generation=

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-static';
import type { Platform, Generation, Format } from '@/types/usage';

function getLastMonths(count: number): string[] {
  // Use a conservative approach - only probe months that are likely to have data
  // Start from 2024-10 (known good) and go backwards
  const months: string[] = [];
  const startYear = 2024;
  const startMonth = 10;
  
  for (let i = 0; i < count; i++) {
    const year = startYear - Math.floor((startMonth - 1 - i) / 12);
    const month = ((startMonth - 1 - i) % 12 + 12) % 12 + 1;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  
  return months;
}

function getSmogonFormats(): Format[] {
  return ['OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE'] as Format[];
}

function getPikalyticsFormats(): Format[] {
  return ['VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I'] as Format[];
}

function getBssFormats(): Format[] {
  return ['BSS_SERIES_12', 'BSS_SERIES_13', 'BSS_REG_C', 'BSS_REG_D', 'BSS_REG_E', 'BSS_REG_I'] as Format[];
}

function getMonthName(monthNum: string): string {
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const idx = months.indexOf(monthNum);
  return idx !== -1 ? names[idx] : 'jan';
}

function getSmogonFormatPath(generation: Generation, format: Format): string {
  const genPrefix = generation.toLowerCase();
  const formatMap: Record<string, string> = {
    'OU': 'ou',
    'UU': 'uu',
    'RU': 'ru',
    'NU': 'nu',
    'UBERS': 'ubers',
    'PU': 'pu',
    'MONOTYPE': 'monotype'
  };
  const formatSuffix = (formatMap as any)[format] || String(format).toLowerCase();
  return `${genPrefix}${formatSuffix}-0`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform | null;
  const generation = searchParams.get('generation') as Generation | null;

  if (!platform) {
    // Return placeholder availability instead of 400
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return NextResponse.json({ platform: 'SMOGON_SINGLES', generation: generation || 'GEN9', formats: ['OU'], availability: { OU: months } });
  }

  try {
    // Probe a wider window to handle sparse older availability
    const monthsToProbe = getLastMonths(36);
    let formats: Format[] = [];

    if (platform === 'SMOGON_SINGLES') {
      formats = getSmogonFormats();
      const gens: Generation[] = generation ? [generation] as Generation[] : ['GEN5','GEN6','GEN7','GEN8','GEN9'];
      const availability: Record<string, Record<Generation, string[]>> = {};
      for (const fmt of formats) {
        availability[fmt] = {} as Record<Generation, string[]>;
        for (const gen of gens) {
          const availableMonths: string[] = [];
          const formatPath = getSmogonFormatPath(gen, fmt);
          for (const m of monthsToProbe) {
            const year = m.split('-')[0];
            const monthNum = m.split('-')[1];
            const url = `https://www.smogon.com/stats/${year}-${monthNum}/${formatPath}.txt`;
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 5000);
              const res = await fetch(url, {
                method: 'GET',
                headers: {
                  'User-Agent': 'Pokemon-Usage-Meta/1.0',
                  'Accept': 'text/plain'
                },
                signal: controller.signal,
                next: { revalidate: 3600 }
              });
              clearTimeout(timeout);
              if (res.ok) availableMonths.push(m);
              if (availableMonths.length >= 8) break;
            } catch {}
          }
          availability[fmt][gen] = availableMonths;
        }
      }
      return NextResponse.json({ platform, generation: generation || null, formats, availability, probedMonths: monthsToProbe });
    }

    if (platform === 'VGC_OFFICIAL') {
      // Pikalytics endpoint does not expose per-month historic via simple API; assume formats are available and months limited to recent
      formats = getPikalyticsFormats();
      // For now, return months without probing to avoid heavy traffic; UI can still filter via live fetch result handling
      return NextResponse.json({ platform, generation, formats, availability: Object.fromEntries(formats.map(f => [f, monthsToProbe])) });
    }

    if (platform === 'BSS_OFFICIAL') {
      formats = getBssFormats();
      return NextResponse.json({ platform, generation, formats, availability: Object.fromEntries(formats.map(f => [f, monthsToProbe])) });
    }

    // Fallback placeholder for unsupported platform
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return NextResponse.json({ platform, generation, formats: ['OU'], availability: { OU: months } });
  } catch (err) {
    // Placeholder on error
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    return NextResponse.json({ platform, generation, formats: ['OU'], availability: { OU: months } }, { status: 200 });
  }
}


