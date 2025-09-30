// data/contests/funFacts.ts

export type ContestFact = {
  id: string;
  text: string;
  tags: (
    | "general"
    | "gen3"
    | "gen4"
    | "bdsp"
    | "combo"
    | "ribbon"
    | "tip"
    | "ui"
    | "strategy"
    | "manga"
    | "anime"
    | "oras"
    | "go"
    | "kalos"
  )[];
};

// New, richer type (info-first rendering can use this)
export type ContestFactRich = {
  id: string;
  fact: string;
  context: string;
  example: string;
  tags: ContestFact["tags"];
};

// --- Rich dataset (fact + context + example) ---
export const contestFunFactsRich: ContestFactRich[] = [
  {
    id: "gen3-pokeblocks-1",
    fact: "In Gen III, Pokéblocks were the primary way to raise contest stats (Cool, Beauty, Cute, Smart, Tough).",
    context:
      "Pokéblocks are blended from berries using the Pokéblock Case and Blender. Berry flavors map to contest stats: Spicy→Cool, Dry→Beauty, Sweet→Cute, Bitter→Smart, Sour→Tough.",
    example:
      "Feed Dry Pokéblocks (e.g., Chesto + Oran) to boost Beauty so Milotic excels in Beauty contests.",
    tags: ["gen3", "general"],
  },
  {
    id: "gen3-scarves-1",
    fact: "Matching-color Scarves in Gen III boost the related contest stat when worn in that category.",
    context:
      "Red/Blue/Pink/Green/Yellow Scarves are obtained from the Slateport Fan Club and add a flat bonus to the Introduction (condition) check.",
    example:
      "A Feebas with a Blue Scarf and high-Beauty Pokéblocks hits max Beauty for Master Rank showings.",
    tags: ["gen3", "tip"],
  },
  {
    id: "gen4-poffin-1",
    fact: "Gen IV replaced Pokéblocks with Poffins—same goal, different baking mini-game.",
    context:
      "Cook Poffins in Hearthome City. Stirring speed/consistency controls quality; burning lowers smoothness and stat gains.",
    example:
      "Perfect Dry Poffins made with Pamtre berries quickly cap Beauty for Roserade.",
    tags: ["gen4", "general"],
  },
  {
    id: "bdsp-visual-dance-1",
    fact: "BDSP contests are split into Visual, Dance, and Move shows with stickers and rhythm elements.",
    context:
      "Visual judges ball capsule effects + condition, Dance is a rhythm mini-game, Move is a single appeal where matching type and stickers boost hearts.",
    example:
      "A Lopunny with heart stickers, good rhythm, and a Cute-tagged appeal racks up Cute contest scores.",
    tags: ["bdsp", "general"],
  },
  {
    id: "intro-talent-structure",
    fact: "Classic contests have two phases: Introduction (condition check) and Talent/Appeal (move scoring).",
    context:
      "Introduction totals condition from Pokéblocks/Poffins and items; Talent gives five turns of appeals with audience excitement and judge reactions.",
    example:
      "A Cool Ninetales scores high in Introduction, then strings Ember → Fire Spin for combo appeal.",
    tags: ["general"],
  },
  {
    id: "audience-boredom-1",
    fact: "Repeating the same appeal move bores the audience—fewer hearts next time.",
    context:
      "Variety matters. Using identical moves consecutively lowers excitement and reduces appeal values.",
    example:
      "Thunderbolt twice in a row gives Pikachu fewer hearts on the second attempt.",
    tags: ["tip", "general"],
  },
  {
    id: "match-bonus-1",
    fact: "Using a move that matches the contest category excites the crowd for bonus hearts.",
    context:
      "Moves carry contest tags (Cool/Beauty/Cute/Smart/Clever/Tough). Matching the active category boosts appeal and often the meter.",
    example: "Charm in a Cute contest gives Sylveon extra hearts and cheers.",
    tags: ["tip", "general"],
  },
  {
    id: "combo-example-1",
    fact: "Some moves form combos when used in sequence for extra appeal.",
    context:
      "Certain pairs are coded (setup → finisher). Executing them on consecutive turns grants bonus hearts.",
    example:
      "Sunny Day → SolarBeam or Rain Dance → Thunder yields heightened appeal.",
    tags: ["combo", "tip"],
  },
  {
    id: "ribbons-carryover-1",
    fact: "Contest Ribbons stick with your Pokémon across games—badges of honor for Coordinators.",
    context:
      "Ribbons are permanent in the Pokémon’s summary and migrate forward with transfers, preserving contest history.",
    example:
      "A Beautifly’s Master Rank Beauty Ribbon from Emerald still shows in later generations.",
    tags: ["ribbon", "general"],
  },
  {
    id: "visual-flair-1",
    fact: "Ball Capsule stickers (FOG, HEART, STAR) add flair in BDSP’s Visual Show and can affect scoring.",
    context:
      "Sticker placement changes entrance effects; thematic alignment with contest type boosts Visual phase results.",
    example:
      "STAR and HEART stickers elevate Cute/Beauty visuals for an immediate lead.",
    tags: ["bdsp", "ui"],
  },
  {
    id: "crowd-meter-1",
    fact: "Fill the Excite/Crowd meter to trigger a flashy Spectacular finish.",
    context:
      "Consistent category-matching appeals grow the meter; a full meter enables a high-impact finale.",
    example:
      "Timing your strongest Beauty appeal when the meter is full maximizes hearts.",
    tags: ["tip", "ui"],
  },
  {
    id: "flavor-mapping-1",
    fact: "Berry flavors map to contest stats: Spicy→Cool, Dry→Beauty, Sweet→Cute, Bitter→Smart/Clever, Sour→Tough.",
    context:
      "Use matching flavors when blending (Gen III) or cooking (Gen IV) to raise the precise stat efficiently.",
    example:
      "Sweet-heavy blends power up Cuteness for Pokémon like Togekiss or Lopunny.",
    tags: ["gen3", "gen4", "tip"],
  },
  {
    id: "cute-audience-1",
    fact: "Cute contests favor playful, adorable moves—timing and charm matter.",
    context:
      "The audience rewards ‘aww’ moments and lighthearted flair; avoid harsh or repetitive actions.",
    example:
      "Encore into a Cute-tagged finisher keeps momentum and smiles high.",
    tags: ["general", "ui"],
  },
  {
    id: "beauty-stage-1",
    fact: "Beauty contests love grace and shine—sparkles, light beams, and flowing animations win hearts.",
    context:
      "Elegant, polished sequences test presentation quality in both Visual and Appeal phases.",
    example:
      "A Milotic’s Aqua Ring into Surf combo reads as graceful and scores strongly.",
    tags: ["general", "ui"],
  },
  {
    id: "tough-momentum-1",
    fact: "Tough contests reward bold presence—steady execution maintains hype.",
    context:
      "Powerful but controlled sequences perform best; mistakes deflate the crowd quickly.",
    example:
      "Rock Polish into Stone Edge showcases strength with poise for sustained hearts.",
    tags: ["general", "tip"],
  },
  {
    id: "clever-chain-1",
    fact: "Clever contests favor smart sequencing; plan combos over multiple turns.",
    context:
      "Think ahead: set up turns that enable bigger payoffs while avoiding repeats.",
    example:
      "Calm Mind → Psychic demonstrates forethought and nets combo appeal.",
    tags: ["combo", "tip"],
  },
  {
    id: "cool-spotlight-1",
    fact: "Cool contests thrive on showmanship—save your finisher for a near-full meter.",
    context:
      "Pacing is key: build hype with stylish setups, then cash out when the crowd is primed.",
    example:
      "Agility into a crisp Aerial Ace caps the sequence for a Cool surge.",
    tags: ["general", "tip"],
  },
  {
    id: "judge-reaction-1",
    fact: "Judges and audience react to variety; mixing move types avoids penalties.",
    context:
      "Alternating compatible tags/combos keeps excitement climbing and prevents boredom debuffs.",
    example:
      "Alternate Cute and Clever appeals that still fit your plan to keep judges engaged.",
    tags: ["general", "tip"],
  },
  {
    id: "poffin-burn-1",
    fact: "Overcooking Poffins lowers quality—aim for smooth stirring to raise stats efficiently.",
    context:
      "Burnt or sloppy Poffins have poor smoothness and weaker stat gains; coordinate stirring direction and speed.",
    example:
      "Two players stirring smoothly produce high-grade Poffins for quick stat caps.",
    tags: ["gen4", "tip"],
  },
  {
    id: "practice-mode-1",
    fact: "Practice runs teach audience rhythms—use them to time combos.",
    context:
      "Dry-run the Dance/Appeal phases to map beat timing and combo windows without risking rank.",
    example:
      "Rehearse the Dance in BDSP before entering Hyper Rank to perfect inputs.",
    tags: ["tip", "general"],
  },
  {
    id: "anime-popularity-1",
    fact: "In the anime, May and Dawn popularized Contests with creative appeals.",
    context:
      "Anime showcases dramatic combinations and aesthetics that inspired in-game strategies.",
    example:
      "Think ‘Ice Aqua Jet’-style flair: stack effects for visual punch in Visual/Move shows.",
    tags: ["general"],
  },
  {
    id: "ribbon-transfer-1",
    fact: "Ribbons won in contests carry over when you transfer your Pokémon to later games.",
    context:
      "They’re permanent metadata—great for lifetime achievement tracking.",
    example:
      "A Master Rank Ribbon from Emerald still displays when that Pokémon reaches BDSP.",
    tags: ["ribbon", "general"],
  },
  {
    id: "move-combo-rain-thunder",
    fact: "Weather and field combos (e.g., Rain Dance → Thunder) yield extra appeal when sequenced correctly.",
    context:
      "Setup moves prime the audience; finishers cash in with amplified hearts.",
    example: "Rain Dance one turn, Thunder the next for a big combo payoff.",
    tags: ["combo", "tip"],
  },
  {
    id: "spectacular-timing-1",
    fact: "Timing is everything—use your strongest move when the Excite Meter is nearly full.",
    context:
      "You maximize conversion by syncing peak excitement with your finisher.",
    example:
      "Hold Moonblast until the meter tips to full for a Spectacular Talent burst.",
    tags: ["tip", "ui"],
  },
  {
    id: "contest-history-1",
    fact: "Pokémon Contests began in Gen III and evolved each generation.",
    context:
      "Gen III (Pokéblocks), Gen IV (Poffins), BDSP (Visual/Dance/Move). Mechanics shifted but core showmanship remained.",
    example:
      "Use the compare table in your Info page to pick generation-specific prep and tactics.",
    tags: ["general"],
  },
  {
    id: "contest_combo_toxic_hex",
    fact: "**Toxic followed by Hex doubles appeal points.**",
    context:
      "Some move combinations in contests double the appeal of the second move. For example, Toxic followed by Hex is a contest combination that awards double appeal to Hex, since Hex deals extra to poisoned targets:contentReference[oaicite:0]{index=0}.",
    example:
      "Using Toxic on the first turn then Hex on the next in a Smarts contest yields extra hearts for Hex.",
    tags: ["combo", "strategy", "general"],
  },
  {
    id: "contest_repeat_penalty",
    fact: "**Repeating the same move costs hearts.**",
    context:
      "In Generation III contests, using the same move in consecutive appeals incurs penalties. The first repeat costs 2 hearts, the second repeat costs 3 hearts, and so on, as indicated by the judge:contentReference[oaicite:1]{index=1}.",
    example:
      "For instance, using Tail Whip twice in a row would incur a 2-heart penalty the first repeat and a 3-heart penalty the second:contentReference[oaicite:2]{index=2}.",
    tags: ["strategy", "gen3"],
  },
  {
    id: "contest_order_indicators",
    fact: "**Judge signals next-turn order.**",
    context:
      'If a Pokémon uses a move that makes it act first or last in the next turn (such as Quick Attack or Agility), the judge displays "NEXT TURN: 1" or "4" over its head, indicating that new order:contentReference[oaicite:3]{index=3}.',
    example:
      'If a Pokémon appeals with Quick Attack, the judge will mark it "NEXT TURN: 1", meaning it will go first in the next round:contentReference[oaicite:4]{index=4}.',
    tags: ["strategy", "general"],
  },
  {
    id: "contest_scarves",
    fact: "**Contest Scarves boost conditions by +20.**",
    context:
      "In Hoenn contests (and ORAS Spectaculars), holding the matching Scarf for a contest category grants a flat +20 boost to that condition. For example, a Red Scarf adds +20 Coolness during a Coolness contest:contentReference[oaicite:5]{index=5}.",
    example:
      "A Pokémon holding a Green Scarf in a Cleverness contest gets +20 Cleverness for scoring:contentReference[oaicite:6]{index=6}.",
    tags: ["strategy", "general"],
  },
  {
    id: "ruby_scarves_manga",
    fact: "**Ruby used one of each Scarf in manga contests.**",
    context:
      "In the Ruby & Sapphire arc of Pokémon Adventures, Ruby distributes five different Scarves (one per condition) to boost his Pokémon’s stats. This strategy helps all five of his Pokémon win the Master Rank contests:contentReference[oaicite:7]{index=7}.",
    example:
      "Ruby gave a Pink Scarf to enhance Cuteness, a Yellow Scarf for Toughness, etc., ensuring each stat was high enough for victory:contentReference[oaicite:8]{index=8}.",
    tags: ["manga", "strategy"],
  },
  {
    id: "contest_score_values",
    fact: "**Stars and hearts have fixed point values.**",
    context:
      "In Generation III contests, each star (from the introduction round) is worth 63 points and each heart (from appeals) is worth 80 points. The final score is calculated as stars + 2×(hearts):contentReference[oaicite:9]{index=9}.",
    example:
      "For example, earning 3 stars and 4 hearts yields 3*63 + 2*(4*80) = 189 + 640 = 829 total points:contentReference[oaicite:10]{index=10}.",
    tags: ["gen3", "strategy"],
  },
  {
    id: "oras_photo_mode",
    fact: "**ORAS contests have a photo mode.**",
    context:
      "In Pokémon Omega Ruby and Alpha Sapphire Contest Spectaculars, players can take snapshots at any time during the contest. The 3DS camera can even be used to replace the background with a real-life scene during the talent round:contentReference[oaicite:11]{index=11}.",
    example:
      "A player could snap their Blaziken mid-appeal with a real park background added via the 3DS camera:contentReference[oaicite:12]{index=12}.",
    tags: ["oras", "general"],
  },
  {
    id: "spectacular_talents",
    fact: "**Filling the excitement meter triggers special talents.**",
    context:
      "In ORAS Contest Spectaculars, when a Pokémon’s excitement meter reaches five ovals, it performs a unique 'Spectacular Talent' animation based on its type and contest category. If the Pokémon can Mega Evolve, it will do so and earn 8 hearts instead of 5 for that talent:contentReference[oaicite:13]{index=13}.",
    example:
      "For instance, a Normal-type Pokémon in a Cool contest may do 'Incredible Shining Road', and if it Mega Evolves (e.g. Mega Gardevoir), it gains +8 hearts:contentReference[oaicite:14]{index=14}.",
    tags: ["oras", "general"],
  },
  {
    id: "go_pokestop_showcase",
    fact: "**PokéStop Showcases are GO contests.**",
    context:
      "Pokémon GO introduced 'PokéStop Showcases' (July 2023), events where Trainers enter featured Pokémon into contests at specific PokéStops. Participants compete for prizes and the top entrant earns a medal:contentReference[oaicite:15]{index=15}.",
    example:
      "During the 7th Anniversary event, Trainers entered Squirtle in Showcases at select PokéStops to see whose was the biggest, with the winner receiving a special medal:contentReference[oaicite:16]{index=16}.",
    tags: ["general"],
  },
  {
    id: "kalos_showcase",
    fact: "**Kalos Showcases are Pokémon contests in the anime.**",
    context:
      "In the XY anime, Pokémon Showcases (TryPokaron) are girls-only contests in Kalos. Performers may use up to six Pokémon and compete in Theme and Freestyle rounds. The Showcase has Rookie and Master classes, with Master Class requiring at least three Princess Keys to enter:contentReference[oaicite:17]{index=17}:contentReference[oaicite:18]{index=18}.",
    example:
      "Serena participated as a Pokémon Performer in these Showcases, performing with multiple Pokémon on stage to earn Princess Keys.",
    tags: ["anime", "general"],
  },
  {
    id: "anime_contest_combo",
    fact: "**Coordinators form combined move appeals in contests.**",
    context:
      "Anime coordinators often choreograph multi-move appeals. For example, May used her Combusken’s Fire Spin and her Squirtle’s Bubble together as a 'Fire and Water Whirlwind' appeal during a Contest Performance:contentReference[oaicite:19]{index=19}.",
    example:
      "In one episode, May’s Combusken used Fire Spin at the same time as Squirtle used Bubble, impressing the judges with the combined 'Fire & Water Whirlwind' move:contentReference[oaicite:20]{index=20}.",
    tags: ["anime", "combo"],
  },
  {
    id: "anime_battle_off",
    fact: "**'Battle Off' ends a Contest Battle when a Pokémon faints.**",
    context:
      "In anime Contest Battles, if a Pokémon is unable to continue (i.e. fainted), the judges call 'Battle Off' to immediately end the round. The coordinator with any remaining Pokémon is declared the winner:contentReference[oaicite:21]{index=21}.",
    example:
      "If one of Dawn’s Pokémon faints during a Contest Double Battle, judges would call 'Battle Off' and Dawn’s opponent (with surviving Pokémon) would win:contentReference[oaicite:22]{index=22}.",
    tags: ["anime", "general"],
  },
  {
    id: "anime_contest_spectacular",
    fact: "**Journeys Contest Spectaculars use audience votes.**",
    context:
      "In Pokémon Journeys, Contest Spectaculars (e.g. Lilycove Spectacular) do not have battles or judges; winners are decided solely by audience applause/votes. Coordinators can rent costumes for their performances, and ties for first place are possible:contentReference[oaicite:23]{index=23}.",
    example:
      "During a Lilycove Contest Spectacular, Chloe’s and Serena’s performances tied in audience score, resulting in a shared victory.",
    tags: ["anime", "general"],
  },
  {
    id: "struggle_contest_stats",
    fact: "**Struggle has default contest stats.**",
    context:
      "The move Struggle (normally only used when a Pokémon has no PP) cannot be used in contests, but it still has contest condition stats defined. This likely exists to prevent crashes if the game is hacked, so Struggle’s contest stats use default values:contentReference[oaicite:24]{index=24}.",
    example:
      "On a hacked game, one might inspect Struggle’s contest stat ratings even though no legal Pokémon can perform Struggle in an actual contest:contentReference[oaicite:25]{index=25}.",
    tags: ["general"],
  },
  {
    id: "contest_combo_indicator",
    fact: "**Judges indicate contest combos with exclamation marks.**",
    context:
      "In Hoenn contests, if a Pokémon’s moves form a known contest combo, the judge signals it. A single exclamation mark means a combo can be set up; a double exclamation appears when the combo is executed, and the second move’s appeal is doubled:contentReference[oaicite:26]{index=26}.",
    example:
      "For example, if a Pokémon uses Defense Curl one turn and then Rollout the next, the judge shows '!!' after Rollout, indicating Rollout’s appeal is doubled:contentReference[oaicite:27]{index=27}.",
    tags: ["strategy", "gen3"],
  },
];

// --- Backward-compatible (short) dataset ---
export const contestFunFacts: ContestFact[] = contestFunFactsRich.map(
  ({ id, fact, tags }) => ({
    id,
    text: fact,
    tags,
  })
);

// Optional: curated groups for category-specific rotations (unchanged)
export const factBuckets = {
  cute: ["cute-audience-1", "match-bonus-1", "audience-boredom-1"],
  beauty: ["beauty-stage-1", "match-bonus-1", "crowd-meter-1"],
  cool: ["cool-spotlight-1", "match-bonus-1", "judge-reaction-1"],
  tough: ["tough-momentum-1", "judge-reaction-1", "intro-talent-structure"],
  clever: ["clever-chain-1", "combo-example-1", "practice-mode-1"],
} as const;
