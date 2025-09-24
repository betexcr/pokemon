// Test script to check team assignment in battle
// Run this in the browser console while in a battle

console.log('🔍 === TEAM ASSIGNMENT TEST ===');

// Check if we're in a battle page
if (window.location.pathname.includes('/battle/runtime')) {
  console.log('✅ On battle runtime page');
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('roomId');
  const battleId = urlParams.get('battleId');
  const role = urlParams.get('role');
  const isHost = urlParams.get('isHost');
  const pokemonList = urlParams.get('pokemonList');
  
  console.log('📋 URL Parameters:');
  console.log('  Room ID:', roomId);
  console.log('  Battle ID:', battleId);
  console.log('  Role:', role);
  console.log('  Is Host:', isHost);
  console.log('  Pokemon List exists:', !!pokemonList);
  
  if (pokemonList) {
    try {
      const parsedPokemon = JSON.parse(pokemonList);
      console.log('📦 Pokemon List from URL:');
      console.log(parsedPokemon);
    } catch (e) {
      console.error('❌ Failed to parse Pokemon list:', e);
    }
  }
  
  // Check localStorage for teams
  const localTeams = localStorage.getItem('pokemon-team-builder');
  if (localTeams) {
    console.log('💾 Local Storage Teams:');
    const teams = JSON.parse(localTeams);
    console.log(teams);
    console.log('Number of teams:', teams.length);
  } else {
    console.log('💾 No teams in local storage');
  }
  
  // Instructions for checking Firebase
  console.log('\n📝 To check Firebase teams:');
  console.log('1. Open browser dev tools (F12)');
  console.log('2. Go to Application/Storage tab');
  console.log('3. Check IndexedDB > firebaseLocalStorageDb');
  console.log('4. Look for battle documents');
  console.log('5. Check if hostTeam and guestTeam are identical');
  
} else {
  console.log('❌ Not on battle runtime page');
  console.log('Please navigate to a battle page and run this script again');
}

// Function to check if teams are identical
window.checkTeamEquality = function(team1, team2) {
  if (!team1 || !team2) {
    console.log('❌ One or both teams are null/undefined');
    return false;
  }
  
  const identical = JSON.stringify(team1) === JSON.stringify(team2);
  console.log('🔍 Team comparison result:', identical);
  
  if (identical) {
    console.log('🚨 Teams are identical!');
    console.log('Team 1:', team1);
    console.log('Team 2:', team2);
  } else {
    console.log('✅ Teams are different');
  }
  
  return identical;
};

console.log('\n💡 To check if two teams are identical, run: checkTeamEquality(team1, team2)');
