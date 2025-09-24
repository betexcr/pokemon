#!/usr/bin/env node

// Simple script to seed usage data for testing
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin with default credentials
initializeApp({
  projectId: 'pokemon-battles-86a0d'
});

const db = getFirestore();

// Sample usage data for testing
const sampleData = [
  {
    id: 'SMOGON_SINGLES_GEN9_OU_2023-03_984',
    pokemonId: 984,
    pokemonName: 'Great Tusk',
    month: '2023-03',
    platform: 'SMOGON_SINGLES',
    generation: 'GEN9',
    format: 'OU',
    usagePercent: 42.9,
    rank: 1,
    sampleSize: 183456,
    substats: {
      moves: [
        { name: 'Earthquake', pct: 82.1 },
        { name: 'Rapid Spin', pct: 76.3 },
        { name: 'Headlong Rush', pct: 68.9 },
        { name: 'Close Combat', pct: 45.2 }
      ],
      items: [
        { name: 'Leftovers', pct: 38.4 },
        { name: 'Booster Energy', pct: 29.7 },
        { name: 'Choice Band', pct: 18.3 }
      ],
      abilities: [
        { name: 'Protosynthesis', pct: 100.0 }
      ]
    },
    source: {
      label: 'Smogon OU usage (Mar 2023)',
      url: 'https://www.smogon.com/stats/2023-03/gen9ou-0.txt',
      collectedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksum: 'a1b2c3d4e5f6g7h8'
  },
  {
    id: 'SMOGON_SINGLES_GEN9_OU_2023-03_645',
    pokemonId: 645,
    pokemonName: 'Landorus-Therian',
    month: '2023-03',
    platform: 'SMOGON_SINGLES',
    generation: 'GEN9',
    format: 'OU',
    usagePercent: 38.4,
    rank: 2,
    sampleSize: 164789,
    substats: {
      moves: [
        { name: 'Earthquake', pct: 89.2 },
        { name: 'U-turn', pct: 76.8 },
        { name: 'Stealth Rock', pct: 65.4 },
        { name: 'Toxic', pct: 42.1 }
      ],
      items: [
        { name: 'Leftovers', pct: 45.6 },
        { name: 'Rocky Helmet', pct: 32.1 },
        { name: 'Choice Scarf', pct: 18.9 }
      ],
      abilities: [
        { name: 'Intimidate', pct: 100.0 }
      ]
    },
    source: {
      label: 'Smogon OU usage (Mar 2023)',
      url: 'https://www.smogon.com/stats/2023-03/gen9ou-0.txt',
      collectedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksum: 'b2c3d4e5f6g7h8i9'
  },
  {
    id: 'SMOGON_SINGLES_GEN9_OU_2023-03_1010',
    pokemonId: 1010,
    pokemonName: 'Gholdengo',
    month: '2023-03',
    platform: 'SMOGON_SINGLES',
    generation: 'GEN9',
    format: 'OU',
    usagePercent: 35.2,
    rank: 3,
    sampleSize: 151234,
    substats: {
      moves: [
        { name: 'Make It Rain', pct: 85.3 },
        { name: 'Shadow Ball', pct: 72.1 },
        { name: 'Nasty Plot', pct: 58.7 },
        { name: 'Thunderbolt', pct: 41.2 }
      ],
      items: [
        { name: 'Choice Scarf', pct: 42.8 },
        { name: 'Leftovers', pct: 31.5 },
        { name: 'Life Orb', pct: 22.1 }
      ],
      abilities: [
        { name: 'Good as Gold', pct: 100.0 }
      ]
    },
    source: {
      label: 'Smogon OU usage (Mar 2023)',
      url: 'https://www.smogon.com/stats/2023-03/gen9ou-0.txt',
      collectedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksum: 'c3d4e5f6g7h8i9j0'
  },
  {
    id: 'VGC_OFFICIAL_GEN9_VGC_REG_H_2024-08_984',
    pokemonId: 984,
    pokemonName: 'Great Tusk',
    month: '2024-08',
    platform: 'VGC_OFFICIAL',
    generation: 'GEN9',
    format: 'VGC_REG_H',
    usagePercent: 28.7,
    rank: 5,
    sampleSize: 89234,
    substats: {
      moves: [
        { name: 'Headlong Rush', pct: 78.9 },
        { name: 'Close Combat', pct: 65.4 },
        { name: 'Protect', pct: 45.2 },
        { name: 'Rock Slide', pct: 38.7 }
      ],
      items: [
        { name: 'Assault Vest', pct: 41.3 },
        { name: 'Choice Band', pct: 28.9 },
        { name: 'Booster Energy', pct: 22.1 }
      ],
      abilities: [
        { name: 'Protosynthesis', pct: 100.0 }
      ]
    },
    source: {
      label: 'VGC Regulation H usage (Aug 2024)',
      url: 'https://pikalytics.com/regulations/gen9/regulation-h',
      collectedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checksum: 'd4e5f6g7h8i9j0k1'
  }
];

async function seedData() {
  console.log('🌱 Seeding usage data...');
  
  try {
    const batch = db.batch();
    
    for (const data of sampleData) {
      const docRef = db.collection('usage_monthly').doc(data.id);
      batch.set(docRef, data);
    }
    
    await batch.commit();
    
    console.log(`✅ Successfully seeded ${sampleData.length} usage records`);
    console.log('📊 Data includes:');
    console.log('  - Smogon OU (Mar 2023): Great Tusk, Landorus-Therian, Gholdengo');
    console.log('  - VGC Regulation H (Aug 2024): Great Tusk');
    console.log('');
    console.log('🎯 You can now test the usage dashboard at /usage');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedData();
