// Japanese Pokemon names with romaji and meaning
export interface JapaneseNameInfo {
  japanese: string
  romaji: string
  meaning: string
  explanation?: string
}

// Pokemon-specific Japanese names with romaji, meanings, and explanations
const japaneseNames: Record<string, JapaneseNameInfo> = {
  'フシギダネ': {
    japanese: 'フシギダネ',
    romaji: 'Fushigidane',
    meaning: 'Mysterious Seed',
    explanation: '不思議 (fushigi, mysterious/strange) + 種 (tane, seed). Pun on \'fushigi da ne?\' (\'Isn\'t it strange?\').'
  },
  'フシギソウ': {
    japanese: 'フシギソウ',
    romaji: 'Fushigisō',
    meaning: 'Mysterious Grass',
    explanation: '不思議 (fushigi, mysterious/strange) + 草 (sō, grass/plant). Evolves from Bulbasaur, plant motif continues.'
  },
  'フシギバナ': {
    japanese: 'フシギバナ',
    romaji: 'Fushigibana',
    meaning: 'Mysterious Flower',
    explanation: '不思議 (fushigi, mysterious/strange) + 花 (bana, flower). Final form, flower motif.'
  },
  'ヒトカゲ': {
    japanese: 'ヒトカゲ',
    romaji: 'Hitokage',
    meaning: 'Fire Lizard',
    explanation: '火 (hi, fire) + 蜥蜴 (tokage, lizard). Simple, direct description.'
  },
  'リザード': {
    japanese: 'リザード',
    romaji: 'Rizādo',
    meaning: 'Lizard',
    explanation: 'From English \'lizard\' (katakana).'
  },
  'リザードン': {
    japanese: 'リザードン',
    romaji: 'Rizādon',
    meaning: 'Lizard + -don',
    explanation: 'From \'lizard\' + -don (dinosaur/dragon suffix).'
  },
  'ゼニガメ': {
    japanese: 'ゼニガメ',
    romaji: 'Zenigame',
    meaning: 'Coin Turtle',
    explanation: '銭 (zeni, coin) + 亀 (kame, turtle). Refers to pond turtles that resemble coins.'
  },
  'カメール': {
    japanese: 'カメール',
    romaji: 'Kamēru',
    meaning: 'Turtle + -l',
    explanation: 'カメ (kame, turtle) + possible wordplay on \'tail\' or \'mail.\''
  },
  'カメックス': {
    japanese: 'カメックス',
    romaji: 'Kamekkusu',
    meaning: 'Turtle + X',
    explanation: 'カメ (kame, turtle) + 強い (tsuyoi, strong) or \'max\' sound. Suggests maximum power.'
  },
  'キャタピー': {
    japanese: 'キャタピー',
    romaji: 'Kyatapī',
    meaning: 'Caterpillar',
    explanation: 'From \'caterpillar.\''
  },
  'トランセル': {
    japanese: 'トランセル',
    romaji: 'Toranseru',
    meaning: 'Transcell (Chrysalis)',
    explanation: 'From \'trans\' (transform) + \'cell.\' Refers to metamorphosis stage.'
  },
  'バタフリー': {
    japanese: 'バタフリー',
    romaji: 'Batafurī',
    meaning: 'Butterfly Free',
    explanation: 'From \'butterfly\' + \'free.\' Implies freedom after metamorphosis.'
  },
  'ビードル': {
    japanese: 'ビードル',
    romaji: 'Bīdorū',
    meaning: 'Needle Bee',
    explanation: 'From \'needle\' + \'bee.\' Refers to its stinger.'
  },
  'コクーン': {
    japanese: 'コクーン',
    romaji: 'Kokūn',
    meaning: 'Cocoon',
    explanation: 'From English \'cocoon.\' Chrysalis stage.'
  },
  'スピアー': {
    japanese: 'スピアー',
    romaji: 'Supiā',
    meaning: 'Spear',
    explanation: 'Spear (English) + bee motif. Emphasizes stinger.'
  },
  'ポッポ': {
    japanese: 'ポッポ',
    romaji: 'Poppo',
    meaning: 'Pigeon (Onomatopoeia)',
    explanation: 'Onomatopoeia for a bird\'s coo. Common wild bird.'
  },
  'ピジョン': {
    japanese: 'ピジョン',
    romaji: 'Pijon',
    meaning: 'Pigeon',
    explanation: 'From English \'pigeon.\''
  },
  'ピジョット': {
    japanese: 'ピジョット',
    romaji: 'Pijotto',
    meaning: 'Pigeon + Jet',
    explanation: 'From \'pigeon\' + \'jet.\' Implies speed.'
  },
  'コラッタ': {
    japanese: 'コラッタ',
    romaji: 'Koratta',
    meaning: 'Child Rat',
    explanation: '子 (ko, child) + ratta (rat). Small rat Pokémon.'
  },
  'ラッタ': {
    japanese: 'ラッタ',
    romaji: 'Ratta',
    meaning: 'Rat',
    explanation: 'From \'rat.\''
  },
  'オニスズメ': {
    japanese: 'オニスズメ',
    romaji: 'Onisuzume',
    meaning: 'Demon Sparrow',
    explanation: '鬼 (oni, demon) + 雀 (suzume, sparrow). Aggressive sparrow.'
  },
  'オニドリル': {
    japanese: 'オニドリル',
    romaji: 'Onidoriru',
    meaning: 'Demon Drill',
    explanation: '鬼 (oni, demon) + ドリル (doriru, drill). Refers to its long beak.'
  },
  'アーボ': {
    japanese: 'アーボ',
    romaji: 'Ābo',
    meaning: 'Boa (Reverse)',
    explanation: '\'Abo\' is \'boa\' reversed. Snake Pokémon.'
  },
  'アーボック': {
    japanese: 'アーボック',
    romaji: 'Ābokku',
    meaning: 'Cobra (Reverse)',
    explanation: '\'Arbok\' is \'kobra\' (cobra) reversed. Snake motif.'
  },
  'ピカチュウ': {
    japanese: 'ピカチュウ',
    romaji: 'Pikachū',
    meaning: 'Sparkle-Squeak',
    explanation: 'ピカピカ (pika, sparkle/flash) + チュウ (chū, mouse squeak). Iconic electric mouse.'
  },
  'ライチュウ': {
    japanese: 'ライチュウ',
    romaji: 'Raichū',
    meaning: 'Thunder-Squeak',
    explanation: '雷 (rai, thunder) + チュウ (chū, squeak). Pikachu\'s evolved form.'
  },
  'サンド': {
    japanese: 'サンド',
    romaji: 'Sando',
    meaning: 'Sand',
    explanation: 'From English \'sand.\' Desert shrew.'
  },
  'サンドパン': {
    japanese: 'サンドパン',
    romaji: 'Sandopan',
    meaning: 'Sand + Pangolin',
    explanation: 'サンド (sand) + パンゴリン (pangolin). Spiny anteater.'
  },
  'ニドラン♀': {
    japanese: 'ニドラン♀',
    romaji: 'Nidoran♀',
    meaning: 'Needle + Ran',
    explanation: '\'Nido\' from \'needle.\' \'Ran\' is a name suffix. Female form.'
  },
  'ニドリーナ': {
    japanese: 'ニドリーナ',
    romaji: 'Nidorīna',
    meaning: 'Needle + Rina',
    explanation: '\'Nido\' (needle) + \'rina\' (feminine ending).'
  },
  'ニドクイン': {
    japanese: 'ニドクイン',
    romaji: 'Nidokuin',
    meaning: 'Needle + Queen',
    explanation: '\'Nido\' (needle) + \'queen.\' Final female form.'
  },
  'ニドラン♂': {
    japanese: 'ニドラン♂',
    romaji: 'Nidoran♂',
    meaning: 'Needle + Ran',
    explanation: '\'Nido\' from \'needle.\' \'Ran\' is a name suffix. Male form.'
  },
  'ニドリーノ': {
    japanese: 'ニドリーノ',
    romaji: 'Nidorīno',
    meaning: 'Needle + Rino',
    explanation: '\'Nido\' (needle) + \'rino\' (masculine ending).'
  },
  'ニドキング': {
    japanese: 'ニドキング',
    romaji: 'Nidokingu',
    meaning: 'Needle + King',
    explanation: '\'Nido\' (needle) + \'king.\' Final male form.'
  },
  'ピッピ': {
    japanese: 'ピッピ',
    romaji: 'Pippi',
    meaning: 'Pipi (Onomatopoeia)',
    explanation: 'High-pitched cute sound. Fairy motif.'
  },
  'ピクシー': {
    japanese: 'ピクシー',
    romaji: 'Pikushī',
    meaning: 'Pixie',
    explanation: 'From \'pixie.\' Fairy motif.'
  },
  'ロコン': {
    japanese: 'ロコン',
    romaji: 'Rokon',
    meaning: 'Six Tails',
    explanation: '六 (roku, six) + コン (kon, fox yelp). Fox with six tails.'
  },
  'キュウコン': {
    japanese: 'キュウコン',
    romaji: 'Kyūkon',
    meaning: 'Nine Tails',
    explanation: '九 (kyū, nine) + コン (kon, fox yelp). Based on kitsune myth.'
  },
  'プリン': {
    japanese: 'プリン',
    romaji: 'Purin',
    meaning: 'Pudding',
    explanation: 'From \'pudding.\' Soft, round, bouncy.'
  },
  'プクリン': {
    japanese: 'プクリン',
    romaji: 'Pukurin',
    meaning: 'Puff + Pudding',
    explanation: 'ぷくぷく (puku, puffy) + purin (pudding).'
  },
  'ズバット': {
    japanese: 'ズバット',
    romaji: 'Zubatto',
    meaning: 'Bat (Onomatopoeia)',
    explanation: 'ズバッ (zuba, slicing sound) + bat. Swooping bat.'
  },
  'ゴルバット': {
    japanese: 'ゴルバット',
    romaji: 'Gorubatto',
    meaning: 'Gore + Bat',
    explanation: 'From \'gore\' + \'bat.\' Vampire bat motif.'
  },
  'ナゾノクサ': {
    japanese: 'ナゾノクサ',
    romaji: 'Nazonokusa',
    meaning: 'Mystery Weed',
    explanation: '謎 (nazo, mystery) + 草 (kusa, grass/weed).'
  },
  'クサイハナ': {
    japanese: 'クサイハナ',
    romaji: 'Kusaihana',
    meaning: 'Stinky Flower',
    explanation: '臭い (kusai, stinky) + 花 (hana, flower).'
  },
  'ラフレシア': {
    japanese: 'ラフレシア',
    romaji: 'Rafureshia',
    meaning: 'Rafflesia',
    explanation: 'From \'Rafflesia,\' a foul-smelling flower.'
  },
  'パラス': {
    japanese: 'パラス',
    romaji: 'Parasu',
    meaning: 'Parasol/Parasite',
    explanation: 'From \'parasite\' + \'parasol.\' Mushroom crab.'
  },
  'パラセクト': {
    japanese: 'パラセクト',
    romaji: 'Parasekuto',
    meaning: 'Parasitic Insect',
    explanation: 'From \'parasite\' + \'insect.\' Fungal takeover.'
  },
  'コンパン': {
    japanese: 'コンパン',
    romaji: 'Konpan',
    meaning: 'Powder Ball',
    explanation: '粉 (kon, powder) + パン (pan, ball). Fuzzy bug.'
  },
  'モルフォン': {
    japanese: 'モルフォン',
    romaji: 'Morufon',
    meaning: 'Morph + Moth',
    explanation: 'From \'morph\' + \'moth.\''
  },
  'ディグダ': {
    japanese: 'ディグダ',
    romaji: 'Diguda',
    meaning: 'Dig + Da',
    explanation: 'From \'dig.\' Underground mole.'
  },
  'ダグトリオ': {
    japanese: 'ダグトリオ',
    romaji: 'Dagutorio',
    meaning: 'Dug + Trio',
    explanation: 'From \'dug\' + \'trio.\' Three Digletts.'
  },
  'ニャース': {
    japanese: 'ニャース',
    romaji: 'Nyāsu',
    meaning: 'Meowth (Onomatopoeia)',
    explanation: 'ニャー (nya, meow) + \'th.\' Cat Pokémon.'
  },
  'ペルシアン': {
    japanese: 'ペルシアン',
    romaji: 'Perushian',
    meaning: 'Persian',
    explanation: 'From \'Persian\' (cat breed).'
  },
  'コダック': {
    japanese: 'コダック',
    romaji: 'Kodakku',
    meaning: 'Child Duck',
    explanation: '子 (ko, child) + duck. Duckling motif.'
  },
  'ゴルダック': {
    japanese: 'ゴルダック',
    romaji: 'Gorudakku',
    meaning: 'Gold Duck',
    explanation: 'From \'gold\' + \'duck.\''
  },
  'マンキー': {
    japanese: 'マンキー',
    romaji: 'Mankī',
    meaning: 'Monkey',
    explanation: 'From \'monkey.\''
  },
  'オコリザル': {
    japanese: 'オコリザル',
    romaji: 'Okorizaru',
    meaning: 'Angry Monkey',
    explanation: '怒り (okori, anger) + 猿 (zaru, monkey).'
  },
  'ガーディ': {
    japanese: 'ガーディ',
    romaji: 'Gādi',
    meaning: 'Guardian',
    explanation: 'From \'guardian.\' Loyal dog.'
  },
  'ウインディ': {
    japanese: 'ウインディ',
    romaji: 'Uindi',
    meaning: 'Windy',
    explanation: 'From \'windy.\' Legendary dog.'
  },
  'ニョロモ': {
    japanese: 'ニョロモ',
    romaji: 'Nyoromo',
    meaning: 'Wriggle + Child',
    explanation: 'ニョロニョロ (nyoronyoro, wriggle) + モ (mo, child).'
  },
  'ニョロゾ': {
    japanese: 'ニョロゾ',
    romaji: 'Nyorozō',
    meaning: 'Wriggle + Zō',
    explanation: 'ニョロニョロ (nyoro, wriggle) + ゾウ (zō, suffix).'
  },
  'ニョロボン': {
    japanese: 'ニョロボン',
    romaji: 'Nyorobon',
    meaning: 'Wriggle + Bon',
    explanation: 'ニョロニョロ (nyoro, wriggle) + ボン (bon, big).'
  },
  'ケーシィ': {
    japanese: 'ケーシィ',
    romaji: 'Kēshī',
    meaning: 'Casey (ESP pun)',
    explanation: 'From \'casey\' (reference to psychic Edgar Cayce).'
  },
  'ユンゲラー': {
    japanese: 'ユンゲラー',
    romaji: 'Yungerā',
    meaning: 'Uri Geller',
    explanation: 'Reference to psychic Uri Geller.'
  },
  'フーディン': {
    japanese: 'フーディン',
    romaji: 'Fūdin',
    meaning: 'Houdini',
    explanation: 'Reference to magician Harry Houdini.'
  },
  'ワンリキー': {
    japanese: 'ワンリキー',
    romaji: 'Wanrikī',
    meaning: 'One Power',
    explanation: '腕力 (wanryoku, physical strength).'
  },
  'ゴーリキー': {
    japanese: 'ゴーリキー',
    romaji: 'Gōrikī',
    meaning: 'Strong Power',
    explanation: '豪力 (gōriki, great strength).'
  },
  'カイリキー': {
    japanese: 'カイリキー',
    romaji: 'Kairikī',
    meaning: 'Super Power',
    explanation: '怪力 (kairiki, superhuman strength).'
  },
  'マダツボミ': {
    japanese: 'マダツボミ',
    romaji: 'Madatsubomi',
    meaning: 'Yet Bud',
    explanation: 'まだ (mada, not yet) + 蕾 (tsubomi, bud).'
  },
  'ウツドン': {
    japanese: 'ウツドン',
    romaji: 'Utsudon',
    meaning: 'Pitcher + Don',
    explanation: 'ウツボカズラ (utsubokazura, pitcher plant) + -don.'
  },
  'ウツボット': {
    japanese: 'ウツボット',
    romaji: 'Utsubotto',
    meaning: 'Pitcher + Bot',
    explanation: 'ウツボカズラ (utsubokazura, pitcher plant) + \'bot.\''
  },
  'メノクラゲ': {
    japanese: 'メノクラゲ',
    romaji: 'Menokurage',
    meaning: 'Jellyfish with Eyes',
    explanation: '目 (me, eye) + クラゲ (kurage, jellyfish).'
  },
  'ドククラゲ': {
    japanese: 'ドククラゲ',
    romaji: 'Dokukurage',
    meaning: 'Poison Jellyfish',
    explanation: '毒 (doku, poison) + クラゲ (kurage, jellyfish).'
  },
  'イシツブテ': {
    japanese: 'イシツブテ',
    romaji: 'Ishitsubute',
    meaning: 'Stone Throw',
    explanation: '石 (ishi, stone) + つぶて (tsubute, throwing stone).'
  },
  'ゴローン': {
    japanese: 'ゴローン',
    romaji: 'Gorōn',
    meaning: 'Rolling Stone',
    explanation: 'ゴロゴロ (gorogoro, rolling) + stone.'
  },
  'ゴローニャ': {
    japanese: 'ゴローニャ',
    romaji: 'Gorōnya',
    meaning: 'Rolling + Golem',
    explanation: 'ゴロゴロ (rolling) + \'golem.\''
  },
  'ポニータ': {
    japanese: 'ポニータ',
    romaji: 'Ponīta',
    meaning: 'Pony',
    explanation: 'From \'pony.\''
  },
  'ギャロップ': {
    japanese: 'ギャロップ',
    romaji: 'Gyaroppu',
    meaning: 'Gallop',
    explanation: 'From \'gallop.\''
  },
  'ヤドン': {
    japanese: 'ヤドン',
    romaji: 'Yadon',
    meaning: 'Lodger',
    explanation: '宿 (yado, lodging). Slow, lazy Pokémon.'
  },
  'ヤドラン': {
    japanese: 'ヤドラン',
    romaji: 'Yadoran',
    meaning: 'Lodger + Lazy',
    explanation: '宿 (yado, lodging) + ラン (ran, lazy).'
  },
  'コイル': {
    japanese: 'コイル',
    romaji: 'Koiru',
    meaning: 'Coil',
    explanation: 'From \'coil.\''
  },
  'レアコイル': {
    japanese: 'レアコイル',
    romaji: 'Reakoiru',
    meaning: 'Rare Coil',
    explanation: 'レア (rea, rare) + コイル (coil).'
  },
  'カモネギ': {
    japanese: 'カモネギ',
    romaji: 'Kamonegi',
    meaning: 'Duck + Leek',
    explanation: '鴨 (kamo, duck) + 葱 (negi, leek). \'Kamo-negi\' is a proverb about unexpected luck.'
  },
  'ドードー': {
    japanese: 'ドードー',
    romaji: 'Dōdō',
    meaning: 'Dodo',
    explanation: 'From \'dodo.\''
  },
  'ドードリオ': {
    japanese: 'ドードリオ',
    romaji: 'Dōdorio',
    meaning: 'Dodo + Trio',
    explanation: 'From \'dodo\' + \'trio.\''
  },
  'パウワウ': {
    japanese: 'パウワウ',
    romaji: 'Pauwau',
    meaning: 'Paw Wow',
    explanation: 'From \'paw\' + \'wow.\''
  },
  'ジュゴン': {
    japanese: 'ジュゴン',
    romaji: 'Jugon',
    meaning: 'Dugong',
    explanation: 'From \'dugong\' (marine mammal).'
  },
  'ベトベター': {
    japanese: 'ベトベター',
    romaji: 'Betobetā',
    meaning: 'Sticky',
    explanation: 'べとべと (betobeto, sticky/filthy).'
  },
  'ベトベトン': {
    japanese: 'ベトベトン',
    romaji: 'Betobeton',
    meaning: 'Very Sticky',
    explanation: 'べとべと (betobeto, sticky) + on (emphasis).'
  },
  'シェルダー': {
    japanese: 'シェルダー',
    romaji: 'Sherudā',
    meaning: 'Shell + Shelter',
    explanation: 'From \'shell\' + \'shelter.\''
  },
  'パルシェン': {
    japanese: 'パルシェン',
    romaji: 'Parushen',
    meaning: 'Pearl + Shell',
    explanation: 'Pearl + shell. Oyster motif.'
  },
  'ゴース': {
    japanese: 'ゴース',
    romaji: 'Gōsu',
    meaning: 'Ghost',
    explanation: 'From \'ghost.\''
  },
  'ゴースト': {
    japanese: 'ゴースト',
    romaji: 'Gōsuto',
    meaning: 'Ghost',
    explanation: 'From \'ghost.\''
  },
  'ゲンガー': {
    japanese: 'ゲンガー',
    romaji: 'Gengā',
    meaning: 'Doppelgänger',
    explanation: 'From \'doppelgänger.\''
  },
  'イワーク': {
    japanese: 'イワーク',
    romaji: 'Iwāku',
    meaning: 'Rock + Snake',
    explanation: '岩 (iwa, rock) + スネーク (snake).'
  },
  'スリープ': {
    japanese: 'スリープ',
    romaji: 'Surīpu',
    meaning: 'Sleep',
    explanation: 'From \'sleep.\''
  },
  'スリーパー': {
    japanese: 'スリーパー',
    romaji: 'Surīpā',
    meaning: 'Sleeper',
    explanation: 'From \'sleeper.\''
  },
  'クラブ': {
    japanese: 'クラブ',
    romaji: 'Kurabu',
    meaning: 'Crab',
    explanation: 'From \'crab.\''
  },
  'キングラー': {
    japanese: 'キングラー',
    romaji: 'Kingurā',
    meaning: 'King + Crab',
    explanation: 'From \'king\' + \'crab.\''
  },
  'ビリリダマ': {
    japanese: 'ビリリダマ',
    romaji: 'Biriridama',
    meaning: 'Electric Ball',
    explanation: 'ビリビリ (biribiri, electric shock) + 玉 (dama, ball).'
  },
  'マルマイン': {
    japanese: 'マルマイン',
    romaji: 'Marumain',
    meaning: 'Round Mine',
    explanation: '丸 (maru, round) + マイン (mine, as in landmine).'
  },
  'タマタマ': {
    japanese: 'タマタマ',
    romaji: 'Tamatama',
    meaning: 'Egg-Egg',
    explanation: '玉 (tama, egg/ball) doubled. Egg cluster.'
  },
  'ナッシー': {
    japanese: 'ナッシー',
    romaji: 'Nasshī',
    meaning: 'Nutty',
    explanation: 'From \'nut.\' Palm tree motif.'
  },
  'カラカラ': {
    japanese: 'カラカラ',
    romaji: 'Karakara',
    meaning: 'Rattle (Onomatopoeia)',
    explanation: 'からから (karakara, clatter/rattle sound).'
  },
  'ガラガラ': {
    japanese: 'ガラガラ',
    romaji: 'Garagara',
    meaning: 'Clatter (Onomatopoeia)',
    explanation: 'がらがら (garagara, rattling sound).'
  },
  'サワムラー': {
    japanese: 'サワムラー',
    romaji: 'Sawamurā',
    meaning: 'Sawamura (Martial Artist)',
    explanation: 'Named after kickboxer Tadashi Sawamura.'
  },
  'エビワラー': {
    japanese: 'エビワラー',
    romaji: 'Ebiwārā',
    meaning: 'Ebihara (Boxer)',
    explanation: 'Named after boxer Hiroyuki Ebihara.'
  },
  'ベロリンガ': {
    japanese: 'ベロリンガ',
    romaji: 'Beroringa',
    meaning: 'Tongue Linger',
    explanation: 'ベロ (bero, tongue) + リンガ (linga, linger).'
  },
  'ドガース': {
    japanese: 'ドガース',
    romaji: 'Dogāsu',
    meaning: 'Gas',
    explanation: 'From \'gas.\''
  },
  'マタドガス': {
    japanese: 'マタドガス',
    romaji: 'Matadogasu',
    meaning: 'Again Gas',
    explanation: 'また (mata, again) + ドガス (gas).'
  },
  'サイホーン': {
    japanese: 'サイホーン',
    romaji: 'Saihōn',
    meaning: 'Rhinoceros + Horn',
    explanation: 'From \'sai\' (rhinoceros) + \'horn.\''
  },
  'サイドン': {
    japanese: 'サイドン',
    romaji: 'Saidon',
    meaning: 'Rhinoceros + Don',
    explanation: 'From \'sai\' (rhinoceros) + \'don\' (dinosaur/large).'
  },
  'ラッキー': {
    japanese: 'ラッキー',
    romaji: 'Rakkī',
    meaning: 'Lucky',
    explanation: 'From \'lucky.\' Brings good fortune.'
  },
  'モンジャラ': {
    japanese: 'モンジャラ',
    romaji: 'Monjara',
    meaning: 'Tangle',
    explanation: 'もじゃもじゃ (mojamoja, tangled).'
  },
  'ガルーラ': {
    japanese: 'ガルーラ',
    romaji: 'Garūra',
    meaning: 'Kangaroo',
    explanation: 'From \'kangaroo.\' Maternal motif.'
  },
  'タッツー': {
    japanese: 'タッツー',
    romaji: 'Tattsū',
    meaning: 'Tatsu (Seahorse)',
    explanation: '竜 (tatsu, dragon) + sū (diminutive).'
  },
  'シードラ': {
    japanese: 'シードラ',
    romaji: 'Shīdora',
    meaning: 'Sea Dragon',
    explanation: 'From \'sea\' + \'dragon.\''
  },
  'トサキント': {
    japanese: 'トサキント',
    romaji: 'Tosakinto',
    meaning: 'Crown + Goldfish',
    explanation: 'トサカ (tosaka, crest) + 金魚 (kingyo, goldfish).'
  },
  'アズマオウ': {
    japanese: 'アズマオウ',
    romaji: 'Azumaō',
    meaning: 'Eastern King',
    explanation: '東 (azuma, east) + 王 (ō, king).'
  },
  'ヒトデマン': {
    japanese: 'ヒトデマン',
    romaji: 'Hitodeman',
    meaning: 'Starfish Man',
    explanation: 'ヒトデ (hitode, starfish) + man.'
  },
  'スターミー': {
    japanese: 'スターミー',
    romaji: 'Sutāmī',
    meaning: 'Star + Me',
    explanation: 'From \'star\' + \'me.\''
  },
  'バリヤード': {
    japanese: 'バリヤード',
    romaji: 'Bariyādo',
    meaning: 'Barrier + -d',
    explanation: 'バリア (baria, barrier) + -do (suffix).'
  },
  'ストライク': {
    japanese: 'ストライク',
    romaji: 'Sutoraiku',
    meaning: 'Strike',
    explanation: 'From \'strike.\' Mantis motif.'
  },
  'ルージュラ': {
    japanese: 'ルージュラ',
    romaji: 'Rūjura',
    meaning: 'Rouge',
    explanation: 'From \'rouge\' (makeup).'
  },
  'エレブー': {
    japanese: 'エレブー',
    romaji: 'Erebū',
    meaning: 'Electric + Boo',
    explanation: 'エレキ (ereki, electric) + ブー (boo, sound).'
  },
  'ブーバー': {
    japanese: 'ブーバー',
    romaji: 'Būbā',
    meaning: 'Boober',
    explanation: 'From \'booby\' (bird) or \'boil.\''
  },
  'カイロス': {
    japanese: 'カイロス',
    romaji: 'Kairosu',
    meaning: 'Kailos (Stag Beetle)',
    explanation: 'From \'kai\' (shell) + \'ros\' (from Greek for horn).'
  },
  'ケンタロス': {
    japanese: 'ケンタロス',
    romaji: 'Kentaurosu',
    meaning: 'Kentaros',
    explanation: 'From \'kentauros\' (centaur, bull motif).'
  },
  'コイキング': {
    japanese: 'コイキング',
    romaji: 'Koiking',
    meaning: 'Carp King',
    explanation: '鯉 (koi, carp) + king.'
  },
  'ギャラドス': {
    japanese: 'ギャラドス',
    romaji: 'Gyaradosu',
    meaning: 'Gyarados',
    explanation: 'Invented name, possibly from \'gyaku\' (reverse) + \'dosu\' (to give).'
  },
  'ラプラス': {
    japanese: 'ラプラス',
    romaji: 'Rapurasu',
    meaning: 'Laplace',
    explanation: 'From mathematician Pierre-Simon Laplace. Sea transport motif.'
  },
  'メタモン': {
    japanese: 'メタモン',
    romaji: 'Metamon',
    meaning: 'Metamorph',
    explanation: 'From \'metamorph.\''
  },
  'イーブイ': {
    japanese: 'イーブイ',
    romaji: 'Ībui',
    meaning: 'E-V',
    explanation: 'From \'evolution\' or \'E-V.\''
  },
  'シャワーズ': {
    japanese: 'シャワーズ',
    romaji: 'Shawāzu',
    meaning: 'Showers',
    explanation: 'From \'shower.\' Water Eeveelution.'
  },
  'サンダース': {
    japanese: 'サンダース',
    romaji: 'Sandāsu',
    meaning: 'Thunder',
    explanation: 'From \'thunder.\' Electric Eeveelution.'
  },
  'ブースター': {
    japanese: 'ブースター',
    romaji: 'Būsutā',
    meaning: 'Booster',
    explanation: 'From \'booster.\' Fire Eeveelution.'
  },
  'ポリゴン': {
    japanese: 'ポリゴン',
    romaji: 'Porigon',
    meaning: 'Polygon',
    explanation: 'From \'polygon.\' Digital motif.'
  },
  'オムナイト': {
    japanese: 'オムナイト',
    romaji: 'Omunaito',
    meaning: 'Omma + Knight',
    explanation: 'From \'omma\' (ancient shell) + \'knight.\''
  },
  'オムスター': {
    japanese: 'オムスター',
    romaji: 'Omusutā',
    meaning: 'Omma + Star',
    explanation: 'From \'omma\' (ancient shell) + \'star.\''
  },
  'カブト': {
    japanese: 'カブト',
    romaji: 'Kabuto',
    meaning: 'Helmet',
    explanation: '兜 (kabuto, helmet). Horseshoe crab.'
  },
  'カブトプス': {
    japanese: 'カブトプス',
    romaji: 'Kabutopusu',
    meaning: 'Helmet + Tops',
    explanation: '兜 (kabuto, helmet) + \'tops.\''
  },
  'プテラ': {
    japanese: 'プテラ',
    romaji: 'Putera',
    meaning: 'Ptera',
    explanation: 'From \'pteranodon\' (flying dinosaur).'
  },
  'カビゴン': {
    japanese: 'カビゴン',
    romaji: 'Kabigon',
    meaning: 'Gorging + Gon',
    explanation: 'カビ (kabi, mold) + ゴン (gon, big). Sleepy, large Pokémon.'
  },
  'フリーザー': {
    japanese: 'フリーザー',
    romaji: 'Furīzā',
    meaning: 'Freezer',
    explanation: 'From \'freeze.\' Legendary bird.'
  },
  'サンダー': {
    japanese: 'サンダー',
    romaji: 'Sandā',
    meaning: 'Thunder',
    explanation: 'From \'thunder.\' Legendary bird.'
  },
  'ファイヤー': {
    japanese: 'ファイヤー',
    romaji: 'Faiyā',
    meaning: 'Fire',
    explanation: 'From \'fire.\' Legendary bird.'
  },
  'ミニリュウ': {
    japanese: 'ミニリュウ',
    romaji: 'Miniryū',
    meaning: 'Mini Dragon',
    explanation: 'ミニ (mini) + 竜 (ryū, dragon).'
  },
  'ハクリュー': {
    japanese: 'ハクリュー',
    romaji: 'Hakuryū',
    meaning: 'White Dragon',
    explanation: '白 (haku, white) + 竜 (ryū, dragon).'
  },
  'カイリュー': {
    japanese: 'カイリュー',
    romaji: 'Kairyū',
    meaning: 'Sea Dragon',
    explanation: '海 (kai, sea) + 竜 (ryū, dragon).'
  },
  'ミュウツー': {
    japanese: 'ミュウツー',
    romaji: 'Myūtsū',
    meaning: 'Mew + Two',
    explanation: 'From \'Mew\' + \'two.\' Clone of Mew.'
  },
  'ミュウ': {
    japanese: 'ミュウ',
    romaji: 'Myū',
    meaning: 'Mew (Onomatopoeia)',
    explanation: 'From \'mythical\' + \'mew\' (cat cry).'
  },
  'チコリータ': {
    japanese: 'チコリータ',
    romaji: '*Chikorīta*',
    meaning: 'Little Chicory',
    explanation: 'From the herb chicory (チコリー *chikorī*) + Spanish diminutive “-ita,” meaning “little.”'
  },
  'ベイリーフ': {
    japanese: 'ベイリーフ',
    romaji: '*Beirīfu*',
    meaning: 'Bay Leaf',
    explanation: 'Katakana rendering of “bay leaf,” the aromatic herb. Reflects the leaf around its neck.'
  },
  'メガニウム': {
    japanese: 'メガニウム',
    romaji: '*Meganiumu*',
    meaning: 'Mega + (Ger)anium (pun)',
    explanation: 'Blends “mega” (large) with “geranium,” indicating a large flowering herb.'
  },
  'ヒノアラシ': {
    japanese: 'ヒノアラシ',
    romaji: '*Hinoarashi*',
    meaning: 'Fire Storm',
    explanation: '火の嵐 (*hi no arashi*), literally “storm of fire,” referencing the flames on its back.'
  },
  'マグマラシ': {
    japanese: 'マグマラシ',
    romaji: '*Magumarashi*',
    meaning: 'Magma Storm',
    explanation: 'マグマ (magma) + 嵐 (storm), continuing Cyndaquil’s naming motif with intensified heat.'
  },
  'バクフーン': {
    japanese: 'バクフーン',
    romaji: '*Bakufūn*',
    meaning: 'Blast + Typhoon (portmanteau)',
    explanation: '爆風 (*bakufū*, blast of wind) + 台風 (*taifū*, typhoon). Conveys explosive, gale-like flames.'
  },
  'ワニノコ': {
    japanese: 'ワニノコ',
    romaji: '*Waninoko*',
    meaning: 'Crocodile Child',
    explanation: 'ワニ (wani, crocodile) + の子 (no ko, “child of”). A baby crocodilian.'
  },
  'アリゲイツ': {
    japanese: 'アリゲイツ',
    romaji: '*Arigeitsu / “Alligates”*',
    meaning: 'Alligator (youth)',
    explanation: 'From “alligator” (*arigētā*) with a clipped/childlike form. Suggests a young gator.'
  },
  'オーダイル': {
    japanese: 'オーダイル',
    romaji: '*Ōdairu / “Ordile”*',
    meaning: 'King/Great + (Croc)odile',
    explanation: '王 (*ō*, king) + 「ダイル」 (from *crocodile*). Implies a regal/ultimate crocodile.'
  },
  'オタチ': {
    japanese: 'オタチ',
    romaji: '*Otachi*',
    meaning: 'Tail-Standing Weasel',
    explanation: '尾 (*o*, tail) + 立つ (*tatsu*, to stand) + イタチ (*itachi*, weasel). A weasel that stands upright (often using its tail).'
  },
  'オオタチ': {
    japanese: 'オオタチ',
    romaji: '*Ōtachi*',
    meaning: 'Large/Great (Standing) Weasel',
    explanation: '大 (*ō*, big) + (o) *tachi* from *Otachi* line; the grown, elongated weasel.'
  },
  'ホーホー': {
    japanese: 'ホーホー',
    romaji: '*Hōhō*',
    meaning: '“Hoo-hoo” (owl call)',
    explanation: 'Onomatopoeia for an owl’s hoot in Japanese.'
  },
  'ヨルノズク': {
    japanese: 'ヨルノズク',
    romaji: '*Yorunozuku*',
    meaning: 'Night Horned-owl',
    explanation: '夜 (*yoru*, night) + (木菟/梟) *nozuku* (horned owl). A nocturnal owl.'
  },
  'レディバ': {
    japanese: 'レディバ',
    romaji: '*Rediba*',
    meaning: 'Ladybug (red)',
    explanation: 'From “ladybug” with emphasis on *redi* (“red”); a little ladybird beetle.'
  },
  'レディアン': {
    japanese: 'レディアン',
    romaji: '*Redian*',
    meaning: 'Guardian Ladybug (pun)',
    explanation: 'Evolves *Ledyba*; often analyzed as “lady” + “guardian,” hinting at a starry protector motif.'
  },
  'イトマル': {
    japanese: 'イトマル',
    romaji: '*Itomaru*',
    meaning: 'Thread Ball',
    explanation: '糸 (*ito*, thread) + 丸 (*maru*, circle/ball). A small spider that spins thread.'
  },
  'アリアドス': {
    japanese: 'アリアドス',
    romaji: '*Ariadosu*',
    meaning: 'Ariadne (myth reference)',
    explanation: 'Named after Ariadne, who gave Theseus thread to navigate the Labyrinth—appropriate for a web-spinning spider.'
  },
  'クロバット': {
    japanese: 'クロバット',
    romaji: '*Kurobatto*',
    meaning: 'Black Bat / Acrobat (pun)',
    explanation: 'Reads as “kuro” (black) + “bat,” and also evokes “acrobat,” capturing its swift, acrobatic flight.'
  },
  'ランターン': {
    japanese: 'ランターン',
    romaji: '*Rantān*',
    meaning: 'Lantern',
    explanation: 'Katakana for “lantern,” reflecting its bioluminescent lure like a deep-sea anglerfish.'
  },
  'ピチュー': {
    japanese: 'ピチュー',
    romaji: '*Pichū*',
    meaning: 'Tiny Sparkle-Squeak',
    explanation: 'Diminutive of Pikachu; retains ピカ (pika, sparkle) + チュウ (chū, squeak), with a cuter baby-sounding form.'
  },
  'ピィ': {
    japanese: 'ピィ',
    romaji: '*Py / Pii*',
    meaning: '(Cutesy) “Pi”',
    explanation: 'Baby form of ピッピ (Pippi/Clefairy); clipped, high-pitched sound implying something tiny and cute.'
  },
  'ププリン': {
    japanese: 'ププリン',
    romaji: '*Pupurin*',
    meaning: 'Petite Pudding',
    explanation: 'プチ (puchi, petite) + プリン (purin, pudding). Emphasizes a small, jiggly body.'
  },
  'トゲピー': {
    japanese: 'トゲピー',
    romaji: '*Togepī*',
    meaning: 'Spike + “Peep” (chick chirp)',
    explanation: '棘 (toge, spike) + ピヨ/ピー (piyo/pī, chick chirp). A spiky-shelled baby.'
  },
  'トゲチック': {
    japanese: 'トゲチック',
    romaji: '*Togechikku*',
    meaning: 'Spike + Chick (prickly)',
    explanation: '棘 (toge, spike) + チック (chikku, from “chick” / チクチク prickly); angelic baby-bird vibes.'
  },
  'ネイティ': {
    japanese: 'ネイティ',
    romaji: '*Neiti / Naty*',
    meaning: 'Native (totem motif)',
    explanation: 'From “native”; references totemic/indigenous designs carried into its evolution.'
  },
  'ネイティオ': {
    japanese: 'ネイティオ',
    romaji: '*Neitio / Natio*',
    meaning: 'Native + (Indio)',
    explanation: 'Evolves Natu’s theme; evokes “native” + “indio,” fitting its totem pole aesthetic and prophetic stance.'
  },
  'メリープ': {
    japanese: 'メリープ',
    romaji: '*Merīpu*',
    meaning: 'Merino/Baa (sheep)',
    explanation: 'From Merino (sheep breed) and めー (mē, baa). Also an anagram of “ampere,” hinting electricity.'
  },
  'モココ': {
    japanese: 'モココ',
    romaji: '*Mokoko*',
    meaning: 'Fluffy-Fluffy',
    explanation: 'もこもこ (moko-moko, fluffy). A very fluffy intermediate sheep.'
  },
  'デンリュウ': {
    japanese: 'デンリュウ',
    romaji: '*Denryū*',
    meaning: 'Electric Current Dragon',
    explanation: '電流 (denryū, electric current) + 竜 (ryū, dragon). A bright, lighthouse-like electric “dragon.”'
  },
  'キレイハナ': {
    japanese: 'キレイハナ',
    romaji: '*Kireihana*',
    meaning: 'Beautiful Flower',
    explanation: '綺麗 (kirei, beautiful) + 花 (hana, flower). A graceful blossom.'
  },
  'マリル': {
    japanese: 'マリル',
    romaji: '*Mariru*',
    meaning: '(Round) Marine Blue',
    explanation: 'From “marine,” 丸い (marui, round), and 瑠璃 (ruri, lapis/azure). A round, blue river mouse.'
  },
  'マリルリ': {
    japanese: 'マリルリ',
    romaji: '*Mariruri*',
    meaning: '(More) Marine Lapis',
    explanation: 'Evolves Marill’s components with doubled “ruri,” emphasizing deeper blue and growth.'
  },
  'ウソッキー': {
    japanese: 'ウソッキー',
    romaji: '*Usokkī*',
    meaning: 'Liar / Fake',
    explanation: '嘘つき (usotsuki, liar). A Rock-type that pretends to be a tree (fake wood).'
  },
  'ニョロトノ': {
    japanese: 'ニョロトノ',
    romaji: '*Nyorotono*',
    meaning: 'Wriggle + Lord',
    explanation: 'ニョロニョロ (nyoro-nyoro, wriggle) + 殿 (tono, lord). The frog “lord” of the Poli line.'
  },
  'ハネッコ': {
    japanese: 'ハネッコ',
    romaji: '*Hanekko*',
    meaning: 'Hop + Child',
    explanation: '跳ねる (haneru, to hop) + 子 (ko, child). A light dandelion puff that hops on the wind.'
  },
  'ポポッコ': {
    japanese: 'ポポッコ',
    romaji: '*Popokko*',
    meaning: 'Dandelion Kid (onomatopoeia)',
    explanation: 'From たんぽぽ (tanpopo, dandelion); playful doubling indicates a puffball child.'
  },
  'ワタッコ': {
    japanese: 'ワタッコ',
    romaji: '*Watakko*',
    meaning: 'Cotton Child',
    explanation: '綿 (wata, cotton) + 子 (ko, child). A cottony float-seed that drifts far.'
  },
  'エイパム': {
    japanese: 'エイパム',
    romaji: '*Eipamu*',
    meaning: 'Ape + Palm',
    explanation: 'From “ape” + “palm,” referring to its hand-like tail.'
  },
  'ヒマナッツ': {
    japanese: 'ヒマナッツ',
    romaji: '*Himanattsu*',
    meaning: 'Sunflower + Nuts (seeds)',
    explanation: '向日葵 (himawari, sunflower) + ナッツ (nattsu, nuts). A sunflower seed.'
  },
  'キマワリ': {
    japanese: 'キマワリ',
    romaji: '*Kimawari*',
    meaning: 'Sunflower',
    explanation: 'From 向日葵 (himawari); voiced variation plays with “ki” to match naming patterns.'
  },
  'ヤンヤンマ': {
    japanese: 'ヤンヤンマ',
    romaji: '*Yanyanma*',
    meaning: 'Giant Dragonfly',
    explanation: 'ヤンマ (yanma, large dragonfly) with reduplication for emphasis/speed.'
  },
  'ウパー': {
    japanese: 'ウパー',
    romaji: '*Upā*',
    meaning: '(Axolotl) Wooper',
    explanation: 'From “wooper looper,” a Japanese nickname for axolotl; cute aquatic salamander.'
  },
  'ヌオー': {
    japanese: 'ヌオー',
    romaji: '*Nuō*',
    meaning: '(Slack) “Nu-oh”',
    explanation: 'Languid interjection “nuō,” evoking a laid-back, dopey water fish/salamander.'
  },
  'エーフィ': {
    japanese: 'エーフィ',
    romaji: '*Ēfi*',
    meaning: '(ESP) Fi',
    explanation: 'From ESP (extrasensory perception) + フィ (fi, euphonic); a sun/psychic eeveelution.'
  },
  'ブラッキー': {
    japanese: 'ブラッキー',
    romaji: '*Burakkī*',
    meaning: 'Blacky',
    explanation: 'From English “black” with cute -y ending; a moon/dark eeveelution.'
  },
  'ヤミカラス': {
    japanese: 'ヤミカラス',
    romaji: '*Yamikarasu*',
    meaning: 'Darkness Crow',
    explanation: '闇 (yami, darkness) + 烏 (karasu, crow). A sinister night crow.'
  },
  'ヤドキング': {
    japanese: 'ヤドキング',
    romaji: '*Yadokingu*',
    meaning: 'Lodger King',
    explanation: '宿 (yado, lodging) + “king.” The royal apex of the Slowpoke line.'
  },
  'ムウマ': {
    japanese: 'ムウマ',
    romaji: '*Mūma*',
    meaning: '(Dream) Muma / Nightmare spirit',
    explanation: 'From 夢魔 (muma, nightmare/dream demon). A mischievous, wailing spirit.'
  },
  'アンノーン': {
    japanese: 'アンノーン',
    romaji: '*Annōn*',
    meaning: 'Unknown',
    explanation: 'From English “unknown”; glyph-like forms shaped as letters.'
  },
  'ソーナンス': {
    japanese: 'ソーナンス',
    romaji: '*Sōnansu*',
    meaning: '“That’s the way it is!” (catchphrase)',
    explanation: 'From 相成す／そうなんす (*sō nansu*, slang “that’s how it is”); comedic catchphrase of a Japanese performer.'
  },
  'キリンリキ': {
    japanese: 'キリンリキ',
    romaji: '*Kirinriki*',
    meaning: 'Giraffe + Psychokinesis',
    explanation: 'キリン (*kirin*, giraffe) + 念力 (*nenriki*, psychokinesis). Palindrome theme matches the two-headed motif.'
  },
  'クヌギダマ': {
    japanese: 'クヌギダマ',
    romaji: '*Kunugidama*',
    meaning: 'Sawtooth Oak Ball',
    explanation: '櫟／クヌギ (*kunugi*, sawtooth oak) + 玉 (*tama*, ball), i.e., an oak gall/cone.'
  },
  'フォレトス': {
    japanese: 'フォレトス',
    romaji: '*Foretosu*',
    meaning: 'Forest + Fortress (pun)',
    explanation: 'Blend of “forest/forêt” and “fortress”; an armored, shelled bug.'
  },
  'ノコッチ': {
    japanese: 'ノコッチ',
    romaji: '*Nokocchi*',
    meaning: 'Saw/Notch + -chi (cute)',
    explanation: 'From ノコギリ (nokogiri, saw) / 凹 (oko, notch) + diminutive; based on the mythical tsuchinoko.'
  },
  'グライガー': {
    japanese: 'グライガー',
    romaji: '*Guraigā*',
    meaning: 'Glider + (Gargoyle nuance)',
    explanation: 'From “glide/glider”; scorpion-bat hybrid that glides.'
  },
  'ハガネール': {
    japanese: 'ハガネール',
    romaji: '*Haganēru*',
    meaning: 'Steel + (name suffix)',
    explanation: '鋼 (*hagane*, steel) + elongated suffix; Onix’s steel evolution.'
  },
  'ブルー': {
    japanese: 'ブルー',
    romaji: '*Burū*',
    meaning: '“Blue”/Bulldog pun',
    explanation: 'From English “blue/bulldog”; grumpy pink bulldog fairy.'
  },
  'グランブル': {
    japanese: 'グランブル',
    romaji: '*Guranburu*',
    meaning: 'Grand + Bull',
    explanation: 'Larger bulldog; “grand” size/power.'
  },
  'ハリーセン': {
    japanese: 'ハリーセン',
    romaji: '*Harīsen*',
    meaning: 'Needle Thousand (exaggeration)',
    explanation: '針 (*hari*, needle) + 千 (*sen*, thousand) — a very spiky puffer.'
  },
  'ハッサム': {
    japanese: 'ハッサム',
    romaji: '*Hassamu*',
    meaning: 'Scissors',
    explanation: 'From “scissor(s)” in Japanese phonology; pincer-armed mantis.'
  },
  'ツボツボ': {
    japanese: 'ツボツボ',
    romaji: '*Tsubotsubo*',
    meaning: 'Pot-Pot',
    explanation: '壺 (*tsubo*, pot) doubled; a tiny creature living in a pot-like shell.'
  },
  'ヘラクロス': {
    japanese: 'ヘラクロス',
    romaji: '*Herakurosu*',
    meaning: 'Hera + Cross (beetle)',
    explanation: 'Named for the Hercules beetle; “hera” evokes “hera-/hero.”'
  },
  'ニューラ': {
    japanese: 'ニューラ',
    romaji: '*Nyūra*',
    meaning: 'Newla (weasel + claw)',
    explanation: 'Likely from “new”/“nyā” (meow) + “weasel”; a sharp-clawed weasel cat.'
  },
  'ヒメグマ': {
    japanese: 'ヒメグマ',
    romaji: '*Himeguma*',
    meaning: 'Princess/Baby Bear',
    explanation: '姫 (*hime*, princess) + 熊 (*guma/kuma*, bear) — a cute little bear.'
  },
  'リングマ': {
    japanese: 'リングマ',
    romaji: '*Ringuma*',
    meaning: 'Ring + Bear',
    explanation: 'From “ring” (chest ring marking) + 熊 (*kuma*, bear).'
  },
  'マグマッグ': {
    japanese: 'マグマッグ',
    romaji: '*Magumaggu*',
    meaning: 'Magma + -gg (cute)',
    explanation: 'マグマ (magma) with playful doubling; molten slug.'
  },
  'マグカルゴ': {
    japanese: 'マグカルゴ',
    romaji: '*Magukarugo*',
    meaning: 'Magma + Cargo/Escargot',
    explanation: 'Portmanteau of magma and escargot/cargo; lava snail.'
  },
  'ウリムー': {
    japanese: 'ウリムー',
    romaji: '*Urimū*',
    meaning: 'Boar + Moo (child)',
    explanation: '瓜坊 (*uribō*, boar piglet) + ムー (mū); a piglet boar.'
  },
  'イノムー': {
    japanese: 'イノムー',
    romaji: '*Inomū*',
    meaning: 'Boar + Moo',
    explanation: '猪 (*ino*, boar) + ムー (mū); shaggy adult boar.'
  },
  'サニーゴ': {
    japanese: 'サニーゴ',
    romaji: '*Sanīgo*',
    meaning: 'Sunny + Coral',
    explanation: '“Sunny” + 珊瑚 (*sango*, coral); bright pink coral.'
  },
  'テッポウオ': {
    japanese: 'テッポウオ',
    romaji: '*Teppōo*',
    meaning: 'Gun Fish',
    explanation: '鉄砲魚 (*teppōuo*, archerfish) / 鉄砲 (teppō, gun); shoots water like a gun.'
  },
  'オクタン': {
    japanese: 'オクタン',
    romaji: '*Okutan*',
    meaning: 'Octan/Octane (octopus)',
    explanation: 'From “octopus” with engine/“octane” pun; cannon-like siphon.'
  },
  'デリバード': {
    japanese: 'デリバード',
    romaji: '*Deribādo*',
    meaning: 'Deliver + Bird',
    explanation: 'From “delivery bird”; gift-giving motif.'
  },
  'マンタイン': {
    japanese: 'マンタイン',
    romaji: '*Mantain*',
    meaning: 'Manta + -ine',
    explanation: 'From manta ray; serene glider with Remoraid partner.'
  },
  'エアームド': {
    japanese: 'エアームド',
    romaji: '*Eāmudo*',
    meaning: 'Air + Armed',
    explanation: '空気 (air) + 武土/armed (phonetic); steel bird armored like weapons.'
  },
  'デルビル': {
    japanese: 'デルビル',
    romaji: '*Derubiru*',
    meaning: 'Devil',
    explanation: 'From “devil”; a dark hellhound pup.'
  },
  'ヘルガー': {
    japanese: 'ヘルガー',
    romaji: '*Herugā*',
    meaning: 'Hell + Gar',
    explanation: 'From “hell” + guard/gaur; a hellhound.'
  },
  'キングドラ': {
    japanese: 'キングドラ',
    romaji: '*Kingudora*',
    meaning: 'King + Dragon',
    explanation: 'Straight blend; Horsea line’s dragon monarch.'
  },
  'ゴマゾウ': {
    japanese: 'ゴマゾウ',
    romaji: '*Gomazō*',
    meaning: 'Sesame Elephant (cute)',
    explanation: '胡麻 (*goma*, sesame spots) + 象 (*zō*, elephant) with cute -ō; a speckled baby elephant.'
  },
  'ドンファン': {
    japanese: 'ドンファン',
    romaji: '*Donfan*',
    meaning: 'Don + Elephant/Fan',
    explanation: '“Don” (big/boss) + fan/elephant; tire-like rolling.'
  },
  'ポリゴン２': {
    japanese: 'ポリゴン２',
    romaji: '*Porigon Two*',
    meaning: 'Polygon 2',
    explanation: 'Sequel/upgrade to Porygon; software versioning joke.'
  },
  'オドシシ': {
    japanese: 'オドシシ',
    romaji: '*Odoshishi*',
    meaning: 'Frighten Deer',
    explanation: '驚かす／脅す (*odosu*, to scare) + 鹿 (*shika/shishi*, deer); antlers induce illusions.'
  },
  'ドーブル': {
    japanese: 'ドーブル',
    romaji: '*Dōburu*',
    meaning: 'Doodle',
    explanation: 'From “doodle”/“daub”; painter beagle with a tail brush.'
  },
  'バルキー': {
    japanese: 'バルキー',
    romaji: '*Barukī*',
    meaning: 'Bulky',
    explanation: 'From “bulky”; a young fighter before branching evolution.'
  },
  'カポエラー': {
    japanese: 'カポエラー',
    romaji: '*Kapoerā*',
    meaning: 'Capoeira practitioner',
    explanation: 'From the Brazilian martial art *capoeira*; spins on its head.'
  },
  'ムチュール': {
    japanese: 'ムチュール',
    romaji: '*Muchūru*',
    meaning: '(In) a Trance',
    explanation: '夢中 (*muchū*, in a trance/absorbed) + cute suffix; kissing motif.'
  },
  'エレキッド': {
    japanese: 'エレキッド',
    romaji: '*Erekiddo*',
    meaning: 'Elec + Kid',
    explanation: 'From “electric kid”; plug-like horns.'
  },
  'ブビィ': {
    japanese: 'ブビィ',
    romaji: '*Bubī*',
    meaning: '(Bubbly) Fire Baby',
    explanation: 'Onomatopoeic *bubi/bubu* (bubbling) with baby vibe; magma infant.'
  },
  'ミルタンク': {
    japanese: 'ミルタンク',
    romaji: '*Mirutanku*',
    meaning: 'Milk Tank',
    explanation: 'From “milk tank”; dairy cow that stores milk.'
  },
  'ハピナス': {
    japanese: 'ハピナス',
    romaji: '*Hapinasu*',
    meaning: 'Happiness',
    explanation: 'From “happiness”; nurturing egg nurse.'
  },
  'ライコウ': {
    japanese: 'ライコウ',
    romaji: '*Raikō*',
    meaning: 'Thunder Emperor/Howl',
    explanation: '雷 (*rai*, thunder) + 皇／吼 (*kō*, emperor/howl). Thunder beast.'
  },
  'エンテイ': {
    japanese: 'エンテイ',
    romaji: '*Entei*',
    meaning: 'Flame Emperor',
    explanation: '炎 (*en*, flame) + 帝 (*tei*, emperor). Volcanic beast.'
  },
  'スイクン': {
    japanese: 'スイクン',
    romaji: '*Suikun*',
    meaning: 'Water Monarch (archaic reading)',
    explanation: '水 (*sui*, water) + 君 (*kun*, lord/monarch). North wind/water beast.'
  },
  'ヨーギラス': {
    japanese: 'ヨーギラス',
    romaji: '*Yōgirasu*',
    meaning: '(Yō) + gilas (monster suffix)',
    explanation: 'Evokes “yō” (youth) + -giras line suffix; larval rock beast.'
  },
  'サナギラス': {
    japanese: 'サナギラス',
    romaji: '*Sanagirasu*',
    meaning: 'Chrysalis + -giras',
    explanation: '蛹 (*sanagi*, chrysalis) + line suffix; pupa stage.'
  },
  'バンギラス': {
    japanese: 'バンギラス',
    romaji: '*Bangirasu*',
    meaning: 'Ban + -giras (monster)',
    explanation: '“Ban” (as in bang/brutal) + -giras; tyrant kaiju motif.'
  },
  'ルギア': {
    japanese: 'ルギア',
    romaji: '*Rugia*',
    meaning: 'Lugia (original name)',
    explanation: 'Invented mythic name; guardian of the seas/storms.'
  },
  'ホウオウ': {
    japanese: 'ホウオウ',
    romaji: '*Hōō*',
    meaning: 'Phoenix (Fenghuang)',
    explanation: '鳳凰 (*hōō*), the East Asian auspicious phoenix.'
  },
  'セレビィ': {
    japanese: 'セレビィ',
    romaji: '*Serebii*',
    meaning: 'Celebi (celery/celebration pun)',
    explanation: 'From “celebration”/“celery”; a time-traveling forest fairy.'
  },
  'キモリ': {
    japanese: 'キモリ',
    romaji: '*Kimori*',
    meaning: 'Tree Gecko',
    explanation: '木 (*ki*, tree/wood) + ヤモリ／守り (*yamori/mamori*, gecko/protect). A gecko that lives among trees and is swift and protective.'
  },
  'ジュプトル': {
    japanese: 'ジュプトル',
    romaji: '*Jupitoru/Juptile*',
    meaning: '(Jungle) Reptile',
    explanation: 'From “jungle” + “reptile”; agile, leaf-bladed forest reptile.'
  },
  'ジュカイン': {
    japanese: 'ジュカイン',
    romaji: '*Jukain*',
    meaning: '(Jungle) + (Cypress) or -ine',
    explanation: 'Often parsed as “jungle” + evergreen tree nuance (カイン) or English “-tile/–ile”; a swift, bladed forest lizard.'
  },
  'アチャモ': {
    japanese: 'アチャモ',
    romaji: '*Achamo*',
    meaning: 'Hot + Chick (cute)',
    explanation: '熱い (*atsui/acha*, hot) + 雛 (*hiyoko*, chick) with cute ending -mo. A fiery chick.'
  },
  'ワカシャモ': {
    japanese: 'ワカシャモ',
    romaji: '*Wakashamo*',
    meaning: 'Young + Gamecock',
    explanation: '若 (*waka*, young) + 軍鶏 (*shamo*, fighting cock). A young fighting chicken.'
  },
  'バシャーモ': {
    japanese: 'バシャーモ',
    romaji: '*Bashāmo*',
    meaning: 'Splatter/Splash + Gamecock (fiery)',
    explanation: 'ばしゃ (basha, whoosh/splash) + 軍鶏 (*shamo*). A blazing martial rooster.'
  },
  'ミズゴロウ': {
    japanese: 'ミズゴロウ',
    romaji: '*Mizugorō*',
    meaning: 'Water + Mud Loach',
    explanation: '水 (*mizu*, water) + ドジョウ (*dojo*, loach). References amphibious, mud-dwelling nature.'
  },
  'ヌマクロー': {
    japanese: 'ヌマクロー',
    romaji: '*Numakurō*',
    meaning: 'Marsh + Claw/Craw',
    explanation: '沼 (*numa*, marsh) + クロウ (claw/craw). A marsh-stomping amphibian.'
  },
  'ラグラージ': {
    japanese: 'ラグラージ',
    romaji: '*Ragurāji/Laglarge*',
    meaning: 'Lag/Lagoon + Large',
    explanation: 'Blend suggesting a very large swamp-dweller, powerful in wetlands.'
  },
  'ポチエナ': {
    japanese: 'ポチエナ',
    romaji: '*Pochiena*',
    meaning: 'Pochi (pet dog name) + Hyena',
    explanation: 'ポチ (*Pochi*, common dog name) + “hyena.” A small, scrappy hyena-like pup.'
  },
  'グラエナ': {
    japanese: 'グラエナ',
    romaji: '*Guraena*',
    meaning: 'Gura (growl) + Hyena',
    explanation: '“Gura” evokes a deep growl + hyena; the imposing evolved hyena/wolf.'
  },
  'ジグザグマ': {
    japanese: 'ジグザグマ',
    romaji: '*Jiguzaguma*',
    meaning: 'Zigzag + (Animal) -ma',
    explanation: 'From “zigzag” + 熊 (*guma*, bear) or animal suffix -ma; its pathing and stripes are zigzagged.'
  },
  'マッスグマ': {
    japanese: 'マッスグマ',
    romaji: '*Massuguma*',
    meaning: 'Straight + (Animal) -ma',
    explanation: '真っ直ぐ (*massugu*, straight) + -ma. Runs straight in a line, unlike its pre-evo’s zigzags.'
  },
  'ケムッソ': {
    japanese: 'ケムッソ',
    romaji: '*Kemusso*',
    meaning: 'Hairy/Caterpillar (rough)',
    explanation: '毛虫 (*kemushi*, caterpillar) with emphatic -sso; a spiny worm.'
  },
  'カラサリス': {
    japanese: 'カラサリス',
    romaji: '*Karasarisu*',
    meaning: 'Empty Shell + Chrysalis',
    explanation: '殻 (*kara*, shell) + chrysalis; a white, silky cocoon form.'
  },
  'アゲハント': {
    japanese: 'アゲハント',
    romaji: '*Agehanto*',
    meaning: 'Swallowtail + Hunt',
    explanation: 'アゲハ (*ageha*, swallowtail butterfly) + “hunt”; a nectar-feeding but aggressive butterfly.'
  },
  'マユルド': {
    japanese: 'マユルド',
    romaji: '*Mayurudo*',
    meaning: 'Cocoon + (hard)',
    explanation: '繭 (*mayu*, cocoon) + “hard” nuance; the darker, tougher cocoon.'
  },
  'ドクケイル': {
    japanese: 'ドクケイル',
    romaji: '*Dokukeiru*',
    meaning: 'Poison + Moth',
    explanation: '毒 (*doku*, poison) + ケイル (from “scale”/“moth”); a toxic scale-shedding moth.'
  },
  'ハスボー': {
    japanese: 'ハスボー',
    romaji: '*Hasubō*',
    meaning: 'Lotus + Boy (diminutive)',
    explanation: '蓮 (*hasu*, lotus) + 坊 (*bō*, boy/youngster). A little lotus-pad Pokémon.'
  },
  'ハスブレロ': {
    japanese: 'ハスブレロ',
    romaji: '*Hasuburero*',
    meaning: 'Lotus + Sombrero',
    explanation: '蓮 (*hasu*) + “sombrero”; a kappa-like dancer with a lily-pad hat.'
  },
  'ルンパッパ': {
    japanese: 'ルンパッパ',
    romaji: '*Runpappa*',
    meaning: '(Rumba) + Papa (dance)',
    explanation: 'From “rumba/lo-co” + “papa”; a festive dancing kappa.'
  },
  'タネボー': {
    japanese: 'タネボー',
    romaji: '*Tanebō*',
    meaning: 'Seed + Boy (diminutive)',
    explanation: '種 (*tane*, seed) + 坊 (*bō*, boy). An acorn cap-sporting seed.'
  },
  'コノハナ': {
    japanese: 'コノハナ',
    romaji: '*Konohana*',
    meaning: 'Tree/Leaf Spirit',
    explanation: '木の花 (*konohana*, “tree’s flower”) / 木葉 (*konoha*, leaves); also hints at *Konoha* (leaf) folklore.'
  },
  'ダーテング': {
    japanese: 'ダーテング',
    romaji: '*Dātengu*',
    meaning: 'Dirt/Bad + Tengu',
    explanation: '“Dirty/dark” + 天狗 (*tengu*, long-nosed yokai). A fan-wielding forest spirit.'
  },
  'スバメ': {
    japanese: 'スバメ',
    romaji: '*Subame*',
    meaning: 'Swallow (bird)',
    explanation: '燕 (*tsubame*, swallow). A small, speedy swallow.'
  },
  'オオスバメ': {
    japanese: 'オオスバメ',
    romaji: '*Ōsubame*',
    meaning: 'Great Swallow',
    explanation: '大 (*ō*, great) + 燕 (*subame*, swallow). The larger, stronger swallow.'
  },
  'キャモメ': {
    japanese: 'キャモメ',
    romaji: '*Kyamome*',
    meaning: 'Gull',
    explanation: '鴎 (*kamome*, seagull) in katakana. A coastal gull.'
  },
  'ペリッパー': {
    japanese: 'ペリッパー',
    romaji: '*Perippā*',
    meaning: 'Pelican + -er',
    explanation: 'From “pelican,” emphasizing its huge bill and courier role.'
  },
  'ラルトス': {
    japanese: 'ラルトス',
    romaji: '*Rarutosu*',
    meaning: '(Waltz) + -us',
    explanation: 'Evokes “waltz”/“halts” with elegant, empathic vibe; starts the empath line leading to Gardevoir/Gallade.'
  },
  'キルリア': {
    japanese: 'キルリア',
    romaji: '*Kiruria*',
    meaning: '(Curly/Ballet-inspired name)',
    explanation: 'Evokes graceful, curving movements like ballet; a stylized coined name leading to Gardevoir.'
  },
  'サーナイト': {
    japanese: 'サーナイト',
    romaji: '*Sānaito*',
    meaning: 'Sir Knight',
    explanation: 'Japanese reads like “sir + knight,” fitting its protective, knightly guardian motif.'
  },
  'アメタマ': {
    japanese: 'アメタマ',
    romaji: '*Ametama*',
    meaning: 'Rain + Drop (Ball)',
    explanation: '雨 (*ame*, rain) + 玉 (*tama*, drop/ball); a pond-skater that glides on rainy ponds.'
  },
  'アメモース': {
    japanese: 'アメモース',
    romaji: '*Amemōsu*',
    meaning: 'Rain + Moth',
    explanation: '雨 (*ame*, rain) + “moth”; eyespot “mask” wings after evolving from a rainy larva.'
  },
  'キノココ': {
    japanese: 'キノココ',
    romaji: '*Kinokoko*',
    meaning: 'Mushroom + Child',
    explanation: 'キノコ (*kinoko*, mushroom) + 子 (*ko*, child); a small, grumpy mushroom.'
  },
  'キノガッサ': {
    japanese: 'キノガッサ',
    romaji: '*Kinogassa*',
    meaning: 'Mushroom + (Umbrella/Cap)',
    explanation: 'From キノコ (mushroom) + かさ/*gasa* (umbrella/cap); a fighting mushroom with a big cap.'
  },
  'ナマケロ': {
    japanese: 'ナマケロ',
    romaji: '*Namakero*',
    meaning: '(To) Be Lazy',
    explanation: '怠ける (*namakeru*, to slack off). A very lazy sloth.'
  },
  'ヤルキモノ': {
    japanese: 'ヤルキモノ',
    romaji: '*Yarukimono*',
    meaning: 'Motivated One',
    explanation: 'やる気 (*yaruki*, motivation/drive) + 者 (*mono*, person). Hyperactive sloth stage.'
  },
  'ケッキング': {
    japanese: 'ケッキング',
    romaji: '*Kekkingu*',
    meaning: 'Slacking + King',
    explanation: 'Portmanteau of “slacking” + “king,” the indolent king of sloths.'
  },
  'ツチニン': {
    japanese: 'ツチニン',
    romaji: '*Tsuchinin*',
    meaning: 'Earth + Ninja',
    explanation: '土 (*tsuchi*, earth) + 忍 (*nin*, ninja); a burrowing ninja cicada nymph.'
  },
  'テッカニン': {
    japanese: 'テッカニン',
    romaji: '*Tekkanin*',
    meaning: 'Swift/Steel + Ninja',
    explanation: 'Suggests 鉄 (*tetsu*, steel) or てっか (blazing fast) + 忍 (*nin*, ninja); a lightning-fast ninja cicada.'
  },
  'ヌケニン': {
    japanese: 'ヌケニン',
    romaji: '*Nukenin*',
    meaning: 'Runaway/Abandoned Ninja',
    explanation: '抜け忍 (*nukenin*, a defector ninja); a hollow shell left behind that gains eerie life.'
  },
  'ゴニョニョ': {
    japanese: 'ゴニョニョ',
    romaji: '*Gonyonyo*',
    meaning: '(To) Mumble Mumble',
    explanation: 'ごにょごにょ (*gonyo-gonyo*, to mutter). A timid whispering Pokémon.'
  },
  'ドゴーム': {
    japanese: 'ドゴーム',
    romaji: '*Dogōmu*',
    meaning: 'Roar/Thundering Sound',
    explanation: '轟音 (*gōon*, roaring sound); stomps and shouts loudly.'
  },
  'バクオング': {
    japanese: 'バクオング',
    romaji: '*Bakuongu*',
    meaning: 'Explosive Sound',
    explanation: '爆音 (*bakuon*, explosive/loud sound). A living subwoofer.'
  },
  'マクノシタ': {
    japanese: 'マクノシタ',
    romaji: '*Makunoshita*',
    meaning: '(Sumo) Below the Curtain',
    explanation: '幕下 (*maku-no-shita*), a sumo rank below the main ring; a trainee sumo.'
  },
  'ハリテヤマ': {
    japanese: 'ハリテヤマ',
    romaji: '*Hariteyama*',
    meaning: 'Open-hand Slap + Mountain',
    explanation: '張り手 (*harite*, sumo open-hand strike) + 山 (*yama*, mountain); a powerful sumo.'
  },
  'ルリリ': {
    japanese: 'ルリリ',
    romaji: '*Ruriri*',
    meaning: 'Lapis-Lazuli (doubled)',
    explanation: '瑠璃 (*ruri*, lapis/azure) with a cutesy doubled ending; tiny blue mouse.'
  },
  'ノズパス': {
    japanese: 'ノズパス',
    romaji: '*Nozupasu*',
    meaning: 'Nose + Compass/Pass',
    explanation: 'Huge nose + compass motif (always points north); rock guide.'
  },
  'エネコ': {
    japanese: 'エネコ',
    romaji: '*Eneko*',
    meaning: 'Energetic Cat',
    explanation: 'エネルギー (energy) + 猫 (*neko*, cat); a peppy kitten.'
  },
  'エネコロロ': {
    japanese: 'エネコロロ',
    romaji: '*Enekororo*',
    meaning: 'Eneko (cat) + Roro (purring/rolling)',
    explanation: 'From エネコ + ころころ (*korokoro*, rolling/purring); a carefree, pampered cat.'
  },
  'ヤミラミ': {
    japanese: 'ヤミラミ',
    romaji: '*Yamirami*',
    meaning: 'Darkness + (Grudge/Greed pun)',
    explanation: '闇 (*yami*, darkness) + wordplay suggesting 恨み (*urami*, grudge) / gems; a gem-eyed imp.'
  },
  'クチート': {
    japanese: 'クチート',
    romaji: '*Kuchīto*',
    meaning: 'Mouth + Cheat',
    explanation: '口 (*kuchi*, mouth) + “cheat”; a deceiver with jaws on the back of its head.'
  },
  'ココドラ': {
    japanese: 'ココドラ',
    romaji: '*Kokodora*',
    meaning: 'Little (Child) + -dora (monster suffix)',
    explanation: '子 (*ko*, child) reduplicated + ドラ (as in ドラゴン/monster). A small iron armor beast.'
  },
  'コドラ': {
    japanese: 'コドラ',
    romaji: '*Kodora*',
    meaning: 'Child -dora',
    explanation: 'Evolves from Kokodora; name drops one “ko” to show growth.'
  },
  'ボスゴドラ': {
    japanese: 'ボスゴドラ',
    romaji: '*Bosugodora*',
    meaning: 'Boss + -godora',
    explanation: 'ボス (boss) + ゴドラ (evokes Godzilla-like kaiju). The armored boss.'
  },
  'アサナン': {
    japanese: 'アサナン',
    romaji: '*Asanan*',
    meaning: 'Asana (yoga pose)',
    explanation: 'From “asana,” reflecting meditative yoga training.'
  },
  'チャーレム': {
    japanese: 'チャーレム',
    romaji: '*Chāremu*',
    meaning: '(Charm) + (Asana) coinage',
    explanation: 'Coined name evoking “charm/cha” + “-lem”; a yogi that fights while meditating.'
  },
  'ラクライ': {
    japanese: 'ラクライ',
    romaji: '*Rakurai*',
    meaning: 'Lightning Strike',
    explanation: '落雷 (*rakurai*, lightning strike). A hound charged with static.'
  },
  'ライボルト': {
    japanese: 'ライボルト',
    romaji: '*Raiboruto*',
    meaning: 'Thunder + Volt',
    explanation: '雷 (*rai*, thunder) + “volt”; a high-voltage hound.'
  },
  'プラスル': {
    japanese: 'プラスル',
    romaji: '*Purasu ru*',
    meaning: 'Plus',
    explanation: 'From “plus”; a cheerleader mouse that boosts allies.'
  },
  'マイナン': {
    japanese: 'マイナン',
    romaji: '*Mainan*',
    meaning: 'Minus',
    explanation: 'From “minus”; a partner to Plusle that specializes in support.'
  },
  'バルビート': {
    japanese: 'バルビート',
    romaji: '*Barubīto*',
    meaning: 'Bulb/Volt + Beat',
    explanation: 'Firefly whose tail glows to a beat; name evokes light + rhythm.'
  },
  'イルミーゼ': {
    japanese: 'イルミーゼ',
    romaji: '*Irumīze*',
    meaning: 'Illuminate',
    explanation: 'From “illuminate”; a firefly that leads Volbeat swarms with light.'
  },
  'ロゼリア': {
    japanese: 'ロゼリア',
    romaji: '*Rozeria*',
    meaning: 'Rose + -lia',
    explanation: 'From “rose”; a genteel thorny flower.'
  },
  'ゴクリン': {
    japanese: 'ゴクリン',
    romaji: '*Gokurin*',
    meaning: '(To) Gulp Down',
    explanation: 'ごくり (*gokuri*, gulp) + -n; a stomach on legs.'
  },
  'マルノーム': {
    japanese: 'マルノーム',
    romaji: '*Marunōmu*',
    meaning: 'Swallow Whole',
    explanation: '丸呑み (*marunomi*, to swallow whole). A big purple glutton.'
  },
  'キバニア': {
    japanese: 'キバニア',
    romaji: '*Kibania*',
    meaning: 'Fang + Piranha',
    explanation: '牙 (*kiba*, fang) + “piranha”; a vicious river fish.'
  },
  'サメハダー': {
    japanese: 'サメハダー',
    romaji: '*Samehadā*',
    meaning: 'Shark + Rough Skin',
    explanation: '鮫 (*same*, shark) + 鮫肌 (*samehada*, sharkskin/rough skin); a torpedo shark.'
  },
  'ホエルコ': {
    japanese: 'ホエルコ',
    romaji: '*Hoeruko*',
    meaning: 'Whale + Child',
    explanation: '“Whale” + 子 (*ko*, child). A playful baby whale.'
  },
  'ホエルオー': {
    japanese: 'ホエルオー',
    romaji: '*Hoeruo*',
    meaning: 'Whale + Great/King',
    explanation: 'From “whale” and 大／王 (*ō*, great/king). The colossal whale Pokémon.'
  },
  'ドンメル': {
    japanese: 'ドンメル',
    romaji: '*Donmeru*',
    meaning: 'Thud + Camel',
    explanation: 'ドン (*don*, thudding/heavy) + “camel.” A dull, placid camel that stores magma.'
  },
  'バクーダ': {
    japanese: 'バクーダ',
    romaji: '*Bakūda*',
    meaning: 'Explosion + Camel',
    explanation: '爆 (*baku*, explosion) + “dromedary/camel.” A volcano-backed camel.'
  },
  'コータス': {
    japanese: 'コータス',
    romaji: '*Kōtasu*',
    meaning: 'Coal + Tortoise',
    explanation: 'From “coal” + tortoise; burns coal in its shell to emit smoke.'
  },
  'バネブー': {
    japanese: 'バネブー',
    romaji: '*Banebū*',
    meaning: 'Spring + Pig',
    explanation: 'バネ (*bane*, spring) + ブー (*bū*, pig oink). It bounces on its springy tail.'
  },
  'ブーピッグ': {
    japanese: 'ブーピッグ',
    romaji: '*Būpiggu*',
    meaning: 'Boo/Oink + Pig',
    explanation: 'From *bū* (oink) + pig; a jujitsu-dancing pig that channels psychic power.'
  },
  'パッチール': {
    japanese: 'パッチール',
    romaji: '*Pacchīru*',
    meaning: 'Patch + (seal/sticker)',
    explanation: 'パッチ (*patchi*, patch) + シール (*shīru*, sticker); spot patterns vary individually.'
  },
  'ナックラー': {
    japanese: 'ナックラー',
    romaji: '*Nakkurā*',
    meaning: 'Knuckle + (burrower)',
    explanation: 'Evokes “knuckle” and biting power; an antlion that digs pitfall traps.'
  },
  'ビブラーバ': {
    japanese: 'ビブラーバ',
    romaji: '*Biburāba*',
    meaning: 'Vibrate + Larva',
    explanation: 'From “vibration” + larva; wings buzz with ultrasonic waves.'
  },
  'フライゴン': {
    japanese: 'フライゴン',
    romaji: '*Furaigon*',
    meaning: 'Fly + Dragon',
    explanation: 'From “fly” + “dragon”; a desert spirit-dragon.'
  },
  'サボネア': {
    japanese: 'サボネア',
    romaji: '*Sabonea*',
    meaning: 'Cactus + -nea',
    explanation: 'サボテン (*saboten*, cactus) stylized; a spiny desert cactus.'
  },
  'ノクタス': {
    japanese: 'ノクタス',
    romaji: '*Nokutasu*',
    meaning: 'Nocturnal + Cactus',
    explanation: 'From “noct-” (night) + cactus; a night-stalking scarecrow cactus.'
  },
  'チルット': {
    japanese: 'チルット',
    romaji: '*Chirutto*',
    meaning: '(Chirp) + -tto (cute)',
    explanation: 'Onomatopoeic chirp (*chiru/chiru*) with cute ending; cotton-winged bird.'
  },
  'チルタリス': {
    japanese: 'チルタリス',
    romaji: '*Chirutarisu*',
    meaning: '(Chiru-line) + (Altus/Aria nuance)',
    explanation: 'Continues the *Chiru* line with a lofty aria/altus feel; a cloud-like songbird dragon.'
  },
  'ザングース': {
    japanese: 'ザングース',
    romaji: '*Zangūsu*',
    meaning: 'Slash + Mongoose (pun)',
    explanation: '斬 (*zan*, to slash) + “mongoose.” Traditional foe of snakes.'
  },
  'ハブネーク': {
    japanese: 'ハブネーク',
    romaji: '*Habunēku*',
    meaning: 'Habu Viper + Snake',
    explanation: 'ハブ (*habu*, pit viper) + “snake.” Long-standing rival to Zangoose.'
  },
  'ルナトーン': {
    japanese: 'ルナトーン',
    romaji: '*Runatōn*',
    meaning: 'Luna + Stone/Tone',
    explanation: 'From Latin *luna* (moon) + stone; a crescent moon meteorite.'
  },
  'ソルロック': {
    japanese: 'ソルロック',
    romaji: '*Sorurokku*',
    meaning: 'Sol + Rock',
    explanation: 'From Latin *sol* (sun) + rock; a sunlike meteorite.'
  },
  'ドジョッチ': {
    japanese: 'ドジョッチ',
    romaji: '*Dojotchi*',
    meaning: 'Dojo Loach (diminutive)',
    explanation: 'ドジョウ (*dojo*, loach) + -ッチ (diminutive). A slippery mud fish.'
  },
  'ナマズン': {
    japanese: 'ナマズン',
    romaji: '*Namazun*',
    meaning: 'Catfish (augmented)',
    explanation: '鯰 (*namazu*, catfish) + -n; quake-foretelling catfish of folklore.'
  },
  'ヘイガニ': {
    japanese: 'ヘイガニ',
    romaji: '*Heigani*',
    meaning: '(Soldier) Crab',
    explanation: '兵 (*hei*, soldier) + 蟹 (*kani*, crab) sound shift; a hardy invasive crayfish.'
  },
  'シザリガー': {
    japanese: 'シザリガー',
    romaji: '*Shizarigā*',
    meaning: 'Scissor + Crayfish',
    explanation: 'シザー (*shizā*, scissor) + ザリガニ (*zarigani*, crayfish). A violent rogue crayfish.'
  },
  'ヤジロン': {
    japanese: 'ヤジロン',
    romaji: '*Yajiron*',
    meaning: 'Arrowhead + -on',
    explanation: '矢尻 (*yajiri*, arrowhead); top/figurine that spins.'
  },
  'ネンドール': {
    japanese: 'ネンドール',
    romaji: '*Nendōru*',
    meaning: 'Clay + Doll',
    explanation: '粘土 (*nendo*, clay) + doll; based on ancient haniwa figures.'
  },
  'リリーラ': {
    japanese: 'リリーラ',
    romaji: '*Rirīra*',
    meaning: 'Lily + -la',
    explanation: 'From “lily” with soft ending; a fossil sea lily (crinoid).'
  },
  'ユレイドル': {
    japanese: 'ユレイドル',
    romaji: '*Yureidoru*',
    meaning: 'Sway + Idol/Doll',
    explanation: '揺れる (*yureru*, to sway) + “idol/doll”; a swaying sea-lily predator.'
  },
  'アノプス': {
    japanese: 'アノプス',
    romaji: '*Anopusu*',
    meaning: 'Anomalocaris + -ops',
    explanation: 'From *Anomalocaris* lineage; an ancient arthropod.'
  },
  'アーマルド': {
    japanese: 'アーマルド',
    romaji: '*Āmarudo*',
    meaning: 'Armor + -aldo',
    explanation: '“Armor” + name-like ending; a plated predator.'
  },
  'ヒンバス': {
    japanese: 'ヒンバス',
    romaji: '*Hinbasu*',
    meaning: 'Poor/Meager + Bass',
    explanation: '貧 (*hin*, poor/meager) + “bass.” An unattractive but hardy fish.'
  },
  'ミロカロス': {
    japanese: 'ミロカロス',
    romaji: '*Mirokarosu*',
    meaning: '(Melody/Beauty) + -caros (Greek “beautiful”)',
    explanation: 'Evokes “melodic” and Greek *kalos* (beautiful); the elegant serpent.'
  },
  'ポワルン': {
    japanese: 'ポワルン',
    romaji: '*Powarun*',
    meaning: 'Fluffy/Floaty + (cheerful) “-run”',
    explanation: 'From ふわふわ/*ぽわぽわ* (fluffy/floaty) + ルン (*run*, cheerful tone); a weather-formed body.'
  },
  'カクレオン': {
    japanese: 'カクレオン',
    romaji: '*Kakureon*',
    meaning: 'Hide + Chameleon',
    explanation: '隠れる (*kakureru*, to hide) + “chameleon.” A color-shifting lizard.'
  },
  'カゲボウズ': {
    japanese: 'カゲボウズ',
    romaji: '*Kagebōzu*',
    meaning: 'Shadow + Monk/Doll',
    explanation: '影 (*kage*, shadow) + 坊主 (*bōzu*, monk/doll); a vengeful little puppet.'
  },
  'ジュペッタ': {
    japanese: 'ジュペッタ',
    romaji: '*Jupetta*',
    meaning: 'Puppet (corrupted)',
    explanation: 'From “puppet”; a discarded doll animated by grudges.'
  },
  'ヨマワル': {
    japanese: 'ヨマワル',
    romaji: '*Yomawaru*',
    meaning: 'Night Watch/Patrol',
    explanation: '夜回り (*yomawari*, night patrol); a skulking reaper.'
  },
  'サマヨール': {
    japanese: 'サマヨール',
    romaji: '*Samayōru*',
    meaning: 'To Wander/Aimless',
    explanation: '彷徨う (*samayō*, to wander). A one-eyed wandering specter.'
  },
  'トロピウス': {
    japanese: 'トロピウス',
    romaji: '*Toropiusu*',
    meaning: 'Tropics + -ius',
    explanation: 'From “tropic”; a banana-bearing dinosaur of the tropics.'
  },
  'チリーン': {
    japanese: 'チリーン',
    romaji: '*Chirīn*',
    meaning: '*Chirin* (bell jingle)',
    explanation: 'Onomatopoeia for a wind chime’s ring; a healing chime spirit.'
  },
  'アブソル': {
    japanese: 'アブソル',
    romaji: '*Abusoru*',
    meaning: 'Absolute/Absolve (pun)',
    explanation: 'From “absolute/absolution”; a disaster-foretelling beast misunderstood as ominous.'
  },
  'ソーナノ': {
    japanese: 'ソーナノ',
    romaji: '*Sōnano*',
    meaning: '“Is that so?” (catchphrase)',
    explanation: 'From そうなの (*sō na no*, “is that so?”), matching Wobbuffet’s ソーナンス (“that’s how it is”).'
  },
  'ユキワラシ': {
    japanese: 'ユキワラシ',
    romaji: '*Yukiwarashi*',
    meaning: 'Snow Child',
    explanation: '雪 (*yuki*, snow) + 童子 (*warashi*, child spirit). Based on yuki-warashi, a snow spirit.'
  },
  'オニゴーリ': {
    japanese: 'オニゴーリ',
    romaji: '*Onigōri*',
    meaning: 'Demon Ice',
    explanation: '鬼 (*oni*, demon) + 氷 (*kōri*, ice). A demonic ice-face.'
  },
  'タマザラシ': {
    japanese: 'タマザラシ',
    romaji: '*Tamazarashi*',
    meaning: 'Ball + Sea Lion',
    explanation: '玉 (*tama*, ball) + 胡麻斑海豹 (*azarashi*, spotted seal). A round, rolling seal.'
  },
  'トドグラー': {
    japanese: 'トドグラー',
    romaji: '*Todogurā*',
    meaning: 'Sea Lion + Growl',
    explanation: 'トド (*todo*, sea lion) + グラー (growl); a playful but strong pinniped.'
  },
  'トドゼルガ': {
    japanese: 'トドゼルガ',
    romaji: '*Todozeruga*',
    meaning: 'Sea Lion + Fighting (zeruga from セルガ?)',
    explanation: 'トド (todo, sea lion) + 善牙 (zeruga, fierce tusks). A walrus-like beast.'
  },
  'パールル': {
    japanese: 'パールル',
    romaji: '*Pāruru*',
    meaning: 'Pearl (cute)',
    explanation: 'From “pearl” with doubled ending for cuteness. A clam with a pearl.'
  },
  'ハンテール': {
    japanese: 'ハンテール',
    romaji: '*Hantēru*',
    meaning: 'Hunt + Tail',
    explanation: 'Direct from English; a predatory deep-sea eel.'
  },
  'サクラビス': {
    japanese: 'サクラビス',
    romaji: '*Sakurabisu*',
    meaning: 'Cherry Blossom + Abyss',
    explanation: '桜 (*sakura*, cherry blossom) + abyss; a pink, graceful deep-sea eel.'
  },
  'ジーランス': {
    japanese: 'ジーランス',
    romaji: '*Jīransu*',
    meaning: 'Coelacanth (katakana)',
    explanation: 'From “G.” (possibly “grand/geo”) + coelacanth; an ancient fish.'
  },
  'ラブカス': {
    japanese: 'ラブカス',
    romaji: '*Rabukasu*',
    meaning: 'Love + Kasu (shorthand)',
    explanation: 'From “love” + “discus”; heart-shaped fish of love.'
  },
  'タツベイ': {
    japanese: 'タツベイ',
    romaji: '*Tatsubei*',
    meaning: 'Dragon + Bei (suffix)',
    explanation: '竜 (*tatsu*, dragon) + small-name suffix; a dragon aspirant.'
  },
  'コモルー': {
    japanese: 'コモルー',
    romaji: '*Komorū*',
    meaning: 'To Seclude + -ru',
    explanation: '籠る (*komoru*, to seclude/encase); a cocoon dragon.'
  },
  'ボーマンダ': {
    japanese: 'ボーマンダ',
    romaji: '*Bōmanda*',
    meaning: 'Bomber + Salamander',
    explanation: 'From “salamander” + “bombardment/bomber.” A fearsome dragon.'
  },
  'ダンバル': {
    japanese: 'ダンバル',
    romaji: '*Danbaru*',
    meaning: 'Dumbbell (katakana)',
    explanation: 'From “dumbbell” with Japanese phonology; metallic weight shape.'
  },
  'メタング': {
    japanese: 'メタング',
    romaji: '*Metangu*',
    meaning: 'Metal + Tang',
    explanation: 'From “metal” + “tang” (sound/extension); alloyed form.'
  },
  'メタグロス': {
    japanese: 'メタグロス',
    romaji: '*Metagurosu*',
    meaning: 'Metal + Gross (big)',
    explanation: 'From “metal” + gross (large); a huge, four-brained machine.'
  },
  'レジロック': {
    japanese: 'レジロック',
    romaji: '*Rejirokku*',
    meaning: 'Regi + Rock',
    explanation: '“Regi-” prefix for Regi trio + rock.'
  },
  'レジアイス': {
    japanese: 'レジアイス',
    romaji: '*Rejiaisu*',
    meaning: 'Regi + Ice',
    explanation: '“Regi-” prefix + ice.'
  },
  'レジスチル': {
    japanese: 'レジスチル',
    romaji: '*Rejisuchiru*',
    meaning: 'Regi + Steel',
    explanation: '“Regi-” prefix + steel.'
  },
  'ラティアス': {
    japanese: 'ラティアス',
    romaji: '*Ratiasu*',
    meaning: 'Lati- + feminine -as',
    explanation: 'Coined dragon name; feminine suffix -as.'
  },
  'ラティオス': {
    japanese: 'ラティオス',
    romaji: '*Ratiosu*',
    meaning: 'Lati- + masculine -os',
    explanation: 'Coined dragon name; masculine suffix -os.'
  },
  'カイオーガ': {
    japanese: 'カイオーガ',
    romaji: '*Kaiōga*',
    meaning: 'Sea + Ogre',
    explanation: '海 (*kai*, sea) + ogre; a leviathan of the ocean.'
  },
  'グラードン': {
    japanese: 'グラードン',
    romaji: '*Gurādon*',
    meaning: 'Ground + Don (dinosaur)',
    explanation: 'From “ground” + suffix -don (common in dinosaur names). A continent-raising titan.'
  },
  'レックウザ': {
    japanese: 'レックウザ',
    romaji: '*Rekkūza*',
    meaning: 'Split Sky',
    explanation: '烈空 (*rekkū*, violent sky) + -za; a sky serpent.'
  },
  'ジラーチ': {
    japanese: 'ジラーチ',
    romaji: '*Jirāchi*',
    meaning: 'Wish (from Slavic/Esperanto “žirac”)',
    explanation: 'From 幸 (*shiawase*, happiness) and borrowing “wish” from other languages. A wish-granting star.'
  },
  'デオキシス': {
    japanese: 'デオキシス',
    romaji: '*Deokishisu*',
    meaning: 'Deoxyribonucleic (DNA)',
    explanation: 'From “deoxyribonucleic acid”; a DNA-based alien.'
  },
  'ナエトル': {
    japanese: 'ナエトル',
    romaji: '*Naetoru*',
    meaning: 'Sprout + Turtle',
    explanation: '苗 (*nae*, sprout/seedling) + 亀 (*toru/toru*, turtle—phonetic). A seedling-backed turtle.'
  },
  'ハヤシガメ': {
    japanese: 'ハヤシガメ',
    romaji: '*Hayashigame*',
    meaning: 'Forest Turtle',
    explanation: '林 (*hayashi*, forest) + 亀 (*kame/game*, turtle). Bushes grow on its shell.'
  },
  'ドダイトス': {
    japanese: 'ドダイトス',
    romaji: '*Dodaitosu*',
    meaning: 'Massive + Tortoise/Earth',
    explanation: '土台 (*dodai*, foundation/earth) + トータス (tortoise); a continent-like tortoise.'
  },
  'ヒコザル': {
    japanese: 'ヒコザル',
    romaji: '*Hikozaru*',
    meaning: 'Fire Child Monkey',
    explanation: '火 (*hi*, fire) + 子 (*ko*, child) + 猿 (*zaru*, monkey). A fiery little monkey.'
  },
  'モウカザル': {
    japanese: 'モウカザル',
    romaji: '*Mōkazaru*',
    meaning: 'Ferocious Flames Monkey',
    explanation: '猛火 (*mōka*, fierce flames) + 猿 (*zaru*, monkey). Mid-stage fighter.'
  },
  'ゴウカザル': {
    japanese: 'ゴウカザル',
    romaji: '*Gōkazaru*',
    meaning: 'Great Conflagration Monkey',
    explanation: '豪火／劫火 (*gōka*, great blaze) + 猿 (*zaru*, monkey). A blazing martial sage.'
  },
  'ポッチャマ': {
    japanese: 'ポッチャマ',
    romaji: '*Pochama*',
    meaning: 'Plump + Child (polite “-sama” pun)',
    explanation: 'ぽっちゃり (*pochari*, plump) + ちゃま/*sama* (child/master). A proud, plump penguin chick.'
  },
  'ポッタイシ': {
    japanese: 'ポッタイシ',
    romaji: '*Pottaishi*',
    meaning: 'Potta + Stone/Will (coined)',
    explanation: 'Coined from *potta* sound + 意志 (*ishi*, will) / 石 (*ishi*, stone). A princely penguin.'
  },
  'エンペルト': {
    japanese: 'エンペルト',
    romaji: '*Emperuto*',
    meaning: 'Emperor (Penguin)',
    explanation: '“Emperor” + ペンギン (penguin) nuance; trident-like beak evokes rulership.'
  },
  'ムックル': {
    japanese: 'ムックル',
    romaji: '*Mukkuru*',
    meaning: '(Chirp) Mukku + -ru',
    explanation: 'Onomatopoeic bird name; a small starling.'
  },
  'ムクバード': {
    japanese: 'ムクバード',
    romaji: '*Mukubādo*',
    meaning: 'Mukku Bird',
    explanation: 'ムク (muku, from the line) + バード (bird). The adolescent starling.'
  },
  'ムクホーク': {
    japanese: 'ムクホーク',
    romaji: '*Muku Hōku*',
    meaning: 'Mukku Hawk',
    explanation: 'ムク + ホーク (hawk); a fierce raptor.'
  },
  'ビッパ': {
    japanese: 'ビッパ',
    romaji: '*Bippa*',
    meaning: '(Beaver) Bippa',
    explanation: 'Coined beaver-like name with cute doubling; a simple-minded beaver.'
  },
  'ビーダル': {
    japanese: 'ビーダル',
    romaji: '*Bīdaru*',
    meaning: 'Beaver + -dal',
    explanation: 'From “beaver”; industrious dam-builder.'
  },
  'コロボーシ': {
    japanese: 'コロボーシ',
    romaji: '*Korobōshi*',
    meaning: 'Bell Cricket',
    explanation: '鈴虫 (*suzumushi*) also called *korobōshi*; a chirping cricket.'
  },
  'コロトック': {
    japanese: 'コロトック',
    romaji: '*Korotokku*',
    meaning: 'Koro-tock (chirp + tick)',
    explanation: 'Onomatopoeia blending cricket chirps and ticking; a violinist cricket.'
  },
  'コリンク': {
    japanese: 'コリンク',
    romaji: '*Korinku*',
    meaning: '(Child) + Link/Current (coinage)',
    explanation: 'Often read as 子 (*ko*, child) + “link”/“ring” sound; an electric lion cub.'
  },
  'ルクシオ': {
    japanese: 'ルクシオ',
    romaji: '*Rukushio*',
    meaning: 'Lux (light) + -io (coinage)',
    explanation: 'From Latin *lux* (light); the charged adolescent.'
  },
  'レントラー': {
    japanese: 'レントラー',
    romaji: '*Rentorā*',
    meaning: 'Röntgen (X-ray) + -ra',
    explanation: 'レントゲン (*rentogen*, X‑ray) shortened; can “see through” with x‑ray vision.'
  },
  'スボミー': {
    japanese: 'スボミー',
    romaji: '*Subomī*',
    meaning: 'Bud (Tsubomi)',
    explanation: '蕾 (*tsubomi*, bud) with sound shift; a tiny rosebud.'
  },
  'ロズレイド': {
    japanese: 'ロズレイド',
    romaji: '*Rozureido*',
    meaning: 'Rose + Raid/Blade',
    explanation: '“Rose” + “raid/blade”; a masked bouquet duelist.'
  },
  'ズガイドス': {
    japanese: 'ズガイドス',
    romaji: '*Zugaidosu*',
    meaning: 'Exposed Skull + -dos',
    explanation: '頭蓋 (*zuga i*, skull) + -ドス; a headbutting fossil.'
  },
  'ラムパルド': {
    japanese: 'ラムパルド',
    romaji: '*Ramparudo*',
    meaning: 'Rampart + -dos',
    explanation: 'From “rampart”; a thick-skulled battering fossil.'
  },
  'タテトプス': {
    japanese: 'タテトプス',
    romaji: '*Tatetopusu*',
    meaning: 'Shield + -ops',
    explanation: '盾 (*tate*, shield) + -ops (face). A shield-faced fossil.'
  },
  'トリデプス': {
    japanese: 'トリデプス',
    romaji: '*Toridepusu*',
    meaning: 'Fortress + -ops',
    explanation: '砦 (*toride*, fort) + -ops; an impregnable wall.'
  },
  'ミノムッチ': {
    japanese: 'ミノムッチ',
    romaji: '*Minomucchi*',
    meaning: 'Straw Cloak Larva',
    explanation: '蓑虫 (*minomushi*, bagworm) + -っち (cute). A cloak-wearing larva.'
  },
  'ミノマダム': {
    japanese: 'ミノマダム',
    romaji: '*Minomadamu*',
    meaning: 'Straw Cloak Madam',
    explanation: '蓑 (*mino*, straw raincoat) + “madam”; female evolution with different cloaks.'
  },
  'ガーメイル': {
    japanese: 'ガーメイル',
    romaji: '*Gāmeiru*',
    meaning: 'Moth + Male',
    explanation: '“Moth” + *male*; the male counterpart to Wormadam.'
  },
  'ミツハニー': {
    japanese: 'ミツハニー',
    romaji: '*Mitsuhanī*',
    meaning: 'Honey + Honey (JP+EN)',
    explanation: '蜜 (*mitsu*, honey) + English “honey”; a honeycomb of three.'
  },
  'ビークイン': {
    japanese: 'ビークイン',
    romaji: '*Bīkuin*',
    meaning: 'Bee Queen',
    explanation: '“Bee” + “queen”; monarch of the hive.'
  },
  'パチリス': {
    japanese: 'パチリス',
    romaji: '*Pachirisu*',
    meaning: 'Spark-Crack + Squirrel',
    explanation: 'パチパチ (*pachi‑pachi*, crackle/spark) + リス (*risu*, squirrel). An electric squirrel.'
  },
  'ブイゼル': {
    japanese: 'ブイゼル',
    romaji: '*Buizeru*',
    meaning: 'Buoy + Weasel',
    explanation: 'From “buoy” + “weasel”; sports flotation sacs.'
  },
  'フローゼル': {
    japanese: 'フローゼル',
    romaji: '*Furōzeru*',
    meaning: 'Float + Weasel',
    explanation: 'From “float” + “weasel”; a lifeguard-like otter.'
  },
  'チェリンボ': {
    japanese: 'チェリンボ',
    romaji: '*Cherinbo*',
    meaning: 'Cherry + Boy (diminutive)',
    explanation: 'From “cherry” + 坊 (*bō*, boy/child); a twin‑fruit cherry.'
  },
  'チェリム': {
    japanese: 'チェリム',
    romaji: '*Cherimu*',
    meaning: 'Cherry + Bloom',
    explanation: 'From “cherry” + “bloom”; a cherry blossom that changes with sunlight.'
  },
  'カラナクシ': {
    japanese: 'カラナクシ',
    romaji: '*Karanakushi*',
    meaning: 'Empty Shell + Sea Slug',
    explanation: '殻 (*kara*, shell) + ナメクジ (*namekuji*, slug); a coastal sea slug.'
  },
  'トリトドン': {
    japanese: 'トリトドン',
    romaji: '*Toritodon*',
    meaning: 'Triton + Don',
    explanation: 'From “triton” (sea god) + -don; a larger sea slug.'
  },
  'エテボース': {
    japanese: 'エテボース',
    romaji: '*Etebōsu*',
    meaning: 'Monkey + Boss',
    explanation: '猿 (*ete*, monkey) + “boss”; a two-tailed master monkey.'
  },
  'フワンテ': {
    japanese: 'フワンテ',
    romaji: '*Fuwante*',
    meaning: 'Fluffy Balloon',
    explanation: 'ふわふわ (*fuwa*, light/fluffy) + balloon (*ente*). A soul-carrying balloon.'
  },
  'フワライド': {
    japanese: 'フワライド',
    romaji: '*Fuwaraido*',
    meaning: 'Fluffy + Ride',
    explanation: 'From *fuwa* (floaty) + “ride”; a dirigible ghost.'
  },
  'ミミロル': {
    japanese: 'ミミロル',
    romaji: '*Mimiroru*',
    meaning: 'Ear + Roll',
    explanation: '耳 (*mimi*, ear) + ロール (roll); a bunny with rolled ears.'
  },
  'ミミロップ': {
    japanese: 'ミミロップ',
    romaji: '*Mimiroppu*',
    meaning: 'Ear + Lop',
    explanation: '耳 (*mimi*, ear) + “lop” (as in lop-eared rabbit).'
  },
  'ムウマージ': {
    japanese: 'ムウマージ',
    romaji: '*Mūmāji*',
    meaning: 'Muma + Mage',
    explanation: 'From ムウマ (Misdreavus’ JP name) + mage; a sorceress ghost.'
  },
  'ドンカラス': {
    japanese: 'ドンカラス',
    romaji: '*Donkarasu*',
    meaning: 'Boss + Crow',
    explanation: 'ドン (mafia boss) + 烏 (*karasu*, crow). A crime-boss crow.'
  },
  'ニャルマー': {
    japanese: 'ニャルマー',
    romaji: '*Nyarumā*',
    meaning: 'Meow + Allure',
    explanation: 'ニャー (meow) + “allure”; a sly, charming cat.'
  },
  'ブニャット': {
    japanese: 'ブニャット',
    romaji: '*Bunyatto*',
    meaning: 'Bu- (fat) + Meow + Cat',
    explanation: 'ブタ (pig/fat) + ニャー (meow) + -ット; a hefty, mean cat.'
  },
  'リーシャン': {
    japanese: 'リーシャン',
    romaji: '*Rīshan*',
    meaning: 'Bell Sound',
    explanation: '鈴 (*rin/rii*, bell) + 響 (*shan*, ring). A tiny bell spirit.'
  },
  'スカンプー': {
    japanese: 'スカンプー',
    romaji: '*Sukanpū*',
    meaning: 'Skunk + Poo',
    explanation: 'From “skunk” + プー (onomatopoeia for stink/fart). A stinky skunk.'
  },
  'スカタンク': {
    japanese: 'スカタンク',
    romaji: '*Sukatanku*',
    meaning: 'Skunk + Tank',
    explanation: 'From “skunk” + “tank”; a powerful, noxious skunk.'
  },
  'ドーミラー': {
    japanese: 'ドーミラー',
    romaji: '*Dōmirā*',
    meaning: 'Bronze Mirror',
    explanation: '銅 (*dō*, bronze) + 鏡 (*mirā*, mirror). Based on ancient mirrors.'
  },
  'ドータクン': {
    japanese: 'ドータクン',
    romaji: '*Dōtakun*',
    meaning: 'Bronze Bell',
    explanation: '銅鐸 (*dōtaku*, ritual bronze bell). A bell spirit.'
  },
  'ウソハチ': {
    japanese: 'ウソハチ',
    romaji: '*Usohachi*',
    meaning: 'False + Eight/Child',
    explanation: '嘘 (*uso*, lie/false) + ハチ (*hachi*, eight/child); a fake bonsai.'
  },
  'マネネ': {
    japanese: 'マネネ',
    romaji: '*Manene*',
    meaning: 'Mimic Child',
    explanation: '真似 (*mane*, mimic) + -ne (childlike). A baby mime.'
  },
  'ピンプク': {
    japanese: 'ピンプク',
    romaji: '*Pinpuku*',
    meaning: 'Pin + Puku (plump)',
    explanation: 'From “pin” (tiny) + ぷくぷく (*puku puku*, chubby). A round baby Chansey.'
  },
  'ペラップ': {
    japanese: 'ペラップ',
    romaji: '*Perappu*',
    meaning: 'Chatter + Appu',
    explanation: 'ペラペラ (*pera pera*, chatter) + parrot.'
  },
  'ミカルゲ': {
    japanese: 'ミカルゲ',
    romaji: '*Mikaruge*',
    meaning: 'Three Six Hundred (108)',
    explanation: '三百六十 (*sanbyakurokuju*) → 108; a cursed spirit bound in stone.'
  },
  'フカマル': {
    japanese: 'フカマル',
    romaji: '*Fukamaru*',
    meaning: 'Bite + Round',
    explanation: '咬む (*fukamu*, to bite) + 丸 (*maru*, round). A small land shark.'
  },
  'ガバイト': {
    japanese: 'ガバイト',
    romaji: '*Gabaito*',
    meaning: 'Gabu (chomp) + Bite',
    explanation: 'ガブガブ (*gabu gabu*, gnash/chomp) + bite. Mid dragon form.'
  },
  'ガブリアス': {
    japanese: 'ガブリアス',
    romaji: '*Gaburiasu*',
    meaning: 'Gabu (chomp) + Rias (landform)',
    explanation: 'From ガブ (chomp) + “arch”/“gorge”/“landmass.” A supersonic land shark.'
  },
  'ゴンベ': {
    japanese: 'ゴンベ',
    romaji: '*Gonbe*',
    meaning: 'Gon + Hefty/Eat',
    explanation: 'ゴン (onomatopoeia for gulp) + べ (from 食べる, eat). A gluttonous baby.'
  },
  'リオル': {
    japanese: 'リオル',
    romaji: '*Rioru*',
    meaning: 'Ri- (aura) + -oru (coined)',
    explanation: 'A coined name evoking “aura”/“hero.”'
  },
  'ルカリオ': {
    japanese: 'ルカリオ',
    romaji: '*Rukario*',
    meaning: 'Luca (light) + Ryo (flow) (coined)',
    explanation: 'Inspired by “oracle”/“aura”/“Luca.” A jackal aura fighter.'
  },
  'ヒポポタス': {
    japanese: 'ヒポポタス',
    romaji: '*Hipopotasu*',
    meaning: 'Hippopotamus',
    explanation: 'Direct katakana of hippopotamus.'
  },
  'カバルドン': {
    japanese: 'カバルドン',
    romaji: '*Kabarudon*',
    meaning: 'Hippo + -don',
    explanation: 'From hippo + -don (tooth/large creature). A sand hippo.'
  },
  'スコルピ': {
    japanese: 'スコルピ',
    romaji: '*Sukorupi*',
    meaning: 'Scorpion (katakana)',
    explanation: 'From “scorpion.”'
  },
  'ドラピオン': {
    japanese: 'ドラピオン',
    romaji: '*Dorapion*',
    meaning: 'Drap- + Scorpion',
    explanation: 'Altered from “scorpion.” A desert predator.'
  },
  'グレッグル': {
    japanese: 'グレッグル',
    romaji: '*Guregguru*',
    meaning: 'Croak + Gurgle',
    explanation: 'From “croak” + “gurgle.” A sly frog.'
  },
  'ドクロッグ': {
    japanese: 'ドクロッグ',
    romaji: '*Dokuroggu*',
    meaning: 'Toxin + Croak',
    explanation: 'From “toxic” + “croak.” A venomous frog.'
  },
  'マスキッパ': {
    japanese: 'マスキッパ',
    romaji: '*Masukippa*',
    meaning: 'Flytrap (dialect)',
    explanation: '方言 for Venus flytrap; a snapping plant.'
  },
  'ケイコウオ': {
    japanese: 'ケイコウオ',
    romaji: '*Keikōo*',
    meaning: 'Neon Fish',
    explanation: '蛍光 (*keikō*, fluorescence) + 魚 (*uo*, fish). A glowing fish.'
  },
  'ネオラント': {
    japanese: 'ネオラント',
    romaji: '*Neoranto*',
    meaning: 'Neon + Elegant',
    explanation: 'From “neon” + “elegant”; a luminous fish.'
  },
  'タマンタ': {
    japanese: 'タマンタ',
    romaji: '*Tamanta*',
    meaning: 'Tama + Manta',
    explanation: '玉 (*tama*, sphere) + manta (ray). A baby manta ray.'
  },
  'ユキカブリ': {
    japanese: 'ユキカブリ',
    romaji: '*Yukikaburi*',
    meaning: 'Snow Covered',
    explanation: '雪 (*yuki*, snow) + 被り (*kaburi*, covering). A snow-covered tree.'
  },
  'ユキノオー': {
    japanese: 'ユキノオー',
    romaji: '*Yukinoō*',
    meaning: 'Snow King',
    explanation: '雪 (*yuki*, snow) + 王 (*ō*, king). A yeti snow king.'
  },
  'マニューラ': {
    japanese: 'マニューラ',
    romaji: '*Manyūra*',
    meaning: 'Demon + Weasel',
    explanation: '魔 (*ma*, demon) + ニューラ (Sneasel’s JP name). A vicious clawed weasel.'
  },
  'ジバコイル': {
    japanese: 'ジバコイル',
    romaji: '*Jibakoiru*',
    meaning: 'Electromagnetic Coil',
    explanation: '磁場 (*jiba*, magnetic field) + coil; UFO-like magnet.'
  },
  'ベロベルト': {
    japanese: 'ベロベルト',
    romaji: '*Beroberuto*',
    meaning: 'Tongue + Belt',
    explanation: 'ベロ (bero, tongue) + ベルト (beruto, belt). A tongue-belt Pokémon.'
  },
  'ドサイドン': {
    japanese: 'ドサイドン',
    romaji: '*Dosaidon*',
    meaning: 'Huge/Rumble + Don',
    explanation: 'ドサイ (dosai, massive) + -don (dinosaur suffix). A bulky armored rhino.'
  },
  'モジャンボ': {
    japanese: 'モジャンボ',
    romaji: '*Mojanbo*',
    meaning: 'Bushy + Jumbo',
    explanation: 'もじゃもじゃ (*moja moja*, bushy) + jumbo. A tangle of vines.'
  },
  'エレキブル': {
    japanese: 'エレキブル',
    romaji: '*Erekiburu*',
    meaning: 'Electric + Ogre/Bull',
    explanation: 'エレキ (ereki, electric) + ブル (buru, bull/ogre). A power-wired beast.'
  },
  'ブーバーン': {
    japanese: 'ブーバーン',
    romaji: '*Būbān*',
    meaning: 'Boober + Burn',
    explanation: 'From Magmar’s JP name (ブーバー) + burn; a cannon-armed burner.'
  },
  'トゲキッス': {
    japanese: 'トゲキッス',
    romaji: '*Togekissu*',
    meaning: 'Spike + Kiss',
    explanation: 'From “toge” (spike, Togepi line) + kiss; a blessed jubilee bird.'
  },
  'メガヤンマ': {
    japanese: 'メガヤンマ',
    romaji: '*Megayanma*',
    meaning: 'Mega Dragonfly',
    explanation: 'From “mega” + ヤンマ (*yanma*, dragonfly). A giant dragonfly predator.'
  },
  'リーフィア': {
    japanese: 'リーフィア',
    romaji: '*Rīfia*',
    meaning: 'Leaf + -eon',
    explanation: 'From “leaf”; part of Eeveelution line.'
  },
  'グレイシア': {
    japanese: 'グレイシア',
    romaji: '*Gureishia*',
    meaning: 'Glacier + -eon',
    explanation: 'From “glacier”; an ice Eeveelution.'
  },
  'グライオン': {
    japanese: 'グライオン',
    romaji: '*Guraion*',
    meaning: 'Glide + Scorpion',
    explanation: 'From “glide” + scorpion; a bat-scorpion.'
  },
  'マンムー': {
    japanese: 'マンムー',
    romaji: '*Manmū*',
    meaning: 'Mammoth + Moo',
    explanation: 'From “mammoth”; icy shaggy boar.'
  },
  'ポリゴンＺ': {
    japanese: 'ポリゴンＺ',
    romaji: '*Porigon Zetto*',
    meaning: 'Polygon Z',
    explanation: 'From Porygon + letter Z; corrupted upgrade.'
  },
  'エルレイド': {
    japanese: 'エルレイド',
    romaji: '*Erureido*',
    meaning: 'Elegant Blade',
    explanation: 'From エル (elegant/knightly) + blade. Male Ralts evolution.'
  },
  'ダイノーズ': {
    japanese: 'ダイノーズ',
    romaji: '*Dainōzu*',
    meaning: 'Great Nose',
    explanation: '大 (*dai*, great) + nose. A magnetic guardian with nose motif.'
  },
  'ヨノワール': {
    japanese: 'ヨノワール',
    romaji: '*Yonowāru*',
    meaning: 'Night + Noir',
    explanation: '夜 (*yo*, night) + noir; grim reaper spirit.'
  },
  'ユキメノコ': {
    japanese: 'ユキメノコ',
    romaji: '*Yukimenoko*',
    meaning: 'Snow Woman (Spirit)',
    explanation: '雪女 (*yuki-onna*, snow woman ghost) + 子 (*ko*, girl). A frosty yokai.'
  },
  'ロトム': {
    japanese: 'ロトム',
    romaji: '*Rotomu*',
    meaning: 'Motor (backwards)',
    explanation: 'An anagram of “motor.” A ghost inhabiting appliances.'
  },
  'ユクシー': {
    japanese: 'ユクシー',
    romaji: '*Yukushī*',
    meaning: 'Knowledge Spirit',
    explanation: 'From “you” + “knowledge” roots; one of the lake trio.'
  },
  'エムリット': {
    japanese: 'エムリット',
    romaji: '*Emuritto*',
    meaning: 'Emotion Spirit',
    explanation: 'From “emotion”; a lake spirit.'
  },
  'アグノム': {
    japanese: 'アグノム',
    romaji: '*Agunomu*',
    meaning: 'Willpower Spirit',
    explanation: 'From “agni” (fire/will) + gnome; a lake spirit.'
  },
  'ディアルガ': {
    japanese: 'ディアルガ',
    romaji: '*Diaruga*',
    meaning: 'Diamond + -ga',
    explanation: 'From “diamond” + “ga” (fang/suffix). Time deity.'
  },
  'パルキア': {
    japanese: 'パルキア',
    romaji: '*Parukia*',
    meaning: 'Pearl + -kia',
    explanation: 'From “pearl” + coined suffix. Space deity.'
  },
  'ヒードラン': {
    japanese: 'ヒードラン',
    romaji: '*Hīdoran*',
    meaning: 'Heat + Dragon',
    explanation: 'From “heat” + “dragon”; molten magma beast.'
  },
  'レジギガス': {
    japanese: 'レジギガス',
    romaji: '*Rejigigasu*',
    meaning: 'Regi + Gigantic',
    explanation: 'Regi prefix + giga (huge). Master of the Regis.'
  },
  'ギラティナ': {
    japanese: 'ギラティナ',
    romaji: '*Giratina*',
    meaning: 'Gira (shine) + -tina',
    explanation: 'From “girasole” (sunflower, turning) or “girati” (Italian: turn) + -tina. Renegade deity.'
  },
  'クレセリア': {
    japanese: 'クレセリア',
    romaji: '*Kureseria*',
    meaning: 'Crescent + -lia',
    explanation: 'From “crescent” + -lia; lunar swan Pokémon.'
  },
  'フィオネ': {
    japanese: 'フィオネ',
    romaji: '*Fione*',
    meaning: 'Phio + -ne',
    explanation: 'Possibly from “niphon” (sea) + -ne; offspring of Manaphy.'
  },
  'マナフィ': {
    japanese: 'マナフィ',
    romaji: '*Manafi*',
    meaning: 'Mana + Fi',
    explanation: 'From “mana” (life energy) + sea feel. Guardian of the sea.'
  },
  'ダークライ': {
    japanese: 'ダークライ',
    romaji: '*Dākurai*',
    meaning: 'Dark + Rai',
    explanation: 'From “dark” + 来 (*rai*, coming) or cry. Bringer of nightmares.'
  },
  'シェイミ': {
    japanese: 'シェイミ',
    romaji: '*Sheimi*',
    meaning: 'Shay (pun) + Mini',
    explanation: 'From “shame”/“shamrock” + mini. A gratitude hedgehog.'
  },
  'アルセウス': {
    japanese: 'アルセウス',
    romaji: '*Aruseusu*',
    meaning: 'Arche + Deus',
    explanation: 'From “arch” (origin) + deus (god). The creator deity of Pokémon.'
  },
  'ビクティニ': {
    japanese: 'ビクティニ',
    romaji: '*Bikutini*',
    meaning: 'Victory + Tiny',
    explanation: 'From “victory” + diminutive; a small victory Pokémon.'
  },
  'ツタージャ': {
    japanese: 'ツタージャ',
    romaji: '*Tsutāja*',
    meaning: 'Vine + Serpent',
    explanation: '蔦 (*tsuta*, vine) + 蛇 (*ja*, snake). A smug grass snake.'
  },
  'ジャノビー': {
    japanese: 'ジャノビー',
    romaji: '*Janobī*',
    meaning: 'Snake + Noble',
    explanation: '蛇 (*ja*, snake) + noble. A refined serpent.'
  },
  'ジャローダ': {
    japanese: 'ジャローダ',
    romaji: '*Jyarōda*',
    meaning: 'Snake + Lord',
    explanation: '蛇 (*ja*, snake) + ロード (lord). Regal serpent.'
  },
  'ポカブ': {
    japanese: 'ポカブ',
    romaji: '*Pokabu*',
    meaning: 'Warmth + Piglet',
    explanation: 'ぽかぽか (*poka*, warm) + 豚 (*buta/bu*). A fire piglet.'
  },
  'チャオブー': {
    japanese: 'チャオブー',
    romaji: '*Chaobū*',
    meaning: 'Roar + Pig',
    explanation: 'チャオ (Chinese: “to fry” / roar) + ブー (oink). Fiery fighting pig.'
  },
  'エンブオー': {
    japanese: 'エンブオー',
    romaji: '*Enbuō*',
    meaning: 'Flame + Boar',
    explanation: '炎 (*en*, flame) + boar. A fire boar warrior.'
  },
  'ミジュマル': {
    japanese: 'ミジュマル',
    romaji: '*Mijumaru*',
    meaning: 'Sea Otter + Child',
    explanation: '水 (*mizu*, water) + 丸 (*maru*, child suffix). A playful otter.'
  },
  'フタチマル': {
    japanese: 'フタチマル',
    romaji: '*Futachimaru*',
    meaning: 'Two + Otter',
    explanation: '二 (*futa*, two) + 丸 (*maru*). Twin-sword otter.'
  },
  'ダイケンキ': {
    japanese: 'ダイケンキ',
    romaji: '*Daikenki*',
    meaning: 'Great + Armored Commander',
    explanation: '大 (*dai*, great) + 剣 (*ken*, sword) + 騎 (*ki*, knight). A samurai otter.'
  },
  'ミネズミ': {
    japanese: 'ミネズミ',
    romaji: '*Minezumi*',
    meaning: 'Lookout Mouse',
    explanation: '見 (*mi*, watch) + 鼠 (*nezumi*, mouse). A vigilant sentry.'
  },
  'ミルホッグ': {
    japanese: 'ミルホッグ',
    romaji: '*Miruhoggu*',
    meaning: 'See + Hog',
    explanation: '見る (*miru*, see) + hog. A watchful meerkat.'
  },
  'ヨーテリー': {
    japanese: 'ヨーテリー',
    romaji: '*Yōterī*',
    meaning: 'Yorkshire Terrier',
    explanation: 'From “Yorkshire terrier.” A loyal puppy.'
  },
  'ハーデリア': {
    japanese: 'ハーデリア',
    romaji: '*Hāderia*',
    meaning: 'Hardy Terrier',
    explanation: 'From “hardy” + terrier; a faithful guard dog.'
  },
  'ムーランド': {
    japanese: 'ムーランド',
    romaji: '*Mūrando*',
    meaning: 'Muzzle + Land',
    explanation: 'From “muzzle/mutt” + land. A noble mustached hound.'
  },
  'チョロネコ': {
    japanese: 'チョロネコ',
    romaji: '*Choroneko*',
    meaning: 'Sly Cat',
    explanation: 'ちょろい (*choroi*, sly/easy trickster) + 猫 (*neko*, cat). A mischievous cat.'
  },
  'レパルダス': {
    japanese: 'レパルダス',
    romaji: '*Reparudasu*',
    meaning: 'Leopard',
    explanation: 'From “leopard.” A sleek spotted predator.'
  },
  'ヤナップ': {
    japanese: 'ヤナップ',
    romaji: '*Yanappu*',
    meaning: 'Willow + Monkey',
    explanation: '柳 (*yanagi*, willow) + ape/monkey. Grass monkey.'
  },
  'ヤナッキー': {
    japanese: 'ヤナッキー',
    romaji: '*Yanakkī*',
    meaning: 'Willow + Monkey',
    explanation: 'Same as above with -キー for emphasis; fierce grass monkey.'
  },
  'バオップ': {
    japanese: 'バオップ',
    romaji: '*Baoppu*',
    meaning: 'Fire + Monkey',
    explanation: '爆 (*bao*, burst/fire) + monkey. Fire monkey.'
  },
  'バオッキー': {
    japanese: 'バオッキー',
    romaji: '*Baokkī*',
    meaning: 'Fire + Monkey',
    explanation: 'Same as Pansear; fiery hot monkey.'
  },
  'ヒヤップ': {
    japanese: 'ヒヤップ',
    romaji: '*Hiyappu*',
    meaning: 'Cool Water + Monkey',
    explanation: '冷やす (*hiyasu*, to cool) + monkey. Water monkey.'
  },
  'ヒヤッキー': {
    japanese: 'ヒヤッキー',
    romaji: '*Hiyakkī*',
    meaning: 'Cool Water + Monkey',
    explanation: 'Same as above, with -キー emphasis. Water monkey.'
  },
  'ムンナ': {
    japanese: 'ムンナ',
    romaji: '*Munna*',
    meaning: 'Moon + Child',
    explanation: 'From “moon” + 子 (*na*, diminutive). Dream eater piglet.'
  },
  'ムシャーナ': {
    japanese: 'ムシャーナ',
    romaji: '*Mushāna*',
    meaning: 'Sleepy + Moon',
    explanation: 'From *mushamusha* (dozing) + lunar motif. Dream tapir.'
  },
  'マメパト': {
    japanese: 'マメパト',
    romaji: '*Mamepato*',
    meaning: 'Bean + Pigeon',
    explanation: '豆 (*mame*, bean/small) + 鳩 (*hato*, pigeon). Tiny pigeon.'
  },
  'ハトーボー': {
    japanese: 'ハトーボー',
    romaji: '*Hatobō*',
    meaning: 'Pigeon + Boy',
    explanation: '鳩 (*hato*, pigeon) + 坊 (*bō*, boy). A calm dove.'
  },
  'ケンホロウ': {
    japanese: 'ケンホロウ',
    romaji: '*Kenhorō*',
    meaning: 'Fist + Pheasant',
    explanation: '拳 (*ken*, fist) + 雉 (*horō*, pheasant). A martial pheasant.'
  },
  'シママ': {
    japanese: 'シママ',
    romaji: '*Shimama*',
    meaning: 'Stripe + Horse',
    explanation: '縞 (*shima*, stripe) + 馬 (*uma*, horse). A striped foal.'
  },
  'ゼブライカ': {
    japanese: 'ゼブライカ',
    romaji: '*Zeburaika*',
    meaning: 'Zebra + Thunder',
    explanation: 'From “zebra” + 雷 (*raika*, thunder). A thunder zebra.'
  },
  'ダンゴロ': {
    japanese: 'ダンゴロ',
    romaji: '*Dangoro*',
    meaning: 'Lump + Rock',
    explanation: '団子 (*dango*, lump) + 石 (*ishi*, rock). A round rock.'
  },
  'ガントル': {
    japanese: 'ガントル',
    romaji: '*Gantoru*',
    meaning: 'Rock + Ore',
    explanation: 'From “gan” (rock) + “ore.” A crystallized boulder.'
  },
  'ギガイアス': {
    japanese: 'ギガイアス',
    romaji: '*Gigaiasu*',
    meaning: 'Giga + Earth',
    explanation: 'From “giga” (giant) + *iasu* (earth). A massive geode.'
  },
  'コロモリ': {
    japanese: 'コロモリ',
    romaji: '*Koromori*',
    meaning: 'Cloth + Bat',
    explanation: '衣 (*koromo*, cloth) + 蝙蝠 (*komori*, bat). A fuzzy bat.'
  },
  'ココロモリ': {
    japanese: 'ココロモリ',
    romaji: '*Kokoromori*',
    meaning: 'Heart + Bat',
    explanation: '心 (*kokoro*, heart) + bat. A heart-nosed bat.'
  },
  'モグリュー': {
    japanese: 'モグリュー',
    romaji: '*Moguryū*',
    meaning: 'Mole + Claw',
    explanation: '土竜 (*mogura*, mole) + dragon/claw (*ryū*). A digging mole.'
  },
  'ドリュウズ': {
    japanese: 'ドリュウズ',
    romaji: '*Doryūzu*',
    meaning: 'Drill + Mole',
    explanation: 'ドリル (drill) + 土竜 (*mogura*, mole). A steel mole with drills.'
  },
  'タブンネ': {
    japanese: 'タブンネ',
    romaji: '*Tabunne*',
    meaning: '“Maybe” (pun)',
    explanation: '多分ね (*tabun ne*, “maybe”). A kindly, hearing healer.'
  },
  'ドッコラー': {
    japanese: 'ドッコラー',
    romaji: '*Dokkōrā*',
    meaning: 'Carrying Timber',
    explanation: '独鈷 (*dokko*, Buddhist tool) / ドッコイ (heave-ho) + timber. A worker Pokémon.'
  },
  'ドテッコツ': {
    japanese: 'ドテッコツ',
    romaji: '*Dotekkotsu*',
    meaning: 'Iron Beam Carrier',
    explanation: '鉄骨 (*tekkotsu*, iron beam) with prefix. A construction Pokémon.'
  },
  'ローブシン': {
    japanese: 'ローブシン',
    romaji: '*Rōbushin*',
    meaning: 'Old Master + Muscles',
    explanation: '老 (*rō*, old) + 武神 (*bushin*, war god). A muscular elder.'
  },
  'オタマロ': {
    japanese: 'オタマロ',
    romaji: '*Otamaro*',
    meaning: 'Tadpole',
    explanation: 'おたまじゃくし (*otamajakushi*, tadpole). A singing tadpole.'
  },
  'ガマガル': {
    japanese: 'ガマガル',
    romaji: '*Gamagaru*',
    meaning: 'Toad + Croak',
    explanation: '蝦蟇 (*gama*, toad) + がる (croak). A warty toad.'
  },
  'ガマゲロゲ': {
    japanese: 'ガマゲロゲ',
    romaji: '*Gamageroge*',
    meaning: 'Toad + Croak',
    explanation: 'がま (toad) + ゲロゲロ (ribbit croak). A vibrating toad.'
  },
  'ナゲキ': {
    japanese: 'ナゲキ',
    romaji: '*Nageki*',
    meaning: 'Throw',
    explanation: '投げ (*nage*, throw). A red judo thrower.'
  },
  'ダゲキ': {
    japanese: 'ダゲキ',
    romaji: '*Dageki*',
    meaning: 'Strike',
    explanation: '打撃 (*dageki*, strike). A blue karate striker.'
  },
  'クルミル': {
    japanese: 'クルミル',
    romaji: '*Kurumiru*',
    meaning: 'Wrap + Bug',
    explanation: '包む (*kurumu*, wrap) + 虫 (*mushi*, bug). A leaf-wrapped larva.'
  },
  'クルマユ': {
    japanese: 'クルマユ',
    romaji: '*Kurumayu*',
    meaning: 'Wrap + Cocoon',
    explanation: '包む (*kurumu*, wrap) + 繭 (*mayu*, cocoon). A cloaked cocoon bug.'
  },
  'ハハコモリ': {
    japanese: 'ハハコモリ',
    romaji: '*Hahakomori*',
    meaning: 'Parent + Mantis',
    explanation: '母 (*haha*, mother) + 蟷螂 (*kamakiri*). A nurturing mantis.'
  },
  'フシデ': {
    japanese: 'フシデ',
    romaji: '*Fushide*',
    meaning: 'Millipede',
    explanation: '節 (*fushi*, segment/joint) + millepede. A small centipede.'
  },
  'ホイーガ': {
    japanese: 'ホイーガ',
    romaji: '*Hoīga*',
    meaning: 'Wheel + Bug',
    explanation: 'From “wheel” + bug. A rolling cocoon bug.'
  },
  'ペンドラー': {
    japanese: 'ペンドラー',
    romaji: '*Pendorā*',
    meaning: 'Centipede',
    explanation: 'From “centipede.” A huge centipede predator.'
  },
  'モンメン': {
    japanese: 'モンメン',
    romaji: '*Monmen*',
    meaning: 'Cotton Plant',
    explanation: '綿 (*men*, cotton) + 蒙綿 (monmen, cotton). A cotton fluff.'
  },
  'エルフーン': {
    japanese: 'エルフーン',
    romaji: '*Erufūn*',
    meaning: 'Elf + Fluff',
    explanation: 'From “elf” + ふんわり (*funwari*, fluffy). A mischievous fluff.'
  },
  'チュリネ': {
    japanese: 'チュリネ',
    romaji: '*Churine*',
    meaning: 'Tulip + Root',
    explanation: 'From “tulip” + 根 (*ne*, root). A tulip bulb.'
  },
  'ドレディア': {
    japanese: 'ドレディア',
    romaji: '*Doredia*',
    meaning: 'Dress + Lady',
    explanation: 'From “dress” + lady. A dancing noble flower.'
  },
  'バスラオ': {
    japanese: 'バスラオ',
    romaji: '*Basurao*',
    meaning: 'Bass + Violent',
    explanation: 'From “bass” + 荒い (*arai*, rough/violent). An aggressive fish.'
  },
  'メグロコ': {
    japanese: 'メグロコ',
    romaji: '*Meguroko*',
    meaning: 'Eye + Croc',
    explanation: '目黒 (*meguro*, black eyes) + crocodile. A desert croc.'
  },
  'ワルビル': {
    japanese: 'ワルビル',
    romaji: '*Warubiru*',
    meaning: 'Bad + Croc',
    explanation: '悪 (*warui*, bad) + crocodile. A bandit croc.'
  },
  'ワルビアル': {
    japanese: 'ワルビアル',
    romaji: '*Warubiaru*',
    meaning: 'Bad + Croc',
    explanation: '悪 (*warui*, bad) + crocodile. A gangster croc.'
  },
  'ダルマッカ': {
    japanese: 'ダルマッカ',
    romaji: '*Darumakka*',
    meaning: 'Daruma Doll + Small',
    explanation: '達磨 (*daruma*, traditional doll) + -ッカ (cute diminutive). A fiery daruma doll.'
  },
  'ヒヒダルマ': {
    japanese: 'ヒヒダルマ',
    romaji: '*Hihidaruma*',
    meaning: 'Baboon + Daruma Doll',
    explanation: 'ヒヒ (hihi, baboon) + 達磨 (*daruma*, doll). A fiery daruma baboon.'
  },
  'マラカッチ': {
    japanese: 'マラカッチ',
    romaji: '*Marakacchi*',
    meaning: 'Maracas + Cactus',
    explanation: 'From “maracas” + cactus. A dancing cactus.'
  },
  'イシズマイ': {
    japanese: 'イシズマイ',
    romaji: '*Ishizumai*',
    meaning: 'Rock Dweller',
    explanation: '石住まい (*ishi-zumai*, rock dweller). A hermit crab with a rock shell.'
  },
  'イワパレス': {
    japanese: 'イワパレス',
    romaji: '*Iwaparesu*',
    meaning: 'Rock + Palace',
    explanation: '岩 (*iwa*, rock) + “palace.” A giant rock-carrying crab.'
  },
  'ズルッグ': {
    japanese: 'ズルッグ',
    romaji: '*Zuruggu*',
    meaning: 'Slouch + Pull Down',
    explanation: 'ずるい (*zurui*, sly/slouchy) + gurgle. A pants-drooping lizard.'
  },
  'ズルズキン': {
    japanese: 'ズルズキン',
    romaji: '*Zuruzukin*',
    meaning: 'Sly + Hood',
    explanation: 'From ずる (*zuru*, sly) + 頭巾 (*zukin*, hood). A gangster lizard.'
  },
  'シンボラー': {
    japanese: 'シンボラー',
    romaji: '*Shinborā*',
    meaning: 'Symbol',
    explanation: 'From “symbol”; patterned after Nazca lines.'
  },
  'デスマス': {
    japanese: 'デスマス',
    romaji: '*Desumasu*',
    meaning: 'Death + Mask',
    explanation: 'From “death” + mask. A spirit with its mask.'
  },
  'デスカーン': {
    japanese: 'デスカーン',
    romaji: '*Desukān*',
    meaning: 'Death + Sarcophagus',
    explanation: 'From “death” + sarcophagus. A coffin ghost.'
  },
  'プロトーガ': {
    japanese: 'プロトーガ',
    romaji: '*Purotōga*',
    meaning: 'Proto + Turtle',
    explanation: 'From “prototype/proto” + turtle. An ancient turtle.'
  },
  'アバゴーラ': {
    japanese: 'アバゴーラ',
    romaji: '*Abagōra*',
    meaning: 'Ancient + Tortoise',
    explanation: 'Possibly from アバ (aba, archaic) + tortoise. A fossil turtle.'
  },
  'アーケン': {
    japanese: 'アーケン',
    romaji: '*Āken*',
    meaning: 'Archaeopteryx',
    explanation: 'From “archaeo-” + -en. A fossil bird.'
  },
  'アーケオス': {
    japanese: 'アーケオス',
    romaji: '*Ākeosu*',
    meaning: 'Archaeopteryx',
    explanation: 'From “archaeo-” + ops. A prehistoric bird.'
  },
  'ヤブクロン': {
    japanese: 'ヤブクロン',
    romaji: '*Yabukuron*',
    meaning: 'Garbage Bag',
    explanation: '袋 (*fukuro*, bag) + trash. A garbage bag Pokémon.'
  },
  'ダストダス': {
    japanese: 'ダストダス',
    romaji: '*Dasutodasu*',
    meaning: 'Dust + Overflow',
    explanation: 'From “dust” + 出す (*dasu*, to emit). A trash heap.'
  },
  'ゾロア': {
    japanese: 'ゾロア',
    romaji: '*Zoroa*',
    meaning: 'Fox Cub',
    explanation: 'From “zorro” (fox in Spanish). A trickster fox.'
  },
  'ゾロアーク': {
    japanese: 'ゾロアーク',
    romaji: '*Zoroāku*',
    meaning: 'Fox + Arch',
    explanation: 'From “zorro” + arc/arch. An illusion fox.'
  },
  'チラーミィ': {
    japanese: 'チラーミィ',
    romaji: '*Chirāmī*',
    meaning: 'Flicker + Cute',
    explanation: 'ちらちら (*chira*, flicker) + ミィ (cute squeak). A tidy chinchilla.'
  },
  'チラチーノ': {
    japanese: 'チラチーノ',
    romaji: '*Chirachīno*',
    meaning: 'Flicker + Chinchilla',
    explanation: 'From *chira* (flicker) + chinchilla. An elegant chinchilla.'
  },
  'ゴチム': {
    japanese: 'ゴチム',
    romaji: '*Gochimu*',
    meaning: 'Gothic + Child',
    explanation: 'From “gothic” + child suffix. A gothic doll.'
  },
  'ゴチミル': {
    japanese: 'ゴチミル',
    romaji: '*Gochimiru*',
    meaning: 'Gothic + Middle',
    explanation: 'From “gothic” + ミル (mil, middle). A gothic teen.'
  },
  'ゴチルゼル': {
    japanese: 'ゴチルゼル',
    romaji: '*Gochiruzeru*',
    meaning: 'Gothic + Mademoiselle',
    explanation: 'From “gothic” + mademoiselle. A gothic lady.'
  },
  'ユニラン': {
    japanese: 'ユニラン',
    romaji: '*Yuniran*',
    meaning: 'Uni-cell',
    explanation: 'From “unicellular.” A single-cell Pokémon.'
  },
  'ダブラン': {
    japanese: 'ダブラン',
    romaji: '*Daburan*',
    meaning: 'Double Cell',
    explanation: 'From “double” + cell. A split-cell Pokémon.'
  },
  'ランクルス': {
    japanese: 'ランクルス',
    romaji: '*Rankurusu*',
    meaning: 'Homunculus',
    explanation: 'From “homunculus.” A cell colony psychic.'
  },
  'コアルヒー': {
    japanese: 'コアルヒー',
    romaji: '*Koaruhī*',
    meaning: 'Small + Duck',
    explanation: '子 (*ko*, child) + アヒル (*ahiru*, duck). A duckling.'
  },
  'スワンナ': {
    japanese: 'スワンナ',
    romaji: '*Suwanna*',
    meaning: 'Swan',
    explanation: 'From “swan.” A graceful swan dancer.'
  },
  'バニプッチ': {
    japanese: 'バニプッチ',
    romaji: '*Baniputchi*',
    meaning: 'Vanilla + Tiny',
    explanation: 'From “vanilla” + small suffix. An ice cream cone.'
  },
  'バニリッチ': {
    japanese: 'バニリッチ',
    romaji: '*Baniritchi*',
    meaning: 'Vanilla + Rich',
    explanation: 'From “vanilla” + rich. A bigger ice cream cone.'
  },
  'バイバニラ': {
    japanese: 'バイバニラ',
    romaji: '*Baibanira*',
    meaning: 'Double Vanilla',
    explanation: 'From “bye-bye vanilla.” A twin ice cream cone.'
  },
  'シキジカ': {
    japanese: 'シキジカ',
    romaji: '*Shikijika*',
    meaning: 'Deer + Fawn',
    explanation: '鹿 (*shika*, deer) + 子 (*jika/ko*, child). A seasonal deer.'
  },
  'メブキジカ': {
    japanese: 'メブキジカ',
    romaji: '*Mebukijika*',
    meaning: 'Budding Deer',
    explanation: '芽吹き (*mebuki*, budding) + 鹿 (*shika*, deer). A seasonal stag.'
  },
  'エモンガ': {
    japanese: 'エモンガ',
    romaji: '*Emonga*',
    meaning: 'Electric + Flying Squirrel',
    explanation: 'From “electric” + モモンガ (*momonga*, flying squirrel).'
  },
  'カブルモ': {
    japanese: 'カブルモ',
    romaji: '*Kaburumo*',
    meaning: 'Headbutt Bug',
    explanation: '頭突き (*kaburi*, headbutt) + 虫 (*mushi*, bug). A charging bug.'
  },
  'シュバルゴ': {
    japanese: 'シュバルゴ',
    romaji: '*Shubarugo*',
    meaning: 'Chevalier (Knight)',
    explanation: 'From French “chevalier” (knight). A lance-armored bug.'
  },
  'タマゲタケ': {
    japanese: 'タマゲタケ',
    romaji: '*Tamage-take*',
    meaning: 'Surprising Mushroom',
    explanation: '驚く (*tamage*, to be surprised) +茸 (*take*, mushroom). A mushroom mimic.'
  },
  'モロバレル': {
    japanese: 'モロバレル',
    romaji: '*Morobareru*',
    meaning: 'Exposed Mushroom',
    explanation: 'ばれる (*bareru*, exposed) + mushroom. A mushroom with Pokéball caps.'
  },
  'プルリル': {
    japanese: 'プルリル',
    romaji: '*Pururiru*',
    meaning: 'Prune + Rill',
    explanation: 'From “prune” + rill. A jellyfish.'
  },
  'ブルンゲル': {
    japanese: 'ブルンゲル',
    romaji: '*Burungeru*',
    meaning: 'Balloon + Gel',
    explanation: 'From “balloon” + gel. A jellyfish monarch.'
  },
  'ママンボウ': {
    japanese: 'ママンボウ',
    romaji: '*Mamanbō*',
    meaning: 'Mama + Sunfish',
    explanation: 'ママ (mama) + 翻車魚 (*manbō*, ocean sunfish). A motherly healer.'
  },
  'バチュル': {
    japanese: 'バチュル',
    romaji: '*Bachuru*',
    meaning: 'Spark Bug',
    explanation: 'バチバチ (*bachibachi*, crackle) + bug. A tiny electric spider.'
  },
  'デンチュラ': {
    japanese: 'デンチュラ',
    romaji: '*Denchura*',
    meaning: 'Electric + Tarantula',
    explanation: '電 (*den*, electric) + tarantula. A large spider.'
  },
  'テッシード': {
    japanese: 'テッシード',
    romaji: '*Tesshīdo*',
    meaning: 'Iron + Seed',
    explanation: '鉄 (*tetsu*, iron) + seed. A spiky seed.'
  },
  'ナットレイ': {
    japanese: 'ナットレイ',
    romaji: '*Nattorei*',
    meaning: 'Nut + Thorn',
    explanation: 'From “nut” + thorn. A spiky vine ball.'
  },
  'ギアル': {
    japanese: 'ギアル',
    romaji: '*Giaru*',
    meaning: 'Gear',
    explanation: 'From “gear.” A gear Pokémon.'
  },
  'ギギアル': {
    japanese: 'ギギアル',
    romaji: '*Gigiaru*',
    meaning: 'Gears',
    explanation: 'Reduplication of gear. A pair of gears.'
  },
  'ギギギアル': {
    japanese: 'ギギギアル',
    romaji: '*Gigigiaru*',
    meaning: 'Triple Gear',
    explanation: 'From “gear” repeated thrice. A full gear system.'
  },
  'シビシラス': {
    japanese: 'シビシラス',
    romaji: '*Shibishirasu*',
    meaning: 'Numbing Whitebait',
    explanation: '痺れ (*shibire*, numb) + シラス (*shirasu*, whitebait fish). A tiny electric eel.'
  },
  'シビビール': {
    japanese: 'シビビール',
    romaji: '*Shibibīru*',
    meaning: 'Numbing Eel',
    explanation: '痺れ (*shibire*, numb) + “eel.” A mid-stage eel.'
  },
  'シビルドン': {
    japanese: 'シビルドン',
    romaji: '*Shibirudon*',
    meaning: 'Numbing Dragon/Eel',
    explanation: '痺れ (*shibire*) + “don” (large/dragon suffix). A final eel predator.'
  },
  'リグレー': {
    japanese: 'リグレー',
    romaji: '*Riguree*',
    meaning: 'Grey (Alien)',
    explanation: 'From “little grey,” a common alien depiction.'
  },
  'オーベム': {
    japanese: 'オーベム',
    romaji: '*Ōbemu*',
    meaning: 'UFO/Alien Code',
    explanation: 'From “OBE” (close encounter code) or UFO slang. A classic alien.'
  },
  'ヒトモシ': {
    japanese: 'ヒトモシ',
    romaji: '*Hitomoshi*',
    meaning: 'Human Candle',
    explanation: '火 (*hi*, fire) + 灯 (*tomoshi*, lamp). A candle with a spirit flame.'
  },
  'ランプラー': {
    japanese: 'ランプラー',
    romaji: '*Ranpurā*',
    meaning: 'Lamp',
    explanation: 'From “lamp.” A ghostly street lamp.'
  },
  'シャンデラ': {
    japanese: 'シャンデラ',
    romaji: '*Shandera*',
    meaning: 'Chandelier',
    explanation: 'From “chandelier.” A ghostly chandelier.'
  },
  'キバゴ': {
    japanese: 'キバゴ',
    romaji: '*Kibago*',
    meaning: 'Fang Kid',
    explanation: '牙 (*kiba*, fang) + 子 (*ko/go*, child). A tusked child dragon.'
  },
  'オノンド': {
    japanese: 'オノンド',
    romaji: '*Onondo*',
    meaning: 'Axe + (Beast)',
    explanation: '斧 (*ono*, axe) + sound suffix. A tusked axe dragon.'
  },
  'オノノクス': {
    japanese: 'オノノクス',
    romaji: '*Ononokusu*',
    meaning: 'Axe + Noxious/Beast',
    explanation: '斧 (*ono*, axe) + “noxious/ferocious.” A powerful axe dragon.'
  },
  'クマシュン': {
    japanese: 'クマシュン',
    romaji: '*Kumashun*',
    meaning: 'Bear + Achoo',
    explanation: '熊 (*kuma*, bear) + “achoo” sneeze. A sniffly bear cub.'
  },
  'ツンベアー': {
    japanese: 'ツンベアー',
    romaji: '*Tsunberā*',
    meaning: 'Tsun (Icy) + Bear',
    explanation: 'From “tsun” (cold) + bear. A fierce polar bear.'
  },
  'フリージオ': {
    japanese: 'フリージオ',
    romaji: '*Furījio*',
    meaning: 'Freeze + Geo',
    explanation: 'From “freeze” + “geo.” An ice crystal.'
  },
  'チョボマキ': {
    japanese: 'チョボマキ',
    romaji: '*Chobomaki*',
    meaning: 'Small Wrapper',
    explanation: 'ちょぼ (*chobo*, small) + 巻き (*maki*, roll/wrap). A wrapped clam bug.'
  },
  'アギルダー': {
    japanese: 'アギルダー',
    romaji: '*Agirudā*',
    meaning: 'Agile + Soldier',
    explanation: 'From “agile” + soldier. A ninja-like bug.'
  },
  'マッギョ': {
    japanese: 'マッギョ',
    romaji: '*Maggyo*',
    meaning: 'Mud Flat Fish',
    explanation: '真っ平 (*mappira*, flat) + 魚 (*gyo*, fish). A flat fish.'
  },
  'コジョフー': {
    japanese: 'コジョフー',
    romaji: '*Kojofū*',
    meaning: 'Small + Martial Arts',
    explanation: '小 (*ko*, small) + 拳法 (*kenpō*). A martial arts weasel.'
  },
  'コジョンド': {
    japanese: 'コジョンド',
    romaji: '*Kojondo*',
    meaning: 'Small + Master',
    explanation: '小 (*ko*) + 拳道 (*kendō*) + “don.” A martial master weasel.'
  },
  'クリムガン': {
    japanese: 'クリムガン',
    romaji: '*Kurimugan*',
    meaning: 'Crimson + Face',
    explanation: 'Crimson-colored dragon with a rocky face.'
  },
  'ゴビット': {
    japanese: 'ゴビット',
    romaji: '*Gobitto*',
    meaning: 'Goblin + Bit',
    explanation: 'From “golem” + bit. A small automaton.'
  },
  'ゴルーグ': {
    japanese: 'ゴルーグ',
    romaji: '*Gorūgu*',
    meaning: 'Golem + Gargantuan',
    explanation: 'From “golem” + huge/rogue. A guardian automaton.'
  },
  'コマタナ': {
    japanese: 'コマタナ',
    romaji: '*Komatana*',
    meaning: 'Small Blade',
    explanation: '小 (*ko*, small) + 刀 (*katana*, sword). A small bladed pawn.'
  },
  'キリキザン': {
    japanese: 'キリキザン',
    romaji: '*Kirikizan*',
    meaning: 'Slash + Cruel',
    explanation: '切り刻む (*kirikizamu*, to slash up). A bladed bishop warrior.'
  },
  'バッフロン': {
    japanese: 'バッフロン',
    romaji: '*Baffuron*',
    meaning: 'Buffalo + Fluff',
    explanation: 'From “buffalo” + “afro.” An afro buffalo.'
  },
  'ワシボン': {
    japanese: 'ワシボン',
    romaji: '*Washibon*',
    meaning: 'Eagle + Young',
    explanation: '鷲 (*washi*, eagle) + 坊 (*bon*, boy). A young eagle.'
  },
  'ウォーグル': {
    japanese: 'ウォーグル',
    romaji: '*Wōguru*',
    meaning: 'War + Eagle',
    explanation: 'From “war” + eagle. A patriotic eagle.'
  },
  'バルチャイ': {
    japanese: 'バルチャイ',
    romaji: '*Baruchai*',
    meaning: 'Vulture + Child',
    explanation: 'From “vulture” + child. A vulture chick.'
  },
  'バルジーナ': {
    japanese: 'バルジーナ',
    romaji: '*Barujīna*',
    meaning: 'Vulture + Gina',
    explanation: 'From “vulture” + feminine suffix. A matriarchal vulture.'
  },
  'クイタラン': {
    japanese: 'クイタラン',
    romaji: '*Kuitaran*',
    meaning: 'Eat + Anteater',
    explanation: '食う (*kuu*, eat) + anteater. A fire anteater.'
  },
  'アイアント': {
    japanese: 'アイアント',
    romaji: '*Aianto*',
    meaning: 'Iron + Ant',
    explanation: 'From “iron” + ant. A steel ant.'
  },
  'モノズ': {
    japanese: 'モノズ',
    romaji: '*Monozu*',
    meaning: 'One + Head',
    explanation: '“Mono” (one) + Kopf/zu (head). A single-headed dragon.'
  },
  'ジヘッド': {
    japanese: 'ジヘッド',
    romaji: '*Jiheddo*',
    meaning: 'Two + Head',
    explanation: '“Zwei” (two in German) + head. A two-headed dragon.'
  },
  'サザンドラ': {
    japanese: 'サザンドラ',
    romaji: '*Sazandora*',
    meaning: 'Three + Dragon',
    explanation: 'Drei (three in German) + dragon. A three-headed hydra dragon.'
  },
  'メラルバ': {
    japanese: 'メラルバ',
    romaji: '*Meraruba*',
    meaning: 'Blaze + Larva',
    explanation: 'From “mela” (blaze) + larva. A fiery bug.'
  },
  'ウルガモス': {
    japanese: 'ウルガモス',
    romaji: '*Urugamosu*',
    meaning: 'Ulug + Moth',
    explanation: 'From “Uru” (to burn) + moth. A sun moth.'
  },
  'コバルオン': {
    japanese: 'コバルオン',
    romaji: '*Kobaruon*',
    meaning: 'Cobalt + Lion',
    explanation: 'From “cobalt” + lion. One of the Musketeer trio.'
  },
  'テラキオン': {
    japanese: 'テラキオン',
    romaji: '*Terakion*',
    meaning: 'Terra + Lion',
    explanation: 'From “terra” (earth) + lion. A musketeer beast.'
  },
  'ビリジオン': {
    japanese: 'ビリジオン',
    romaji: '*Birijion*',
    meaning: 'Viridian + Lion',
    explanation: 'From “viridian” (green) + lion. A musketeer beast.'
  },
  'トルネロス': {
    japanese: 'トルネロス',
    romaji: '*Torunerosu*',
    meaning: 'Tornado',
    explanation: 'From “tornado.” A storm genie.'
  },
  'ボルトロス': {
    japanese: 'ボルトロス',
    romaji: '*Borutorosu*',
    meaning: 'Bolt',
    explanation: 'From “bolt.” A lightning genie.'
  },
  'レシラム': {
    japanese: 'レシラム',
    romaji: '*Reshiramu*',
    meaning: 'White Dragon (Reshi)',
    explanation: 'From 白 (*shiro*, white) rearranged. A yin-yang dragon.'
  },
  'ゼクロム': {
    japanese: 'ゼクロム',
    romaji: '*Zekuromu*',
    meaning: 'Black Dragon (Kuro)',
    explanation: 'From 黒 (*kuro*, black) rearranged. A yin-yang dragon.'
  },
  'ランドロス': {
    japanese: 'ランドロス',
    romaji: '*Randorosu*',
    meaning: 'Land',
    explanation: 'From “land.” A fertility genie.'
  },
  'キュレム': {
    japanese: 'キュレム',
    romaji: '*Kyuremu*',
    meaning: 'Cold',
    explanation: 'From 凍る (*kyūru/kyōre*, to freeze). An icy dragon.'
  },
  'ケルディオ': {
    japanese: 'ケルディオ',
    romaji: '*Kerudeio*',
    meaning: 'Colt + Deo',
    explanation: 'From “colt” + Latin deo (god). A young musketeer horse.'
  },
  'メロエッタ': {
    japanese: 'メロエッタ',
    romaji: '*Meroetta*',
    meaning: 'Melody',
    explanation: 'From “melody.” A singing musical fairy.'
  },
  'ゲノセクト': {
    japanese: 'ゲノセクト',
    romaji: '*Genosekuto*',
    meaning: 'Gene + Insect',
    explanation: 'From “gene” + insect. A cybernetic bug revived by Team Plasma.'
  },
  'ハリマロン': {
    japanese: 'ハリマロン',
    romaji: '*Harimaron*',
    meaning: 'Needle + Chestnut',
    explanation: '針 (*hari*, needle) + マロン (*maron*, chestnut). A spiny chestnut Pokémon.'
  },
  'ハリボーグ': {
    japanese: 'ハリボーグ',
    romaji: '*Haribōgu*',
    meaning: 'Needle + Bulge/Bog',
    explanation: '針 (*hari*, needle) + 防具 (*bōgu*, armor). A bulky armored chestnut.'
  },
  'ブリガロン': {
    japanese: 'ブリガロン',
    romaji: '*Burigaron*',
    meaning: 'Bulwark + Chestnut',
    explanation: 'From “brigand/bulwark” + marron. A knightly chestnut warrior.'
  },
  'フォッコ': {
    japanese: 'フォッコ',
    romaji: '*Fokko*',
    meaning: 'Fox + Fire',
    explanation: 'From “fox” + 火 (*hi*, fire). A fennec fox with fire powers.'
  },
  'テールナー': {
    japanese: 'テールナー',
    romaji: '*Tērunā*',
    meaning: 'Tail + Fire',
    explanation: '“Tail” + 火 (*nā*, from burner). A fox magician with wand-like tail.'
  },
  'マフォクシー': {
    japanese: 'マフォクシー',
    romaji: '*Mafokushī*',
    meaning: 'Magic + Fox',
    explanation: '魔法 (*mahō*, magic) + “fox.” A mystical mage fox.'
  },
  'ケロマツ': {
    japanese: 'ケロマツ',
    romaji: '*Keromatsu*',
    meaning: 'Croak + Foam',
    explanation: 'ケロケロ (*kero*, frog croak) + 沫 (*matsu*, bubbles/foam). A froggy ninja.'
  },
  'ゲコガシラ': {
    japanese: 'ゲコガシラ',
    romaji: '*Gekogashira*',
    meaning: 'Croak + Head/High',
    explanation: 'ゲコゲコ (*geko*, croak) + 頭 (*gashira*, head). A nimble frog.'
  },
  'ゲッコウガ': {
    japanese: 'ゲッコウガ',
    romaji: '*Gekkōga*',
    meaning: 'Moonlight + Ninja',
    explanation: '月光 (*gekkō*, moonlight) + 忍者 (*ninja*). A stealthy ninja frog.'
  },
  'ホルビー': {
    japanese: 'ホルビー',
    romaji: '*Horubī*',
    meaning: 'Dig + Bunny',
    explanation: '掘る (*horu*, to dig) + “bunny.” A digging rabbit.'
  },
  'ホルード': {
    japanese: 'ホルード',
    romaji: '*Horūdo*',
    meaning: 'Dig + Lord',
    explanation: '掘る (*horu*, dig) + “lord.” A burly rabbit with shovel ears.'
  },
  'ヤヤコマ': {
    japanese: 'ヤヤコマ',
    romaji: '*Yayakoma*',
    meaning: 'Tiny Sparrow',
    explanation: 'Small bird motif; “koma” often used for sparrows. A tiny robin.'
  },
  'ヒノヤコマ': {
    japanese: 'ヒノヤコマ',
    romaji: '*Hinoyakoma*',
    meaning: 'Fire + Sparrow',
    explanation: '火の (*hi no*, fire) + “yakoma.” A fiery mid-stage robin.'
  },
  'ファイアロー': {
    japanese: 'ファイアロー',
    romaji: '*Faiarō*',
    meaning: 'Fire + Arrow',
    explanation: 'From “fire” + “arrow.” A blazing falcon.'
  },
  'コフキムシ': {
    japanese: 'コフキムシ',
    romaji: '*Kofukimushi*',
    meaning: 'Powdered Insect',
    explanation: '粉吹き (*kofuki*, powder-sprinkling) + 虫 (*mushi*, bug). A powder bug.'
  },
  'コフーライ': {
    japanese: 'コフーライ',
    romaji: '*Kofūrai*',
    meaning: 'Powder Cocoon',
    explanation: '粉 (*ko*) + 風来 (*fūrai*, wanderer). A wandering cocoon bug.'
  },
  'ビビヨン': {
    japanese: 'ビビヨン',
    romaji: '*Bibiyon*',
    meaning: 'Vivid + Papillon',
    explanation: 'From “vivid” + “papillon” (French for butterfly). A patterned butterfly.'
  },
  'シシコ': {
    japanese: 'シシコ',
    romaji: '*Shishiko*',
    meaning: 'Lion Cub',
    explanation: '獅子 (*shishi*, lion) + 子 (*ko*, child). A little lion cub.'
  },
  'カエンジシ': {
    japanese: 'カエンジシ',
    romaji: '*Kaenjishi*',
    meaning: 'Flame Lion',
    explanation: '火炎 (*kaen*, flame) + 獅子 (*jishi*, lion). A fiery lion.'
  },
  'フラベベ': {
    japanese: 'フラベベ',
    romaji: '*Furabebe*',
    meaning: 'Flower + Baby',
    explanation: 'From “flower” + “bébé” (French for baby). A fairy flower child.'
  },
  'フラエッテ': {
    japanese: 'フラエッテ',
    romaji: '*Furaette*',
    meaning: 'Flower + Été (summer)',
    explanation: 'From “flower” + French “été.” A dancing fairy with a flower.'
  },
  'フラージェス': {
    japanese: 'フラージェス',
    romaji: '*Furājesu*',
    meaning: 'Flower + Gorgeous',
    explanation: 'From “flower” + “gorgeous.” A floral fairy queen.'
  },
  'メェークル': {
    japanese: 'メェークル',
    romaji: '*Mēkuru*',
    meaning: 'Bleat + Turn',
    explanation: 'めぇ (*mee*, goat bleat) + 来る (*kuru*, to come). A rideable goat kid.'
  },
  'ゴーゴート': {
    japanese: 'ゴーゴート',
    romaji: '*Gōgōto*',
    meaning: 'Go + Goat',
    explanation: 'From “go” (movement) + “goat.” A large rideable goat.'
  },
  'ヤンチャム': {
    japanese: 'ヤンチャム',
    romaji: '*Yanchamu*',
    meaning: 'Mischievous + Panda',
    explanation: 'やんちゃ (*yancha*, mischievous) + panda. A playful panda cub.'
  },
  'ゴロンダ': {
    japanese: 'ゴロンダ',
    romaji: '*Goronda*',
    meaning: 'Roar + Panda',
    explanation: 'ゴロ (goro, roar) + panda. A fighting panda boss.'
  },
  'トリミアン': {
    japanese: 'トリミアン',
    romaji: '*Torimian*',
    meaning: 'Trim + Dog',
    explanation: 'From “trim” + dog. A poodle with customizable coats.'
  },
  'ニャスパー': {
    japanese: 'ニャスパー',
    romaji: '*Nyasupā*',
    meaning: 'Meow + Esper',
    explanation: 'ニャー (*nya*, meow) + “esper.” A psychic kitten.'
  },
  'ニャオニクス': {
    japanese: 'ニャオニクス',
    romaji: '*Nyaonikusu*',
    meaning: 'Meow + Onyx/Psychic',
    explanation: 'ニャー (*nya*, meow) + onyx/psychic suffix. A mystical feline.'
  },
  'ヒトツキ': {
    japanese: 'ヒトツキ',
    romaji: '*Hitotsuki*',
    meaning: 'One + Thrust',
    explanation: '一突き (*hitotsuki*, one thrust). A haunted sword.'
  },
  'ニダンギル': {
    japanese: 'ニダンギル',
    romaji: '*Nidangiru*',
    meaning: 'Two + Slash',
    explanation: '二段斬る (*nidangiru*, two-stage slash). Twin haunted swords.'
  },
  'ギルガルド': {
    japanese: 'ギルガルド',
    romaji: '*Girugarudo*',
    meaning: 'Guard + Sword',
    explanation: 'From “guard” + “gild.” A royal sword and shield ghost.'
  },
  'シュシュプ': {
    japanese: 'シュシュプ',
    romaji: '*Shushupu*',
    meaning: 'Perfume Puff',
    explanation: 'From シュシュ (chouchou, perfume) + puff. A perfume bird.'
  },
  'フレフワン': {
    japanese: 'フレフワン',
    romaji: '*Furefuwan*',
    meaning: 'Fluffy Fragrance',
    explanation: 'From “fragrance” + fluffy. A perfumed bird dancer.'
  },
  'ペロッパフ': {
    japanese: 'ペロッパフ',
    romaji: '*Peroppafu*',
    meaning: 'Lick + Puff',
    explanation: 'ペロペロ (*pero*, lick) + puff. A cotton candy fairy.'
  },
  'ペロリーム': {
    japanese: 'ペロリーム',
    romaji: '*Perorīmu*',
    meaning: 'Lick + Cream',
    explanation: 'ペロペロ (*pero*, lick) + cream. A whipped cream fairy.'
  },
  'マーイーカ': {
    japanese: 'マーイーカ',
    romaji: '*Māīka*',
    meaning: 'Squid Pun',
    explanation: 'いか (*ika*, squid) with phrase まあいいか (“oh well”). A tricky squid.'
  },
  'カラマネロ': {
    japanese: 'カラマネロ',
    romaji: '*Karamānero*',
    meaning: 'Squid + Trick',
    explanation: '烏賊 (*ika*, squid) + 狡い (*karai*, tricky). A hypnotic squid.'
  },
  'カメテテ': {
    japanese: 'カメテテ',
    romaji: '*Kametete*',
    meaning: 'Turtle + Hand',
    explanation: '亀 (*kame*, turtle) + 手 (*te*, hand). A barnacle Pokémon.'
  },
  'ガメノデス': {
    japanese: 'ガメノデス',
    romaji: '*Gamenodesu*',
    meaning: 'Turtle + Death',
    explanation: '亀 (*kame*, turtle) + death. A multi-limbed barnacle beast.'
  },
  'クズモー': {
    japanese: 'クズモー',
    romaji: '*Kuzumō*',
    meaning: 'Seaweed + Child',
    explanation: '海藻くず (*kuzu*, scrap seaweed) + child. A camouflaged kelp seahorse.'
  },
  'ドラミドロ': {
    japanese: 'ドラミドロ',
    romaji: '*Doramidoro*',
    meaning: 'Dragon + Seaweed',
    explanation: 'From “dragon” + 海藻 (*midoro*, seaweed). A dragon kelp.'
  },
  'ウデッポウ': {
    japanese: 'ウデッポウ',
    romaji: '*Udeppō*',
    meaning: 'Arm + Cannon',
    explanation: '腕 (*ude*, arm) + 鉄砲 (*teppō*, gun). A pistol shrimp.'
  },
  'ブロスター': {
    japanese: 'ブロスター',
    romaji: '*Burosutā*',
    meaning: 'Cannon + Lobster',
    explanation: 'From “blaster” + lobster. A shrimp with a giant cannon claw.'
  },
  'エリキテル': {
    japanese: 'エリキテル',
    romaji: '*Erikiteru*',
    meaning: 'Electric + Lizard',
    explanation: 'From “electric” + reptile. A frilled lizard.'
  },
  'エレザード': {
    japanese: 'エレザード',
    romaji: '*Erezādo*',
    meaning: 'Electric + Lizard',
    explanation: 'From “electric” + lizard. A solar-powered lizard.'
  },
  'チゴラス': {
    japanese: 'チゴラス',
    romaji: '*Chigoras*',
    meaning: 'Child + Dragon',
    explanation: '小 (*chi*, small/child) + dragon. A baby tyrant dinosaur.'
  },
  'ガチゴラス': {
    japanese: 'ガチゴラス',
    romaji: '*Gachigoras*',
    meaning: 'Strong + Dragon',
    explanation: 'From “gachi” (serious/strong) + dragon. A fierce T. rex.'
  },
  'アマルス': {
    japanese: 'アマルス',
    romaji: '*Amarusu*',
    meaning: 'Ammonite + Aura',
    explanation: 'From “ammonite” + aura. An icy dinosaur.'
  },
  'アマルルガ': {
    japanese: 'アマルルガ',
    romaji: '*Amaruruga*',
    meaning: 'Ammonite + Luga',
    explanation: 'From “ammonite” + aurora. A majestic dinosaur.'
  },
  'ニンフィア': {
    japanese: 'ニンフィア',
    romaji: '*Ninfia*',
    meaning: 'Nymph + Suffix',
    explanation: 'From “nymph” + -eon. A fairy-type Eeveelution.'
  },
  'ルチャブル': {
    japanese: 'ルチャブル',
    romaji: '*Ruchaburu*',
    meaning: 'Lucha Libre + Wrestling',
    explanation: 'From “lucha libre” + “wrestle.” A wrestling hawk.'
  },
  'デデンネ': {
    japanese: 'デデンネ',
    romaji: '*Dedenne*',
    meaning: 'Onomatopoeia + Dormouse',
    explanation: 'デン (den, electricity) + ネズミ (*nezumi*, mouse). An electric fairy rodent.'
  },
  'メレシー': {
    japanese: 'メレシー',
    romaji: '*Merecī*',
    meaning: 'Jewel + Mercy',
    explanation: 'From “mercy” + jewel imagery. A diamond-like fairy.'
  },
  'ヌメラ': {
    japanese: 'ヌメラ',
    romaji: '*Numera*',
    meaning: 'Slime + Number',
    explanation: 'From ぬめぬめ (*numenume*, slimy). A gooey dragon larva.'
  },
  'ヌメイル': {
    japanese: 'ヌメイル',
    romaji: '*Numeiru*',
    meaning: 'Slime + Snail',
    explanation: 'From ぬめぬめ (*numenume*) + snail. A slimy dragon.'
  },
  'ヌメルゴン': {
    japanese: 'ヌメルゴン',
    romaji: '*Numerugon*',
    meaning: 'Slime + Dragon',
    explanation: 'From ぬめぬめ (*numenume*) + dragon. A gentle slime dragon.'
  },
  'クレッフィ': {
    japanese: 'クレッフィ',
    romaji: '*Kureffi*',
    meaning: 'Keyring',
    explanation: 'From “clé” (French for key) + key. A fairy keyring.'
  },
  'ボクレー': {
    japanese: 'ボクレー',
    romaji: '*Bokurē*',
    meaning: 'Tree Stump + Spirit',
    explanation: '木の株 (*kikabu*, stump) + 幽霊 (*yūrei*, ghost). A stump ghost.'
  },
  'オーロット': {
    japanese: 'オーロット',
    romaji: '*Ōrotto*',
    meaning: 'Old Tree + Spirit',
    explanation: '大樹 (*ōki na ki*, large tree) + spirit. A haunted elder tree.'
  },
  'バケッチャ': {
    japanese: 'バケッチャ',
    romaji: '*Bakeccha*',
    meaning: 'Pumpkin + Monster',
    explanation: '化け (*bake*, ghost/monster) + 南瓜 (*kabocha*, pumpkin). A pumpkin ghost.'
  },
  'パンプジン': {
    japanese: 'パンプジン',
    romaji: '*Panpujin*',
    meaning: 'Pumpkin + Genie',
    explanation: 'From “pumpkin” + 人 (*jin*, person/genie). A spooky pumpkin spirit.'
  },
  'カチコール': {
    japanese: 'カチコール',
    romaji: '*Kachikōru*',
    meaning: 'Freeze + Core',
    explanation: 'カチコチ (*kachikochi*, frozen solid) + core. An iceberg Pokémon.'
  },
  'クレベース': {
    japanese: 'クレベース',
    romaji: '*Kurebēsu*',
    meaning: 'Crag + Base',
    explanation: 'From “crag” + base. A giant iceberg.'
  },
  'オンバット': {
    japanese: 'オンバット',
    romaji: '*Onbatto*',
    meaning: 'Sound + Bat',
    explanation: '音 (*on*, sound) + bat. A bat that emits ultrasonic cries.'
  },
  'オンバーン': {
    japanese: 'オンバーン',
    romaji: '*Onbān*',
    meaning: 'Sound + Wyvern',
    explanation: '音 (*on*, sound) + wyvern. A draconic bat.'
  },
  'ゼルネアス': {
    japanese: 'ゼルネアス',
    romaji: '*Zeruneasu*',
    meaning: 'Cernunnos (Deer God)',
    explanation: 'From “Cernunnos,” a Celtic deity associated with stags.'
  },
  'イベルタル': {
    japanese: 'イベルタル',
    romaji: '*Iberutaru*',
    meaning: 'Y + Death/Bird',
    explanation: 'From “Y” shape + death imagery. A destructive dark bird.'
  },
  'ジガルデ': {
    japanese: 'ジガルデ',
    romaji: '*Jigarude*',
    meaning: 'Z + Guard',
    explanation: 'From “zygote” + guard. A serpentine protector.'
  },
  'ディアンシー': {
    japanese: 'ディアンシー',
    romaji: '*Deianshī*',
    meaning: 'Diamond + Fancy',
    explanation: 'From “diamond” + fancy. A jewel princess Pokémon.'
  },
  'フーパ': {
    japanese: 'フーパ',
    romaji: '*Fūpa*',
    meaning: 'Hoop + Trick',
    explanation: 'From “hoop” + playful suffix. A mischievous genie.'
  },
  'ボルケニオン': {
    japanese: 'ボルケニオン',
    romaji: '*Borukenion*',
    meaning: 'Volcano + Ion',
    explanation: 'From “volcano” + ion. A steam-powered fire/water beast.'
  },
  'モクロー': {
    japanese: 'モクロー',
    romaji: '*Mokurō*',
    meaning: 'Wood + Owl',
    explanation: '木 (*moku*, wood) + フクロウ (*fukurō*, owl). A grass-type owl.'
  },
  'フクスロー': {
    japanese: 'フクスロー',
    romaji: '*Fukusurō*',
    meaning: 'Owl + Throw',
    explanation: 'フクロウ (*fukurō*, owl) + throw/slash. A stylish owl.'
  },
  'ジュナイパー': {
    japanese: 'ジュナイパー',
    romaji: '*Junaipā*',
    meaning: 'Archer + Juniper',
    explanation: 'From “juniper” + “sniper.” A ghostly archer owl.'
  },
  'ニャビー': {
    japanese: 'ニャビー',
    romaji: '*Nyabī*',
    meaning: 'Meow + Fire',
    explanation: 'ニャー (*nya*, meow) + 火 (*hi*, fire). A fiery kitten.'
  },
  'ニャヒート': {
    japanese: 'ニャヒート',
    romaji: '*Nyahīto*',
    meaning: 'Meow + Heat',
    explanation: 'ニャー (*nya*, meow) + heat. A hot-blooded cat.'
  },
  'ガオガエン': {
    japanese: 'ガオガエン',
    romaji: '*Gaogaen*',
    meaning: 'Roar + Flame',
    explanation: 'ガオ (gao, roar) + 火炎 (*kaen*, flame). A fiery wrestling cat.'
  },
  'アシマリ': {
    japanese: 'アシマリ',
    romaji: '*Ashimari*',
    meaning: 'Sea Lion + Ball',
    explanation: '足 (*ashi*, foot) + 鞠 (*mari*, ball). A playful sea lion.'
  },
  'オシャマリ': {
    japanese: 'オシャマリ',
    romaji: '*Oshamari*',
    meaning: 'Stylish + Sea Lion',
    explanation: 'おしゃま (*oshama*, stylish/precocious) + 鞠 (*mari*, ball). A dancing seal.'
  },
  'アシレーヌ': {
    japanese: 'アシレーヌ',
    romaji: '*Ashirēnu*',
    meaning: 'Sea Lion + Siren',
    explanation: '足 (*ashi*, foot/sea lion) + siren. A singing mermaid seal.'
  },
  'ツツケラ': {
    japanese: 'ツツケラ',
    romaji: '*Tsutsukera*',
    meaning: 'Peck + Woodpecker',
    explanation: '突く (*tsutsuku*, to peck) + 啄木鳥 (*kera*, woodpecker). A tiny pecker bird.'
  },
  'ケララッパ': {
    japanese: 'ケララッパ',
    romaji: '*Kerarappa*',
    meaning: 'Woodpecker + Horn',
    explanation: 'From “kera” (woodpecker) + ラッパ (*rappa*, trumpet). A beak instrument bird.'
  },
  'ドデカバシ': {
    japanese: 'ドデカバシ',
    romaji: '*Dodekabashi*',
    meaning: 'Huge + Beak',
    explanation: 'ドデカ (*dodeka*, gigantic) + 嘴 (*hashi*, beak). A massive-billed toucan.'
  },
  'ヤングース': {
    japanese: 'ヤングース',
    romaji: '*Yanguūsu*',
    meaning: 'Young + Mongoose',
    explanation: 'From “young” + mongoose. A predator mongoose.'
  },
  'デカグース': {
    japanese: 'デカグース',
    romaji: '*Dekagūsu*',
    meaning: 'Big + Mongoose',
    explanation: 'デカ (*deka*, big) + mongoose. A detective-like mongoose.'
  },
  'アゴジムシ': {
    japanese: 'アゴジムシ',
    romaji: '*Agojimushi*',
    meaning: 'Jaw + Larva',
    explanation: '顎 (*ago*, jaw) + 虫 (*mushi*, insect/larva). A jawed grub.'
  },
  'デンヂムシ': {
    japanese: 'デンヂムシ',
    romaji: '*Denjimushi*',
    meaning: 'Electric + Bug',
    explanation: '電 (*den*, electric) + 虫 (*mushi*, bug). A battery-like bug.'
  },
  'クワガノン': {
    japanese: 'クワガノン',
    romaji: '*Kuwaganon*',
    meaning: 'Stag Beetle + Cannon',
    explanation: 'クワガタ (*kuwagata*, stag beetle) + cannon. An electric stag beetle.'
  },
  'マケンカニ': {
    japanese: 'マケンカニ',
    romaji: '*Makenkani*',
    meaning: 'Fighting Crab',
    explanation: '負けん気 (*makenki*, fighting spirit) + 蟹 (*kani*, crab). A boxing crab.'
  },
  'ケケンカニ': {
    japanese: 'ケケンカニ',
    romaji: '*Kekenkani*',
    meaning: 'Hairy Crab',
    explanation: '毛 (*ke*, hair) + 喧嘩 (*kenka*, fight) + crab. A hairy boxing crab.'
  },
  'オドリドリ': {
    japanese: 'オドリドリ',
    romaji: '*Odoridori*',
    meaning: 'Dance + Bird',
    explanation: '踊り (*odori*, dance) + 鳥 (*tori*, bird). A dancing bird with styles.'
  },
  'アブリー': {
    japanese: 'アブリー',
    romaji: '*Aburī*',
    meaning: 'Gnat + Cute',
    explanation: '蚋 (*aburui*, gnat) + cute suffix. A tiny fairy fly.'
  },
  'アブリボン': {
    japanese: 'アブリボン',
    romaji: '*Aburibon*',
    meaning: 'Gnat + Ribbon',
    explanation: 'From *abu* (gnat) + ribbon. A pollinating bee-fly.'
  },
  'イワンコ': {
    japanese: 'イワンコ',
    romaji: '*Iwanko*',
    meaning: 'Rock + Dog',
    explanation: '岩 (*iwa*, rock) + 子犬 (*ko inu*, puppy). A rock puppy.'
  },
  'ルガルガン': {
    japanese: 'ルガルガン',
    romaji: '*Rugarugan*',
    meaning: 'Lugaru (Werewolf) + Rock',
    explanation: 'From “loup-garou” (werewolf) + rock. A wolf with forms.'
  },
  'ヨワシ': {
    japanese: 'ヨワシ',
    romaji: '*Yowashi*',
    meaning: 'Weak + Sardine',
    explanation: '弱し (*yowashi*, weak) + 鰯 (*iwashi*, sardine). A tiny schooling fish.'
  },
  'ヒドイデ': {
    japanese: 'ヒドイデ',
    romaji: '*Hidoide*',
    meaning: 'Cruel + Sea Creature',
    explanation: '酷い (*hidoi*, cruel) + デ (from asari, shellfish). A venomous starfish.'
  },
  'ドヒドイデ': {
    japanese: 'ドヒドイデ',
    romaji: '*Dohidoide*',
    meaning: 'Very Cruel + Sea Creature',
    explanation: '度 (*do*, intensifier) + 酷い (*hidoi*, cruel) + shellfish. A spiny predator.'
  },
  'ドロバンコ': {
    japanese: 'ドロバンコ',
    romaji: '*Dorobanko*',
    meaning: 'Mud + Donkey',
    explanation: '泥 (*doro*, mud) + 駄馬 (*banka*, nag/donkey). A muddy donkey.'
  },
  'バンバドロ': {
    japanese: 'バンバドロ',
    romaji: '*Banbadoro*',
    meaning: 'Draft Horse + Mud',
    explanation: '輓馬 (*banba*, draft horse) + 泥 (*doro*, mud). A heavy war horse.'
  },
  'シズクモ': {
    japanese: 'シズクモ',
    romaji: '*Shizukumo*',
    meaning: 'Droplet + Spider',
    explanation: '雫 (*shizuku*, droplet) + 蜘蛛 (*kumo*, spider). A bubble spider.'
  },
  'オニシズクモ': {
    japanese: 'オニシズクモ',
    romaji: '*Onishizukumo*',
    meaning: 'Demon + Droplet Spider',
    explanation: '鬼 (*oni*, demon) + droplet spider. A large bubble spider.'
  },
  'カリキリ': {
    japanese: 'カリキリ',
    romaji: '*Karikiri*',
    meaning: 'Mow + Cut',
    explanation: '刈り切り (*karikiri*, to mow). A grass mantis.'
  },
  'ラランテス': {
    japanese: 'ラランテス',
    romaji: '*Rarantesu*',
    meaning: 'Orchid + Mantis',
    explanation: 'From “orchid” + “mantis.” A flowery mantis.'
  },
  'ネマシュ': {
    japanese: 'ネマシュ',
    romaji: '*Nemashu*',
    meaning: 'Sleep + Mushroom',
    explanation: '眠い (*nemui*, sleepy) + mushroom. A sleepy glowing fungus.'
  },
  'マシェード': {
    japanese: 'マシェード',
    romaji: '*Mashēdo*',
    meaning: 'Mushroom + Shade',
    explanation: 'From “mushroom” + “shade.” A glowing mushroom.'
  },
  'ヤトウモリ': {
    japanese: 'ヤトウモリ',
    romaji: '*Yatōmori*',
    meaning: 'Night Lizard',
    explanation: '夜盗 (*yatō*, burglar/night thief) + 守宮 (*yamori*, lizard). A toxic lizard.'
  },
  'エンニュート': {
    japanese: 'エンニュート',
    romaji: '*Ennyūto*',
    meaning: 'Ennui + Newt',
    explanation: 'From “ennui” + newt. A toxic salamander queen.'
  },
  'ヌイコグマ': {
    japanese: 'ヌイコグマ',
    romaji: '*Nuikoguma*',
    meaning: 'Plush + Bear Cub',
    explanation: 'ぬいぐるみ (*nuigurumi*, plush toy) + 子熊 (*koguma*, bear cub). A stuffed bear cub.'
  },
  'キテルグマ': {
    japanese: 'キテルグマ',
    romaji: '*Kiteruguma*',
    meaning: 'Arriving + Bear',
    explanation: '来てる (*kiteru*, coming/arriving) + 熊 (*kuma*, bear). A huggable bear.'
  },
  'アマカジ': {
    japanese: 'アマカジ',
    romaji: '*Amakaji*',
    meaning: 'Sweet + Lychee',
    explanation: '甘い (*amai*, sweet) + fruit sound. A sweet fruit Pokémon.'
  },
  'アママイコ': {
    japanese: 'アママイコ',
    romaji: '*Amamaiko*',
    meaning: 'Sweet + Apprentice',
    explanation: '甘い (*amai*, sweet) + 舞子 (*maiko*, apprentice dancer). A fruit dancer.'
  },
  'アマージョ': {
    japanese: 'アマージョ',
    romaji: '*Amājo*',
    meaning: 'Sweet + Queen',
    explanation: '甘い (*amai*, sweet) + 女王 (*joō*, queen). A regal fruit queen.'
  },
  'キュワワー': {
    japanese: 'キュワワー',
    romaji: '*Kyuwawā*',
    meaning: 'Cute + Flower Lei',
    explanation: 'From “cute/queue” + Hawaiian lei. A lei fairy.'
  },
  'ヤレユータン': {
    japanese: 'ヤレユータン',
    romaji: '*Yareyūtan*',
    meaning: 'Do + Orangutan',
    explanation: 'やれ (*yare*, to do/perform) + オランウータン (orangutan). A wise orangutan.'
  },
  'ナゲツケサル': {
    japanese: 'ナゲツケサル',
    romaji: '*Nagetsukesaru*',
    meaning: 'Throw + Monkey',
    explanation: '投げつける (*nagetsukeru*, to throw) + 猿 (*saru*, monkey). A team-throwing lemur.'
  },
  'コソクムシ': {
    japanese: 'コソクムシ',
    romaji: '*Kosokumushi*',
    meaning: 'Sneaky + Bug',
    explanation: '腰抜け (*kosokunuke*, coward) + 虫 (*mushi*, bug). A timid bug.'
  },
  'グソクムシャ': {
    japanese: 'グソクムシャ',
    romaji: '*Gusokumusha*',
    meaning: 'Armored Bug + Warrior',
    explanation: '具足 (*gusoku*, armor) + 武者 (*musha*, warrior). A samurai-like bug.'
  },
  'スナバァ': {
    japanese: 'スナバァ',
    romaji: '*Sunabā*',
    meaning: 'Sand + Childish Sound',
    explanation: '砂場 (*sunaba*, sandbox) + childlike suffix. A sandcastle ghost.'
  },
  'シロデスナ': {
    japanese: 'シロデスナ',
    romaji: '*Shirodesuna*',
    meaning: 'Castle + Sand',
    explanation: '城 (*shiro*, castle) + 砂 (*suna*, sand). A haunted sandcastle.'
  },
  'ナマコブシ': {
    japanese: 'ナマコブシ',
    romaji: '*Namakobushi*',
    meaning: 'Sea Cucumber + Fist',
    explanation: '海鼠 (*namako*, sea cucumber) + 拳 (*kobushi*, fist). A sea cucumber that punches with innards.'
  },
  'タイプ：ヌル': {
    japanese: 'タイプ：ヌル',
    romaji: '*Taipu: Nuru*',
    meaning: 'Type: Null',
    explanation: 'Direct katakana transliteration. A synthetic chimera.'
  },
  'シルヴァディ': {
    japanese: 'シルヴァディ',
    romaji: '*Shiruvadi*',
    meaning: 'Silver + Validity',
    explanation: 'From “silver” + “validity.” A completed synthetic Pokémon.'
  },
  'メテノ': {
    japanese: 'メテノ',
    romaji: '*Meteno*',
    meaning: 'Meteor + Child',
    explanation: 'From “meteor” + -no (childlike). A falling star Pokémon.'
  },
  'ネッコアラ': {
    japanese: 'ネッコアラ',
    romaji: '*Nekkoara*',
    meaning: 'Sleeping + Koala',
    explanation: '根っ子 (*nekko*, root/sleepy) + koala. A perpetually sleeping koala.'
  },
  'バクガメス': {
    japanese: 'バクガメス',
    romaji: '*Bakugamesu*',
    meaning: 'Explosive + Turtle',
    explanation: '爆 (*baku*, explode) + 亀 (*kame*, turtle). An explosive turtle.'
  },
  'トゲデマル': {
    japanese: 'トゲデマル',
    romaji: '*Togedemaru*',
    meaning: 'Spikes + Round',
    explanation: '棘 (*toge*, spike) + 丸 (*maru*, round). A spiky round hedgehog.'
  },
  'ミミッキュ': {
    japanese: 'ミミッキュ',
    romaji: '*Mimikkyu*',
    meaning: 'Mimic + Cute',
    explanation: 'From “mimic” + “cute.” A disguised ghost fairy.'
  },
  'ハギギシリ': {
    japanese: 'ハギギシリ',
    romaji: '*Hagigishiri*',
    meaning: 'Teeth Grinding',
    explanation: '歯ぎしり (*hagishiri*, teeth grinding). A gnashing fish.'
  },
  'ジジーロン': {
    japanese: 'ジジーロン',
    romaji: '*Jijīron*',
    meaning: 'Grandpa + Dragon',
    explanation: 'じじい (*jijii*, old man) + dragon. A benevolent old dragon.'
  },
  'ダダリン': {
    japanese: 'ダダリン',
    romaji: '*Dadarīn*',
    meaning: 'Anchor + Ring',
    explanation: 'From “anchor” + 輪 (*rin*, ring). A ghostly anchor seaweed.'
  },
  'ジャラコ': {
    japanese: 'ジャラコ',
    romaji: '*Jyarako*',
    meaning: 'Rattle + Child',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + 子 (*ko*, child). A rattling dragon.'
  },
  'ジャランゴ': {
    japanese: 'ジャランゴ',
    romaji: '*Jyarango*',
    meaning: 'Rattle + Young',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + young suffix. A scaled dragon.'
  },
  'ジャラランガ': {
    japanese: 'ジャラランガ',
    romaji: '*Jyararanga*',
    meaning: 'Rattle + Elder',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + elder suffix. A scaly elder dragon.'
  },
  'カプ・コケコ': {
    japanese: 'カプ・コケコ',
    romaji: '*Kapu Koko*',
    meaning: 'Guardian Deity + Onomatopoeia',
    explanation: 'カプ (*kapu*, Hawaiian “kapu” = sacred) + コケコ (*kokeko*, rooster cry). Guardian deity of Melemele.'
  },
  'カプ・テテフ': {
    japanese: 'カプ・テテフ',
    romaji: '*Kapu Tetefu*',
    meaning: 'Guardian Deity + Butterfly',
    explanation: 'カプ (*kapu*) + テテフ (from Hawaiian for butterfly). Guardian deity of Akala.'
  },
  'カプ・ブルル': {
    japanese: 'カプ・ブルル',
    romaji: '*Kapu Bururu*',
    meaning: 'Guardian Deity + Bull',
    explanation: 'カプ (*kapu*) + bull sound. Guardian deity of Ula’ula.'
  },
  'カプ・レヒレ': {
    japanese: 'カプ・レヒレ',
    romaji: '*Kapu Rehire*',
    meaning: 'Guardian Deity + Reef',
    explanation: 'カプ (*kapu*) + reef/water name. Guardian deity of Poni.'
  },
  'コスモッグ': {
    japanese: 'コスモッグ',
    romaji: '*Kosumoggu*',
    meaning: 'Cosmos + Fog',
    explanation: 'From “cosmos” + “smog/fog.” A tiny nebula.'
  },
  'コスモウム': {
    japanese: 'コスモウム',
    romaji: '*Kosumōmu*',
    meaning: 'Cosmos + Oumu',
    explanation: 'From “cosmos” + “om/ohm.” A cosmic seed.'
  },
  'ソルガレオ': {
    japanese: 'ソルガレオ',
    romaji: '*Sorugareo*',
    meaning: 'Sun + Leo',
    explanation: 'From “sol” (sun) + Leo (lion). The Sun Legendary.'
  },
  'ルナアーラ': {
    japanese: 'ルナアーラ',
    romaji: '*Runaāra*',
    meaning: 'Moon + Alar',
    explanation: 'From “luna” (moon) + ala (wing). The Moon Legendary.'
  },
  'ウツロイド': {
    japanese: 'ウツロイド',
    romaji: '*Utsuroido*',
    meaning: 'Hollow + Parasite',
    explanation: '空ろ (*utsuro*, hollow) + -id (parasite). An Ultra Beast jellyfish.'
  },
  'マギアナ': {
    japanese: 'マギアナ',
    romaji: '*Magiana*',
    meaning: 'Magic + Gear',
    explanation: 'From “magic” + “gear.” A mechanical fairy.'
  },
  'マーシャドー': {
    japanese: 'マーシャドー',
    romaji: '*Māshadō*',
    meaning: 'Martial + Shadow',
    explanation: 'From “martial” + “shadow.” A mythical shadow boxer.'
  },
  'ベベノム': {
    japanese: 'ベベノム',
    romaji: '*Bebenomu*',
    meaning: 'Baby + Venom',
    explanation: 'From “bébé” (baby) + venom. An Ultra Beast larva.'
  },
  'アーゴヨン': {
    japanese: 'アーゴヨン',
    romaji: '*Āgoyon*',
    meaning: 'Needle + Dragon',
    explanation: 'From “nagant” (needle gun) + dragon. An Ultra Beast dragon.'
  },
  'ツンデツンデ': {
    japanese: 'ツンデツンデ',
    romaji: '*Tsundetsunde*',
    meaning: 'Piled Up',
    explanation: '積んで (*tsunde*, pile up). A fortress Ultra Beast.'
  },
  'ズガドーン': {
    japanese: 'ズガドーン',
    romaji: '*Zugadōn*',
    meaning: 'Explosion Sound',
    explanation: 'ずがーん (*zugān*, explosive sound). A clown Ultra Beast.'
  },
  'ゼラオラ': {
    japanese: 'ゼラオラ',
    romaji: '*Zeraora*',
    meaning: 'Zero + Aura',
    explanation: 'From “zero” + aura. An electric feline.'
  },
  'メルタン': {
    japanese: 'メルタン',
    romaji: '*Merutan*',
    meaning: 'Melt + Metal',
    explanation: 'From “melt” + “tan.” A mythical liquid metal nut.'
  },
  'メルメタル': {
    japanese: 'メルメタル',
    romaji: '*Merumetaru*',
    meaning: 'Melt + Metal',
    explanation: 'From “melt” + “metal.” A giant mythical steel titan.'
  },
  'サルノリ': {
    japanese: 'サルノリ',
    romaji: '*Sarunori*',
    meaning: 'Monkey + Play Music',
    explanation: '猿 (*saru*, monkey) + ノリ (*nori*, rhythm/play). A drumming monkey.'
  },
  'バチンキー': {
    japanese: 'バチンキー',
    romaji: '*Bachinkī*',
    meaning: 'Slap + Monkey',
    explanation: 'バチン (bachin, slap sound) + monkey. A stick-banging monkey.'
  },
  'ゴリランダー': {
    japanese: 'ゴリランダー',
    romaji: '*Gorirandā*',
    meaning: 'Gorilla + Band',
    explanation: 'From “gorilla” + “band.” A drummer gorilla.'
  },
  'ヒバニー': {
    japanese: 'ヒバニー',
    romaji: '*Hibanī*',
    meaning: 'Fire + Bunny',
    explanation: '火 (*hi*, fire) + bunny. A fiery rabbit.'
  },
  'ラビフット': {
    japanese: 'ラビフット',
    romaji: '*Rabifutto*',
    meaning: 'Rabbit + Foot',
    explanation: 'From “rabbit” + foot. A sporty rabbit.'
  },
  'エースバーン': {
    japanese: 'エースバーン',
    romaji: '*Ēsubān*',
    meaning: 'Ace + Burn',
    explanation: 'From “ace” + burn. A soccer-striker rabbit.'
  },
  'メッソン': {
    japanese: 'メッソン',
    romaji: '*Messon*',
    meaning: 'Weep + Son',
    explanation: 'From “mess/messo” (sob) + son. A timid water lizard.'
  },
  'ジメレオン': {
    japanese: 'ジメレオン',
    romaji: '*Jimerēon*',
    meaning: 'Damp + Chameleon',
    explanation: 'じめじめ (*jimejime*, damp) + chameleon. A moody lizard.'
  },
  'インテレオン': {
    japanese: 'インテレオン',
    romaji: '*Intereon*',
    meaning: 'Intelligence + Chameleon',
    explanation: 'From “intelligent” + chameleon. A spy lizard.'
  },
  'ホシガリス': {
    japanese: 'ホシガリス',
    romaji: '*Hoshigarisu*',
    meaning: 'Greedy + Squirrel',
    explanation: '欲しがり (*hoshigari*, greedy) + 栗鼠 (*risu*, squirrel). A greedy squirrel.'
  },
  'ヨクバリス': {
    japanese: 'ヨクバリス',
    romaji: '*Yokubarisu*',
    meaning: 'Avaricious + Squirrel',
    explanation: '欲張り (*yokubari*, greedy) + squirrel. A fat-cheeked squirrel.'
  },
  'ココガラ': {
    japanese: 'ココガラ',
    romaji: '*Kokogara*',
    meaning: 'Small Bird + Cry',
    explanation: '小 (*ko*, little) + 鳥 (*tori*, bird) + cry sound. A tiny rook.'
  },
  'アオガラス': {
    japanese: 'アオガラス',
    romaji: '*Aogarasu*',
    meaning: 'Blue + Crow',
    explanation: '青 (*ao*, blue) + 烏 (*karasu*, crow). A mid-stage raven.'
  },
  'アーマーガア': {
    japanese: 'アーマーガア',
    romaji: '*Āmāgā*',
    meaning: 'Armor + Crow',
    explanation: 'From “armor” + crow. A knightly raven.'
  },
  'サッチムシ': {
    japanese: 'サッチムシ',
    romaji: '*Satchimushi*',
    meaning: 'Measure + Bug',
    explanation: '察知 (*satchi*, to sense/measure) + 虫 (*mushi*, bug). A scholarly bug.'
  },
  'レドームシ': {
    japanese: 'レドームシ',
    romaji: '*Redōmushi*',
    meaning: 'Dome + Bug',
    explanation: 'Dome + 虫 (*mushi*, bug). A psychic cocoon.'
  },
  'イオルブ': {
    japanese: 'イオルブ',
    romaji: '*Iorubu*',
    meaning: 'Orb + Beetle',
    explanation: 'From “orb” + beetle. A UFO-like bug.'
  },
  'クスネ': {
    japanese: 'クスネ',
    romaji: '*Kusune*',
    meaning: 'Sneaky Fox',
    explanation: 'くすねる (*kusuneru*, to pilfer) + fox. A cunning fox.'
  },
  'フォクスライ': {
    japanese: 'フォクスライ',
    romaji: '*Fokusray*',
    meaning: 'Fox + Sly',
    explanation: 'From “fox” + sly. A gentleman thief fox.'
  },
  'ヒメンカ': {
    japanese: 'ヒメンカ',
    romaji: '*Himenka*',
    meaning: 'Princess + Flower',
    explanation: '姫 (*hime*, princess) + 花 (*ka*, flower). A dainty flower.'
  },
  'ワタシラガ': {
    japanese: 'ワタシラガ',
    romaji: '*Watashiraga*',
    meaning: 'Cotton + White Hair',
    explanation: '綿 (*wata*, cotton) + 白髪 (*shiraga*, white hair). A puffball elder.'
  },
  'ウールー': {
    japanese: 'ウールー',
    romaji: '*Ūrū*',
    meaning: 'Wool + Sheep Sound',
    explanation: 'From “wool” + baa sound. A fluffy sheep.'
  },
  'バイウールー': {
    japanese: 'バイウールー',
    romaji: '*Baiūrū*',
    meaning: 'Double + Wool',
    explanation: 'From “double” + wool. A ram with curled horns.'
  },
  'カムカメ': {
    japanese: 'カムカメ',
    romaji: '*Kamukame*',
    meaning: 'Bite + Turtle',
    explanation: '噛む (*kamu*, to bite) + 亀 (*kame*, turtle). A snapping turtle.'
  },
  'カジリガメ': {
    japanese: 'カジリガメ',
    romaji: '*Kajirigame*',
    meaning: 'Gnaw + Turtle',
    explanation: 'かじる (*kajiru*, to gnaw) + turtle. A biting turtle.'
  },
  'ワンパチ': {
    japanese: 'ワンパチ',
    romaji: '*Wanpachi*',
    meaning: 'Bark + Pachi',
    explanation: 'ワン (*wan*, dog bark) + パチ (pachi, electric crackle). An electric corgi.'
  },
  'パルスワン': {
    japanese: 'パルスワン',
    romaji: '*Parusuwan*',
    meaning: 'Pulse + Bark',
    explanation: '“Pulse” + ワン (*wan*, bark). A loyal hound.'
  },
  'タンドン': {
    japanese: 'タンドン',
    romaji: '*Tandon*',
    meaning: 'Charcoal Lump',
    explanation: '炭団 (*tandon*, charcoal briquette). A rolling coal lump.'
  },
  'トロッゴン': {
    japanese: 'トロッゴン',
    romaji: '*Toroggon*',
    meaning: 'Trolley + Coal',
    explanation: 'From “trolley” + coal. A cart-coal Pokémon.'
  },
  'セキタンザン': {
    japanese: 'セキタンザン',
    romaji: '*Sekitanzan*',
    meaning: 'Coal + Carbon Mountain',
    explanation: '石炭 (*sekitan*, coal) + 山 (*zan*, mountain). A coal colossus.'
  },
  'カジッチュ': {
    japanese: 'カジッチュ',
    romaji: '*Kajitchu*',
    meaning: 'Bite + Apple',
    explanation: '噛じる (*kajiru*, to bite) + apple. A worm in an apple.'
  },
  'アップリュー': {
    japanese: 'アップリュー',
    romaji: '*Appuryū*',
    meaning: 'Apple + Dragon',
    explanation: 'From “apple” + dragon. A winged apple wyrm.'
  },
  'タルップル': {
    japanese: 'タルップル',
    romaji: '*Taruppuru*',
    meaning: 'Tart + Apple',
    explanation: 'From “tart” + apple. A pie-like apple dragon.'
  },
  'スナヘビ': {
    japanese: 'スナヘビ',
    romaji: '*Sunahebi*',
    meaning: 'Sand + Snake',
    explanation: '砂 (*suna*, sand) + 蛇 (*hebi*, snake). A sand snake.'
  },
  'サダイジャ': {
    japanese: 'サダイジャ',
    romaji: '*Sadaija*',
    meaning: 'Sand + Anaconda',
    explanation: 'From “sand” + “anaconda.” A coiled sand snake.'
  },
  'ウッウ': {
    japanese: 'ウッウ',
    romaji: '*Uu*',
    meaning: 'Onomatopoeia (bird call)',
    explanation: 'A silly cormorant; Japanese name mimics its cry.'
  },
  'サシカマス': {
    japanese: 'サシカマス',
    romaji: '*Sashikamasu*',
    meaning: 'Spear + Barracuda',
    explanation: '刺す (*sasu*, to pierce) + カマス (*kamasu*, barracuda). A dart fish.'
  },
  'カマスジョー': {
    japanese: 'カマスジョー',
    romaji: '*Kamasujō*',
    meaning: 'Barracuda + Boss',
    explanation: 'From “kamasu” (barracuda) + 丈 (*jō*, boss/leader). A spearhead fish.'
  },
  'エレズン': {
    japanese: 'エレズン',
    romaji: '*Erezun*',
    meaning: 'Electric + Lizard',
    explanation: 'From “electric” + lizard. A baby punk lizard.'
  },
  'ストリンダー': {
    japanese: 'ストリンダー',
    romaji: '*Sutorindā*',
    meaning: 'String + Thunder',
    explanation: 'From “string/strident” + thunder. A punk rocker lizard.'
  },
  'ヤクデ': {
    japanese: 'ヤクデ',
    romaji: '*Yakude*',
    meaning: 'Burn + Centipede',
    explanation: '焼く (*yaku*, to burn) + 百足 (*mukade*, centipede). A fiery centipede.'
  },
  'マルヤクデ': {
    japanese: 'マルヤクデ',
    romaji: '*Maruyakude*',
    meaning: 'Round + Burn + Centipede',
    explanation: '丸 (*maru*, round) + yaku (burn) + centipede. A blazing centipede.'
  },
  'タタッコ': {
    japanese: 'タタッコ',
    romaji: '*Tatako*',
    meaning: 'Punch + Octopus',
    explanation: '叩く (*tataku*, punch) + 蛸 (*tako*, octopus). A punching octopus.'
  },
  'オトスパス': {
    japanese: 'オトスパス',
    romaji: '*Otosupasu*',
    meaning: 'Wrestle + Octopus',
    explanation: '落とす (*otosu*, to throw down) + octopus. A grappling cephalopod.'
  },
  'ヤバチャ': {
    japanese: 'ヤバチャ',
    romaji: '*Yabacha*',
    meaning: 'Dangerous + Tea',
    explanation: 'やばい (*yabai*, dangerous/strange) + 茶 (*cha*, tea). A haunted teacup.'
  },
  'ポットデス': {
    japanese: 'ポットデス',
    romaji: '*Pottodesu*',
    meaning: 'Pot + Death',
    explanation: 'From “pot” + death. A haunted teapot.'
  },
  'ミブリム': {
    japanese: 'ミブリム',
    romaji: '*Miburimu*',
    meaning: 'Gesture + Grim',
    explanation: '身振り (*miburi*, gesture) + grim. A timid psychic.'
  },
  'テブリム': {
    japanese: 'テブリム',
    romaji: '*Teburimu*',
    meaning: 'Hand + Grim',
    explanation: '手振り (*teburi*, hand gesture) + grim. A mid-stage psychic.'
  },
  'ブリムオン': {
    japanese: 'ブリムオン',
    romaji: '*Burimuon*',
    meaning: 'Grim + On',
    explanation: 'From “grim” + sound suffix. A witch-like psychic fairy.'
  },
  'ベロバー': {
    japanese: 'ベロバー',
    romaji: '*Berobā*',
    meaning: 'Tongue + Goblin',
    explanation: 'ベロ (*bero*, tongue) + imp sound. A mischievous imp.'
  },
  'ギモー': {
    japanese: 'ギモー',
    romaji: '*Gimō*',
    meaning: 'Deceit + Ogre',
    explanation: '偽 (*gi*, false/deceit) + ogre sound. A goblin trickster.'
  },
  'オーロンゲ': {
    japanese: 'オーロンゲ',
    romaji: '*Ōronge*',
    meaning: 'Ogre + Long Hair',
    explanation: 'From “ogre” + long hair. A demonic hairy fairy.'
  },
  'タチフサグマ': {
    japanese: 'タチフサグマ',
    romaji: '*Tachifusaguma*',
    meaning: 'Block + Badger',
    explanation: '立ち塞ぐ (*tachifusagu*, to block) + 熊 (*guma/kuma*, badger). A blocking badger.'
  },
  'ニャイキング': {
    japanese: 'ニャイキング',
    romaji: '*Nyaikingu*',
    meaning: 'Meow + Viking',
    explanation: 'ニャー (*nya*, meow) + viking. A berserker cat.'
  },
  'サニゴーン': {
    japanese: 'サニゴーン',
    romaji: '*Sanigōn*',
    meaning: 'Coral + Gone',
    explanation: 'サンゴ (*sango*, coral) + gone. A ghost coral.'
  },
  'ネギガナイト': {
    japanese: 'ネギガナイト',
    romaji: '*Negiganaito*',
    meaning: 'Leek + Knight',
    explanation: '葱 (*negi*, leek) + knight. A noble duck with leek sword.'
  },
  'バリコオル': {
    japanese: 'バリコオル',
    romaji: '*Barikōru*',
    meaning: 'Barrier + Clown',
    explanation: 'From “barrier” + clown/performer. A tap-dancing mime.'
  },
  'デスバーン': {
    japanese: 'デスバーン',
    romaji: '*Desubān*',
    meaning: 'Death + Burn/Tablet',
    explanation: 'From “death” + rune/burn. A cursed tablet Pokémon.'
  },
  'マホミル': {
    japanese: 'マホミル',
    romaji: '*Mahomiru*',
    meaning: 'Magic + Milk',
    explanation: '魔法 (*mahou*, magic) + milk. A cream fairy.'
  },
  'マホイップ': {
    japanese: 'マホイップ',
    romaji: '*Mahoippu*',
    meaning: 'Magic + Whip',
    explanation: '魔法 (*mahou*, magic) + whip/cream. A whipped cream fairy.'
  },
  'タイレーツ': {
    japanese: 'タイレーツ',
    romaji: '*Tairetsu*',
    meaning: 'Military Formation',
    explanation: '隊列 (*tairetsu*, military column). A squad-based Pokémon.'
  },
  'バチンウニ': {
    japanese: 'バチンウニ',
    romaji: '*Bachin’uni*',
    meaning: 'Crackle + Sea Urchin',
    explanation: 'バチン (bachin, crackle sound) + 海胆 (*uni*, sea urchin). An electric urchin.'
  },
  'ユキハミ': {
    japanese: 'ユキハミ',
    romaji: '*Yukihami*',
    meaning: 'Snow + Bite',
    explanation: '雪 (*yuki*, snow) + 噛み (*kami*, bite). A snowy larva.'
  },
  'モスノウ': {
    japanese: 'モスノウ',
    romaji: '*Mosunō*',
    meaning: 'Moth + Snow',
    explanation: 'From “moth” + snow. An icy moth.'
  },
  'イシヘンジン': {
    japanese: 'イシヘンジン',
    romaji: '*Ishihenjin*',
    meaning: 'Stone + Henge',
    explanation: '石 (*ishi*, stone) + henge. A Stonehenge Pokémon.'
  },
  'コオリッポ': {
    japanese: 'コオリッポ',
    romaji: '*Kōrippo*',
    meaning: 'Ice + Cute Sound',
    explanation: '氷 (*kōri*, ice) + playful suffix. A penguin with an ice head.'
  },
  'イエッサン': {
    japanese: 'イエッサン',
    romaji: '*Iessan*',
    meaning: 'Yes Sir + Attendant',
    explanation: 'From “yes, sir” + attendant. A psychic butler Pokémon.'
  },
  'モルペコ': {
    japanese: 'モルペコ',
    romaji: '*Morupeko*',
    meaning: 'Hungry + Hamster',
    explanation: 'Derived from 食いしん坊 (*moru*, glutton) + ペコペコ (*pekopeko*, hungry). A dual-mode hamster.'
  },
  'ゾウドウ': {
    japanese: 'ゾウドウ',
    romaji: '*Zōdō*',
    meaning: 'Elephant + Copper',
    explanation: '象 (*zō*, elephant) + 銅 (*dō*, copper). A copper elephant.'
  },
  'ダイオウドウ': {
    japanese: 'ダイオウドウ',
    romaji: '*Daiōdō*',
    meaning: 'Great King + Copper',
    explanation: '大王 (*daiō*, great king) + copper. A regal elephant.'
  },
  'パッチラゴン': {
    japanese: 'パッチラゴン',
    romaji: '*Pacchiragon*',
    meaning: 'Patchwork + Dragon',
    explanation: 'From “patchwork” + dragon. A fossil chimera.'
  },
  'パッチルドン': {
    japanese: 'パッチルドン',
    romaji: '*Pacchirudon*',
    meaning: 'Patchwork + Freezing',
    explanation: 'From “patchwork” + cold/freeze suffix. A fossil chimera.'
  },
  'パッチラドン': {
    japanese: 'パッチラドン',
    romaji: '*Pacchiradon*',
    meaning: 'Patchwork + Fish',
    explanation: 'From “patchwork” + fish. A fossil chimera.'
  },
  'パッチルゴン': {
    japanese: 'パッチルゴン',
    romaji: '*Pacchirugon*',
    meaning: 'Patchwork + Dragon/Fish',
    explanation: 'From “patchwork” + dragon/fish. A fossil chimera.'
  },
  'ジュラルドン': {
    japanese: 'ジュラルドン',
    romaji: '*Jurarudon*',
    meaning: 'Duralumin + Don',
    explanation: 'From “duralumin” (alloy) + don. A steel dragon.'
  },
  'ドラメシヤ': {
    japanese: 'ドラメシヤ',
    romaji: '*Dorameshiya*',
    meaning: 'Dragon + Ghost',
    explanation: 'From “dragon” + 餓鬼 (*meshiya*, dead child spirit). A ghostly dragon.'
  },
  'ドロンチ': {
    japanese: 'ドロンチ',
    romaji: '*Doronchi*',
    meaning: 'Drone + Wraith',
    explanation: 'From “drone” + 幽霊 (*doron*, ghost). A guardian dragon.'
  },
  'ドラパルト': {
    japanese: 'ドラパルト',
    romaji: '*Doraparuto*',
    meaning: 'Dragon + Catapult',
    explanation: 'From “dragon” + catapult. Launches its young like missiles.'
  },
  'ザシアン': {
    japanese: 'ザシアン',
    romaji: '*Zashian*',
    meaning: 'Sword + Cyan',
    explanation: 'From “sword” + cyan. Legendary hero wolf of Galar.'
  },
  'ザマゼンタ': {
    japanese: 'ザマゼンタ',
    romaji: '*Zamazenta*',
    meaning: 'Shield + Magenta',
    explanation: 'From “shield” + magenta. Legendary hero wolf of Galar.'
  },
  'ムゲンダイナ': {
    japanese: 'ムゲンダイナ',
    romaji: '*Mugendaina*',
    meaning: 'Infinite + Dyno',
    explanation: '無限大 (*mugendai*, infinity) + -na. A colossal alien dragon.'
  },
  'ダクマ': {
    japanese: 'ダクマ',
    romaji: '*Dakuma*',
    meaning: 'Training + Bear Cub',
    explanation: '打 (*da*, strike) + 熊 (*kuma*, bear). A martial bear cub.'
  },
  'ウーラオス': {
    japanese: 'ウーラオス',
    romaji: '*Ūraosu*',
    meaning: 'Martial Arts Master Bear',
    explanation: 'From 武 (*ura/ra*, martial) + 師父 (*shifu*, master). A bear martial artist.'
  },
  'ザルード': {
    japanese: 'ザルード',
    romaji: '*Zarūdo*',
    meaning: 'Baboon + Rude',
    explanation: 'From “zaruba” (baboon) + rude. A rogue jungle ape.'
  },
  'レジエレキ': {
    japanese: 'レジエレキ',
    romaji: '*Rejiereki*',
    meaning: 'Regi + Electric',
    explanation: 'From “Regi” series + electric. An electric golem.'
  },
  'レジドラゴ': {
    japanese: 'レジドラゴ',
    romaji: '*Rejidorago*',
    meaning: 'Regi + Dragon',
    explanation: 'From “Regi” series + dragon. A dragon golem.'
  },
  'ブリザポス': {
    japanese: 'ブリザポス',
    romaji: '*Burizaposu*',
    meaning: 'Blizzard + Horse',
    explanation: 'From “blizzard” + horse. An icy steed.'
  },
  'レイスポス': {
    japanese: 'レイスポス',
    romaji: '*Reisuposu*',
    meaning: 'Wraith + Horse',
    explanation: '霊 (*rei*, spirit) + horse. A spectral steed.'
  },
  'バドレックス': {
    japanese: 'バドレックス',
    romaji: '*Badorekkusu*',
    meaning: 'Bud + Rex',
    explanation: 'From “bud” + rex (king). A regal plant king.'
  },
  'アヤシシ': {
    japanese: 'アヤシシ',
    romaji: '*Ayashishi*',
    meaning: 'Strange + Deer',
    explanation: '怪しい (*ayashii*, mysterious) + deer. A mystical deer.'
  },
  'バサギリ': {
    japanese: 'バサギリ',
    romaji: '*Basagiri*',
    meaning: 'Slash + Cut',
    explanation: '伐る (*basagiru*, to slash) + insect suffix. A noble axe insect.'
  },
  'ガチグマ': {
    japanese: 'ガチグマ',
    romaji: '*Gachiguma*',
    meaning: 'Serious + Bear',
    explanation: 'ガチ (*gachi*, serious) + 熊 (*kuma*, bear). A giant bear.'
  },
  'イダイトウ': {
    japanese: 'イダイトウ',
    romaji: '*Idaitō*',
    meaning: 'Great + Fish',
    explanation: '偉大 (*idai*, great) + 魚 (*tō*, fish). A legion of vengeful fish.'
  },
  'オオニューラ': {
    japanese: 'オオニューラ',
    romaji: '*Ōnyūra*',
    meaning: 'Great + Sneasel',
    explanation: '大 (*ō*, great) + ニューラ (*Nyūra*, Sneasel). A climbing poison cat.'
  },
  'ラブトロス': {
    japanese: 'ラブトロス',
    romaji: '*Rabutorosu*',
    meaning: 'Love + Genie',
    explanation: 'From “love” + genie suffix (as with Tornadus, Thundurus, etc.). A love-associated genie.'
  },
  'ニャオハ': {
    japanese: 'ニャオハ',
    romaji: '*Nyaoha*',
    meaning: 'Meow + Leaf',
    explanation: 'ニャー (*nyaa*, meow) + 葉 (*ha*, leaf). A grass kitten.'
  },
  'ニャローテ': {
    japanese: 'ニャローテ',
    romaji: '*Nyarōte*',
    meaning: 'Meow + Rogue',
    explanation: 'From ニャー (meow) + rogue/scoundrel nuance. A mischievous cat.'
  },
  'マスカーニャ': {
    japanese: 'マスカーニャ',
    romaji: '*Masukānya*',
    meaning: 'Masquerade + Meow',
    explanation: 'From “masquerade” + ニャー (*nya*, meow). A magician cat.'
  },
  'ホゲータ': {
    japanese: 'ホゲータ',
    romaji: '*Hogētā*',
    meaning: 'Fire + Croc (silly)',
    explanation: 'ホゲー (*hoge*, silly expression) + ゲータ (alligator). A goofy croc.'
  },
  'アチゲータ': {
    japanese: 'アチゲータ',
    romaji: '*Achigēta*',
    meaning: 'Heat + Gator',
    explanation: '熱い (*atsui*, hot) + gator. A hot-headed croc.'
  },
  'ラウドボーン': {
    japanese: 'ラウドボーン',
    romaji: '*Raudobōn*',
    meaning: 'Loud + Bone',
    explanation: 'From “loud” + bone. A ghostly croc singer.'
  },
  'クワッス': {
    japanese: 'クワッス',
    romaji: '*Kuwassu*',
    meaning: 'Quack + Suffix',
    explanation: 'From “quack.” A proud duckling.'
  },
  'ウェルカモ': {
    japanese: 'ウェルカモ',
    romaji: '*Werukamo*',
    meaning: 'Well + Duck',
    explanation: 'From “welcome” + duck. A dancing duck.'
  },
  'ウェーニバル': {
    japanese: 'ウェーニバル',
    romaji: '*Wēnibaru*',
    meaning: 'Carnival + Waterfowl',
    explanation: 'From “carnival” + waterfowl. A flamboyant dancer.'
  },
  'グルトン': {
    japanese: 'グルトン',
    romaji: '*Guruton*',
    meaning: 'Glutton',
    explanation: 'From “glutton.” A greedy pig.'
  },
  'パフュートン': {
    japanese: 'パフュートン',
    romaji: '*Pafyūton*',
    meaning: 'Perfume + Pig',
    explanation: 'From “perfume” + glutton. A perfumed hog.'
  },
  'タマンチュラ': {
    japanese: 'タマンチュラ',
    romaji: '*Tamanchura*',
    meaning: 'Ball + Tarantula',
    explanation: '玉 (*tama*, ball) + tarantula. A yarn-ball spider.'
  },
  'ワナイダー': {
    japanese: 'ワナイダー',
    romaji: '*Wanaidā*',
    meaning: 'Trap + Spider',
    explanation: '罠 (*wana*, trap) + spider. A thread-trapping spider.'
  },
  'マメバッタ': {
    japanese: 'マメバッタ',
    romaji: '*Mamebatta*',
    meaning: 'Bean Grasshopper',
    explanation: '豆 (*mame*, bean/small) + grasshopper. A small hopper.'
  },
  'エクスレッグ': {
    japanese: 'エクスレッグ',
    romaji: '*Ekusureggu*',
    meaning: 'Ex + Legs',
    explanation: 'From “exoskeleton” + legs. A mechanical-like hopper.'
  },
  'パモ': {
    japanese: 'パモ',
    romaji: '*Pamo*',
    meaning: 'Paw + Suffix',
    explanation: 'From “paw.” A tiny electric rodent.'
  },
  'パモット': {
    japanese: 'パモット',
    romaji: '*Pamotto*',
    meaning: 'Paw + More',
    explanation: 'Evolves Pamo; slightly bigger.'
  },
  'パーモット': {
    japanese: 'パーモット',
    romaji: '*Pāmotto*',
    meaning: 'Paw + Might',
    explanation: 'From “paw” + “mighty.” Stronger electric rodent.'
  },
  'ワッカネズミ': {
    japanese: 'ワッカネズミ',
    romaji: '*Wakkanezumi*',
    meaning: 'Ring Mice',
    explanation: '輪 (*wa*, ring) + 鼠 (*nezumi*, mouse). Two mice together.'
  },
  'イッカネズミ': {
    japanese: 'イッカネズミ',
    romaji: '*Ikkannezumi*',
    meaning: 'Family Mice',
    explanation: '一家 (*ikka*, family) + 鼠 (*nezumi*, mouse). A family of mice.'
  },
  'パピモッチ': {
    japanese: 'パピモッチ',
    romaji: '*Papimocchi*',
    meaning: 'Puppy + Mochi',
    explanation: 'From “puppy” + mochi. A dough puppy.'
  },
  'バウッツェル': {
    japanese: 'バウッツェル',
    romaji: '*Bautsueru*',
    meaning: 'Pretzel + Dog',
    explanation: 'From “pretzel” + dachshund. A baked dog.'
  },
  'ミニーブ': {
    japanese: 'ミニーブ',
    romaji: '*Minību*',
    meaning: 'Mini + Olive',
    explanation: 'From “mini” + olive. A tiny olive.'
  },
  'オリーニョ': {
    japanese: 'オリーニョ',
    romaji: '*Orīnyo*',
    meaning: 'Olive + Niño',
    explanation: 'From “olive” + niño (child). A young olive.'
  },
  'オリーヴァ': {
    japanese: 'オリーヴァ',
    romaji: '*Orīva*',
    meaning: 'Olive + Ava',
    explanation: 'From “olive” + viva. A grand olive tree.'
  },
  'イキリンコ': {
    japanese: 'イキリンコ',
    romaji: '*Ikirinko*',
    meaning: 'Cocky Parrot',
    explanation: '粋 (*iki*, stylish/cocky) + parrot. A punk parrot.'
  },
  'コジオ': {
    japanese: 'コジオ',
    romaji: '*Kojio*',
    meaning: 'Small Salt',
    explanation: '小 (*ko*, small) + 塩 (*shio*, salt). A salt crystal.'
  },
  'ジオヅム': {
    japanese: 'ジオヅム',
    romaji: '*Jiodzumu*',
    meaning: 'Geo + Pile',
    explanation: 'From “geo” + stack. A pile of salt.'
  },
  'キョジオーン': {
    japanese: 'キョジオーン',
    romaji: '*Kyojio-n*',
    meaning: 'Giant Salt',
    explanation: '巨 (*kyo*, giant) + 塩 (*shio*, salt). A colossal salt golem.'
  },
  'カルボウ': {
    japanese: 'カルボウ',
    romaji: '*Karubō*',
    meaning: 'Charcoal + Boy',
    explanation: 'From “charcoal” + 坊 (*bō*, boy). A fiery child.'
  },
  'グレンアルマ': {
    japanese: 'グレンアルマ',
    romaji: '*Gurenaruma*',
    meaning: 'Crimson + Armor',
    explanation: '紅蓮 (*guren*, crimson) + armor. A fiery knight.'
  },
  'ソウブレイズ': {
    japanese: 'ソウブレイズ',
    romaji: '*Sōbureizu*',
    meaning: 'Soul + Blaze',
    explanation: 'From “soul” + blaze. A spectral knight.'
  },
  'ズピカ': {
    japanese: 'ズピカ',
    romaji: '*Zupika*',
    meaning: 'Spark + Tadpole',
    explanation: 'From “spark” + ピカ (pika, flash). A tadpole bulb.'
  },
  'ハラバリー': {
    japanese: 'ハラバリー',
    romaji: '*Harabarī*',
    meaning: 'Belly + Battery',
    explanation: 'From “belly” + battery. A frog with belly-electricity.'
  },
  'カイデン': {
    japanese: 'カイデン',
    romaji: '*Kaiden*',
    meaning: 'Sea + Electric',
    explanation: '海 (*kai*, sea) + 電 (*den*, electric). A seabird.'
  },
  'タイカイデン': {
    japanese: 'タイカイデン',
    romaji: '*Taikaiden*',
    meaning: 'Great Sea + Electric',
    explanation: '大 (*tai*, great) + 海電 (*kaiden*, sea-electric). A powerful seabird.'
  },
  'オラチフ': {
    japanese: 'オラチフ',
    romaji: '*Orachifu*',
    meaning: 'Rough + Mastiff',
    explanation: 'From “ora” (rough bark) + mastiff. A scrappy puppy.'
  },
  'マフィティフ': {
    japanese: 'マフィティフ',
    romaji: '*Mafitif*',
    meaning: 'Mafia + Mastiff',
    explanation: 'From “mafia” + mastiff. A loyal boss dog.'
  },
  'シルシュルー': {
    japanese: 'シルシュルー',
    romaji: '*Shirushurū*',
    meaning: 'Scribble + Doodle',
    explanation: 'From “scribble” + doodle. A graffiti lemur.'
  },
  'タギングル': {
    japanese: 'タギングル',
    romaji: '*Taginguru*',
    meaning: 'Tagging + Lemur',
    explanation: 'From “tagging” graffiti + lemur. A toxic graffiti monkey.'
  },
  'アノクサ': {
    japanese: 'アノクサ',
    romaji: '*Anokusa*',
    meaning: 'That Grass',
    explanation: 'あの草 (*ano kusa*, “that weed/grass”). A tumbleweed ghost.'
  },
  'アノホラグサ': {
    japanese: 'アノホラグサ',
    romaji: '*Anohoragusa*',
    meaning: 'That Horror Grass',
    explanation: 'あの (*ano*, that) + ホラー (horror) + 草 (*kusa*, grass). A haunted tumbleweed.'
  },
  'ノノクラゲ': {
    japanese: 'ノノクラゲ',
    romaji: '*Nonokurage*',
    meaning: 'Imitation Jellyfish',
    explanation: 'のの (*nono*, imitation) + クラゲ (*kurage*, jellyfish). Mushroom jellyfish.'
  },
  'リククラゲ': {
    japanese: 'リククラゲ',
    romaji: '*Rikukurage*',
    meaning: 'Land Jellyfish',
    explanation: '陸 (*riku*, land) + クラゲ (*kurage*, jellyfish). A land fungus jellyfish.'
  },
  'ガケガニ': {
    japanese: 'ガケガニ',
    romaji: '*Gakegani*',
    meaning: 'Cliff Crab',
    explanation: '崖蟹 (*gakegani*). A crab that clings to cliffs.'
  },
  'カプサイジ': {
    japanese: 'カプサイジ',
    romaji: '*Kapusai-ji*',
    meaning: 'Capsaicin + Kid',
    explanation: 'From “capsaicin” (chili compound) + kid. A spicy pepper.'
  },
  'スコヴィラン': {
    japanese: 'スコヴィラン',
    romaji: '*Sukoviran*',
    meaning: 'Scoville + Villain',
    explanation: 'From Scoville scale + villain. A fiery twin-headed pepper.'
  },
  'ベラカス': {
    japanese: 'ベラカス',
    romaji: '*Berakasu*',
    meaning: 'Scarab + Bless',
    explanation: 'From scarab + “bless.” A psychic scarab.'
  },
  'ヒラヒナ': {
    japanese: 'ヒラヒナ',
    romaji: '*Hirahina*',
    meaning: 'Flutter + Chick',
    explanation: 'From “hirahira” (flutter) + 雛 (*hina*, chick). A floating bird chick.'
  },
  'クエスパトラ': {
    japanese: 'クエスパトラ',
    romaji: '*Kuesupatora*',
    meaning: 'Que + Patra',
    explanation: 'From “queso” (question/que) + Cleopatra/ostrich. A psychic ostrich.'
  },
  'カヌチャン': {
    japanese: 'カヌチャン',
    romaji: '*Kanuchan*',
    meaning: 'Hammer Kid',
    explanation: 'From 金槌 (*kanadzuchi*, hammer) + cute -chan. A small hammer fairy.'
  },
  'ナカヌチャン': {
    japanese: 'ナカヌチャン',
    romaji: '*Nakanuchan*',
    meaning: 'Middle Hammer Girl',
    explanation: 'From 中 (*naka*, middle) + hammer + -chan. A growing hammer fairy.'
  },
  'デカヌチャン': {
    japanese: 'デカヌチャン',
    romaji: '*Dekanuchan*',
    meaning: 'Huge Hammer Girl',
    explanation: 'From でかい (*dekai*, huge) + hammer + -chan. A giant hammer fairy.'
  },
  'ウミディグダ': {
    japanese: 'ウミディグダ',
    romaji: '*Umidiguda*',
    meaning: 'Sea Diglett',
    explanation: '海 (*umi*, sea) + Digda (Diglett). A Diglett variant.'
  },
  'ウミトリオ': {
    japanese: 'ウミトリオ',
    romaji: '*Umitorio*',
    meaning: 'Sea Trio',
    explanation: '海 (*umi*, sea) + trio. A Wug-trio.'
  },
  'ナミイルカ': {
    japanese: 'ナミイルカ',
    romaji: '*Namiiruka*',
    meaning: 'Wave Dolphin',
    explanation: '波 (*nami*, wave) + イルカ (*iruka*, dolphin).'
  },
  'イルカマン': {
    japanese: 'イルカマン',
    romaji: '*Irukaman*',
    meaning: 'Dolphin Man',
    explanation: 'イルカ (*iruka*, dolphin) + man. A superhero dolphin.'
  },
  'ブロロン': {
    japanese: 'ブロロン',
    romaji: '*Buroron*',
    meaning: 'Vroom Engine',
    explanation: 'From “vroom” car engine. A motorbike Pokémon.'
  },
  'ブロロローム': {
    japanese: 'ブロロローム',
    romaji: '*Burororōmu*',
    meaning: 'Rev + Vroom',
    explanation: 'Engine revving sound. A bigger motorbike.'
  },
  'モトトカゲ': {
    japanese: 'モトトカゲ',
    romaji: '*Mototokage*',
    meaning: 'Motor Lizard',
    explanation: 'From “motor” + トカゲ (*tokage*, lizard). A ride Pokémon.'
  },
  'ミミズズ': {
    japanese: 'ミミズズ',
    romaji: '*Mimizuzu*',
    meaning: 'Earthworm',
    explanation: 'ミミズ (*mimizu*, earthworm). A steel worm.'
  },
  'キラーメ': {
    japanese: 'キラーメ',
    romaji: '*Kirāme*',
    meaning: 'Glitter + Ore',
    explanation: 'From “glimmer” + ore. A crystal flower.'
  },
  'キラフロル': {
    japanese: 'キラフロル',
    romaji: '*Kirafuroru*',
    meaning: 'Glitter + Floral',
    explanation: 'From “glitter” + floral. A crystal flower.'
  },
  'ボチ': {
    japanese: 'ボチ',
    romaji: '*Bochi*',
    meaning: 'Graveyard',
    explanation: '墓地 (*bochi*, graveyard). A ghost dog.'
  },
  'ハカドッグ': {
    japanese: 'ハカドッグ',
    romaji: '*Hakadoggu*',
    meaning: 'Grave Dog',
    explanation: '墓 (*haka*, grave) + dog. A tombstone ghost dog.'
  },
  'カラミンゴ': {
    japanese: 'カラミンゴ',
    romaji: '*Karamingo*',
    meaning: 'Flamingo + Friend',
    explanation: 'From “flamingo” + amigo. A friend flamingo.'
  },
  'アルクジラ': {
    japanese: 'アルクジラ',
    romaji: '*Arukujira*',
    meaning: 'Walking Whale',
    explanation: '歩く (*aruku*, to walk) + 鯨 (*kujira*, whale). A land-whale.'
  },
  'ハルクジラ': {
    japanese: 'ハルクジラ',
    romaji: '*Harukujira*',
    meaning: 'Big Whale',
    explanation: 'From 巨大 (*haru/haru*, huge) + whale. A massive whale.'
  },
  'ミガルーサ': {
    japanese: 'ミガルーサ',
    romaji: '*Migarūsa*',
    meaning: 'Shedding + Fish',
    explanation: 'From 身替り (*migawari*, shedding) + fish. A self-shedding fish.'
  },
  'ヘイラッシャ': {
    japanese: 'ヘイラッシャ',
    romaji: '*Heirassha*',
    meaning: 'Big Boss Fish',
    explanation: 'From 平 (*hei*, flat/big) + fish. A catfish-like boss.'
  },
  'シャリタツ': {
    japanese: 'シャリタツ',
    romaji: '*Sharitatsu*',
    meaning: 'Sushi Dragon',
    explanation: 'From シャリ (*shari*, sushi rice) + 竜 (*tatsu*, dragon). A sushi-dragon.'
  },
  'コノヨザル': {
    japanese: 'コノヨザル',
    romaji: '*Konoyozaru*',
    meaning: '“This World” + Monkey',
    explanation: 'この世 (*kono yo*, this world) + 猿 (*zaru*, monkey). A beyond-death ape.'
  },
  'ドオー': {
    japanese: 'ドオー',
    romaji: '*Doō*',
    meaning: 'Mud + Whoa',
    explanation: 'From “mud” + exclamation. A big muddy wooper evo.'
  },
  'リキキリン': {
    japanese: 'リキキリン',
    romaji: '*Rikikirin*',
    meaning: 'Strong Giraffe',
    explanation: '力 (*riki*, power) + キリン (*kirin*, giraffe). Palindrome evolution.'
  },
  'ノココッチ': {
    japanese: 'ノココッチ',
    romaji: '*Nokokocchi*',
    meaning: 'Extra Dunsparce',
    explanation: 'From ノコッチ (*Nokocchi*, Dunsparce) + doubling. A longer Dunsparce.'
  },
  'ドドゲザン': {
    japanese: 'ドドゲザン',
    romaji: '*Dodogezan*',
    meaning: 'Prostration + Slash',
    explanation: '土下座 (*dogeza*, kneeling in submission) + 斬 (*zan*, slash). A ruthless samurai king.'
  },
  'イダイナキバ': {
    japanese: 'イダイナキバ',
    romaji: '*Idainakiba*',
    meaning: 'Great Tusk',
    explanation: '偉大 (*idai*, great) + 牙 (*kiba*, tusk). Paradox Donphan.'
  },
  'サケブシッポ': {
    japanese: 'サケブシッポ',
    romaji: '*Sakebushippo*',
    meaning: 'Screaming Tail',
    explanation: '叫ぶ (*sakebu*, to scream) + tail. Paradox Jigglypuff.'
  },
  'アラブルタケ': {
    japanese: 'アラブルタケ',
    romaji: '*Araburutake*',
    meaning: 'Wild Mushroom',
    explanation: '荒ぶる (*araburu*, wild) + mushroom. Paradox Amoonguss.'
  },
  'ハバタクカミ': {
    japanese: 'ハバタクカミ',
    romaji: '*Habatakukami*',
    meaning: 'Fluttering God',
    explanation: '羽ばたく (*habataku*, flutter) + 神 (*kami*, god). Paradox Misdreavus.'
  },
  'チヲハウハネ': {
    japanese: 'チヲハウハネ',
    romaji: '*Chiwohauhane*',
    meaning: 'Ancient Wing',
    explanation: '血 (*chi*, blood) + 羽 (*hane*, wing). Paradox Volcarona.'
  },
  'スナノケガワ': {
    japanese: 'スナノケガワ',
    romaji: '*Sunanokegawa*',
    meaning: 'Sand Fur',
    explanation: '砂 (*suna*, sand) + 毛皮 (*kegawa*, fur). Paradox Magneton.'
  },
  'テツノワダチ': {
    japanese: 'テツノワダチ',
    romaji: '*Tetsunowadachi*',
    meaning: 'Iron Tracks',
    explanation: '鉄 (*tetsu*, iron) + 輪立ち (*wadachi*, wheel track). Paradox Donphan.'
  },
  'テツノツツミ': {
    japanese: 'テツノツツミ',
    romaji: '*Tetsunotsutsumi*',
    meaning: 'Iron Bundle',
    explanation: '鉄 (*tetsu*, iron) + 包み (*tsutsumi*, bundle). Paradox Delibird.'
  },
  'テツノカイナ': {
    japanese: 'テツノカイナ',
    romaji: '*Tetsunokaina*',
    meaning: 'Iron Arms',
    explanation: '鉄 (*tetsu*, iron) + arm. Paradox Hariyama.'
  },
  'テツノコウベ': {
    japanese: 'テツノコウベ',
    romaji: '*Tetsunokōbe*',
    meaning: 'Iron Neck/Head',
    explanation: '鉄 (*tetsu*, iron) + 頸 (*kōbe*, neck/head). Paradox Hydreigon.'
  },
  'テツノドクガ': {
    japanese: 'テツノドクガ',
    romaji: '*Tetsunodokuga*',
    meaning: 'Iron Moth',
    explanation: '鉄 (*tetsu*, iron) + 毒蛾 (*dokuga*, poisonous moth). Paradox Volcarona.'
  },
  'テツノイワオ': {
    japanese: 'テツノイワオ',
    romaji: '*Tetsunoiwao*',
    meaning: 'Iron Boulders',
    explanation: '鉄 (*tetsu*, iron) + 岩男 (*iwao*, rock-man). Paradox Tyranitar.'
  },
  'セビエ': {
    japanese: 'セビエ',
    romaji: '*Sebie*',
    meaning: 'Chill + Bite',
    explanation: 'From “severe” + bite. A chilly dragon.'
  },
  'セゴール': {
    japanese: 'セゴール',
    romaji: '*Segōru*',
    meaning: 'Chill + Goal',
    explanation: 'From “ice” + goal. Mid-stage icy dragon.'
  },
  'セグレイブ': {
    japanese: 'セグレイブ',
    romaji: '*Segureibu*',
    meaning: 'Glacier + Brave',
    explanation: 'From “glacier” + brave. A kaiju-like dragon.'
  },
  'コレクレー': {
    japanese: 'コレクレー',
    romaji: '*Korekure-*',
    meaning: 'Collect + Request',
    explanation: 'From “collect” + くれ (*kure*, please give). A coin ghost.'
  },
  'サーフゴー': {
    japanese: 'サーフゴー',
    romaji: '*Sāfugō*',
    meaning: 'Surf + Gold',
    explanation: 'From “surfing” + gold. A golden surfer.'
  },
  'チオンジェン': {
    japanese: 'チオンジェン',
    romaji: '*Chionjen*',
    meaning: 'Ancient Name',
    explanation: 'Based on Chinese 苦諦 (woe) + 蝉 (cicada). A ruinous snail.'
  },
  'パオジアン': {
    japanese: 'パオジアン',
    romaji: '*Paojian*',
    meaning: 'Leopard + Sword',
    explanation: 'From 豹 (*pao*, leopard) + 剣 (*jian*, sword). A ruinous leopard.'
  },
  'ディンルー': {
    japanese: 'ディンルー',
    romaji: '*Dinru*',
    meaning: 'Vessel + Deer',
    explanation: 'From 鼎 (*ding*, ritual cauldron) + deer. A ruinous moose.'
  },
  'イーユイ': {
    japanese: 'イーユイ',
    romaji: '*Iiyui*',
    meaning: 'Fish + Flame',
    explanation: 'From 魚 (*yu*, fish) + 火 (*yi*, fire). A ruinous goldfish.'
  },
  'トドロクツキ': {
    japanese: 'トドロクツキ',
    romaji: '*Todorokutsuki*',
    meaning: 'Roaring Moon',
    explanation: '轟く (*todoroku*, roar) + 月 (*tsuki*, moon). Paradox Salamence.'
  },
  'テツノブジン': {
    japanese: 'テツノブジン',
    romaji: '*Tetsunobujin*',
    meaning: 'Iron Hero',
    explanation: '鉄 (*tetsu*, iron) + 武人 (*bujin*, warrior). Paradox Gardevoir/Gallade.'
  },
  'コライドン': {
    japanese: 'コライドン',
    romaji: '*Koraidon*',
    meaning: 'Ancient Ride',
    explanation: '古来 (*korai*, ancient) + ride + -don. Legendary past dragon.'
  },
  'ミライドン': {
    japanese: 'ミライドン',
    romaji: '*Miraidon*',
    meaning: 'Future Ride',
    explanation: '未来 (*mirai*, future) + ride + -don. Legendary future dragon.'
  },
  'ウネルミナモ': {
    japanese: 'ウネルミナモ',
    romaji: '*Uneruminamo*',
    meaning: 'Rippled Water Surface',
    explanation: '畝る (*uneru*, ripple) + 水面 (*minamo*, water surface). Paradox Suicune.'
  },
  'テツノイサハ': {
    japanese: 'テツノイサハ',
    romaji: '*Tetsunoisaha*',
    meaning: 'Iron Leaves',
    explanation: '鉄 (*tetsu*, iron) + leaves. Paradox Virizion.'
  },
  'カミツオロチ': {
    japanese: 'カミツオロチ',
    romaji: '*Kamitsurochi*',
    meaning: 'God + Yamata-no-Orochi (Serpent)',
    explanation: 'From 神 (*kami*, god) + 八岐大蛇 (*yamata no orochi*, serpent). Candy apple serpent.'
  },
  'チャデス': {
    japanese: 'チャデス',
    romaji: '*Chadesu*',
    meaning: 'Tea + Death',
    explanation: '茶 (*cha*, tea) + death. A haunted tea bowl.'
  },
  'ヤバソチャ': {
    japanese: 'ヤバソチャ',
    romaji: '*Yabasocha*',
    meaning: 'Dangerous + Tea',
    explanation: 'やばい (*yabai*, strange/dangerous) + 茶 (*ocha*, tea). Haunted tea pot.'
  },
  'イイネイヌ': {
    japanese: 'イイネイヌ',
    romaji: '*Iineinu*',
    meaning: 'Good Dog',
    explanation: 'いいね (*iine*, good) + 犬 (*inu*, dog). Loyal dog.'
  },
  'マシマシラ': {
    japanese: 'マシマシラ',
    romaji: '*Mashimashira*',
    meaning: 'Evil Monkey',
    explanation: 'From 真っ黒 (*makkuro*, dark) + 猿 (*saru*, monkey). A scheming monkey.'
  },
  'キチキギス': {
    japanese: 'キチキギス',
    romaji: '*Kichikigisu*',
    meaning: 'Pheasant + Mischief',
    explanation: 'From 雉 (*kiji*, pheasant) + sound play. A flashy bird.'
  },
  'オーガポン': {
    japanese: 'オーガポン',
    romaji: '*Ōgapon*',
    meaning: 'Ogre + Mask',
    explanation: 'From “ogre” + mask. A masked ogre spirit.'
  },
  'ブリジュラス': {
    japanese: 'ブリジュラス',
    romaji: '*Burijurasu*',
    meaning: 'Bridge + Duraludon',
    explanation: 'From “bridge” + Duraludon. A suspension-bridge dragon.'
  },
  'カグヤドン': {
    japanese: 'カグヤドン',
    romaji: '*Kaguyadon*',
    meaning: 'Kaguya + Fire',
    explanation: 'From 火 (*hi*) + legend. Paradox Entei.'
  },
  'テツノカミ': {
    japanese: 'テツノカミ',
    romaji: '*Tetsunokami*',
    meaning: 'Iron God',
    explanation: '鉄 (*tetsu*, iron) + 神 (*kami*, god). Paradox Raikou.'
  },
  'テツノイワ': {
    japanese: 'テツノイワ',
    romaji: '*Tetsunoiwa*',
    meaning: 'Iron Boulder',
    explanation: '鉄 (*tetsu*, iron) + 岩 (*iwa*, rock). Paradox Terrakion.'
  },
  'テツノカンムリ': {
    japanese: 'テツノカンムリ',
    romaji: '*Tetsunokan-muri*',
    meaning: 'Iron Crown',
    explanation: '鉄 (*tetsu*, iron) + 冠 (*kanmuri*, crown). Paradox Cobalion.'
  },
  'テラパゴス': {
    japanese: 'テラパゴス',
    romaji: '*Terapagosu*',
    meaning: 'Terastal + Tortoise',
    explanation: 'From “terastal” + tortoise. A crystal turtle.'
  },
  'モモロウ': {
    japanese: 'モモロウ',
    romaji: '*Momorō*',
    meaning: 'Peach + Servant',
    explanation: '桃 (*momo*, peach) + servant suffix. A peach-bound chain ghost.'
  },
}

export function getJapaneseNameInfo(japaneseName: string): JapaneseNameInfo | null {
  return japaneseNames[japaneseName] || null
}

// Pokemon ID to Japanese name mapping (Gen 1-9)
const pokemonIdToJapanese: Record<number, string> = {
  1: 'フシギダネ',    // Bulbasaur
  2: 'フシギソウ',    // Ivysaur
  3: 'フシギバナ',    // Venusaur
  4: 'ヒトカゲ',    // Charmander
  5: 'リザード',    // Charmeleon
  6: 'リザードン',    // Charizard
  7: 'ゼニガメ',    // Squirtle
  8: 'カメール',    // Wartortle
  9: 'カメックス',    // Blastoise
  10: 'キャタピー',    // Caterpie
  11: 'トランセル',    // Metapod
  12: 'バタフリー',    // Butterfree
  13: 'ビードル',    // Weedle
  14: 'コクーン',    // Kakuna
  15: 'スピアー',    // Beedrill
  16: 'ポッポ',    // Pidgey
  17: 'ピジョン',    // Pidgeotto
  18: 'ピジョット',    // Pidgeot
  19: 'コラッタ',    // Rattata
  20: 'ラッタ',    // Raticate
  21: 'オニスズメ',    // Spearow
  22: 'オニドリル',    // Fearow
  23: 'アーボ',    // Ekans
  24: 'アーボック',    // Arbok
  25: 'ピカチュウ',    // Pikachu
  26: 'ライチュウ',    // Raichu
  27: 'サンド',    // Sandshrew
  28: 'サンドパン',    // Sandslash
  29: 'ニドラン♀',    // Nidoran♀
  30: 'ニドリーナ',    // Nidorina
  31: 'ニドクイン',    // Nidoqueen
  32: 'ニドラン♂',    // Nidoran♂
  33: 'ニドリーノ',    // Nidorino
  34: 'ニドキング',    // Nidoking
  35: 'ピッピ',    // Clefairy
  36: 'ピクシー',    // Clefable
  37: 'ロコン',    // Vulpix
  38: 'キュウコン',    // Ninetales
  39: 'プリン',    // Jigglypuff
  40: 'プクリン',    // Wigglytuff
  41: 'ズバット',    // Zubat
  42: 'ゴルバット',    // Golbat
  43: 'ナゾノクサ',    // Oddish
  44: 'クサイハナ',    // Gloom
  45: 'ラフレシア',    // Vileplume
  46: 'パラス',    // Paras
  47: 'パラセクト',    // Parasect
  48: 'コンパン',    // Venonat
  49: 'モルフォン',    // Venomoth
  50: 'ディグダ',    // Diglett
  51: 'ダグトリオ',    // Dugtrio
  52: 'ニャース',    // Meowth
  53: 'ペルシアン',    // Persian
  54: 'コダック',    // Psyduck
  55: 'ゴルダック',    // Golduck
  56: 'マンキー',    // Mankey
  57: 'オコリザル',    // Primeape
  58: 'ガーディ',    // Growlithe
  59: 'ウインディ',    // Arcanine
  60: 'ニョロモ',    // Poliwag
  61: 'ニョロゾ',    // Poliwhirl
  62: 'ニョロボン',    // Poliwrath
  63: 'ケーシィ',    // Abra
  64: 'ユンゲラー',    // Kadabra
  65: 'フーディン',    // Alakazam
  66: 'ワンリキー',    // Machop
  67: 'ゴーリキー',    // Machoke
  68: 'カイリキー',    // Machamp
  69: 'マダツボミ',    // Bellsprout
  70: 'ウツドン',    // Weepinbell
  71: 'ウツボット',    // Victreebel
  72: 'メノクラゲ',    // Tentacool
  73: 'ドククラゲ',    // Tentacruel
  74: 'イシツブテ',    // Geodude
  75: 'ゴローン',    // Graveler
  76: 'ゴローニャ',    // Golem
  77: 'ポニータ',    // Ponyta
  78: 'ギャロップ',    // Rapidash
  79: 'ヤドン',    // Slowpoke
  80: 'ヤドラン',    // Slowbro
  81: 'コイル',    // Magnemite
  82: 'レアコイル',    // Magneton
  83: 'カモネギ',    // Farfetch'd
  84: 'ドードー',    // Doduo
  85: 'ドードリオ',    // Dodrio
  86: 'パウワウ',    // Seel
  87: 'ジュゴン',    // Dewgong
  88: 'ベトベター',    // Grimer
  89: 'ベトベトン',    // Muk
  90: 'シェルダー',    // Shellder
  91: 'パルシェン',    // Cloyster
  92: 'ゴース',    // Gastly
  93: 'ゴースト',    // Haunter
  94: 'ゲンガー',    // Gengar
  95: 'イワーク',    // Onix
  96: 'スリープ',    // Drowzee
  97: 'スリーパー',    // Hypno
  98: 'クラブ',    // Krabby
  99: 'キングラー',    // Kingler
  100: 'ビリリダマ',    // Voltorb
  101: 'マルマイン',    // Electrode
  102: 'タマタマ',    // Exeggcute
  103: 'ナッシー',    // Exeggutor
  104: 'カラカラ',    // Cubone
  105: 'ガラガラ',    // Marowak
  106: 'サワムラー',    // Hitmonlee
  107: 'エビワラー',    // Hitmonchan
  108: 'ベロリンガ',    // Lickitung
  109: 'ドガース',    // Koffing
  110: 'マタドガス',    // Weezing
  111: 'サイホーン',    // Rhyhorn
  112: 'サイドン',    // Rhydon
  113: 'ラッキー',    // Chansey
  114: 'モンジャラ',    // Tangela
  115: 'ガルーラ',    // Kangaskhan
  116: 'タッツー',    // Horsea
  117: 'シードラ',    // Seadra
  118: 'トサキント',    // Goldeen
  119: 'アズマオウ',    // Seaking
  120: 'ヒトデマン',    // Staryu
  121: 'スターミー',    // Starmie
  122: 'バリヤード',    // Mr. Mime
  123: 'ストライク',    // Scyther
  124: 'ルージュラ',    // Jynx
  125: 'エレブー',    // Electabuzz
  126: 'ブーバー',    // Magmar
  127: 'カイロス',    // Pinsir
  128: 'ケンタロス',    // Tauros
  129: 'コイキング',    // Magikarp
  130: 'ギャラドス',    // Gyarados
  131: 'ラプラス',    // Lapras
  132: 'メタモン',    // Ditto
  133: 'イーブイ',    // Eevee
  134: 'シャワーズ',    // Vaporeon
  135: 'サンダース',    // Jolteon
  136: 'ブースター',    // Flareon
  137: 'ポリゴン',    // Porygon
  138: 'オムナイト',    // Omanyte
  139: 'オムスター',    // Omastar
  140: 'カブト',    // Kabuto
  141: 'カブトプス',    // Kabutops
  142: 'プテラ',    // Aerodactyl
  143: 'カビゴン',    // Snorlax
  144: 'フリーザー',    // Articuno
  145: 'サンダー',    // Zapdos
  146: 'ファイヤー',    // Moltres
  147: 'ミニリュウ',    // Dratini
  148: 'ハクリュー',    // Dragonair
  149: 'カイリュー',    // Dragonite
  150: 'ミュウツー',    // Mewtwo
  151: 'ミュウ',    // Mew
  152: 'チコリータ',    // Chikorita
  153: 'ベイリーフ',    // Bayleef
  154: 'メガニウム',    // Meganium
  155: 'ヒノアラシ',    // Cyndaquil
  156: 'マグマラシ',    // Quilava
  157: 'バクフーン',    // Typhlosion
  158: 'ワニノコ',    // Totodile
  159: 'アリゲイツ',    // Croconaw
  160: 'オーダイル',    // Feraligatr
  161: 'オタチ',    // Sentret
  162: 'オオタチ',    // Furret
  163: 'ホーホー',    // Hoothoot
  164: 'ヨルノズク',    // Noctowl
  165: 'レディバ',    // Ledyba
  166: 'レディアン',    // Ledian
  167: 'イトマル',    // Spinarak
  168: 'アリアドス',    // Ariados
  169: 'クロバット',    // Crobat
  171: 'ランターン',    // Lanturn
  172: 'ピチュー',    // Pichu
  173: 'ピィ',    // Cleffa
  174: 'ププリン',    // Igglybuff
  175: 'トゲピー',    // Togepi
  176: 'トゲチック',    // Togetic
  177: 'ネイティ',    // Natu
  178: 'ネイティオ',    // Xatu
  179: 'メリープ',    // Mareep
  180: 'モココ',    // Flaaffy
  181: 'デンリュウ',    // Ampharos
  182: 'キレイハナ',    // Bellossom
  183: 'マリル',    // Marill
  184: 'マリルリ',    // Azumarill
  185: 'ウソッキー',    // Sudowoodo
  186: 'ニョロトノ',    // Politoed
  187: 'ハネッコ',    // Hoppip
  188: 'ポポッコ',    // Skiploom
  189: 'ワタッコ',    // Jumpluff
  190: 'エイパム',    // Aipom
  191: 'ヒマナッツ',    // Sunkern
  192: 'キマワリ',    // Sunflora
  193: 'ヤンヤンマ',    // Yanma
  194: 'ウパー',    // Wooper
  195: 'ヌオー',    // Quagsire
  196: 'エーフィ',    // Espeon
  197: 'ブラッキー',    // Umbreon
  198: 'ヤミカラス',    // Murkrow
  199: 'ヤドキング',    // Slowking
  200: 'ムウマ',    // Misdreavus
  201: 'アンノーン',    // Unown
  202: 'ソーナンス',    // Wobbuffet
  203: 'キリンリキ',    // Girafarig
  204: 'クヌギダマ',    // Pineco
  205: 'フォレトス',    // Forretress
  206: 'ノコッチ',    // Dunsparce
  207: 'グライガー',    // Gligar
  208: 'ハガネール',    // Steelix
  209: 'ブルー',    // Snubbull
  210: 'グランブル',    // Granbull
  211: 'ハリーセン',    // Qwilfish
  212: 'ハッサム',    // Scizor
  213: 'ツボツボ',    // Shuckle
  214: 'ヘラクロス',    // Heracross
  215: 'ニューラ',    // Sneasel
  216: 'ヒメグマ',    // Teddiursa
  217: 'リングマ',    // Ursaring
  218: 'マグマッグ',    // Slugma
  219: 'マグカルゴ',    // Magcargo
  220: 'ウリムー',    // Swinub
  221: 'イノムー',    // Piloswine
  222: 'サニーゴ',    // Corsola
  223: 'テッポウオ',    // Remoraid
  224: 'オクタン',    // Octillery
  225: 'デリバード',    // Delibird
  226: 'マンタイン',    // Mantine
  227: 'エアームド',    // Skarmory
  228: 'デルビル',    // Houndour
  229: 'ヘルガー',    // Houndoom
  230: 'キングドラ',    // Kingdra
  231: 'ゴマゾウ',    // Phanpy
  232: 'ドンファン',    // Donphan
  233: 'ポリゴン２',    // Porygon2
  234: 'オドシシ',    // Stantler
  235: 'ドーブル',    // Smeargle
  236: 'バルキー',    // Tyrogue
  237: 'カポエラー',    // Hitmontop
  238: 'ムチュール',    // Smoochum
  239: 'エレキッド',    // Elekid
  240: 'ブビィ',    // Magby
  241: 'ミルタンク',    // Miltank
  242: 'ハピナス',    // Blissey
  243: 'ライコウ',    // Raikou
  244: 'エンテイ',    // Entei
  245: 'スイクン',    // Suicune
  246: 'ヨーギラス',    // Larvitar
  247: 'サナギラス',    // Pupitar
  248: 'バンギラス',    // Tyranitar
  249: 'ルギア',    // Lugia
  250: 'ホウオウ',    // Ho-Oh
  251: 'セレビィ',    // Celebi
  252: 'キモリ',    // Treecko
  253: 'ジュプトル',    // Grovyle
  254: 'ジュカイン',    // Sceptile
  255: 'アチャモ',    // Torchic
  256: 'ワカシャモ',    // Combusken
  257: 'バシャーモ',    // Blaziken
  258: 'ミズゴロウ',    // Mudkip
  259: 'ヌマクロー',    // Marshtomp
  260: 'ラグラージ',    // Swampert
  261: 'ポチエナ',    // Poochyena
  262: 'グラエナ',    // Mightyena
  263: 'ジグザグマ',    // Zigzagoon
  264: 'マッスグマ',    // Linoone
  265: 'ケムッソ',    // Wurmple
  266: 'カラサリス',    // Silcoon
  267: 'アゲハント',    // Beautifly
  268: 'マユルド',    // Cascoon
  269: 'ドクケイル',    // Dustox
  270: 'ハスボー',    // Lotad
  271: 'ハスブレロ',    // Lombre
  272: 'ルンパッパ',    // Ludicolo
  273: 'タネボー',    // Seedot
  274: 'コノハナ',    // Nuzleaf
  275: 'ダーテング',    // Shiftry
  276: 'スバメ',    // Taillow
  277: 'オオスバメ',    // Swellow
  278: 'キャモメ',    // Wingull
  279: 'ペリッパー',    // Pelipper
  280: 'ラルトス',    // Ralts
  281: 'キルリア',    // Kirlia
  282: 'サーナイト',    // Gardevoir
  283: 'アメタマ',    // Surskit
  284: 'アメモース',    // Masquerain
  285: 'キノココ',    // Shroomish
  286: 'キノガッサ',    // Breloom
  287: 'ナマケロ',    // Slakoth
  288: 'ヤルキモノ',    // Vigoroth
  289: 'ケッキング',    // Slaking
  290: 'ツチニン',    // Nincada
  291: 'テッカニン',    // Ninjask
  292: 'ヌケニン',    // Shedinja
  293: 'ゴニョニョ',    // Whismur
  294: 'ドゴーム',    // Loudred
  295: 'バクオング',    // Exploud
  296: 'マクノシタ',    // Makuhita
  297: 'ハリテヤマ',    // Hariyama
  298: 'ルリリ',    // Azurill
  299: 'ノズパス',    // Nosepass
  300: 'エネコ',    // Skitty
  301: 'エネコロロ',    // Delcatty
  302: 'ヤミラミ',    // Sableye
  303: 'クチート',    // Mawile
  304: 'ココドラ',    // Aron
  305: 'コドラ',    // Lairon
  306: 'ボスゴドラ',    // Aggron
  307: 'アサナン',    // Meditite
  308: 'チャーレム',    // Medicham
  309: 'ラクライ',    // Electrike
  310: 'ライボルト',    // Manectric
  311: 'プラスル',    // Plusle
  312: 'マイナン',    // Minun
  313: 'バルビート',    // Volbeat
  314: 'イルミーゼ',    // Illumise
  315: 'ロゼリア',    // Roselia
  316: 'ゴクリン',    // Gulpin
  317: 'マルノーム',    // Swalot
  318: 'キバニア',    // Carvanha
  319: 'サメハダー',    // Sharpedo
  320: 'ホエルコ',    // Wailmer
  321: 'ホエルオー',    // Wailord
  322: 'ドンメル',    // Numel
  323: 'バクーダ',    // Camerupt
  324: 'コータス',    // Torkoal
  325: 'バネブー',    // Spoink
  326: 'ブーピッグ',    // Grumpig
  327: 'パッチール',    // Spinda
  328: 'ナックラー',    // Trapinch
  329: 'ビブラーバ',    // Vibrava
  330: 'フライゴン',    // Flygon
  331: 'サボネア',    // Cacnea
  332: 'ノクタス',    // Cacturne
  333: 'チルット',    // Swablu
  334: 'チルタリス',    // Altaria
  335: 'ザングース',    // Zangoose
  336: 'ハブネーク',    // Seviper
  337: 'ルナトーン',    // Lunatone
  338: 'ソルロック',    // Solrock
  339: 'ドジョッチ',    // Barboach
  340: 'ナマズン',    // Whiscash
  341: 'ヘイガニ',    // Corphish
  342: 'シザリガー',    // Crawdaunt
  343: 'ヤジロン',    // Baltoy
  344: 'ネンドール',    // Claydol
  345: 'リリーラ',    // Lileep
  346: 'ユレイドル',    // Cradily
  347: 'アノプス',    // Anorith
  348: 'アーマルド',    // Armaldo
  349: 'ヒンバス',    // Feebas
  350: 'ミロカロス',    // Milotic
  351: 'ポワルン',    // Castform
  352: 'カクレオン',    // Kecleon
  353: 'カゲボウズ',    // Shuppet
  354: 'ジュペッタ',    // Banette
  355: 'ヨマワル',    // Duskull
  356: 'サマヨール',    // Dusclops
  357: 'トロピウス',    // Tropius
  358: 'チリーン',    // Chimecho
  359: 'アブソル',    // Absol
  360: 'ソーナノ',    // Wynaut
  361: 'ユキワラシ',    // Snorunt
  362: 'オニゴーリ',    // Glalie
  363: 'タマザラシ',    // Spheal
  364: 'トドグラー',    // Sealeo
  365: 'トドゼルガ',    // Walrein
  366: 'パールル',    // Clamperl
  367: 'ハンテール',    // Huntail
  368: 'サクラビス',    // Gorebyss
  369: 'ジーランス',    // Relicanth
  370: 'ラブカス',    // Luvdisc
  371: 'タツベイ',    // Bagon
  372: 'コモルー',    // Shelgon
  373: 'ボーマンダ',    // Salamence
  374: 'ダンバル',    // Beldum
  375: 'メタング',    // Metang
  376: 'メタグロス',    // Metagross
  377: 'レジロック',    // Regirock
  378: 'レジアイス',    // Regice
  379: 'レジスチル',    // Registeel
  380: 'ラティアス',    // Latias
  381: 'ラティオス',    // Latios
  382: 'カイオーガ',    // Kyogre
  383: 'グラードン',    // Groudon
  384: 'レックウザ',    // Rayquaza
  385: 'ジラーチ',    // Jirachi
  386: 'デオキシス',    // Deoxys
  387: 'ナエトル',    // Turtwig
  388: 'ハヤシガメ',    // Grotle
  389: 'ドダイトス',    // Torterra
  390: 'ヒコザル',    // Chimchar
  391: 'モウカザル',    // Monferno
  392: 'ゴウカザル',    // Infernape
  393: 'ポッチャマ',    // Piplup
  394: 'ポッタイシ',    // Prinplup
  395: 'エンペルト',    // Empoleon
  396: 'ムックル',    // Starly
  397: 'ムクバード',    // Staravia
  398: 'ムクホーク',    // Staraptor
  399: 'ビッパ',    // Bidoof
  400: 'ビーダル',    // Bibarel
  401: 'コロボーシ',    // Kricketot
  402: 'コロトック',    // Kricketune
  403: 'コリンク',    // Shinx
  404: 'ルクシオ',    // Luxio
  405: 'レントラー',    // Luxray
  406: 'スボミー',    // Budew
  407: 'ロズレイド',    // Roserade
  408: 'ズガイドス',    // Cranidos
  409: 'ラムパルド',    // Rampardos
  410: 'タテトプス',    // Shieldon
  411: 'トリデプス',    // Bastiodon
  412: 'ミノムッチ',    // Burmy
  413: 'ミノマダム',    // Wormadam
  414: 'ガーメイル',    // Mothim
  415: 'ミツハニー',    // Combee
  416: 'ビークイン',    // Vespiquen
  417: 'パチリス',    // Pachirisu
  418: 'ブイゼル',    // Buizel
  419: 'フローゼル',    // Floatzel
  420: 'チェリンボ',    // Cherubi
  421: 'チェリム',    // Cherrim
  422: 'カラナクシ',    // Shellos
  423: 'トリトドン',    // Gastrodon
  424: 'エテボース',    // Ambipom
  425: 'フワンテ',    // Drifloon
  426: 'フワライド',    // Drifblim
  427: 'ミミロル',    // Buneary
  428: 'ミミロップ',    // Lopunny
  429: 'ムウマージ',    // Mismagius
  430: 'ドンカラス',    // Honchkrow
  431: 'ニャルマー',    // Glameow
  432: 'ブニャット',    // Purugly
  433: 'リーシャン',    // Chingling
  434: 'スカンプー',    // Stunky
  435: 'スカタンク',    // Skuntank
  436: 'ドーミラー',    // Bronzor
  437: 'ドータクン',    // Bronzong
  438: 'ウソハチ',    // Bonsly
  439: 'マネネ',    // Mime Jr.
  440: 'ピンプク',    // Happiny
  441: 'ペラップ',    // Chatot
  442: 'ミカルゲ',    // Spiritomb
  443: 'フカマル',    // Gible
  444: 'ガバイト',    // Gabite
  445: 'ガブリアス',    // Garchomp
  446: 'ゴンベ',    // Munchlax
  447: 'リオル',    // Riolu
  448: 'ルカリオ',    // Lucario
  449: 'ヒポポタス',    // Hippopotas
  450: 'カバルドン',    // Hippowdon
  451: 'スコルピ',    // Skorupi
  452: 'ドラピオン',    // Drapion
  453: 'グレッグル',    // Croagunk
  454: 'ドクロッグ',    // Toxicroak
  455: 'マスキッパ',    // Carnivine
  456: 'ケイコウオ',    // Finneon
  457: 'ネオラント',    // Lumineon
  458: 'タマンタ',    // Mantyke
  459: 'ユキカブリ',    // Snover
  460: 'ユキノオー',    // Abomasnow
  461: 'マニューラ',    // Weavile
  462: 'ジバコイル',    // Magnezone
  463: 'ベロベルト',    // Lickilicky
  464: 'ドサイドン',    // Rhyperior
  465: 'モジャンボ',    // Tangrowth
  466: 'エレキブル',    // Electivire
  467: 'ブーバーン',    // Magmortar
  468: 'トゲキッス',    // Togekiss
  469: 'メガヤンマ',    // Yanmega
  470: 'リーフィア',    // Leafeon
  471: 'グレイシア',    // Glaceon
  472: 'グライオン',    // Gliscor
  473: 'マンムー',    // Mamoswine
  474: 'ポリゴンＺ',    // Porygon-Z
  475: 'エルレイド',    // Gallade
  476: 'ダイノーズ',    // Probopass
  477: 'ヨノワール',    // Dusknoir
  478: 'ユキメノコ',    // Froslass
  479: 'ロトム',    // Rotom
  480: 'ユクシー',    // Uxie
  481: 'エムリット',    // Mesprit
  482: 'アグノム',    // Azelf
  483: 'ディアルガ',    // Dialga
  484: 'パルキア',    // Palkia
  485: 'ヒードラン',    // Heatran
  486: 'レジギガス',    // Regigigas
  487: 'ギラティナ',    // Giratina
  488: 'クレセリア',    // Cresselia
  489: 'フィオネ',    // Phione
  490: 'マナフィ',    // Manaphy
  491: 'ダークライ',    // Darkrai
  492: 'シェイミ',    // Shaymin
  493: 'アルセウス',    // Arceus
  494: 'ビクティニ',    // Victini
  495: 'ツタージャ',    // Snivy
  496: 'ジャノビー',    // Servine
  497: 'ジャローダ',    // Serperior
  498: 'ポカブ',    // Tepig
  499: 'チャオブー',    // Pignite
  500: 'エンブオー',    // Emboar
  501: 'ミジュマル',    // Oshawott
  502: 'フタチマル',    // Dewott
  503: 'ダイケンキ',    // Samurott
  504: 'ミネズミ',    // Patrat
  505: 'ミルホッグ',    // Watchog
  506: 'ヨーテリー',    // Lillipup
  507: 'ハーデリア',    // Herdier
  508: 'ムーランド',    // Stoutland
  509: 'チョロネコ',    // Purrloin
  510: 'レパルダス',    // Liepard
  511: 'ヤナップ',    // Pansage
  512: 'ヤナッキー',    // Simisage
  513: 'バオップ',    // Pansear
  514: 'バオッキー',    // Simisear
  515: 'ヒヤップ',    // Panpour
  516: 'ヒヤッキー',    // Simipour
  517: 'ムンナ',    // Munna
  518: 'ムシャーナ',    // Musharna
  519: 'マメパト',    // Pidove
  520: 'ハトーボー',    // Tranquill
  521: 'ケンホロウ',    // Unfezant
  522: 'シママ',    // Blitzle
  523: 'ゼブライカ',    // Zebstrika
  524: 'ダンゴロ',    // Roggenrola
  525: 'ガントル',    // Boldore
  526: 'ギガイアス',    // Gigalith
  527: 'コロモリ',    // Woobat
  528: 'ココロモリ',    // Swoobat
  529: 'モグリュー',    // Drilbur
  530: 'ドリュウズ',    // Excadrill
  531: 'タブンネ',    // Audino
  532: 'ドッコラー',    // Timburr
  533: 'ドテッコツ',    // Gurdurr
  534: 'ローブシン',    // Conkeldurr
  535: 'オタマロ',    // Tympole
  536: 'ガマガル',    // Palpitoad
  537: 'ガマゲロゲ',    // Seismitoad
  538: 'ナゲキ',    // Throh
  539: 'ダゲキ',    // Sawk
  540: 'クルミル',    // Sewaddle
  541: 'クルマユ',    // Swadloon
  542: 'ハハコモリ',    // Leavanny
  543: 'フシデ',    // Venipede
  544: 'ホイーガ',    // Whirlipede
  545: 'ペンドラー',    // Scolipede
  546: 'モンメン',    // Cottonee
  547: 'エルフーン',    // Whimsicott
  548: 'チュリネ',    // Petilil
  549: 'ドレディア',    // Lilligant
  550: 'バスラオ',    // Basculin
  551: 'メグロコ',    // Sandile
  552: 'ワルビル',    // Krokorok
  553: 'ワルビアル',    // Krookodile
  554: 'ダルマッカ',    // Darumaka
  555: 'ヒヒダルマ',    // Darmanitan
  556: 'マラカッチ',    // Maractus
  557: 'イシズマイ',    // Dwebble
  558: 'イワパレス',    // Crustle
  559: 'ズルッグ',    // Scraggy
  560: 'ズルズキン',    // Scrafty
  561: 'シンボラー',    // Sigilyph
  562: 'デスマス',    // Yamask
  563: 'デスカーン',    // Cofagrigus
  564: 'プロトーガ',    // Tirtouga
  565: 'アバゴーラ',    // Carracosta
  566: 'アーケン',    // Archen
  567: 'アーケオス',    // Archeops
  568: 'ヤブクロン',    // Trubbish
  569: 'ダストダス',    // Garbodor
  570: 'ゾロア',    // Zorua
  571: 'ゾロアーク',    // Zoroark
  572: 'チラーミィ',    // Minccino
  573: 'チラチーノ',    // Cinccino
  574: 'ゴチム',    // Gothita
  575: 'ゴチミル',    // Gothorita
  576: 'ゴチルゼル',    // Gothitelle
  577: 'ユニラン',    // Solosis
  578: 'ダブラン',    // Duosion
  579: 'ランクルス',    // Reuniclus
  580: 'コアルヒー',    // Ducklett
  581: 'スワンナ',    // Swanna
  582: 'バニプッチ',    // Vanillite
  583: 'バニリッチ',    // Vanillish
  584: 'バイバニラ',    // Vanilluxe
  585: 'シキジカ',    // Deerling
  586: 'メブキジカ',    // Sawsbuck
  587: 'エモンガ',    // Emolga
  588: 'カブルモ',    // Karrablast
  589: 'シュバルゴ',    // Escavalier
  590: 'タマゲタケ',    // Foongus
  591: 'モロバレル',    // Amoonguss
  592: 'プルリル',    // Frillish
  593: 'ブルンゲル',    // Jellicent
  594: 'ママンボウ',    // Alomomola
  595: 'バチュル',    // Joltik
  596: 'デンチュラ',    // Galvantula
  597: 'テッシード',    // Ferroseed
  598: 'ナットレイ',    // Ferrothorn
  599: 'ギアル',    // Klink
  600: 'ギギアル',    // Klang
  601: 'ギギギアル',    // Klinklang
  602: 'シビシラス',    // Tynamo
  603: 'シビビール',    // Eelektrik
  604: 'シビルドン',    // Eelektross
  605: 'リグレー',    // Elgyem
  606: 'オーベム',    // Beheeyem
  607: 'ヒトモシ',    // Litwick
  608: 'ランプラー',    // Lampent
  609: 'シャンデラ',    // Chandelure
  610: 'キバゴ',    // Axew
  611: 'オノンド',    // Fraxure
  612: 'オノノクス',    // Haxorus
  613: 'クマシュン',    // Cubchoo
  614: 'ツンベアー',    // Beartic
  615: 'フリージオ',    // Cryogonal
  616: 'チョボマキ',    // Shelmet
  617: 'アギルダー',    // Accelgor
  618: 'マッギョ',    // Stunfisk
  619: 'コジョフー',    // Mienfoo
  620: 'コジョンド',    // Mienshao
  621: 'クリムガン',    // Druddigon
  622: 'ゴビット',    // Golett
  623: 'ゴルーグ',    // Golurk
  624: 'コマタナ',    // Pawniard
  625: 'キリキザン',    // Bisharp
  626: 'バッフロン',    // Bouffalant
  627: 'ワシボン',    // Rufflet
  628: 'ウォーグル',    // Braviary
  629: 'バルチャイ',    // Vullaby
  630: 'バルジーナ',    // Mandibuzz
  631: 'クイタラン',    // Heatmor
  632: 'アイアント',    // Durant
  633: 'モノズ',    // Deino
  634: 'ジヘッド',    // Zweilous
  635: 'サザンドラ',    // Hydreigon
  636: 'メラルバ',    // Larvesta
  637: 'ウルガモス',    // Volcarona
  638: 'コバルオン',    // Cobalion
  639: 'テラキオン',    // Terrakion
  640: 'ビリジオン',    // Virizion
  641: 'トルネロス',    // Tornadus
  642: 'ボルトロス',    // Thundurus
  643: 'レシラム',    // Reshiram
  644: 'ゼクロム',    // Zekrom
  645: 'ランドロス',    // Landorus
  646: 'キュレム',    // Kyurem
  647: 'ケルディオ',    // Keldeo
  648: 'メロエッタ',    // Meloetta
  649: 'ゲノセクト',    // Genesect
  650: 'ハリマロン',    // Chespin
  651: 'ハリボーグ',    // Quilladin
  652: 'ブリガロン',    // Chesnaught
  653: 'フォッコ',    // Fennekin
  654: 'テールナー',    // Braixen
  655: 'マフォクシー',    // Delphox
  656: 'ケロマツ',    // Froakie
  657: 'ゲコガシラ',    // Frogadier
  658: 'ゲッコウガ',    // Greninja
  659: 'ホルビー',    // Bunnelby
  660: 'ホルード',    // Diggersby
  661: 'ヤヤコマ',    // Fletchling
  662: 'ヒノヤコマ',    // Fletchinder
  663: 'ファイアロー',    // Talonflame
  664: 'コフキムシ',    // Scatterbug
  665: 'コフーライ',    // Spewpa
  666: 'ビビヨン',    // Vivillon
  667: 'シシコ',    // Litleo
  668: 'カエンジシ',    // Pyroar
  669: 'フラベベ',    // Flabébé
  670: 'フラエッテ',    // Floette
  671: 'フラージェス',    // Florges
  672: 'メェークル',    // Skiddo
  673: 'ゴーゴート',    // Gogoat
  674: 'ヤンチャム',    // Pancham
  675: 'ゴロンダ',    // Pangoro
  676: 'トリミアン',    // Furfrou
  677: 'ニャスパー',    // Espurr
  678: 'ニャオニクス',    // Meowstic
  679: 'ヒトツキ',    // Honedge
  680: 'ニダンギル',    // Doublade
  681: 'ギルガルド',    // Aegislash
  682: 'シュシュプ',    // Spritzee
  683: 'フレフワン',    // Aromatisse
  684: 'ペロッパフ',    // Swirlix
  685: 'ペロリーム',    // Slurpuff
  686: 'マーイーカ',    // Inkay
  687: 'カラマネロ',    // Malamar
  688: 'カメテテ',    // Binacle
  689: 'ガメノデス',    // Barbaracle
  690: 'クズモー',    // Skrelp
  691: 'ドラミドロ',    // Dragalge
  692: 'ウデッポウ',    // Clauncher
  693: 'ブロスター',    // Clawitzer
  694: 'エリキテル',    // Helioptile
  695: 'エレザード',    // Heliolisk
  696: 'チゴラス',    // Tyrunt
  697: 'ガチゴラス',    // Tyrantrum
  698: 'アマルス',    // Amaura
  699: 'アマルルガ',    // Aurorus
  700: 'ニンフィア',    // Sylveon
  701: 'ルチャブル',    // Hawlucha
  702: 'デデンネ',    // Dedenne
  703: 'メレシー',    // Carbink
  704: 'ヌメラ',    // Goomy
  705: 'ヌメイル',    // Sliggoo
  706: 'ヌメルゴン',    // Goodra
  707: 'クレッフィ',    // Klefki
  708: 'ボクレー',    // Phantump
  709: 'オーロット',    // Trevenant
  710: 'バケッチャ',    // Pumpkaboo
  711: 'パンプジン',    // Gourgeist
  712: 'カチコール',    // Bergmite
  713: 'クレベース',    // Avalugg
  714: 'オンバット',    // Noibat
  715: 'オンバーン',    // Noivern
  716: 'ゼルネアス',    // Xerneas
  717: 'イベルタル',    // Yveltal
  718: 'ジガルデ',    // Zygarde
  719: 'ディアンシー',    // Diancie
  720: 'フーパ',    // Hoopa
  721: 'ボルケニオン',    // Volcanion
  722: 'モクロー',    // Rowlet
  723: 'フクスロー',    // Dartrix
  724: 'ジュナイパー',    // Decidueye
  725: 'ニャビー',    // Litten
  726: 'ニャヒート',    // Torracat
  727: 'ガオガエン',    // Incineroar
  728: 'アシマリ',    // Popplio
  729: 'オシャマリ',    // Brionne
  730: 'アシレーヌ',    // Primarina
  731: 'ツツケラ',    // Pikipek
  732: 'ケララッパ',    // Trumbeak
  733: 'ドデカバシ',    // Toucannon
  734: 'ヤングース',    // Yungoos
  735: 'デカグース',    // Gumshoos
  736: 'アゴジムシ',    // Grubbin
  737: 'デンヂムシ',    // Charjabug
  738: 'クワガノン',    // Vikavolt
  739: 'マケンカニ',    // Crabrawler
  740: 'ケケンカニ',    // Crabominable
  741: 'オドリドリ',    // Oricorio
  742: 'アブリー',    // Cutiefly
  743: 'アブリボン',    // Ribombee
  744: 'イワンコ',    // Rockruff
  745: 'ルガルガン',    // Lycanroc
  746: 'ヨワシ',    // Wishiwashi
  747: 'ヒドイデ',    // Mareanie
  748: 'ドヒドイデ',    // Toxapex
  749: 'ドロバンコ',    // Mudbray
  750: 'バンバドロ',    // Mudsdale
  751: 'シズクモ',    // Dewpider
  752: 'オニシズクモ',    // Araquanid
  753: 'カリキリ',    // Fomantis
  754: 'ラランテス',    // Lurantis
  755: 'ネマシュ',    // Morelull
  756: 'マシェード',    // Shiinotic
  757: 'ヤトウモリ',    // Salandit
  758: 'エンニュート',    // Salazzle
  759: 'ヌイコグマ',    // Stufful
  760: 'キテルグマ',    // Bewear
  761: 'アマカジ',    // Bounsweet
  762: 'アママイコ',    // Steenee
  763: 'アマージョ',    // Tsareena
  764: 'キュワワー',    // Comfey
  765: 'ヤレユータン',    // Oranguru
  781: 'ナゲツケサル',    // Passimian
  782: 'コソクムシ',    // Wimpod
  783: 'グソクムシャ',    // Golisopod
  784: 'スナバァ',    // Sandygast
  785: 'シロデスナ',    // Palossand
  786: 'ナマコブシ',    // Pyukumuku
  787: 'タイプ：ヌル',    // Type: Null
  788: 'シルヴァディ',    // Silvally
  789: 'メテノ',    // Minior
  790: 'ネッコアラ',    // Komala
  791: 'バクガメス',    // Turtonator
  792: 'トゲデマル',    // Togedemaru
  793: 'ミミッキュ',    // Mimikyu
  794: 'ハギギシリ',    // Bruxish
  795: 'ジジーロン',    // Drampa
  796: 'ダダリン',    // Dhelmise
  797: 'ジャラコ',    // Jangmo-o
  798: 'ジャランゴ',    // Hakamo-o
  799: 'ジャラランガ',    // Kommo-o
  800: 'カプ・コケコ',    // Tapu Koko
  801: 'カプ・テテフ',    // Tapu Lele
  802: 'カプ・ブルル',    // Tapu Bulu
  803: 'カプ・レヒレ',    // Tapu Fini
  804: 'コスモッグ',    // Cosmog
  805: 'コスモウム',    // Cosmoem
  806: 'ソルガレオ',    // Solgaleo
  807: 'ルナアーラ',    // Lunala
  808: 'ウツロイド',    // Nihilego
  809: 'マギアナ',    // Magearna
  810: 'マーシャドー',    // Marshadow
  811: 'ベベノム',    // Poipole
  812: 'アーゴヨン',    // Naganadel
  813: 'ツンデツンデ',    // Stakataka
  814: 'ズガドーン',    // Blacephalon
  815: 'ゼラオラ',    // Zeraora
  816: 'メルタン',    // Meltan
  817: 'メルメタル',    // Melmetal
  818: 'インテレオン',    // Inteleon
  819: 'ホシガリス',    // Skwovet
  820: 'ヨクバリス',    // Greedent
  821: 'ココガラ',    // Rookidee
  822: 'アオガラス',    // Corvisquire
  823: 'アーマーガア',    // Corviknight
  824: 'サッチムシ',    // Blipbug
  825: 'レドームシ',    // Dottler
  826: 'イオルブ',    // Orbeetle
  827: 'クスネ',    // Nickit
  828: 'フォクスライ',    // Thievul
  829: 'ヒメンカ',    // Gossifleur
  830: 'ワタシラガ',    // Eldegoss
  831: 'ウールー',    // Wooloo
  832: 'バイウールー',    // Dubwool
  833: 'カムカメ',    // Chewtle
  834: 'カジリガメ',    // Drednaw
  835: 'ワンパチ',    // Yamper
  836: 'パルスワン',    // Boltund
  837: 'タンドン',    // Rolycoly
  838: 'トロッゴン',    // Carkol
  839: 'セキタンザン',    // Coalossal
  841: 'カジッチュ',    // Applin
  842: 'アップリュー',    // Flapple
  843: 'タルップル',    // Appletun
  844: 'スナヘビ',    // Silicobra
  845: 'サダイジャ',    // Sandaconda
  846: 'ウッウ',    // Cramorant
  847: 'サシカマス',    // Arrokuda
  848: 'カマスジョー',    // Barraskewda
  849: 'エレズン',    // Toxel
  850: 'ストリンダー',    // Toxtricity
  851: 'ヤクデ',    // Sizzlipede
  852: 'タタッコ',    // Clobbopus
  853: 'オトスパス',    // Grapploct
  854: 'ヤバチャ',    // Sinistea
  855: 'ポットデス',    // Polteageist
  856: 'ミブリム',    // Hatenna
  857: 'テブリム',    // Hattrem
  858: 'ブリムオン',    // Hatterene
  859: 'ベロバー',    // Impidimp
  860: 'ギモー',    // Morgrem
  861: 'オーロンゲ',    // Grimmsnarl
  862: 'タチフサグマ',    // Obstagoon
  863: 'ニャイキング',    // Perrserker
  864: 'サニゴーン',    // Cursola
  865: 'ネギガナイト',    // Sirfetch'd
  866: 'バリコオル',    // Mr. Rime
  867: 'デスバーン',    // Runerigus
  868: 'マホミル',    // Milcery
  869: 'マホイップ',    // Alcremie
  870: 'タイレーツ',    // Falinks
  871: 'バチンウニ',    // Pincurchin
  872: 'ユキハミ',    // Snom
  873: 'モスノウ',    // Frosmoth
  874: 'イシヘンジン',    // Stonjourner
  875: 'コオリッポ',    // Eiscue
  876: 'イエッサン',    // Indeedee
  877: 'モルペコ',    // Morpeko
  878: 'ゾウドウ',    // Cufant
  879: 'ダイオウドウ',    // Copperajah
  880: 'パッチラゴン',    // Dracozolt
  881: 'パッチルドン',    // Arctozolt
  882: 'パッチラドン',    // Dracovish
  883: 'パッチルゴン',    // Arctovish
  884: 'ジュラルドン',    // Duraludon
  885: 'ドラメシヤ',    // Dreepy
  886: 'ドロンチ',    // Drakloak
  887: 'ドラパルト',    // Dragapult
  888: 'ザシアン',    // Zacian
  889: 'ザマゼンタ',    // Zamazenta
  890: 'ムゲンダイナ',    // Eternatus
  891: 'ダクマ',    // Kubfu
  892: 'ウーラオス',    // Urshifu
  893: 'ザルード',    // Zarude
  894: 'レジエレキ',    // Regieleki
  895: 'レジドラゴ',    // Regidrago
  896: 'ブリザポス',    // Glastrier
  897: 'レイスポス',    // Spectrier
  898: 'バドレックス',    // Calyrex
  899: 'アヤシシ',    // Wyrdeer
  900: 'バサギリ',    // Kleavor
  901: 'ガチグマ',    // Ursaluna
  902: 'イダイトウ',    // Basculegion
  903: 'オオニューラ',    // Sneasler
  904: 'ラブトロス',    // Enamorus
  905: 'ニャオハ',    // Sprigatito
  906: 'ニャローテ',    // Floragato
  907: 'マスカーニャ',    // Meowscarada
  908: 'ホゲータ',    // Fuecoco
  909: 'アチゲータ',    // Crocalor
  910: 'ラウドボーン',    // Skeledirge
  911: 'クワッス',    // Quaxly
  912: 'ウェルカモ',    // Quaxwell
  913: 'ウェーニバル',    // Quaquaval
  914: 'グルトン',    // Lechonk
  915: 'パフュートン',    // Oinkologne
  916: 'タマンチュラ',    // Tarountula
  917: 'ワナイダー',    // Spidops
  918: 'マメバッタ',    // Nymble
  919: 'エクスレッグ',    // Lokix
  920: 'パモ',    // Pawmi
  921: 'パモット',    // Pawmo
  922: 'パーモット',    // Pawmot
  923: 'ワッカネズミ',    // Tandemaus
  924: 'イッカネズミ',    // Maushold
  925: 'パピモッチ',    // Fidough
  926: 'バウッツェル',    // Dachsbun
  927: 'ミニーブ',    // Smoliv
  928: 'オリーニョ',    // Dolliv
  929: 'オリーヴァ',    // Arboliva
  930: 'イキリンコ',    // Squawkabilly
  931: 'コジオ',    // Nacli
  932: 'ジオヅム',    // Naclstack
  933: 'キョジオーン',    // Garganacl
  934: 'カルボウ',    // Charcadet
  935: 'グレンアルマ',    // Armarouge
  936: 'ソウブレイズ',    // Ceruledge
  937: 'ズピカ',    // Tadbulb
  938: 'ハラバリー',    // Bellibolt
  939: 'カイデン',    // Wattrel
  940: 'タイカイデン',    // Kilowattrel
  941: 'オラチフ',    // Maschiff
  942: 'マフィティフ',    // Mabosstiff
  943: 'シルシュルー',    // Shroodle
  944: 'タギングル',    // Grafaiai
  945: 'アノクサ',    // Bramblin
  946: 'アノホラグサ',    // Brambleghast
  947: 'ノノクラゲ',    // Toedscool
  948: 'リククラゲ',    // Toedscruel
  949: 'ガケガニ',    // Klawf
  950: 'カプサイジ',    // Capsakid
  951: 'スコヴィラン',    // Scovillain
  952: 'ベラカス',    // Rabsca
  954: 'ヒラヒナ',    // Flittle
  955: 'クエスパトラ',    // Espathra
  956: 'カヌチャン',    // Tinkatink
  957: 'ナカヌチャン',    // Tinkatuff
  958: 'デカヌチャン',    // Tinkaton
  959: 'ウミディグダ',    // Wiglett
  960: 'ウミトリオ',    // Wugtrio
  961: 'ナミイルカ',    // Finizen
  963: 'イルカマン',    // Palafin
  964: 'ブロロン',    // Varoom
  965: 'ブロロローム',    // Revavroom
  966: 'モトトカゲ',    // Cyclizar
  967: 'ミミズズ',    // Orthworm
  968: 'キラーメ',    // Glimmet
  969: 'キラフロル',    // Glimmora
  970: 'ボチ',    // Greavard
  971: 'ハカドッグ',    // Houndstone
  972: 'カラミンゴ',    // Flamigo
  973: 'アルクジラ',    // Cetoddle
  974: 'ハルクジラ',    // Cetitan
  975: 'ミガルーサ',    // Veluza
  976: 'ヘイラッシャ',    // Dondozo
  977: 'シャリタツ',    // Tatsugiri
  978: 'コノヨザル',    // Annihilape
  979: 'ドオー',    // Clodsire
  980: 'リキキリン',    // Farigiraf
  981: 'ノココッチ',    // Dudunsparce
  982: 'ドドゲザン',    // Kingambit
  983: 'イダイナキバ',    // Great Tusk
  984: 'サケブシッポ',    // Scream Tail
  985: 'アラブルタケ',    // Brute Bonnet
  986: 'ハバタクカミ',    // Flutter Mane
  987: 'チヲハウハネ',    // Slither Wing
  988: 'スナノケガワ',    // Sandy Shocks
  989: 'テツノワダチ',    // Iron Treads
  990: 'テツノツツミ',    // Iron Bundle
  991: 'テツノカイナ',    // Iron Hands
  992: 'テツノコウベ',    // Iron Jugulis
  993: 'テツノドクガ',    // Iron Moth
  994: 'テツノイワオ',    // Iron Thorns
  995: 'セビエ',    // Frigibax
  996: 'セゴール',    // Arctibax
  997: 'セグレイブ',    // Baxcalibur
  998: 'コレクレー',    // Gimmighoul
  999: 'サーフゴー',    // Gholdengo
  1000: 'チオンジェン',    // Wo-Chien
  1001: 'パオジアン',    // Chien-Pao
  1002: 'ディンルー',    // Ting-Lu
  1003: 'イーユイ',    // Chi-Yu
  1004: 'トドロクツキ',    // Roaring Moon
  1005: 'テツノブジン',    // Iron Valiant
  1006: 'コライドン',    // Koraidon
  1007: 'ミライドン',    // Miraidon
  1008: 'ウネルミナモ',    // Walking Wake
  1009: 'テツノイサハ',    // Iron Leaves
  1010: 'カミツオロチ',    // Dipplin
  1011: 'チャデス',    // Poltchageist
  1012: 'ヤバソチャ',    // Sinistcha
  1013: 'イイネイヌ',    // Okidogi
  1014: 'マシマシラ',    // Munkidori
  1015: 'キチキギス',    // Fezandipiti
  1016: 'オーガポン',    // Ogerpon
  1017: 'ブリジュラス',    // Archaludon
  1018: 'カグヤドン',    // Gouging Fire
  1020: 'テツノカミ',    // Raging Bolt
  1021: 'テツノイワ',    // Iron Boulder
  1022: 'テツノカンムリ',    // Iron Crown
  1023: 'テラパゴス',    // Terapagos
  1024: 'モモロウ',    // Pecharunt
  1025: 'モモロウ',    // Pecharunt
}

export function getPokemonJapaneseName(pokemonId: number): JapaneseNameInfo | null {
  const japaneseName = pokemonIdToJapanese[pokemonId]
  if (japaneseName) {
    return getJapaneseNameInfo(japaneseName)
  }
  return null
}

// Fallback function to generate basic romaji from Japanese text
export function generateBasicRomaji(japaneseText: string): string {
  // This is a very basic conversion - in a real app you'd want a proper Japanese-to-romaji library
  const basicConversions: Record<string, string> = {
    'たね': 'Tane',
    'ざっそう': 'Zassou',
    'はな': 'Hana',
    'ひ': 'Hi',
    'かげ': 'Kage',
    'みず': 'Mizu',
    'かめ': 'Kame'
  }
  
  let result = japaneseText
  for (const [jp, romaji] of Object.entries(basicConversions)) {
    result = result.replace(new RegExp(jp, 'g'), romaji)
  }
  
  return result
}
