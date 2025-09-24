import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pokémon type colors using official Pokémon colors
export const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-type-normal', text: 'text-black', border: 'border-type-normal/20' },
  fire: { bg: 'bg-type-fire', text: 'text-white', border: 'border-type-fire/20' },
  water: { bg: 'bg-type-water', text: 'text-white', border: 'border-type-water/20' },
  electric: { bg: 'bg-type-electric', text: 'text-black', border: 'border-type-electric/20' },
  grass: { bg: 'bg-type-grass', text: 'text-white', border: 'border-type-grass/20' },
  ice: { bg: 'bg-type-ice', text: 'text-black', border: 'border-type-ice/20' },
  fighting: { bg: 'bg-type-fighting', text: 'text-white', border: 'border-type-fighting/20' },
  poison: { bg: 'bg-type-poison', text: 'text-white', border: 'border-type-poison/20' },
  ground: { bg: 'bg-type-ground', text: 'text-black', border: 'border-type-ground/20' },
  flying: { bg: 'bg-type-flying', text: 'text-white', border: 'border-type-flying/20' },
  psychic: { bg: 'bg-type-psychic', text: 'text-white', border: 'border-type-psychic/20' },
  bug: { bg: 'bg-type-bug', text: 'text-white', border: 'border-type-bug/20' },
  rock: { bg: 'bg-type-rock', text: 'text-white', border: 'border-type-rock/20' },
  ghost: { bg: 'bg-type-ghost', text: 'text-white', border: 'border-type-ghost/20' },
  dragon: { bg: 'bg-type-dragon', text: 'text-white', border: 'border-type-dragon/20' },
  dark: { bg: 'bg-type-dark', text: 'text-white', border: 'border-type-dark/20' },
  steel: { bg: 'bg-type-steel', text: 'text-black', border: 'border-type-steel/20' },
  fairy: { bg: 'bg-type-fairy', text: 'text-black', border: 'border-type-fairy/20' },
}

// Stat colors
export const statColors: Record<string, string> = {
  hp: 'bg-red-500',
  attack: 'bg-orange-500',
  defense: 'bg-yellow-500',
  'special-attack': 'bg-purple-500',
  'special-defense': 'bg-blue-500',
  speed: 'bg-green-500',
}

// Format Pokémon name
export function formatPokemonName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
}

// Format Pokémon number
export function formatPokemonNumber(id: number): string {
  // Don't display numbers for Pokemon with ID 0 (placeholder/unknown Pokemon)
  if (id === 0) return '';
  return `#${id.toString().padStart(3, '0')}`;
}

// Format height and weight
export function formatHeight(height: number): string {
  return `${(height / 10).toFixed(1)} m`;
}

export function formatWeight(weight: number): string {
  return `${(weight / 10).toFixed(1)} kg`;
}

// Generate battle ID for AI battles
export function generateBattleId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ai_battle_${timestamp}_${random}`;
}

// Get authentic Pokémon descriptions
export function getPokemonDescription(pokemon: { name: string; types?: Array<{ type: { name: string } }> }): string {
  // Real Pokémon descriptions from the games
  const descriptions: Record<string, string> = {
    'bulbasaur': 'A strange seed was planted on its back at birth. The plant sprouts and grows with this Pokémon.',
    'ivysaur': 'When the bulb on its back grows large, it appears to lose the ability to stand on its hind legs.',
    'venusaur': 'The plant blooms when it is absorbing solar energy. It stays on the move to seek sunlight.',
    'charmander': 'Obviously prefers hot places. When it rains, steam is said to spout from the tip of its tail.',
    'charmeleon': 'When it swings its burning tail, it elevates the temperature to unbearably hot levels.',
    'charizard': 'Spits fire that is hot enough to melt boulders. Known to cause forest fires unintentionally.',
    'squirtle': 'After birth, its back swells and hardens into a shell. Powerfully sprays foam from its mouth.',
    'wartortle': 'Often hides in water to stalk unwary prey. For swimming fast, it moves its ears to maintain balance.',
    'blastoise': 'A brutal Pokémon with pressurized water jets on its shell. They are used for high speed tackles.',
    'caterpie': 'Its short feet are tipped with suction pads that enable it to tirelessly climb slopes and walls.',
    'metapod': 'This Pokémon is vulnerable to attack while its shell is soft, exposing its weak and tender body.',
    'butterfree': 'In battle, it flaps its wings at high speed to release highly toxic dust into the air.',
    'weedle': 'Often found in forests, eating leaves. It has a sharp venomous stinger on its head.',
    'kakuna': 'Almost incapable of moving, this Pokémon can only harden its shell to protect itself from predators.',
    'beedrill': 'Flies at high speed and attacks using the large venomous stingers on its forelegs and tail.',
    'pidgey': 'A common sight in forests and woods. It flaps its wings at ground level to kick up blinding sand.',
    'pidgeotto': 'Very protective of its sprawling territorial area, this Pokémon will fiercely peck at any intruder.',
    'pidgeot': 'When hunting, it skims the surface of water at high speed to pick off unwary prey such as Magikarp.',
    'rattata': 'Bites anything when it attacks. Small and very quick, it is a common sight in many places.',
    'raticate': 'It uses its whiskers to maintain its balance. It apparently slows down if they are cut off.',
    'spearow': 'Eats bugs in grassy areas. It has to flap its short wings at high speed to stay airborne.',
    'fearow': 'With its huge and magnificent wings, it can keep aloft without ever having to land for rest.',
    'ekans': 'Moves silently and stealthily. Eats the eggs of birds, such as Pidgey and Spearow, whole.',
    'arbok': 'It is rumored that the ferocious warning markings on its belly differ from area to area.',
    'pikachu': 'When several of these Pokémon gather, their electricity can cause lightning storms.',
    'raichu': 'Its long tail serves as a ground to protect itself from its own electrical power.',
    'sandshrew': 'Burrows deep underground in arid locations far from water. It only emerges to hunt for food.',
    'sandslash': 'Curls up into a spiny ball when threatened. It can roll while curled up to attack or escape.',
    'nidoran-f': 'Although small, its venomous barbs repel predators. The female has smaller horns.',
    'nidorina': 'The female\'s horn develops slowly. Prefers physical attacks such as clawing and biting.',
    'nidoqueen': 'Its hard scales provide strong protection. It uses its hefty bulk to execute powerful moves.',
    'nidoran-m': 'Stiffens its ears to sense danger. The larger its horns, the more powerful its secreted poison.',
    'nidorino': 'An aggressive Pokémon that is quick to attack. The horn on its head secretes a powerful venom.',
    'nidoking': 'It uses its powerful tail in battle to smash, constrict, then break the prey\'s bones.',
    'cleffa': 'If the impact site of a meteorite is found, this Pokémon is certain to be within the immediate area.',
    'clefairy': 'Its magical and cute appeal has many admirers. It is rare and found only in certain areas.',
    'clefable': 'A timid fairy Pokémon that is rarely seen. It will run and hide the moment it senses people.',
    'vulpix': 'At the time of birth, it has just one tail. The tail splits from its tip as it grows older.',
    'ninetales': 'Very smart and very vengeful. Grabbing one of its many tails could result in a 1000-year curse.',
    'jigglypuff': 'When its huge eyes light up, it sings a mysteriously soothing melody that lulls its enemies to sleep.',
    'wigglytuff': 'The body is soft and rubbery. When angered, it will suck in air and inflate itself to an enormous size.',
    'zubat': 'Forms colonies in perpetually dark places. Uses ultrasonic waves to identify and approach targets.',
    'golbat': 'Once it strikes, it will not stop draining energy from the victim even if it gets too heavy to fly.',
    'oddish': 'During the day, it keeps its face buried in the ground. At night, it wanders around sowing its seeds.',
    'gloom': 'The fluid that oozes from its mouth isn\'t drool. It is a nectar that is used to attract prey.',
    'vileplume': 'The larger its petals, the more toxic pollen it contains. Its big head is heavy and hard to hold up.',
    'paras': 'Burrows to suck tree roots. The mushrooms on its back grow by drawing nutrients from the bug host.',
    'parasect': 'A host-parasite pair in which the parasite mushroom has taken over the host bug. Prefers damp places.',
    'venonat': 'The compound eyes are divided into sections. It can see in all directions without moving its head.',
    'venomoth': 'The dust-like scales covering its wings are color coded to indicate the kinds of poison it has.',
    'diglett': 'Lives about one yard underground where it feeds on plant roots. It sometimes appears above ground.',
    'dugtrio': 'A team of triplets that can burrow over 60 MPH. Due to this, some people think it\'s an earthquake.',
    'meowth': 'Adores circular objects. Wanders the streets on a nightly basis to look for dropped loose change.',
    'persian': 'Although its fur has many admirers, it is tough to raise as a pet because of its fickle meanness.',
    'psyduck': 'Constantly troubled by headaches. It uses psychic powers when its head hurts.',
    'golduck': 'Often seen swimming elegantly by lake shores. It is often mistaken for the Japanese monster, Kappa.',
    'mankey': 'Extremely quick to anger. It could be docile one moment then thrashing away the next instant.',
    'primeape': 'Always furious and tenacious to boot. It will not abandon chasing its quarry until it is caught.',
    'growlithe': 'Very protective of its territory. It will bark and bite to repel intruders from its space.',
    'arcanine': 'A Pokémon that has been admired since the past for its beauty. It runs agilely as if on wings.',
    'poliwag': 'Its newly hatched tail enables it to swim. The direction of the spiral on the belly differs by area.',
    'poliwhirl': 'Capable of living in or out of water. When out of water, it constantly sweats to keep its body slimy.',
    'poliwrath': 'An adept swimmer at both the front crawl and breast stroke. Easily overtakes the best human swimmers.',
    'abra': 'Using its ability to read minds, it will identify impending danger and teleport to safety.',
    'kadabra': 'It emits special alpha waves from its body that induce headaches just by being close by.',
    'alakazam': 'Its brain can outperform a supercomputer. Its intelligence quotient is said to be 5,000.',
    'machop': 'Loves to build its muscles. It trains in all styles of martial arts to become even stronger.',
    'machoke': 'The belt around its waist holds back its energy. Without it, this Pokémon would be unstoppable.',
    'machamp': 'Using its heavy muscles, it throws powerful punches that can send the victim clear over the horizon.',
    'bellsprout': 'A carnivorous Pokémon that traps and eats bugs. It uses its root feet to soak up needed moisture.',
    'weepinbell': 'It spits out poisonpowder to immobilize the enemy and then finishes it with a spray of acid.',
    'victreebel': 'Said to live in huge colonies deep in jungles, although no one has ever returned from there.',
    'tentacool': 'Drifts in shallow seas. Anglers who hook them by accident are often punished by its sharp acid.',
    'tentacruel': 'The tentacles are normally kept short. On hunts, they are extended to ensnare and immobilize prey.',
    'geodude': 'Found in fields and mountains. Mistaking them for boulders, people often step or trip on them.',
    'graveler': 'Rolls down slopes to move. It rolls over any obstacle without slowing or changing its direction.',
    'golem': 'Its boulder-like body is extremely hard. It can easily withstand dynamite blasts without damage.',
    'ponyta': 'Its hooves are 10 times harder than diamonds. It can trample anything completely flat in little time.',
    'rapidash': 'Very competitive, this Pokémon will chase anything that moves fast in the hopes of racing it.',
    'slowpoke': 'Incredibly slow and dopey. It takes 5 seconds for it to feel pain when under attack.',
    'slowbro': 'The Shellder that is latched onto Slowpoke\'s tail is said to feed on the host\'s left-over scraps.',
    'magnemite': 'Uses anti-gravity to stay suspended. Appears without warning and uses Thunder Wave and similar moves.',
    'magneton': 'Formed by several Magnemite linked together. They frequently appear when sunspots flare up.',
    'farfetchd': 'The plant stalk it holds is its weapon. The stalk is used like a sword to cut all sorts of things.',
    'doduo': 'A bird that makes up for its poor flying with its fast foot speed. Leaves giant footprints.',
    'dodrio': 'Uses its three brains to execute complex plans. While two heads sleep, one head stays awake.',
    'seel': 'The protruding horn on its head is very hard. It is used for bashing through thick ice.',
    'dewgong': 'Stores thermal energy in its body. Swims at a steady 8 knots even in intensely cold waters.',
    'grimer': 'Appears in filthy areas. Thrives by sucking up polluted sludge that is pumped out of factories.',
    'muk': 'Thickly covered with a filthy, vile sludge. It is so toxic, even its footprints contain poison.',
    'shellder': 'Its hard shell repels any kind of attack. It is vulnerable only when its shell is open.',
    'cloyster': 'When attacked, it launches its horns in quick volleys. Its innards have never been seen.',
    'gastly': 'Almost invisible, this gaseous Pokémon cloaks the target and puts it to sleep without notice.',
    'haunter': 'Because of its ability to slip through block walls, it is said to be from another dimension.',
    'gengar': 'On the night of a full moon, if shadows move on their own and laugh, it must be Gengar\'s doing.',
    'onix': 'As it grows, the stone portions of its body harden to become similar to a diamond, but colored black.',
    'drowzee': 'Puts enemies to sleep then eats their dreams. Occasionally gets sick from eating bad dreams.',
    'hypno': 'When it locks eyes with an enemy, it will use a mix of psi moves such as Hypnosis and Confusion.',
    'krabby': 'Its pincers are not only powerful weapons, they are used for balance when walking sideways.',
    'kingler': 'The large pincer has 10,000-horsepower strength. However, its huge size makes it unwieldy to use.',
    'voltorb': 'Usually found in power plants. Easily mistaken for a Poké Ball, they also tend to explode without warning.',
    'electrode': 'It stores electric energy under very high pressure. It often explodes with little or no provocation.',
    'exeggcute': 'Often mistaken for eggs. When disturbed, they quickly gather and attack in swarms.',
    'exeggutor': 'Legend has it that on rare occasions, one of its heads will drop off and continue on as an Exeggcute.',
    'cubone': 'Because it never removes its helmet, no one has ever seen this Pokémon\'s real face.',
    'marowak': 'The bone it holds is its key weapon. It throws the bone skillfully like a boomerang to KO targets.',
    'hitmonlee': 'When in a hurry, its legs lengthen progressively. It runs smoothly with extra long, loping strides.',
    'hitmonchan': 'While apparently doing nothing, it fires punches in lightning fast volleys that are impossible to see.',
    'lickitung': 'Its tongue can be extended like a chameleon\'s. It leaves a tingling sensation when it licks enemies.',
    'koffing': 'Because it stores several kinds of toxic gases in its body, it is prone to exploding without warning.',
    'weezing': 'Where two kinds of poison gases meet, 2 Koffings can fuse into a Weezing over many years.',
    'rhyhorn': 'Its massive bones are 1000 times harder than human bones. It can easily knock a trailer flying.',
    'rhydon': 'Protected by an armor-like hide, it is capable of living in molten lava of 3,600 degrees.',
    'chansey': 'A rare and elusive Pokémon that is said to bring happiness to those who manage to get one.',
    'tangela': 'The whole body is swathed with wide vines that are similar to seaweed. Its vines shake as it walks.',
    'kangaskhan': 'The infant rarely ventures out of its mother\'s protective pouch until it is 3 years old.',
    'horsea': 'Known to shoot downward at anything that moves. Eats small fish and bugs that live in the sea.',
    'seadra': 'Capable of swimming backwards by rapidly flapping its wing-like pectoral fins and stout tail.',
    'goldeen': 'Its tail fin billows like an elegant ballroom dress, giving it the nickname of the Water Queen.',
    'seaking': 'In the autumn spawning season, they can be seen swimming powerfully up rivers and creeks.',
    'staryu': 'An enigmatic Pokémon that can effortlessly regenerate any appendage it loses in battle.',
    'starmie': 'Its central core glows with the seven colors of the rainbow. Some people value the core as a gem.',
    'mr-mime': 'If interrupted while it is miming, it will slap around the offender with its broad hands.',
    'scyther': 'With ninja-like agility and speed, it can create the illusion that there is more than one.',
    'jynx': 'It seductively wiggles its hips as it walks. It can cause people to dance in unison with it.',
    'electabuzz': 'Normally found near power plants, they can wander away and cause major blackouts in cities.',
    'magmar': 'Its body always burns with an orange glow that enables it to hide perfectly among flames.',
    'pinsir': 'If it fails to crush the victim in its pincers, it will swing it around and toss it hard.',
    'tauros': 'When it targets an enemy, it charges furiously while whipping its body with its long tails.',
    'magikarp': 'In the distant past, it was somewhat stronger than the horribly weak descendants that exist today.',
    'gyarados': 'Rarely seen in the wild. Huge and vicious, it is capable of destroying entire cities in a rage.',
    'lapras': 'A Pokémon that has been overhunted almost to extinction. It can ferry people across the water.',
    'ditto': 'Capable of copying an enemy\'s genetic code to instantly transform itself into a duplicate of the enemy.',
    'vaporeon': 'Lives close to water. Its long tail is ridged with a fin which is often mistaken for a mermaid\'s.',
    'jolteon': 'It accumulates negative ions in the atmosphere to blast out 10000-volt lightning bolts.',
    'flareon': 'When storing thermal energy in its body, its temperature could soar to over 1600 degrees.',
    'omanyte': 'Although long extinct, in rare cases, it can be genetically resurrected from fossils.',
    'omastar': 'A prehistoric Pokémon that died out when its heavy shell made it impossible to catch prey.',
    'kabuto': 'A Pokémon that was resurrected from a fossil found in what was once the ocean floor eons ago.',
    'kabutops': 'In the water, it tucks in its limbs and becomes more compact, then it wiggles its shell to swim fast.',
    'aerodactyl': 'A ferocious, prehistoric Pokémon that goes for the enemy\'s throat with its serrated saw-like fangs.',
    'snorlax': 'Very lazy. Just eats and sleeps. As its rotund bulk builds, it becomes steadily more slothful.',
    'articuno': 'A legendary bird Pokémon that is said to appear to doomed people who are lost in icy mountains.',
    'zapdos': 'A legendary bird Pokémon that is said to appear from clouds while dropping enormous lightning bolts.',
    'moltres': 'Known as the legendary bird of fire. Every flap of its wings creates a dazzling flash of flames.',
    'dratini': 'Long considered a mythical Pokémon until recently when a small colony was found living underwater.',
    'dragonair': 'A mystical Pokémon that exudes a gentle aura. Has the ability to change climate conditions.',
    'dragonite': 'An extremely rarely seen marine Pokémon. Its intelligence is said to match that of humans.',
    'mewtwo': 'It was created by a scientist after years of horrific gene splicing and DNA engineering experiments.',
    'mew': 'So rare that it is still said to be a mirage by many experts. Only a few people have seen it worldwide.'
  };

  const pokemonName = pokemon.name.toLowerCase();
  return descriptions[pokemonName] || `A ${pokemon.types?.map((t: { type: { name: string } }) => formatPokemonName(t.type.name)).join('/')} type Pokémon with unique abilities.`;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Pokemon species name to ID mapping (for battle context)
const POKEMON_SPECIES_TO_ID: Record<string, number> = {
  'bulbasaur': 1, 'ivysaur': 2, 'venusaur': 3,
  'charmander': 4, 'charmeleon': 5, 'charizard': 6,
  'squirtle': 7, 'wartortle': 8, 'blastoise': 9,
  'caterpie': 10, 'metapod': 11, 'butterfree': 12,
  'weedle': 13, 'kakuna': 14, 'beedrill': 15,
  'pidgey': 16, 'pidgeotto': 17, 'pidgeot': 18,
  'rattata': 19, 'raticate': 20, 'spearow': 21,
  'fearow': 22, 'ekans': 23, 'arbok': 24,
  'pikachu': 25, 'raichu': 26, 'sandshrew': 27,
  'sandslash': 28, 'nidoran-f': 29, 'nidorina': 30,
  'nidoqueen': 31, 'nidoran-m': 32, 'nidorino': 33,
  'nidoking': 34, 'cleffa': 173, 'clefairy': 35,
  'clefable': 36, 'vulpix': 37, 'ninetales': 38,
  'jigglypuff': 39, 'wigglytuff': 40, 'zubat': 41,
  'golbat': 42, 'oddish': 43, 'gloom': 44,
  'vileplume': 45, 'paras': 46, 'parasect': 47,
  'venonat': 48, 'venomoth': 49, 'diglett': 50,
  'dugtrio': 51, 'meowth': 52, 'persian': 53,
  'psyduck': 54, 'golduck': 55, 'mankey': 56,
  'primeape': 57, 'growlithe': 58, 'arcanine': 59,
  'poliwag': 60, 'poliwhirl': 61, 'poliwrath': 62,
  'abra': 63, 'kadabra': 64, 'alakazam': 65,
  'machop': 66, 'machoke': 67, 'machamp': 68,
  'bellsprout': 69, 'weepinbell': 70, 'victreebel': 71,
  'tentacool': 72, 'tentacruel': 73, 'geodude': 74,
  'graveler': 75, 'golem': 76, 'ponyta': 77,
  'rapidash': 78, 'slowpoke': 79, 'slowbro': 80,
  'magnemite': 81, 'magneton': 82, 'farfetchd': 83,
  'doduo': 84, 'dodrio': 85, 'seel': 86,
  'dewgong': 87, 'grimer': 88, 'muk': 89,
  'shellder': 90, 'cloyster': 91, 'gastly': 92,
  'haunter': 93, 'gengar': 94, 'onix': 95,
  'drowzee': 96, 'hypno': 97, 'krabby': 98,
  'kingler': 99, 'voltorb': 100, 'electrode': 101,
  'exeggcute': 102, 'exeggutor': 103, 'cubone': 104,
  'marowak': 105, 'hitmonlee': 106, 'hitmonchan': 107,
  'lickitung': 108, 'koffing': 109, 'weezing': 110,
  'rhyhorn': 111, 'rhydon': 112, 'chansey': 113,
  'tangela': 114, 'kangaskhan': 115, 'horsea': 116,
  'seadra': 117, 'goldeen': 118, 'seaking': 119,
  'staryu': 120, 'starmie': 121, 'mr-mime': 122,
  'scyther': 123, 'jynx': 124, 'electabuzz': 125,
  'magmar': 126, 'pinsir': 127, 'tauros': 128,
  'magikarp': 129, 'gyarados': 130, 'lapras': 131,
  'ditto': 132, 'eevee': 133, 'vaporeon': 134,
  'jolteon': 135, 'flareon': 136, 'porygon': 137,
  'omanyte': 138, 'omastar': 139, 'kabuto': 140,
  'kabutops': 141, 'aerodactyl': 142, 'snorlax': 143,
  'articuno': 144, 'zapdos': 145, 'moltres': 146,
  'dratini': 147, 'dragonair': 148, 'dragonite': 149,
  'mewtwo': 150, 'mew': 151
};

// Convert Pokemon species name to ID
export function getPokemonIdFromSpecies(species: string): number | null {
  const normalizedSpecies = species.toLowerCase().replace(/\s+/g, '-');
  
  // First check our hardcoded mapping for Gen 1
  if (POKEMON_SPECIES_TO_ID[normalizedSpecies]) {
    return POKEMON_SPECIES_TO_ID[normalizedSpecies];
  }
  
  // For Pokemon not in our mapping, try to extract ID from the species name
  // This is a fallback for Pokemon from later generations
  // We'll use a simple approach: if it's not in our mapping, return null
  // and let the image loading system handle it with fallbacks
  return null;
}

// Pokemon image utilities for battle context
export function getPokemonBattleImageUrl(pokemonId: number | null, variant: 'front' | 'back' = 'front', shiny: boolean = false): string {
  if (!pokemonId) {
    // Return a placeholder if no pokemonId
    return '/placeholder-pokemon.png';
  }
  
  // PokeAPI PNG battle sprites for reliable fallback
  const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  const shinyPrefix = shiny ? 'shiny/' : '';
  const direction = variant === 'back' ? 'back' : '';
  const parts = [baseUrl, shinyPrefix, direction].filter(Boolean);
  return `${parts.join('/')}/${pokemonId}.png`;
}

export function getPokemonBattleSpriteUrl(pokemonId: number | null, variant: 'front' | 'back' = 'front', shiny: boolean = false): string {
  // For battle view, use the regular sprites which are smaller and more appropriate
  return getPokemonBattleImageUrl(pokemonId, variant, shiny);
}

// Get Pokemon image with fallback for battle context
export function getPokemonBattleImageWithFallback(pokemonId: number | null, variant: 'front' | 'back' = 'front', shiny: boolean = false): {
  primary: string;
  fallback: string;
} {
  return {
    primary: getPokemonBattleSpriteUrl(pokemonId, variant, shiny),
    fallback: getPokemonBattleSpriteUrl(pokemonId, variant, false) // Always fallback to non-shiny
  };
}

// Get Pokemon image with comprehensive fallback chain
export function getPokemonImageWithFallbacks(pokemonId: number | null, species: string, variant: 'front' | 'back' = 'front', shiny: boolean = false): {
  primary: string;
  fallbacks: string[];
} {
  // Try animated sprite first
  const animatedUrl = getShowdownAnimatedSprite(species, variant, shiny);
  
  // Build fallback chain based on whether we have a pokemonId
  const fallbacks: string[] = [];
  
  if (pokemonId) {
    // If we have a pokemonId, use the full fallback chain
    fallbacks.push(
      getPokemonBattleSpriteUrl(pokemonId, variant, shiny), // Static battle sprite
      getPokemonBattleSpriteUrl(pokemonId, variant, false), // Non-shiny static battle sprite
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`, // Official artwork
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png` // Basic sprite
    );
  } else {
    // If no pokemonId, try to use species name for Showdown sprites and generic fallbacks
    const normalizedSpecies = species.toLowerCase().replace(/\s+/g, '-');
    fallbacks.push(
      // Try different Showdown sprite variations
      `https://play.pokemonshowdown.com/sprites/${variant === 'back' ? 'ani-back' : 'ani'}/${normalizedSpecies}.gif`,
      `https://play.pokemonshowdown.com/sprites/${variant === 'back' ? 'ani-back' : 'ani'}/${normalizedSpecies.replace(/-/g, '')}.gif`,
      // Generic placeholder as last resort
      '/placeholder-pokemon.png'
    );
  }
  
  return {
    primary: animatedUrl,
    fallbacks
  };
}

// Pokemon Showdown animated sprites by species name
export function getShowdownAnimatedSprite(species: string, variant: 'front' | 'back' = 'front', shiny: boolean = false): string {
  // Normalize species name to Showdown sprite filename with special-case fixes
  const base = species.toLowerCase().trim();
  const exceptions: Record<string, string> = {
    // Showdown uses a dot for Mr. Mime
    'mr-mime': 'mr.mime',
    // Mime Jr. drops hyphen and dot
    'mime-jr': 'mimejr',
    // Mr. Rime (Galar) uses a dot
    'mr-rime': 'mr.rime',
    // Ho-Oh uses "hooh" in Showdown
    'ho-oh': 'hooh',
    // Type: Null variations
    'type-null': 'typenull',
    // Jangmo-o family
    'jangmo-o': 'jangmoo',
    'hakamo-o': 'hakamo-o',
    'kommo-o': 'kommoo',
    // Porygon-Z
    'porygon-z': 'porygonz',
    // Nidoran variations
    'nidoran-f': 'nidoranf',
    'nidoran-m': 'nidoranm'
  };
  const hyphenated = base.replace(/\s+/g, '-');
  const mapped = exceptions[hyphenated] || hyphenated;
  const folder = variant === 'back' ? 'ani-back' : 'ani';
  const shinySegment = shiny ? 'shiny' : '';
  // Showdown uses separate folders for shiny: ani-shiny and ani-back-shiny
  const folderWithShiny = shiny ? `${folder}-shiny` : folder;
  return `https://play.pokemonshowdown.com/sprites/${folderWithShiny}/${mapped}.gif`;
}

// Local storage utilities
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export const storage = {
  get: (key: string): JsonValue | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as JsonValue) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: JsonValue): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore errors
    }
  },
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};
