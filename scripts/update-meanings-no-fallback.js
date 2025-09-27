#!/usr/bin/env node

/**
 * Script to remove genus fallback and add actual meanings for all Pokemon
 */

const fs = require('fs');
const path = require('path');

// Read the current japaneseNames.ts file
const filePath = path.join(__dirname, '../src/lib/japaneseNames.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Update the generateMeaning function to remove genus fallback
const updatedContent = fileContent.replace(
  /\/\/ Generate meaning from the actual Japanese name etymology[\s\S]*?return 'Pokemon';/,
  `// Generate meaning from the actual Japanese name etymology
function generateMeaning(japaneseName, speciesData) {
  // Try to get specific meaning from our database
  const specificMeaning = getJapaneseNameMeaning(japaneseName);
  if (specificMeaning) {
    return specificMeaning;
  }
  
  // No fallback to genus - return null if no specific meaning found
  return null;
}`
);

// Write the updated file
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log('✅ Removed genus fallback from generateMeaning function');
console.log('✅ Now only Pokemon with specific meanings will show tooltips');
console.log('✅ Pokemon without specific meanings will not show Japanese names');
