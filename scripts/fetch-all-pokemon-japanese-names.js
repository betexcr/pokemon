#!/usr/bin/env node

/**
 * Script to fetch all Pokemon from the PokeAPI and populate the Japanese names database
 */

const fs = require('fs');
const path = require('path');
const { getJapaneseNameMeaning } = require('./japanese-name-meanings.js');

// PokeAPI base URL
const API_BASE_URL = 'https://pokeapi.co/api/v2';

// Fetch function with error handling
async function fetchFromAPI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
}

// Get Pokemon species data (includes Japanese names)
async function getPokemonSpecies(pokemonId) {
  const url = `${API_BASE_URL}/pokemon-species/${pokemonId}`;
  return await fetchFromAPI(url);
}

// Extract Japanese name from species data
function extractJapaneseName(speciesData) {
  const japaneseNameEntry = speciesData.names?.find(name => name.language.name === 'ja-hrkt');
  return japaneseNameEntry ? japaneseNameEntry.name : null;
}

// Generate romaji from Japanese name (basic conversion)
function generateRomaji(japaneseName) {
  if (!japaneseName) return '';
  
  // Basic katakana to romaji conversion table
  const katakanaToRomaji = {
    'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
    'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
    'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
    'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
    'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
    'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
    'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
    'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
    'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
    'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
    'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
    'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
    'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
    'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
    'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
    'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
    'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
    'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
    'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
    'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
    'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
    'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
    'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
    'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
    'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
    'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',
    'ー': '-', 'ッ': 'tsu', 'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
    '・': '', '　': ' ', ' ': ' '
  };
  
  let romaji = '';
  let i = 0;
  
  while (i < japaneseName.length) {
    // Check for 2-character combinations first
    if (i + 1 < japaneseName.length) {
      const twoChar = japaneseName.substring(i, i + 2);
      if (katakanaToRomaji[twoChar]) {
        romaji += katakanaToRomaji[twoChar];
        i += 2;
        continue;
      }
    }
    
    // Check single character
    const singleChar = japaneseName[i];
    if (katakanaToRomaji[singleChar]) {
      romaji += katakanaToRomaji[singleChar];
    } else {
      romaji += singleChar; // Keep non-katakana characters as-is
    }
    i++;
  }
  
  return romaji;
}

// Generate pronunciation guide
function generatePronunciation(romaji) {
  if (!romaji) return '';
  
  // Simple pronunciation guide
  return romaji
    .toLowerCase()
    .replace(/([aeiou])/g, '$1-')
    .replace(/-$/, '')
    .replace(/^-/, '');
}

// Generate meaning from the actual Japanese name etymology
function generateMeaning(japaneseName, speciesData) {
  // Try to get specific meaning from our database
  const specificMeaning = getJapaneseNameMeaning(japaneseName);
  if (specificMeaning) {
    return specificMeaning;
  }
  
  // Fallback to genus for Pokemon not in our meanings database
  const genusEntry = speciesData.genera?.find(genus => genus.language.name === 'en');
  if (genusEntry) {
    return genusEntry.genus;
  }
  
  return 'Pokemon';
}

// Main function to fetch all Pokemon data
async function fetchAllPokemonData() {
  console.log('🚀 Starting to fetch all Pokemon Japanese names...');
  
  const allPokemonData = {};
  const maxPokemonId = 1010; // Current max Pokemon ID
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 10;
  const delay = 100; // 100ms delay between batches
  
  for (let i = 1; i <= maxPokemonId; i += batchSize) {
    const batch = [];
    
    // Create batch of promises
    for (let j = i; j < Math.min(i + batchSize, maxPokemonId + 1); j++) {
      batch.push(
        getPokemonSpecies(j)
          .then(speciesData => {
            const japaneseName = extractJapaneseName(speciesData);
            if (japaneseName) {
              const romaji = generateRomaji(japaneseName);
              const pronunciation = generatePronunciation(romaji);
              const meaning = generateMeaning(japaneseName, speciesData);
              
              allPokemonData[j] = {
                japanese: japaneseName,
                romaji: romaji,
                pronunciation: pronunciation,
                meaning: meaning
              };
              
              console.log(`✅ ${j}: ${japaneseName} (${romaji}) - ${meaning}`);
            } else {
              console.log(`⚠️  ${j}: No Japanese name found`);
            }
          })
          .catch(error => {
            console.log(`❌ ${j}: Error - ${error.message}`);
          })
      );
    }
    
    // Wait for batch to complete
    await Promise.all(batch);
    
    // Delay before next batch
    if (i + batchSize <= maxPokemonId) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return allPokemonData;
}

// Update the japaneseNames.ts file
function updateJapaneseNamesFile(pokemonData) {
  const filePath = path.join(__dirname, '../src/lib/japaneseNames.ts');
  
  // Read existing file
  let fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Find the start and end of the pokemonIdToJapanese object
  const startMarker = 'const pokemonIdToJapanese: Record<number, string> = {';
  const endMarker = '}';
  
  const startIndex = fileContent.indexOf(startMarker);
  const endIndex = fileContent.indexOf(endMarker, startIndex + startMarker.length);
  
  if (startIndex === -1 || endIndex === -1) {
    throw new Error('Could not find pokemonIdToJapanese object in file');
  }
  
  // Generate new mapping
  const newMapping = Object.entries(pokemonData)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([id, data]) => `  ${id}: '${data.japanese}',    // ${data.meaning}`)
    .join('\n');
  
  // Replace the mapping
  const beforeMapping = fileContent.substring(0, startIndex + startMarker.length);
  const afterMapping = fileContent.substring(endIndex);
  
  let newFileContent = beforeMapping + '\n' + newMapping + '\n' + afterMapping;
  
  // Also add entries to the japaneseNames object
  const japaneseNamesStartMarker = 'const japaneseNames: Record<string, JapaneseNameInfo> = {';
  const japaneseNamesStartIndex = newFileContent.indexOf(japaneseNamesStartMarker);
  
  if (japaneseNamesStartIndex !== -1) {
    // Find the end of the existing japaneseNames object
    let braceCount = 0;
    let japaneseNamesEndIndex = japaneseNamesStartIndex;
    let foundStart = false;
    
    for (let i = japaneseNamesStartIndex; i < newFileContent.length; i++) {
      if (newFileContent[i] === '{') {
        if (!foundStart) {
          foundStart = true;
          continue;
        }
        braceCount++;
      } else if (newFileContent[i] === '}') {
        if (braceCount === 0) {
          japaneseNamesEndIndex = i;
          break;
        }
        braceCount--;
      }
    }
    
    // Generate new japaneseNames entries
    const newJapaneseNamesEntries = Object.entries(pokemonData)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([id, data]) => `  '${data.japanese}': {\n    japanese: '${data.japanese}',\n    romaji: '${data.romaji}',\n    pronunciation: '${data.pronunciation}',\n    meaning: '${data.meaning}'\n  }`)
      .join(',\n');
    
    // Insert new entries before the closing brace
    const beforeJapaneseNames = newFileContent.substring(0, japaneseNamesEndIndex);
    const afterJapaneseNames = newFileContent.substring(japaneseNamesEndIndex);
    
    newFileContent = beforeJapaneseNames + ',\n' + newJapaneseNamesEntries + '\n' + afterJapaneseNames;
  }
  
  // Write updated file
  fs.writeFileSync(filePath, newFileContent, 'utf8');
  console.log(`📝 Updated ${filePath} with ${Object.keys(pokemonData).length} Pokemon`);
}

// Run the script
async function main() {
  try {
    const pokemonData = await fetchAllPokemonData();
    
    console.log(`\n🎉 Successfully fetched data for ${Object.keys(pokemonData).length} Pokemon`);
    
    // Update the TypeScript file
    updateJapaneseNamesFile(pokemonData);
    
    console.log('✅ Japanese names database updated successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fetchAllPokemonData, updateJapaneseNamesFile };
