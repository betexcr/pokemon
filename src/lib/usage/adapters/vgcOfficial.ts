// VGC (Video Game Championships) Official usage data adapter
// Parses data from Pikalytics, Victory Road, and official VGC sources

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

export class VGCOfficialAdapter extends AbstractAdapter {
  
  canHandle(config: IngestionConfig): boolean {
    return config.platform === 'VGC_OFFICIAL';
  }
  
  getSupportedFormats(): Format[] {
    return [
      'VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 
      'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I'
    ];
  }
  
  getSupportedGenerations(): Generation[] {
    return ['GEN8', 'GEN9'];
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
      if (this.isJSONFormat(content)) {
        return await this.parseJSON(content);
      } else if (this.isCSVFormat(content)) {
        return await this.parseCSV(content);
      } else if (this.isHTMLFormat(content)) {
        return await this.parseHTML(content);
      } else {
        errors.push('Unsupported file format. Expected JSON, CSV, or HTML.');
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
  
  private isJSONFormat(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }
  
  private isCSVFormat(content: string): boolean {
    const lines = content.split('\n').slice(0, 5);
    return lines.some(line => line.includes(',') && line.split(',').length >= 3);
  }
  
  private isHTMLFormat(content: string): boolean {
    return content.includes('<html') || content.includes('<table') || content.includes('<div');
  }
  
  private async parseJSON(content: string): Promise<AdapterResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const rows: UsageRow[] = [];
    const top50Ids = new Set(getTop50PokemonIds());
    const processedPokemon = new Set<string>();
    
    try {
      const data = JSON.parse(content);
      
      // Handle different JSON structures
      let usageData: any[] = [];
      
      if (Array.isArray(data)) {
        usageData = data;
      } else if (data.usage && Array.isArray(data.usage)) {
        usageData = data.usage;
      } else if (data.data && Array.isArray(data.data)) {
        usageData = data.data;
      } else if (data.pokemon && Array.isArray(data.pokemon)) {
        usageData = data.pokemon;
      } else {
        errors.push('Unknown JSON structure. Expected array or object with usage/data/pokemon array.');
        return this.createResult(rows, errors, warnings, processedPokemon);
      }
      
      // Parse each Pokémon entry
      for (let i = 0; i < usageData.length; i++) {
        try {
          const entry = usageData[i];
          const row = this.parseJSONEntry(entry, i + 1);
          
          if (!row) continue;
          
          // Skip if not in Top 50
          if (!top50Ids.has(row.pokemonId)) {
            continue;
          }
          
          // Check for duplicates
          if (processedPokemon.has(row.pokemonName)) {
            warnings.push(`Entry ${i + 1}: Duplicate Pokémon: ${row.pokemonName}`);
            continue;
          }
          
          const rowErrors = this.validateUsageRow(row);
          if (rowErrors.length > 0) {
            errors.push(`Entry ${i + 1}: ${rowErrors.join(', ')}`);
            continue;
          }
          
          rows.push(row);
          processedPokemon.add(row.pokemonName);
          
        } catch (error) {
          errors.push(`Entry ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }
      
    } catch (error) {
      errors.push(`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return this.createResult(rows, errors, warnings, processedPokemon);
  }
  
  private parseJSONEntry(entry: any, index: number): UsageRow | null {
    try {
      // Handle different field names
      const name = entry.name || entry.pokemon || entry.pokemon_name || entry.pokemonName;
      const usage = entry.usage || entry.usage_percent || entry.usagePercent || entry.percent;
      const rank = entry.rank || entry.position || entry.pos;
      const sample = entry.sample || entry.battles || entry.raw || entry.raw_usage;
      
      if (!name || usage === undefined || rank === undefined) {
        throw new Error(`Missing required fields: name=${!!name}, usage=${usage !== undefined}, rank=${rank !== undefined}`);
      }
      
      const canonicalName = canonicalizePokemonName(name);
      if (!canonicalName) {
        throw new Error(`Unknown Pokémon name: ${name}`);
      }
      
      const pokemonId = this.getPokemonIdFromName(canonicalName);
      if (!pokemonId) {
        throw new Error(`Could not resolve ID for: ${canonicalName}`);
      }
      
      // Parse substats if available
      const substats = this.parseSubstats(entry);
      
      return this.createUsageRow(
        pokemonId,
        canonicalName,
        this.parsePercentage(usage.toString()),
        this.parseRank(rank),
        sample ? this.parseSampleSize(sample.toString()) : undefined,
        substats
      );
      
    } catch (error) {
      throw new Error(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private parseSubstats(entry: any): any {
    const substats: any = {};
    
    // Parse moves
    if (entry.moves && Array.isArray(entry.moves)) {
      substats.moves = entry.moves.map((move: any) => ({
        name: move.name || move.move,
        pct: typeof move.usage === 'number' ? move.usage : this.parsePercentage(move.usage?.toString() || '0')
      }));
    }
    
    // Parse items
    if (entry.items && Array.isArray(entry.items)) {
      substats.items = entry.items.map((item: any) => ({
        name: item.name || item.item,
        pct: typeof item.usage === 'number' ? item.usage : this.parsePercentage(item.usage?.toString() || '0')
      }));
    }
    
    // Parse abilities
    if (entry.abilities && Array.isArray(entry.abilities)) {
      substats.abilities = entry.abilities.map((ability: any) => ({
        name: ability.name || ability.ability,
        pct: typeof ability.usage === 'number' ? ability.usage : this.parsePercentage(ability.usage?.toString() || '0')
      }));
    }
    
    // Parse Tera Types (Gen 9 specific)
    if (entry.tera_types && Array.isArray(entry.tera_types)) {
      substats.teraTypes = entry.tera_types.map((tera: any) => ({
        name: tera.name || tera.type,
        pct: typeof tera.usage === 'number' ? tera.usage : this.parsePercentage(tera.usage?.toString() || '0')
      }));
    }
    
    // Parse teammates
    if (entry.teammates && Array.isArray(entry.teammates)) {
      substats.teammates = entry.teammates.map((teammate: any) => ({
        name: teammate.name || teammate.pokemon,
        pct: typeof teammate.usage === 'number' ? teammate.usage : this.parsePercentage(teammate.usage?.toString() || '0')
      }));
    }
    
    return Object.keys(substats).length > 0 ? substats : undefined;
  }
  
  private async parseCSV(content: string): Promise<AdapterResult> {
    // Similar to Smogon adapter but with VGC-specific column names
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
    
    // Parse header
    const header = lines[0].split(',').map(col => col.trim().toLowerCase());
    const rankIndex = this.findColumnIndex(header, ['rank', '#', 'position']);
    const nameIndex = this.findColumnIndex(header, ['pokemon', 'name', 'pokémon', 'pokemon_name']);
    const usageIndex = this.findColumnIndex(header, ['usage', '%', 'usage%', 'usage_percent']);
    const sampleIndex = this.findColumnIndex(header, ['raw', 'raw usage', 'sample', 'battles', 'usage_raw']);
    
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
        
        // Skip if not in Top 50
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
  
  private async parseHTML(content: string): Promise<AdapterResult> {
    // For HTML parsing, we'd typically use a library like cheerio
    // For now, we'll implement basic table parsing
    const errors: string[] = [];
    const warnings: string[] = [];
    const rows: UsageRow[] = [];
    
    errors.push('HTML parsing not yet implemented');
    
    return {
      rows,
      errors,
      warnings,
      metadata: {
        totalRows: 0,
        top50Rows: 0,
        missingTop50: []
      }
    };
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
    // Use the same mapping as Smogon adapter
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
      'Sandy Shocks': 989,
      'Urshifu-Rapid-Strike': 892,
      'Urshifu-Single-Strike': 892,
      'Ursaluna-Bloodmoon': 901,
      'Ogerpon-Wellspring': 1017,
      'Ogerpon-Hearthflame': 1017,
      'Ogerpon-Cornerstone': 1017,
      'Ogerpon-Teal': 1017
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
    // Simple reverse lookup
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
      988: 'Slither Wing',
      892: 'Urshifu-Rapid-Strike',
      901: 'Ursaluna-Bloodmoon',
      1017: 'Ogerpon-Teal'
    };
    
    return mapping[id] || null;
  }
}
