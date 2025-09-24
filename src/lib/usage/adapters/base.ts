// Base adapter interface for usage data ingestion
// Defines common interface for all platform-specific parsers

import { 
  UsageRow, 
  Platform, 
  Generation, 
  Format, 
  IngestionConfig,
  IngestionResult 
} from '@/types/usage';

export interface AdapterResult {
  rows: UsageRow[];
  errors: string[];
  warnings: string[];
  metadata: {
    totalRows: number;
    top50Rows: number;
    missingTop50: string[];
    sampleSize?: number;
  };
}

export interface BaseAdapter {
  /**
   * Parse usage data from various sources (URL, file content, etc.)
   */
  parse(config: IngestionConfig, content: string): Promise<AdapterResult>;
  
  /**
   * Validate that the adapter can handle the given source
   */
  canHandle(config: IngestionConfig): boolean;
  
  /**
   * Get supported formats for this platform
   */
  getSupportedFormats(): Format[];
  
  /**
   * Get supported generations for this platform
   */
  getSupportedGenerations(): Generation[];
}

export abstract class AbstractAdapter implements BaseAdapter {
  protected platform: Platform;
  protected generation: Generation;
  protected format: Format;
  protected month: string;
  
  constructor(config: IngestionConfig) {
    this.platform = config.platform;
    this.generation = config.generation;
    this.format = config.format;
    this.month = config.month;
  }
  
  abstract parse(config: IngestionConfig, content: string): Promise<AdapterResult>;
  
  abstract canHandle(config: IngestionConfig): boolean;
  
  abstract getSupportedFormats(): Format[];
  
  abstract getSupportedGenerations(): Generation[];
  
  /**
   * Common validation for all adapters
   */
  protected validateConfig(config: IngestionConfig): string[] {
    const errors: string[] = [];
    
    if (!config.platform) {
      errors.push('Platform is required');
    }
    
    if (!config.generation) {
      errors.push('Generation is required');
    }
    
    if (!config.format) {
      errors.push('Format is required');
    }
    
    if (!config.month) {
      errors.push('Month is required');
    }
    
    // Validate month format (YYYY-MM)
    if (config.month && !/^\d{4}-\d{2}$/.test(config.month)) {
      errors.push('Month must be in YYYY-MM format');
    }
    
    return errors;
  }
  
  /**
   * Create a UsageRow with common fields
   */
  protected createUsageRow(
    pokemonId: number,
    pokemonName: string,
    usagePercent: number,
    rank: number,
    sampleSize?: number,
    substats?: any
  ): UsageRow {
    return {
      pokemonId,
      pokemonName,
      month: this.month as `${number}-${number}`,
      platform: this.platform,
      generation: this.generation,
      format: this.format,
      usagePercent,
      rank,
      sampleSize,
      substats,
      source: {
        label: `${this.platform} ${this.format} usage (${this.month})`,
        collectedAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * Parse percentage string to number
   */
  protected parsePercentage(value: string): number {
    // Remove % symbol and parse
    const cleaned = value.replace('%', '').trim();
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) {
      throw new Error(`Invalid percentage: ${value}`);
    }
    
    if (parsed < 0 || parsed > 100) {
      throw new Error(`Percentage out of range (0-100): ${parsed}`);
    }
    
    return parsed;
  }
  
  /**
   * Parse rank to integer
   */
  protected parseRank(value: string | number): number {
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    
    if (isNaN(parsed) || parsed < 1) {
      throw new Error(`Invalid rank: ${value}`);
    }
    
    return parsed;
  }
  
  /**
   * Parse sample size to integer
   */
  protected parseSampleSize(value: string | number): number | undefined {
    if (!value) return undefined;
    
    const parsed = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
    
    if (isNaN(parsed) || parsed < 0) {
      throw new Error(`Invalid sample size: ${value}`);
    }
    
    return parsed;
  }
  
  /**
   * Validate usage row data
   */
  protected validateUsageRow(row: Partial<UsageRow>): string[] {
    const errors: string[] = [];
    
    if (!row.pokemonId || row.pokemonId < 1) {
      errors.push('Invalid Pokémon ID');
    }
    
    if (!row.pokemonName || row.pokemonName.trim() === '') {
      errors.push('Invalid Pokémon name');
    }
    
    if (typeof row.usagePercent !== 'number' || row.usagePercent < 0 || row.usagePercent > 100) {
      errors.push('Invalid usage percentage');
    }
    
    if (typeof row.rank !== 'number' || row.rank < 1) {
      errors.push('Invalid rank');
    }
    
    return errors;
  }
}
