#!/usr/bin/env python3
import csv
import json

# Read the CSV file
with open('/Users/albertomunoz/Desktop/pokemon_jap_names_full.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    pokemon_data = list(reader)

print(f'Found {len(pokemon_data)} Pokemon entries in CSV')

# Create the new japaneseNames.ts with all Pokemon
header = '''// Japanese Pokemon names with romaji, pronunciation, and meaning
export interface JapaneseNameInfo {
  japanese: string
  romaji: string
  pronunciation: string
  meaning: string
  explanation?: string
}

// Pokemon-specific Japanese names with romaji, pronunciation, meanings, and explanations
const japaneseNames: Record<string, JapaneseNameInfo> = {
'''

# Process all Pokemon entries
entries = []
for row in pokemon_data:
    dex_num = row['\ufeffDexNumber']  # Handle BOM in header
    english_name = row['EnglishName']
    japanese_name = row['JapaneseName'].split(' (')[0]  # Remove romaji part
    romaji = row['JapaneseName'].split(' (')[1].rstrip(')') if ' (' in row['JapaneseName'] else ''
    literal = row['Literal']
    explanation = row['Explanation']
    
    # Generate pronunciation (basic approximation)
    pronunciation = f'Basic pronunciation for {english_name}'
    
    # Clean up explanation text
    if explanation:
        explanation_clean = explanation.replace("'", "\\'").replace('"', '\\"')
        entry = f"""  '{japanese_name}': {{
    japanese: '{japanese_name}',
    romaji: '{romaji}',
    pronunciation: '{pronunciation}',
    meaning: '{literal}',
    explanation: '{explanation_clean}'
  }},"""
    else:
        entry = f"""  '{japanese_name}': {{
    japanese: '{japanese_name}',
    romaji: '{romaji}',
    pronunciation: '{pronunciation}',
    meaning: '{literal}'
  }},"""
    
    entries.append(entry)

print(f'Generated {len(entries)} TypeScript entries')

# Add the footer
footer = '''
}

export function getJapaneseNameInfo(japaneseName: string): JapaneseNameInfo | null {
  return japaneseNames[japaneseName] || null
}

// Pokemon ID to Japanese name mapping (Gen 1-9)
const pokemonIdToJapanese: Record<number, string> = {
'''

# Add Pokemon ID mappings
for row in pokemon_data:
    dex_num = int(row['\ufeffDexNumber'])  # Handle BOM in header
    japanese_name = row['JapaneseName'].split(' (')[0]
    footer += f'  {dex_num}: \'{japanese_name}\',    // {row["EnglishName"]}\n'

footer += '''}

export function getPokemonJapaneseName(pokemonId: number): JapaneseNameInfo | null {
  const japaneseName = pokemonIdToJapanese[pokemonId]
  if (japaneseName) {
    return getJapaneseNameInfo(japaneseName)
  }
  return null
}

// Fallback function to generate basic romaji from Japanese text
export function generateBasicRomaji(japaneseText: string): string {
  // This is a very basic conversion - in a real app you'd want a proper Japanese-to-romaji library
  const basicConversions: Record<string, string> = {
    'たね': 'Tane',
    'ざっそう': 'Zassou',
    'はな': 'Hana',
    'ひ': 'Hi',
    'かげ': 'Kage',
    'みず': 'Mizu',
    'かめ': 'Kame'
  }
  
  let result = japaneseText
  for (const [jp, romaji] of Object.entries(basicConversions)) {
    result = result.replace(new RegExp(jp, 'g'), romaji)
  }
  
  return result
}
'''

# Combine everything
new_content = header + '\n'.join(entries) + footer

# Write the new file
with open('src/lib/japaneseNames_full.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Created japaneseNames_full.ts with {len(entries)} Pokemon entries')
