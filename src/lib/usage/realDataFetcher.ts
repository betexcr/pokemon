// Real data fetcher for competitive Pokémon usage statistics
// Connects to actual data sources like Smogon, Pikalytics, etc.

import { UsageRow, Platform, Generation, Format } from '@/types/usage';
import { realDataFallback } from './realDataFallback';

interface DataSource {
  name: string;
  baseUrl: string;
  supportedPlatforms: Platform[];
  supportedGenerations: Generation[];
  supportedFormats: Format[];
}

interface FetchOptions {
  platform: Platform;
  generation: Generation;
  format: Format;
  month: string;
  limit?: number;
}

// Data sources configuration
const DATA_SOURCES: Record<string, DataSource> = {
  SMOGON: {
    name: 'Smogon',
    baseUrl: 'https://www.smogon.com/stats',
    supportedPlatforms: ['SMOGON_SINGLES'],
    supportedGenerations: ['GEN5', 'GEN6', 'GEN7', 'GEN8', 'GEN9'],
    supportedFormats: ['OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE']
  },
  PIKALYTICS: {
    name: 'Pikalytics',
    baseUrl: 'https://pikalytics.com/api',
    supportedPlatforms: ['VGC_OFFICIAL'],
    supportedGenerations: ['GEN8', 'GEN9'],
    supportedFormats: ['VGC_REG_A', 'VGC_REG_B', 'VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E', 'VGC_REG_F', 'VGC_REG_G', 'VGC_REG_H', 'VGC_REG_I']
  },
  BSS_API: {
    name: 'Battle Stadium Singles API',
    baseUrl: 'https://bss-api.pokemon.com',
    supportedPlatforms: ['BSS_OFFICIAL'],
    supportedGenerations: ['GEN8', 'GEN9'],
    supportedFormats: ['BSS_SERIES_8', 'BSS_SERIES_9', 'BSS_SERIES_12', 'BSS_SERIES_13', 'BSS_REG_C', 'BSS_REG_D', 'BSS_REG_E', 'BSS_REG_I']
  }
};

export class RealDataFetcher {
  private cache = new Map<string, { data: UsageRow[]; timestamp: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  async fetchUsageData(options: FetchOptions): Promise<UsageRow[]> {
    const cacheKey = this.getCacheKey(options);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`Using cached data for ${cacheKey}`);
      return cached.data;
    }

    try {
      let data: UsageRow[] = [];
      
      switch (options.platform) {
        case 'SMOGON_SINGLES':
          data = await this.fetchSmogonData(options);
          break;
        case 'VGC_OFFICIAL':
          data = await this.fetchVGCData(options);
          break;
        case 'BSS_OFFICIAL':
          data = await this.fetchBSSData(options);
          break;
        default:
          throw new Error(`Unsupported platform: ${options.platform}`);
      }

      // Cache the results
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      
      return data;
    } catch (error) {
      console.error('Error fetching real data:', error);
      throw error;
    }
  }

  private async fetchSmogonData(options: FetchOptions): Promise<UsageRow[]> {
    const { generation, format, month } = options;
    
    try {
      // Construct Smogon URL
      const year = month.split('-')[0];
      const monthNum = month.split('-')[1];
      const formatPath = this.getSmogonFormatPath(generation, format);
      
      const url = `${DATA_SOURCES.SMOGON.baseUrl}/${year}-${monthNum}/${formatPath}.txt`;
      
      console.log(`Fetching Smogon data from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Smogon API error: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      return await this.parseSmogonData(text, generation, format, month);
      
    } catch (error) {
      console.error('Smogon fetch error:', error);
      throw error;
    }
  }

  private async fetchVGCData(options: FetchOptions): Promise<UsageRow[]> {
    const { generation, format, month } = options;
    
    try {
      // Pikalytics API endpoint
      const formatParam = this.getPikalyticsFormat(format);
      const url = `${DATA_SOURCES.PIKALYTICS.baseUrl}/pokedex/${formatParam}`;
      
      console.log(`Fetching VGC data from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Pokemon-Usage-Meta/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Pikalytics API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.parsePikalyticsData(data, generation, format, month);
      
    } catch (error) {
      console.error('VGC fetch error:', error);
      throw error;
    }
  }

  private async fetchBSSData(options: FetchOptions): Promise<UsageRow[]> {
    const { generation, format, month } = options;
    
    try {
      // Battle Stadium Singles API (mock endpoint for now)
      const formatParam = this.getBSSFormat(format);
      const url = `${DATA_SOURCES.BSS_API.baseUrl}/usage/${formatParam}/${month}`;
      
      console.log(`Fetching BSS data from: ${url}`);
      
      // Battle Stadium Singles API (placeholder for real implementation)
      throw new Error('BSS API not yet implemented - real data only');
      
    } catch (error) {
      console.error('BSS fetch error:', error);
      throw error;
    }
  }

  private async parseSmogonData(text: string, generation: Generation, format: Format, month: string): Promise<UsageRow[]> {
    const lines = text.split('\n');
    const usageRows: UsageRow[] = [];
    
    let inDataSection = false;
    let totalBattles = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Extract total battles
      if (trimmed.includes('Total battles:')) {
        const match = trimmed.match(/Total battles: (\d+)/);
        if (match) totalBattles = parseInt(match[1]);
        continue;
      }
      
      // Start of data section
      if (trimmed.includes('Rank') && trimmed.includes('Pokemon')) {
        inDataSection = true;
        continue;
      }
      
      // Parse data lines
      if (inDataSection && trimmed.includes('|')) {
        const parts = trimmed.split('|').map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 6) {
          try {
            const rank = parseInt(parts[0]);
            const pokemonName = parts[1];
            const usagePercent = parseFloat(parts[2]);
            const realCount = parseInt(parts[5]);
            
            // Clean Pokémon name
            const cleanName = this.cleanPokemonName(pokemonName);
            const pokemonId = this.getPokemonId(cleanName);
            
            if (pokemonId) {
              // Fetch real substats data for this Pokémon
              let substats = await this.fetchSmogonSubstats(generation, format, month, cleanName);
              
              // If substats are unavailable, leave as null/undefined (no mock fallback)
              
              const usageRow: UsageRow = {
                pokemonId,
                pokemonName: cleanName,
                month: month as `${number}-${number}`,
                platform: 'SMOGON_SINGLES',
                generation,
                format,
                usagePercent,
                rank,
                sampleSize: realCount,
                substats,
                source: {
                  label: `Smogon ${generation} ${format} usage (${month})`,
                  url: `${DATA_SOURCES.SMOGON.baseUrl}/${month}/${this.getSmogonFormatPath(generation, format)}.txt`,
                  collectedAt: new Date().toISOString()
                }
              };
              
              usageRows.push(usageRow);
            }
          } catch (error) {
            console.warn(`Error parsing Smogon line: ${trimmed}`, error);
          }
        }
      }
    }
    
    console.log(`Parsed ${usageRows.length} Pokémon from Smogon data`);
    return usageRows;
  }

  private parsePikalyticsData(data: any, generation: Generation, format: Format, month: string): UsageRow[] {
    const usageRows: UsageRow[] = [];
    
    if (!data || !Array.isArray(data)) {
      return usageRows;
    }
    
    data.forEach((pokemon: any, index: number) => {
      try {
        const pokemonName = pokemon.name || pokemon.pokemon;
        const usagePercent = parseFloat(pokemon.usage_percent || pokemon.usage || 0);
        const sampleSize = parseInt(pokemon.battles || pokemon.sample_size || 0);
        
        const cleanName = this.cleanPokemonName(pokemonName);
        const pokemonId = this.getPokemonId(cleanName);
        
        if (pokemonId && usagePercent > 0) {
          // Extract real substats from Pikalytics data
          const substats = this.extractPikalyticsSubstats(pokemon);
          
          const usageRow: UsageRow = {
            pokemonId,
            pokemonName: cleanName,
            month: month as `${number}-${number}`,
            platform: 'VGC_OFFICIAL',
            generation,
            format,
            usagePercent,
            rank: index + 1,
            sampleSize,
            substats,
            source: {
              label: `VGC ${format} usage (${month})`,
              url: `${DATA_SOURCES.PIKALYTICS.baseUrl}/pokedex/${this.getPikalyticsFormat(format)}`,
              collectedAt: new Date().toISOString()
            }
          };
          
          usageRows.push(usageRow);
        }
      } catch (error) {
        console.warn(`Error parsing Pikalytics data:`, error);
      }
    });
    
    return usageRows;
  }

  // Helper methods
  private getCacheKey(options: FetchOptions): string {
    return `${options.platform}-${options.generation}-${options.format}-${options.month}`;
  }

  private getMonthName(monthNum: string): string {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const index = months.indexOf(monthNum);
    return index !== -1 ? monthNames[index] : 'jan';
  }

  private getSmogonFormatPath(generation: Generation, format: Format): string {
    const genPrefix = generation.toLowerCase();
    
    // Smogon format mapping with correct naming
    const formatMap: Record<string, string> = {
      'OU': 'ou',
      'UU': 'uu', 
      'RU': 'ru',
      'NU': 'nu',
      'UBERS': 'ubers',
      'PU': 'pu',
      'MONOTYPE': 'monotype',
      'VGC_REG_A': 'vgc2022',
      'VGC_REG_B': 'vgc2023', 
      'VGC_REG_C': 'vgc2023',
      'VGC_REG_D': 'vgc2024',
      'VGC_REG_E': 'vgc2024',
      'BSS_SERIES_13': 'bss',
      'BSS_SERIES_14': 'bss'
    };
    
    const formatSuffix = formatMap[format] || format.toLowerCase();
    
    // Smogon uses format-rank format, we'll use -0 for overall usage
    return `${genPrefix}${formatSuffix}-0`;
  }

  private getPikalyticsFormat(format: Format): string {
    const formatMap: Record<string, string> = {
      'VGC_REG_A': 'series12',
      'VGC_REG_B': 'series13',
      'VGC_REG_C': 'series1',
      'VGC_REG_D': 'series2',
      'VGC_REG_E': 'series3',
      'VGC_REG_F': 'series4',
      'VGC_REG_G': 'series5',
      'VGC_REG_H': 'series6',
      'VGC_REG_I': 'series7'
    };
    
    return formatMap[format] || 'series1';
  }

  private getBSSFormat(format: Format): string {
    return format.toLowerCase().replace('bss_', '');
  }

  private cleanPokemonName(name: string): string {
    return name
      .replace(/[♀♂]/g, '') // Remove gender symbols
      .replace(/-Mega$/, '') // Remove Mega suffix
      .replace(/-Primal$/, '') // Remove Primal suffix
      .replace(/-Alola$/, '-Alolan') // Standardize Alola form
      .replace(/-Galar$/, '-Galarian') // Standardize Galar form
      .replace(/-Hisui$/, '-Hisuian') // Standardize Hisui form
      .replace(/-Paldea$/, '-Paldean') // Standardize Paldea form
      .trim();
  }

  private async fetchSmogonSubstats(generation: Generation, format: Format, month: string, pokemonName: string): Promise<any> {
    try {
      const year = month.split('-')[0];
      const monthNum = month.split('-')[1];
      const formatPath = this.getSmogonFormatPath(generation, format);
      
      // Fetch moves data
      const movesUrl = `${DATA_SOURCES.SMOGON.baseUrl}/${year}-${monthNum}/${formatPath}-moveset.txt`;
      const movesData = await this.parseSmogonSubstatsFile(movesUrl, pokemonName, 'moves');
      
      // Fetch items data  
      const itemsUrl = `${DATA_SOURCES.SMOGON.baseUrl}/${year}-${monthNum}/${formatPath}-items.txt`;
      const itemsData = await this.parseSmogonSubstatsFile(itemsUrl, pokemonName, 'items');
      
      // Fetch abilities data
      const abilitiesUrl = `${DATA_SOURCES.SMOGON.baseUrl}/${year}-${monthNum}/${formatPath}-abilities.txt`;
      const abilitiesData = await this.parseSmogonSubstatsFile(abilitiesUrl, pokemonName, 'abilities');
      
      return {
        moves: movesData,
        items: itemsData,
        abilities: abilitiesData
      };
    } catch (error) {
      console.warn(`Error fetching substats for ${pokemonName}:`, error);
      return null;
    }
  }

  private async parseSmogonSubstatsFile(url: string, pokemonName: string, type: 'moves' | 'items' | 'abilities'): Promise<{ name: string; pct: number }[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n');
      
      let inPokemonSection = false;
      const results: { name: string; pct: number }[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        // Check if we're entering this Pokémon's section
        if (trimmed.includes('|') && trimmed.toLowerCase().includes(pokemonName.toLowerCase())) {
          inPokemonSection = true;
          continue;
        }
        
        // Check if we're exiting this Pokémon's section
        if (inPokemonSection && trimmed.includes('|') && !trimmed.toLowerCase().includes(pokemonName.toLowerCase())) {
          break;
        }
        
        // Parse substats data
        if (inPokemonSection && trimmed.includes('|')) {
          const parts = trimmed.split('|').map(p => p.trim()).filter(p => p);
          
          if (parts.length >= 2) {
            try {
              const name = parts[0];
              const pct = parseFloat(parts[1]);
              
              if (name && !isNaN(pct) && pct > 0) {
                results.push({ name, pct });
              }
            } catch (error) {
              console.warn(`Error parsing substats line: ${trimmed}`, error);
            }
          }
        }
      }
      
      return results.slice(0, 10); // Limit to top 10
    } catch (error) {
      console.warn(`Error fetching ${type} data from ${url}:`, error);
      return [];
    }
  }

  private extractPikalyticsSubstats(pokemon: any): any {
    try {
      const moves = pokemon.moves ? pokemon.moves.map((move: any) => ({
        name: move.name || move.move,
        pct: parseFloat(move.usage_percent || move.usage || 0)
      })).filter((move: any) => move.pct > 0) : [];
      
      const items = pokemon.items ? pokemon.items.map((item: any) => ({
        name: item.name || item.item,
        pct: parseFloat(item.usage_percent || item.usage || 0)
      })).filter((item: any) => item.pct > 0) : [];
      
      const abilities = pokemon.abilities ? pokemon.abilities.map((ability: any) => ({
        name: ability.name || ability.ability,
        pct: parseFloat(ability.usage_percent || ability.usage || 0)
      })).filter((ability: any) => ability.pct > 0) : [];
      
      return {
        moves: moves.slice(0, 10),
        items: items.slice(0, 10),
        abilities: abilities.slice(0, 5)
      };
    } catch (error) {
      console.warn('Error extracting Pikalytics substats:', error);
      return null;
    }
  }

  private getPokemonId(name: string): number {
    // Comprehensive Pokémon ID mapping
    const pokemonIds: Record<string, number> = {
      // Gen 9 Pokémon
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
      'Sandy Shocks': 990,
      'Iron Leaves': 1007,
      'Walking Wake': 1008,
      'Gouging Fire': 1009,
      'Raging Bolt': 1010,
      'Iron Boulder': 1011,
      'Iron Crown': 1012,
      
      // Gen 8 Pokémon
      'Dragapult': 887,
      'Corviknight': 823,
      'Toxtricity': 849,
      'Snom': 872,
      'Frosmoth': 873,
      'Cinderace': 815,
      'Inteleon': 818,
      'Rillaboom': 812,
      
      // Popular competitive Pokémon
      'Landorus-Therian': 645,
      'Heatran': 485,
      'Ferrothorn': 598,
      'Rotom-Wash': 479,
      'Toxapex': 748,
      'Clefable': 36,
      'Slowbro': 80,
      'Slowking': 199,
      'Garchomp': 445,
      'Dragonite': 149,
      'Tyranitar': 248,
      'Metagross': 376,
      'Scizor': 212,
      'Skarmory': 227,
      'Blissey': 242,
      'Chansey': 113,
      'Gengar': 94,
      'Alakazam': 65,
      'Mewtwo': 150,
      'Mew': 151,
      'Celebi': 251,
      'Jirachi': 385,
      'Deoxys': 386,
      'Rayquaza': 384,
      'Groudon': 383,
      'Kyogre': 382,
      
      // Starter Pokémon
      'Charizard': 6,
      'Venusaur': 3,
      'Blastoise': 9,
      'Pikachu': 25,
      'Raichu': 26,
      'Eevee': 133,
      'Vaporeon': 134,
      'Jolteon': 135,
      'Flareon': 136,
      'Espeon': 196,
      'Umbreon': 197,
      'Leafeon': 470,
      'Glaceon': 471,
      'Sylveon': 700,
      
      // Other popular Pokémon
      'Lucario': 448,
      'Gardevoir': 282,
      'Mimikyu': 778,
      'Aegislash': 681,
      'Talonflame': 663,
      'Greninja': 658,
      'Infernape': 392,
      'Empoleon': 395,
      'Torterra': 389,
      'Salamence': 373,
      'Conkeldurr': 534,
      'Excadrill': 530,
      'Breloom': 286,
      'Gliscor': 472,
      'Jellicent': 593,
      'Reuniclus': 579,
      'Chandelure': 609,
      'Zoroark': 571,
      'Galvantula': 596,
      'Ferroseed': 597,
      'Litwick': 607,
      'Axew': 610,
      'Cubchoo': 613,
      'Cryogonal': 615,
      'Shelmet': 616,
      'Stunfisk': 618,
      'Mienfoo': 619,
      'Druddigon': 621,
      'Golett': 622,
      'Pawniard': 624,
      'Bouffalant': 626,
      'Rufflet': 627,
      'Vullaby': 629,
      'Heatmor': 631,
      'Durant': 632,
      'Deino': 633,
      'Larvesta': 636,
      'Cobalion': 638,
      'Terrakion': 639,
      'Virizion': 640,
      'Tornadus': 641,
      'Thundurus': 642,
      'Reshiram': 643,
      'Zekrom': 644,
      'Landorus': 645,
      'Kyurem': 646,
      'Keldeo': 647,
      'Meloetta': 648,
      'Genesect': 649,
      'Victini': 494,
      'Snivy': 495,
      'Servine': 496,
      'Serperior': 497,
      'Tepig': 498,
      'Pignite': 499,
      'Emboar': 500,
      'Oshawott': 501,
      'Dewott': 502,
      'Samurott': 503,
      'Patrat': 504,
      'Watchog': 505,
      'Lillipup': 506,
      'Herdier': 507,
      'Stoutland': 508,
      'Purrloin': 509,
      'Liepard': 510,
      'Pansage': 511,
      'Simisage': 512,
      'Pansear': 513,
      'Simisear': 514,
      'Panpour': 515,
      'Simipour': 516,
      'Munna': 517,
      'Musharna': 518,
      'Pidove': 519,
      'Tranquill': 520,
      'Unfezant': 521,
      'Blitzle': 522,
      'Zebstrika': 523,
      'Roggenrola': 524,
      'Boldore': 525,
      'Gigalith': 526,
      'Woobat': 527,
      'Swoobat': 528,
      'Drilbur': 529,
      'Audino': 531,
      'Timburr': 532,
      'Gurdurr': 533,
      'Tympole': 535,
      'Palpitoad': 536,
      'Seismitoad': 537,
      'Throh': 538,
      'Sawk': 539,
      'Sewaddle': 540,
      'Swadloon': 541,
      'Leavanny': 542,
      'Venipede': 543,
      'Whirlipede': 544,
      'Scolipede': 545,
      'Cottonee': 546,
      'Whimsicott': 547,
      'Petilil': 548,
      'Lilligant': 549,
      'Basculin': 550,
      'Sandile': 551,
      'Krokorok': 552,
      'Darumaka': 554,
      'Maractus': 556,
      'Dwebble': 557,
      'Crustle': 558,
      'Scraggy': 559,
      'Scrafty': 560,
      'Sigilyph': 561,
      'Yamask': 562,
      'Cofagrigus': 563,
      'Tirtouga': 564,
      'Carracosta': 565,
      'Archen': 566,
      'Archeops': 567,
      'Trubbish': 568,
      'Garbodor': 569,
      'Zorua': 570,
      'Minccino': 572,
      'Cinccino': 573,
      'Gothita': 574,
      'Gothorita': 575,
      'Gothitelle': 576,
      'Solosis': 577,
      'Duosion': 578,
      'Ducklett': 580,
      'Swanna': 581,
      'Vanillite': 582,
      'Vanillish': 583,
      'Vanilluxe': 584,
      'Deerling': 585,
      'Sawsbuck': 586,
      'Emolga': 587,
      'Karrablast': 588,
      'Escavalier': 589,
      'Foongus': 590,
      'Amoonguss': 591,
      'Frillish': 592,
      'Alomomola': 594,
      'Joltik': 595,
      'Klink': 599,
      'Klang': 600,
      'Klinklang': 601,
      'Tynamo': 602,
      'Eelektrik': 603,
      'Eelektross': 604,
      'Elgyem': 605,
      'Beheeyem': 606,
      'Lampent': 608,
      'Fraxure': 611,
      'Haxorus': 612,
      'Beartic': 614,
      'Accelgor': 617,
      'Mienshao': 620,
      'Golurk': 623,
      'Bisharp': 625,
      'Braviary': 628,
      'Mandibuzz': 630,
      'Zweilous': 634,
      
      // Gen 1 Pokémon
      'Bulbasaur': 1,
      'Ivysaur': 2,
      'Charmander': 4,
      'Charmeleon': 5,
      'Squirtle': 7,
      'Wartortle': 8,
      'Caterpie': 10,
      'Metapod': 11,
      'Butterfree': 12,
      'Weedle': 13,
      'Kakuna': 14,
      'Beedrill': 15,
      'Pidgey': 16,
      'Pidgeotto': 17,
      'Pidgeot': 18,
      'Rattata': 19,
      'Raticate': 20,
      'Spearow': 21,
      'Fearow': 22,
      'Ekans': 23,
      'Arbok': 24,
      'Sandshrew': 27,
      'Sandslash': 28,
      'Nidoran-F': 29,
      'Nidorina': 30,
      'Nidoqueen': 31,
      'Nidoran-M': 32,
      'Nidorino': 33,
      'Nidoking': 34,
      'Clefairy': 35,
      'Vulpix': 37,
      'Ninetales': 38,
      'Jigglypuff': 39,
      'Wigglytuff': 40,
      'Zubat': 41,
      'Golbat': 42,
      'Oddish': 43,
      'Gloom': 44,
      'Vileplume': 45,
      'Paras': 46,
      'Parasect': 47,
      'Venonat': 48,
      'Venomoth': 49,
      'Diglett': 50,
      'Dugtrio': 51,
      'Meowth': 52,
      'Persian': 53,
      'Psyduck': 54,
      'Golduck': 55,
      'Mankey': 56,
      'Primeape': 57,
      'Growlithe': 58,
      'Arcanine': 59,
      'Poliwag': 60,
      'Poliwhirl': 61,
      'Poliwrath': 62,
      'Abra': 63,
      'Kadabra': 64,
      'Machop': 66,
      'Machoke': 67,
      'Machamp': 68,
      'Bellsprout': 69,
      'Weepinbell': 70,
      'Victreebel': 71,
      'Tentacool': 72,
      'Tentacruel': 73,
      'Geodude': 74,
      'Graveler': 75,
      'Golem': 76,
      'Ponyta': 77,
      'Rapidash': 78,
      'Slowpoke': 79,
      'Magnemite': 81,
      'Magneton': 82,
      'Farfetch\'d': 83,
      'Doduo': 84,
      'Dodrio': 85,
      'Seel': 86,
      'Dewgong': 87,
      'Grimer': 88,
      'Muk': 89,
      'Shellder': 90,
      'Cloyster': 91,
      'Gastly': 92,
      'Haunter': 93,
      'Onix': 95,
      'Drowzee': 96,
      'Hypno': 97,
      'Krabby': 98,
      'Kingler': 99,
      'Voltorb': 100,
      'Electrode': 101,
      'Exeggcute': 102,
      'Exeggutor': 103,
      'Cubone': 104,
      'Marowak': 105,
      'Hitmonlee': 106,
      'Hitmonchan': 107,
      'Lickitung': 108,
      'Koffing': 109,
      'Weezing': 110,
      'Rhyhorn': 111,
      'Rhydon': 112,
      'Tangela': 114,
      'Kangaskhan': 115,
      'Horsea': 116,
      'Seadra': 117,
      'Goldeen': 118,
      'Seaking': 119,
      'Staryu': 120,
      'Starmie': 121,
      'Mr. Mime': 122,
      'Scyther': 123,
      'Jynx': 124,
      'Electabuzz': 125,
      'Magmar': 126,
      'Pinsir': 127,
      'Tauros': 128,
      'Magikarp': 129,
      'Gyarados': 130,
      'Lapras': 131,
      'Ditto': 132,
      'Porygon': 137,
      'Omanyte': 138,
      'Omastar': 139,
      'Kabuto': 140,
      'Kabutops': 141,
      'Aerodactyl': 142,
      'Snorlax': 143,
      'Articuno': 144,
      'Zapdos': 145,
      'Moltres': 146,
      'Dratini': 147,
      'Dragonair': 148,
    };
    
    return pokemonIds[name] || 0;
  }
}

export const realDataFetcher = new RealDataFetcher();