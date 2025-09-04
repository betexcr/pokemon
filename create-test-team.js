// Script to create a test team for battle testing
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

// Save to localStorage
if (typeof window !== 'undefined') {
  localStorage.setItem('pokemon-team-builder', JSON.stringify([testTeam]));
  console.log('Test team created successfully!');
  console.log('Team ID:', testTeam.id);
  console.log('Team:', testTeam);
} else {
  console.log('This script needs to run in a browser environment');
}
