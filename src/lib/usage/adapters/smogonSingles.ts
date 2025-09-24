// Smogon/Showdown Singles usage data adapter
// Parses text/CSV files from Smogon usage statistics

import { AbstractAdapter } from './base';
import { 
  UsageRow, 
  Platform, 
  Generation, 
  Format, 
  IngestionConfig
} from '@/types/usage';
import { AdapterResult } from './base';
import { canonicalizePokemonName, isTop50Pokemon, getTop50PokemonIds } from '../canonicalize';

export class SmogonSinglesAdapter extends AbstractAdapter {
  
  canHandle(config: IngestionConfig): boolean {
    return config.platform === 'SMOGON_SINGLES';
  }
  
  getSupportedFormats(): Format[] {
    return ['OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE'];
  }
  
  getSupportedGenerations(): Generation[] {
    return ['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'];
  }
  
  async parse(config: IngestionConfig, content: string): Promise<AdapterResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rows: UsageRow[] = [];
    
    // Validate config
    const configErrors = this.validateConfig(config);
    if (configErrors.length > 0) {
      return {
        rows: [],
        errors: configErrors,
        warnings: [],
        metadata: {
          totalRows: 0,
          top50Rows: 0,
          missingTop50: []
        }
      };
    }
    
    try {
      // Detect format and parse accordingly
      if (this.isCSVFormat(content)) {
        return await this.parseCSV(content);
      } else if (this.isTextFormat(content)) {
        return await this.parseText(content);
      } else {
        errors.push('Unsupported file format. Expected CSV or text table.');
        return {
          rows: [],
          errors,
          warnings,
          metadata: {
            totalRows: 0,
            top50Rows: 0,
            missingTop50: []
          }
        };
      }
    } catch (error) {
      errors.push(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        rows: [],
        errors,
        warnings,
        metadata: {
          totalRows: 0,
          top50Rows: 0,
          missingTop50: []
        }
      };
    }
  }
  
  private isCSVFormat(content: string): boolean {
    const lines = content.split('\n').slice(0, 5);
    return lines.some(line => line.includes(',') && line.split(',').length >= 3);
  }
  
  private isTextFormat(content: string): boolean {
    const lines = content.split('\n').slice(0, 10);
    return lines.some(line => 
      line.includes('|') || 
      (line.includes('%') && line.match(/\d+\.\d+%/))
    );
  }
  
  private async parseCSV(content: string): Promise<AdapterResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rows: UsageRow[] = [];
    const top50Ids = new Set(getTop50PokemonIds());
    const processedPokemon = new Set<string>();
    
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      errors.push('CSV file must have at least a header and one data row');
      return this.createResult(rows, errors, warnings, processedPokemon);
    }
    
    // Parse header to find column indices
    const header = lines[0].split(',').map(col => col.trim().toLowerCase());
    const rankIndex = this.findColumnIndex(header, ['rank', '#']);
    const nameIndex = this.findColumnIndex(header, ['pokemon', 'name', 'pokémon']);
    const usageIndex = this.findColumnIndex(header, ['usage', '%', 'usage%']);
    const sampleIndex = this.findColumnIndex(header, ['raw', 'raw usage', 'sample', 'battles']);
    
    if (rankIndex === -1 || nameIndex === -1 || usageIndex === -1) {
      errors.push('Required columns not found. Expected: rank, pokemon name, usage percentage');
      return this.createResult(rows, errors, warnings, processedPokemon);
    }
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const columns = this.parseCSVLine(lines[i]);
        if (columns.length < Math.max(rankIndex, nameIndex, usageIndex) + 1) {
          warnings.push(`Row ${i + 1}: Insufficient columns, skipping`);
          continue;
        }
        
        const rank = this.parseRank(columns[rankIndex]);
        const rawName = columns[nameIndex].trim();
        const usagePercent = this.parsePercentage(columns[usageIndex]);
        const sampleSize = sampleIndex !== -1 ? this.parseSampleSize(columns[sampleIndex]) : undefined;
        
        const canonicalName = canonicalizePokemonName(rawName);
        if (!canonicalName) {
          warnings.push(`Row ${i + 1}: Unknown Pokémon name: ${rawName}`);
          continue;
        }
        
        const pokemonId = this.getPokemonIdFromName(canonicalName);
        if (!pokemonId) {
          warnings.push(`Row ${i + 1}: Could not resolve ID for: ${canonicalName}`);
          continue;
        }
        
        // Skip if not in Top 50 (but still count for rank calculation)
        if (!top50Ids.has(pokemonId)) {
          continue;
        }
        
        // Check for duplicates
        if (processedPokemon.has(canonicalName)) {
          warnings.push(`Row ${i + 1}: Duplicate Pokémon: ${canonicalName}`);
          continue;
        }
        
        const row = this.createUsageRow(pokemonId, canonicalName, usagePercent, rank, sampleSize);
        const rowErrors = this.validateUsageRow(row);
        
        if (rowErrors.length > 0) {
          errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
          continue;
        }
        
        rows.push(row);
        processedPokemon.add(canonicalName);
        
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }
    
    return this.createResult(rows, errors, warnings, processedPokemon);
  }
  
  private async parseText(content: string): Promise<AdapterResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rows: UsageRow[] = [];
    const top50Ids = new Set(getTop50PokemonIds());
    const processedPokemon = new Set<string>();
    
    const lines = content.split('\n').filter(line => line.trim());
    
    // Find header line
    let headerLineIndex = -1;
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (this.isHeaderLine(lines[i])) {
        headerLineIndex = i;
        break;
      }
    }
    
    if (headerLineIndex === -1) {
      errors.push('Could not find header line in text format');
      return this.createResult(rows, errors, warnings, processedPokemon);
    }
    
    // Parse header to determine column positions
    const headerLine = lines[headerLineIndex];
    const headerPositions = this.parseTextHeader(headerLine);
    
    // Parse data rows
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('|') || line.includes('---')) {
        continue; // Skip separator lines
      }
      
      try {
        const data = this.parseTextLine(line, headerPositions);
        if (!data) continue;
        
        const { rank, name, usage, sample } = data;
        
        const canonicalName = canonicalizePokemonName(name);
        if (!canonicalName) {
          warnings.push(`Line ${i + 1}: Unknown Pokémon name: ${name}`);
          continue;
        }
        
        const pokemonId = this.getPokemonIdFromName(canonicalName);
        if (!pokemonId) {
          warnings.push(`Line ${i + 1}: Could not resolve ID for: ${canonicalName}`);
          continue;
        }
        
        // Skip if not in Top 50
        if (!top50Ids.has(pokemonId)) {
          continue;
        }
        
        // Check for duplicates
        if (processedPokemon.has(canonicalName)) {
          warnings.push(`Line ${i + 1}: Duplicate Pokémon: ${canonicalName}`);
          continue;
        }
        
        const row = this.createUsageRow(pokemonId, canonicalName, usage, rank, sample);
        const rowErrors = this.validateUsageRow(row);
        
        if (rowErrors.length > 0) {
          errors.push(`Line ${i + 1}: ${rowErrors.join(', ')}`);
          continue;
        }
        
        rows.push(row);
        processedPokemon.add(canonicalName);
        
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }
    
    return this.createResult(rows, errors, warnings, processedPokemon);
  }
  
  private isHeaderLine(line: string): boolean {
    const lower = line.toLowerCase();
    return (
      lower.includes('rank') && 
      (lower.includes('pokemon') || lower.includes('name')) && 
      (lower.includes('usage') || lower.includes('%'))
    );
  }
  
  private parseTextHeader(headerLine: string): { rank: number; name: number; usage: number; sample?: number } {
    const columns = headerLine.split(/\s+/).map(col => col.toLowerCase());
    
    return {
      rank: this.findColumnIndex(columns, ['rank', '#']),
      name: this.findColumnIndex(columns, ['pokemon', 'name', 'pokémon']),
      usage: this.findColumnIndex(columns, ['usage', '%', 'usage%']),
      sample: this.findColumnIndex(columns, ['raw', 'raw usage', 'sample', 'battles']) !== -1 
        ? this.findColumnIndex(columns, ['raw', 'raw usage', 'sample', 'battles']) 
        : undefined
    };
  }
  
  private parseTextLine(line: string, positions: { rank: number; name: number; usage: number; sample?: number }): {
    rank: number;
    name: string;
    usage: number;
    sample?: number;
  } | null {
    const columns = line.split(/\s+/);
    
    if (columns.length < Math.max(positions.rank, positions.name, positions.usage) + 1) {
      return null;
    }
    
    try {
      const rank = this.parseRank(columns[positions.rank]);
      const name = columns[positions.name].trim();
      const usage = this.parsePercentage(columns[positions.usage]);
      const sample = positions.sample !== undefined ? this.parseSampleSize(columns[positions.sample]) : undefined;
      
      return { rank, name, usage, sample };
    } catch (error) {
      throw new Error(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  private findColumnIndex(columns: string[], searchTerms: string[]): number {
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      if (searchTerms.some(term => col.includes(term))) {
        return i;
      }
    }
    return -1;
  }
  
  private getPokemonIdFromName(name: string): number | null {
    // This would typically use a more comprehensive mapping
    // For now, we'll use a simple lookup
    const mapping: Record<string, number> = {
      'Pikachu': 25,
      'Charizard': 6,
      'Greninja': 658,
      'Eevee': 133,
      'Lucario': 448,
      'Umbreon': 197,
      'Mimikyu': 778,
      'Gardevoir': 282,
      'Gengar': 94,
      'Sylveon': 700,
      'Rayquaza': 384,
      'Garchomp': 445,
      'Dragonite': 149,
      'Bulbasaur': 1,
      'Squirtle': 7,
      'Blastoise': 9,
      'Snorlax': 143,
      'Tyranitar': 248,
      'Metagross': 376,
      'Infernape': 392,
      'Rowlet': 722,
      'Decidueye': 724,
      'Cinderace': 815,
      'Dragapult': 887,
      'Luxray': 405,
      'Zoroark': 571,
      'Absol': 359,
      'Scizor': 212,
      'Darkrai': 491,
      'Alolan Ninetales': 10103,
      'Arcanine': 59,
      'Suicune': 245,
      'Chandelure': 609,
      'Sceptile': 254,
      'Flygon': 330,
      'Lapras': 131,
      'Ditto': 132,
      'Jigglypuff': 39,
      'Incineroar': 727,
      'Serperior': 497,
      'Alakazam': 65,
      'Crobat': 169,
      'Mewtwo': 150,
      'Mew': 151,
      'Celebi': 251,
      'Toxtricity': 849,
      'Corviknight': 823,
      'Snom': 872,
      'Blaziken': 257,
      'Landorus-Therian': 645,
      'Great Tusk': 984,
      'Iron Treads': 989,
      'Iron Hands': 992,
      'Iron Jugulis': 993,
      'Iron Moth': 994,
      'Iron Thorns': 995,
      'Iron Bundle': 991,
      'Iron Valiant': 1006,
      'Roaring Moon': 1005,
      'Flutter Mane': 987,
      'Scream Tail': 985,
      'Brute Bonnet': 986,
      'Slither Wing': 988,
      'Sandy Shocks': 989
    };
    
    return mapping[name] || null;
  }
  
  private createResult(
    rows: UsageRow[], 
    errors: string[], 
    warnings: string[], 
    processedPokemon: Set<string>
  ): AdapterResult {
    const top50Ids = getTop50PokemonIds();
    const missingTop50 = top50Ids
      .map(id => this.getPokemonNameFromId(id))
      .filter(name => name && !processedPokemon.has(name)) as string[];
    
    return {
      rows,
      errors,
      warnings,
      metadata: {
        totalRows: rows.length,
        top50Rows: rows.length,
        missingTop50
      }
    };
  }
  
  private getPokemonNameFromId(id: number): string | null {
    // Simple reverse lookup - in production, use a proper mapping
    const mapping: Record<number, string> = {
      25: 'Pikachu',
      6: 'Charizard',
      658: 'Greninja',
      133: 'Eevee',
      448: 'Lucario',
      197: 'Umbreon',
      778: 'Mimikyu',
      282: 'Gardevoir',
      94: 'Gengar',
      700: 'Sylveon',
      384: 'Rayquaza',
      445: 'Garchomp',
      149: 'Dragonite',
      1: 'Bulbasaur',
      7: 'Squirtle',
      9: 'Blastoise',
      143: 'Snorlax',
      248: 'Tyranitar',
      376: 'Metagross',
      392: 'Infernape',
      722: 'Rowlet',
      724: 'Decidueye',
      815: 'Cinderace',
      887: 'Dragapult',
      405: 'Luxray',
      571: 'Zoroark',
      359: 'Absol',
      212: 'Scizor',
      491: 'Darkrai',
      10103: 'Alolan Ninetales',
      59: 'Arcanine',
      245: 'Suicune',
      609: 'Chandelure',
      254: 'Sceptile',
      330: 'Flygon',
      131: 'Lapras',
      132: 'Ditto',
      39: 'Jigglypuff',
      727: 'Incineroar',
      497: 'Serperior',
      65: 'Alakazam',
      169: 'Crobat',
      150: 'Mewtwo',
      151: 'Mew',
      251: 'Celebi',
      849: 'Toxtricity',
      823: 'Corviknight',
      872: 'Snom',
      257: 'Blaziken',
      645: 'Landorus-Therian',
      984: 'Great Tusk',
      989: 'Iron Treads',
      992: 'Iron Hands',
      993: 'Iron Jugulis',
      994: 'Iron Moth',
      995: 'Iron Thorns',
      991: 'Iron Bundle',
      1006: 'Iron Valiant',
      1005: 'Roaring Moon',
      987: 'Flutter Mane',
      985: 'Scream Tail',
      986: 'Brute Bonnet',
      988: 'Slither Wing'
    };
    
    return mapping[id] || null;
  }
}
