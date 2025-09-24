'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react'

interface HelpTip {
  id: string
  title: string
  content: string
  type?: 'helpful' | 'fun' | 'quote' // Type of tip
  duration?: number // Duration in seconds (optional)
}

interface HelpAssistantProps {
  className?: string
}

// Popular Pokémon for the help assistant (with PMD assets available)
const HELP_POKEMON = [
  { id: '0025', name: 'Pikachu' },
  { id: '0006', name: 'Charizard' },
  { id: '0009', name: 'Blastoise' },
  { id: '0094', name: 'Gengar' },
  { id: '0143', name: 'Snorlax' },
  { id: '0149', name: 'Dragonite' },
  { id: '0150', name: 'Mewtwo' },
  { id: '0196', name: 'Espeon' },
  { id: '0197', name: 'Umbreon' },
  { id: '0249', name: 'Lugia' },
  { id: '0257', name: 'Blaziken' },
  { id: '0282', name: 'Gardevoir' },
  { id: '0359', name: 'Absol' },
  { id: '0384', name: 'Rayquaza' },
  { id: '0445', name: 'Garchomp' },
  { id: '0448', name: 'Lucario' },
  { id: '0471', name: 'Glaceon' },
  { id: '0500', name: 'Emboar' },
  { id: '0635', name: 'Hydreigon' },
  { id: '0658', name: 'Greninja' },
  { id: '0700', name: 'Sylveon' },
  { id: '0724', name: 'Decidueye' },
  { id: '0727', name: 'Incineroar' },
  { id: '0778', name: 'Mimikyu' },
  { id: '0807', name: 'Zeraora' },
  { id: '0809', name: 'Melmetal' },
  { id: '0823', name: 'Corviknight' },
  { id: '0887', name: 'Dragapult' },
  { id: '0892', name: 'Urshifu' },
  { id: '0893', name: 'Zarude' },
  { id: '0897', name: 'Regieleki' },
  { id: '0905', name: 'Enamorus' },
  { id: '0908', name: 'Skeledirge' },
  { id: '1002', name: 'Koraidon' },
  { id: '1008', name: 'Miraidon' },
  { id: '1009', name: 'Walking Wake' },
  { id: '1010', name: 'Iron Leaves' }
]

// Seven playful assistant styles (randomly applied)
const CLIPPY_STYLES = [
  { id: 'guide', label: 'Guide', emoji: '🧭' },
  { id: 'scout', label: 'Scout', emoji: '🕵️' },
  { id: 'professor', label: 'Professor', emoji: '🧪' },
  { id: 'coach', label: 'Coach', emoji: '🎓' },
  { id: 'navigator', label: 'Navigator', emoji: '🗺️' },
  { id: 'buddy', label: 'Buddy', emoji: '🤝' },
  { id: 'announcer', label: 'Announcer', emoji: '📣' },
]

// A comprehensive collection of fun/interesting Pokémon quotes, challenges, and trivia.
// Mix of battle strategy, fun facts, challenges, and motivational quotes.
const POKE_QUOTES: string[] = [
  // Battle Strategy & Tips
  'The right move at the right time can turn the tide of any battle.',
  'A balanced team isn\'t just types—roles matter too!',
  'Speed controls who speaks first. Accuracy decides who\'s heard.',
  'Sometimes switching out is the strongest attack.',
  'Critical hits happen—plan for chaos and you\'ll thrive.',
  'Status conditions win long battles. Don\'t underestimate a good burn or para.',
  'Every Pokémon can shine with the right strategy.',
  'Know your win condition before turn one.',
  'Type immunity is more than defense—it\'s free momentum.',
  'Prediction is a dance. Lead or be led.',
  'Entry hazards pay rent every time your foe visits.',
  'You won\'t always have the best matchup—play to your outs.',
  'Protect isn\'t passive. It\'s a scouting report.',
  'Hitting super-effective feels great, but resisting feels smarter.',
  'Trick Room says: "Why rush a masterpiece?"',
  'Every switch-in tells your opponent a story. Make it a mystery.',
  'Use items responsibly. Berries are tiny miracles.',
  'Switching is like chess—control space, not just pieces.',
  'There\'s beauty in a well-timed Baton Pass.',
  'VoltTurn is the art of leaving without saying goodbye.',
  'Defense isn\'t stalling—it\'s storytelling in longer chapters.',
  'A missed move today becomes tomorrow\'s legend.',
  
  // Motivational & Inspirational
  'Legends say a Trainer\'s heart is their strongest stat.',
  'Even a Magikarp can make a splash with the right timing.',
  'Greatness starts when you nickname your team.',
  'Your Poké Ball is half full—time to catch opportunity.',
  'Courage is the crit chance of life.',
  'Confidence is your hidden ability.',
  'Train the Trainer first—the team will follow.',
  'Even the Elite Four started with a Level 5.',
  'Never forget: friendship also boosts morale IRL.',
  'When in doubt, check the type chart—twice.',
  'If your favorite Pokémon isn\'t "meta," make a meta for it.',
  'Sometimes the most fun team is the one only you understand.',
  
  // Weather & Environment
  'Rain, Sun, Sand, Hail—weather writes its own tale.',
  'Some evolutions are choices. Pick the story you want.',
  'Synergy beats raw power. Two good fits beat one great misfit.',
  
  // Fun Challenges & Games
  '🎯 Challenge: Build a team using only Pokémon with names that start with the same letter!',
  '🏆 Challenge: Create a "color theme" team—all red Pokémon, all blue, etc.',
  '🎮 Challenge: Use only Pokémon from your birth year\'s generation!',
  '🌟 Challenge: Build a team where each Pokémon has a different ability!',
  '⚡ Challenge: Create a team using only Electric-type Pokémon!',
  '🌊 Challenge: Build a team using only Water-type Pokémon!',
  '🔥 Challenge: Create a team using only Fire-type Pokémon!',
  '🌱 Challenge: Build a team using only Grass-type Pokémon!',
  '💎 Challenge: Use only Legendary Pokémon in your team!',
  '🐛 Challenge: Create a team using only Bug-type Pokémon!',
  '👻 Challenge: Build a team using only Ghost-type Pokémon!',
  '🐉 Challenge: Create a team using only Dragon-type Pokémon!',
  '⚔️ Challenge: Build a team using only Fighting-type Pokémon!',
  '🧠 Challenge: Create a team using only Psychic-type Pokémon!',
  '🦅 Challenge: Build a team using only Flying-type Pokémon!',
  '🏔️ Challenge: Create a team using only Rock-type Pokémon!',
  '❄️ Challenge: Build a team using only Ice-type Pokémon!',
  '🌙 Challenge: Create a team using only Dark-type Pokémon!',
  '✨ Challenge: Build a team using only Fairy-type Pokémon!',
  '🔧 Challenge: Create a team using only Steel-type Pokémon!',
  '🌍 Challenge: Build a team using only Ground-type Pokémon!',
  '☠️ Challenge: Create a team using only Poison-type Pokémon!',
  '🎭 Challenge: Build a team using only Normal-type Pokémon!',
  
  // Trivia & Fun Facts
  'Did you know? Pikachu\'s name comes from "pika" (the sound of electricity) and "chu" (the sound a mouse makes)!',
  'Fun fact: Mewtwo was created by scientists, making it the first artificial Pokémon!',
  'Trivia: Eevee can evolve into 8 different forms—more than any other Pokémon!',
  'Did you know? Magikarp is based on a Japanese legend about a carp that became a dragon!',
  'Fun fact: Ditto can transform into any Pokémon, but its eyes always stay the same!',
  'Trivia: Snorlax sleeps for 20 hours a day and only wakes up to eat!',
  'Did you know? Charizard can\'t actually fly—it glides using its wings!',
  'Fun fact: Gengar is said to be the shadow of Clefable!',
  'Trivia: Pikachu\'s cheeks store electricity, not just generate it!',
  'Did you know? Mew is said to contain the DNA of all Pokémon!',
  'Fun fact: Ditto was originally going to be called "Metamon"!',
  'Trivia: The first Pokémon ever created was Rhydon, not Bulbasaur!',
  'Did you know? Pikachu was originally going to be a different color!',
  'Fun fact: Some Pokémon are based on real animals, others on objects!',
  'Trivia: The Pokédex was inspired by a real-life encyclopedia!',
  'Did you know? Pokémon can learn moves that don\'t match their type!',
  'Fun fact: Some Pokémon have hidden abilities that are very rare!',
  'Trivia: The first shiny Pokémon was a red Gyarados in the games!',
  'Did you know? Some Pokémon can only be caught at certain times of day!',
  'Fun fact: Legendary Pokémon are often based on mythology from different cultures!',
  
  // Team Building Challenges
  '🏗️ Challenge: Build a team where each Pokémon has a different role (sweeper, tank, support, etc.)!',
  '🎨 Challenge: Create a team using only Pokémon with color-based names (Red, Blue, Green, etc.)!',
  '📚 Challenge: Build a team using only Pokémon that can learn a specific move!',
  '🌟 Challenge: Create a team using only Pokémon with "star" in their name or description!',
  '🌙 Challenge: Build a team using only Pokémon that are active at night!',
  '☀️ Challenge: Create a team using only Pokémon that love sunny weather!',
  '🌧️ Challenge: Build a team using only Pokémon that thrive in rain!',
  '❄️ Challenge: Create a team using only Pokémon that love cold weather!',
  '🏔️ Challenge: Build a team using only Pokémon that live in mountains!',
  '🌊 Challenge: Create a team using only Pokémon that live near water!',
  '🌳 Challenge: Build a team using only Pokémon that live in forests!',
  '🏜️ Challenge: Create a team using only Pokémon that live in deserts!',
  '🌋 Challenge: Build a team using only Pokémon that live near volcanoes!',
  '❄️ Challenge: Create a team using only Pokémon that live in icy areas!',
  '🏔️ Challenge: Build a team using only Pokémon that live in caves!',
  '🌊 Challenge: Create a team using only Pokémon that live in the ocean!',
  '🌳 Challenge: Build a team using only Pokémon that live in grasslands!',
  '🏜️ Challenge: Create a team using only Pokémon that live in urban areas!',
  
  // Competitive & Meta
  'Meta tip: The most popular Pokémon aren\'t always the strongest!',
  'Competitive insight: Team synergy often beats individual power!',
  'Meta fact: Some Pokémon are popular because of their abilities, not their stats!',
  'Competitive tip: Knowing your opponent\'s team is half the battle!',
  'Meta insight: The "best" Pokémon changes with each generation!',
  'Competitive fact: Some moves are more popular than others for good reason!',
  'Meta tip: Team composition matters more than individual Pokémon strength!',
  'Competitive insight: Prediction and timing often decide battles!',
  'Meta fact: Some Pokémon are popular in doubles but not singles!',
  'Competitive tip: Understanding type matchups is crucial for success!',
  
  // Fun & Silly
  'Silly fact: If Pokémon were real, we\'d need a lot of Poké Balls!',
  'Fun thought: Imagine if your pet could evolve like Pokémon!',
  'Silly question: What would you do if you found a real Pikachu?',
  'Fun fact: Some Pokémon names are puns in multiple languages!',
  'Silly challenge: Try to make your team sound like a band name!',
  'Fun thought: What if humans could learn Pokémon moves?',
  'Silly fact: Some Pokémon are based on food items!',
  'Fun challenge: Create a team using only Pokémon that look like food!',
  'Silly question: Which Pokémon would make the best pet?',
  'Fun fact: Some Pokémon are based on household objects!',
  'Silly challenge: Build a team using only Pokémon that look like objects!',
  'Fun thought: What if Pokémon could talk like in the anime?',
  'Silly fact: Some Pokémon names are just sounds!',
  'Fun challenge: Create a team using only Pokémon with one-syllable names!',
  'Silly question: Which Pokémon would be the best at hide and seek?',
  'Fun fact: Some Pokémon are based on mythical creatures!',
  'Silly challenge: Build a team using only Pokémon that look like animals!',
  'Fun thought: What if you could be a Pokémon?',
  'Silly fact: Some Pokémon are based on plants!',
  'Fun challenge: Create a team using only Pokémon that look like plants!',
  
  // Educational & Learning
  'Learning tip: Each Pokémon type has strengths and weaknesses to remember!',
  'Educational fact: Pokémon battles teach strategy and critical thinking!',
  'Learning insight: Team building helps with planning and organization!',
  'Educational tip: Understanding type matchups improves decision-making!',
  'Learning fact: Pokémon names often have hidden meanings!',
  'Educational insight: Team synergy teaches cooperation and teamwork!',
  'Learning tip: Battle prediction improves analytical thinking!',
  'Educational fact: Pokémon stats teach about different strengths!',
  'Learning insight: Move selection teaches resource management!',
  'Educational tip: Team composition teaches balance and diversity!',
  
  // Seasonal & Special
  '🎄 Holiday challenge: Build a team using only red and green Pokémon!',
  '🎃 Spooky challenge: Create a team using only Ghost and Dark types!',
  '💝 Valentine\'s challenge: Build a team using only pink and red Pokémon!',
  '🍀 Lucky challenge: Create a team using only green Pokémon!',
  '🎆 New Year challenge: Build a team using only gold and silver Pokémon!',
  '🌺 Spring challenge: Create a team using only Grass and Bug types!',
  '☀️ Summer challenge: Build a team using only Fire and Water types!',
  '🍂 Fall challenge: Create a team using only orange and brown Pokémon!',
  '❄️ Winter challenge: Build a team using only Ice and Steel types!',
  '🎂 Birthday challenge: Use only Pokémon from your birth month\'s generation!',
  
  // Creative & Artistic
  '🎨 Art challenge: Draw your team and see how they look together!',
  '🎭 Roleplay challenge: Give each Pokémon a personality and backstory!',
  '📝 Story challenge: Write a short story about your team\'s adventures!',
  '🎵 Music challenge: Create a theme song for your team!',
  '🎪 Performance challenge: Imagine your team in a Pokémon contest!',
  '🏆 Tournament challenge: Create a tournament bracket for your teams!',
  '📚 Book challenge: Write a guide about your team\'s strategy!',
  '🎬 Movie challenge: Cast your team in a Pokémon movie!',
  '🎮 Game challenge: Create a mini-game for your team!',
  '🎨 Design challenge: Create new forms for your favorite Pokémon!',
]

const HELP_TIPS: Record<string, HelpTip[]> = {
  '/': [
    {
      id: 'welcome',
      title: 'Welcome to PokéDex!',
      content: 'Browse through all Pokémon using the infinite scroll. Click any Pokémon card to see detailed information, or use the comparison feature to compare multiple Pokémon.',
      duration: 5,
      type: 'helpful'
    },
    {
      id: 'filters',
      title: 'Search & Filter',
      content: 'Use the search bar to find specific Pokémon by name or ID. Filter by type, generation, or sort by different criteria using the filter controls.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'comparison',
      title: 'Compare Pokémon',
      content: 'Click the comparison button (⚖️) on any Pokémon card to add it to your comparison list. View up to 6 Pokémon side by side!',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'themes',
      title: 'Choose Your Style',
      content: 'Switch between different PokéDex themes using the theme toggle. Try the retro Game Boy styles or modern themes!',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'pokemon_quiz',
      title: '🎮 Pokémon Quiz Challenge!',
      content: 'Try this: Search for a Pokémon without looking at the name, just by typing its number! Can you guess who #025, #150, or #493 are?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'type_collector',
      title: '🏆 Type Collector Game',
      content: 'Challenge yourself to find one Pokémon of each type! Use the type filter to track your progress. How many can you collect?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'generation_master',
      title: '🌟 Generation Master',
      content: 'Test your knowledge! Try to name every starter Pokémon from each generation without looking. Filter by generation to check your answers!',
      duration: 4,
      type: 'fun'
    }
  ],
  '/battle': [
    {
      id: 'select_team',
      title: 'Select Your Team',
      content: 'First, choose your team from saved teams or create a new one in the Team Builder. Your team needs at least one Pokémon to battle.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'choose_opponent',
      title: 'Choose Your Opponent',
      content: 'Select from various Gym Leaders and Champions. On mobile: tap once to see details, tap twice to battle. On desktop: hover for details, click to battle.',
      duration: 5,
      type: 'helpful'
    },
    {
      id: 'battle_controls',
      title: 'Battle Controls',
      content: 'During battle, select moves from your Pokémon\'s moveset. Pay attention to type effectiveness and your Pokémon\'s stats!',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'online_battles',
      title: 'Online Battles',
      content: 'Want to battle real players? Click "Online Battles" to join the lobby and create or join battle rooms.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'gym_challenge',
      title: '🏟️ Gym Challenge Mode!',
      content: 'Try to beat all Gym Leaders in order! Start with Brock and work your way up to the Elite Four. Can you complete the full challenge?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'monotype_challenge',
      title: '🎯 Monotype Challenge',
      content: 'Challenge yourself to battle using only one type! Create a team of all Fire, Water, or Electric Pokémon and see how far you can get!',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'starter_battle',
      title: '🔥 Starter vs Starter',
      content: 'Create teams using only starter Pokémon from different generations. Which generation\'s starters are the strongest?',
      duration: 3,
      type: 'fun'
    }
  ],
  '/team': [
    {
      id: 'build_team',
      title: 'Build Your Team',
      content: 'Add Pokémon to your team using the quick selector or search. Each Pokémon can have up to 4 moves and different levels.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'moveset',
      title: 'Configure Movesets',
      content: 'Click on any Pokémon slot to expand it. Select moves from the available moves list. Toggle "Level moves only" to see moves your Pokémon can learn at its current level.',
      duration: 5,
      type: 'helpful'
    },
    {
      id: 'team_analysis',
      title: 'Team Analysis',
      content: 'View your team\'s type coverage, weaknesses, and strengths in the analysis panels. Get suggestions for improving your team composition.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'save_teams',
      title: 'Save Your Teams',
      content: 'Give your team a name and save it. Sign in to sync teams across devices, or save locally for offline use.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'rainbow_team',
      title: '🌈 Rainbow Team Challenge',
      content: 'Build a team where each Pokémon has a different type! Can you create a balanced team with 6 different types?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'underdog_team',
      title: '🐛 Underdog Challenge',
      content: 'Create a team using only the first 25 Pokémon (Bug and Grass types)! Prove that even the "weakest" Pokémon can be strong with the right strategy.',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'legendary_team',
      title: '⚡ Legendary Dream Team',
      content: 'If you could have any 6 Legendary Pokémon on your team, who would you choose? Build your ultimate Legendary squad!',
      duration: 3,
      type: 'fun'
    }
  ],
  '/lobby': [
    {
      id: 'create_room',
      title: 'Create a Battle Room',
      content: 'Click "Create Room" to start a new battle room. Set the room name and choose your team. Share the room code with friends!',
      duration: 4
    },
    {
      id: 'join_room',
      title: 'Join a Room',
      content: 'Enter a room code to join an existing battle. Make sure you have a team ready before joining!',
      duration: 3
    },
    {
      id: 'team_selection',
      title: 'Prepare Your Team',
      content: 'Select your team before creating or joining a room. You can switch teams anytime before the battle starts.',
      duration: 3
    }
  ],
  '/evolutions': [
    {
      id: 'explore_families',
      title: 'Explore Evolution Families',
      content: 'Click on any Pokémon to see its evolution family. Use filters to focus on specific generations or evolution methods.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'filter_methods',
      title: 'Filter by Evolution Method',
      content: 'Use the evolution method filter to find Pokémon that evolve by leveling, trading, stones, or friendship.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'branching_evolutions',
      title: 'Branching Evolutions',
      content: 'Enable "Branching Only" to see Pokémon with multiple evolution paths, like Eevee\'s different evolutions.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'evolution_quiz',
      title: '🔬 Evolution Scientist Quiz',
      content: 'Test your knowledge! How many Pokémon can you name that evolve with friendship? Which Pokémon evolves with a Sun Stone?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'longest_chain',
      title: '🔗 Longest Evolution Chain',
      content: 'Find the Pokémon with the longest evolution chain! Some Pokémon have 3-stage evolutions. Can you find them all?',
      duration: 3,
      type: 'fun'
    },
    {
      id: 'branching_master',
      title: '🌿 Branching Evolution Master',
      content: 'Eevee isn\'t the only Pokémon with multiple evolution paths! Find other Pokémon that can evolve into different forms.',
      duration: 4,
      type: 'fun'
    }
  ],
  '/type-matchups': [
    {
      id: 'type_wheel',
      title: 'Interactive Type Wheel',
      content: 'Click on any type to see its effectiveness against other types. The wheel shows super effective, not very effective, and immune matchups.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'dual_types',
      title: 'Dual-Type Pokémon',
      content: 'Select multiple defender types to see how attacks affect dual-type Pokémon. Type effectiveness multiplies!',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'matrix_view',
      title: 'Matrix View',
      content: 'Switch to matrix view for a complete overview of all type matchups. Great for strategic planning!',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'type_master',
      title: '🧠 Type Master Challenge',
      content: 'Test your knowledge! Without looking, try to name all the types that are super effective against Dragon, or which types resist Fire attacks!',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'weakness_hunt',
      title: '🎯 Weakness Hunt Game',
      content: 'Find the type combination that\'s weak to the most attacks! Try different dual-type combinations and see which one has the most 4x weaknesses.',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'immunity_challenge',
      title: '🛡️ Immunity Challenge',
      content: 'Create the ultimate defensive Pokémon! Find type combinations that have the most immunities. Ghost/Normal is a good start!',
      duration: 3,
      type: 'fun'
    }
  ],
  '/trends': [
    {
      id: 'popularity_data',
      title: 'Popularity Trends',
      content: 'Explore how Pokémon popularity has changed over time. The animated lines show usage trends across different formats.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'bubble_timeline',
      title: 'Bubble Timeline',
      content: 'Use the bubble timeline to jump to specific time periods. Larger bubbles indicate higher usage during that period.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'format_filtering',
      title: 'Format Filtering',
      content: 'Filter by different competitive formats to see how Pokémon usage varies between singles, doubles, and different generations.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'trend_prediction',
      title: '🔮 Trend Prediction Game',
      content: 'Try to predict which Pokémon will be popular next month! Look at the trends and see if you can spot the next rising star.',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'underdog_hunt',
      title: '🐕 Underdog Hunt',
      content: 'Find Pokémon that were popular in the past but are now forgotten. Can you discover hidden gems that deserve more love?',
      duration: 3,
      type: 'fun'
    }
  ],
  '/usage': [
    {
      id: 'usage_stats',
      title: 'Usage Statistics',
      content: 'View detailed usage statistics for Pokémon in competitive play. See movesets, teammates, and common strategies.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'move_analysis',
      title: 'Move Analysis',
      content: 'Analyze which moves are most popular for each Pokémon and how they affect usage rates.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'meta_detective',
      title: '🕵️ Meta Detective',
      content: 'Can you figure out why certain Pokémon are popular? Look at their movesets and teammates to understand the meta!',
      duration: 4,
      type: 'fun'
    }
  ],
  '/top50': [
    {
      id: 'popular_pokemon',
      title: 'Top 50 Pokémon',
      content: 'Discover the most popular Pokémon in competitive play. Rankings are based on usage statistics and tournament performance.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'usage_rates',
      title: 'Usage Rates',
      content: 'See detailed usage percentages and how Pokémon rankings have changed over time.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'tier_prediction',
      title: '🏆 Tier Prediction Game',
      content: 'Try to guess which Pokémon are in the top 10! Test your competitive knowledge and see how well you know the meta.',
      duration: 4,
      type: 'fun'
    }
  ],
  '/compare': [
    {
      id: 'compare_pokemon',
      title: 'Compare Pokémon',
      content: 'Select up to 6 Pokémon to compare their stats, types, and abilities side by side. Perfect for team building decisions!',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'stat_comparison',
      title: 'Stat Analysis',
      content: 'Compare base stats, type effectiveness, and other attributes to make informed decisions.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'stat_guessing',
      title: '🎯 Stat Guessing Challenge',
      content: 'Pick two Pokémon and try to guess which has higher stats before comparing! Test your Pokémon knowledge.',
      duration: 3,
      type: 'fun'
    }
  ],
  '/insights': [
    {
      id: 'data_insights',
      title: 'Data Insights',
      content: 'Explore various data visualizations and insights about Pokémon. Access evolution charts, usage trends, and more.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'navigation',
      title: 'Navigation',
      content: 'Use the navigation menu to access different insight tools like evolution trees, popularity trends, and usage statistics.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'data_explorer',
      title: '🔍 Data Explorer Challenge',
      content: 'Try to find the most interesting data patterns! Can you discover which generation has the most Legendary Pokémon?',
      duration: 4,
      type: 'fun'
    }
  ],
  '/meta': [
    {
      id: 'meta_analysis',
      title: 'Meta Analysis',
      content: 'Analyze the current competitive metagame. See which Pokémon and strategies are dominant in different formats.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'format_data',
      title: 'Format Data',
      content: 'View meta information for different competitive formats including singles, doubles, and various generations.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'meta_trendsetter',
      title: '🚀 Meta Trendsetter',
      content: 'Try to predict the next meta shift! Which currently unpopular Pokémon do you think will become popular?',
      duration: 4,
      type: 'fun'
    }
  ],
  '/checklist': [
    {
      id: 'pokemon_checklist',
      title: 'Pokémon Checklist',
      content: 'Track your progress in catching or encountering different Pokémon. Mark them as seen or caught to keep track of your collection.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'filtering',
      title: 'Filter & Search',
      content: 'Use filters to focus on specific generations, types, or completion status. Search for specific Pokémon quickly.',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'collection_challenge',
      title: '📚 Collection Challenge',
      content: 'Try to "catch" one Pokémon from each generation first! See how many generations you can complete in your checklist.',
      duration: 3,
      type: 'fun'
    }
  ],
  '/pokemon': [
    {
      id: 'pokemon_details',
      title: 'Pokémon Details',
      content: 'Explore detailed information about this Pokémon including stats, moves, evolution chain, and type matchups. Use the tabs to navigate between different sections.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'stats_analysis',
      title: 'Understanding Stats',
      content: 'Each stat affects different aspects of battle. HP determines survivability, Attack/Sp. Attack for damage, Defense/Sp. Defense for protection, and Speed for turn order.',
      duration: 5,
      type: 'helpful'
    },
    {
      id: 'moveset_guide',
      title: 'Moveset Strategy',
      content: 'Check the moves tab to see all moves this Pokémon can learn. Pay attention to move types, power, accuracy, and special effects when building your team.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'evolution_chain',
      title: 'Evolution Information',
      content: 'View the evolution chain to see how this Pokémon evolves and what conditions are required. Some Pokémon have multiple evolution paths!',
      duration: 3,
      type: 'helpful'
    },
    {
      id: 'type_matchups',
      title: 'Type Effectiveness',
      content: 'Check the matchups tab to see which types are super effective against this Pokémon and which types it resists or is immune to.',
      duration: 4,
      type: 'helpful'
    },
    {
      id: 'pokemon_quiz',
      title: '🎯 Pokémon Expert Quiz',
      content: 'Test your knowledge! Can you guess this Pokémon\'s base stat total without looking? Try to predict its highest and lowest stats!',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'team_building',
      title: '🏗️ Team Building Challenge',
      content: 'Think about how this Pokémon would fit in a team! What other Pokémon would complement its strengths and cover its weaknesses?',
      duration: 4,
      type: 'fun'
    },
    {
      id: 'move_guessing',
      title: '⚔️ Move Prediction Game',
      content: 'Before checking the moves tab, try to guess what types of moves this Pokémon can learn based on its type and appearance!',
      duration: 3,
      type: 'fun'
    }
  ]
}

const DEFAULT_TIPS: HelpTip[] = [
  {
    id: 'general_help',
    title: 'Need Help?',
    content: 'Look for the help assistant in the bottom right corner on any page. It provides contextual tips for each section!',
    duration: 3,
    type: 'helpful'
  },
  {
    id: 'random_pokemon',
    title: '🎲 Random Pokémon Challenge!',
    content: 'Try this: Close your eyes and scroll randomly through the PokéDex, then try to guess which Pokémon you landed on just by seeing its sprite!',
    duration: 4,
    type: 'fun'
  }
]

export default function HelpAssistant({ className = '' }: HelpAssistantProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [hasSeenTips, setHasSeenTips] = useState<Set<string>>(new Set())
  const [isDismissed, setIsDismissed] = useState(false)
  const [hideForever, setHideForever] = useState(false)
  const [hideThisPath, setHideThisPath] = useState(false)
  const [currentPokemon, setCurrentPokemon] = useState<{ id: string; name: string }>(() => 
    HELP_POKEMON[Math.floor(Math.random() * HELP_POKEMON.length)]
  )
  const [clippyStyle, setClippyStyle] = useState(CLIPPY_STYLES[Math.floor(Math.random() * CLIPPY_STYLES.length)])
  const [quotesForPage, setQuotesForPage] = useState<string[]>(() => {
    // Shuffle the quotes array once per page load
    const shuffled = [...POKE_QUOTES].sort(() => Math.random() - 0.5)
    return shuffled
  })

  // Get tips for current page or default tips
  const getCurrentTips = useCallback(() => {
    let tips: HelpTip[] = []
    
    // Check for exact path match first
    if (HELP_TIPS[pathname]) {
      tips = HELP_TIPS[pathname]
    } else {
      // Check for path prefixes (e.g., /lobby/[roomId])
      // Sort keys by length (longest first) to match more specific paths first
      const sortedKeys = Object.keys(HELP_TIPS).sort((a, b) => b.length - a.length)
      const matchingPath = sortedKeys.find(key => pathname.startsWith(key))
      if (matchingPath) {
        tips = HELP_TIPS[matchingPath]
      } else {
        tips = DEFAULT_TIPS
      }
    }
    
    // If no page-specific tips found, or page has no helpful/fun tips,
    // fall back to a random quote to keep the assistant lively
    if (!tips || tips.length === 0) {
      return [{ id: 'quote', title: `${clippyStyle.emoji} ${clippyStyle.label} says`, content: quotesForPage[0], type: 'quote' }]
    }

    // Return all tips in their original order - no random mixing
    // This ensures the tip set remains stable during navigation
    return tips
  }, [pathname, clippyStyle, quotesForPage])

  const currentTips = getCurrentTips()
  
  // Ensure currentTipIndex is within bounds
  const safeTipIndex = Math.min(currentTipIndex, Math.max(0, currentTips.length - 1))
  const currentTip = currentTips[safeTipIndex]
  
  // Reset tip index if it's out of bounds
  useEffect(() => {
    if (currentTipIndex >= currentTips.length && currentTips.length > 0) {
      setCurrentTipIndex(0)
    }
  }, [currentTipIndex, currentTips.length])

  // Load persisted preferences
  useEffect(() => {
    try {
      const globalHidden = localStorage.getItem('help-assistant-hide-forever') === '1'
      const pathHidden = localStorage.getItem(`help-assistant-hide:${pathname}`) === '1'
      setHideForever(globalHidden)
      setHideThisPath(pathHidden)
    } catch {}
  }, [pathname])

  // Show help assistant after a delay
  useEffect(() => {
    if (isDismissed || hideForever || hideThisPath) return
    
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3000) // Show after 3 seconds

    return () => clearTimeout(timer)
  }, [pathname, isDismissed, hideForever, hideThisPath])

  // Listen for poke-tips reset events to show immediately
  useEffect(() => {
    const handlePokeTipsReset = () => {
      // Reset all hidden states
      setIsDismissed(false)
      setHideForever(false)
      setHideThisPath(false)
      // Show immediately
      setIsVisible(true)
      // Reset tip index to start from beginning
      setCurrentTipIndex(0)
      // Pick new random elements for fresh experience
      setCurrentPokemon(HELP_POKEMON[Math.floor(Math.random() * HELP_POKEMON.length)])
      setClippyStyle(CLIPPY_STYLES[Math.floor(Math.random() * CLIPPY_STYLES.length)])
      const shuffled = [...POKE_QUOTES].sort(() => Math.random() - 0.5)
      setQuotesForPage(shuffled)
    }

    window.addEventListener('poke-tips-reset', handlePokeTipsReset)
    return () => window.removeEventListener('poke-tips-reset', handlePokeTipsReset)
  }, [])

  // Reset dismissed state when pathname changes and pick new random elements
  useEffect(() => {
    setIsDismissed(false)
    setCurrentTipIndex(0)
    setCurrentPokemon(HELP_POKEMON[Math.floor(Math.random() * HELP_POKEMON.length)])
    // Shuffle quotes for the new page
    const shuffled = [...POKE_QUOTES].sort(() => Math.random() - 0.5)
    setQuotesForPage(shuffled)
  }, [pathname])

  // Auto-advance removed by user request

  // Mark tip as seen
  const markTipAsSeen = useCallback((tipId: string) => {
    setHasSeenTips(prev => new Set([...prev, tipId]))
  }, [])

  // Navigation functions
  const nextTip = useCallback(() => {
    setCurrentTipIndex(prev => (prev + 1) % currentTips.length)
  }, [currentTips.length])

  const prevTip = useCallback(() => {
    setCurrentTipIndex(prev => (prev - 1 + currentTips.length) % currentTips.length)
  }, [currentTips.length])

  const closeHelp = useCallback(() => {
    // Minimize only: keep the bottom assistant button visible
    setIsExpanded(false)
    setIsVisible(true)
    setIsDismissed(false)
    if (currentTip) {
      markTipAsSeen(currentTip.id)
    }
  }, [currentTip, markTipAsSeen])

  const toggleHelp = useCallback(() => {
    if (isExpanded) {
      closeHelp()
    } else {
      setIsExpanded(true)
      if (currentTip) {
        markTipAsSeen(currentTip.id)
      }
    }
  }, [isExpanded, closeHelp, currentTip, markTipAsSeen])

  // Keyboard navigation
  useEffect(() => {
    if (!isExpanded) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          closeHelp()
          break
        case 'ArrowLeft':
          event.preventDefault()
          prevTip()
          break
        case 'ArrowRight':
          event.preventDefault()
          nextTip()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, closeHelp, prevTip, nextTip])

  // Don't show if user has seen all tips for this page
  const unseenTips = currentTips.filter(tip => !hasSeenTips.has(tip.id))
  const shouldShow = isVisible && unseenTips.length > 0

  if (!shouldShow) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6 ${className}`}>
      {/* Help Assistant Button */}
      {!isExpanded && (
        <button
          onClick={toggleHelp}
          className="group relative bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label={`Open ${currentPokemon.name} help assistant`}
        >
          <img
            src={`/assets/pmd/${currentPokemon.id}/portrait/Normal.png`}
            alt={`${currentPokemon.name} Help Assistant`}
            className="w-12 h-12 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentPokemon.id.replace(/^0+/, '') || currentPokemon.id}.png`
            }}
          />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
            !
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-20"></div>
        </button>
      )}

      {/* Expanded Help Panel */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-2xl shadow-2xl max-w-sm w-72 sm:w-80 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <img
                src={`/assets/pmd/${currentPokemon.id}/portrait/Happy.png`}
                alt={currentPokemon.name}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${currentPokemon.id.replace(/^0+/, '') || currentPokemon.id}.png`
                }}
              />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                  {currentPokemon.name} {clippyStyle.label}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tip {currentTipIndex + 1} of {currentTips.length}
                </p>
              </div>
            </div>
            <button
              onClick={closeHelp}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close help"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tip Content */}
          <div className="p-4">
            {currentTip ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {currentTip.type === 'fun' && (
                    <span className="text-lg">🎮</span>
                  )}
                  {currentTip.type === 'quote' && (
                    <span className="text-lg">{clippyStyle.emoji}</span>
                  )}
                  <h4 className={`font-semibold mb-0 ${
                    currentTip.type === 'fun'
                      ? 'text-purple-600 dark:text-purple-400'
                      : currentTip.type === 'quote'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {currentTip.title}
                  </h4>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentTip.content}
                  <span className="block mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                    {clippyStyle.emoji} {quotesForPage[currentTipIndex % quotesForPage.length]}
                  </span>
                </p>
                {currentTip.type === 'fun' && (
                  <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                    <p className="text-xs text-purple-700 dark:text-purple-300 font-medium">
                      💡 Fun Challenge Tip
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No tips available at the moment.
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          {currentTips.length > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={prevTip}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Previous tip"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              {/* Progress dots */}
              <div className="flex gap-1">
                {currentTips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentTipIndex(index)
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTipIndex
                        ? 'bg-yellow-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    aria-label={`Go to tip ${index + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextTip}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                aria-label="Next tip"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="px-4 pb-4 -mt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  try { localStorage.setItem(`help-assistant-hide:${pathname}`, '1') } catch {}
                  setIsExpanded(false)
                  setIsVisible(false)
                }}
                className="text-xs px-3 py-1.5 rounded border border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors"
                title="Hide tips for this area"
              >
                🥚 {currentPokemon.name} will stay in the Poké Ball here
              </button>
              <button
                onClick={() => {
                  try { localStorage.setItem('help-assistant-hide-forever', '1') } catch {}
                  setIsExpanded(false)
                  setIsVisible(false)
                }}
                className="text-xs px-3 py-1.5 rounded border border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                title="Hide tips everywhere"
              >
                ✨ Return {currentPokemon.name} to the PC (hide everywhere)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
