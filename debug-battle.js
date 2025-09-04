// Debug script to test battle initialization
console.log('=== Battle Debug Script ===');

// Test team data
const testTeam = {
  id: "1756959740815",
  name: "Test Team",
  slots: [
    {
      id: 25, // Pikachu
      level: 15,
      moves: [
        { name: 'thunderbolt', type: 'electric', power: 90, accuracy: 100, pp: 15, effect: 'Deals damage', damage_class: 'special', priority: 0 },
        { name: 'quick-attack', type: 'normal', power: 40, accuracy: 100, pp: 30, effect: 'Deals damage', damage_class: 'physical', priority: 1 },
        { name: 'iron-tail', type: 'steel', power: 100, accuracy: 75, pp: 15, effect: 'Deals damage', damage_class: 'physical', priority: 0 },
        { name: 'thunder', type: 'electric', power: 110, accuracy: 70, pp: 10, effect: 'Deals damage', damage_class: 'special', priority: 0 },
      ]
    },
    { id: null, level: 15, moves: [] },
    { id: null, level: 15, moves: [] },
    { id: null, level: 15, moves: [] },
    { id: null, level: 15, moves: [] },
    { id: null, level: 15, moves: [] },
  ]
};

// Test gym champion data
const brock = {
  id: 'brock-kanto',
  name: 'Brock (Kanto)',
  difficulty: 'normal',
  team: {
    name: 'Rock Solid',
    slots: [
      { id: 74, level: 12 }, // Geodude
      { id: 95, level: 14 }, // Onix
    ],
  },
};

console.log('Test team:', testTeam);
console.log('Brock champion:', brock);

// Test API calls
async function testAPI() {
  try {
    console.log('Testing API calls...');
    
    // Test Pikachu API call
    const pikachuResponse = await fetch('https://pokeapi.co/api/v2/pokemon/25');
    if (!pikachuResponse.ok) {
      throw new Error(`HTTP error! status: ${pikachuResponse.status}`);
    }
    const pikachu = await pikachuResponse.json();
    console.log('Pikachu data:', pikachu.name, pikachu.id);
    
    // Test Geodude API call
    const geodudeResponse = await fetch('https://pokeapi.co/api/v2/pokemon/74');
    if (!geodudeResponse.ok) {
      throw new Error(`HTTP error! status: ${geodudeResponse.status}`);
    }
    const geodude = await geodudeResponse.json();
    console.log('Geodude data:', geodude.name, geodude.id);
    
    console.log('API calls successful!');
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run the test
testAPI();
