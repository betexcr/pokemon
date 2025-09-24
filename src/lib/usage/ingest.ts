// Main ingestion CLI for usage data
// Orchestrates the ETL process with validation and normalization

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SmogonSinglesAdapter } from './adapters/smogonSingles';
import { VGCOfficialAdapter } from './adapters/vgcOfficial';
import { BSSOfficialAdapter } from './adapters/bssOfficial';
import { storeUsageRows } from './firestore';
import { 
  IngestionConfig, 
  IngestionResult, 
  Platform, 
  Generation, 
  Format 
} from '@/types/usage';
import { getTop50PokemonIds } from './canonicalize';

export class UsageIngestionCLI {
  private adapters = new Map<Platform, any>();
  
  constructor() {
    this.adapters.set('SMOGON_SINGLES', SmogonSinglesAdapter);
    this.adapters.set('VGC_OFFICIAL', VGCOfficialAdapter);
    this.adapters.set('BSS_OFFICIAL', BSSOfficialAdapter);
  }
  
  /**
   * Main ingestion entry point
   */
  async ingest(config: IngestionConfig): Promise<IngestionResult> {
    const result: IngestionResult = {
      success: false,
      rowsProcessed: 0,
      rowsStored: 0,
      rowsSkipped: 0,
      errors: [],
      warnings: [],
      top50Coverage: {
        total: getTop50PokemonIds().length,
        found: 0,
        missing: []
      }
    };
    
    try {
      // Validate config
      const configErrors = this.validateConfig(config);
      if (configErrors.length > 0) {
        result.errors.push(...configErrors);
        return result;
      }
      
      // Get adapter
      const AdapterClass = this.adapters.get(config.platform);
      if (!AdapterClass) {
        result.errors.push(`No adapter found for platform: ${config.platform}`);
        return result;
      }
      
      const adapter = new AdapterClass(config);
      
      // Check if adapter can handle this config
      if (!adapter.canHandle(config)) {
        result.errors.push(`Adapter cannot handle this configuration`);
        return result;
      }
      
      // Load content from source
      const content = await this.loadContent(config);
      if (!content) {
        result.errors.push('Failed to load content from source');
        return result;
      }
      
      // Parse with adapter
      const parseResult = await adapter.parse(config, content);
      
      result.rowsProcessed = parseResult.rows.length;
      result.warnings.push(...parseResult.warnings);
      
      // Validate parsed rows
      const validatedRows = this.validateRows(parseResult.rows, result.errors, result.warnings);
      result.rowsStored = validatedRows.length;
      result.rowsSkipped = parseResult.rows.length - validatedRows.length;
      
      // Update Top 50 coverage
      result.top50Coverage.found = validatedRows.length;
      result.top50Coverage.missing = parseResult.metadata.missingTop50;
      
      // Store to Firestore (unless dry run)
      if (!config.dryRun && validatedRows.length > 0) {
        try {
          await storeUsageRows(validatedRows);
          result.success = true;
        } catch (error) {
          result.errors.push(`Failed to store rows: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } else if (config.dryRun) {
        result.success = true;
        result.warnings.push('DRY RUN: No data was stored to Firestore');
      } else {
        result.success = true;
        result.warnings.push('No valid rows to store');
      }
      
    } catch (error) {
      result.errors.push(`Ingestion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return result;
  }
  
  /**
   * Validate ingestion configuration
   */
  private validateConfig(config: IngestionConfig): string[] {
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
    
    if (!config.source) {
      errors.push('Source is required');
    }
    
    // Validate month format (YYYY-MM)
    if (config.month && !/^\d{4}-\d{2}$/.test(config.month)) {
      errors.push('Month must be in YYYY-MM format');
    }
    
    // Validate platform
    if (config.platform && !['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL'].includes(config.platform)) {
      errors.push(`Unsupported platform: ${config.platform}`);
    }
    
    // Validate generation
    if (config.generation && !['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'].includes(config.generation)) {
      errors.push(`Unsupported generation: ${config.generation}`);
    }
    
    return errors;
  }
  
  /**
   * Load content from various sources
   */
  private async loadContent(config: IngestionConfig): Promise<string | null> {
    try {
      // Check if source is a URL
      if (config.source.startsWith('http://') || config.source.startsWith('https://')) {
        return await this.loadFromURL(config.source);
      }
      
      // Check if source is a file path
      if (existsSync(config.source)) {
        return readFileSync(config.source, 'utf-8');
      }
      
      // Check if source is in dropbox directory
      const dropboxPath = join(process.cwd(), 'ingest', 'dropbox', config.source);
      if (existsSync(dropboxPath)) {
        return readFileSync(dropboxPath, 'utf-8');
      }
      
      // Check if source is in fixtures directory
      const fixturesPath = join(process.cwd(), 'ingest', 'fixtures', config.source);
      if (existsSync(fixturesPath)) {
        return readFileSync(fixturesPath, 'utf-8');
      }
      
      return null;
    } catch (error) {
      throw new Error(`Failed to load content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Load content from URL
   */
  private async loadFromURL(url: string): Promise<string> {
    // In a real implementation, you'd use fetch or axios
    // For now, we'll throw an error as URL loading requires additional setup
    throw new Error('URL loading not implemented in this version');
  }
  
  /**
   * Validate parsed rows
   */
  private validateRows(
    rows: any[], 
    errors: string[], 
    warnings: string[]
  ): any[] {
    const validatedRows: any[] = [];
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors: string[] = [];
      
      // Validate required fields
      if (!row.pokemonId || typeof row.pokemonId !== 'number') {
        rowErrors.push('Invalid pokemonId');
      }
      
      if (!row.pokemonName || typeof row.pokemonName !== 'string') {
        rowErrors.push('Invalid pokemonName');
      }
      
      if (typeof row.usagePercent !== 'number' || row.usagePercent < 0 || row.usagePercent > 100) {
        rowErrors.push('Invalid usagePercent');
      }
      
      if (typeof row.rank !== 'number' || row.rank < 1) {
        rowErrors.push('Invalid rank');
      }
      
      if (!row.month || !/^\d{4}-\d{2}$/.test(row.month)) {
        rowErrors.push('Invalid month format');
      }
      
      if (!row.platform || !['SMOGON_SINGLES', 'VGC_OFFICIAL', 'BSS_OFFICIAL'].includes(row.platform)) {
        rowErrors.push('Invalid platform');
      }
      
      if (!row.generation || !['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'].includes(row.generation)) {
        rowErrors.push('Invalid generation');
      }
      
      if (!row.format) {
        rowErrors.push('Missing format');
      }
      
      if (rowErrors.length > 0) {
        errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
        continue;
      }
      
      validatedRows.push(row);
    }
    
    return validatedRows;
  }
  
  /**
   * Generate ingestion report
   */
  generateReport(result: IngestionResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push('USAGE DATA INGESTION REPORT');
    lines.push('='.repeat(60));
    lines.push('');
    
    lines.push(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    lines.push(`Rows Processed: ${result.rowsProcessed}`);
    lines.push(`Rows Stored: ${result.rowsStored}`);
    lines.push(`Rows Skipped: ${result.rowsSkipped}`);
    lines.push('');
    
    lines.push('Top 50 Coverage:');
    lines.push(`  Total Top 50 Pokémon: ${result.top50Coverage.total}`);
    lines.push(`  Found in Data: ${result.top50Coverage.found}`);
    lines.push(`  Missing: ${result.top50Coverage.missing.length}`);
    
    if (result.top50Coverage.missing.length > 0) {
      lines.push('  Missing Pokémon:');
      result.top50Coverage.missing.forEach(name => {
        lines.push(`    - ${name}`);
      });
    }
    lines.push('');
    
    if (result.warnings.length > 0) {
      lines.push('Warnings:');
      result.warnings.forEach(warning => {
        lines.push(`  ⚠️  ${warning}`);
      });
      lines.push('');
    }
    
    if (result.errors.length > 0) {
      lines.push('Errors:');
      result.errors.forEach(error => {
        lines.push(`  ❌ ${error}`);
      });
      lines.push('');
    }
    
    lines.push('='.repeat(60));
    
    return lines.join('\n');
  }
  
  /**
   * Save report to file
   */
  saveReport(report: string, filename?: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFilename = filename || `ingestion-report-${timestamp}.txt`;
    const reportPath = join(process.cwd(), 'ingest', 'reports', reportFilename);
    
    try {
      writeFileSync(reportPath, report, 'utf-8');
      console.log(`Report saved to: ${reportPath}`);
    } catch (error) {
      console.error(`Failed to save report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * CLI interface for usage ingestion
 */
export async function runIngestionCLI(args: string[]): Promise<void> {
  const cli = new UsageIngestionCLI();
  
  // Parse command line arguments
  const config = parseCLIArgs(args);
  
  if (!config) {
    console.log('Usage: bun ingest --platform <platform> --generation <gen> --format <format> --month <month> --source <source> [--dry-run]');
    console.log('');
    console.log('Platforms: SMOGON_SINGLES, VGC_OFFICIAL, BSS_OFFICIAL');
    console.log('Generations: GEN5, GEN6, GEN7, GEN8, GEN9');
    console.log('Formats: OU, UU, RU, NU, UBERS, PU, MONOTYPE, VGC_REG_*, BSS_SERIES_*, BSS_REG_*');
    console.log('Month: YYYY-MM format (e.g., 2023-03)');
    console.log('Source: URL, file path, or filename in ingest/dropbox/');
    console.log('');
    console.log('Examples:');
    console.log('  bun ingest --platform SMOGON_SINGLES --generation GEN9 --format OU --month 2023-03 --file sample.txt --dry-run');
    console.log('  bun ingest --platform VGC_OFFICIAL --generation GEN9 --format VGC_REG_H --month 2024-08 --url https://example.com/data.json');
    return;
  }
  
  try {
    console.log('Starting usage data ingestion...');
    console.log(`Platform: ${config.platform}`);
    console.log(`Generation: ${config.generation}`);
    console.log(`Format: ${config.format}`);
    console.log(`Month: ${config.month}`);
    console.log(`Source: ${config.source}`);
    console.log(`Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);
    console.log('');
    
    const result = await cli.ingest(config);
    const report = cli.generateReport(result);
    
    console.log(report);
    
    // Save report
    if (!config.dryRun) {
      cli.saveReport(report);
    }
    
    // Exit with appropriate code
    process.exit(result.success ? 0 : 1);
    
  } catch (error) {
    console.error(`Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseCLIArgs(args: string[]): IngestionConfig | null {
  const config: Partial<IngestionConfig> = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--platform':
        config.platform = args[++i] as Platform;
        break;
      case '--generation':
        config.generation = args[++i] as Generation;
        break;
      case '--format':
        config.format = args[++i] as Format;
        break;
      case '--month':
        config.month = args[++i];
        break;
      case '--source':
      case '--url':
      case '--file':
        config.source = args[++i];
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
    }
  }
  
  // Validate required fields
  if (!config.platform || !config.generation || !config.format || !config.month || !config.source) {
    return null;
  }
  
  return config as IngestionConfig;
}
