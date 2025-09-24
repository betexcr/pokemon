const fetch = require('node-fetch');

async function testApiResponse() {
  console.log('🔍 Testing API response for Pokemon #700...');
  
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon/700');
    const data = await response.json();
    
    console.log('📊 Pokemon #700 API Response:');
    console.log('Name:', data.name);
    console.log('Types:', data.types?.map(t => t.type?.name) || []);
    console.log('Types length:', data.types?.length || 0);
    console.log('Has sprites:', !!data.sprites?.front_default);
    console.log('Sprites front_default:', data.sprites?.front_default);
    
    // Check if types are properly structured
    if (data.types && data.types.length > 0) {
      console.log('✅ Types are present and properly structured');
      data.types.forEach((type, index) => {
        console.log(`  Type ${index + 1}:`, type.type?.name);
      });
    } else {
      console.log('❌ No types found in API response');
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Run the test
testApiResponse().catch(console.error);
