const fs = require('fs');
const path = require('path');

// Read the CSV file
const csvPath = '/Users/albertomunoz/Desktop/pokemon_jap_names_full.csv';
const csvContent = fs.readFileSync(csvPath, 'utf8');

// Parse CSV
const lines = csvContent.split('\n');
const headers = lines[0].split(',');
const data = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Simple CSV parsing (handles quoted fields)
  const fields = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  
  if (fields.length >= 5) {
    data.push({
      dexNumber: fields[0],
      englishName: fields[1],
      japaneseName: fields[2],
      literal: fields[3],
      explanation: fields[4]
    });
  }
}

// Filter special forms (IDs 10033-10082)
const specialForms = data.filter(row => {
  const id = parseInt(row.dexNumber);
  return id >= 10033 && id <= 10082;
});

console.log(`Found ${specialForms.length} special forms`);

// Generate TypeScript code for special forms
let tsCode = `// Special forms mapping and data
export interface SpecialFormInfo {
  id: number
  name: string
  japaneseName: string
  basePokemonId: number
  basePokemonName: string
  formType: 'mega' | 'primal'
  variant?: string // For forms like Charizard X/Y
  description: string
}

// Mapping of special form IDs to their base Pokemon
export const SPECIAL_FORM_MAPPINGS: Record<number, SpecialFormInfo> = {
`;

// Process each special form
specialForms.forEach(form => {
  const id = parseInt(form.dexNumber);
  const name = form.englishName;
  const japaneseName = form.japaneseName;
  const description = form.explanation;
  
  // Determine form type
  let formType = 'mega';
  if (name.includes('Primal')) {
    formType = 'primal';
  }
  
  // Extract base Pokemon name and ID
  let basePokemonName = '';
  let basePokemonId = 0;
  let variant = undefined;
  
  if (name.includes('Mega ')) {
    basePokemonName = name.replace('Mega ', '');
    if (basePokemonName.includes(' X')) {
      variant = 'X';
      basePokemonName = basePokemonName.replace(' X', '');
    } else if (basePokemonName.includes(' Y')) {
      variant = 'Y';
      basePokemonName = basePokemonName.replace(' Y', '');
    }
  } else if (name.includes('Primal ')) {
    basePokemonName = name.replace('Primal ', '');
  }
  
  // Find base Pokemon ID from the data
  const basePokemon = data.find(p => p.englishName === basePokemonName);
  if (basePokemon) {
    basePokemonId = parseInt(basePokemon.dexNumber);
  }
  
  // Generate the mapping entry
  const variantStr = variant ? `, variant: '${variant}'` : '';
  tsCode += `  ${id}: { id: ${id}, name: '${name}', japaneseName: '${japaneseName}', basePokemonId: ${basePokemonId}, basePokemonName: '${basePokemonName}', formType: '${formType}'${variantStr}, description: '${description.replace(/'/g, "\\'")}' },\n`;
});

tsCode += `}

// Helper functions
export function isSpecialForm(id: number): boolean {
  return id >= 10033 && id <= 10082
}

export function getSpecialFormInfo(id: number): SpecialFormInfo | null {
  return SPECIAL_FORM_MAPPINGS[id] || null
}

export function getBasePokemonId(specialFormId: number): number | null {
  const formInfo = getSpecialFormInfo(specialFormId)
  return formInfo ? formInfo.basePokemonId : null
}

export function getSpecialFormsForBasePokemon(basePokemonId: number): SpecialFormInfo[] {
  return Object.values(SPECIAL_FORM_MAPPINGS).filter(form => form.basePokemonId === basePokemonId)
}

export function getSpecialFormDisplayName(formInfo: SpecialFormInfo): string {
  if (formInfo.formType === 'mega') {
    return \`Mega \${formInfo.basePokemonName}\${formInfo.variant ? \` \${formInfo.variant}\` : ''}\`
  } else if (formInfo.formType === 'primal') {
    return \`Primal \${formInfo.basePokemonName}\`
  }
  return formInfo.name
}`;

// Write the updated file
const outputPath = '/Users/albertomunoz/Documents/Code/pokemon/src/lib/specialForms.ts';
fs.writeFileSync(outputPath, tsCode);

console.log('Special forms mapping updated successfully!');
console.log(`Generated ${specialForms.length} special form mappings`);

