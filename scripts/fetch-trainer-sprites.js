#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Base URL for Pokémon Showdown trainer sprites
const BASE_URL = 'https://play.pokemonshowdown.com/sprites/trainers/';
const OUTPUT_DIR = path.join(__dirname, '../public/assets/trainers');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Priority order for modern sprites (highest to lowest priority)
const MODERN_PRIORITY = [
  'masters',    // Pokémon Masters EX (most modern)
  'lgpe',       // Let's Go Pikachu/Eevee
  'gen9',       // Generation 9 (Scarlet/Violet)
  'gen8',       // Generation 8 (Sword/Shield)
  'gen7',       // Generation 7 (Sun/Moon)
  'gen6',       // Generation 6 (X/Y)
  'gen5',       // Generation 5 (Black/White)
  'gen4',       // Generation 4 (Diamond/Pearl)
  'gen3',       // Generation 3 (Ruby/Sapphire)
  'gen2',       // Generation 2 (Gold/Silver)
  'gen1',       // Generation 1 (Red/Blue)
  'default'     // Default/fallback
];

// Special cases for trainers with unique modern versions
const SPECIAL_MODERN_MAPPINGS = {
  'sabrina': 'sabrina-masters.png',
  'brock': 'brock-masters.png',
  'misty': 'misty-masters.png',
  'agatha': 'agatha-lgpe.png',
  'lorelei': 'lorelei-lgpe.png',
  'ash': 'ash.png', // Keep original Ash
  'red': 'red.png', // Keep original Red
  'blue': 'blue.png', // Keep original Blue
  'green': 'green.png', // Keep original Green
  'yellow': 'yellow.png', // Keep original Yellow
  'gary': 'gary.png', // Keep original Gary
  'professoroak': 'professoroak.png', // Keep original Professor Oak
  'giovanni': 'giovanni.png', // Keep original Giovanni
  'erika': 'erika.png', // Keep original Erika
  'koga': 'koga.png', // Keep original Koga
  'blaine': 'blaine.png', // Keep original Blaine
  'bruno': 'bruno.png', // Keep original Bruno
  'lance': 'lance.png', // Keep original Lance
  'lt-surge': 'ltsurge.png', // Keep original Lt. Surge
  'surge': 'ltsurge.png', // Keep original Lt. Surge
};

// List of trainer names to fetch (based on the Pokémon Showdown directory)
const TRAINER_NAMES = [
  // Kanto Gym Leaders
  'brock', 'misty', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni',
  'ltsurge', 'surge',
  
  // Kanto Elite Four
  'bruno', 'agatha', 'lance', 'lorelei',
  
  // Johto Gym Leaders
  'falkner', 'bugsy', 'whitney', 'morty', 'chuck', 'jasmine', 'pryce', 'clair',
  
  // Johto Elite Four
  'will', 'koga', 'bruno', 'karen',
  
  // Hoenn Gym Leaders
  'roxanne', 'brawly', 'wattson', 'flannery', 'norman', 'winona', 'tateandliza', 'wallace',
  
  // Hoenn Elite Four
  'sidney', 'phoebe', 'glacia', 'drake', 'steven',
  
  // Sinnoh Gym Leaders
  'roark', 'gardenia', 'maylene', 'crasherwake', 'fantina', 'byron', 'candice', 'volkner',
  
  // Sinnoh Elite Four
  'aaron', 'bertha', 'flint', 'lucian', 'cynthia',
  
  // Unova Gym Leaders
  'cilan', 'chili', 'cress', 'lenora', 'burgh', 'elesa', 'clay', 'skyla', 'brycen', 'drayden', 'iris',
  
  // Unova Elite Four
  'shauntal', 'marshall', 'grimsley', 'caitlin', 'alder',
  
  // Kalos Gym Leaders
  'viola', 'grant', 'korrina', 'ramos', 'clemont', 'valerie', 'olympia', 'wulfric',
  
  // Kalos Elite Four
  'malva', 'siebold', 'wikstrom', 'drasna', 'diantha',
  
  // Alola Trial Captains
  'ilima', 'lana', 'kiawe', 'mallow', 'sophocles', 'acerola', 'mina',
  
  // Alola Kahunas
  'hala', 'olivia', 'nanu', 'hapu',
  
  // Alola Elite Four
  'molayne', 'olivia', 'akahi', 'kahili',
  
  // Galar Gym Leaders
  'milo', 'nessa', 'kabu', 'bea', 'allister', 'opal', 'gordie', 'melony', 'piers', 'raihan',
  
  // Galar Elite Four
  'leon', 'hop', 'marnie', 'bede',
  
  // Paldea Gym Leaders
  'katy', 'brassius', 'iono', 'kofu', 'larry', 'ryme', 'tulip', 'grusha',
  
  // Paldea Elite Four
  'rion', 'poppy', 'hassel', 'geeta',
  
  // Champions
  'red', 'blue', 'green', 'yellow', 'gary', 'ethan', 'lyra', 'brendan', 'may', 'wally',
  'lucas', 'dawn', 'barry', 'nate', 'rosa', 'hugh', 'calem', 'serena', 'elio', 'selene',
  'gladion', 'lillie', 'victor', 'gloria', 'hop', 'marnie', 'bede', 'juliana', 'florian',
  
  // Professors
  'professoroak', 'professorelm', 'professorbirch', 'professorrowan', 'professorjuniper',
  'professorsycamore', 'professorkukui', 'professorburnet', 'professormagnolia', 'professorsonia',
  'professorturo', 'professorsada',
  
  // Rivals
  'silver', 'wally', 'barry', 'bianca', 'hugh', 'shauna', 'tierno', 'trevor', 'hau', 'gladion',
  'hop', 'marnie', 'bede', 'nemona', 'arven', 'penny',
  
  // Team Leaders
  'giovanni', 'archie', 'maxie', 'cyrus', 'ghetsis', 'lysandre', 'guzma', 'lusamine',
  'rose', 'oleana', 'clavell', 'sada', 'turo',
  
  // Other important characters
  'ash', 'jessie', 'james', 'meowth', 'nursejoy', 'officerjenny', 'bill', 'mr-fuji',
  'teamrocket', 'teamgalactic', 'teamplasma', 'teamflare', 'teamskull', 'teamyell',
  'teamstar'
];

// Function to download a file
function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 404) {
        file.close();
        fs.unlink(filepath, () => {}); // Delete empty file
        reject(new Error(`File not found: ${url}`));
      } else {
        file.close();
        fs.unlink(filepath, () => {}); // Delete empty file
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {}); // Delete empty file
      reject(err);
    });
  });
}

// Function to check if a URL exists
function checkUrlExists(url) {
  return new Promise((resolve) => {
    https.get(url, (response) => {
      resolve(response.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Function to find the most modern sprite for a trainer
async function findModernSprite(trainerName) {
  // Check special mappings first
  if (SPECIAL_MODERN_MAPPINGS[trainerName]) {
    const filename = SPECIAL_MODERN_MAPPINGS[trainerName];
    return {
      filename,
      url: BASE_URL + filename,
      filepath: path.join(OUTPUT_DIR, filename)
    };
  }
  
  // Try different variations of the name
  const variations = [
    trainerName,
    trainerName.replace(/-/g, ''),
    trainerName.replace(/_/g, '-'),
    trainerName.replace(/_/g, '')
  ];
  
  // For each variation, try to find the most modern version
  for (const variation of variations) {
    for (const priority of MODERN_PRIORITY) {
      let filename;
      
      if (priority === 'default') {
        filename = `${variation}.png`;
      } else {
        filename = `${variation}-${priority}.png`;
      }
      
      const url = BASE_URL + filename;
      const exists = await checkUrlExists(url);
      
      if (exists) {
        return {
          filename,
          url,
          filepath: path.join(OUTPUT_DIR, filename)
        };
      }
    }
  }
  
  // Fallback to default
  return {
    filename: `${trainerName}.png`,
    url: BASE_URL + `${trainerName}.png`,
    filepath: path.join(OUTPUT_DIR, `${trainerName}.png`)
  };
}

// Function to download trainer sprites
async function downloadTrainerSprites() {
  console.log('Starting trainer sprite download...');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  for (const trainerName of TRAINER_NAMES) {
    try {
      const spriteInfo = await findModernSprite(trainerName);
      const { filename, url, filepath } = spriteInfo;
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`✓ Skipped ${filename} (already exists)`);
        results.skipped.push(filename);
        continue;
      }
      
      console.log(`Downloading ${filename}...`);
      await downloadFile(url, filepath);
      console.log(`✓ Downloaded ${filename}`);
      results.success.push(filename);
      
      // Add a small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`✗ Failed to download ${trainerName}: ${error.message}`);
      results.failed.push({ name: trainerName, error: error.message });
    }
  }
  
  // Print summary
  console.log('\n=== Download Summary ===');
  console.log(`Successfully downloaded: ${results.success.length}`);
  console.log(`Skipped (already exists): ${results.skipped.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed downloads:');
    results.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }
  
  // Create a manifest file
  const manifest = {
    downloaded: results.success,
    skipped: results.skipped,
    failed: results.failed,
    timestamp: new Date().toISOString(),
    total: TRAINER_NAMES.length
  };
  
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to: ${manifestPath}`);
}

// Run the script
if (require.main === module) {
  downloadTrainerSprites().catch(console.error);
}

module.exports = { downloadTrainerSprites, findModernSprite };
