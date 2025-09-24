// Usage Meta Types - Comprehensive competitive usage tracking
// Supports multi-platform, multi-generation monthly usage statistics

export type Platform = 'SMOGON_SINGLES' | 'VGC_OFFICIAL' | 'BSS_OFFICIAL' | 'OTHER';
export type Generation = 'GEN5' | 'GEN6' | 'GEN7' | 'GEN8' | 'GEN9';
export type Format = 
  // Singles (Smogon tiers)
  | 'OU' | 'UU' | 'RU' | 'NU' | 'UBERS' | 'PU' | 'MONOTYPE'
  // VGC official (regulation sets)
  | 'VGC_REG_A' | 'VGC_REG_B' | 'VGC_REG_C' | 'VGC_REG_D' | 'VGC_REG_E' | 'VGC_REG_F' | 'VGC_REG_G' | 'VGC_REG_H' | 'VGC_REG_I'
  // BSS (cartridge 3v3)
  | 'BSS_SERIES_8' | 'BSS_SERIES_9' | 'BSS_SERIES_12' | 'BSS_SERIES_13' | 'BSS_REG_C' | 'BSS_REG_D' | 'BSS_REG_E' | 'BSS_REG_I'
  | 'UNKNOWN';

export interface UsageSubstats {
  moves?: { name: string; pct: number }[];
  items?: { name: string; pct: number }[];
  abilities?: { name: string; pct: number }[];
  teraTypes?: { name: string; pct: number }[];   // SV-specific
  spreads?: { nature: string; evs: string; pct: number }[];
  teammates?: { name: string; pct: number }[];
}

export interface UsageSource {
  label: string;               // e.g., 'Smogon OU usage (Dec 2022)'
  url?: string;                // original page/file
  collectedAt: string;         // ISO timestamp
}

export interface UsageRow {
  pokemonId: number;             // National Dex ID
  pokemonName: string;           // Canonical name
  month: `${number}-${number}`;  // 'YYYY-MM'
  platform: Platform;
  generation: Generation;
  format: Format;                // Tier/Series/Regulation
  usagePercent: number;          // 0..100
  rank: number;                  // 1..N within platform/format/month
  sampleSize?: number;           // battles/teams counted if provided
  substats?: UsageSubstats;
  source: UsageSource;
}

// API Response Types
export interface UsageQuery {
  platform?: Platform | Platform[];
  generation?: Generation | Generation[];
  format?: Format | Format[];
  month?: string;
  pokemonId?: number;
  limit?: number;
  offset?: number;
}

export interface UsageCompareQuery {
  pokemonId: number;
  months?: string[];
  platforms?: Platform[];
  formats?: Format[];
}

export interface UsageSummary {
  total: number;
  rows: UsageRow[];
  metadata: {
    platforms: Platform[];
    generations: Generation[];
    formats: Format[];
    months: string[];
    sampleSize?: number;
  };
}

// UI State Types
export interface UsageFilters {
  platforms: Platform[];
  generations: Generation[];
  formats: Format[];
  month: string;
  top50Only: boolean;
  sortBy: 'rank' | 'usage' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface UsageChartData {
  month: string;
  usage: number;
  rank: number;
  platform: Platform;
  format: Format;
}

export interface UsageTrendData {
  pokemonId: number;
  pokemonName: string;
  data: UsageChartData[];
  color: string;
}

// Firestore Document Structure
export interface UsageDocument extends UsageRow {
  // Firestore-specific fields
  id: string; // Composite key: ${platform}_${generation}_${format}_${month}_${pokemonId}
  createdAt: string;
  updatedAt: string;
  checksum: string; // HMAC of key fields for deduplication
}

// Ingestion Types
export interface IngestionConfig {
  platform: Platform;
  generation: Generation;
  format: Format;
  month: string;
  source: string; // URL or file path
  dryRun?: boolean;
}

export interface IngestionResult {
  success: boolean;
  rowsProcessed: number;
  rowsStored: number;
  rowsSkipped: number;
  errors: string[];
  warnings: string[];
  top50Coverage: {
    total: number;
    found: number;
    missing: string[];
  };
}

// Name Canonicalization
export interface PokemonNameMapping {
  canonical: string;
  aliases: string[];
  pokemonId: number;
  generation: number;
  forms?: string[]; // Special forms like Landorus-Therian
}

// Cache Types
export interface UsageCache {
  key: string;
  data: UsageRow[];
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Phase Book UI Types
export type UsagePhase = 'snapshot' | 'trends' | 'deepdive';

export interface UsagePhaseState {
  current: UsagePhase;
  history: UsagePhase[];
  data: {
    snapshot?: UsageRow[];
    trends?: UsageTrendData[];
  };
}
