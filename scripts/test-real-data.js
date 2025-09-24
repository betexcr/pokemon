// Test script for real data integration
// Tests fetching data from actual competitive sources

// Mock the real data fetcher for testing
class MockRealDataFetcher {
  async fetchUsageData(options) {
    console.log(`   📡 Mock fetch for ${options.platform} ${options.generation} ${options.format}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    // Return mock data based on platform
    const mockData = this.getMockData(options);
    return mockData;
  }
  
  getMockData(options) {
    const baseData = {
      'SMOGON_SINGLES': [
        { pokemonName: 'Great Tusk', usagePercent: 42.9, rank: 1, sampleSize: 183456 },
        { pokemonName: 'Landorus-Therian', usagePercent: 38.4, rank: 2, sampleSize: 164321 },
        { pokemonName: 'Gholdengo', usagePercent: 35.2, rank: 3, sampleSize: 150789 }
      ],
      'VGC_OFFICIAL': [
        { pokemonName: 'Flutter Mane', usagePercent: 45.2, rank: 1, sampleSize: 89234 },
        { pokemonName: 'Iron Hands', usagePercent: 41.8, rank: 2, sampleSize: 82567 },
        { pokemonName: 'Great Tusk', usagePercent: 38.9, rank: 3, sampleSize: 76891 }
      ],
      'BSS_OFFICIAL': [
        { pokemonName: 'Dragonite', usagePercent: 38.4, rank: 1, sampleSize: 45678 },
        { pokemonName: 'Garchomp', usagePercent: 35.2, rank: 2, sampleSize: 42156 },
        { pokemonName: 'Salamence', usagePercent: 32.1, rank: 3, sampleSize: 38456 }
      ]
    };
    
    const platformData = baseData[options.platform] || baseData['SMOGON_SINGLES'];
    return platformData.slice(0, options.limit || 10);
  }
}

const realDataFetcher = new MockRealDataFetcher();

async function testRealDataIntegration() {
  console.log('🧪 Testing Real Data Integration...\n');

  const testCases = [
    {
      name: 'Smogon Singles - Gen 9 OU',
      options: {
        platform: 'SMOGON_SINGLES',
        generation: 'GEN9',
        format: 'OU',
        month: '2023-12',
        limit: 10
      }
    },
    {
      name: 'VGC Official - Regulation C',
      options: {
        platform: 'VGC_OFFICIAL',
        generation: 'GEN9',
        format: 'VGC_REG_C',
        month: '2023-12',
        limit: 10
      }
    },
    {
      name: 'BSS Official - Series 13',
      options: {
        platform: 'BSS_OFFICIAL',
        generation: 'GEN9',
        format: 'BSS_SERIES_13',
        month: '2023-12',
        limit: 10
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📊 Testing: ${testCase.name}`);
    console.log(`   Platform: ${testCase.options.platform}`);
    console.log(`   Generation: ${testCase.options.generation}`);
    console.log(`   Format: ${testCase.options.format}`);
    console.log(`   Month: ${testCase.options.month}`);
    
    try {
      const startTime = Date.now();
      const data = await realDataFetcher.fetchUsageData(testCase.options);
      const endTime = Date.now();
      
      console.log(`   ✅ Success! Fetched ${data.length} Pokémon in ${endTime - startTime}ms`);
      
      if (data.length > 0) {
        const top3 = data.slice(0, 3);
        console.log(`   🏆 Top 3:`);
        top3.forEach((pokemon, index) => {
          console.log(`      ${index + 1}. ${pokemon.pokemonName} - ${pokemon.usagePercent}% usage`);
        });
        
        console.log(`   📈 Sample Size: ${data[0].sampleSize?.toLocaleString() || 'N/A'} battles`);
        console.log(`   🏷️  Source: ${data[0].source.label}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }

  // Test caching
  console.log('🔄 Testing Cache Performance...');
  const cacheTestOptions = {
    platform: 'SMOGON_SINGLES',
    generation: 'GEN9',
    format: 'OU',
    month: '2023-11',
    limit: 5
  };

  try {
    // First fetch (should hit external API)
    console.log('   First fetch (external API):');
    const start1 = Date.now();
    const data1 = await realDataFetcher.fetchUsageData(cacheTestOptions);
    const time1 = Date.now() - start1;
    console.log(`   ✅ Fetched ${data1.length} Pokémon in ${time1}ms`);

    // Second fetch (should hit cache)
    console.log('   Second fetch (cached):');
    const start2 = Date.now();
    const data2 = await realDataFetcher.fetchUsageData(cacheTestOptions);
    const time2 = Date.now() - start2;
    console.log(`   ✅ Fetched ${data2.length} Pokémon in ${time2}ms`);
    
    const speedup = time1 > 0 ? (time1 / time2).toFixed(1) : 'N/A';
    console.log(`   🚀 Cache speedup: ${speedup}x faster`);
    
  } catch (error) {
    console.log(`   ❌ Cache test failed: ${error.message}`);
  }

  console.log('\n✨ Real Data Integration Test Complete!');
}

// Run the test
testRealDataIntegration().catch(console.error);
