// Japanese Pokemon names with romaji, pronunciation, and meaning
export interface JapaneseNameInfo {
  japanese: string
  romaji: string
  pronunciation: string
  meaning: string
  explanation?: string
}

// Pokemon-specific Japanese names with romaji, pronunciation, and meanings
const japaneseNames: Record<string, JapaneseNameInfo> = {
  // Gen 1 Starters
  'フシギダネ': {
    japanese: 'フシギダネ',
    romaji: 'Fushigidane',
    pronunciation: 'foo-SHEE-ghee-dah-neh',
    meaning: 'Mysterious Seed (不思議 + 種)',
    explanation: 'From 不思議 (fushigi, strange/mysterious) + 種 (tane, seed). Also wordplay on "Fushigi da ne?" meaning "Isn\'t it strange?"'
  },
  'フシギソウ': {
    japanese: 'フシギソウ',
    romaji: 'Fushigisou',
    pronunciation: 'foo-SHEE-ghee-soh',
    meaning: 'Mysterious Grass (不思議 + 草)',
    explanation: '不思議 (fushigi, mysterious) + 草 (sou, grass/plant). Also wordplay on "Fushigi sou" meaning "Seems mysterious."'
  },
  'フシギバナ': {
    japanese: 'フシギバナ',
    romaji: 'Fushigibana',
    pronunciation: 'foo-SHEE-ghee-bah-nah',
    meaning: 'Mysterious Flower (不思議 + 花)',
    explanation: '不思議 (fushigi, mysterious) + 花 (bana, flower).'
  },
  'ヒトカゲ': {
    japanese: 'ヒトカゲ',
    romaji: 'Hitokage',
    pronunciation: 'hee-toh-KAH-geh',
    meaning: 'Fire Lizard (火 + トカゲ)',
    explanation: '火 (hi, fire) + トカゲ (tokage, lizard).'
  },
  'リザード': {
    japanese: 'リザード',
    romaji: 'Rizaado',
    pronunciation: 'ree-ZAH-doh',
    meaning: 'Lizard (from English "lizard")',
    explanation: 'From English "lizard."'
  },
  'リザードン': {
    japanese: 'リザードン',
    romaji: 'Rizaadon',
    pronunciation: 'ree-ZAH-dohn',
    meaning: 'Lizard Dragon (lizard + -don suffix)',
    explanation: '"Lizard" + "don" (as in dragon/dinosaur).'
  },
  'ゼニガメ': {
    japanese: 'ゼニガメ',
    romaji: 'Zenigame',
    pronunciation: 'zeh-nee-GAH-meh',
    meaning: 'Coin Turtle (銭 + 亀)',
    explanation: '銭 (zeni, coin) + 亀 (kame, turtle). Refers to pond turtles resembling coins.'
  },
  'カメール': {
    japanese: 'カメール',
    romaji: 'Kameeru',
    pronunciation: 'kah-MEH-ru',
    meaning: 'Turtle (亀 + turtle)'
  },
  'カメックス': {
    japanese: 'カメックス',
    romaji: 'Kamekkusu',
    pronunciation: 'kah-MEHK-koo-soo',
    meaning: 'Turtle Max (亀 + max)'
  },
  
  // Common Pokemon
  'ピカチュウ': {
    japanese: 'ピカチュウ',
    romaji: 'Pikachuu',
    pronunciation: 'pee-KAH-choo',
    meaning: 'Spark Mouse (ピカピカ + チュウ)'
  },
  'ライチュウ': {
    japanese: 'ライチュウ',
    romaji: 'Raichuu',
    pronunciation: 'RYE-choo',
    meaning: 'Thunder Mouse (雷 + チュウ)'
  },
  'オニスズメ': {
    japanese: 'オニスズメ',
    romaji: 'Onisuzume',
    pronunciation: 'oh-nee-soo-ZEH-meh',
    meaning: 'Demon Sparrow (鬼 + 雀)'
  },
  'オニドリル': {
    japanese: 'オニドリル',
    romaji: 'Onidoriru',
    pronunciation: 'oh-nee-doh-REE-ru',
    meaning: 'Demon Drill (鬼 + ドリル)'
  },
  'アーボ': {
    japanese: 'アーボ',
    romaji: 'Aabo',
    pronunciation: 'AH-boh',
    meaning: 'Boa (from "boa" snake)'
  },
  'アーボック': {
    japanese: 'アーボック',
    romaji: 'Aabokku',
    pronunciation: 'AH-bohk-koo',
    meaning: 'Cobra (boa + cobra)'
  },
  
  // Pokemon genus terms (for when we don't have specific names)
  'たねポケモン': {
    japanese: 'たねポケモン',
    romaji: 'Tane Pokemon',
    pronunciation: 'TAH-neh poh-keh-MOHN',
    meaning: 'Seed Pokemon'
  },
  'ざっそうポケモン': {
    japanese: 'ざっそうポケモン',
    romaji: 'Zassou Pokemon',
    pronunciation: 'ZAHT-soh poh-keh-MOHN',
    meaning: 'Weed Pokemon'
  },
  'かえんポケモン': {
    japanese: 'かえんポケモン',
    romaji: 'Kaen Pokemon',
    pronunciation: 'KAH-ehn poh-keh-MOHN',
    meaning: 'Flame Pokemon'
  },
  'みずがめポケモン': {
    japanese: 'みずがめポケモン',
    romaji: 'Mizugame Pokemon',
    pronunciation: 'mee-ZOO-gah-meh poh-keh-MOHN',
    meaning: 'Water Turtle Pokemon'
  },
  'ねずみポケモン': {
    japanese: 'ねずみポケモン',
    romaji: 'Nezumi Pokemon',
    pronunciation: 'neh-ZOO-mee poh-keh-MOHN',
    meaning: 'Mouse Pokemon'
  },
  'つばさポケモン': {
    japanese: 'つばさポケモン',
    romaji: 'Tsubasa Pokemon',
    pronunciation: 'tsoo-BAH-sah poh-keh-MOHN',
    meaning: 'Wing Pokemon'
  },
  'へびポケモン': {
    japanese: 'へびポケモン',
    romaji: 'Hebi Pokemon',
    pronunciation: 'HEH-bee poh-keh-MOHN',
    meaning: 'Snake Pokemon'
  },
  'どくばちポケモン': {
    japanese: 'どくばちポケモン',
    romaji: 'Dokubachi Pokemon',
    pronunciation: 'doh-koo-BAH-chee poh-keh-MOHN',
    meaning: 'Poison Bee Pokemon'
  },
  'いしポケモン': {
    japanese: 'いしポケモン',
    romaji: 'Ishi Pokemon',
    pronunciation: 'EE-shee poh-keh-MOHN',
    meaning: 'Rock Pokemon'
  },
  'ゴーストポケモン': {
    japanese: 'ゴーストポケモン',
    romaji: 'Goosuto Pokemon',
    pronunciation: 'GOH-stoh poh-keh-MOHN',
    meaning: 'Ghost Pokemon'
  },
  'ドラゴンポケモン': {
    japanese: 'ドラゴンポケモン',
    romaji: 'Doragon Pokemon',
    pronunciation: 'doh-RAH-gohn poh-keh-MOHN',
    meaning: 'Dragon Pokemon'
  },
  'あくポケモン': {
    japanese: 'あくポケモン',
    romaji: 'Aku Pokemon',
    pronunciation: 'AH-koo poh-keh-MOHN',
    meaning: 'Evil Pokemon'
  },
  'はがねポケモン': {
    japanese: 'はがねポケモン',
    romaji: 'Hagane Pokemon',
    pronunciation: 'hah-GAH-neh poh-keh-MOHN',
    meaning: 'Steel Pokemon'
  },
  'フェアリーポケモン': {
    japanese: 'フェアリーポケモン',
    romaji: 'Fearii Pokemon',
    pronunciation: 'feh-AH-ree poh-keh-MOHN',
    meaning: 'Fairy Pokemon'
  },
  'みずどりポケモン': {
    japanese: 'みずどりポケモン',
    romaji: 'Mizudori Pokemon',
    pronunciation: 'mee-ZOO-doh-ree poh-keh-MOHN',
    meaning: 'Water Bird Pokemon'
  },
  'キャタピー': {
    japanese: 'キャタピー',
    romaji: 'kyatapi-',
    pronunciation: 'kya-ta-pi-',
    meaning: 'Worm Pokémon'
  },
  'トランセル': {
    japanese: 'トランセル',
    romaji: 'toranseru',
    pronunciation: 'to-ra-nse-ru',
    meaning: 'Cocoon Pokémon'
  },
  'バタフリー': {
    japanese: 'バタフリー',
    romaji: 'batafuri-',
    pronunciation: 'ba-ta-fu-ri-',
    meaning: 'Butterfly Pokémon'
  },
  'ビードル': {
    japanese: 'ビードル',
    romaji: 'bi-doru',
    pronunciation: 'bi--do-ru',
    meaning: 'Hairy Bug Pokémon'
  },
  'コクーン': {
    japanese: 'コクーン',
    romaji: 'koku-n',
    pronunciation: 'ko-ku--n',
    meaning: 'Cocoon Pokémon'
  },
  'スピアー': {
    japanese: 'スピアー',
    romaji: 'supia-',
    pronunciation: 'su-pi-a-',
    meaning: 'Poison Bee Pokémon'
  },
  'ポッポ': {
    japanese: 'ポッポ',
    romaji: 'potsupo',
    pronunciation: 'po-tsu-po',
    meaning: 'Tiny Bird Pokémon'
  },
  'ピジョン': {
    japanese: 'ピジョン',
    romaji: 'pijon',
    pronunciation: 'pi-jo-n',
    meaning: 'Bird Pokémon'
  },
  'ピジョット': {
    japanese: 'ピジョット',
    romaji: 'pijotsuto',
    pronunciation: 'pi-jo-tsu-to',
    meaning: 'Bird Pokémon'
  },
  'コラッタ': {
    japanese: 'コラッタ',
    romaji: 'koratsuta',
    pronunciation: 'ko-ra-tsu-ta',
    meaning: 'Mouse Pokémon'
  },
  'ラッタ': {
    japanese: 'ラッタ',
    romaji: 'ratsuta',
    pronunciation: 'ra-tsu-ta',
    meaning: 'Mouse Pokémon'
  },
  'サンド': {
    japanese: 'サンド',
    romaji: 'sando',
    pronunciation: 'sa-ndo',
    meaning: 'Mouse Pokémon'
  },
  'サンドパン': {
    japanese: 'サンドパン',
    romaji: 'sandopan',
    pronunciation: 'sa-ndo-pa-n',
    meaning: 'Mouse Pokémon'
  },
  'ロコン': {
    japanese: 'ロコン',
    romaji: 'rokon',
    pronunciation: 'ro-ko-n',
    meaning: 'Fox Pokémon'
  },
  'キュウコン': {
    japanese: 'キュウコン',
    romaji: 'kyuukon',
    pronunciation: 'kyu-u-ko-n',
    meaning: 'Fox Pokémon'
  },
  'プリン': {
    japanese: 'プリン',
    romaji: 'purin',
    pronunciation: 'pu-ri-n',
    meaning: 'Balloon Pokémon'
  },
  'プクリン': {
    japanese: 'プクリン',
    romaji: 'pukurin',
    pronunciation: 'pu-ku-ri-n',
    meaning: 'Balloon Pokémon'
  },
  'ズバット': {
    japanese: 'ズバット',
    romaji: 'zubatsuto',
    pronunciation: 'zu-ba-tsu-to',
    meaning: 'Bat Pokémon'
  },
  'ゴルバット': {
    japanese: 'ゴルバット',
    romaji: 'gorubatsuto',
    pronunciation: 'go-ru-ba-tsu-to',
    meaning: 'Bat Pokémon'
  },
  'ナゾノクサ': {
    japanese: 'ナゾノクサ',
    romaji: 'nazonokusa',
    pronunciation: 'na-zo-no-ku-sa',
    meaning: 'Weed Pokémon'
  },
  'クサイハナ': {
    japanese: 'クサイハナ',
    romaji: 'kusaihana',
    pronunciation: 'ku-sa-i-ha-na',
    meaning: 'Weed Pokémon'
  },
  'ラフレシア': {
    japanese: 'ラフレシア',
    romaji: 'rafureshia',
    pronunciation: 'ra-fu-re-shi-a',
    meaning: 'Flower Pokémon'
  },
  'パラス': {
    japanese: 'パラス',
    romaji: 'parasu',
    pronunciation: 'pa-ra-su',
    meaning: 'Mushroom Pokémon'
  },
  'パラセクト': {
    japanese: 'パラセクト',
    romaji: 'parasekuto',
    pronunciation: 'pa-ra-se-ku-to',
    meaning: 'Mushroom Pokémon'
  },
  'コンパン': {
    japanese: 'コンパン',
    romaji: 'konpan',
    pronunciation: 'ko-npa-n',
    meaning: 'Insect Pokémon'
  },
  'モルフォン': {
    japanese: 'モルフォン',
    romaji: 'morufuon',
    pronunciation: 'mo-ru-fu-o-n',
    meaning: 'Poison Moth Pokémon'
  },
  'ディグダ': {
    japanese: 'ディグダ',
    romaji: 'deiguda',
    pronunciation: 'de-i-gu-da',
    meaning: 'Mole Pokémon'
  },
  'ダグトリオ': {
    japanese: 'ダグトリオ',
    romaji: 'dagutorio',
    pronunciation: 'da-gu-to-ri-o',
    meaning: 'Mole Pokémon'
  },
  'ニャース': {
    japanese: 'ニャース',
    romaji: 'nya-su',
    pronunciation: 'nya--su',
    meaning: 'Scratch Cat Pokémon'
  },
  'ペルシアン': {
    japanese: 'ペルシアン',
    romaji: 'perushian',
    pronunciation: 'pe-ru-shi-a-n',
    meaning: 'Classy Cat Pokémon'
  },
  'コダック': {
    japanese: 'コダック',
    romaji: 'kodatsuku',
    pronunciation: 'ko-da-tsu-ku',
    meaning: 'Duck Pokémon'
  },
  'ゴルダック': {
    japanese: 'ゴルダック',
    romaji: 'gorudatsuku',
    pronunciation: 'go-ru-da-tsu-ku',
    meaning: 'Duck Pokémon'
  },
  'マンキー': {
    japanese: 'マンキー',
    romaji: 'manki-',
    pronunciation: 'ma-nki-',
    meaning: 'Pig Monkey Pokémon'
  },
  'オコリザル': {
    japanese: 'オコリザル',
    romaji: 'okorizaru',
    pronunciation: 'o-ko-ri-za-ru',
    meaning: 'Pig Monkey Pokémon'
  },
  'ガーディ': {
    japanese: 'ガーディ',
    romaji: 'ga-dei',
    pronunciation: 'ga--de-i',
    meaning: 'Puppy Pokémon'
  },
  'ウインディ': {
    japanese: 'ウインディ',
    romaji: 'uindei',
    pronunciation: 'u-i-nde-i',
    meaning: 'Legendary Pokémon'
  },
  'ニョロモ': {
    japanese: 'ニョロモ',
    romaji: 'nyoromo',
    pronunciation: 'nyo-ro-mo',
    meaning: 'Tadpole Pokémon'
  },
  'ニョロゾ': {
    japanese: 'ニョロゾ',
    romaji: 'nyorozo',
    pronunciation: 'nyo-ro-zo',
    meaning: 'Tadpole Pokémon'
  },
  'ニョロボン': {
    japanese: 'ニョロボン',
    romaji: 'nyorobon',
    pronunciation: 'nyo-ro-bo-n',
    meaning: 'Tadpole Pokémon'
  },
  'ケーシィ': {
    japanese: 'ケーシィ',
    romaji: 'ke-shii',
    pronunciation: 'ke--shi-i',
    meaning: 'Psi Pokémon'
  },
  'ユンゲラー': {
    japanese: 'ユンゲラー',
    romaji: 'yungera-',
    pronunciation: 'yu-nge-ra-',
    meaning: 'Psi Pokémon'
  },
  'フーディン': {
    japanese: 'フーディン',
    romaji: 'fu-dein',
    pronunciation: 'fu--de-i-n',
    meaning: 'Psi Pokémon'
  },
  'ワンリキー': {
    japanese: 'ワンリキー',
    romaji: 'wanriki-',
    pronunciation: 'wa-nri-ki-',
    meaning: 'Superpower Pokémon'
  },
  'ゴーリキー': {
    japanese: 'ゴーリキー',
    romaji: 'go-riki-',
    pronunciation: 'go--ri-ki-',
    meaning: 'Superpower Pokémon'
  },
  'カイリキー': {
    japanese: 'カイリキー',
    romaji: 'kairiki-',
    pronunciation: 'ka-i-ri-ki-',
    meaning: 'Superpower Pokémon'
  },
  'マダツボミ': {
    japanese: 'マダツボミ',
    romaji: 'madatsubomi',
    pronunciation: 'ma-da-tsu-bo-mi',
    meaning: 'Flower Pokémon'
  },
  'ウツドン': {
    japanese: 'ウツドン',
    romaji: 'utsudon',
    pronunciation: 'u-tsu-do-n',
    meaning: 'Flycatcher Pokémon'
  },
  'ウツボット': {
    japanese: 'ウツボット',
    romaji: 'utsubotsuto',
    pronunciation: 'u-tsu-bo-tsu-to',
    meaning: 'Flycatcher Pokémon'
  },
  'メノクラゲ': {
    japanese: 'メノクラゲ',
    romaji: 'menokurage',
    pronunciation: 'me-no-ku-ra-ge',
    meaning: 'Jellyfish Pokémon'
  },
  'ドククラゲ': {
    japanese: 'ドククラゲ',
    romaji: 'dokukurage',
    pronunciation: 'do-ku-ku-ra-ge',
    meaning: 'Jellyfish Pokémon'
  },
  'イシツブテ': {
    japanese: 'イシツブテ',
    romaji: 'ishitsubute',
    pronunciation: 'i-shi-tsu-bu-te',
    meaning: 'Rock Pokémon'
  },
  'ゴローン': {
    japanese: 'ゴローン',
    romaji: 'goro-n',
    pronunciation: 'go-ro--n',
    meaning: 'Rock Pokémon'
  },
  'ゴローニャ': {
    japanese: 'ゴローニャ',
    romaji: 'goro-nya',
    pronunciation: 'go-ro--nya',
    meaning: 'Megaton Pokémon'
  },
  'ポニータ': {
    japanese: 'ポニータ',
    romaji: 'poni-ta',
    pronunciation: 'po-ni--ta',
    meaning: 'Fire Horse Pokémon'
  },
  'ギャロップ': {
    japanese: 'ギャロップ',
    romaji: 'gyarotsupu',
    pronunciation: 'gya-ro-tsu-pu',
    meaning: 'Fire Horse Pokémon'
  },
  'ヤドン': {
    japanese: 'ヤドン',
    romaji: 'yadon',
    pronunciation: 'ya-do-n',
    meaning: 'Dopey Pokémon'
  },
  'ヤドラン': {
    japanese: 'ヤドラン',
    romaji: 'yadoran',
    pronunciation: 'ya-do-ra-n',
    meaning: 'Hermit Crab Pokémon'
  },
  'コイル': {
    japanese: 'コイル',
    romaji: 'koiru',
    pronunciation: 'ko-i-ru',
    meaning: 'Magnet Pokémon'
  },
  'レアコイル': {
    japanese: 'レアコイル',
    romaji: 'reakoiru',
    pronunciation: 're-a-ko-i-ru',
    meaning: 'Magnet Pokémon'
  },
  'カモネギ': {
    japanese: 'カモネギ',
    romaji: 'kamonegi',
    pronunciation: 'ka-mo-ne-gi',
    meaning: 'Wild Duck Pokémon'
  },
  'ドードー': {
    japanese: 'ドードー',
    romaji: 'do-do-',
    pronunciation: 'do--do-',
    meaning: 'Twin Bird Pokémon'
  },
  'ドードリオ': {
    japanese: 'ドードリオ',
    romaji: 'do-dorio',
    pronunciation: 'do--do-ri-o',
    meaning: 'Triple Bird Pokémon'
  },
  'パウワウ': {
    japanese: 'パウワウ',
    romaji: 'pauwau',
    pronunciation: 'pa-u-wa-u',
    meaning: 'Sea Lion Pokémon'
  },
  'ジュゴン': {
    japanese: 'ジュゴン',
    romaji: 'jugon',
    pronunciation: 'ju-go-n',
    meaning: 'Sea Lion Pokémon'
  },
  'ベトベター': {
    japanese: 'ベトベター',
    romaji: 'betobeta-',
    pronunciation: 'be-to-be-ta-',
    meaning: 'Sludge Pokémon'
  },
  'ベトベトン': {
    japanese: 'ベトベトン',
    romaji: 'betobeton',
    pronunciation: 'be-to-be-to-n',
    meaning: 'Sludge Pokémon'
  },
  'シェルダー': {
    japanese: 'シェルダー',
    romaji: 'shieruda-',
    pronunciation: 'shi-e-ru-da-',
    meaning: 'Bivalve Pokémon'
  },
  'パルシェン': {
    japanese: 'パルシェン',
    romaji: 'parushien',
    pronunciation: 'pa-ru-shi-e-n',
    meaning: 'Bivalve Pokémon'
  },
  'ゴース': {
    japanese: 'ゴース',
    romaji: 'go-su',
    pronunciation: 'go--su',
    meaning: 'Gas Pokémon'
  },
  'ゴースト': {
    japanese: 'ゴースト',
    romaji: 'go-suto',
    pronunciation: 'go--su-to',
    meaning: 'Gas Pokémon'
  },
  'ゲンガー': {
    japanese: 'ゲンガー',
    romaji: 'genga-',
    pronunciation: 'ge-nga-',
    meaning: 'Shadow Pokémon'
  },
  'イワーク': {
    japanese: 'イワーク',
    romaji: 'iwa-ku',
    pronunciation: 'i-wa--ku',
    meaning: 'Rock Snake Pokémon'
  },
  'スリープ': {
    japanese: 'スリープ',
    romaji: 'suri-pu',
    pronunciation: 'su-ri--pu',
    meaning: 'Hypnosis Pokémon'
  },
  'スリーパー': {
    japanese: 'スリーパー',
    romaji: 'suri-pa-',
    pronunciation: 'su-ri--pa-',
    meaning: 'Hypnosis Pokémon'
  },
  'クラブ': {
    japanese: 'クラブ',
    romaji: 'kurabu',
    pronunciation: 'ku-ra-bu',
    meaning: 'River Crab Pokémon'
  },
  'キングラー': {
    japanese: 'キングラー',
    romaji: 'kingura-',
    pronunciation: 'ki-ngu-ra-',
    meaning: 'Pincer Pokémon'
  },
  'ビリリダマ': {
    japanese: 'ビリリダマ',
    romaji: 'biriridama',
    pronunciation: 'bi-ri-ri-da-ma',
    meaning: 'Ball Pokémon'
  },
  'マルマイン': {
    japanese: 'マルマイン',
    romaji: 'marumain',
    pronunciation: 'ma-ru-ma-i-n',
    meaning: 'Ball Pokémon'
  },
  'タマタマ': {
    japanese: 'タマタマ',
    romaji: 'tamatama',
    pronunciation: 'ta-ma-ta-ma',
    meaning: 'Egg Pokémon'
  },
  'ナッシー': {
    japanese: 'ナッシー',
    romaji: 'natsushi-',
    pronunciation: 'na-tsu-shi-',
    meaning: 'Coconut Pokémon'
  },
  'カラカラ': {
    japanese: 'カラカラ',
    romaji: 'karakara',
    pronunciation: 'ka-ra-ka-ra',
    meaning: 'Lonely Pokémon'
  },
  'ガラガラ': {
    japanese: 'ガラガラ',
    romaji: 'garagara',
    pronunciation: 'ga-ra-ga-ra',
    meaning: 'Bone Keeper Pokémon'
  },
  'サワムラー': {
    japanese: 'サワムラー',
    romaji: 'sawamura-',
    pronunciation: 'sa-wa-mu-ra-',
    meaning: 'Kicking Pokémon'
  },
  'エビワラー': {
    japanese: 'エビワラー',
    romaji: 'ebiwara-',
    pronunciation: 'e-bi-wa-ra-',
    meaning: 'Punching Pokémon'
  },
  'ベロリンガ': {
    japanese: 'ベロリンガ',
    romaji: 'beroringa',
    pronunciation: 'be-ro-ri-nga',
    meaning: 'Licking Pokémon'
  },
  'ドガース': {
    japanese: 'ドガース',
    romaji: 'doga-su',
    pronunciation: 'do-ga--su',
    meaning: 'Poison Gas Pokémon'
  },
  'マタドガス': {
    japanese: 'マタドガス',
    romaji: 'matadogasu',
    pronunciation: 'ma-ta-do-ga-su',
    meaning: 'Poison Gas Pokémon'
  },
  'サイホーン': {
    japanese: 'サイホーン',
    romaji: 'saiho-n',
    pronunciation: 'sa-i-ho--n',
    meaning: 'Spikes Pokémon'
  },
  'サイドン': {
    japanese: 'サイドン',
    romaji: 'saidon',
    pronunciation: 'sa-i-do-n',
    meaning: 'Drill Pokémon'
  },
  'ラッキー': {
    japanese: 'ラッキー',
    romaji: 'ratsuki-',
    pronunciation: 'ra-tsu-ki-',
    meaning: 'Egg Pokémon'
  },
  'モンジャラ': {
    japanese: 'モンジャラ',
    romaji: 'monjara',
    pronunciation: 'mo-nja-ra',
    meaning: 'Vine Pokémon'
  },
  'ガルーラ': {
    japanese: 'ガルーラ',
    romaji: 'garu-ra',
    pronunciation: 'ga-ru--ra',
    meaning: 'Parent Pokémon'
  },
  'タッツー': {
    japanese: 'タッツー',
    romaji: 'tatsutsu-',
    pronunciation: 'ta-tsu-tsu-',
    meaning: 'Dragon Pokémon'
  },
  'シードラ': {
    japanese: 'シードラ',
    romaji: 'shi-dora',
    pronunciation: 'shi--do-ra',
    meaning: 'Dragon Pokémon'
  },
  'トサキント': {
    japanese: 'トサキント',
    romaji: 'tosakinto',
    pronunciation: 'to-sa-ki-nto',
    meaning: 'Goldfish Pokémon'
  },
  'アズマオウ': {
    japanese: 'アズマオウ',
    romaji: 'azumaou',
    pronunciation: 'a-zu-ma-o-u',
    meaning: 'Goldfish Pokémon'
  },
  'ヒトデマン': {
    japanese: 'ヒトデマン',
    romaji: 'hitodeman',
    pronunciation: 'hi-to-de-ma-n',
    meaning: 'Star Shape Pokémon'
  },
  'スターミー': {
    japanese: 'スターミー',
    romaji: 'suta-mi-',
    pronunciation: 'su-ta--mi-',
    meaning: 'Mysterious Pokémon'
  },
  'バリヤード': {
    japanese: 'バリヤード',
    romaji: 'bariya-do',
    pronunciation: 'ba-ri-ya--do',
    meaning: 'Barrier Pokémon'
  },
  'ストライク': {
    japanese: 'ストライク',
    romaji: 'sutoraiku',
    pronunciation: 'su-to-ra-i-ku',
    meaning: 'Mantis Pokémon'
  },
  'ルージュラ': {
    japanese: 'ルージュラ',
    romaji: 'ru-jura',
    pronunciation: 'ru--ju-ra',
    meaning: 'Human Shape Pokémon'
  },
  'エレブー': {
    japanese: 'エレブー',
    romaji: 'erebu-',
    pronunciation: 'e-re-bu-',
    meaning: 'Electric Pokémon'
  },
  'ブーバー': {
    japanese: 'ブーバー',
    romaji: 'bu-ba-',
    pronunciation: 'bu--ba-',
    meaning: 'Spitfire Pokémon'
  },
  'カイロス': {
    japanese: 'カイロス',
    romaji: 'kairosu',
    pronunciation: 'ka-i-ro-su',
    meaning: 'Stag Beetle Pokémon'
  },
  'ケンタロス': {
    japanese: 'ケンタロス',
    romaji: 'kentarosu',
    pronunciation: 'ke-nta-ro-su',
    meaning: 'Wild Bull Pokémon'
  },
  'コイキング': {
    japanese: 'コイキング',
    romaji: 'koikingu',
    pronunciation: 'ko-i-ki-ngu',
    meaning: 'Fish Pokémon'
  },
  'ギャラドス': {
    japanese: 'ギャラドス',
    romaji: 'gyaradosu',
    pronunciation: 'gya-ra-do-su',
    meaning: 'Atrocious Pokémon'
  },
  'ラプラス': {
    japanese: 'ラプラス',
    romaji: 'rapurasu',
    pronunciation: 'ra-pu-ra-su',
    meaning: 'Transport Pokémon'
  },
  'メタモン': {
    japanese: 'メタモン',
    romaji: 'metamon',
    pronunciation: 'me-ta-mo-n',
    meaning: 'Transform Pokémon'
  },
  'イーブイ': {
    japanese: 'イーブイ',
    romaji: 'i-bui',
    pronunciation: 'i--bu-i',
    meaning: 'Evolution Pokémon'
  },
  'シャワーズ': {
    japanese: 'シャワーズ',
    romaji: 'shawa-zu',
    pronunciation: 'sha-wa--zu',
    meaning: 'Bubble Jet Pokémon'
  },
  'サンダース': {
    japanese: 'サンダース',
    romaji: 'sanda-su',
    pronunciation: 'sa-nda--su',
    meaning: 'Lightning Pokémon'
  },
  'ブースター': {
    japanese: 'ブースター',
    romaji: 'bu-suta-',
    pronunciation: 'bu--su-ta-',
    meaning: 'Flame Pokémon'
  },
  'ポリゴン': {
    japanese: 'ポリゴン',
    romaji: 'porigon',
    pronunciation: 'po-ri-go-n',
    meaning: 'Virtual Pokémon'
  },
  'オムナイト': {
    japanese: 'オムナイト',
    romaji: 'omunaito',
    pronunciation: 'o-mu-na-i-to',
    meaning: 'Spiral Pokémon'
  },
  'オムスター': {
    japanese: 'オムスター',
    romaji: 'omusuta-',
    pronunciation: 'o-mu-su-ta-',
    meaning: 'Spiral Pokémon'
  },
  'カブト': {
    japanese: 'カブト',
    romaji: 'kabuto',
    pronunciation: 'ka-bu-to',
    meaning: 'Shellfish Pokémon'
  },
  'カブトプス': {
    japanese: 'カブトプス',
    romaji: 'kabutopusu',
    pronunciation: 'ka-bu-to-pu-su',
    meaning: 'Shellfish Pokémon'
  },
  'プテラ': {
    japanese: 'プテラ',
    romaji: 'putera',
    pronunciation: 'pu-te-ra',
    meaning: 'Fossil Pokémon'
  },
  'カビゴン': {
    japanese: 'カビゴン',
    romaji: 'kabigon',
    pronunciation: 'ka-bi-go-n',
    meaning: 'Sleeping Pokémon'
  },
  'フリーザー': {
    japanese: 'フリーザー',
    romaji: 'furi-za-',
    pronunciation: 'fu-ri--za-',
    meaning: 'Freeze Pokémon'
  },
  'サンダー': {
    japanese: 'サンダー',
    romaji: 'sanda-',
    pronunciation: 'sa-nda-',
    meaning: 'Electric Pokémon'
  },
  'ファイヤー': {
    japanese: 'ファイヤー',
    romaji: 'fuaiya-',
    pronunciation: 'fu-a-i-ya-',
    meaning: 'Flame Pokémon'
  },
  'ミニリュウ': {
    japanese: 'ミニリュウ',
    romaji: 'miniryuu',
    pronunciation: 'mi-ni-ryu-u',
    meaning: 'Dragon Pokémon'
  },
  'ハクリュー': {
    japanese: 'ハクリュー',
    romaji: 'hakuryu-',
    pronunciation: 'ha-ku-ryu-',
    meaning: 'Dragon Pokémon'
  },
  'カイリュー': {
    japanese: 'カイリュー',
    romaji: 'kairyu-',
    pronunciation: 'ka-i-ryu-',
    meaning: 'Dragon Pokémon'
  },
  'ミュウツー': {
    japanese: 'ミュウツー',
    romaji: 'myuutsu-',
    pronunciation: 'myu-u-tsu-',
    meaning: 'Genetic Pokémon'
  },
  'ミュウ': {
    japanese: 'ミュウ',
    romaji: 'myuu',
    pronunciation: 'myu-u',
    meaning: 'New Species Pokémon'
  },
  'チコリータ': {
    japanese: 'チコリータ',
    romaji: 'chikori-ta',
    pronunciation: 'chi-ko-ri--ta',
    meaning: 'Leaf Pokémon'
  },
  'ベイリーフ': {
    japanese: 'ベイリーフ',
    romaji: 'beiri-fu',
    pronunciation: 'be-i-ri--fu',
    meaning: 'Leaf Pokémon'
  },
  'メガニウム': {
    japanese: 'メガニウム',
    romaji: 'meganiumu',
    pronunciation: 'me-ga-ni-u-mu',
    meaning: 'Herb Pokémon'
  },
  'ヒノアラシ': {
    japanese: 'ヒノアラシ',
    romaji: 'hinoarashi',
    pronunciation: 'hi-no-a-ra-shi',
    meaning: 'Fire Mouse Pokémon'
  },
  'マグマラシ': {
    japanese: 'マグマラシ',
    romaji: 'magumarashi',
    pronunciation: 'ma-gu-ma-ra-shi',
    meaning: 'Volcano Pokémon'
  },
  'バクフーン': {
    japanese: 'バクフーン',
    romaji: 'bakufu-n',
    pronunciation: 'ba-ku-fu--n',
    meaning: 'Volcano Pokémon'
  },
  'ワニノコ': {
    japanese: 'ワニノコ',
    romaji: 'waninoko',
    pronunciation: 'wa-ni-no-ko',
    meaning: 'Big Jaw Pokémon'
  },
  'アリゲイツ': {
    japanese: 'アリゲイツ',
    romaji: 'arigeitsu',
    pronunciation: 'a-ri-ge-i-tsu',
    meaning: 'Big Jaw Pokémon'
  },
  'オーダイル': {
    japanese: 'オーダイル',
    romaji: 'o-dairu',
    pronunciation: 'o--da-i-ru',
    meaning: 'Big Jaw Pokémon'
  },
  'オタチ': {
    japanese: 'オタチ',
    romaji: 'otachi',
    pronunciation: 'o-ta-chi',
    meaning: 'Scout Pokémon'
  },
  'オオタチ': {
    japanese: 'オオタチ',
    romaji: 'ootachi',
    pronunciation: 'o-o-ta-chi',
    meaning: 'Long Body Pokémon'
  },
  'ホーホー': {
    japanese: 'ホーホー',
    romaji: 'ho-ho-',
    pronunciation: 'ho--ho-',
    meaning: 'Owl Pokémon'
  },
  'ヨルノズク': {
    japanese: 'ヨルノズク',
    romaji: 'yorunozuku',
    pronunciation: 'yo-ru-no-zu-ku',
    meaning: 'Owl Pokémon'
  },
  'レディバ': {
    japanese: 'レディバ',
    romaji: 'redeiba',
    pronunciation: 're-de-i-ba',
    meaning: 'Five Star Pokémon'
  },
  'レディアン': {
    japanese: 'レディアン',
    romaji: 'redeian',
    pronunciation: 're-de-i-a-n',
    meaning: 'Five Star Pokémon'
  },
  'イトマル': {
    japanese: 'イトマル',
    romaji: 'itomaru',
    pronunciation: 'i-to-ma-ru',
    meaning: 'String Spit Pokémon'
  },
  'アリアドス': {
    japanese: 'アリアドス',
    romaji: 'ariadosu',
    pronunciation: 'a-ri-a-do-su',
    meaning: 'Long Leg Pokémon'
  },
  'クロバット': {
    japanese: 'クロバット',
    romaji: 'kurobatsuto',
    pronunciation: 'ku-ro-ba-tsu-to',
    meaning: 'Bat Pokémon'
  },
  'チョンチー': {
    japanese: 'チョンチー',
    romaji: 'chonchi-',
    pronunciation: 'cho-nchi-',
    meaning: 'Angler Pokémon'
  },
  'ランターン': {
    japanese: 'ランターン',
    romaji: 'ranta-n',
    pronunciation: 'ra-nta--n',
    meaning: 'Light Pokémon'
  },
  'ピチュー': {
    japanese: 'ピチュー',
    romaji: 'pichu-',
    pronunciation: 'pi-chu-',
    meaning: 'Tiny Mouse Pokémon'
  },
  'ピィ': {
    japanese: 'ピィ',
    romaji: 'pii',
    pronunciation: 'pi-i',
    meaning: 'Star Shape Pokémon'
  },
  'ププリン': {
    japanese: 'ププリン',
    romaji: 'pupurin',
    pronunciation: 'pu-pu-ri-n',
    meaning: 'Balloon Pokémon'
  },
  'トゲピー': {
    japanese: 'トゲピー',
    romaji: 'togepi-',
    pronunciation: 'to-ge-pi-',
    meaning: 'Spike Ball Pokémon'
  },
  'トゲチック': {
    japanese: 'トゲチック',
    romaji: 'togechitsuku',
    pronunciation: 'to-ge-chi-tsu-ku',
    meaning: 'Happiness Pokémon'
  },
  'ネイティ': {
    japanese: 'ネイティ',
    romaji: 'neitei',
    pronunciation: 'ne-i-te-i',
    meaning: 'Tiny Bird Pokémon'
  },
  'ネイティオ': {
    japanese: 'ネイティオ',
    romaji: 'neiteio',
    pronunciation: 'ne-i-te-i-o',
    meaning: 'Mystic Pokémon'
  },
  'メリープ': {
    japanese: 'メリープ',
    romaji: 'meri-pu',
    pronunciation: 'me-ri--pu',
    meaning: 'Wool Pokémon'
  },
  'モココ': {
    japanese: 'モココ',
    romaji: 'mokoko',
    pronunciation: 'mo-ko-ko',
    meaning: 'Wool Pokémon'
  },
  'デンリュウ': {
    japanese: 'デンリュウ',
    romaji: 'denryuu',
    pronunciation: 'de-nryu-u',
    meaning: 'Light Pokémon'
  },
  'キレイハナ': {
    japanese: 'キレイハナ',
    romaji: 'kireihana',
    pronunciation: 'ki-re-i-ha-na',
    meaning: 'Flower Pokémon'
  },
  'マリル': {
    japanese: 'マリル',
    romaji: 'mariru',
    pronunciation: 'ma-ri-ru',
    meaning: 'Aqua Mouse Pokémon'
  },
  'マリルリ': {
    japanese: 'マリルリ',
    romaji: 'mariruri',
    pronunciation: 'ma-ri-ru-ri',
    meaning: 'Aqua Rabbit Pokémon'
  },
  'ウソッキー': {
    japanese: 'ウソッキー',
    romaji: 'usotsuki-',
    pronunciation: 'u-so-tsu-ki-',
    meaning: 'Imitation Pokémon'
  },
  'ニョロトノ': {
    japanese: 'ニョロトノ',
    romaji: 'nyorotono',
    pronunciation: 'nyo-ro-to-no',
    meaning: 'Frog Pokémon'
  },
  'ハネッコ': {
    japanese: 'ハネッコ',
    romaji: 'hanetsuko',
    pronunciation: 'ha-ne-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'ポポッコ': {
    japanese: 'ポポッコ',
    romaji: 'popotsuko',
    pronunciation: 'po-po-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'ワタッコ': {
    japanese: 'ワタッコ',
    romaji: 'watatsuko',
    pronunciation: 'wa-ta-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'エイパム': {
    japanese: 'エイパム',
    romaji: 'eipamu',
    pronunciation: 'e-i-pa-mu',
    meaning: 'Long Tail Pokémon'
  },
  'ヒマナッツ': {
    japanese: 'ヒマナッツ',
    romaji: 'himanatsutsu',
    pronunciation: 'hi-ma-na-tsu-tsu',
    meaning: 'Seed Pokémon'
  },
  'キマワリ': {
    japanese: 'キマワリ',
    romaji: 'kimawari',
    pronunciation: 'ki-ma-wa-ri',
    meaning: 'Sun Pokémon'
  },
  'ヤンヤンマ': {
    japanese: 'ヤンヤンマ',
    romaji: 'yanyanma',
    pronunciation: 'ya-nya-nma',
    meaning: 'Clear Wing Pokémon'
  },
  'ウパー': {
    japanese: 'ウパー',
    romaji: 'upa-',
    pronunciation: 'u-pa-',
    meaning: 'Water Fish Pokémon'
  },
  'ヌオー': {
    japanese: 'ヌオー',
    romaji: 'nuo-',
    pronunciation: 'nu-o-',
    meaning: 'Water Fish Pokémon'
  },
  'エーフィ': {
    japanese: 'エーフィ',
    romaji: 'e-fui',
    pronunciation: 'e--fu-i',
    meaning: 'Sun Pokémon'
  },
  'ブラッキー': {
    japanese: 'ブラッキー',
    romaji: 'buratsuki-',
    pronunciation: 'bu-ra-tsu-ki-',
    meaning: 'Moonlight Pokémon'
  },
  'ヤミカラス': {
    japanese: 'ヤミカラス',
    romaji: 'yamikarasu',
    pronunciation: 'ya-mi-ka-ra-su',
    meaning: 'Darkness Pokémon'
  },
  'ヤドキング': {
    japanese: 'ヤドキング',
    romaji: 'yadokingu',
    pronunciation: 'ya-do-ki-ngu',
    meaning: 'Royal Pokémon'
  },
  'ムウマ': {
    japanese: 'ムウマ',
    romaji: 'muuma',
    pronunciation: 'mu-u-ma',
    meaning: 'Screech Pokémon'
  },
  'アンノーン': {
    japanese: 'アンノーン',
    romaji: 'anno-n',
    pronunciation: 'a-nno--n',
    meaning: 'Symbol Pokémon'
  },
  'ソーナンス': {
    japanese: 'ソーナンス',
    romaji: 'so-nansu',
    pronunciation: 'so--na-nsu',
    meaning: 'Patient Pokémon'
  },
  'キリンリキ': {
    japanese: 'キリンリキ',
    romaji: 'kirinriki',
    pronunciation: 'ki-ri-nri-ki',
    meaning: 'Long Neck Pokémon'
  },
  'クヌギダマ': {
    japanese: 'クヌギダマ',
    romaji: 'kunugidama',
    pronunciation: 'ku-nu-gi-da-ma',
    meaning: 'Bagworm Pokémon'
  },
  'フォレトス': {
    japanese: 'フォレトス',
    romaji: 'fuoretosu',
    pronunciation: 'fu-o-re-to-su',
    meaning: 'Bagworm Pokémon'
  },
  'ノコッチ': {
    japanese: 'ノコッチ',
    romaji: 'nokotsuchi',
    pronunciation: 'no-ko-tsu-chi',
    meaning: 'Land Snake Pokémon'
  },
  'グライガー': {
    japanese: 'グライガー',
    romaji: 'guraiga-',
    pronunciation: 'gu-ra-i-ga-',
    meaning: 'Fly Scorpion Pokémon'
  },
  'ハガネール': {
    japanese: 'ハガネール',
    romaji: 'hagane-ru',
    pronunciation: 'ha-ga-ne--ru',
    meaning: 'Iron Snake Pokémon'
  },
  'ブルー': {
    japanese: 'ブルー',
    romaji: 'buru-',
    pronunciation: 'bu-ru-',
    meaning: 'Fairy Pokémon'
  },
  'グランブル': {
    japanese: 'グランブル',
    romaji: 'guranburu',
    pronunciation: 'gu-ra-nbu-ru',
    meaning: 'Fairy Pokémon'
  },
  'ハリーセン': {
    japanese: 'ハリーセン',
    romaji: 'hari-sen',
    pronunciation: 'ha-ri--se-n',
    meaning: 'Balloon Pokémon'
  },
  'ハッサム': {
    japanese: 'ハッサム',
    romaji: 'hatsusamu',
    pronunciation: 'ha-tsu-sa-mu',
    meaning: 'Pincer Pokémon'
  },
  'ツボツボ': {
    japanese: 'ツボツボ',
    romaji: 'tsubotsubo',
    pronunciation: 'tsu-bo-tsu-bo',
    meaning: 'Mold Pokémon'
  },
  'ヘラクロス': {
    japanese: 'ヘラクロス',
    romaji: 'herakurosu',
    pronunciation: 'he-ra-ku-ro-su',
    meaning: 'Single Horn Pokémon'
  },
  'ニューラ': {
    japanese: 'ニューラ',
    romaji: 'nyu-ra',
    pronunciation: 'nyu--ra',
    meaning: 'Sharp Claw Pokémon'
  },
  'ヒメグマ': {
    japanese: 'ヒメグマ',
    romaji: 'himeguma',
    pronunciation: 'hi-me-gu-ma',
    meaning: 'Little Bear Pokémon'
  },
  'リングマ': {
    japanese: 'リングマ',
    romaji: 'ringuma',
    pronunciation: 'ri-ngu-ma',
    meaning: 'Hibernator Pokémon'
  },
  'マグマッグ': {
    japanese: 'マグマッグ',
    romaji: 'magumatsugu',
    pronunciation: 'ma-gu-ma-tsu-gu',
    meaning: 'Lava Pokémon'
  },
  'マグカルゴ': {
    japanese: 'マグカルゴ',
    romaji: 'magukarugo',
    pronunciation: 'ma-gu-ka-ru-go',
    meaning: 'Lava Pokémon'
  },
  'ウリムー': {
    japanese: 'ウリムー',
    romaji: 'urimu-',
    pronunciation: 'u-ri-mu-',
    meaning: 'Pig Pokémon'
  },
  'イノムー': {
    japanese: 'イノムー',
    romaji: 'inomu-',
    pronunciation: 'i-no-mu-',
    meaning: 'Swine Pokémon'
  },
  'サニーゴ': {
    japanese: 'サニーゴ',
    romaji: 'sani-go',
    pronunciation: 'sa-ni--go',
    meaning: 'Coral Pokémon'
  },
  'テッポウオ': {
    japanese: 'テッポウオ',
    romaji: 'tetsupouo',
    pronunciation: 'te-tsu-po-u-o',
    meaning: 'Jet Pokémon'
  },
  'オクタン': {
    japanese: 'オクタン',
    romaji: 'okutan',
    pronunciation: 'o-ku-ta-n',
    meaning: 'Jet Pokémon'
  },
  'デリバード': {
    japanese: 'デリバード',
    romaji: 'deriba-do',
    pronunciation: 'de-ri-ba--do',
    meaning: 'Delivery Pokémon'
  },
  'マンタイン': {
    japanese: 'マンタイン',
    romaji: 'mantain',
    pronunciation: 'ma-nta-i-n',
    meaning: 'Kite Pokémon'
  },
  'エアームド': {
    japanese: 'エアームド',
    romaji: 'ea-mudo',
    pronunciation: 'e-a--mu-do',
    meaning: 'Armor Bird Pokémon'
  },
  'デルビル': {
    japanese: 'デルビル',
    romaji: 'derubiru',
    pronunciation: 'de-ru-bi-ru',
    meaning: 'Dark Pokémon'
  },
  'ヘルガー': {
    japanese: 'ヘルガー',
    romaji: 'heruga-',
    pronunciation: 'he-ru-ga-',
    meaning: 'Dark Pokémon'
  },
  'キングドラ': {
    japanese: 'キングドラ',
    romaji: 'kingudora',
    pronunciation: 'ki-ngu-do-ra',
    meaning: 'Dragon Pokémon'
  },
  'ゴマゾウ': {
    japanese: 'ゴマゾウ',
    romaji: 'gomazou',
    pronunciation: 'go-ma-zo-u',
    meaning: 'Long Nose Pokémon'
  },
  'ドンファン': {
    japanese: 'ドンファン',
    romaji: 'donfuan',
    pronunciation: 'do-nfu-a-n',
    meaning: 'Armor Pokémon'
  },
  'ポリゴン２': {
    japanese: 'ポリゴン２',
    romaji: 'porigon２',
    pronunciation: 'po-ri-go-n２',
    meaning: 'Virtual Pokémon'
  },
  'オドシシ': {
    japanese: 'オドシシ',
    romaji: 'odoshishi',
    pronunciation: 'o-do-shi-shi',
    meaning: 'Big Horn Pokémon'
  },
  'ドーブル': {
    japanese: 'ドーブル',
    romaji: 'do-buru',
    pronunciation: 'do--bu-ru',
    meaning: 'Painter Pokémon'
  },
  'バルキー': {
    japanese: 'バルキー',
    romaji: 'baruki-',
    pronunciation: 'ba-ru-ki-',
    meaning: 'Scuffle Pokémon'
  },
  'カポエラー': {
    japanese: 'カポエラー',
    romaji: 'kapoera-',
    pronunciation: 'ka-po-e-ra-',
    meaning: 'Handstand Pokémon'
  },
  'ムチュール': {
    japanese: 'ムチュール',
    romaji: 'muchu-ru',
    pronunciation: 'mu-chu--ru',
    meaning: 'Kiss Pokémon'
  },
  'エレキッド': {
    japanese: 'エレキッド',
    romaji: 'erekitsudo',
    pronunciation: 'e-re-ki-tsu-do',
    meaning: 'Electric Pokémon'
  },
  'ブビィ': {
    japanese: 'ブビィ',
    romaji: 'bubii',
    pronunciation: 'bu-bi-i',
    meaning: 'Live Coal Pokémon'
  },
  'ミルタンク': {
    japanese: 'ミルタンク',
    romaji: 'mirutanku',
    pronunciation: 'mi-ru-ta-nku',
    meaning: 'Milk Cow Pokémon'
  },
  'ハピナス': {
    japanese: 'ハピナス',
    romaji: 'hapinasu',
    pronunciation: 'ha-pi-na-su',
    meaning: 'Happiness Pokémon'
  },
  'ライコウ': {
    japanese: 'ライコウ',
    romaji: 'raikou',
    pronunciation: 'ra-i-ko-u',
    meaning: 'Thunder Pokémon'
  },
  'エンテイ': {
    japanese: 'エンテイ',
    romaji: 'entei',
    pronunciation: 'e-nte-i',
    meaning: 'Volcano Pokémon'
  },
  'スイクン': {
    japanese: 'スイクン',
    romaji: 'suikun',
    pronunciation: 'su-i-ku-n',
    meaning: 'Aurora Pokémon'
  },
  'ヨーギラス': {
    japanese: 'ヨーギラス',
    romaji: 'yo-girasu',
    pronunciation: 'yo--gi-ra-su',
    meaning: 'Rock Skin Pokémon'
  },
  'サナギラス': {
    japanese: 'サナギラス',
    romaji: 'sanagirasu',
    pronunciation: 'sa-na-gi-ra-su',
    meaning: 'Hard Shell Pokémon'
  },
  'バンギラス': {
    japanese: 'バンギラス',
    romaji: 'bangirasu',
    pronunciation: 'ba-ngi-ra-su',
    meaning: 'Armor Pokémon'
  },
  'ルギア': {
    japanese: 'ルギア',
    romaji: 'rugia',
    pronunciation: 'ru-gi-a',
    meaning: 'Diving Pokémon'
  },
  'ホウオウ': {
    japanese: 'ホウオウ',
    romaji: 'houou',
    pronunciation: 'ho-u-o-u',
    meaning: 'Rainbow Pokémon'
  },
  'セレビィ': {
    japanese: 'セレビィ',
    romaji: 'serebii',
    pronunciation: 'se-re-bi-i',
    meaning: 'Time Travel Pokémon'
  },
  'キモリ': {
    japanese: 'キモリ',
    romaji: 'kimori',
    pronunciation: 'ki-mo-ri',
    meaning: 'Wood Gecko Pokémon'
  },
  'ジュプトル': {
    japanese: 'ジュプトル',
    romaji: 'juputoru',
    pronunciation: 'ju-pu-to-ru',
    meaning: 'Wood Gecko Pokémon'
  },
  'ジュカイン': {
    japanese: 'ジュカイン',
    romaji: 'jukain',
    pronunciation: 'ju-ka-i-n',
    meaning: 'Forest Pokémon'
  },
  'アチャモ': {
    japanese: 'アチャモ',
    romaji: 'achamo',
    pronunciation: 'a-cha-mo',
    meaning: 'Chick Pokémon'
  },
  'ワカシャモ': {
    japanese: 'ワカシャモ',
    romaji: 'wakashamo',
    pronunciation: 'wa-ka-sha-mo',
    meaning: 'Young Fowl Pokémon'
  },
  'バシャーモ': {
    japanese: 'バシャーモ',
    romaji: 'basha-mo',
    pronunciation: 'ba-sha--mo',
    meaning: 'Blaze Pokémon'
  },
  'ミズゴロウ': {
    japanese: 'ミズゴロウ',
    romaji: 'mizugorou',
    pronunciation: 'mi-zu-go-ro-u',
    meaning: 'Mud Fish Pokémon'
  },
  'ヌマクロー': {
    japanese: 'ヌマクロー',
    romaji: 'numakuro-',
    pronunciation: 'nu-ma-ku-ro-',
    meaning: 'Mud Fish Pokémon'
  },
  'ラグラージ': {
    japanese: 'ラグラージ',
    romaji: 'ragura-ji',
    pronunciation: 'ra-gu-ra--ji',
    meaning: 'Mud Fish Pokémon'
  },
  'ポチエナ': {
    japanese: 'ポチエナ',
    romaji: 'pochiena',
    pronunciation: 'po-chi-e-na',
    meaning: 'Bite Pokémon'
  },
  'グラエナ': {
    japanese: 'グラエナ',
    romaji: 'guraena',
    pronunciation: 'gu-ra-e-na',
    meaning: 'Bite Pokémon'
  },
  'ジグザグマ': {
    japanese: 'ジグザグマ',
    romaji: 'jiguzaguma',
    pronunciation: 'ji-gu-za-gu-ma',
    meaning: 'Tiny Raccoon Pokémon'
  },
  'マッスグマ': {
    japanese: 'マッスグマ',
    romaji: 'matsusuguma',
    pronunciation: 'ma-tsu-su-gu-ma',
    meaning: 'Rushing Pokémon'
  },
  'ケムッソ': {
    japanese: 'ケムッソ',
    romaji: 'kemutsuso',
    pronunciation: 'ke-mu-tsu-so',
    meaning: 'Worm Pokémon'
  },
  'カラサリス': {
    japanese: 'カラサリス',
    romaji: 'karasarisu',
    pronunciation: 'ka-ra-sa-ri-su',
    meaning: 'Cocoon Pokémon'
  },
  'アゲハント': {
    japanese: 'アゲハント',
    romaji: 'agehanto',
    pronunciation: 'a-ge-ha-nto',
    meaning: 'Butterfly Pokémon'
  },
  'マユルド': {
    japanese: 'マユルド',
    romaji: 'mayurudo',
    pronunciation: 'ma-yu-ru-do',
    meaning: 'Cocoon Pokémon'
  },
  'ドクケイル': {
    japanese: 'ドクケイル',
    romaji: 'dokukeiru',
    pronunciation: 'do-ku-ke-i-ru',
    meaning: 'Poison Moth Pokémon'
  },
  'ハスボー': {
    japanese: 'ハスボー',
    romaji: 'hasubo-',
    pronunciation: 'ha-su-bo-',
    meaning: 'Water Weed Pokémon'
  },
  'ハスブレロ': {
    japanese: 'ハスブレロ',
    romaji: 'hasuburero',
    pronunciation: 'ha-su-bu-re-ro',
    meaning: 'Jolly Pokémon'
  },
  'ルンパッパ': {
    japanese: 'ルンパッパ',
    romaji: 'runpatsupa',
    pronunciation: 'ru-npa-tsu-pa',
    meaning: 'Carefree Pokémon'
  },
  'タネボー': {
    japanese: 'タネボー',
    romaji: 'tanebo-',
    pronunciation: 'ta-ne-bo-',
    meaning: 'Acorn Pokémon'
  },
  'コノハナ': {
    japanese: 'コノハナ',
    romaji: 'konohana',
    pronunciation: 'ko-no-ha-na',
    meaning: 'Wily Pokémon'
  },
  'ダーテング': {
    japanese: 'ダーテング',
    romaji: 'da-tengu',
    pronunciation: 'da--te-ngu',
    meaning: 'Wicked Pokémon'
  },
  'スバメ': {
    japanese: 'スバメ',
    romaji: 'subame',
    pronunciation: 'su-ba-me',
    meaning: 'Tiny Swallow Pokémon'
  },
  'オオスバメ': {
    japanese: 'オオスバメ',
    romaji: 'oosubame',
    pronunciation: 'o-o-su-ba-me',
    meaning: 'Swallow Pokémon'
  },
  'キャモメ': {
    japanese: 'キャモメ',
    romaji: 'kyamome',
    pronunciation: 'kya-mo-me',
    meaning: 'Seagull Pokémon'
  },
  'ペリッパー': {
    japanese: 'ペリッパー',
    romaji: 'peritsupa-',
    pronunciation: 'pe-ri-tsu-pa-',
    meaning: 'Water Bird Pokémon'
  },
  'ラルトス': {
    japanese: 'ラルトス',
    romaji: 'rarutosu',
    pronunciation: 'ra-ru-to-su',
    meaning: 'Feeling Pokémon'
  },
  'キルリア': {
    japanese: 'キルリア',
    romaji: 'kiruria',
    pronunciation: 'ki-ru-ri-a',
    meaning: 'Emotion Pokémon'
  },
  'サーナイト': {
    japanese: 'サーナイト',
    romaji: 'sa-naito',
    pronunciation: 'sa--na-i-to',
    meaning: 'Embrace Pokémon'
  },
  'アメタマ': {
    japanese: 'アメタマ',
    romaji: 'ametama',
    pronunciation: 'a-me-ta-ma',
    meaning: 'Pond Skater Pokémon'
  },
  'アメモース': {
    japanese: 'アメモース',
    romaji: 'amemo-su',
    pronunciation: 'a-me-mo--su',
    meaning: 'Eyeball Pokémon'
  },
  'キノココ': {
    japanese: 'キノココ',
    romaji: 'kinokoko',
    pronunciation: 'ki-no-ko-ko',
    meaning: 'Mushroom Pokémon'
  },
  'キノガッサ': {
    japanese: 'キノガッサ',
    romaji: 'kinogatsusa',
    pronunciation: 'ki-no-ga-tsu-sa',
    meaning: 'Mushroom Pokémon'
  },
  'ナマケロ': {
    japanese: 'ナマケロ',
    romaji: 'namakero',
    pronunciation: 'na-ma-ke-ro',
    meaning: 'Slacker Pokémon'
  },
  'ヤルキモノ': {
    japanese: 'ヤルキモノ',
    romaji: 'yarukimono',
    pronunciation: 'ya-ru-ki-mo-no',
    meaning: 'Wild Monkey Pokémon'
  },
  'ケッキング': {
    japanese: 'ケッキング',
    romaji: 'ketsukingu',
    pronunciation: 'ke-tsu-ki-ngu',
    meaning: 'Lazy Pokémon'
  },
  'ツチニン': {
    japanese: 'ツチニン',
    romaji: 'tsuchinin',
    pronunciation: 'tsu-chi-ni-n',
    meaning: 'Trainee Pokémon'
  },
  'テッカニン': {
    japanese: 'テッカニン',
    romaji: 'tetsukanin',
    pronunciation: 'te-tsu-ka-ni-n',
    meaning: 'Ninja Pokémon'
  },
  'ヌケニン': {
    japanese: 'ヌケニン',
    romaji: 'nukenin',
    pronunciation: 'nu-ke-ni-n',
    meaning: 'Shed Pokémon'
  },
  'ゴニョニョ': {
    japanese: 'ゴニョニョ',
    romaji: 'gonyonyo',
    pronunciation: 'go-nyo-nyo',
    meaning: 'Whisper Pokémon'
  },
  'ドゴーム': {
    japanese: 'ドゴーム',
    romaji: 'dogo-mu',
    pronunciation: 'do-go--mu',
    meaning: 'Big Voice Pokémon'
  },
  'バクオング': {
    japanese: 'バクオング',
    romaji: 'bakuongu',
    pronunciation: 'ba-ku-o-ngu',
    meaning: 'Loud Noise Pokémon'
  },
  'マクノシタ': {
    japanese: 'マクノシタ',
    romaji: 'makunoshita',
    pronunciation: 'ma-ku-no-shi-ta',
    meaning: 'Guts Pokémon'
  },
  'ハリテヤマ': {
    japanese: 'ハリテヤマ',
    romaji: 'hariteyama',
    pronunciation: 'ha-ri-te-ya-ma',
    meaning: 'Arm Thrust Pokémon'
  },
  'ルリリ': {
    japanese: 'ルリリ',
    romaji: 'ruriri',
    pronunciation: 'ru-ri-ri',
    meaning: 'Polka Dot Pokémon'
  },
  'ノズパス': {
    japanese: 'ノズパス',
    romaji: 'nozupasu',
    pronunciation: 'no-zu-pa-su',
    meaning: 'Compass Pokémon'
  },
  'エネコ': {
    japanese: 'エネコ',
    romaji: 'eneko',
    pronunciation: 'e-ne-ko',
    meaning: 'Kitten Pokémon'
  },
  'エネコロロ': {
    japanese: 'エネコロロ',
    romaji: 'enekororo',
    pronunciation: 'e-ne-ko-ro-ro',
    meaning: 'Prim Pokémon'
  },
  'ヤミラミ': {
    japanese: 'ヤミラミ',
    romaji: 'yamirami',
    pronunciation: 'ya-mi-ra-mi',
    meaning: 'Darkness Pokémon'
  },
  'クチート': {
    japanese: 'クチート',
    romaji: 'kuchi-to',
    pronunciation: 'ku-chi--to',
    meaning: 'Deceiver Pokémon'
  },
  'ココドラ': {
    japanese: 'ココドラ',
    romaji: 'kokodora',
    pronunciation: 'ko-ko-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'コドラ': {
    japanese: 'コドラ',
    romaji: 'kodora',
    pronunciation: 'ko-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'ボスゴドラ': {
    japanese: 'ボスゴドラ',
    romaji: 'bosugodora',
    pronunciation: 'bo-su-go-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'アサナン': {
    japanese: 'アサナン',
    romaji: 'asanan',
    pronunciation: 'a-sa-na-n',
    meaning: 'Meditate Pokémon'
  },
  'チャーレム': {
    japanese: 'チャーレム',
    romaji: 'cha-remu',
    pronunciation: 'cha--re-mu',
    meaning: 'Meditate Pokémon'
  },
  'ラクライ': {
    japanese: 'ラクライ',
    romaji: 'rakurai',
    pronunciation: 'ra-ku-ra-i',
    meaning: 'Lightning Pokémon'
  },
  'ライボルト': {
    japanese: 'ライボルト',
    romaji: 'raiboruto',
    pronunciation: 'ra-i-bo-ru-to',
    meaning: 'Discharge Pokémon'
  },
  'プラスル': {
    japanese: 'プラスル',
    romaji: 'purasuru',
    pronunciation: 'pu-ra-su-ru',
    meaning: 'Cheering Pokémon'
  },
  'マイナン': {
    japanese: 'マイナン',
    romaji: 'mainan',
    pronunciation: 'ma-i-na-n',
    meaning: 'Cheering Pokémon'
  },
  'バルビート': {
    japanese: 'バルビート',
    romaji: 'barubi-to',
    pronunciation: 'ba-ru-bi--to',
    meaning: 'Firefly Pokémon'
  },
  'イルミーゼ': {
    japanese: 'イルミーゼ',
    romaji: 'irumi-ze',
    pronunciation: 'i-ru-mi--ze',
    meaning: 'Firefly Pokémon'
  },
  'ロゼリア': {
    japanese: 'ロゼリア',
    romaji: 'rozeria',
    pronunciation: 'ro-ze-ri-a',
    meaning: 'Thorn Pokémon'
  },
  'ゴクリン': {
    japanese: 'ゴクリン',
    romaji: 'gokurin',
    pronunciation: 'go-ku-ri-n',
    meaning: 'Stomach Pokémon'
  },
  'マルノーム': {
    japanese: 'マルノーム',
    romaji: 'maruno-mu',
    pronunciation: 'ma-ru-no--mu',
    meaning: 'Poison Bag Pokémon'
  },
  'キバニア': {
    japanese: 'キバニア',
    romaji: 'kibania',
    pronunciation: 'ki-ba-ni-a',
    meaning: 'Savage Pokémon'
  },
  'サメハダー': {
    japanese: 'サメハダー',
    romaji: 'samehada-',
    pronunciation: 'sa-me-ha-da-',
    meaning: 'Brutal Pokémon'
  },
  'ホエルコ': {
    japanese: 'ホエルコ',
    romaji: 'hoeruko',
    pronunciation: 'ho-e-ru-ko',
    meaning: 'Ball Whale Pokémon'
  },
  'ホエルオー': {
    japanese: 'ホエルオー',
    romaji: 'hoeruo-',
    pronunciation: 'ho-e-ru-o-',
    meaning: 'Float Whale Pokémon'
  },
  'ドンメル': {
    japanese: 'ドンメル',
    romaji: 'donmeru',
    pronunciation: 'do-nme-ru',
    meaning: 'Numb Pokémon'
  },
  'バクーダ': {
    japanese: 'バクーダ',
    romaji: 'baku-da',
    pronunciation: 'ba-ku--da',
    meaning: 'Eruption Pokémon'
  },
  'コータス': {
    japanese: 'コータス',
    romaji: 'ko-tasu',
    pronunciation: 'ko--ta-su',
    meaning: 'Coal Pokémon'
  },
  'バネブー': {
    japanese: 'バネブー',
    romaji: 'banebu-',
    pronunciation: 'ba-ne-bu-',
    meaning: 'Bounce Pokémon'
  },
  'ブーピッグ': {
    japanese: 'ブーピッグ',
    romaji: 'bu-pitsugu',
    pronunciation: 'bu--pi-tsu-gu',
    meaning: 'Manipulate Pokémon'
  },
  'パッチール': {
    japanese: 'パッチール',
    romaji: 'patsuchi-ru',
    pronunciation: 'pa-tsu-chi--ru',
    meaning: 'Spot Panda Pokémon'
  },
  'ナックラー': {
    japanese: 'ナックラー',
    romaji: 'natsukura-',
    pronunciation: 'na-tsu-ku-ra-',
    meaning: 'Ant Pit Pokémon'
  },
  'ビブラーバ': {
    japanese: 'ビブラーバ',
    romaji: 'bibura-ba',
    pronunciation: 'bi-bu-ra--ba',
    meaning: 'Vibration Pokémon'
  },
  'フライゴン': {
    japanese: 'フライゴン',
    romaji: 'furaigon',
    pronunciation: 'fu-ra-i-go-n',
    meaning: 'Mystic Pokémon'
  },
  'サボネア': {
    japanese: 'サボネア',
    romaji: 'sabonea',
    pronunciation: 'sa-bo-ne-a',
    meaning: 'Cactus Pokémon'
  },
  'ノクタス': {
    japanese: 'ノクタス',
    romaji: 'nokutasu',
    pronunciation: 'no-ku-ta-su',
    meaning: 'Scarecrow Pokémon'
  },
  'チルット': {
    japanese: 'チルット',
    romaji: 'chirutsuto',
    pronunciation: 'chi-ru-tsu-to',
    meaning: 'Cotton Bird Pokémon'
  },
  'チルタリス': {
    japanese: 'チルタリス',
    romaji: 'chirutarisu',
    pronunciation: 'chi-ru-ta-ri-su',
    meaning: 'Humming Pokémon'
  },
  'ザングース': {
    japanese: 'ザングース',
    romaji: 'zangu-su',
    pronunciation: 'za-ngu--su',
    meaning: 'Cat Ferret Pokémon'
  },
  'ハブネーク': {
    japanese: 'ハブネーク',
    romaji: 'habune-ku',
    pronunciation: 'ha-bu-ne--ku',
    meaning: 'Fang Snake Pokémon'
  },
  'ルナトーン': {
    japanese: 'ルナトーン',
    romaji: 'runato-n',
    pronunciation: 'ru-na-to--n',
    meaning: 'Meteorite Pokémon'
  },
  'ソルロック': {
    japanese: 'ソルロック',
    romaji: 'sorurotsuku',
    pronunciation: 'so-ru-ro-tsu-ku',
    meaning: 'Meteorite Pokémon'
  },
  'ドジョッチ': {
    japanese: 'ドジョッチ',
    romaji: 'dojotsuchi',
    pronunciation: 'do-jo-tsu-chi',
    meaning: 'Whiskers Pokémon'
  },
  'ナマズン': {
    japanese: 'ナマズン',
    romaji: 'namazun',
    pronunciation: 'na-ma-zu-n',
    meaning: 'Whiskers Pokémon'
  },
  'ヘイガニ': {
    japanese: 'ヘイガニ',
    romaji: 'heigani',
    pronunciation: 'he-i-ga-ni',
    meaning: 'Ruffian Pokémon'
  },
  'シザリガー': {
    japanese: 'シザリガー',
    romaji: 'shizariga-',
    pronunciation: 'shi-za-ri-ga-',
    meaning: 'Rogue Pokémon'
  },
  'ヤジロン': {
    japanese: 'ヤジロン',
    romaji: 'yajiron',
    pronunciation: 'ya-ji-ro-n',
    meaning: 'Clay Doll Pokémon'
  },
  'ネンドール': {
    japanese: 'ネンドール',
    romaji: 'nendo-ru',
    pronunciation: 'ne-ndo--ru',
    meaning: 'Clay Doll Pokémon'
  },
  'リリーラ': {
    japanese: 'リリーラ',
    romaji: 'riri-ra',
    pronunciation: 'ri-ri--ra',
    meaning: 'Sea Lily Pokémon'
  },
  'ユレイドル': {
    japanese: 'ユレイドル',
    romaji: 'yureidoru',
    pronunciation: 'yu-re-i-do-ru',
    meaning: 'Barnacle Pokémon'
  },
  'アノプス': {
    japanese: 'アノプス',
    romaji: 'anopusu',
    pronunciation: 'a-no-pu-su',
    meaning: 'Old Shrimp Pokémon'
  },
  'アーマルド': {
    japanese: 'アーマルド',
    romaji: 'a-marudo',
    pronunciation: 'a--ma-ru-do',
    meaning: 'Plate Pokémon'
  },
  'ヒンバス': {
    japanese: 'ヒンバス',
    romaji: 'hinbasu',
    pronunciation: 'hi-nba-su',
    meaning: 'Fish Pokémon'
  },
  'ミロカロス': {
    japanese: 'ミロカロス',
    romaji: 'mirokarosu',
    pronunciation: 'mi-ro-ka-ro-su',
    meaning: 'Tender Pokémon'
  },
  'ポワルン': {
    japanese: 'ポワルン',
    romaji: 'powarun',
    pronunciation: 'po-wa-ru-n',
    meaning: 'Weather Pokémon'
  },
  'カクレオン': {
    japanese: 'カクレオン',
    romaji: 'kakureon',
    pronunciation: 'ka-ku-re-o-n',
    meaning: 'Color Swap Pokémon'
  },
  'カゲボウズ': {
    japanese: 'カゲボウズ',
    romaji: 'kagebouzu',
    pronunciation: 'ka-ge-bo-u-zu',
    meaning: 'Puppet Pokémon'
  },
  'ジュペッタ': {
    japanese: 'ジュペッタ',
    romaji: 'jupetsuta',
    pronunciation: 'ju-pe-tsu-ta',
    meaning: 'Marionette Pokémon'
  },
  'ヨマワル': {
    japanese: 'ヨマワル',
    romaji: 'yomawaru',
    pronunciation: 'yo-ma-wa-ru',
    meaning: 'Requiem Pokémon'
  },
  'サマヨール': {
    japanese: 'サマヨール',
    romaji: 'samayo-ru',
    pronunciation: 'sa-ma-yo--ru',
    meaning: 'Beckon Pokémon'
  },
  'トロピウス': {
    japanese: 'トロピウス',
    romaji: 'toropiusu',
    pronunciation: 'to-ro-pi-u-su',
    meaning: 'Fruit Pokémon'
  },
  'チリーン': {
    japanese: 'チリーン',
    romaji: 'chiri-n',
    pronunciation: 'chi-ri--n',
    meaning: 'Wind Chime Pokémon'
  },
  'アブソル': {
    japanese: 'アブソル',
    romaji: 'abusoru',
    pronunciation: 'a-bu-so-ru',
    meaning: 'Disaster Pokémon'
  },
  'ソーナノ': {
    japanese: 'ソーナノ',
    romaji: 'so-nano',
    pronunciation: 'so--na-no',
    meaning: 'Bright Pokémon'
  },
  'ユキワラシ': {
    japanese: 'ユキワラシ',
    romaji: 'yukiwarashi',
    pronunciation: 'yu-ki-wa-ra-shi',
    meaning: 'Snow Hat Pokémon'
  },
  'オニゴーリ': {
    japanese: 'オニゴーリ',
    romaji: 'onigo-ri',
    pronunciation: 'o-ni-go--ri',
    meaning: 'Face Pokémon'
  },
  'タマザラシ': {
    japanese: 'タマザラシ',
    romaji: 'tamazarashi',
    pronunciation: 'ta-ma-za-ra-shi',
    meaning: 'Clap Pokémon'
  },
  'トドグラー': {
    japanese: 'トドグラー',
    romaji: 'todogura-',
    pronunciation: 'to-do-gu-ra-',
    meaning: 'Ball Roll Pokémon'
  },
  'トドゼルガ': {
    japanese: 'トドゼルガ',
    romaji: 'todozeruga',
    pronunciation: 'to-do-ze-ru-ga',
    meaning: 'Ice Break Pokémon'
  },
  'パールル': {
    japanese: 'パールル',
    romaji: 'pa-ruru',
    pronunciation: 'pa--ru-ru',
    meaning: 'Bivalve Pokémon'
  },
  'ハンテール': {
    japanese: 'ハンテール',
    romaji: 'hante-ru',
    pronunciation: 'ha-nte--ru',
    meaning: 'Deep Sea Pokémon'
  },
  'サクラビス': {
    japanese: 'サクラビス',
    romaji: 'sakurabisu',
    pronunciation: 'sa-ku-ra-bi-su',
    meaning: 'South Sea Pokémon'
  },
  'ジーランス': {
    japanese: 'ジーランス',
    romaji: 'ji-ransu',
    pronunciation: 'ji--ra-nsu',
    meaning: 'Longevity Pokémon'
  },
  'ラブカス': {
    japanese: 'ラブカス',
    romaji: 'rabukasu',
    pronunciation: 'ra-bu-ka-su',
    meaning: 'Rendezvous Pokémon'
  },
  'タツベイ': {
    japanese: 'タツベイ',
    romaji: 'tatsubei',
    pronunciation: 'ta-tsu-be-i',
    meaning: 'Rock Head Pokémon'
  },
  'コモルー': {
    japanese: 'コモルー',
    romaji: 'komoru-',
    pronunciation: 'ko-mo-ru-',
    meaning: 'Endurance Pokémon'
  },
  'ボーマンダ': {
    japanese: 'ボーマンダ',
    romaji: 'bo-manda',
    pronunciation: 'bo--ma-nda',
    meaning: 'Dragon Pokémon'
  },
  'ダンバル': {
    japanese: 'ダンバル',
    romaji: 'danbaru',
    pronunciation: 'da-nba-ru',
    meaning: 'Iron Ball Pokémon'
  },
  'メタング': {
    japanese: 'メタング',
    romaji: 'metangu',
    pronunciation: 'me-ta-ngu',
    meaning: 'Iron Claw Pokémon'
  },
  'メタグロス': {
    japanese: 'メタグロス',
    romaji: 'metagurosu',
    pronunciation: 'me-ta-gu-ro-su',
    meaning: 'Iron Leg Pokémon'
  },
  'レジロック': {
    japanese: 'レジロック',
    romaji: 'rejirotsuku',
    pronunciation: 're-ji-ro-tsu-ku',
    meaning: 'Rock Peak Pokémon'
  },
  'レジアイス': {
    japanese: 'レジアイス',
    romaji: 'rejiaisu',
    pronunciation: 're-ji-a-i-su',
    meaning: 'Iceberg Pokémon'
  },
  'レジスチル': {
    japanese: 'レジスチル',
    romaji: 'rejisuchiru',
    pronunciation: 're-ji-su-chi-ru',
    meaning: 'Iron Pokémon'
  },
  'ラティアス': {
    japanese: 'ラティアス',
    romaji: 'rateiasu',
    pronunciation: 'ra-te-i-a-su',
    meaning: 'Eon Pokémon'
  },
  'ラティオス': {
    japanese: 'ラティオス',
    romaji: 'rateiosu',
    pronunciation: 'ra-te-i-o-su',
    meaning: 'Eon Pokémon'
  },
  'カイオーガ': {
    japanese: 'カイオーガ',
    romaji: 'kaio-ga',
    pronunciation: 'ka-i-o--ga',
    meaning: 'Sea Basin Pokémon'
  },
  'グラードン': {
    japanese: 'グラードン',
    romaji: 'gura-don',
    pronunciation: 'gu-ra--do-n',
    meaning: 'Continent Pokémon'
  },
  'レックウザ': {
    japanese: 'レックウザ',
    romaji: 'retsukuuza',
    pronunciation: 're-tsu-ku-u-za',
    meaning: 'Sky High Pokémon'
  },
  'ジラーチ': {
    japanese: 'ジラーチ',
    romaji: 'jira-chi',
    pronunciation: 'ji-ra--chi',
    meaning: 'Wish Pokémon'
  },
  'デオキシス': {
    japanese: 'デオキシス',
    romaji: 'deokishisu',
    pronunciation: 'de-o-ki-shi-su',
    meaning: 'DNA Pokémon'
  },
  'ナエトル': {
    japanese: 'ナエトル',
    romaji: 'naetoru',
    pronunciation: 'na-e-to-ru',
    meaning: 'Tiny Leaf Pokémon'
  },
  'ハヤシガメ': {
    japanese: 'ハヤシガメ',
    romaji: 'hayashigame',
    pronunciation: 'ha-ya-shi-ga-me',
    meaning: 'Grove Pokémon'
  },
  'ドダイトス': {
    japanese: 'ドダイトス',
    romaji: 'dodaitosu',
    pronunciation: 'do-da-i-to-su',
    meaning: 'Continent Pokémon'
  },
  'ヒコザル': {
    japanese: 'ヒコザル',
    romaji: 'hikozaru',
    pronunciation: 'hi-ko-za-ru',
    meaning: 'Chimp Pokémon'
  },
  'モウカザル': {
    japanese: 'モウカザル',
    romaji: 'moukazaru',
    pronunciation: 'mo-u-ka-za-ru',
    meaning: 'Playful Pokémon'
  },
  'ゴウカザル': {
    japanese: 'ゴウカザル',
    romaji: 'goukazaru',
    pronunciation: 'go-u-ka-za-ru',
    meaning: 'Flame Pokémon'
  },
  'ポッチャマ': {
    japanese: 'ポッチャマ',
    romaji: 'potsuchama',
    pronunciation: 'po-tsu-cha-ma',
    meaning: 'Penguin Pokémon'
  },
  'ポッタイシ': {
    japanese: 'ポッタイシ',
    romaji: 'potsutaishi',
    pronunciation: 'po-tsu-ta-i-shi',
    meaning: 'Penguin Pokémon'
  },
  'エンペルト': {
    japanese: 'エンペルト',
    romaji: 'enperuto',
    pronunciation: 'e-npe-ru-to',
    meaning: 'Emperor Pokémon'
  },
  'ムックル': {
    japanese: 'ムックル',
    romaji: 'mutsukuru',
    pronunciation: 'mu-tsu-ku-ru',
    meaning: 'Starling Pokémon'
  },
  'ムクバード': {
    japanese: 'ムクバード',
    romaji: 'mukuba-do',
    pronunciation: 'mu-ku-ba--do',
    meaning: 'Starling Pokémon'
  },
  'ムクホーク': {
    japanese: 'ムクホーク',
    romaji: 'mukuho-ku',
    pronunciation: 'mu-ku-ho--ku',
    meaning: 'Predator Pokémon'
  },
  'ビッパ': {
    japanese: 'ビッパ',
    romaji: 'bitsupa',
    pronunciation: 'bi-tsu-pa',
    meaning: 'Plump Mouse Pokémon'
  },
  'ビーダル': {
    japanese: 'ビーダル',
    romaji: 'bi-daru',
    pronunciation: 'bi--da-ru',
    meaning: 'Beaver Pokémon'
  },
  'コロボーシ': {
    japanese: 'コロボーシ',
    romaji: 'korobo-shi',
    pronunciation: 'ko-ro-bo--shi',
    meaning: 'Cricket Pokémon'
  },
  'コロトック': {
    japanese: 'コロトック',
    romaji: 'korototsuku',
    pronunciation: 'ko-ro-to-tsu-ku',
    meaning: 'Cricket Pokémon'
  },
  'コリンク': {
    japanese: 'コリンク',
    romaji: 'korinku',
    pronunciation: 'ko-ri-nku',
    meaning: 'Flash Pokémon'
  },
  'ルクシオ': {
    japanese: 'ルクシオ',
    romaji: 'rukushio',
    pronunciation: 'ru-ku-shi-o',
    meaning: 'Spark Pokémon'
  },
  'レントラー': {
    japanese: 'レントラー',
    romaji: 'rentora-',
    pronunciation: 're-nto-ra-',
    meaning: 'Gleam Eyes Pokémon'
  },
  'スボミー': {
    japanese: 'スボミー',
    romaji: 'subomi-',
    pronunciation: 'su-bo-mi-',
    meaning: 'Bud Pokémon'
  },
  'ロズレイド': {
    japanese: 'ロズレイド',
    romaji: 'rozureido',
    pronunciation: 'ro-zu-re-i-do',
    meaning: 'Bouquet Pokémon'
  },
  'ズガイドス': {
    japanese: 'ズガイドス',
    romaji: 'zugaidosu',
    pronunciation: 'zu-ga-i-do-su',
    meaning: 'Head Butt Pokémon'
  },
  'ラムパルド': {
    japanese: 'ラムパルド',
    romaji: 'ramuparudo',
    pronunciation: 'ra-mu-pa-ru-do',
    meaning: 'Head Butt Pokémon'
  },
  'タテトプス': {
    japanese: 'タテトプス',
    romaji: 'tatetopusu',
    pronunciation: 'ta-te-to-pu-su',
    meaning: 'Shield Pokémon'
  },
  'トリデプス': {
    japanese: 'トリデプス',
    romaji: 'toridepusu',
    pronunciation: 'to-ri-de-pu-su',
    meaning: 'Shield Pokémon'
  },
  'ミノムッチ': {
    japanese: 'ミノムッチ',
    romaji: 'minomutsuchi',
    pronunciation: 'mi-no-mu-tsu-chi',
    meaning: 'Bagworm Pokémon'
  },
  'ミノマダム': {
    japanese: 'ミノマダム',
    romaji: 'minomadamu',
    pronunciation: 'mi-no-ma-da-mu',
    meaning: 'Bagworm Pokémon'
  },
  'ガーメイル': {
    japanese: 'ガーメイル',
    romaji: 'ga-meiru',
    pronunciation: 'ga--me-i-ru',
    meaning: 'Moth Pokémon'
  },
  'ミツハニー': {
    japanese: 'ミツハニー',
    romaji: 'mitsuhani-',
    pronunciation: 'mi-tsu-ha-ni-',
    meaning: 'Tiny Bee Pokémon'
  },
  'ビークイン': {
    japanese: 'ビークイン',
    romaji: 'bi-kuin',
    pronunciation: 'bi--ku-i-n',
    meaning: 'Beehive Pokémon'
  },
  'パチリス': {
    japanese: 'パチリス',
    romaji: 'pachirisu',
    pronunciation: 'pa-chi-ri-su',
    meaning: 'EleSquirrel Pokémon'
  },
  'ブイゼル': {
    japanese: 'ブイゼル',
    romaji: 'buizeru',
    pronunciation: 'bu-i-ze-ru',
    meaning: 'Sea Weasel Pokémon'
  },
  'フローゼル': {
    japanese: 'フローゼル',
    romaji: 'furo-zeru',
    pronunciation: 'fu-ro--ze-ru',
    meaning: 'Sea Weasel Pokémon'
  },
  'チェリンボ': {
    japanese: 'チェリンボ',
    romaji: 'chierinbo',
    pronunciation: 'chi-e-ri-nbo',
    meaning: 'Cherry Pokémon'
  },
  'チェリム': {
    japanese: 'チェリム',
    romaji: 'chierimu',
    pronunciation: 'chi-e-ri-mu',
    meaning: 'Blossom Pokémon'
  },
  'カラナクシ': {
    japanese: 'カラナクシ',
    romaji: 'karanakushi',
    pronunciation: 'ka-ra-na-ku-shi',
    meaning: 'Sea Slug Pokémon'
  },
  'トリトドン': {
    japanese: 'トリトドン',
    romaji: 'toritodon',
    pronunciation: 'to-ri-to-do-n',
    meaning: 'Sea Slug Pokémon'
  },
  'エテボース': {
    japanese: 'エテボース',
    romaji: 'etebo-su',
    pronunciation: 'e-te-bo--su',
    meaning: 'Long Tail Pokémon'
  },
  'フワンテ': {
    japanese: 'フワンテ',
    romaji: 'fuwante',
    pronunciation: 'fu-wa-nte',
    meaning: 'Balloon Pokémon'
  },
  'フワライド': {
    japanese: 'フワライド',
    romaji: 'fuwaraido',
    pronunciation: 'fu-wa-ra-i-do',
    meaning: 'Blimp Pokémon'
  },
  'ミミロル': {
    japanese: 'ミミロル',
    romaji: 'mimiroru',
    pronunciation: 'mi-mi-ro-ru',
    meaning: 'Rabbit Pokémon'
  },
  'ミミロップ': {
    japanese: 'ミミロップ',
    romaji: 'mimirotsupu',
    pronunciation: 'mi-mi-ro-tsu-pu',
    meaning: 'Rabbit Pokémon'
  },
  'ムウマージ': {
    japanese: 'ムウマージ',
    romaji: 'muuma-ji',
    pronunciation: 'mu-u-ma--ji',
    meaning: 'Magical Pokémon'
  },
  'ドンカラス': {
    japanese: 'ドンカラス',
    romaji: 'donkarasu',
    pronunciation: 'do-nka-ra-su',
    meaning: 'Big Boss Pokémon'
  },
  'ニャルマー': {
    japanese: 'ニャルマー',
    romaji: 'nyaruma-',
    pronunciation: 'nya-ru-ma-',
    meaning: 'Catty Pokémon'
  },
  'ブニャット': {
    japanese: 'ブニャット',
    romaji: 'bunyatsuto',
    pronunciation: 'bu-nya-tsu-to',
    meaning: 'Tiger Cat Pokémon'
  },
  'リーシャン': {
    japanese: 'リーシャン',
    romaji: 'ri-shan',
    pronunciation: 'ri--sha-n',
    meaning: 'Bell Pokémon'
  },
  'スカンプー': {
    japanese: 'スカンプー',
    romaji: 'sukanpu-',
    pronunciation: 'su-ka-npu-',
    meaning: 'Skunk Pokémon'
  },
  'スカタンク': {
    japanese: 'スカタンク',
    romaji: 'sukatanku',
    pronunciation: 'su-ka-ta-nku',
    meaning: 'Skunk Pokémon'
  },
  'ドーミラー': {
    japanese: 'ドーミラー',
    romaji: 'do-mira-',
    pronunciation: 'do--mi-ra-',
    meaning: 'Bronze Pokémon'
  },
  'ドータクン': {
    japanese: 'ドータクン',
    romaji: 'do-takun',
    pronunciation: 'do--ta-ku-n',
    meaning: 'Bronze Bell Pokémon'
  },
  'ウソハチ': {
    japanese: 'ウソハチ',
    romaji: 'usohachi',
    pronunciation: 'u-so-ha-chi',
    meaning: 'Bonsai Pokémon'
  },
  'マネネ': {
    japanese: 'マネネ',
    romaji: 'manene',
    pronunciation: 'ma-ne-ne',
    meaning: 'Mime Pokémon'
  },
  'ピンプク': {
    japanese: 'ピンプク',
    romaji: 'pinpuku',
    pronunciation: 'pi-npu-ku',
    meaning: 'Playhouse Pokémon'
  },
  'ペラップ': {
    japanese: 'ペラップ',
    romaji: 'peratsupu',
    pronunciation: 'pe-ra-tsu-pu',
    meaning: 'Music Note Pokémon'
  },
  'ミカルゲ': {
    japanese: 'ミカルゲ',
    romaji: 'mikaruge',
    pronunciation: 'mi-ka-ru-ge',
    meaning: 'Forbidden Pokémon'
  },
  'フカマル': {
    japanese: 'フカマル',
    romaji: 'fukamaru',
    pronunciation: 'fu-ka-ma-ru',
    meaning: 'Land Shark Pokémon'
  },
  'ガバイト': {
    japanese: 'ガバイト',
    romaji: 'gabaito',
    pronunciation: 'ga-ba-i-to',
    meaning: 'Cave Pokémon'
  },
  'ガブリアス': {
    japanese: 'ガブリアス',
    romaji: 'gaburiasu',
    pronunciation: 'ga-bu-ri-a-su',
    meaning: 'Mach Pokémon'
  },
  'ゴンベ': {
    japanese: 'ゴンベ',
    romaji: 'gonbe',
    pronunciation: 'go-nbe',
    meaning: 'Big Eater Pokémon'
  },
  'リオル': {
    japanese: 'リオル',
    romaji: 'rioru',
    pronunciation: 'ri-o-ru',
    meaning: 'Emanation Pokémon'
  },
  'ルカリオ': {
    japanese: 'ルカリオ',
    romaji: 'rukario',
    pronunciation: 'ru-ka-ri-o',
    meaning: 'Aura Pokémon'
  },
  'ヒポポタス': {
    japanese: 'ヒポポタス',
    romaji: 'hipopotasu',
    pronunciation: 'hi-po-po-ta-su',
    meaning: 'Hippo Pokémon'
  },
  'カバルドン': {
    japanese: 'カバルドン',
    romaji: 'kabarudon',
    pronunciation: 'ka-ba-ru-do-n',
    meaning: 'Heavyweight Pokémon'
  },
  'スコルピ': {
    japanese: 'スコルピ',
    romaji: 'sukorupi',
    pronunciation: 'su-ko-ru-pi',
    meaning: 'Scorpion Pokémon'
  },
  'ドラピオン': {
    japanese: 'ドラピオン',
    romaji: 'dorapion',
    pronunciation: 'do-ra-pi-o-n',
    meaning: 'Ogre Scorpion Pokémon'
  },
  'グレッグル': {
    japanese: 'グレッグル',
    romaji: 'guretsuguru',
    pronunciation: 'gu-re-tsu-gu-ru',
    meaning: 'Toxic Mouth Pokémon'
  },
  'ドクロッグ': {
    japanese: 'ドクロッグ',
    romaji: 'dokurotsugu',
    pronunciation: 'do-ku-ro-tsu-gu',
    meaning: 'Toxic Mouth Pokémon'
  },
  'マスキッパ': {
    japanese: 'マスキッパ',
    romaji: 'masukitsupa',
    pronunciation: 'ma-su-ki-tsu-pa',
    meaning: 'Bug Catcher Pokémon'
  },
  'ケイコウオ': {
    japanese: 'ケイコウオ',
    romaji: 'keikouo',
    pronunciation: 'ke-i-ko-u-o',
    meaning: 'Wing Fish Pokémon'
  },
  'ネオラント': {
    japanese: 'ネオラント',
    romaji: 'neoranto',
    pronunciation: 'ne-o-ra-nto',
    meaning: 'Neon Pokémon'
  },
  'タマンタ': {
    japanese: 'タマンタ',
    romaji: 'tamanta',
    pronunciation: 'ta-ma-nta',
    meaning: 'Kite Pokémon'
  },
  'ユキカブリ': {
    japanese: 'ユキカブリ',
    romaji: 'yukikaburi',
    pronunciation: 'yu-ki-ka-bu-ri',
    meaning: 'Frost Tree Pokémon'
  },
  'ユキノオー': {
    japanese: 'ユキノオー',
    romaji: 'yukinoo-',
    pronunciation: 'yu-ki-no-o-',
    meaning: 'Frost Tree Pokémon'
  },
  'マニューラ': {
    japanese: 'マニューラ',
    romaji: 'manyu-ra',
    pronunciation: 'ma-nyu--ra',
    meaning: 'Sharp Claw Pokémon'
  },
  'ジバコイル': {
    japanese: 'ジバコイル',
    romaji: 'jibakoiru',
    pronunciation: 'ji-ba-ko-i-ru',
    meaning: 'Magnet Area Pokémon'
  },
  'ベロベルト': {
    japanese: 'ベロベルト',
    romaji: 'beroberuto',
    pronunciation: 'be-ro-be-ru-to',
    meaning: 'Licking Pokémon'
  },
  'ドサイドン': {
    japanese: 'ドサイドン',
    romaji: 'dosaidon',
    pronunciation: 'do-sa-i-do-n',
    meaning: 'Drill Pokémon'
  },
  'モジャンボ': {
    japanese: 'モジャンボ',
    romaji: 'mojanbo',
    pronunciation: 'mo-ja-nbo',
    meaning: 'Vine Pokémon'
  },
  'エレキブル': {
    japanese: 'エレキブル',
    romaji: 'erekiburu',
    pronunciation: 'e-re-ki-bu-ru',
    meaning: 'Thunderbolt Pokémon'
  },
  'ブーバーン': {
    japanese: 'ブーバーン',
    romaji: 'bu-ba-n',
    pronunciation: 'bu--ba--n',
    meaning: 'Blast Pokémon'
  },
  'トゲキッス': {
    japanese: 'トゲキッス',
    romaji: 'togekitsusu',
    pronunciation: 'to-ge-ki-tsu-su',
    meaning: 'Jubilee Pokémon'
  },
  'メガヤンマ': {
    japanese: 'メガヤンマ',
    romaji: 'megayanma',
    pronunciation: 'me-ga-ya-nma',
    meaning: 'Ogre Darner Pokémon'
  },
  'リーフィア': {
    japanese: 'リーフィア',
    romaji: 'ri-fuia',
    pronunciation: 'ri--fu-i-a',
    meaning: 'Verdant Pokémon'
  },
  'グレイシア': {
    japanese: 'グレイシア',
    romaji: 'gureishia',
    pronunciation: 'gu-re-i-shi-a',
    meaning: 'Fresh Snow Pokémon'
  },
  'グライオン': {
    japanese: 'グライオン',
    romaji: 'guraion',
    pronunciation: 'gu-ra-i-o-n',
    meaning: 'Fang Scorpion Pokémon'
  },
  'マンムー': {
    japanese: 'マンムー',
    romaji: 'manmu-',
    pronunciation: 'ma-nmu-',
    meaning: 'Twin Tusk Pokémon'
  },
  'ポリゴンＺ': {
    japanese: 'ポリゴンＺ',
    romaji: 'porigonＺ',
    pronunciation: 'po-ri-go-nｚ',
    meaning: 'Virtual Pokémon'
  },
  'エルレイド': {
    japanese: 'エルレイド',
    romaji: 'erureido',
    pronunciation: 'e-ru-re-i-do',
    meaning: 'Blade Pokémon'
  },
  'ダイノーズ': {
    japanese: 'ダイノーズ',
    romaji: 'daino-zu',
    pronunciation: 'da-i-no--zu',
    meaning: 'Compass Pokémon'
  },
  'ヨノワール': {
    japanese: 'ヨノワール',
    romaji: 'yonowa-ru',
    pronunciation: 'yo-no-wa--ru',
    meaning: 'Gripper Pokémon'
  },
  'ユキメノコ': {
    japanese: 'ユキメノコ',
    romaji: 'yukimenoko',
    pronunciation: 'yu-ki-me-no-ko',
    meaning: 'Snow Land Pokémon'
  },
  'ロトム': {
    japanese: 'ロトム',
    romaji: 'rotomu',
    pronunciation: 'ro-to-mu',
    meaning: 'Plasma Pokémon'
  },
  'ユクシー': {
    japanese: 'ユクシー',
    romaji: 'yukushi-',
    pronunciation: 'yu-ku-shi-',
    meaning: 'Knowledge Pokémon'
  },
  'エムリット': {
    japanese: 'エムリット',
    romaji: 'emuritsuto',
    pronunciation: 'e-mu-ri-tsu-to',
    meaning: 'Emotion Pokémon'
  },
  'アグノム': {
    japanese: 'アグノム',
    romaji: 'agunomu',
    pronunciation: 'a-gu-no-mu',
    meaning: 'Willpower Pokémon'
  },
  'ディアルガ': {
    japanese: 'ディアルガ',
    romaji: 'deiaruga',
    pronunciation: 'de-i-a-ru-ga',
    meaning: 'Temporal Pokémon'
  },
  'パルキア': {
    japanese: 'パルキア',
    romaji: 'parukia',
    pronunciation: 'pa-ru-ki-a',
    meaning: 'Spatial Pokémon'
  },
  'ヒードラン': {
    japanese: 'ヒードラン',
    romaji: 'hi-doran',
    pronunciation: 'hi--do-ra-n',
    meaning: 'Lava Dome Pokémon'
  },
  'レジギガス': {
    japanese: 'レジギガス',
    romaji: 'rejigigasu',
    pronunciation: 're-ji-gi-ga-su',
    meaning: 'Colossal Pokémon'
  },
  'ギラティナ': {
    japanese: 'ギラティナ',
    romaji: 'girateina',
    pronunciation: 'gi-ra-te-i-na',
    meaning: 'Renegade Pokémon'
  },
  'クレセリア': {
    japanese: 'クレセリア',
    romaji: 'kureseria',
    pronunciation: 'ku-re-se-ri-a',
    meaning: 'Lunar Pokémon'
  },
  'フィオネ': {
    japanese: 'フィオネ',
    romaji: 'fuione',
    pronunciation: 'fu-i-o-ne',
    meaning: 'Sea Drifter Pokémon'
  },
  'マナフィ': {
    japanese: 'マナフィ',
    romaji: 'manafui',
    pronunciation: 'ma-na-fu-i',
    meaning: 'Seafaring Pokémon'
  },
  'ダークライ': {
    japanese: 'ダークライ',
    romaji: 'da-kurai',
    pronunciation: 'da--ku-ra-i',
    meaning: 'Pitch-Black Pokémon'
  },
  'シェイミ': {
    japanese: 'シェイミ',
    romaji: 'shieimi',
    pronunciation: 'shi-e-i-mi',
    meaning: 'Gratitude Pokémon'
  },
  'アルセウス': {
    japanese: 'アルセウス',
    romaji: 'aruseusu',
    pronunciation: 'a-ru-se-u-su',
    meaning: 'Alpha Pokémon'
  },
  'ビクティニ': {
    japanese: 'ビクティニ',
    romaji: 'bikuteini',
    pronunciation: 'bi-ku-te-i-ni',
    meaning: 'Victory Pokémon'
  },
  'ツタージャ': {
    japanese: 'ツタージャ',
    romaji: 'tsuta-ja',
    pronunciation: 'tsu-ta--ja',
    meaning: 'Grass Snake Pokémon'
  },
  'ジャノビー': {
    japanese: 'ジャノビー',
    romaji: 'janobi-',
    pronunciation: 'ja-no-bi-',
    meaning: 'Grass Snake Pokémon'
  },
  'ジャローダ': {
    japanese: 'ジャローダ',
    romaji: 'jaro-da',
    pronunciation: 'ja-ro--da',
    meaning: 'Regal Pokémon'
  },
  'ポカブ': {
    japanese: 'ポカブ',
    romaji: 'pokabu',
    pronunciation: 'po-ka-bu',
    meaning: 'Fire Pig Pokémon'
  },
  'チャオブー': {
    japanese: 'チャオブー',
    romaji: 'chaobu-',
    pronunciation: 'cha-o-bu-',
    meaning: 'Fire Pig Pokémon'
  },
  'エンブオー': {
    japanese: 'エンブオー',
    romaji: 'enbuo-',
    pronunciation: 'e-nbu-o-',
    meaning: 'Mega Fire Pig Pokémon'
  },
  'ミジュマル': {
    japanese: 'ミジュマル',
    romaji: 'mijumaru',
    pronunciation: 'mi-ju-ma-ru',
    meaning: 'Sea Otter Pokémon'
  },
  'フタチマル': {
    japanese: 'フタチマル',
    romaji: 'futachimaru',
    pronunciation: 'fu-ta-chi-ma-ru',
    meaning: 'Discipline Pokémon'
  },
  'ダイケンキ': {
    japanese: 'ダイケンキ',
    romaji: 'daikenki',
    pronunciation: 'da-i-ke-nki',
    meaning: 'Formidable Pokémon'
  },
  'ミネズミ': {
    japanese: 'ミネズミ',
    romaji: 'minezumi',
    pronunciation: 'mi-ne-zu-mi',
    meaning: 'Scout Pokémon'
  },
  'ミルホッグ': {
    japanese: 'ミルホッグ',
    romaji: 'miruhotsugu',
    pronunciation: 'mi-ru-ho-tsu-gu',
    meaning: 'Lookout Pokémon'
  },
  'ヨーテリー': {
    japanese: 'ヨーテリー',
    romaji: 'yo-teri-',
    pronunciation: 'yo--te-ri-',
    meaning: 'Puppy Pokémon'
  },
  'ハーデリア': {
    japanese: 'ハーデリア',
    romaji: 'ha-deria',
    pronunciation: 'ha--de-ri-a',
    meaning: 'Loyal Dog Pokémon'
  },
  'ムーランド': {
    japanese: 'ムーランド',
    romaji: 'mu-rando',
    pronunciation: 'mu--ra-ndo',
    meaning: 'Big-Hearted Pokémon'
  },
  'チョロネコ': {
    japanese: 'チョロネコ',
    romaji: 'choroneko',
    pronunciation: 'cho-ro-ne-ko',
    meaning: 'Devious Pokémon'
  },
  'レパルダス': {
    japanese: 'レパルダス',
    romaji: 'reparudasu',
    pronunciation: 're-pa-ru-da-su',
    meaning: 'Cruel Pokémon'
  },
  'ヤナップ': {
    japanese: 'ヤナップ',
    romaji: 'yanatsupu',
    pronunciation: 'ya-na-tsu-pu',
    meaning: 'Grass Monkey Pokémon'
  },
  'ヤナッキー': {
    japanese: 'ヤナッキー',
    romaji: 'yanatsuki-',
    pronunciation: 'ya-na-tsu-ki-',
    meaning: 'Thorn Monkey Pokémon'
  },
  'バオップ': {
    japanese: 'バオップ',
    romaji: 'baotsupu',
    pronunciation: 'ba-o-tsu-pu',
    meaning: 'High Temp Pokémon'
  },
  'バオッキー': {
    japanese: 'バオッキー',
    romaji: 'baotsuki-',
    pronunciation: 'ba-o-tsu-ki-',
    meaning: 'Ember Pokémon'
  },
  'ヒヤップ': {
    japanese: 'ヒヤップ',
    romaji: 'hiyatsupu',
    pronunciation: 'hi-ya-tsu-pu',
    meaning: 'Spray Pokémon'
  },
  'ヒヤッキー': {
    japanese: 'ヒヤッキー',
    romaji: 'hiyatsuki-',
    pronunciation: 'hi-ya-tsu-ki-',
    meaning: 'Geyser Pokémon'
  },
  'ムンナ': {
    japanese: 'ムンナ',
    romaji: 'munna',
    pronunciation: 'mu-nna',
    meaning: 'Dream Eater Pokémon'
  },
  'ムシャーナ': {
    japanese: 'ムシャーナ',
    romaji: 'musha-na',
    pronunciation: 'mu-sha--na',
    meaning: 'Drowsing Pokémon'
  },
  'マメパト': {
    japanese: 'マメパト',
    romaji: 'mamepato',
    pronunciation: 'ma-me-pa-to',
    meaning: 'Tiny Pigeon Pokémon'
  },
  'ハトーボー': {
    japanese: 'ハトーボー',
    romaji: 'hato-bo-',
    pronunciation: 'ha-to--bo-',
    meaning: 'Wild Pigeon Pokémon'
  },
  'ケンホロウ': {
    japanese: 'ケンホロウ',
    romaji: 'kenhorou',
    pronunciation: 'ke-nho-ro-u',
    meaning: 'Proud Pokémon'
  },
  'シママ': {
    japanese: 'シママ',
    romaji: 'shimama',
    pronunciation: 'shi-ma-ma',
    meaning: 'Electrified Pokémon'
  },
  'ゼブライカ': {
    japanese: 'ゼブライカ',
    romaji: 'zeburaika',
    pronunciation: 'ze-bu-ra-i-ka',
    meaning: 'Thunderbolt Pokémon'
  },
  'ダンゴロ': {
    japanese: 'ダンゴロ',
    romaji: 'dangoro',
    pronunciation: 'da-ngo-ro',
    meaning: 'Mantle Pokémon'
  },
  'ガントル': {
    japanese: 'ガントル',
    romaji: 'gantoru',
    pronunciation: 'ga-nto-ru',
    meaning: 'Ore Pokémon'
  },
  'ギガイアス': {
    japanese: 'ギガイアス',
    romaji: 'gigaiasu',
    pronunciation: 'gi-ga-i-a-su',
    meaning: 'Compressed Pokémon'
  },
  'コロモリ': {
    japanese: 'コロモリ',
    romaji: 'koromori',
    pronunciation: 'ko-ro-mo-ri',
    meaning: 'Bat Pokémon'
  },
  'ココロモリ': {
    japanese: 'ココロモリ',
    romaji: 'kokoromori',
    pronunciation: 'ko-ko-ro-mo-ri',
    meaning: 'Courting Pokémon'
  },
  'モグリュー': {
    japanese: 'モグリュー',
    romaji: 'moguryu-',
    pronunciation: 'mo-gu-ryu-',
    meaning: 'Mole Pokémon'
  },
  'ドリュウズ': {
    japanese: 'ドリュウズ',
    romaji: 'doryuuzu',
    pronunciation: 'do-ryu-u-zu',
    meaning: 'Subterrene Pokémon'
  },
  'タブンネ': {
    japanese: 'タブンネ',
    romaji: 'tabunne',
    pronunciation: 'ta-bu-nne',
    meaning: 'Hearing Pokémon'
  },
  'ドッコラー': {
    japanese: 'ドッコラー',
    romaji: 'dotsukora-',
    pronunciation: 'do-tsu-ko-ra-',
    meaning: 'Muscular Pokémon'
  },
  'ドテッコツ': {
    japanese: 'ドテッコツ',
    romaji: 'dotetsukotsu',
    pronunciation: 'do-te-tsu-ko-tsu',
    meaning: 'Muscular Pokémon'
  },
  'ローブシン': {
    japanese: 'ローブシン',
    romaji: 'ro-bushin',
    pronunciation: 'ro--bu-shi-n',
    meaning: 'Muscular Pokémon'
  },
  'オタマロ': {
    japanese: 'オタマロ',
    romaji: 'otamaro',
    pronunciation: 'o-ta-ma-ro',
    meaning: 'Tadpole Pokémon'
  },
  'ガマガル': {
    japanese: 'ガマガル',
    romaji: 'gamagaru',
    pronunciation: 'ga-ma-ga-ru',
    meaning: 'Vibration Pokémon'
  },
  'ガマゲロゲ': {
    japanese: 'ガマゲロゲ',
    romaji: 'gamageroge',
    pronunciation: 'ga-ma-ge-ro-ge',
    meaning: 'Vibration Pokémon'
  },
  'ナゲキ': {
    japanese: 'ナゲキ',
    romaji: 'nageki',
    pronunciation: 'na-ge-ki',
    meaning: 'Judo Pokémon'
  },
  'ダゲキ': {
    japanese: 'ダゲキ',
    romaji: 'dageki',
    pronunciation: 'da-ge-ki',
    meaning: 'Karate Pokémon'
  },
  'クルミル': {
    japanese: 'クルミル',
    romaji: 'kurumiru',
    pronunciation: 'ku-ru-mi-ru',
    meaning: 'Sewing Pokémon'
  },
  'クルマユ': {
    japanese: 'クルマユ',
    romaji: 'kurumayu',
    pronunciation: 'ku-ru-ma-yu',
    meaning: 'Leaf-Wrapped Pokémon'
  },
  'ハハコモリ': {
    japanese: 'ハハコモリ',
    romaji: 'hahakomori',
    pronunciation: 'ha-ha-ko-mo-ri',
    meaning: 'Nurturing Pokémon'
  },
  'フシデ': {
    japanese: 'フシデ',
    romaji: 'fushide',
    pronunciation: 'fu-shi-de',
    meaning: 'Centipede Pokémon'
  },
  'ホイーガ': {
    japanese: 'ホイーガ',
    romaji: 'hoi-ga',
    pronunciation: 'ho-i--ga',
    meaning: 'Curlipede Pokémon'
  },
  'ペンドラー': {
    japanese: 'ペンドラー',
    romaji: 'pendora-',
    pronunciation: 'pe-ndo-ra-',
    meaning: 'Megapede Pokémon'
  },
  'モンメン': {
    japanese: 'モンメン',
    romaji: 'monmen',
    pronunciation: 'mo-nme-n',
    meaning: 'Cotton Puff Pokémon'
  },
  'エルフーン': {
    japanese: 'エルフーン',
    romaji: 'erufu-n',
    pronunciation: 'e-ru-fu--n',
    meaning: 'Windveiled Pokémon'
  },
  'チュリネ': {
    japanese: 'チュリネ',
    romaji: 'churine',
    pronunciation: 'chu-ri-ne',
    meaning: 'Bulb Pokémon'
  },
  'ドレディア': {
    japanese: 'ドレディア',
    romaji: 'doredeia',
    pronunciation: 'do-re-de-i-a',
    meaning: 'Flowering Pokémon'
  },
  'バスラオ': {
    japanese: 'バスラオ',
    romaji: 'basurao',
    pronunciation: 'ba-su-ra-o',
    meaning: 'Hostile Pokémon'
  },
  'メグロコ': {
    japanese: 'メグロコ',
    romaji: 'meguroko',
    pronunciation: 'me-gu-ro-ko',
    meaning: 'Desert Croc Pokémon'
  },
  'ワルビル': {
    japanese: 'ワルビル',
    romaji: 'warubiru',
    pronunciation: 'wa-ru-bi-ru',
    meaning: 'Desert Croc Pokémon'
  },
  'ワルビアル': {
    japanese: 'ワルビアル',
    romaji: 'warubiaru',
    pronunciation: 'wa-ru-bi-a-ru',
    meaning: 'Intimidation Pokémon'
  },
  'ダルマッカ': {
    japanese: 'ダルマッカ',
    romaji: 'darumatsuka',
    pronunciation: 'da-ru-ma-tsu-ka',
    meaning: 'Zen Charm Pokémon'
  },
  'ヒヒダルマ': {
    japanese: 'ヒヒダルマ',
    romaji: 'hihidaruma',
    pronunciation: 'hi-hi-da-ru-ma',
    meaning: 'Blazing Pokémon'
  },
  'マラカッチ': {
    japanese: 'マラカッチ',
    romaji: 'marakatsuchi',
    pronunciation: 'ma-ra-ka-tsu-chi',
    meaning: 'Cactus Pokémon'
  },
  'イシズマイ': {
    japanese: 'イシズマイ',
    romaji: 'ishizumai',
    pronunciation: 'i-shi-zu-ma-i',
    meaning: 'Rock Inn Pokémon'
  },
  'イワパレス': {
    japanese: 'イワパレス',
    romaji: 'iwaparesu',
    pronunciation: 'i-wa-pa-re-su',
    meaning: 'Stone Home Pokémon'
  },
  'ズルッグ': {
    japanese: 'ズルッグ',
    romaji: 'zurutsugu',
    pronunciation: 'zu-ru-tsu-gu',
    meaning: 'Shedding Pokémon'
  },
  'ズルズキン': {
    japanese: 'ズルズキン',
    romaji: 'zuruzukin',
    pronunciation: 'zu-ru-zu-ki-n',
    meaning: 'Hoodlum Pokémon'
  },
  'シンボラー': {
    japanese: 'シンボラー',
    romaji: 'shinbora-',
    pronunciation: 'shi-nbo-ra-',
    meaning: 'Avianoid Pokémon'
  },
  'デスマス': {
    japanese: 'デスマス',
    romaji: 'desumasu',
    pronunciation: 'de-su-ma-su',
    meaning: 'Spirit Pokémon'
  },
  'デスカーン': {
    japanese: 'デスカーン',
    romaji: 'desuka-n',
    pronunciation: 'de-su-ka--n',
    meaning: 'Coffin Pokémon'
  },
  'プロトーガ': {
    japanese: 'プロトーガ',
    romaji: 'puroto-ga',
    pronunciation: 'pu-ro-to--ga',
    meaning: 'Prototurtle Pokémon'
  },
  'アバゴーラ': {
    japanese: 'アバゴーラ',
    romaji: 'abago-ra',
    pronunciation: 'a-ba-go--ra',
    meaning: 'Prototurtle Pokémon'
  },
  'アーケン': {
    japanese: 'アーケン',
    romaji: 'a-ken',
    pronunciation: 'a--ke-n',
    meaning: 'First Bird Pokémon'
  },
  'アーケオス': {
    japanese: 'アーケオス',
    romaji: 'a-keosu',
    pronunciation: 'a--ke-o-su',
    meaning: 'First Bird Pokémon'
  },
  'ヤブクロン': {
    japanese: 'ヤブクロン',
    romaji: 'yabukuron',
    pronunciation: 'ya-bu-ku-ro-n',
    meaning: 'Trash Bag Pokémon'
  },
  'ダストダス': {
    japanese: 'ダストダス',
    romaji: 'dasutodasu',
    pronunciation: 'da-su-to-da-su',
    meaning: 'Trash Heap Pokémon'
  },
  'ゾロア': {
    japanese: 'ゾロア',
    romaji: 'zoroa',
    pronunciation: 'zo-ro-a',
    meaning: 'Tricky Fox Pokémon'
  },
  'ゾロアーク': {
    japanese: 'ゾロアーク',
    romaji: 'zoroa-ku',
    pronunciation: 'zo-ro-a--ku',
    meaning: 'Illusion Fox Pokémon'
  },
  'チラーミィ': {
    japanese: 'チラーミィ',
    romaji: 'chira-mii',
    pronunciation: 'chi-ra--mi-i',
    meaning: 'Chinchilla Pokémon'
  },
  'チラチーノ': {
    japanese: 'チラチーノ',
    romaji: 'chirachi-no',
    pronunciation: 'chi-ra-chi--no',
    meaning: 'Scarf Pokémon'
  },
  'ゴチム': {
    japanese: 'ゴチム',
    romaji: 'gochimu',
    pronunciation: 'go-chi-mu',
    meaning: 'Fixation Pokémon'
  },
  'ゴチミル': {
    japanese: 'ゴチミル',
    romaji: 'gochimiru',
    pronunciation: 'go-chi-mi-ru',
    meaning: 'Manipulate Pokémon'
  },
  'ゴチルゼル': {
    japanese: 'ゴチルゼル',
    romaji: 'gochiruzeru',
    pronunciation: 'go-chi-ru-ze-ru',
    meaning: 'Astral Body Pokémon'
  },
  'ユニラン': {
    japanese: 'ユニラン',
    romaji: 'yuniran',
    pronunciation: 'yu-ni-ra-n',
    meaning: 'Cell Pokémon'
  },
  'ダブラン': {
    japanese: 'ダブラン',
    romaji: 'daburan',
    pronunciation: 'da-bu-ra-n',
    meaning: 'Mitosis Pokémon'
  },
  'ランクルス': {
    japanese: 'ランクルス',
    romaji: 'rankurusu',
    pronunciation: 'ra-nku-ru-su',
    meaning: 'Multiplying Pokémon'
  },
  'コアルヒー': {
    japanese: 'コアルヒー',
    romaji: 'koaruhi-',
    pronunciation: 'ko-a-ru-hi-',
    meaning: 'Water Bird Pokémon'
  },
  'スワンナ': {
    japanese: 'スワンナ',
    romaji: 'suwanna',
    pronunciation: 'su-wa-nna',
    meaning: 'White Bird Pokémon'
  },
  'バニプッチ': {
    japanese: 'バニプッチ',
    romaji: 'baniputsuchi',
    pronunciation: 'ba-ni-pu-tsu-chi',
    meaning: 'Fresh Snow Pokémon'
  },
  'バニリッチ': {
    japanese: 'バニリッチ',
    romaji: 'baniritsuchi',
    pronunciation: 'ba-ni-ri-tsu-chi',
    meaning: 'Icy Snow Pokémon'
  },
  'バイバニラ': {
    japanese: 'バイバニラ',
    romaji: 'baibanira',
    pronunciation: 'ba-i-ba-ni-ra',
    meaning: 'Snowstorm Pokémon'
  },
  'シキジカ': {
    japanese: 'シキジカ',
    romaji: 'shikijika',
    pronunciation: 'shi-ki-ji-ka',
    meaning: 'Season Pokémon'
  },
  'メブキジカ': {
    japanese: 'メブキジカ',
    romaji: 'mebukijika',
    pronunciation: 'me-bu-ki-ji-ka',
    meaning: 'Season Pokémon'
  },
  'エモンガ': {
    japanese: 'エモンガ',
    romaji: 'emonga',
    pronunciation: 'e-mo-nga',
    meaning: 'Sky Squirrel Pokémon'
  },
  'カブルモ': {
    japanese: 'カブルモ',
    romaji: 'kaburumo',
    pronunciation: 'ka-bu-ru-mo',
    meaning: 'Clamping Pokémon'
  },
  'シュバルゴ': {
    japanese: 'シュバルゴ',
    romaji: 'shubarugo',
    pronunciation: 'shu-ba-ru-go',
    meaning: 'Cavalry Pokémon'
  },
  'タマゲタケ': {
    japanese: 'タマゲタケ',
    romaji: 'tamagetake',
    pronunciation: 'ta-ma-ge-ta-ke',
    meaning: 'Mushroom Pokémon'
  },
  'モロバレル': {
    japanese: 'モロバレル',
    romaji: 'morobareru',
    pronunciation: 'mo-ro-ba-re-ru',
    meaning: 'Mushroom Pokémon'
  },
  'プルリル': {
    japanese: 'プルリル',
    romaji: 'pururiru',
    pronunciation: 'pu-ru-ri-ru',
    meaning: 'Floating Pokémon'
  },
  'ブルンゲル': {
    japanese: 'ブルンゲル',
    romaji: 'burungeru',
    pronunciation: 'bu-ru-nge-ru',
    meaning: 'Floating Pokémon'
  },
  'ママンボウ': {
    japanese: 'ママンボウ',
    romaji: 'mamanbou',
    pronunciation: 'ma-ma-nbo-u',
    meaning: 'Caring Pokémon'
  },
  'バチュル': {
    japanese: 'バチュル',
    romaji: 'bachuru',
    pronunciation: 'ba-chu-ru',
    meaning: 'Attaching Pokémon'
  },
  'デンチュラ': {
    japanese: 'デンチュラ',
    romaji: 'denchura',
    pronunciation: 'de-nchu-ra',
    meaning: 'EleSpider Pokémon'
  },
  'テッシード': {
    japanese: 'テッシード',
    romaji: 'tetsushi-do',
    pronunciation: 'te-tsu-shi--do',
    meaning: 'Thorn Seed Pokémon'
  },
  'ナットレイ': {
    japanese: 'ナットレイ',
    romaji: 'natsutorei',
    pronunciation: 'na-tsu-to-re-i',
    meaning: 'Thorn Pod Pokémon'
  },
  'ギアル': {
    japanese: 'ギアル',
    romaji: 'giaru',
    pronunciation: 'gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'ギギアル': {
    japanese: 'ギギアル',
    romaji: 'gigiaru',
    pronunciation: 'gi-gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'ギギギアル': {
    japanese: 'ギギギアル',
    romaji: 'gigigiaru',
    pronunciation: 'gi-gi-gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'シビシラス': {
    japanese: 'シビシラス',
    romaji: 'shibishirasu',
    pronunciation: 'shi-bi-shi-ra-su',
    meaning: 'EleFish Pokémon'
  },
  'シビビール': {
    japanese: 'シビビール',
    romaji: 'shibibi-ru',
    pronunciation: 'shi-bi-bi--ru',
    meaning: 'EleFish Pokémon'
  },
  'シビルドン': {
    japanese: 'シビルドン',
    romaji: 'shibirudon',
    pronunciation: 'shi-bi-ru-do-n',
    meaning: 'EleFish Pokémon'
  },
  'リグレー': {
    japanese: 'リグレー',
    romaji: 'rigure-',
    pronunciation: 'ri-gu-re-',
    meaning: 'Cerebral Pokémon'
  },
  'オーベム': {
    japanese: 'オーベム',
    romaji: 'o-bemu',
    pronunciation: 'o--be-mu',
    meaning: 'Cerebral Pokémon'
  },
  'ヒトモシ': {
    japanese: 'ヒトモシ',
    romaji: 'hitomoshi',
    pronunciation: 'hi-to-mo-shi',
    meaning: 'Candle Pokémon'
  },
  'ランプラー': {
    japanese: 'ランプラー',
    romaji: 'ranpura-',
    pronunciation: 'ra-npu-ra-',
    meaning: 'Lamp Pokémon'
  },
  'シャンデラ': {
    japanese: 'シャンデラ',
    romaji: 'shandera',
    pronunciation: 'sha-nde-ra',
    meaning: 'Luring Pokémon'
  },
  'キバゴ': {
    japanese: 'キバゴ',
    romaji: 'kibago',
    pronunciation: 'ki-ba-go',
    meaning: 'Tusk Pokémon'
  },
  'オノンド': {
    japanese: 'オノンド',
    romaji: 'onondo',
    pronunciation: 'o-no-ndo',
    meaning: 'Axe Jaw Pokémon'
  },
  'オノノクス': {
    japanese: 'オノノクス',
    romaji: 'ononokusu',
    pronunciation: 'o-no-no-ku-su',
    meaning: 'Axe Jaw Pokémon'
  },
  'クマシュン': {
    japanese: 'クマシュン',
    romaji: 'kumashun',
    pronunciation: 'ku-ma-shu-n',
    meaning: 'Chill Pokémon'
  },
  'ツンベアー': {
    japanese: 'ツンベアー',
    romaji: 'tsunbea-',
    pronunciation: 'tsu-nbe-a-',
    meaning: 'Freezing Pokémon'
  },
  'フリージオ': {
    japanese: 'フリージオ',
    romaji: 'furi-jio',
    pronunciation: 'fu-ri--ji-o',
    meaning: 'Crystallizing Pokémon'
  },
  'チョボマキ': {
    japanese: 'チョボマキ',
    romaji: 'chobomaki',
    pronunciation: 'cho-bo-ma-ki',
    meaning: 'Snail Pokémon'
  },
  'アギルダー': {
    japanese: 'アギルダー',
    romaji: 'agiruda-',
    pronunciation: 'a-gi-ru-da-',
    meaning: 'Shell Out Pokémon'
  },
  'マッギョ': {
    japanese: 'マッギョ',
    romaji: 'matsugyo',
    pronunciation: 'ma-tsu-gyo',
    meaning: 'Trap Pokémon'
  },
  'コジョフー': {
    japanese: 'コジョフー',
    romaji: 'kojofu-',
    pronunciation: 'ko-jo-fu-',
    meaning: 'Martial Arts Pokémon'
  },
  'コジョンド': {
    japanese: 'コジョンド',
    romaji: 'kojondo',
    pronunciation: 'ko-jo-ndo',
    meaning: 'Martial Arts Pokémon'
  },
  'クリムガン': {
    japanese: 'クリムガン',
    romaji: 'kurimugan',
    pronunciation: 'ku-ri-mu-ga-n',
    meaning: 'Cave Pokémon'
  },
  'ゴビット': {
    japanese: 'ゴビット',
    romaji: 'gobitsuto',
    pronunciation: 'go-bi-tsu-to',
    meaning: 'Automaton Pokémon'
  },
  'ゴルーグ': {
    japanese: 'ゴルーグ',
    romaji: 'goru-gu',
    pronunciation: 'go-ru--gu',
    meaning: 'Automaton Pokémon'
  },
  'コマタナ': {
    japanese: 'コマタナ',
    romaji: 'komatana',
    pronunciation: 'ko-ma-ta-na',
    meaning: 'Sharp Blade Pokémon'
  },
  'キリキザン': {
    japanese: 'キリキザン',
    romaji: 'kirikizan',
    pronunciation: 'ki-ri-ki-za-n',
    meaning: 'Sword Blade Pokémon'
  },
  'バッフロン': {
    japanese: 'バッフロン',
    romaji: 'batsufuron',
    pronunciation: 'ba-tsu-fu-ro-n',
    meaning: 'Bash Buffalo Pokémon'
  },
  'ワシボン': {
    japanese: 'ワシボン',
    romaji: 'washibon',
    pronunciation: 'wa-shi-bo-n',
    meaning: 'Eaglet Pokémon'
  },
  'ウォーグル': {
    japanese: 'ウォーグル',
    romaji: 'uo-guru',
    pronunciation: 'u-o--gu-ru',
    meaning: 'Valiant Pokémon'
  },
  'バルチャイ': {
    japanese: 'バルチャイ',
    romaji: 'baruchai',
    pronunciation: 'ba-ru-cha-i',
    meaning: 'Diapered Pokémon'
  },
  'バルジーナ': {
    japanese: 'バルジーナ',
    romaji: 'baruji-na',
    pronunciation: 'ba-ru-ji--na',
    meaning: 'Bone Vulture Pokémon'
  },
  'クイタラン': {
    japanese: 'クイタラン',
    romaji: 'kuitaran',
    pronunciation: 'ku-i-ta-ra-n',
    meaning: 'Anteater Pokémon'
  },
  'アイアント': {
    japanese: 'アイアント',
    romaji: 'aianto',
    pronunciation: 'a-i-a-nto',
    meaning: 'Iron Ant Pokémon'
  },
  'モノズ': {
    japanese: 'モノズ',
    romaji: 'monozu',
    pronunciation: 'mo-no-zu',
    meaning: 'Irate Pokémon'
  },
  'ジヘッド': {
    japanese: 'ジヘッド',
    romaji: 'jihetsudo',
    pronunciation: 'ji-he-tsu-do',
    meaning: 'Hostile Pokémon'
  },
  'サザンドラ': {
    japanese: 'サザンドラ',
    romaji: 'sazandora',
    pronunciation: 'sa-za-ndo-ra',
    meaning: 'Brutal Pokémon'
  },
  'メラルバ': {
    japanese: 'メラルバ',
    romaji: 'meraruba',
    pronunciation: 'me-ra-ru-ba',
    meaning: 'Torch Pokémon'
  },
  'ウルガモス': {
    japanese: 'ウルガモス',
    romaji: 'urugamosu',
    pronunciation: 'u-ru-ga-mo-su',
    meaning: 'Sun Pokémon'
  },
  'コバルオン': {
    japanese: 'コバルオン',
    romaji: 'kobaruon',
    pronunciation: 'ko-ba-ru-o-n',
    meaning: 'Iron Will Pokémon'
  },
  'テラキオン': {
    japanese: 'テラキオン',
    romaji: 'terakion',
    pronunciation: 'te-ra-ki-o-n',
    meaning: 'Cavern Pokémon'
  },
  'ビリジオン': {
    japanese: 'ビリジオン',
    romaji: 'birijion',
    pronunciation: 'bi-ri-ji-o-n',
    meaning: 'Grassland Pokémon'
  },
  'トルネロス': {
    japanese: 'トルネロス',
    romaji: 'torunerosu',
    pronunciation: 'to-ru-ne-ro-su',
    meaning: 'Cyclone Pokémon'
  },
  'ボルトロス': {
    japanese: 'ボルトロス',
    romaji: 'borutorosu',
    pronunciation: 'bo-ru-to-ro-su',
    meaning: 'Bolt Strike Pokémon'
  },
  'レシラム': {
    japanese: 'レシラム',
    romaji: 'reshiramu',
    pronunciation: 're-shi-ra-mu',
    meaning: 'Vast White Pokémon'
  },
  'ゼクロム': {
    japanese: 'ゼクロム',
    romaji: 'zekuromu',
    pronunciation: 'ze-ku-ro-mu',
    meaning: 'Deep Black Pokémon'
  },
  'ランドロス': {
    japanese: 'ランドロス',
    romaji: 'randorosu',
    pronunciation: 'ra-ndo-ro-su',
    meaning: 'Abundance Pokémon'
  },
  'キュレム': {
    japanese: 'キュレム',
    romaji: 'kyuremu',
    pronunciation: 'kyu-re-mu',
    meaning: 'Boundary Pokémon'
  },
  'ケルディオ': {
    japanese: 'ケルディオ',
    romaji: 'kerudeio',
    pronunciation: 'ke-ru-de-i-o',
    meaning: 'Colt Pokémon'
  },
  'メロエッタ': {
    japanese: 'メロエッタ',
    romaji: 'meroetsuta',
    pronunciation: 'me-ro-e-tsu-ta',
    meaning: 'Melody Pokémon'
  },
  'ゲノセクト': {
    japanese: 'ゲノセクト',
    romaji: 'genosekuto',
    pronunciation: 'ge-no-se-ku-to',
    meaning: 'Paleozoic Pokémon'
  },
  'ハリマロン': {
    japanese: 'ハリマロン',
    romaji: 'harimaron',
    pronunciation: 'ha-ri-ma-ro-n',
    meaning: 'Spiny Nut Pokémon'
  },
  'ハリボーグ': {
    japanese: 'ハリボーグ',
    romaji: 'haribo-gu',
    pronunciation: 'ha-ri-bo--gu',
    meaning: 'Spiny Armor Pokémon'
  },
  'ブリガロン': {
    japanese: 'ブリガロン',
    romaji: 'burigaron',
    pronunciation: 'bu-ri-ga-ro-n',
    meaning: 'Spiny Armor Pokémon'
  },
  'フォッコ': {
    japanese: 'フォッコ',
    romaji: 'fuotsuko',
    pronunciation: 'fu-o-tsu-ko',
    meaning: 'Fox Pokémon'
  },
  'テールナー': {
    japanese: 'テールナー',
    romaji: 'te-runa-',
    pronunciation: 'te--ru-na-',
    meaning: 'Fox Pokémon'
  },
  'マフォクシー': {
    japanese: 'マフォクシー',
    romaji: 'mafuokushi-',
    pronunciation: 'ma-fu-o-ku-shi-',
    meaning: 'Fox Pokémon'
  },
  'ケロマツ': {
    japanese: 'ケロマツ',
    romaji: 'keromatsu',
    pronunciation: 'ke-ro-ma-tsu',
    meaning: 'Bubble Frog Pokémon'
  },
  'ゲコガシラ': {
    japanese: 'ゲコガシラ',
    romaji: 'gekogashira',
    pronunciation: 'ge-ko-ga-shi-ra',
    meaning: 'Bubble Frog Pokémon'
  },
  'ゲッコウガ': {
    japanese: 'ゲッコウガ',
    romaji: 'getsukouga',
    pronunciation: 'ge-tsu-ko-u-ga',
    meaning: 'Ninja Pokémon'
  },
  'ホルビー': {
    japanese: 'ホルビー',
    romaji: 'horubi-',
    pronunciation: 'ho-ru-bi-',
    meaning: 'Digging Pokémon'
  },
  'ホルード': {
    japanese: 'ホルード',
    romaji: 'horu-do',
    pronunciation: 'ho-ru--do',
    meaning: 'Digging Pokémon'
  },
  'ヤヤコマ': {
    japanese: 'ヤヤコマ',
    romaji: 'yayakoma',
    pronunciation: 'ya-ya-ko-ma',
    meaning: 'Tiny Robin Pokémon'
  },
  'ヒノヤコマ': {
    japanese: 'ヒノヤコマ',
    romaji: 'hinoyakoma',
    pronunciation: 'hi-no-ya-ko-ma',
    meaning: 'Ember Pokémon'
  },
  'ファイアロー': {
    japanese: 'ファイアロー',
    romaji: 'fuaiaro-',
    pronunciation: 'fu-a-i-a-ro-',
    meaning: 'Scorching Pokémon'
  },
  'コフキムシ': {
    japanese: 'コフキムシ',
    romaji: 'kofukimushi',
    pronunciation: 'ko-fu-ki-mu-shi',
    meaning: 'Scatterdust Pokémon'
  },
  'コフーライ': {
    japanese: 'コフーライ',
    romaji: 'kofu-rai',
    pronunciation: 'ko-fu--ra-i',
    meaning: 'Scatterdust Pokémon'
  },
  'ビビヨン': {
    japanese: 'ビビヨン',
    romaji: 'bibiyon',
    pronunciation: 'bi-bi-yo-n',
    meaning: 'Scale Pokémon'
  },
  'シシコ': {
    japanese: 'シシコ',
    romaji: 'shishiko',
    pronunciation: 'shi-shi-ko',
    meaning: 'Lion Cub Pokémon'
  },
  'カエンジシ': {
    japanese: 'カエンジシ',
    romaji: 'kaenjishi',
    pronunciation: 'ka-e-nji-shi',
    meaning: 'Royal Pokémon'
  },
  'フラベベ': {
    japanese: 'フラベベ',
    romaji: 'furabebe',
    pronunciation: 'fu-ra-be-be',
    meaning: 'Single Bloom Pokémon'
  },
  'フラエッテ': {
    japanese: 'フラエッテ',
    romaji: 'furaetsute',
    pronunciation: 'fu-ra-e-tsu-te',
    meaning: 'Single Bloom Pokémon'
  },
  'フラージェス': {
    japanese: 'フラージェス',
    romaji: 'fura-jiesu',
    pronunciation: 'fu-ra--ji-e-su',
    meaning: 'Garden Pokémon'
  },
  'メェークル': {
    japanese: 'メェークル',
    romaji: 'mee-kuru',
    pronunciation: 'me-e--ku-ru',
    meaning: 'Mount Pokémon'
  },
  'ゴーゴート': {
    japanese: 'ゴーゴート',
    romaji: 'go-go-to',
    pronunciation: 'go--go--to',
    meaning: 'Mount Pokémon'
  },
  'ヤンチャム': {
    japanese: 'ヤンチャム',
    romaji: 'yanchamu',
    pronunciation: 'ya-ncha-mu',
    meaning: 'Playful Pokémon'
  },
  'ゴロンダ': {
    japanese: 'ゴロンダ',
    romaji: 'goronda',
    pronunciation: 'go-ro-nda',
    meaning: 'Daunting Pokémon'
  },
  'トリミアン': {
    japanese: 'トリミアン',
    romaji: 'torimian',
    pronunciation: 'to-ri-mi-a-n',
    meaning: 'Poodle Pokémon'
  },
  'ニャスパー': {
    japanese: 'ニャスパー',
    romaji: 'nyasupa-',
    pronunciation: 'nya-su-pa-',
    meaning: 'Restraint Pokémon'
  },
  'ニャオニクス': {
    japanese: 'ニャオニクス',
    romaji: 'nyaonikusu',
    pronunciation: 'nya-o-ni-ku-su',
    meaning: 'Constraint Pokémon'
  },
  'ヒトツキ': {
    japanese: 'ヒトツキ',
    romaji: 'hitotsuki',
    pronunciation: 'hi-to-tsu-ki',
    meaning: 'Sword Pokémon'
  },
  'ニダンギル': {
    japanese: 'ニダンギル',
    romaji: 'nidangiru',
    pronunciation: 'ni-da-ngi-ru',
    meaning: 'Sword Pokémon'
  },
  'ギルガルド': {
    japanese: 'ギルガルド',
    romaji: 'girugarudo',
    pronunciation: 'gi-ru-ga-ru-do',
    meaning: 'Royal Sword Pokémon'
  },
  'シュシュプ': {
    japanese: 'シュシュプ',
    romaji: 'shushupu',
    pronunciation: 'shu-shu-pu',
    meaning: 'Perfume Pokémon'
  },
  'フレフワン': {
    japanese: 'フレフワン',
    romaji: 'furefuwan',
    pronunciation: 'fu-re-fu-wa-n',
    meaning: 'Fragrance Pokémon'
  },
  'ペロッパフ': {
    japanese: 'ペロッパフ',
    romaji: 'perotsupafu',
    pronunciation: 'pe-ro-tsu-pa-fu',
    meaning: 'Cotton Candy Pokémon'
  },
  'ペロリーム': {
    japanese: 'ペロリーム',
    romaji: 'perori-mu',
    pronunciation: 'pe-ro-ri--mu',
    meaning: 'Meringue Pokémon'
  },
  'マーイーカ': {
    japanese: 'マーイーカ',
    romaji: 'ma-i-ka',
    pronunciation: 'ma--i--ka',
    meaning: 'Revolving Pokémon'
  },
  'カラマネロ': {
    japanese: 'カラマネロ',
    romaji: 'karamanero',
    pronunciation: 'ka-ra-ma-ne-ro',
    meaning: 'Overturning Pokémon'
  },
  'カメテテ': {
    japanese: 'カメテテ',
    romaji: 'kametete',
    pronunciation: 'ka-me-te-te',
    meaning: 'Two-Handed Pokémon'
  },
  'ガメノデス': {
    japanese: 'ガメノデス',
    romaji: 'gamenodesu',
    pronunciation: 'ga-me-no-de-su',
    meaning: 'Collective Pokémon'
  },
  'クズモー': {
    japanese: 'クズモー',
    romaji: 'kuzumo-',
    pronunciation: 'ku-zu-mo-',
    meaning: 'Mock Kelp Pokémon'
  },
  'ドラミドロ': {
    japanese: 'ドラミドロ',
    romaji: 'doramidoro',
    pronunciation: 'do-ra-mi-do-ro',
    meaning: 'Mock Kelp Pokémon'
  },
  'ウデッポウ': {
    japanese: 'ウデッポウ',
    romaji: 'udetsupou',
    pronunciation: 'u-de-tsu-po-u',
    meaning: 'Water Gun Pokémon'
  },
  'ブロスター': {
    japanese: 'ブロスター',
    romaji: 'burosuta-',
    pronunciation: 'bu-ro-su-ta-',
    meaning: 'Howitzer Pokémon'
  },
  'エリキテル': {
    japanese: 'エリキテル',
    romaji: 'erikiteru',
    pronunciation: 'e-ri-ki-te-ru',
    meaning: 'Generator Pokémon'
  },
  'エレザード': {
    japanese: 'エレザード',
    romaji: 'ereza-do',
    pronunciation: 'e-re-za--do',
    meaning: 'Generator Pokémon'
  },
  'チゴラス': {
    japanese: 'チゴラス',
    romaji: 'chigorasu',
    pronunciation: 'chi-go-ra-su',
    meaning: 'Royal Heir Pokémon'
  },
  'ガチゴラス': {
    japanese: 'ガチゴラス',
    romaji: 'gachigorasu',
    pronunciation: 'ga-chi-go-ra-su',
    meaning: 'Despot Pokémon'
  },
  'アマルス': {
    japanese: 'アマルス',
    romaji: 'amarusu',
    pronunciation: 'a-ma-ru-su',
    meaning: 'Tundra Pokémon'
  },
  'アマルルガ': {
    japanese: 'アマルルガ',
    romaji: 'amaruruga',
    pronunciation: 'a-ma-ru-ru-ga',
    meaning: 'Tundra Pokémon'
  },
  'ニンフィア': {
    japanese: 'ニンフィア',
    romaji: 'ninfuia',
    pronunciation: 'ni-nfu-i-a',
    meaning: 'Intertwining Pokémon'
  },
  'ルチャブル': {
    japanese: 'ルチャブル',
    romaji: 'ruchaburu',
    pronunciation: 'ru-cha-bu-ru',
    meaning: 'Wrestling Pokémon'
  },
  'デデンネ': {
    japanese: 'デデンネ',
    romaji: 'dedenne',
    pronunciation: 'de-de-nne',
    meaning: 'Antenna Pokémon'
  },
  'メレシー': {
    japanese: 'メレシー',
    romaji: 'mereshi-',
    pronunciation: 'me-re-shi-',
    meaning: 'Jewel Pokémon'
  },
  'ヌメラ': {
    japanese: 'ヌメラ',
    romaji: 'numera',
    pronunciation: 'nu-me-ra',
    meaning: 'Soft Tissue Pokémon'
  },
  'ヌメイル': {
    japanese: 'ヌメイル',
    romaji: 'numeiru',
    pronunciation: 'nu-me-i-ru',
    meaning: 'Soft Tissue Pokémon'
  },
  'ヌメルゴン': {
    japanese: 'ヌメルゴン',
    romaji: 'numerugon',
    pronunciation: 'nu-me-ru-go-n',
    meaning: 'Dragon Pokémon'
  },
  'クレッフィ': {
    japanese: 'クレッフィ',
    romaji: 'kuretsufui',
    pronunciation: 'ku-re-tsu-fu-i',
    meaning: 'Key Ring Pokémon'
  },
  'ボクレー': {
    japanese: 'ボクレー',
    romaji: 'bokure-',
    pronunciation: 'bo-ku-re-',
    meaning: 'Stump Pokémon'
  },
  'オーロット': {
    japanese: 'オーロット',
    romaji: 'o-rotsuto',
    pronunciation: 'o--ro-tsu-to',
    meaning: 'Elder Tree Pokémon'
  },
  'バケッチャ': {
    japanese: 'バケッチャ',
    romaji: 'baketsucha',
    pronunciation: 'ba-ke-tsu-cha',
    meaning: 'Pumpkin Pokémon'
  },
  'パンプジン': {
    japanese: 'パンプジン',
    romaji: 'panpujin',
    pronunciation: 'pa-npu-ji-n',
    meaning: 'Pumpkin Pokémon'
  },
  'カチコール': {
    japanese: 'カチコール',
    romaji: 'kachiko-ru',
    pronunciation: 'ka-chi-ko--ru',
    meaning: 'Ice Chunk Pokémon'
  },
  'クレベース': {
    japanese: 'クレベース',
    romaji: 'kurebe-su',
    pronunciation: 'ku-re-be--su',
    meaning: 'Iceberg Pokémon'
  },
  'オンバット': {
    japanese: 'オンバット',
    romaji: 'onbatsuto',
    pronunciation: 'o-nba-tsu-to',
    meaning: 'Sound Wave Pokémon'
  },
  'オンバーン': {
    japanese: 'オンバーン',
    romaji: 'onba-n',
    pronunciation: 'o-nba--n',
    meaning: 'Sound Wave Pokémon'
  },
  'ゼルネアス': {
    japanese: 'ゼルネアス',
    romaji: 'zeruneasu',
    pronunciation: 'ze-ru-ne-a-su',
    meaning: 'Life Pokémon'
  },
  'イベルタル': {
    japanese: 'イベルタル',
    romaji: 'iberutaru',
    pronunciation: 'i-be-ru-ta-ru',
    meaning: 'Destruction Pokémon'
  },
  'ジガルデ': {
    japanese: 'ジガルデ',
    romaji: 'jigarude',
    pronunciation: 'ji-ga-ru-de',
    meaning: 'Order Pokémon'
  },
  'ディアンシー': {
    japanese: 'ディアンシー',
    romaji: 'deianshi-',
    pronunciation: 'de-i-a-nshi-',
    meaning: 'Jewel Pokémon'
  },
  'フーパ': {
    japanese: 'フーパ',
    romaji: 'fu-pa',
    pronunciation: 'fu--pa',
    meaning: 'Mischief Pokémon'
  },
  'ボルケニオン': {
    japanese: 'ボルケニオン',
    romaji: 'borukenion',
    pronunciation: 'bo-ru-ke-ni-o-n',
    meaning: 'Steam Pokémon'
  },
  'モクロー': {
    japanese: 'モクロー',
    romaji: 'mokuro-',
    pronunciation: 'mo-ku-ro-',
    meaning: 'Grass Quill Pokémon'
  },
  'フクスロー': {
    japanese: 'フクスロー',
    romaji: 'fukusuro-',
    pronunciation: 'fu-ku-su-ro-',
    meaning: 'Blade Quill Pokémon'
  },
  'ジュナイパー': {
    japanese: 'ジュナイパー',
    romaji: 'junaipa-',
    pronunciation: 'ju-na-i-pa-',
    meaning: 'Arrow Quill Pokémon'
  },
  'ニャビー': {
    japanese: 'ニャビー',
    romaji: 'nyabi-',
    pronunciation: 'nya-bi-',
    meaning: 'Fire Cat Pokémon'
  },
  'ニャヒート': {
    japanese: 'ニャヒート',
    romaji: 'nyahi-to',
    pronunciation: 'nya-hi--to',
    meaning: 'Fire Cat Pokémon'
  },
  'ガオガエン': {
    japanese: 'ガオガエン',
    romaji: 'gaogaen',
    pronunciation: 'ga-o-ga-e-n',
    meaning: 'Heel Pokémon'
  },
  'アシマリ': {
    japanese: 'アシマリ',
    romaji: 'ashimari',
    pronunciation: 'a-shi-ma-ri',
    meaning: 'Sea Lion Pokémon'
  },
  'オシャマリ': {
    japanese: 'オシャマリ',
    romaji: 'oshamari',
    pronunciation: 'o-sha-ma-ri',
    meaning: 'Pop Star Pokémon'
  },
  'アシレーヌ': {
    japanese: 'アシレーヌ',
    romaji: 'ashire-nu',
    pronunciation: 'a-shi-re--nu',
    meaning: 'Soloist Pokémon'
  },
  'ツツケラ': {
    japanese: 'ツツケラ',
    romaji: 'tsutsukera',
    pronunciation: 'tsu-tsu-ke-ra',
    meaning: 'Woodpecker Pokémon'
  },
  'ケララッパ': {
    japanese: 'ケララッパ',
    romaji: 'keraratsupa',
    pronunciation: 'ke-ra-ra-tsu-pa',
    meaning: 'Bugle Beak Pokémon'
  },
  'ドデカバシ': {
    japanese: 'ドデカバシ',
    romaji: 'dodekabashi',
    pronunciation: 'do-de-ka-ba-shi',
    meaning: 'Cannon Pokémon'
  },
  'ヤングース': {
    japanese: 'ヤングース',
    romaji: 'yangu-su',
    pronunciation: 'ya-ngu--su',
    meaning: 'Loitering Pokémon'
  },
  'デカグース': {
    japanese: 'デカグース',
    romaji: 'dekagu-su',
    pronunciation: 'de-ka-gu--su',
    meaning: 'Stakeout Pokémon'
  },
  'アゴジムシ': {
    japanese: 'アゴジムシ',
    romaji: 'agojimushi',
    pronunciation: 'a-go-ji-mu-shi',
    meaning: 'Larva Pokémon'
  },
  'デンヂムシ': {
    japanese: 'デンヂムシ',
    romaji: 'denjimushi',
    pronunciation: 'de-nji-mu-shi',
    meaning: 'Battery Pokémon'
  },
  'クワガノン': {
    japanese: 'クワガノン',
    romaji: 'kuwaganon',
    pronunciation: 'ku-wa-ga-no-n',
    meaning: 'Stag Beetle Pokémon'
  },
  'マケンカニ': {
    japanese: 'マケンカニ',
    romaji: 'makenkani',
    pronunciation: 'ma-ke-nka-ni',
    meaning: 'Boxing Pokémon'
  },
  'ケケンカニ': {
    japanese: 'ケケンカニ',
    romaji: 'kekenkani',
    pronunciation: 'ke-ke-nka-ni',
    meaning: 'Woolly Crab Pokémon'
  },
  'オドリドリ': {
    japanese: 'オドリドリ',
    romaji: 'odoridori',
    pronunciation: 'o-do-ri-do-ri',
    meaning: 'Dancing Pokémon'
  },
  'アブリー': {
    japanese: 'アブリー',
    romaji: 'aburi-',
    pronunciation: 'a-bu-ri-',
    meaning: 'Bee Fly Pokémon'
  },
  'アブリボン': {
    japanese: 'アブリボン',
    romaji: 'aburibon',
    pronunciation: 'a-bu-ri-bo-n',
    meaning: 'Bee Fly Pokémon'
  },
  'イワンコ': {
    japanese: 'イワンコ',
    romaji: 'iwanko',
    pronunciation: 'i-wa-nko',
    meaning: 'Puppy Pokémon'
  },
  'ルガルガン': {
    japanese: 'ルガルガン',
    romaji: 'rugarugan',
    pronunciation: 'ru-ga-ru-ga-n',
    meaning: 'Wolf Pokémon'
  },
  'ヨワシ': {
    japanese: 'ヨワシ',
    romaji: 'yowashi',
    pronunciation: 'yo-wa-shi',
    meaning: 'Small Fry Pokémon'
  },
  'ヒドイデ': {
    japanese: 'ヒドイデ',
    romaji: 'hidoide',
    pronunciation: 'hi-do-i-de',
    meaning: 'Brutal Star Pokémon'
  },
  'ドヒドイデ': {
    japanese: 'ドヒドイデ',
    romaji: 'dohidoide',
    pronunciation: 'do-hi-do-i-de',
    meaning: 'Brutal Star Pokémon'
  },
  'ドロバンコ': {
    japanese: 'ドロバンコ',
    romaji: 'dorobanko',
    pronunciation: 'do-ro-ba-nko',
    meaning: 'Donkey Pokémon'
  },
  'バンバドロ': {
    japanese: 'バンバドロ',
    romaji: 'banbadoro',
    pronunciation: 'ba-nba-do-ro',
    meaning: 'Draft Horse Pokémon'
  },
  'シズクモ': {
    japanese: 'シズクモ',
    romaji: 'shizukumo',
    pronunciation: 'shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon'
  },
  'オニシズクモ': {
    japanese: 'オニシズクモ',
    romaji: 'onishizukumo',
    pronunciation: 'o-ni-shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon'
  },
  'カリキリ': {
    japanese: 'カリキリ',
    romaji: 'karikiri',
    pronunciation: 'ka-ri-ki-ri',
    meaning: 'Sickle Grass Pokémon'
  },
  'ラランテス': {
    japanese: 'ラランテス',
    romaji: 'rarantesu',
    pronunciation: 'ra-ra-nte-su',
    meaning: 'Bloom Sickle Pokémon'
  },
  'ネマシュ': {
    japanese: 'ネマシュ',
    romaji: 'nemashu',
    pronunciation: 'ne-ma-shu',
    meaning: 'Illuminating Pokémon'
  },
  'マシェード': {
    japanese: 'マシェード',
    romaji: 'mashie-do',
    pronunciation: 'ma-shi-e--do',
    meaning: 'Illuminating Pokémon'
  },
  'ヤトウモリ': {
    japanese: 'ヤトウモリ',
    romaji: 'yatoumori',
    pronunciation: 'ya-to-u-mo-ri',
    meaning: 'Toxic Lizard Pokémon'
  },
  'エンニュート': {
    japanese: 'エンニュート',
    romaji: 'ennyu-to',
    pronunciation: 'e-nnyu--to',
    meaning: 'Toxic Lizard Pokémon'
  },
  'ヌイコグマ': {
    japanese: 'ヌイコグマ',
    romaji: 'nuikoguma',
    pronunciation: 'nu-i-ko-gu-ma',
    meaning: 'Flailing Pokémon'
  },
  'キテルグマ': {
    japanese: 'キテルグマ',
    romaji: 'kiteruguma',
    pronunciation: 'ki-te-ru-gu-ma',
    meaning: 'Strong Arm Pokémon'
  },
  'アマカジ': {
    japanese: 'アマカジ',
    romaji: 'amakaji',
    pronunciation: 'a-ma-ka-ji',
    meaning: 'Fruit Pokémon'
  },
  'アママイコ': {
    japanese: 'アママイコ',
    romaji: 'amamaiko',
    pronunciation: 'a-ma-ma-i-ko',
    meaning: 'Fruit Pokémon'
  },
  'アマージョ': {
    japanese: 'アマージョ',
    romaji: 'ama-jo',
    pronunciation: 'a-ma--jo',
    meaning: 'Fruit Pokémon'
  },
  'キュワワー': {
    japanese: 'キュワワー',
    romaji: 'kyuwawa-',
    pronunciation: 'kyu-wa-wa-',
    meaning: 'Posy Picker Pokémon'
  },
  'ヤレユータン': {
    japanese: 'ヤレユータン',
    romaji: 'yareyu-tan',
    pronunciation: 'ya-re-yu--ta-n',
    meaning: 'Sage Pokémon'
  },
  'ナゲツケサル': {
    japanese: 'ナゲツケサル',
    romaji: 'nagetsukesaru',
    pronunciation: 'na-ge-tsu-ke-sa-ru',
    meaning: 'Teamwork Pokémon'
  },
  'コソクムシ': {
    japanese: 'コソクムシ',
    romaji: 'kosokumushi',
    pronunciation: 'ko-so-ku-mu-shi',
    meaning: 'Turn Tail Pokémon'
  },
  'グソクムシャ': {
    japanese: 'グソクムシャ',
    romaji: 'gusokumusha',
    pronunciation: 'gu-so-ku-mu-sha',
    meaning: 'Hard Scale Pokémon'
  },
  'スナバァ': {
    japanese: 'スナバァ',
    romaji: 'sunabaa',
    pronunciation: 'su-na-ba-a',
    meaning: 'Sand Heap Pokémon'
  },
  'シロデスナ': {
    japanese: 'シロデスナ',
    romaji: 'shirodesuna',
    pronunciation: 'shi-ro-de-su-na',
    meaning: 'Sand Castle Pokémon'
  },
  'ナマコブシ': {
    japanese: 'ナマコブシ',
    romaji: 'namakobushi',
    pronunciation: 'na-ma-ko-bu-shi',
    meaning: 'Sea Cucumber Pokémon'
  },
  'タイプ：ヌル': {
    japanese: 'タイプ：ヌル',
    romaji: 'taipu：nuru',
    pronunciation: 'ta-i-pu-：nu-ru',
    meaning: 'Synthetic Pokémon'
  },
  'シルヴァディ': {
    japanese: 'シルヴァディ',
    romaji: 'shiruヴadei',
    pronunciation: 'shi-ru-ヴa-de-i',
    meaning: 'Synthetic Pokémon'
  },
  'メテノ': {
    japanese: 'メテノ',
    romaji: 'meteno',
    pronunciation: 'me-te-no',
    meaning: 'Meteor Pokémon'
  },
  'ネッコアラ': {
    japanese: 'ネッコアラ',
    romaji: 'netsukoara',
    pronunciation: 'ne-tsu-ko-a-ra',
    meaning: 'Drowsing Pokémon'
  },
  'バクガメス': {
    japanese: 'バクガメス',
    romaji: 'bakugamesu',
    pronunciation: 'ba-ku-ga-me-su',
    meaning: 'Blast Turtle Pokémon'
  },
  'トゲデマル': {
    japanese: 'トゲデマル',
    romaji: 'togedemaru',
    pronunciation: 'to-ge-de-ma-ru',
    meaning: 'Roly-Poly Pokémon'
  },
  'ミミッキュ': {
    japanese: 'ミミッキュ',
    romaji: 'mimitsukyu',
    pronunciation: 'mi-mi-tsu-kyu',
    meaning: 'Disguise Pokémon'
  },
  'ハギギシリ': {
    japanese: 'ハギギシリ',
    romaji: 'hagigishiri',
    pronunciation: 'ha-gi-gi-shi-ri',
    meaning: 'Gnash Teeth Pokémon'
  },
  'ジジーロン': {
    japanese: 'ジジーロン',
    romaji: 'jiji-ron',
    pronunciation: 'ji-ji--ro-n',
    meaning: 'Placid Pokémon'
  },
  'ダダリン': {
    japanese: 'ダダリン',
    romaji: 'dadarin',
    pronunciation: 'da-da-ri-n',
    meaning: 'Sea Creeper Pokémon'
  },
  'ジャラコ': {
    japanese: 'ジャラコ',
    romaji: 'jarako',
    pronunciation: 'ja-ra-ko',
    meaning: 'Scaly Pokémon'
  },
  'ジャランゴ': {
    japanese: 'ジャランゴ',
    romaji: 'jarango',
    pronunciation: 'ja-ra-ngo',
    meaning: 'Scaly Pokémon'
  },
  'ジャラランガ': {
    japanese: 'ジャラランガ',
    romaji: 'jararanga',
    pronunciation: 'ja-ra-ra-nga',
    meaning: 'Scaly Pokémon'
  },
  'カプ・コケコ': {
    japanese: 'カプ・コケコ',
    romaji: 'kapu・kokeko',
    pronunciation: 'ka-pu-・ko-ke-ko',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・テテフ': {
    japanese: 'カプ・テテフ',
    romaji: 'kapu・tetefu',
    pronunciation: 'ka-pu-・te-te-fu',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・ブルル': {
    japanese: 'カプ・ブルル',
    romaji: 'kapu・bururu',
    pronunciation: 'ka-pu-・bu-ru-ru',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・レヒレ': {
    japanese: 'カプ・レヒレ',
    romaji: 'kapu・rehire',
    pronunciation: 'ka-pu-・re-hi-re',
    meaning: 'Land Spirit Pokémon'
  },
  'コスモッグ': {
    japanese: 'コスモッグ',
    romaji: 'kosumotsugu',
    pronunciation: 'ko-su-mo-tsu-gu',
    meaning: 'Nebula Pokémon'
  },
  'コスモウム': {
    japanese: 'コスモウム',
    romaji: 'kosumoumu',
    pronunciation: 'ko-su-mo-u-mu',
    meaning: 'Protostar Pokémon'
  },
  'ソルガレオ': {
    japanese: 'ソルガレオ',
    romaji: 'sorugareo',
    pronunciation: 'so-ru-ga-re-o',
    meaning: 'Sunne Pokémon'
  },
  'ルナアーラ': {
    japanese: 'ルナアーラ',
    romaji: 'runaa-ra',
    pronunciation: 'ru-na-a--ra',
    meaning: 'Moone Pokémon'
  },
  'ウツロイド': {
    japanese: 'ウツロイド',
    romaji: 'utsuroido',
    pronunciation: 'u-tsu-ro-i-do',
    meaning: 'Parasite Pokémon'
  },
  'マッシブーン': {
    japanese: 'マッシブーン',
    romaji: 'matsushibu-n',
    pronunciation: 'ma-tsu-shi-bu--n',
    meaning: 'Swollen Pokémon'
  },
  'フェローチェ': {
    japanese: 'フェローチェ',
    romaji: 'fuero-chie',
    pronunciation: 'fu-e-ro--chi-e',
    meaning: 'Lissome Pokémon'
  },
  'デンジュモク': {
    japanese: 'デンジュモク',
    romaji: 'denjumoku',
    pronunciation: 'de-nju-mo-ku',
    meaning: 'Glowing Pokémon'
  },
  'テッカグヤ': {
    japanese: 'テッカグヤ',
    romaji: 'tetsukaguya',
    pronunciation: 'te-tsu-ka-gu-ya',
    meaning: 'Launch Pokémon'
  },
  'カミツルギ': {
    japanese: 'カミツルギ',
    romaji: 'kamitsurugi',
    pronunciation: 'ka-mi-tsu-ru-gi',
    meaning: 'Drawn Sword Pokémon'
  },
  'アクジキング': {
    japanese: 'アクジキング',
    romaji: 'akujikingu',
    pronunciation: 'a-ku-ji-ki-ngu',
    meaning: 'Junkivore Pokémon'
  },
  'ネクロズマ': {
    japanese: 'ネクロズマ',
    romaji: 'nekurozuma',
    pronunciation: 'ne-ku-ro-zu-ma',
    meaning: 'Prism Pokémon'
  },
  'マギアナ': {
    japanese: 'マギアナ',
    romaji: 'magiana',
    pronunciation: 'ma-gi-a-na',
    meaning: 'Artificial Pokémon'
  },
  'マーシャドー': {
    japanese: 'マーシャドー',
    romaji: 'ma-shado-',
    pronunciation: 'ma--sha-do-',
    meaning: 'Gloomdweller Pokémon'
  },
  'ベベノム': {
    japanese: 'ベベノム',
    romaji: 'bebenomu',
    pronunciation: 'be-be-no-mu',
    meaning: 'Poison Pin Pokémon'
  },
  'アーゴヨン': {
    japanese: 'アーゴヨン',
    romaji: 'a-goyon',
    pronunciation: 'a--go-yo-n',
    meaning: 'Poison Pin Pokémon'
  },
  'ツンデツンデ': {
    japanese: 'ツンデツンデ',
    romaji: 'tsundetsunde',
    pronunciation: 'tsu-nde-tsu-nde',
    meaning: 'Rampart Pokémon'
  },
  'ズガドーン': {
    japanese: 'ズガドーン',
    romaji: 'zugado-n',
    pronunciation: 'zu-ga-do--n',
    meaning: 'Fireworks Pokémon'
  },
  'ゼラオラ': {
    japanese: 'ゼラオラ',
    romaji: 'zeraora',
    pronunciation: 'ze-ra-o-ra',
    meaning: 'Thunderclap Pokémon'
  },
  'メルタン': {
    japanese: 'メルタン',
    romaji: 'merutan',
    pronunciation: 'me-ru-ta-n',
    meaning: 'Hex Nut Pokémon'
  },
  'メルメタル': {
    japanese: 'メルメタル',
    romaji: 'merumetaru',
    pronunciation: 'me-ru-me-ta-ru',
    meaning: 'Hex Nut Pokémon'
  },
  'サルノリ': {
    japanese: 'サルノリ',
    romaji: 'sarunori',
    pronunciation: 'sa-ru-no-ri',
    meaning: 'Chimp Pokémon'
  },
  'バチンキー': {
    japanese: 'バチンキー',
    romaji: 'bachinki-',
    pronunciation: 'ba-chi-nki-',
    meaning: 'Beat Pokémon'
  },
  'ゴリランダー': {
    japanese: 'ゴリランダー',
    romaji: 'goriranda-',
    pronunciation: 'go-ri-ra-nda-',
    meaning: 'Drummer Pokémon'
  },
  'ヒバニー': {
    japanese: 'ヒバニー',
    romaji: 'hibani-',
    pronunciation: 'hi-ba-ni-',
    meaning: 'Rabbit Pokémon'
  },
  'ラビフット': {
    japanese: 'ラビフット',
    romaji: 'rabifutsuto',
    pronunciation: 'ra-bi-fu-tsu-to',
    meaning: 'Rabbit Pokémon'
  },
  'エースバーン': {
    japanese: 'エースバーン',
    romaji: 'e-suba-n',
    pronunciation: 'e--su-ba--n',
    meaning: 'Striker Pokémon'
  },
  'メッソン': {
    japanese: 'メッソン',
    romaji: 'metsuson',
    pronunciation: 'me-tsu-so-n',
    meaning: 'Water Lizard Pokémon'
  },
  'ジメレオン': {
    japanese: 'ジメレオン',
    romaji: 'jimereon',
    pronunciation: 'ji-me-re-o-n',
    meaning: 'Water Lizard Pokémon'
  },
  'インテレオン': {
    japanese: 'インテレオン',
    romaji: 'intereon',
    pronunciation: 'i-nte-re-o-n',
    meaning: 'Secret Agent Pokémon'
  },
  'ホシガリス': {
    japanese: 'ホシガリス',
    romaji: 'hoshigarisu',
    pronunciation: 'ho-shi-ga-ri-su',
    meaning: 'Cheeky Pokémon'
  },
  'ヨクバリス': {
    japanese: 'ヨクバリス',
    romaji: 'yokubarisu',
    pronunciation: 'yo-ku-ba-ri-su',
    meaning: 'Greedy Pokémon'
  },
  'ココガラ': {
    japanese: 'ココガラ',
    romaji: 'kokogara',
    pronunciation: 'ko-ko-ga-ra',
    meaning: 'Tiny Bird Pokémon'
  },
  'アオガラス': {
    japanese: 'アオガラス',
    romaji: 'aogarasu',
    pronunciation: 'a-o-ga-ra-su',
    meaning: 'Raven Pokémon'
  },
  'アーマーガア': {
    japanese: 'アーマーガア',
    romaji: 'a-ma-gaa',
    pronunciation: 'a--ma--ga-a',
    meaning: 'Raven Pokémon'
  },
  'サッチムシ': {
    japanese: 'サッチムシ',
    romaji: 'satsuchimushi',
    pronunciation: 'sa-tsu-chi-mu-shi',
    meaning: 'Larva Pokémon'
  },
  'レドームシ': {
    japanese: 'レドームシ',
    romaji: 'redo-mushi',
    pronunciation: 're-do--mu-shi',
    meaning: 'Radome Pokémon'
  },
  'イオルブ': {
    japanese: 'イオルブ',
    romaji: 'iorubu',
    pronunciation: 'i-o-ru-bu',
    meaning: 'Seven Spot Pokémon'
  },
  'クスネ': {
    japanese: 'クスネ',
    romaji: 'kusune',
    pronunciation: 'ku-su-ne',
    meaning: 'Fox Pokémon'
  },
  'フォクスライ': {
    japanese: 'フォクスライ',
    romaji: 'fuokusurai',
    pronunciation: 'fu-o-ku-su-ra-i',
    meaning: 'Fox Pokémon'
  },
  'ヒメンカ': {
    japanese: 'ヒメンカ',
    romaji: 'himenka',
    pronunciation: 'hi-me-nka',
    meaning: 'Flowering Pokémon'
  },
  'ワタシラガ': {
    japanese: 'ワタシラガ',
    romaji: 'watashiraga',
    pronunciation: 'wa-ta-shi-ra-ga',
    meaning: 'Cotton Bloom Pokémon'
  },
  'ウールー': {
    japanese: 'ウールー',
    romaji: 'u-ru-',
    pronunciation: 'u--ru-',
    meaning: 'Sheep Pokémon'
  },
  'バイウールー': {
    japanese: 'バイウールー',
    romaji: 'baiu-ru-',
    pronunciation: 'ba-i-u--ru-',
    meaning: 'Sheep Pokémon'
  },
  'カムカメ': {
    japanese: 'カムカメ',
    romaji: 'kamukame',
    pronunciation: 'ka-mu-ka-me',
    meaning: 'Snapping Pokémon'
  },
  'カジリガメ': {
    japanese: 'カジリガメ',
    romaji: 'kajirigame',
    pronunciation: 'ka-ji-ri-ga-me',
    meaning: 'Bite Pokémon'
  },
  'ワンパチ': {
    japanese: 'ワンパチ',
    romaji: 'wanpachi',
    pronunciation: 'wa-npa-chi',
    meaning: 'Puppy Pokémon'
  },
  'パルスワン': {
    japanese: 'パルスワン',
    romaji: 'parusuwan',
    pronunciation: 'pa-ru-su-wa-n',
    meaning: 'Dog Pokémon'
  },
  'タンドン': {
    japanese: 'タンドン',
    romaji: 'tandon',
    pronunciation: 'ta-ndo-n',
    meaning: 'Coal Pokémon'
  },
  'トロッゴン': {
    japanese: 'トロッゴン',
    romaji: 'torotsugon',
    pronunciation: 'to-ro-tsu-go-n',
    meaning: 'Coal Pokémon'
  },
  'セキタンザン': {
    japanese: 'セキタンザン',
    romaji: 'sekitanzan',
    pronunciation: 'se-ki-ta-nza-n',
    meaning: 'Coal Pokémon'
  },
  'カジッチュ': {
    japanese: 'カジッチュ',
    romaji: 'kajitsuchu',
    pronunciation: 'ka-ji-tsu-chu',
    meaning: 'Apple Core Pokémon'
  },
  'アップリュー': {
    japanese: 'アップリュー',
    romaji: 'atsupuryu-',
    pronunciation: 'a-tsu-pu-ryu-',
    meaning: 'Apple Wing Pokémon'
  },
  'タルップル': {
    japanese: 'タルップル',
    romaji: 'tarutsupuru',
    pronunciation: 'ta-ru-tsu-pu-ru',
    meaning: 'Apple Nectar Pokémon'
  },
  'スナヘビ': {
    japanese: 'スナヘビ',
    romaji: 'sunahebi',
    pronunciation: 'su-na-he-bi',
    meaning: 'Sand Snake Pokémon'
  },
  'サダイジャ': {
    japanese: 'サダイジャ',
    romaji: 'sadaija',
    pronunciation: 'sa-da-i-ja',
    meaning: 'Sand Snake Pokémon'
  },
  'ウッウ': {
    japanese: 'ウッウ',
    romaji: 'utsuu',
    pronunciation: 'u-tsu-u',
    meaning: 'Gulp Pokémon'
  },
  'サシカマス': {
    japanese: 'サシカマス',
    romaji: 'sashikamasu',
    pronunciation: 'sa-shi-ka-ma-su',
    meaning: 'Rush Pokémon'
  },
  'カマスジョー': {
    japanese: 'カマスジョー',
    romaji: 'kamasujo-',
    pronunciation: 'ka-ma-su-jo-',
    meaning: 'Skewer Pokémon'
  },
  'エレズン': {
    japanese: 'エレズン',
    romaji: 'erezun',
    pronunciation: 'e-re-zu-n',
    meaning: 'Baby Pokémon'
  },
  'ストリンダー': {
    japanese: 'ストリンダー',
    romaji: 'sutorinda-',
    pronunciation: 'su-to-ri-nda-',
    meaning: 'Punk Pokémon'
  },
  'ヤクデ': {
    japanese: 'ヤクデ',
    romaji: 'yakude',
    pronunciation: 'ya-ku-de',
    meaning: 'Radiator Pokémon'
  },
  'マルヤクデ': {
    japanese: 'マルヤクデ',
    romaji: 'maruyakude',
    pronunciation: 'ma-ru-ya-ku-de',
    meaning: 'Radiator Pokémon'
  },
  'タタッコ': {
    japanese: 'タタッコ',
    romaji: 'tatatsuko',
    pronunciation: 'ta-ta-tsu-ko',
    meaning: 'Tantrum Pokémon'
  },
  'オトスパス': {
    japanese: 'オトスパス',
    romaji: 'otosupasu',
    pronunciation: 'o-to-su-pa-su',
    meaning: 'Jujitsu Pokémon'
  },
  'ヤバチャ': {
    japanese: 'ヤバチャ',
    romaji: 'yabacha',
    pronunciation: 'ya-ba-cha',
    meaning: 'Black Tea Pokémon'
  },
  'ポットデス': {
    japanese: 'ポットデス',
    romaji: 'potsutodesu',
    pronunciation: 'po-tsu-to-de-su',
    meaning: 'Black Tea Pokémon'
  },
  'ミブリム': {
    japanese: 'ミブリム',
    romaji: 'miburimu',
    pronunciation: 'mi-bu-ri-mu',
    meaning: 'Calm Pokémon'
  },
  'テブリム': {
    japanese: 'テブリム',
    romaji: 'teburimu',
    pronunciation: 'te-bu-ri-mu',
    meaning: 'Serene Pokémon'
  },
  'ブリムオン': {
    japanese: 'ブリムオン',
    romaji: 'burimuon',
    pronunciation: 'bu-ri-mu-o-n',
    meaning: 'Silent Pokémon'
  },
  'ベロバー': {
    japanese: 'ベロバー',
    romaji: 'beroba-',
    pronunciation: 'be-ro-ba-',
    meaning: 'Wily Pokémon'
  },
  'ギモー': {
    japanese: 'ギモー',
    romaji: 'gimo-',
    pronunciation: 'gi-mo-',
    meaning: 'Devious Pokémon'
  },
  'オーロンゲ': {
    japanese: 'オーロンゲ',
    romaji: 'o-ronge',
    pronunciation: 'o--ro-nge',
    meaning: 'Bulk Up Pokémon'
  },
  'タチフサグマ': {
    japanese: 'タチフサグマ',
    romaji: 'tachifusaguma',
    pronunciation: 'ta-chi-fu-sa-gu-ma',
    meaning: 'Blocking Pokémon'
  },
  'ニャイキング': {
    japanese: 'ニャイキング',
    romaji: 'nyaikingu',
    pronunciation: 'nya-i-ki-ngu',
    meaning: 'Viking Pokémon'
  },
  'サニゴーン': {
    japanese: 'サニゴーン',
    romaji: 'sanigo-n',
    pronunciation: 'sa-ni-go--n',
    meaning: 'Coral Pokémon'
  },
  'ネギガナイト': {
    japanese: 'ネギガナイト',
    romaji: 'negiganaito',
    pronunciation: 'ne-gi-ga-na-i-to',
    meaning: 'Wild Duck Pokémon'
  },
  'バリコオル': {
    japanese: 'バリコオル',
    romaji: 'barikooru',
    pronunciation: 'ba-ri-ko-o-ru',
    meaning: 'Comedian Pokémon'
  },
  'デスバーン': {
    japanese: 'デスバーン',
    romaji: 'desuba-n',
    pronunciation: 'de-su-ba--n',
    meaning: 'Grudge Pokémon'
  },
  'マホミル': {
    japanese: 'マホミル',
    romaji: 'mahomiru',
    pronunciation: 'ma-ho-mi-ru',
    meaning: 'Cream Pokémon'
  },
  'マホイップ': {
    japanese: 'マホイップ',
    romaji: 'mahoitsupu',
    pronunciation: 'ma-ho-i-tsu-pu',
    meaning: 'Cream Pokémon'
  },
  'タイレーツ': {
    japanese: 'タイレーツ',
    romaji: 'taire-tsu',
    pronunciation: 'ta-i-re--tsu',
    meaning: 'Formation Pokémon'
  },
  'バチンウニ': {
    japanese: 'バチンウニ',
    romaji: 'bachinuni',
    pronunciation: 'ba-chi-nu-ni',
    meaning: 'Sea Urchin Pokémon'
  },
  'ユキハミ': {
    japanese: 'ユキハミ',
    romaji: 'yukihami',
    pronunciation: 'yu-ki-ha-mi',
    meaning: 'Worm Pokémon'
  },
  'モスノウ': {
    japanese: 'モスノウ',
    romaji: 'mosunou',
    pronunciation: 'mo-su-no-u',
    meaning: 'Frost Moth Pokémon'
  },
  'イシヘンジン': {
    japanese: 'イシヘンジン',
    romaji: 'ishihenjin',
    pronunciation: 'i-shi-he-nji-n',
    meaning: 'Big Rock Pokémon'
  },
  'コオリッポ': {
    japanese: 'コオリッポ',
    romaji: 'kooritsupo',
    pronunciation: 'ko-o-ri-tsu-po',
    meaning: 'Penguin Pokémon'
  },
  'イエッサン': {
    japanese: 'イエッサン',
    romaji: 'ietsusan',
    pronunciation: 'i-e-tsu-sa-n',
    meaning: 'Emotion Pokémon'
  },
  'モルペコ': {
    japanese: 'モルペコ',
    romaji: 'morupeko',
    pronunciation: 'mo-ru-pe-ko',
    meaning: 'Two-Sided Pokémon'
  },
  'ゾウドウ': {
    japanese: 'ゾウドウ',
    romaji: 'zoudou',
    pronunciation: 'zo-u-do-u',
    meaning: 'Copperderm Pokémon'
  },
  'ダイオウドウ': {
    japanese: 'ダイオウドウ',
    romaji: 'daioudou',
    pronunciation: 'da-i-o-u-do-u',
    meaning: 'Copperderm Pokémon'
  },
  'パッチラゴン': {
    japanese: 'パッチラゴン',
    romaji: 'patsuchiragon',
    pronunciation: 'pa-tsu-chi-ra-go-n',
    meaning: 'Fossil Pokémon'
  },
  'パッチルドン': {
    japanese: 'パッチルドン',
    romaji: 'patsuchirudon',
    pronunciation: 'pa-tsu-chi-ru-do-n',
    meaning: 'Fossil Pokémon'
  },
  'ウオノラゴン': {
    japanese: 'ウオノラゴン',
    romaji: 'uonoragon',
    pronunciation: 'u-o-no-ra-go-n',
    meaning: 'Fossil Pokémon'
  },
  'ウオチルドン': {
    japanese: 'ウオチルドン',
    romaji: 'uochirudon',
    pronunciation: 'u-o-chi-ru-do-n',
    meaning: 'Fossil Pokémon'
  },
  'ジュラルドン': {
    japanese: 'ジュラルドン',
    romaji: 'jurarudon',
    pronunciation: 'ju-ra-ru-do-n',
    meaning: 'Alloy Pokémon'
  },
  'ドラメシヤ': {
    japanese: 'ドラメシヤ',
    romaji: 'dorameshiya',
    pronunciation: 'do-ra-me-shi-ya',
    meaning: 'Lingering Pokémon'
  },
  'ドロンチ': {
    japanese: 'ドロンチ',
    romaji: 'doronchi',
    pronunciation: 'do-ro-nchi',
    meaning: 'Caretaker Pokémon'
  },
  'ドラパルト': {
    japanese: 'ドラパルト',
    romaji: 'doraparuto',
    pronunciation: 'do-ra-pa-ru-to',
    meaning: 'Stealth Pokémon'
  },
  'ザシアン': {
    japanese: 'ザシアン',
    romaji: 'zashian',
    pronunciation: 'za-shi-a-n',
    meaning: 'Warrior Pokémon'
  },
  'ザマゼンタ': {
    japanese: 'ザマゼンタ',
    romaji: 'zamazenta',
    pronunciation: 'za-ma-ze-nta',
    meaning: 'Warrior Pokémon'
  },
  'ムゲンダイナ': {
    japanese: 'ムゲンダイナ',
    romaji: 'mugendaina',
    pronunciation: 'mu-ge-nda-i-na',
    meaning: 'Gigantic Pokémon'
  },
  'ダクマ': {
    japanese: 'ダクマ',
    romaji: 'dakuma',
    pronunciation: 'da-ku-ma',
    meaning: 'Wushu Pokémon'
  },
  'ウーラオス': {
    japanese: 'ウーラオス',
    romaji: 'u-raosu',
    pronunciation: 'u--ra-o-su',
    meaning: 'Wushu Pokémon'
  },
  'ザルード': {
    japanese: 'ザルード',
    romaji: 'zaru-do',
    pronunciation: 'za-ru--do',
    meaning: 'Rogue Monkey Pokémon'
  },
  'レジエレキ': {
    japanese: 'レジエレキ',
    romaji: 'rejiereki',
    pronunciation: 're-ji-e-re-ki',
    meaning: 'Electron Pokémon'
  },
  'レジドラゴ': {
    japanese: 'レジドラゴ',
    romaji: 'rejidorago',
    pronunciation: 're-ji-do-ra-go',
    meaning: 'Dragon Orb Pokémon'
  },
  'ブリザポス': {
    japanese: 'ブリザポス',
    romaji: 'burizaposu',
    pronunciation: 'bu-ri-za-po-su',
    meaning: 'Wild Horse Pokémon'
  },
  'レイスポス': {
    japanese: 'レイスポス',
    romaji: 'reisuposu',
    pronunciation: 're-i-su-po-su',
    meaning: 'Swift Horse Pokémon'
  },
  'バドレックス': {
    japanese: 'バドレックス',
    romaji: 'badoretsukusu',
    pronunciation: 'ba-do-re-tsu-ku-su',
    meaning: 'King Pokémon'
  },
  'アヤシシ': {
    japanese: 'アヤシシ',
    romaji: 'ayashishi',
    pronunciation: 'a-ya-shi-shi',
    meaning: 'Big Horn Pokémon'
  },
  'バサギリ': {
    japanese: 'バサギリ',
    romaji: 'basagiri',
    pronunciation: 'ba-sa-gi-ri',
    meaning: 'Axe Pokémon'
  },
  'ガチグマ': {
    japanese: 'ガチグマ',
    romaji: 'gachiguma',
    pronunciation: 'ga-chi-gu-ma',
    meaning: 'Peat Pokémon'
  },
  'イダイトウ': {
    japanese: 'イダイトウ',
    romaji: 'idaitou',
    pronunciation: 'i-da-i-to-u',
    meaning: 'Big Fish Pokémon'
  },
  'オオニューラ': {
    japanese: 'オオニューラ',
    romaji: 'oonyu-ra',
    pronunciation: 'o-o-nyu--ra',
    meaning: 'Free Climb Pokémon'
  },
  'ハリーマン': {
    japanese: 'ハリーマン',
    romaji: 'hari-man',
    pronunciation: 'ha-ri--ma-n',
    meaning: 'Pin Cluster Pokémon'
  },
  'ラブトロス': {
    japanese: 'ラブトロス',
    romaji: 'rabutorosu',
    pronunciation: 'ra-bu-to-ro-su',
    meaning: 'Love-Hate Pokémon'
  },
  'ニャオハ': {
    japanese: 'ニャオハ',
    romaji: 'nyaoha',
    pronunciation: 'nya-o-ha',
    meaning: 'Grass Cat Pokémon'
  },
  'ニャローテ': {
    japanese: 'ニャローテ',
    romaji: 'nyaro-te',
    pronunciation: 'nya-ro--te',
    meaning: 'Grass Cat Pokémon'
  },
  'マスカーニャ': {
    japanese: 'マスカーニャ',
    romaji: 'masuka-nya',
    pronunciation: 'ma-su-ka--nya',
    meaning: 'Magician Pokémon'
  },
  'ホゲータ': {
    japanese: 'ホゲータ',
    romaji: 'hoge-ta',
    pronunciation: 'ho-ge--ta',
    meaning: 'Fire Croc Pokémon'
  },
  'アチゲータ': {
    japanese: 'アチゲータ',
    romaji: 'achige-ta',
    pronunciation: 'a-chi-ge--ta',
    meaning: 'Fire Croc Pokémon'
  },
  'ラウドボーン': {
    japanese: 'ラウドボーン',
    romaji: 'raudobo-n',
    pronunciation: 'ra-u-do-bo--n',
    meaning: 'Singer Pokémon'
  },
  'クワッス': {
    japanese: 'クワッス',
    romaji: 'kuwatsusu',
    pronunciation: 'ku-wa-tsu-su',
    meaning: 'Duckling Pokémon'
  },
  'ウェルカモ': {
    japanese: 'ウェルカモ',
    romaji: 'uerukamo',
    pronunciation: 'u-e-ru-ka-mo',
    meaning: 'Practicing Pokémon'
  },
  'ウェーニバル': {
    japanese: 'ウェーニバル',
    romaji: 'ue-nibaru',
    pronunciation: 'u-e--ni-ba-ru',
    meaning: 'Dancer Pokémon'
  },
  'グルトン': {
    japanese: 'グルトン',
    romaji: 'guruton',
    pronunciation: 'gu-ru-to-n',
    meaning: 'Hog Pokémon'
  },
  'パフュートン': {
    japanese: 'パフュートン',
    romaji: 'pafuュ-ton',
    pronunciation: 'pa-fu-ュ-to-n',
    meaning: 'Hog Pokémon'
  },
  'タマンチュラ': {
    japanese: 'タマンチュラ',
    romaji: 'tamanchura',
    pronunciation: 'ta-ma-nchu-ra',
    meaning: 'String Ball Pokémon'
  },
  'ワナイダー': {
    japanese: 'ワナイダー',
    romaji: 'wanaida-',
    pronunciation: 'wa-na-i-da-',
    meaning: 'Trap Pokémon'
  },
  'マメバッタ': {
    japanese: 'マメバッタ',
    romaji: 'mamebatsuta',
    pronunciation: 'ma-me-ba-tsu-ta',
    meaning: 'Grasshopper Pokémon'
  },
  'エクスレッグ': {
    japanese: 'エクスレッグ',
    romaji: 'ekusuretsugu',
    pronunciation: 'e-ku-su-re-tsu-gu',
    meaning: 'Grasshopper Pokémon'
  },
  'パモ': {
    japanese: 'パモ',
    romaji: 'pamo',
    pronunciation: 'pa-mo',
    meaning: 'Mouse Pokémon'
  },
  'パモット': {
    japanese: 'パモット',
    romaji: 'pamotsuto',
    pronunciation: 'pa-mo-tsu-to',
    meaning: 'Mouse Pokémon'
  },
  'パーモット': {
    japanese: 'パーモット',
    romaji: 'pa-motsuto',
    pronunciation: 'pa--mo-tsu-to',
    meaning: 'Hands-On Pokémon'
  },
  'ワッカネズミ': {
    japanese: 'ワッカネズミ',
    romaji: 'watsukanezumi',
    pronunciation: 'wa-tsu-ka-ne-zu-mi',
    meaning: 'Couple Pokémon'
  },
  'イッカネズミ': {
    japanese: 'イッカネズミ',
    romaji: 'itsukanezumi',
    pronunciation: 'i-tsu-ka-ne-zu-mi',
    meaning: 'Family Pokémon'
  },
  'パピモッチ': {
    japanese: 'パピモッチ',
    romaji: 'papimotsuchi',
    pronunciation: 'pa-pi-mo-tsu-chi',
    meaning: 'Puppy Pokémon'
  },
  'バウッツェル': {
    japanese: 'バウッツェル',
    romaji: 'bautsutsueru',
    pronunciation: 'ba-u-tsu-tsu-e-ru',
    meaning: 'Dog Pokémon'
  },
  'ミニーブ': {
    japanese: 'ミニーブ',
    romaji: 'mini-bu',
    pronunciation: 'mi-ni--bu',
    meaning: 'Olive Pokémon'
  },
  'オリーニョ': {
    japanese: 'オリーニョ',
    romaji: 'ori-nyo',
    pronunciation: 'o-ri--nyo',
    meaning: 'Olive Pokémon'
  },
  'オリーヴァ': {
    japanese: 'オリーヴァ',
    romaji: 'ori-ヴa',
    pronunciation: 'o-ri--ヴa',
    meaning: 'Olive Pokémon'
  },
  'イキリンコ': {
    japanese: 'イキリンコ',
    romaji: 'ikirinko',
    pronunciation: 'i-ki-ri-nko',
    meaning: 'Parrot Pokémon'
  },
  'コジオ': {
    japanese: 'コジオ',
    romaji: 'kojio',
    pronunciation: 'ko-ji-o',
    meaning: 'Rock Salt Pokémon'
  },
  'ジオヅム': {
    japanese: 'ジオヅム',
    romaji: 'jiozumu',
    pronunciation: 'ji-o-zu-mu',
    meaning: 'Rock Salt Pokémon'
  },
  'キョジオーン': {
    japanese: 'キョジオーン',
    romaji: 'kyojio-n',
    pronunciation: 'kyo-ji-o--n',
    meaning: 'Rock Salt Pokémon'
  },
  'カルボウ': {
    japanese: 'カルボウ',
    romaji: 'karubou',
    pronunciation: 'ka-ru-bo-u',
    meaning: 'Fire Child Pokémon'
  },
  'グレンアルマ': {
    japanese: 'グレンアルマ',
    romaji: 'gurenaruma',
    pronunciation: 'gu-re-na-ru-ma',
    meaning: 'Fire Warrior Pokémon'
  },
  'ソウブレイズ': {
    japanese: 'ソウブレイズ',
    romaji: 'soubureizu',
    pronunciation: 'so-u-bu-re-i-zu',
    meaning: 'Fire Blades Pokémon'
  },
  'ズピカ': {
    japanese: 'ズピカ',
    romaji: 'zupika',
    pronunciation: 'zu-pi-ka',
    meaning: 'EleTadpole Pokémon'
  },
  'ハラバリー': {
    japanese: 'ハラバリー',
    romaji: 'harabari-',
    pronunciation: 'ha-ra-ba-ri-',
    meaning: 'EleFrog Pokémon'
  },
  'カイデン': {
    japanese: 'カイデン',
    romaji: 'kaiden',
    pronunciation: 'ka-i-de-n',
    meaning: 'Storm Petrel Pokémon'
  },
  'タイカイデン': {
    japanese: 'タイカイデン',
    romaji: 'taikaiden',
    pronunciation: 'ta-i-ka-i-de-n',
    meaning: 'Frigatebird Pokémon'
  },
  'オラチフ': {
    japanese: 'オラチフ',
    romaji: 'orachifu',
    pronunciation: 'o-ra-chi-fu',
    meaning: 'Rascal Pokémon'
  },
  'マフィティフ': {
    japanese: 'マフィティフ',
    romaji: 'mafuiteifu',
    pronunciation: 'ma-fu-i-te-i-fu',
    meaning: 'Boss Pokémon'
  },
  'シルシュルー': {
    japanese: 'シルシュルー',
    romaji: 'shirushuru-',
    pronunciation: 'shi-ru-shu-ru-',
    meaning: 'Toxic Mouse Pokémon'
  },
  'タギングル': {
    japanese: 'タギングル',
    romaji: 'taginguru',
    pronunciation: 'ta-gi-ngu-ru',
    meaning: 'Toxic Monkey Pokémon'
  },
  'アノクサ': {
    japanese: 'アノクサ',
    romaji: 'anokusa',
    pronunciation: 'a-no-ku-sa',
    meaning: 'Tumbleweed Pokémon'
  },
  'アノホラグサ': {
    japanese: 'アノホラグサ',
    romaji: 'anohoragusa',
    pronunciation: 'a-no-ho-ra-gu-sa',
    meaning: 'Tumbleweed Pokémon'
  },
  'ノノクラゲ': {
    japanese: 'ノノクラゲ',
    romaji: 'nonokurage',
    pronunciation: 'no-no-ku-ra-ge',
    meaning: 'Woodear Pokémon'
  },
  'リククラゲ': {
    japanese: 'リククラゲ',
    romaji: 'rikukurage',
    pronunciation: 'ri-ku-ku-ra-ge',
    meaning: 'Woodear Pokémon'
  },
  'ガケガニ': {
    japanese: 'ガケガニ',
    romaji: 'gakegani',
    pronunciation: 'ga-ke-ga-ni',
    meaning: 'Ambush Pokémon'
  },
  'カプサイジ': {
    japanese: 'カプサイジ',
    romaji: 'kapusaiji',
    pronunciation: 'ka-pu-sa-i-ji',
    meaning: 'Spicy Pepper Pokémon'
  },
  'スコヴィラン': {
    japanese: 'スコヴィラン',
    romaji: 'sukoヴiran',
    pronunciation: 'su-ko-ヴi-ra-n',
    meaning: 'Spicy Pepper Pokémon'
  },
  'シガロコ': {
    japanese: 'シガロコ',
    romaji: 'shigaroko',
    pronunciation: 'shi-ga-ro-ko',
    meaning: 'Rolling Pokémon'
  },
  'ベラカス': {
    japanese: 'ベラカス',
    romaji: 'berakasu',
    pronunciation: 'be-ra-ka-su',
    meaning: 'Rolling Pokémon'
  },
  'ヒラヒナ': {
    japanese: 'ヒラヒナ',
    romaji: 'hirahina',
    pronunciation: 'hi-ra-hi-na',
    meaning: 'Frill Pokémon'
  },
  'クエスパトラ': {
    japanese: 'クエスパトラ',
    romaji: 'kuesupatora',
    pronunciation: 'ku-e-su-pa-to-ra',
    meaning: 'Ostrich Pokémon'
  },
  'カヌチャン': {
    japanese: 'カヌチャン',
    romaji: 'kanuchan',
    pronunciation: 'ka-nu-cha-n',
    meaning: 'Metalsmith Pokémon'
  },
  'ナカヌチャン': {
    japanese: 'ナカヌチャン',
    romaji: 'nakanuchan',
    pronunciation: 'na-ka-nu-cha-n',
    meaning: 'Hammer Pokémon'
  },
  'デカヌチャン': {
    japanese: 'デカヌチャン',
    romaji: 'dekanuchan',
    pronunciation: 'de-ka-nu-cha-n',
    meaning: 'Hammer Pokémon'
  },
  'ウミディグダ': {
    japanese: 'ウミディグダ',
    romaji: 'umideiguda',
    pronunciation: 'u-mi-de-i-gu-da',
    meaning: 'Garden Eel Pokémon'
  },
  'ウミトリオ': {
    japanese: 'ウミトリオ',
    romaji: 'umitorio',
    pronunciation: 'u-mi-to-ri-o',
    meaning: 'Garden Eel Pokémon'
  },
  'オトシドリ': {
    japanese: 'オトシドリ',
    romaji: 'otoshidori',
    pronunciation: 'o-to-shi-do-ri',
    meaning: 'Item Drop Pokémon'
  },
  'ナミイルカ': {
    japanese: 'ナミイルカ',
    romaji: 'namiiruka',
    pronunciation: 'na-mi-i-ru-ka',
    meaning: 'Dolphin Pokémon'
  },
  'イルカマン': {
    japanese: 'イルカマン',
    romaji: 'irukaman',
    pronunciation: 'i-ru-ka-ma-n',
    meaning: 'Dolphin Pokémon'
  },
  'ブロロン': {
    japanese: 'ブロロン',
    romaji: 'buroron',
    pronunciation: 'bu-ro-ro-n',
    meaning: 'Single-Cyl Pokémon'
  },
  'ブロロローム': {
    japanese: 'ブロロローム',
    romaji: 'burororo-mu',
    pronunciation: 'bu-ro-ro-ro--mu',
    meaning: 'Multi-Cyl Pokémon'
  },
  'モトトカゲ': {
    japanese: 'モトトカゲ',
    romaji: 'mototokage',
    pronunciation: 'mo-to-to-ka-ge',
    meaning: 'Mount Pokémon'
  },
  'ミミズズ': {
    japanese: 'ミミズズ',
    romaji: 'mimizuzu',
    pronunciation: 'mi-mi-zu-zu',
    meaning: 'Earthworm Pokémon'
  },
  'キラーメ': {
    japanese: 'キラーメ',
    romaji: 'kira-me',
    pronunciation: 'ki-ra--me',
    meaning: 'Ore Pokémon'
  },
  'キラフロル': {
    japanese: 'キラフロル',
    romaji: 'kirafuroru',
    pronunciation: 'ki-ra-fu-ro-ru',
    meaning: 'Ore Pokémon'
  },
  'ボチ': {
    japanese: 'ボチ',
    romaji: 'bochi',
    pronunciation: 'bo-chi',
    meaning: 'Ghost Dog Pokémon'
  },
  'ハカドッグ': {
    japanese: 'ハカドッグ',
    romaji: 'hakadotsugu',
    pronunciation: 'ha-ka-do-tsu-gu',
    meaning: 'Ghost Dog Pokémon'
  },
  'カラミンゴ': {
    japanese: 'カラミンゴ',
    romaji: 'karamingo',
    pronunciation: 'ka-ra-mi-ngo',
    meaning: 'Synchronize Pokémon'
  },
  'アルクジラ': {
    japanese: 'アルクジラ',
    romaji: 'arukujira',
    pronunciation: 'a-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon'
  },
  'ハルクジラ': {
    japanese: 'ハルクジラ',
    romaji: 'harukujira',
    pronunciation: 'ha-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon'
  },
  'ミガルーサ': {
    japanese: 'ミガルーサ',
    romaji: 'migaru-sa',
    pronunciation: 'mi-ga-ru--sa',
    meaning: 'Jettison Pokémon'
  },
  'ヘイラッシャ': {
    japanese: 'ヘイラッシャ',
    romaji: 'heiratsusha',
    pronunciation: 'he-i-ra-tsu-sha',
    meaning: 'Big Catfish Pokémon'
  },
  'シャリタツ': {
    japanese: 'シャリタツ',
    romaji: 'sharitatsu',
    pronunciation: 'sha-ri-ta-tsu',
    meaning: 'Mimicry Pokémon'
  },
  'コノヨザル': {
    japanese: 'コノヨザル',
    romaji: 'konoyozaru',
    pronunciation: 'ko-no-yo-za-ru',
    meaning: 'Rage Monkey Pokémon'
  },
  'ドオー': {
    japanese: 'ドオー',
    romaji: 'doo-',
    pronunciation: 'do-o-',
    meaning: 'Spiny Fish Pokémon'
  },
  'リキキリン': {
    japanese: 'リキキリン',
    romaji: 'rikikirin',
    pronunciation: 'ri-ki-ki-ri-n',
    meaning: 'Long Neck Pokémon'
  },
  'ノココッチ': {
    japanese: 'ノココッチ',
    romaji: 'nokokotsuchi',
    pronunciation: 'no-ko-ko-tsu-chi',
    meaning: 'Land Snake Pokémon'
  },
  'ドドゲザン': {
    japanese: 'ドドゲザン',
    romaji: 'dodogezan',
    pronunciation: 'do-do-ge-za-n',
    meaning: 'Big Blade Pokémon'
  },
  'イダイナキバ': {
    japanese: 'イダイナキバ',
    romaji: 'idainakiba',
    pronunciation: 'i-da-i-na-ki-ba',
    meaning: 'Paradox Pokémon'
  },
  'サケブシッポ': {
    japanese: 'サケブシッポ',
    romaji: 'sakebushitsupo',
    pronunciation: 'sa-ke-bu-shi-tsu-po',
    meaning: 'Paradox Pokémon'
  },
  'アラブルタケ': {
    japanese: 'アラブルタケ',
    romaji: 'araburutake',
    pronunciation: 'a-ra-bu-ru-ta-ke',
    meaning: 'Paradox Pokémon'
  },
  'ハバタクカミ': {
    japanese: 'ハバタクカミ',
    romaji: 'habatakukami',
    pronunciation: 'ha-ba-ta-ku-ka-mi',
    meaning: 'Paradox Pokémon'
  },
  'チヲハウハネ': {
    japanese: 'チヲハウハネ',
    romaji: 'chiwohauhane',
    pronunciation: 'chi-wo-ha-u-ha-ne',
    meaning: 'Paradox Pokémon'
  },
  'スナノケガワ': {
    japanese: 'スナノケガワ',
    romaji: 'sunanokegawa',
    pronunciation: 'su-na-no-ke-ga-wa',
    meaning: 'Paradox Pokémon'
  },
  'テツノワダチ': {
    japanese: 'テツノワダチ',
    romaji: 'tetsunowadachi',
    pronunciation: 'te-tsu-no-wa-da-chi',
    meaning: 'Paradox Pokémon'
  },
  'テツノツツミ': {
    japanese: 'テツノツツミ',
    romaji: 'tetsunotsutsumi',
    pronunciation: 'te-tsu-no-tsu-tsu-mi',
    meaning: 'Paradox Pokémon'
  },
  'テツノカイナ': {
    japanese: 'テツノカイナ',
    romaji: 'tetsunokaina',
    pronunciation: 'te-tsu-no-ka-i-na',
    meaning: 'Paradox Pokémon'
  },
  'テツノコウベ': {
    japanese: 'テツノコウベ',
    romaji: 'tetsunokoube',
    pronunciation: 'te-tsu-no-ko-u-be',
    meaning: 'Paradox Pokémon'
  },
  'テツノドクガ': {
    japanese: 'テツノドクガ',
    romaji: 'tetsunodokuga',
    pronunciation: 'te-tsu-no-do-ku-ga',
    meaning: 'Paradox Pokémon'
  },
  'テツノイバラ': {
    japanese: 'テツノイバラ',
    romaji: 'tetsunoibara',
    pronunciation: 'te-tsu-no-i-ba-ra',
    meaning: 'Paradox Pokémon'
  },
  'セビエ': {
    japanese: 'セビエ',
    romaji: 'sebie',
    pronunciation: 'se-bi-e',
    meaning: 'Ice Fin Pokémon'
  },
  'セゴール': {
    japanese: 'セゴール',
    romaji: 'sego-ru',
    pronunciation: 'se-go--ru',
    meaning: 'Ice Fin Pokémon'
  },
  'セグレイブ': {
    japanese: 'セグレイブ',
    romaji: 'segureibu',
    pronunciation: 'se-gu-re-i-bu',
    meaning: 'Ice Dragon Pokémon'
  },
  'コレクレー': {
    japanese: 'コレクレー',
    romaji: 'korekure-',
    pronunciation: 'ko-re-ku-re-',
    meaning: 'Coin Chest Pokémon'
  },
  'サーフゴー': {
    japanese: 'サーフゴー',
    romaji: 'sa-fugo-',
    pronunciation: 'sa--fu-go-',
    meaning: 'Coin Entity Pokémon'
  },
  'チオンジェン': {
    japanese: 'チオンジェン',
    romaji: 'chionjien',
    pronunciation: 'chi-o-nji-e-n',
    meaning: 'Ruinous Pokémon'
  },
  'パオジアン': {
    japanese: 'パオジアン',
    romaji: 'paojian',
    pronunciation: 'pa-o-ji-a-n',
    meaning: 'Ruinous Pokémon'
  },
  'ディンルー': {
    japanese: 'ディンルー',
    romaji: 'deinru-',
    pronunciation: 'de-i-nru-',
    meaning: 'Ruinous Pokémon'
  },
  'イーユイ': {
    japanese: 'イーユイ',
    romaji: 'i-yui',
    pronunciation: 'i--yu-i',
    meaning: 'Ruinous Pokémon'
  },
  'トドロクツキ': {
    japanese: 'トドロクツキ',
    romaji: 'todorokutsuki',
    pronunciation: 'to-do-ro-ku-tsu-ki',
    meaning: 'Paradox Pokémon'
  },
  'テツノブジン': {
    japanese: 'テツノブジン',
    romaji: 'tetsunobujin',
    pronunciation: 'te-tsu-no-bu-ji-n',
    meaning: 'Paradox Pokémon'
  },
  'コライドン': {
    japanese: 'コライドン',
    romaji: 'koraidon',
    pronunciation: 'ko-ra-i-do-n',
    meaning: 'Paradox Pokémon'
  },
  'ミライドン': {
    japanese: 'ミライドン',
    romaji: 'miraidon',
    pronunciation: 'mi-ra-i-do-n',
    meaning: 'Paradox Pokémon'
  },
  'ウネルミナモ': {
    japanese: 'ウネルミナモ',
    romaji: 'uneruminamo',
    pronunciation: 'u-ne-ru-mi-na-mo',
    meaning: 'Paradox Pokémon'
  },
  'テツノイサハ': {
    japanese: 'テツノイサハ',
    romaji: 'tetsunoisaha',
    pronunciation: 'te-tsu-no-i-sa-ha',
    meaning: 'Paradox Pokémon'
  }
,
  'フシギダネ': {
    japanese: 'フシギダネ',
    romaji: 'fushigidane',
    pronunciation: 'fu-shi-gi-da-ne',
    meaning: 'Strange Seed'
  },
  'フシギソウ': {
    japanese: 'フシギソウ',
    romaji: 'fushigisou',
    pronunciation: 'fu-shi-gi-so-u',
    meaning: 'Strange Grass'
  },
  'フシギバナ': {
    japanese: 'フシギバナ',
    romaji: 'fushigibana',
    pronunciation: 'fu-shi-gi-ba-na',
    meaning: 'Strange Flower'
  },
  'ヒトカゲ': {
    japanese: 'ヒトカゲ',
    romaji: 'hitokage',
    pronunciation: 'hi-to-ka-ge',
    meaning: 'Fire Lizard'
  },
  'リザード': {
    japanese: 'リザード',
    romaji: 'riza-do',
    pronunciation: 'ri-za--do',
    meaning: 'Lizard'
  },
  'リザードン': {
    japanese: 'リザードン',
    romaji: 'riza-don',
    pronunciation: 'ri-za--do-n',
    meaning: 'Lizard'
  },
  'ゼニガメ': {
    japanese: 'ゼニガメ',
    romaji: 'zenigame',
    pronunciation: 'ze-ni-ga-me',
    meaning: 'Tiny Turtle'
  },
  'カメール': {
    japanese: 'カメール',
    romaji: 'kame-ru',
    pronunciation: 'ka-me--ru',
    meaning: 'Turtle'
  },
  'カメックス': {
    japanese: 'カメックス',
    romaji: 'kametsukusu',
    pronunciation: 'ka-me-tsu-ku-su',
    meaning: 'Shellfish'
  },
  'キャタピー': {
    japanese: 'キャタピー',
    romaji: 'kyatapi-',
    pronunciation: 'kya-ta-pi-',
    meaning: 'Caterpillar'
  },
  'トランセル': {
    japanese: 'トランセル',
    romaji: 'toranseru',
    pronunciation: 'to-ra-nse-ru',
    meaning: 'Transparent Shell'
  },
  'バタフリー': {
    japanese: 'バタフリー',
    romaji: 'batafuri-',
    pronunciation: 'ba-ta-fu-ri-',
    meaning: 'Butterfly'
  },
  'ビードル': {
    japanese: 'ビードル',
    romaji: 'bi-doru',
    pronunciation: 'bi--do-ru',
    meaning: 'Beedle'
  },
  'コクーン': {
    japanese: 'コクーン',
    romaji: 'koku-n',
    pronunciation: 'ko-ku--n',
    meaning: 'Cocoon'
  },
  'スピアー': {
    japanese: 'スピアー',
    romaji: 'supia-',
    pronunciation: 'su-pi-a-',
    meaning: 'Spear'
  },
  'ポッポ': {
    japanese: 'ポッポ',
    romaji: 'potsupo',
    pronunciation: 'po-tsu-po',
    meaning: 'Pigeon'
  },
  'ピジョン': {
    japanese: 'ピジョン',
    romaji: 'pijon',
    pronunciation: 'pi-jo-n',
    meaning: 'Pigeon'
  },
  'ピジョット': {
    japanese: 'ピジョット',
    romaji: 'pijotsuto',
    pronunciation: 'pi-jo-tsu-to',
    meaning: 'Pigeon'
  },
  'コラッタ': {
    japanese: 'コラッタ',
    romaji: 'koratsuta',
    pronunciation: 'ko-ra-tsu-ta',
    meaning: 'Small Rat'
  },
  'ラッタ': {
    japanese: 'ラッタ',
    romaji: 'ratsuta',
    pronunciation: 'ra-tsu-ta',
    meaning: 'Rat'
  },
  'オニスズメ': {
    japanese: 'オニスズメ',
    romaji: 'onisuzume',
    pronunciation: 'o-ni-su-zu-me',
    meaning: 'Demon Sparrow'
  },
  'オニドリル': {
    japanese: 'オニドリル',
    romaji: 'onidoriru',
    pronunciation: 'o-ni-do-ri-ru',
    meaning: 'Demon Drill'
  },
  'アーボ': {
    japanese: 'アーボ',
    romaji: 'a-bo',
    pronunciation: 'a--bo',
    meaning: 'Snake'
  },
  'アーボック': {
    japanese: 'アーボック',
    romaji: 'a-botsuku',
    pronunciation: 'a--bo-tsu-ku',
    meaning: 'Cobra'
  },
  'ピカチュウ': {
    japanese: 'ピカチュウ',
    romaji: 'pikachuu',
    pronunciation: 'pi-ka-chu-u',
    meaning: 'Spark Mouse'
  },
  'ライチュウ': {
    japanese: 'ライチュウ',
    romaji: 'raichuu',
    pronunciation: 'ra-i-chu-u',
    meaning: 'Thunder Mouse'
  },
  'サンド': {
    japanese: 'サンド',
    romaji: 'sando',
    pronunciation: 'sa-ndo',
    meaning: 'Sand'
  },
  'サンドパン': {
    japanese: 'サンドパン',
    romaji: 'sandopan',
    pronunciation: 'sa-ndo-pa-n',
    meaning: 'Sand Pan'
  },
  'ニドラン♀': {
    japanese: 'ニドラン♀',
    romaji: 'nidoran♀',
    pronunciation: 'ni-do-ra-n♀',
    meaning: 'Nidoran Female'
  },
  'ニドリーナ': {
    japanese: 'ニドリーナ',
    romaji: 'nidori-na',
    pronunciation: 'ni-do-ri--na',
    meaning: 'Nidorina'
  },
  'ニドクイン': {
    japanese: 'ニドクイン',
    romaji: 'nidokuin',
    pronunciation: 'ni-do-ku-i-n',
    meaning: 'Nidoqueen'
  },
  'ニドラン♂': {
    japanese: 'ニドラン♂',
    romaji: 'nidoran♂',
    pronunciation: 'ni-do-ra-n♂',
    meaning: 'Nidoran Male'
  },
  'ニドリーノ': {
    japanese: 'ニドリーノ',
    romaji: 'nidori-no',
    pronunciation: 'ni-do-ri--no',
    meaning: 'Nidorino'
  },
  'ニドキング': {
    japanese: 'ニドキング',
    romaji: 'nidokingu',
    pronunciation: 'ni-do-ki-ngu',
    meaning: 'Nidoking'
  },
  'ピッピ': {
    japanese: 'ピッピ',
    romaji: 'pitsupi',
    pronunciation: 'pi-tsu-pi',
    meaning: 'Fairy'
  },
  'ピクシー': {
    japanese: 'ピクシー',
    romaji: 'pikushi-',
    pronunciation: 'pi-ku-shi-',
    meaning: 'Pixie'
  },
  'ロコン': {
    japanese: 'ロコン',
    romaji: 'rokon',
    pronunciation: 'ro-ko-n',
    meaning: 'Six Tails'
  },
  'キュウコン': {
    japanese: 'キュウコン',
    romaji: 'kyuukon',
    pronunciation: 'kyu-u-ko-n',
    meaning: 'Nine Tails'
  },
  'プリン': {
    japanese: 'プリン',
    romaji: 'purin',
    pronunciation: 'pu-ri-n',
    meaning: 'Balloon'
  },
  'プクリン': {
    japanese: 'プクリン',
    romaji: 'pukurin',
    pronunciation: 'pu-ku-ri-n',
    meaning: 'Balloon'
  },
  'ズバット': {
    japanese: 'ズバット',
    romaji: 'zubatsuto',
    pronunciation: 'zu-ba-tsu-to',
    meaning: 'Bat'
  },
  'ゴルバット': {
    japanese: 'ゴルバット',
    romaji: 'gorubatsuto',
    pronunciation: 'go-ru-ba-tsu-to',
    meaning: 'Golbat'
  },
  'ナゾノクサ': {
    japanese: 'ナゾノクサ',
    romaji: 'nazonokusa',
    pronunciation: 'na-zo-no-ku-sa',
    meaning: 'Mysterious Grass'
  },
  'クサイハナ': {
    japanese: 'クサイハナ',
    romaji: 'kusaihana',
    pronunciation: 'ku-sa-i-ha-na',
    meaning: 'Smelly Flower'
  },
  'ラフレシア': {
    japanese: 'ラフレシア',
    romaji: 'rafureshia',
    pronunciation: 'ra-fu-re-shi-a',
    meaning: 'Rafflesia'
  },
  'パラス': {
    japanese: 'パラス',
    romaji: 'parasu',
    pronunciation: 'pa-ra-su',
    meaning: 'Paras'
  },
  'パラセクト': {
    japanese: 'パラセクト',
    romaji: 'parasekuto',
    pronunciation: 'pa-ra-se-ku-to',
    meaning: 'Parasect'
  },
  'コンパン': {
    japanese: 'コンパン',
    romaji: 'konpan',
    pronunciation: 'ko-npa-n',
    meaning: 'Venonat'
  },
  'モルフォン': {
    japanese: 'モルフォン',
    romaji: 'morufuon',
    pronunciation: 'mo-ru-fu-o-n',
    meaning: 'Morphon'
  },
  'ディグダ': {
    japanese: 'ディグダ',
    romaji: 'deiguda',
    pronunciation: 'de-i-gu-da',
    meaning: 'Digda'
  },
  'ダグトリオ': {
    japanese: 'ダグトリオ',
    romaji: 'dagutorio',
    pronunciation: 'da-gu-to-ri-o',
    meaning: 'Dugtrio'
  },
  'ニャース': {
    japanese: 'ニャース',
    romaji: 'nya-su',
    pronunciation: 'nya--su',
    meaning: 'Cat'
  },
  'ペルシアン': {
    japanese: 'ペルシアン',
    romaji: 'perushian',
    pronunciation: 'pe-ru-shi-a-n',
    meaning: 'Persian'
  },
  'コダック': {
    japanese: 'コダック',
    romaji: 'kodatsuku',
    pronunciation: 'ko-da-tsu-ku',
    meaning: 'Duck'
  },
  'ゴルダック': {
    japanese: 'ゴルダック',
    romaji: 'gorudatsuku',
    pronunciation: 'go-ru-da-tsu-ku',
    meaning: 'Golduck'
  },
  'マンキー': {
    japanese: 'マンキー',
    romaji: 'manki-',
    pronunciation: 'ma-nki-',
    meaning: 'Monkey'
  },
  'オコリザル': {
    japanese: 'オコリザル',
    romaji: 'okorizaru',
    pronunciation: 'o-ko-ri-za-ru',
    meaning: 'Angry Monkey'
  },
  'ガーディ': {
    japanese: 'ガーディ',
    romaji: 'ga-dei',
    pronunciation: 'ga--de-i',
    meaning: 'Guardie'
  },
  'ウインディ': {
    japanese: 'ウインディ',
    romaji: 'uindei',
    pronunciation: 'u-i-nde-i',
    meaning: 'Windie'
  },
  'ニョロモ': {
    japanese: 'ニョロモ',
    romaji: 'nyoromo',
    pronunciation: 'nyo-ro-mo',
    meaning: 'Nyoromo'
  },
  'ニョロゾ': {
    japanese: 'ニョロゾ',
    romaji: 'nyorozo',
    pronunciation: 'nyo-ro-zo',
    meaning: 'Nyorozo'
  },
  'ニョロボン': {
    japanese: 'ニョロボン',
    romaji: 'nyorobon',
    pronunciation: 'nyo-ro-bo-n',
    meaning: 'Nyorobon'
  },
  'ケーシィ': {
    japanese: 'ケーシィ',
    romaji: 'ke-shii',
    pronunciation: 'ke--shi-i',
    meaning: 'Casey'
  },
  'ユンゲラー': {
    japanese: 'ユンゲラー',
    romaji: 'yungera-',
    pronunciation: 'yu-nge-ra-',
    meaning: 'Yungeler'
  },
  'フーディン': {
    japanese: 'フーディン',
    romaji: 'fu-dein',
    pronunciation: 'fu--de-i-n',
    meaning: 'Foodin'
  },
  'ワンリキー': {
    japanese: 'ワンリキー',
    romaji: 'wanriki-',
    pronunciation: 'wa-nri-ki-',
    meaning: 'One Power'
  },
  'ゴーリキー': {
    japanese: 'ゴーリキー',
    romaji: 'go-riki-',
    pronunciation: 'go--ri-ki-',
    meaning: 'Go Power'
  },
  'カイリキー': {
    japanese: 'カイリキー',
    romaji: 'kairiki-',
    pronunciation: 'ka-i-ri-ki-',
    meaning: 'Strong Power'
  },
  'マダツボミ': {
    japanese: 'マダツボミ',
    romaji: 'madatsubomi',
    pronunciation: 'ma-da-tsu-bo-mi',
    meaning: 'Madatsubomi'
  },
  'ウツドン': {
    japanese: 'ウツドン',
    romaji: 'utsudon',
    pronunciation: 'u-tsu-do-n',
    meaning: 'Utsudon'
  },
  'ウツボット': {
    japanese: 'ウツボット',
    romaji: 'utsubotsuto',
    pronunciation: 'u-tsu-bo-tsu-to',
    meaning: 'Utsubot'
  },
  'メノクラゲ': {
    japanese: 'メノクラゲ',
    romaji: 'menokurage',
    pronunciation: 'me-no-ku-ra-ge',
    meaning: 'Menokurage'
  },
  'ドククラゲ': {
    japanese: 'ドククラゲ',
    romaji: 'dokukurage',
    pronunciation: 'do-ku-ku-ra-ge',
    meaning: 'Poison Jellyfish'
  },
  'イシツブテ': {
    japanese: 'イシツブテ',
    romaji: 'ishitsubute',
    pronunciation: 'i-shi-tsu-bu-te',
    meaning: 'Stone Fragment'
  },
  'ゴローン': {
    japanese: 'ゴローン',
    romaji: 'goro-n',
    pronunciation: 'go-ro--n',
    meaning: 'Goron'
  },
  'ゴローニャ': {
    japanese: 'ゴローニャ',
    romaji: 'goro-nya',
    pronunciation: 'go-ro--nya',
    meaning: 'Golonya'
  },
  'ポニータ': {
    japanese: 'ポニータ',
    romaji: 'poni-ta',
    pronunciation: 'po-ni--ta',
    meaning: 'Ponyta'
  },
  'ギャロップ': {
    japanese: 'ギャロップ',
    romaji: 'gyarotsupu',
    pronunciation: 'gya-ro-tsu-pu',
    meaning: 'Gallop'
  },
  'ヤドン': {
    japanese: 'ヤドン',
    romaji: 'yadon',
    pronunciation: 'ya-do-n',
    meaning: 'Yadon'
  },
  'ヤドラン': {
    japanese: 'ヤドラン',
    romaji: 'yadoran',
    pronunciation: 'ya-do-ra-n',
    meaning: 'Yadoran'
  },
  'コイル': {
    japanese: 'コイル',
    romaji: 'koiru',
    pronunciation: 'ko-i-ru',
    meaning: 'Coil'
  },
  'レアコイル': {
    japanese: 'レアコイル',
    romaji: 'reakoiru',
    pronunciation: 're-a-ko-i-ru',
    meaning: 'Rare Coil'
  },
  'カモネギ': {
    japanese: 'カモネギ',
    romaji: 'kamonegi',
    pronunciation: 'ka-mo-ne-gi',
    meaning: 'Duck Onion'
  },
  'ドードー': {
    japanese: 'ドードー',
    romaji: 'do-do-',
    pronunciation: 'do--do-',
    meaning: 'Dodo'
  },
  'ドードリオ': {
    japanese: 'ドードリオ',
    romaji: 'do-dorio',
    pronunciation: 'do--do-ri-o',
    meaning: 'Dodrio'
  },
  'パウワウ': {
    japanese: 'パウワウ',
    romaji: 'pauwau',
    pronunciation: 'pa-u-wa-u',
    meaning: 'Pauwau'
  },
  'ジュゴン': {
    japanese: 'ジュゴン',
    romaji: 'jugon',
    pronunciation: 'ju-go-n',
    meaning: 'Dugong'
  },
  'ベトベター': {
    japanese: 'ベトベター',
    romaji: 'betobeta-',
    pronunciation: 'be-to-be-ta-',
    meaning: 'Betobeter'
  },
  'ベトベトン': {
    japanese: 'ベトベトン',
    romaji: 'betobeton',
    pronunciation: 'be-to-be-to-n',
    meaning: 'Betobeton'
  },
  'シェルダー': {
    japanese: 'シェルダー',
    romaji: 'shieruda-',
    pronunciation: 'shi-e-ru-da-',
    meaning: 'Shellder'
  },
  'パルシェン': {
    japanese: 'パルシェン',
    romaji: 'parushien',
    pronunciation: 'pa-ru-shi-e-n',
    meaning: 'Parshen'
  },
  'ゴース': {
    japanese: 'ゴース',
    romaji: 'go-su',
    pronunciation: 'go--su',
    meaning: 'Gas'
  },
  'ゴースト': {
    japanese: 'ゴースト',
    romaji: 'go-suto',
    pronunciation: 'go--su-to',
    meaning: 'Ghost'
  },
  'ゲンガー': {
    japanese: 'ゲンガー',
    romaji: 'genga-',
    pronunciation: 'ge-nga-',
    meaning: 'Gengar'
  },
  'イワーク': {
    japanese: 'イワーク',
    romaji: 'iwa-ku',
    pronunciation: 'i-wa--ku',
    meaning: 'Iron Snake'
  },
  'スリープ': {
    japanese: 'スリープ',
    romaji: 'suri-pu',
    pronunciation: 'su-ri--pu',
    meaning: 'Sleep'
  },
  'スリーパー': {
    japanese: 'スリーパー',
    romaji: 'suri-pa-',
    pronunciation: 'su-ri--pa-',
    meaning: 'Sleeper'
  },
  'クラブ': {
    japanese: 'クラブ',
    romaji: 'kurabu',
    pronunciation: 'ku-ra-bu',
    meaning: 'Crab'
  },
  'キングラー': {
    japanese: 'キングラー',
    romaji: 'kingura-',
    pronunciation: 'ki-ngu-ra-',
    meaning: 'Kingler'
  },
  'ビリリダマ': {
    japanese: 'ビリリダマ',
    romaji: 'biriridama',
    pronunciation: 'bi-ri-ri-da-ma',
    meaning: 'Electric Ball'
  },
  'マルマイン': {
    japanese: 'マルマイン',
    romaji: 'marumain',
    pronunciation: 'ma-ru-ma-i-n',
    meaning: 'Ball Mine'
  },
  'タマタマ': {
    japanese: 'タマタマ',
    romaji: 'tamatama',
    pronunciation: 'ta-ma-ta-ma',
    meaning: 'Egg'
  },
  'ナッシー': {
    japanese: 'ナッシー',
    romaji: 'natsushi-',
    pronunciation: 'na-tsu-shi-',
    meaning: 'Coconut'
  },
  'カラカラ': {
    japanese: 'カラカラ',
    romaji: 'karakara',
    pronunciation: 'ka-ra-ka-ra',
    meaning: 'Skull'
  },
  'ガラガラ': {
    japanese: 'ガラガラ',
    romaji: 'garagara',
    pronunciation: 'ga-ra-ga-ra',
    meaning: 'Rattle'
  },
  'サワムラー': {
    japanese: 'サワムラー',
    romaji: 'sawamura-',
    pronunciation: 'sa-wa-mu-ra-',
    meaning: 'Sawamular'
  },
  'エビワラー': {
    japanese: 'エビワラー',
    romaji: 'ebiwara-',
    pronunciation: 'e-bi-wa-ra-',
    meaning: 'Ebiwarar'
  },
  'ベロリンガ': {
    japanese: 'ベロリンガ',
    romaji: 'beroringa',
    pronunciation: 'be-ro-ri-nga',
    meaning: 'Licking Tongue'
  },
  'ドガース': {
    japanese: 'ドガース',
    romaji: 'doga-su',
    pronunciation: 'do-ga--su',
    meaning: 'Dogas'
  },
  'マタドガス': {
    japanese: 'マタドガス',
    romaji: 'matadogasu',
    pronunciation: 'ma-ta-do-ga-su',
    meaning: 'Matadogas'
  },
  'サイホーン': {
    japanese: 'サイホーン',
    romaji: 'saiho-n',
    pronunciation: 'sa-i-ho--n',
    meaning: 'Rhyhorn'
  },
  'サイドン': {
    japanese: 'サイドン',
    romaji: 'saidon',
    pronunciation: 'sa-i-do-n',
    meaning: 'Rhydon'
  },
  'ラッキー': {
    japanese: 'ラッキー',
    romaji: 'ratsuki-',
    pronunciation: 'ra-tsu-ki-',
    meaning: 'Lucky'
  },
  'モンジャラ': {
    japanese: 'モンジャラ',
    romaji: 'monjara',
    pronunciation: 'mo-nja-ra',
    meaning: 'Tangela'
  },
  'ガルーラ': {
    japanese: 'ガルーラ',
    romaji: 'garu-ra',
    pronunciation: 'ga-ru--ra',
    meaning: 'Kangaskhan'
  },
  'タッツー': {
    japanese: 'タッツー',
    romaji: 'tatsutsu-',
    pronunciation: 'ta-tsu-tsu-',
    meaning: 'Horsea'
  },
  'シードラ': {
    japanese: 'シードラ',
    romaji: 'shi-dora',
    pronunciation: 'shi--do-ra',
    meaning: 'Seadra'
  },
  'トサキント': {
    japanese: 'トサキント',
    romaji: 'tosakinto',
    pronunciation: 'to-sa-ki-nto',
    meaning: 'Goldfish'
  },
  'アズマオウ': {
    japanese: 'アズマオウ',
    romaji: 'azumaou',
    pronunciation: 'a-zu-ma-o-u',
    meaning: 'Seaking'
  },
  'ヒトデマン': {
    japanese: 'ヒトデマン',
    romaji: 'hitodeman',
    pronunciation: 'hi-to-de-ma-n',
    meaning: 'Starfish'
  },
  'スターミー': {
    japanese: 'スターミー',
    romaji: 'suta-mi-',
    pronunciation: 'su-ta--mi-',
    meaning: 'Starmie'
  },
  'バリヤード': {
    japanese: 'バリヤード',
    romaji: 'bariya-do',
    pronunciation: 'ba-ri-ya--do',
    meaning: 'Barrier'
  },
  'ストライク': {
    japanese: 'ストライク',
    romaji: 'sutoraiku',
    pronunciation: 'su-to-ra-i-ku',
    meaning: 'Strike'
  },
  'ルージュラ': {
    japanese: 'ルージュラ',
    romaji: 'ru-jura',
    pronunciation: 'ru--ju-ra',
    meaning: 'Jynx'
  },
  'エレブー': {
    japanese: 'エレブー',
    romaji: 'erebu-',
    pronunciation: 'e-re-bu-',
    meaning: 'Electabuzz'
  },
  'ブーバー': {
    japanese: 'ブーバー',
    romaji: 'bu-ba-',
    pronunciation: 'bu--ba-',
    meaning: 'Magmar'
  },
  'カイロス': {
    japanese: 'カイロス',
    romaji: 'kairosu',
    pronunciation: 'ka-i-ro-su',
    meaning: 'Pinsir'
  },
  'ケンタロス': {
    japanese: 'ケンタロス',
    romaji: 'kentarosu',
    pronunciation: 'ke-nta-ro-su',
    meaning: 'Tauros'
  },
  'コイキング': {
    japanese: 'コイキング',
    romaji: 'koikingu',
    pronunciation: 'ko-i-ki-ngu',
    meaning: 'Carp'
  },
  'ギャラドス': {
    japanese: 'ギャラドス',
    romaji: 'gyaradosu',
    pronunciation: 'gya-ra-do-su',
    meaning: 'Gyarados'
  },
  'ラプラス': {
    japanese: 'ラプラス',
    romaji: 'rapurasu',
    pronunciation: 'ra-pu-ra-su',
    meaning: 'Lapras'
  },
  'メタモン': {
    japanese: 'メタモン',
    romaji: 'metamon',
    pronunciation: 'me-ta-mo-n',
    meaning: 'Metamon'
  },
  'イーブイ': {
    japanese: 'イーブイ',
    romaji: 'i-bui',
    pronunciation: 'i--bu-i',
    meaning: 'Eevee'
  },
  'シャワーズ': {
    japanese: 'シャワーズ',
    romaji: 'shawa-zu',
    pronunciation: 'sha-wa--zu',
    meaning: 'Showers'
  },
  'サンダース': {
    japanese: 'サンダース',
    romaji: 'sanda-su',
    pronunciation: 'sa-nda--su',
    meaning: 'Thunders'
  },
  'ブースター': {
    japanese: 'ブースター',
    romaji: 'bu-suta-',
    pronunciation: 'bu--su-ta-',
    meaning: 'Booster'
  },
  'ポリゴン': {
    japanese: 'ポリゴン',
    romaji: 'porigon',
    pronunciation: 'po-ri-go-n',
    meaning: 'Polygon'
  },
  'オムナイト': {
    japanese: 'オムナイト',
    romaji: 'omunaito',
    pronunciation: 'o-mu-na-i-to',
    meaning: 'Omanyte'
  },
  'オムスター': {
    japanese: 'オムスター',
    romaji: 'omusuta-',
    pronunciation: 'o-mu-su-ta-',
    meaning: 'Omastar'
  },
  'カブト': {
    japanese: 'カブト',
    romaji: 'kabuto',
    pronunciation: 'ka-bu-to',
    meaning: 'Kabuto'
  },
  'カブトプス': {
    japanese: 'カブトプス',
    romaji: 'kabutopusu',
    pronunciation: 'ka-bu-to-pu-su',
    meaning: 'Kabutops'
  },
  'プテラ': {
    japanese: 'プテラ',
    romaji: 'putera',
    pronunciation: 'pu-te-ra',
    meaning: 'Aerodactyl'
  },
  'カビゴン': {
    japanese: 'カビゴン',
    romaji: 'kabigon',
    pronunciation: 'ka-bi-go-n',
    meaning: 'Snorlax'
  },
  'フリーザー': {
    japanese: 'フリーザー',
    romaji: 'furi-za-',
    pronunciation: 'fu-ri--za-',
    meaning: 'Freezer'
  },
  'サンダー': {
    japanese: 'サンダー',
    romaji: 'sanda-',
    pronunciation: 'sa-nda-',
    meaning: 'Thunder'
  },
  'ファイヤー': {
    japanese: 'ファイヤー',
    romaji: 'fuaiya-',
    pronunciation: 'fu-a-i-ya-',
    meaning: 'Fire'
  },
  'ミニリュウ': {
    japanese: 'ミニリュウ',
    romaji: 'miniryuu',
    pronunciation: 'mi-ni-ryu-u',
    meaning: 'Mini Dragon'
  },
  'ハクリュー': {
    japanese: 'ハクリュー',
    romaji: 'hakuryu-',
    pronunciation: 'ha-ku-ryu-',
    meaning: 'Hakuryu'
  },
  'カイリュー': {
    japanese: 'カイリュー',
    romaji: 'kairyu-',
    pronunciation: 'ka-i-ryu-',
    meaning: 'Dragonite'
  },
  'ミュウツー': {
    japanese: 'ミュウツー',
    romaji: 'myuutsu-',
    pronunciation: 'myu-u-tsu-',
    meaning: 'Mewtwo'
  },
  'ミュウ': {
    japanese: 'ミュウ',
    romaji: 'myuu',
    pronunciation: 'myu-u',
    meaning: 'Mew'
  },
  'チコリータ': {
    japanese: 'チコリータ',
    romaji: 'chikori-ta',
    pronunciation: 'chi-ko-ri--ta',
    meaning: 'Leaf Pokémon'
  },
  'ベイリーフ': {
    japanese: 'ベイリーフ',
    romaji: 'beiri-fu',
    pronunciation: 'be-i-ri--fu',
    meaning: 'Leaf Pokémon'
  },
  'メガニウム': {
    japanese: 'メガニウム',
    romaji: 'meganiumu',
    pronunciation: 'me-ga-ni-u-mu',
    meaning: 'Herb Pokémon'
  },
  'ヒノアラシ': {
    japanese: 'ヒノアラシ',
    romaji: 'hinoarashi',
    pronunciation: 'hi-no-a-ra-shi',
    meaning: 'Fire Mouse Pokémon'
  },
  'マグマラシ': {
    japanese: 'マグマラシ',
    romaji: 'magumarashi',
    pronunciation: 'ma-gu-ma-ra-shi',
    meaning: 'Volcano Pokémon'
  },
  'バクフーン': {
    japanese: 'バクフーン',
    romaji: 'bakufu-n',
    pronunciation: 'ba-ku-fu--n',
    meaning: 'Volcano Pokémon'
  },
  'ワニノコ': {
    japanese: 'ワニノコ',
    romaji: 'waninoko',
    pronunciation: 'wa-ni-no-ko',
    meaning: 'Big Jaw Pokémon'
  },
  'アリゲイツ': {
    japanese: 'アリゲイツ',
    romaji: 'arigeitsu',
    pronunciation: 'a-ri-ge-i-tsu',
    meaning: 'Big Jaw Pokémon'
  },
  'オーダイル': {
    japanese: 'オーダイル',
    romaji: 'o-dairu',
    pronunciation: 'o--da-i-ru',
    meaning: 'Big Jaw Pokémon'
  },
  'オタチ': {
    japanese: 'オタチ',
    romaji: 'otachi',
    pronunciation: 'o-ta-chi',
    meaning: 'Scout Pokémon'
  },
  'オオタチ': {
    japanese: 'オオタチ',
    romaji: 'ootachi',
    pronunciation: 'o-o-ta-chi',
    meaning: 'Long Body Pokémon'
  },
  'ホーホー': {
    japanese: 'ホーホー',
    romaji: 'ho-ho-',
    pronunciation: 'ho--ho-',
    meaning: 'Owl Pokémon'
  },
  'ヨルノズク': {
    japanese: 'ヨルノズク',
    romaji: 'yorunozuku',
    pronunciation: 'yo-ru-no-zu-ku',
    meaning: 'Owl Pokémon'
  },
  'レディバ': {
    japanese: 'レディバ',
    romaji: 'redeiba',
    pronunciation: 're-de-i-ba',
    meaning: 'Five Star Pokémon'
  },
  'レディアン': {
    japanese: 'レディアン',
    romaji: 'redeian',
    pronunciation: 're-de-i-a-n',
    meaning: 'Five Star Pokémon'
  },
  'イトマル': {
    japanese: 'イトマル',
    romaji: 'itomaru',
    pronunciation: 'i-to-ma-ru',
    meaning: 'String Spit Pokémon'
  },
  'アリアドス': {
    japanese: 'アリアドス',
    romaji: 'ariadosu',
    pronunciation: 'a-ri-a-do-su',
    meaning: 'Long Leg Pokémon'
  },
  'クロバット': {
    japanese: 'クロバット',
    romaji: 'kurobatsuto',
    pronunciation: 'ku-ro-ba-tsu-to',
    meaning: 'Bat Pokémon'
  },
  'チョンチー': {
    japanese: 'チョンチー',
    romaji: 'chonchi-',
    pronunciation: 'cho-nchi-',
    meaning: 'Angler Pokémon'
  },
  'ランターン': {
    japanese: 'ランターン',
    romaji: 'ranta-n',
    pronunciation: 'ra-nta--n',
    meaning: 'Light Pokémon'
  },
  'ピチュー': {
    japanese: 'ピチュー',
    romaji: 'pichu-',
    pronunciation: 'pi-chu-',
    meaning: 'Tiny Mouse Pokémon'
  },
  'ピィ': {
    japanese: 'ピィ',
    romaji: 'pii',
    pronunciation: 'pi-i',
    meaning: 'Star Shape Pokémon'
  },
  'ププリン': {
    japanese: 'ププリン',
    romaji: 'pupurin',
    pronunciation: 'pu-pu-ri-n',
    meaning: 'Balloon Pokémon'
  },
  'トゲピー': {
    japanese: 'トゲピー',
    romaji: 'togepi-',
    pronunciation: 'to-ge-pi-',
    meaning: 'Spike Ball Pokémon'
  },
  'トゲチック': {
    japanese: 'トゲチック',
    romaji: 'togechitsuku',
    pronunciation: 'to-ge-chi-tsu-ku',
    meaning: 'Happiness Pokémon'
  },
  'ネイティ': {
    japanese: 'ネイティ',
    romaji: 'neitei',
    pronunciation: 'ne-i-te-i',
    meaning: 'Tiny Bird Pokémon'
  },
  'ネイティオ': {
    japanese: 'ネイティオ',
    romaji: 'neiteio',
    pronunciation: 'ne-i-te-i-o',
    meaning: 'Mystic Pokémon'
  },
  'メリープ': {
    japanese: 'メリープ',
    romaji: 'meri-pu',
    pronunciation: 'me-ri--pu',
    meaning: 'Wool Pokémon'
  },
  'モココ': {
    japanese: 'モココ',
    romaji: 'mokoko',
    pronunciation: 'mo-ko-ko',
    meaning: 'Wool Pokémon'
  },
  'デンリュウ': {
    japanese: 'デンリュウ',
    romaji: 'denryuu',
    pronunciation: 'de-nryu-u',
    meaning: 'Light Pokémon'
  },
  'キレイハナ': {
    japanese: 'キレイハナ',
    romaji: 'kireihana',
    pronunciation: 'ki-re-i-ha-na',
    meaning: 'Flower Pokémon'
  },
  'マリル': {
    japanese: 'マリル',
    romaji: 'mariru',
    pronunciation: 'ma-ri-ru',
    meaning: 'Aqua Mouse Pokémon'
  },
  'マリルリ': {
    japanese: 'マリルリ',
    romaji: 'mariruri',
    pronunciation: 'ma-ri-ru-ri',
    meaning: 'Aqua Rabbit Pokémon'
  },
  'ウソッキー': {
    japanese: 'ウソッキー',
    romaji: 'usotsuki-',
    pronunciation: 'u-so-tsu-ki-',
    meaning: 'Imitation Pokémon'
  },
  'ニョロトノ': {
    japanese: 'ニョロトノ',
    romaji: 'nyorotono',
    pronunciation: 'nyo-ro-to-no',
    meaning: 'Frog Lord'
  },
  'ハネッコ': {
    japanese: 'ハネッコ',
    romaji: 'hanetsuko',
    pronunciation: 'ha-ne-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'ポポッコ': {
    japanese: 'ポポッコ',
    romaji: 'popotsuko',
    pronunciation: 'po-po-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'ワタッコ': {
    japanese: 'ワタッコ',
    romaji: 'watatsuko',
    pronunciation: 'wa-ta-tsu-ko',
    meaning: 'Cottonweed Pokémon'
  },
  'エイパム': {
    japanese: 'エイパム',
    romaji: 'eipamu',
    pronunciation: 'e-i-pa-mu',
    meaning: 'Long Tail Pokémon'
  },
  'ヒマナッツ': {
    japanese: 'ヒマナッツ',
    romaji: 'himanatsutsu',
    pronunciation: 'hi-ma-na-tsu-tsu',
    meaning: 'Seed Pokémon'
  },
  'キマワリ': {
    japanese: 'キマワリ',
    romaji: 'kimawari',
    pronunciation: 'ki-ma-wa-ri',
    meaning: 'Sun Pokémon'
  },
  'ヤンヤンマ': {
    japanese: 'ヤンヤンマ',
    romaji: 'yanyanma',
    pronunciation: 'ya-nya-nma',
    meaning: 'Clear Wing Pokémon'
  },
  'ウパー': {
    japanese: 'ウパー',
    romaji: 'upa-',
    pronunciation: 'u-pa-',
    meaning: 'Water Fish Pokémon'
  },
  'ヌオー': {
    japanese: 'ヌオー',
    romaji: 'nuo-',
    pronunciation: 'nu-o-',
    meaning: 'Water Fish Pokémon'
  },
  'エーフィ': {
    japanese: 'エーフィ',
    romaji: 'e-fui',
    pronunciation: 'e--fu-i',
    meaning: 'Sun Pokémon'
  },
  'ブラッキー': {
    japanese: 'ブラッキー',
    romaji: 'buratsuki-',
    pronunciation: 'bu-ra-tsu-ki-',
    meaning: 'Moonlight Pokémon'
  },
  'ヤミカラス': {
    japanese: 'ヤミカラス',
    romaji: 'yamikarasu',
    pronunciation: 'ya-mi-ka-ra-su',
    meaning: 'Darkness Pokémon'
  },
  'ヤドキング': {
    japanese: 'ヤドキング',
    romaji: 'yadokingu',
    pronunciation: 'ya-do-ki-ngu',
    meaning: 'Royal Pokémon'
  },
  'ムウマ': {
    japanese: 'ムウマ',
    romaji: 'muuma',
    pronunciation: 'mu-u-ma',
    meaning: 'Screech Pokémon'
  },
  'アンノーン': {
    japanese: 'アンノーン',
    romaji: 'anno-n',
    pronunciation: 'a-nno--n',
    meaning: 'Symbol Pokémon'
  },
  'ソーナンス': {
    japanese: 'ソーナンス',
    romaji: 'so-nansu',
    pronunciation: 'so--na-nsu',
    meaning: 'Patient Pokémon'
  },
  'キリンリキ': {
    japanese: 'キリンリキ',
    romaji: 'kirinriki',
    pronunciation: 'ki-ri-nri-ki',
    meaning: 'Long Neck Pokémon'
  },
  'クヌギダマ': {
    japanese: 'クヌギダマ',
    romaji: 'kunugidama',
    pronunciation: 'ku-nu-gi-da-ma',
    meaning: 'Bagworm Pokémon'
  },
  'フォレトス': {
    japanese: 'フォレトス',
    romaji: 'fuoretosu',
    pronunciation: 'fu-o-re-to-su',
    meaning: 'Bagworm Pokémon'
  },
  'ノコッチ': {
    japanese: 'ノコッチ',
    romaji: 'nokotsuchi',
    pronunciation: 'no-ko-tsu-chi',
    meaning: 'Land Snake Pokémon'
  },
  'グライガー': {
    japanese: 'グライガー',
    romaji: 'guraiga-',
    pronunciation: 'gu-ra-i-ga-',
    meaning: 'Fly Scorpion Pokémon'
  },
  'ハガネール': {
    japanese: 'ハガネール',
    romaji: 'hagane-ru',
    pronunciation: 'ha-ga-ne--ru',
    meaning: 'Iron Snake Pokémon'
  },
  'ブルー': {
    japanese: 'ブルー',
    romaji: 'buru-',
    pronunciation: 'bu-ru-',
    meaning: 'Fairy Pokémon'
  },
  'グランブル': {
    japanese: 'グランブル',
    romaji: 'guranburu',
    pronunciation: 'gu-ra-nbu-ru',
    meaning: 'Fairy Pokémon'
  },
  'ハリーセン': {
    japanese: 'ハリーセン',
    romaji: 'hari-sen',
    pronunciation: 'ha-ri--se-n',
    meaning: 'Balloon Pokémon'
  },
  'ハッサム': {
    japanese: 'ハッサム',
    romaji: 'hatsusamu',
    pronunciation: 'ha-tsu-sa-mu',
    meaning: 'Pincer Pokémon'
  },
  'ツボツボ': {
    japanese: 'ツボツボ',
    romaji: 'tsubotsubo',
    pronunciation: 'tsu-bo-tsu-bo',
    meaning: 'Mold Pokémon'
  },
  'ヘラクロス': {
    japanese: 'ヘラクロス',
    romaji: 'herakurosu',
    pronunciation: 'he-ra-ku-ro-su',
    meaning: 'Single Horn Pokémon'
  },
  'ニューラ': {
    japanese: 'ニューラ',
    romaji: 'nyu-ra',
    pronunciation: 'nyu--ra',
    meaning: 'Sharp Claw Pokémon'
  },
  'ヒメグマ': {
    japanese: 'ヒメグマ',
    romaji: 'himeguma',
    pronunciation: 'hi-me-gu-ma',
    meaning: 'Little Bear Pokémon'
  },
  'リングマ': {
    japanese: 'リングマ',
    romaji: 'ringuma',
    pronunciation: 'ri-ngu-ma',
    meaning: 'Hibernator Pokémon'
  },
  'マグマッグ': {
    japanese: 'マグマッグ',
    romaji: 'magumatsugu',
    pronunciation: 'ma-gu-ma-tsu-gu',
    meaning: 'Lava Pokémon'
  },
  'マグカルゴ': {
    japanese: 'マグカルゴ',
    romaji: 'magukarugo',
    pronunciation: 'ma-gu-ka-ru-go',
    meaning: 'Lava Pokémon'
  },
  'ウリムー': {
    japanese: 'ウリムー',
    romaji: 'urimu-',
    pronunciation: 'u-ri-mu-',
    meaning: 'Pig Pokémon'
  },
  'イノムー': {
    japanese: 'イノムー',
    romaji: 'inomu-',
    pronunciation: 'i-no-mu-',
    meaning: 'Swine Pokémon'
  },
  'サニーゴ': {
    japanese: 'サニーゴ',
    romaji: 'sani-go',
    pronunciation: 'sa-ni--go',
    meaning: 'Coral Pokémon'
  },
  'テッポウオ': {
    japanese: 'テッポウオ',
    romaji: 'tetsupouo',
    pronunciation: 'te-tsu-po-u-o',
    meaning: 'Jet Pokémon'
  },
  'オクタン': {
    japanese: 'オクタン',
    romaji: 'okutan',
    pronunciation: 'o-ku-ta-n',
    meaning: 'Jet Pokémon'
  },
  'デリバード': {
    japanese: 'デリバード',
    romaji: 'deriba-do',
    pronunciation: 'de-ri-ba--do',
    meaning: 'Delivery Pokémon'
  },
  'マンタイン': {
    japanese: 'マンタイン',
    romaji: 'mantain',
    pronunciation: 'ma-nta-i-n',
    meaning: 'Kite Pokémon'
  },
  'エアームド': {
    japanese: 'エアームド',
    romaji: 'ea-mudo',
    pronunciation: 'e-a--mu-do',
    meaning: 'Armor Bird Pokémon'
  },
  'デルビル': {
    japanese: 'デルビル',
    romaji: 'derubiru',
    pronunciation: 'de-ru-bi-ru',
    meaning: 'Dark Pokémon'
  },
  'ヘルガー': {
    japanese: 'ヘルガー',
    romaji: 'heruga-',
    pronunciation: 'he-ru-ga-',
    meaning: 'Dark Pokémon'
  },
  'キングドラ': {
    japanese: 'キングドラ',
    romaji: 'kingudora',
    pronunciation: 'ki-ngu-do-ra',
    meaning: 'Dragon Pokémon'
  },
  'ゴマゾウ': {
    japanese: 'ゴマゾウ',
    romaji: 'gomazou',
    pronunciation: 'go-ma-zo-u',
    meaning: 'Long Nose Pokémon'
  },
  'ドンファン': {
    japanese: 'ドンファン',
    romaji: 'donfuan',
    pronunciation: 'do-nfu-a-n',
    meaning: 'Armor Pokémon'
  },
  'ポリゴン２': {
    japanese: 'ポリゴン２',
    romaji: 'porigon２',
    pronunciation: 'po-ri-go-n２',
    meaning: 'Virtual Pokémon'
  },
  'オドシシ': {
    japanese: 'オドシシ',
    romaji: 'odoshishi',
    pronunciation: 'o-do-shi-shi',
    meaning: 'Big Horn Pokémon'
  },
  'ドーブル': {
    japanese: 'ドーブル',
    romaji: 'do-buru',
    pronunciation: 'do--bu-ru',
    meaning: 'Painter Pokémon'
  },
  'バルキー': {
    japanese: 'バルキー',
    romaji: 'baruki-',
    pronunciation: 'ba-ru-ki-',
    meaning: 'Scuffle Pokémon'
  },
  'カポエラー': {
    japanese: 'カポエラー',
    romaji: 'kapoera-',
    pronunciation: 'ka-po-e-ra-',
    meaning: 'Handstand Pokémon'
  },
  'ムチュール': {
    japanese: 'ムチュール',
    romaji: 'muchu-ru',
    pronunciation: 'mu-chu--ru',
    meaning: 'Kiss Pokémon'
  },
  'エレキッド': {
    japanese: 'エレキッド',
    romaji: 'erekitsudo',
    pronunciation: 'e-re-ki-tsu-do',
    meaning: 'Electric Pokémon'
  },
  'ブビィ': {
    japanese: 'ブビィ',
    romaji: 'bubii',
    pronunciation: 'bu-bi-i',
    meaning: 'Live Coal Pokémon'
  },
  'ミルタンク': {
    japanese: 'ミルタンク',
    romaji: 'mirutanku',
    pronunciation: 'mi-ru-ta-nku',
    meaning: 'Milk Cow Pokémon'
  },
  'ハピナス': {
    japanese: 'ハピナス',
    romaji: 'hapinasu',
    pronunciation: 'ha-pi-na-su',
    meaning: 'Happiness Pokémon'
  },
  'ライコウ': {
    japanese: 'ライコウ',
    romaji: 'raikou',
    pronunciation: 'ra-i-ko-u',
    meaning: 'Thunder Pokémon'
  },
  'エンテイ': {
    japanese: 'エンテイ',
    romaji: 'entei',
    pronunciation: 'e-nte-i',
    meaning: 'Volcano Pokémon'
  },
  'スイクン': {
    japanese: 'スイクン',
    romaji: 'suikun',
    pronunciation: 'su-i-ku-n',
    meaning: 'Aurora Pokémon'
  },
  'ヨーギラス': {
    japanese: 'ヨーギラス',
    romaji: 'yo-girasu',
    pronunciation: 'yo--gi-ra-su',
    meaning: 'Rock Skin Pokémon'
  },
  'サナギラス': {
    japanese: 'サナギラス',
    romaji: 'sanagirasu',
    pronunciation: 'sa-na-gi-ra-su',
    meaning: 'Hard Shell Pokémon'
  },
  'バンギラス': {
    japanese: 'バンギラス',
    romaji: 'bangirasu',
    pronunciation: 'ba-ngi-ra-su',
    meaning: 'Armor Pokémon'
  },
  'ルギア': {
    japanese: 'ルギア',
    romaji: 'rugia',
    pronunciation: 'ru-gi-a',
    meaning: 'Diving Pokémon'
  },
  'ホウオウ': {
    japanese: 'ホウオウ',
    romaji: 'houou',
    pronunciation: 'ho-u-o-u',
    meaning: 'Rainbow Pokémon'
  },
  'セレビィ': {
    japanese: 'セレビィ',
    romaji: 'serebii',
    pronunciation: 'se-re-bi-i',
    meaning: 'Time Travel Pokémon'
  },
  'キモリ': {
    japanese: 'キモリ',
    romaji: 'kimori',
    pronunciation: 'ki-mo-ri',
    meaning: 'Wood Gecko Pokémon'
  },
  'ジュプトル': {
    japanese: 'ジュプトル',
    romaji: 'juputoru',
    pronunciation: 'ju-pu-to-ru',
    meaning: 'Wood Gecko Pokémon'
  },
  'ジュカイン': {
    japanese: 'ジュカイン',
    romaji: 'jukain',
    pronunciation: 'ju-ka-i-n',
    meaning: 'Forest Pokémon'
  },
  'アチャモ': {
    japanese: 'アチャモ',
    romaji: 'achamo',
    pronunciation: 'a-cha-mo',
    meaning: 'Chick Pokémon'
  },
  'ワカシャモ': {
    japanese: 'ワカシャモ',
    romaji: 'wakashamo',
    pronunciation: 'wa-ka-sha-mo',
    meaning: 'Young Fowl Pokémon'
  },
  'バシャーモ': {
    japanese: 'バシャーモ',
    romaji: 'basha-mo',
    pronunciation: 'ba-sha--mo',
    meaning: 'Blaze Pokémon'
  },
  'ミズゴロウ': {
    japanese: 'ミズゴロウ',
    romaji: 'mizugorou',
    pronunciation: 'mi-zu-go-ro-u',
    meaning: 'Mud Fish Pokémon'
  },
  'ヌマクロー': {
    japanese: 'ヌマクロー',
    romaji: 'numakuro-',
    pronunciation: 'nu-ma-ku-ro-',
    meaning: 'Mud Fish Pokémon'
  },
  'ラグラージ': {
    japanese: 'ラグラージ',
    romaji: 'ragura-ji',
    pronunciation: 'ra-gu-ra--ji',
    meaning: 'Mud Fish Pokémon'
  },
  'ポチエナ': {
    japanese: 'ポチエナ',
    romaji: 'pochiena',
    pronunciation: 'po-chi-e-na',
    meaning: 'Bite Pokémon'
  },
  'グラエナ': {
    japanese: 'グラエナ',
    romaji: 'guraena',
    pronunciation: 'gu-ra-e-na',
    meaning: 'Bite Pokémon'
  },
  'ジグザグマ': {
    japanese: 'ジグザグマ',
    romaji: 'jiguzaguma',
    pronunciation: 'ji-gu-za-gu-ma',
    meaning: 'Tiny Raccoon Pokémon'
  },
  'マッスグマ': {
    japanese: 'マッスグマ',
    romaji: 'matsusuguma',
    pronunciation: 'ma-tsu-su-gu-ma',
    meaning: 'Rushing Pokémon'
  },
  'ケムッソ': {
    japanese: 'ケムッソ',
    romaji: 'kemutsuso',
    pronunciation: 'ke-mu-tsu-so',
    meaning: 'Worm Pokémon'
  },
  'カラサリス': {
    japanese: 'カラサリス',
    romaji: 'karasarisu',
    pronunciation: 'ka-ra-sa-ri-su',
    meaning: 'Cocoon Pokémon'
  },
  'アゲハント': {
    japanese: 'アゲハント',
    romaji: 'agehanto',
    pronunciation: 'a-ge-ha-nto',
    meaning: 'Butterfly Pokémon'
  },
  'マユルド': {
    japanese: 'マユルド',
    romaji: 'mayurudo',
    pronunciation: 'ma-yu-ru-do',
    meaning: 'Cocoon Pokémon'
  },
  'ドクケイル': {
    japanese: 'ドクケイル',
    romaji: 'dokukeiru',
    pronunciation: 'do-ku-ke-i-ru',
    meaning: 'Poison Moth Pokémon'
  },
  'ハスボー': {
    japanese: 'ハスボー',
    romaji: 'hasubo-',
    pronunciation: 'ha-su-bo-',
    meaning: 'Water Weed Pokémon'
  },
  'ハスブレロ': {
    japanese: 'ハスブレロ',
    romaji: 'hasuburero',
    pronunciation: 'ha-su-bu-re-ro',
    meaning: 'Jolly Pokémon'
  },
  'ルンパッパ': {
    japanese: 'ルンパッパ',
    romaji: 'runpatsupa',
    pronunciation: 'ru-npa-tsu-pa',
    meaning: 'Carefree Pokémon'
  },
  'タネボー': {
    japanese: 'タネボー',
    romaji: 'tanebo-',
    pronunciation: 'ta-ne-bo-',
    meaning: 'Acorn Pokémon'
  },
  'コノハナ': {
    japanese: 'コノハナ',
    romaji: 'konohana',
    pronunciation: 'ko-no-ha-na',
    meaning: 'Wily Pokémon'
  },
  'ダーテング': {
    japanese: 'ダーテング',
    romaji: 'da-tengu',
    pronunciation: 'da--te-ngu',
    meaning: 'Wicked Pokémon'
  },
  'スバメ': {
    japanese: 'スバメ',
    romaji: 'subame',
    pronunciation: 'su-ba-me',
    meaning: 'Tiny Swallow Pokémon'
  },
  'オオスバメ': {
    japanese: 'オオスバメ',
    romaji: 'oosubame',
    pronunciation: 'o-o-su-ba-me',
    meaning: 'Swallow Pokémon'
  },
  'キャモメ': {
    japanese: 'キャモメ',
    romaji: 'kyamome',
    pronunciation: 'kya-mo-me',
    meaning: 'Seagull Pokémon'
  },
  'ペリッパー': {
    japanese: 'ペリッパー',
    romaji: 'peritsupa-',
    pronunciation: 'pe-ri-tsu-pa-',
    meaning: 'Water Bird Pokémon'
  },
  'ラルトス': {
    japanese: 'ラルトス',
    romaji: 'rarutosu',
    pronunciation: 'ra-ru-to-su',
    meaning: 'Feeling Pokémon'
  },
  'キルリア': {
    japanese: 'キルリア',
    romaji: 'kiruria',
    pronunciation: 'ki-ru-ri-a',
    meaning: 'Emotion Pokémon'
  },
  'サーナイト': {
    japanese: 'サーナイト',
    romaji: 'sa-naito',
    pronunciation: 'sa--na-i-to',
    meaning: 'Embrace Pokémon'
  },
  'アメタマ': {
    japanese: 'アメタマ',
    romaji: 'ametama',
    pronunciation: 'a-me-ta-ma',
    meaning: 'Pond Skater Pokémon'
  },
  'アメモース': {
    japanese: 'アメモース',
    romaji: 'amemo-su',
    pronunciation: 'a-me-mo--su',
    meaning: 'Eyeball Pokémon'
  },
  'キノココ': {
    japanese: 'キノココ',
    romaji: 'kinokoko',
    pronunciation: 'ki-no-ko-ko',
    meaning: 'Mushroom Pokémon'
  },
  'キノガッサ': {
    japanese: 'キノガッサ',
    romaji: 'kinogatsusa',
    pronunciation: 'ki-no-ga-tsu-sa',
    meaning: 'Mushroom Pokémon'
  },
  'ナマケロ': {
    japanese: 'ナマケロ',
    romaji: 'namakero',
    pronunciation: 'na-ma-ke-ro',
    meaning: 'Slacker Pokémon'
  },
  'ヤルキモノ': {
    japanese: 'ヤルキモノ',
    romaji: 'yarukimono',
    pronunciation: 'ya-ru-ki-mo-no',
    meaning: 'Wild Monkey Pokémon'
  },
  'ケッキング': {
    japanese: 'ケッキング',
    romaji: 'ketsukingu',
    pronunciation: 'ke-tsu-ki-ngu',
    meaning: 'Lazy Pokémon'
  },
  'ツチニン': {
    japanese: 'ツチニン',
    romaji: 'tsuchinin',
    pronunciation: 'tsu-chi-ni-n',
    meaning: 'Trainee Pokémon'
  },
  'テッカニン': {
    japanese: 'テッカニン',
    romaji: 'tetsukanin',
    pronunciation: 'te-tsu-ka-ni-n',
    meaning: 'Ninja Pokémon'
  },
  'ヌケニン': {
    japanese: 'ヌケニン',
    romaji: 'nukenin',
    pronunciation: 'nu-ke-ni-n',
    meaning: 'Shed Pokémon'
  },
  'ゴニョニョ': {
    japanese: 'ゴニョニョ',
    romaji: 'gonyonyo',
    pronunciation: 'go-nyo-nyo',
    meaning: 'Whisper Pokémon'
  },
  'ドゴーム': {
    japanese: 'ドゴーム',
    romaji: 'dogo-mu',
    pronunciation: 'do-go--mu',
    meaning: 'Big Voice Pokémon'
  },
  'バクオング': {
    japanese: 'バクオング',
    romaji: 'bakuongu',
    pronunciation: 'ba-ku-o-ngu',
    meaning: 'Loud Noise Pokémon'
  },
  'マクノシタ': {
    japanese: 'マクノシタ',
    romaji: 'makunoshita',
    pronunciation: 'ma-ku-no-shi-ta',
    meaning: 'Guts Pokémon'
  },
  'ハリテヤマ': {
    japanese: 'ハリテヤマ',
    romaji: 'hariteyama',
    pronunciation: 'ha-ri-te-ya-ma',
    meaning: 'Arm Thrust Pokémon'
  },
  'ルリリ': {
    japanese: 'ルリリ',
    romaji: 'ruriri',
    pronunciation: 'ru-ri-ri',
    meaning: 'Polka Dot Pokémon'
  },
  'ノズパス': {
    japanese: 'ノズパス',
    romaji: 'nozupasu',
    pronunciation: 'no-zu-pa-su',
    meaning: 'Compass Pokémon'
  },
  'エネコ': {
    japanese: 'エネコ',
    romaji: 'eneko',
    pronunciation: 'e-ne-ko',
    meaning: 'Kitten Pokémon'
  },
  'エネコロロ': {
    japanese: 'エネコロロ',
    romaji: 'enekororo',
    pronunciation: 'e-ne-ko-ro-ro',
    meaning: 'Prim Pokémon'
  },
  'ヤミラミ': {
    japanese: 'ヤミラミ',
    romaji: 'yamirami',
    pronunciation: 'ya-mi-ra-mi',
    meaning: 'Darkness Pokémon'
  },
  'クチート': {
    japanese: 'クチート',
    romaji: 'kuchi-to',
    pronunciation: 'ku-chi--to',
    meaning: 'Deceiver Pokémon'
  },
  'ココドラ': {
    japanese: 'ココドラ',
    romaji: 'kokodora',
    pronunciation: 'ko-ko-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'コドラ': {
    japanese: 'コドラ',
    romaji: 'kodora',
    pronunciation: 'ko-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'ボスゴドラ': {
    japanese: 'ボスゴドラ',
    romaji: 'bosugodora',
    pronunciation: 'bo-su-go-do-ra',
    meaning: 'Iron Armor Pokémon'
  },
  'アサナン': {
    japanese: 'アサナン',
    romaji: 'asanan',
    pronunciation: 'a-sa-na-n',
    meaning: 'Meditate Pokémon'
  },
  'チャーレム': {
    japanese: 'チャーレム',
    romaji: 'cha-remu',
    pronunciation: 'cha--re-mu',
    meaning: 'Meditate Pokémon'
  },
  'ラクライ': {
    japanese: 'ラクライ',
    romaji: 'rakurai',
    pronunciation: 'ra-ku-ra-i',
    meaning: 'Lightning Pokémon'
  },
  'ライボルト': {
    japanese: 'ライボルト',
    romaji: 'raiboruto',
    pronunciation: 'ra-i-bo-ru-to',
    meaning: 'Discharge Pokémon'
  },
  'プラスル': {
    japanese: 'プラスル',
    romaji: 'purasuru',
    pronunciation: 'pu-ra-su-ru',
    meaning: 'Cheering Pokémon'
  },
  'マイナン': {
    japanese: 'マイナン',
    romaji: 'mainan',
    pronunciation: 'ma-i-na-n',
    meaning: 'Cheering Pokémon'
  },
  'バルビート': {
    japanese: 'バルビート',
    romaji: 'barubi-to',
    pronunciation: 'ba-ru-bi--to',
    meaning: 'Firefly Pokémon'
  },
  'イルミーゼ': {
    japanese: 'イルミーゼ',
    romaji: 'irumi-ze',
    pronunciation: 'i-ru-mi--ze',
    meaning: 'Firefly Pokémon'
  },
  'ロゼリア': {
    japanese: 'ロゼリア',
    romaji: 'rozeria',
    pronunciation: 'ro-ze-ri-a',
    meaning: 'Thorn Pokémon'
  },
  'ゴクリン': {
    japanese: 'ゴクリン',
    romaji: 'gokurin',
    pronunciation: 'go-ku-ri-n',
    meaning: 'Stomach Pokémon'
  },
  'マルノーム': {
    japanese: 'マルノーム',
    romaji: 'maruno-mu',
    pronunciation: 'ma-ru-no--mu',
    meaning: 'Poison Bag Pokémon'
  },
  'キバニア': {
    japanese: 'キバニア',
    romaji: 'kibania',
    pronunciation: 'ki-ba-ni-a',
    meaning: 'Savage Pokémon'
  },
  'サメハダー': {
    japanese: 'サメハダー',
    romaji: 'samehada-',
    pronunciation: 'sa-me-ha-da-',
    meaning: 'Brutal Pokémon'
  },
  'ホエルコ': {
    japanese: 'ホエルコ',
    romaji: 'hoeruko',
    pronunciation: 'ho-e-ru-ko',
    meaning: 'Ball Whale Pokémon'
  },
  'ホエルオー': {
    japanese: 'ホエルオー',
    romaji: 'hoeruo-',
    pronunciation: 'ho-e-ru-o-',
    meaning: 'Float Whale Pokémon'
  },
  'ドンメル': {
    japanese: 'ドンメル',
    romaji: 'donmeru',
    pronunciation: 'do-nme-ru',
    meaning: 'Numb Pokémon'
  },
  'バクーダ': {
    japanese: 'バクーダ',
    romaji: 'baku-da',
    pronunciation: 'ba-ku--da',
    meaning: 'Eruption Pokémon'
  },
  'コータス': {
    japanese: 'コータス',
    romaji: 'ko-tasu',
    pronunciation: 'ko--ta-su',
    meaning: 'Coal Pokémon'
  },
  'バネブー': {
    japanese: 'バネブー',
    romaji: 'banebu-',
    pronunciation: 'ba-ne-bu-',
    meaning: 'Bounce Pokémon'
  },
  'ブーピッグ': {
    japanese: 'ブーピッグ',
    romaji: 'bu-pitsugu',
    pronunciation: 'bu--pi-tsu-gu',
    meaning: 'Manipulate Pokémon'
  },
  'パッチール': {
    japanese: 'パッチール',
    romaji: 'patsuchi-ru',
    pronunciation: 'pa-tsu-chi--ru',
    meaning: 'Spot Panda Pokémon'
  },
  'ナックラー': {
    japanese: 'ナックラー',
    romaji: 'natsukura-',
    pronunciation: 'na-tsu-ku-ra-',
    meaning: 'Ant Pit Pokémon'
  },
  'ビブラーバ': {
    japanese: 'ビブラーバ',
    romaji: 'bibura-ba',
    pronunciation: 'bi-bu-ra--ba',
    meaning: 'Vibration Pokémon'
  },
  'フライゴン': {
    japanese: 'フライゴン',
    romaji: 'furaigon',
    pronunciation: 'fu-ra-i-go-n',
    meaning: 'Mystic Pokémon'
  },
  'サボネア': {
    japanese: 'サボネア',
    romaji: 'sabonea',
    pronunciation: 'sa-bo-ne-a',
    meaning: 'Cactus Pokémon'
  },
  'ノクタス': {
    japanese: 'ノクタス',
    romaji: 'nokutasu',
    pronunciation: 'no-ku-ta-su',
    meaning: 'Scarecrow Pokémon'
  },
  'チルット': {
    japanese: 'チルット',
    romaji: 'chirutsuto',
    pronunciation: 'chi-ru-tsu-to',
    meaning: 'Cotton Bird Pokémon'
  },
  'チルタリス': {
    japanese: 'チルタリス',
    romaji: 'chirutarisu',
    pronunciation: 'chi-ru-ta-ri-su',
    meaning: 'Humming Pokémon'
  },
  'ザングース': {
    japanese: 'ザングース',
    romaji: 'zangu-su',
    pronunciation: 'za-ngu--su',
    meaning: 'Cat Ferret Pokémon'
  },
  'ハブネーク': {
    japanese: 'ハブネーク',
    romaji: 'habune-ku',
    pronunciation: 'ha-bu-ne--ku',
    meaning: 'Fang Snake Pokémon'
  },
  'ルナトーン': {
    japanese: 'ルナトーン',
    romaji: 'runato-n',
    pronunciation: 'ru-na-to--n',
    meaning: 'Meteorite Pokémon'
  },
  'ソルロック': {
    japanese: 'ソルロック',
    romaji: 'sorurotsuku',
    pronunciation: 'so-ru-ro-tsu-ku',
    meaning: 'Meteorite Pokémon'
  },
  'ドジョッチ': {
    japanese: 'ドジョッチ',
    romaji: 'dojotsuchi',
    pronunciation: 'do-jo-tsu-chi',
    meaning: 'Whiskers Pokémon'
  },
  'ナマズン': {
    japanese: 'ナマズン',
    romaji: 'namazun',
    pronunciation: 'na-ma-zu-n',
    meaning: 'Whiskers Pokémon'
  },
  'ヘイガニ': {
    japanese: 'ヘイガニ',
    romaji: 'heigani',
    pronunciation: 'he-i-ga-ni',
    meaning: 'Ruffian Pokémon'
  },
  'シザリガー': {
    japanese: 'シザリガー',
    romaji: 'shizariga-',
    pronunciation: 'shi-za-ri-ga-',
    meaning: 'Rogue Pokémon'
  },
  'ヤジロン': {
    japanese: 'ヤジロン',
    romaji: 'yajiron',
    pronunciation: 'ya-ji-ro-n',
    meaning: 'Clay Doll Pokémon'
  },
  'ネンドール': {
    japanese: 'ネンドール',
    romaji: 'nendo-ru',
    pronunciation: 'ne-ndo--ru',
    meaning: 'Clay Doll Pokémon'
  },
  'リリーラ': {
    japanese: 'リリーラ',
    romaji: 'riri-ra',
    pronunciation: 'ri-ri--ra',
    meaning: 'Sea Lily Pokémon'
  },
  'ユレイドル': {
    japanese: 'ユレイドル',
    romaji: 'yureidoru',
    pronunciation: 'yu-re-i-do-ru',
    meaning: 'Barnacle Pokémon'
  },
  'アノプス': {
    japanese: 'アノプス',
    romaji: 'anopusu',
    pronunciation: 'a-no-pu-su',
    meaning: 'Old Shrimp Pokémon'
  },
  'アーマルド': {
    japanese: 'アーマルド',
    romaji: 'a-marudo',
    pronunciation: 'a--ma-ru-do',
    meaning: 'Plate Pokémon'
  },
  'ヒンバス': {
    japanese: 'ヒンバス',
    romaji: 'hinbasu',
    pronunciation: 'hi-nba-su',
    meaning: 'Fish Pokémon'
  },
  'ミロカロス': {
    japanese: 'ミロカロス',
    romaji: 'mirokarosu',
    pronunciation: 'mi-ro-ka-ro-su',
    meaning: 'Tender Pokémon'
  },
  'ポワルン': {
    japanese: 'ポワルン',
    romaji: 'powarun',
    pronunciation: 'po-wa-ru-n',
    meaning: 'Weather Pokémon'
  },
  'カクレオン': {
    japanese: 'カクレオン',
    romaji: 'kakureon',
    pronunciation: 'ka-ku-re-o-n',
    meaning: 'Color Swap Pokémon'
  },
  'カゲボウズ': {
    japanese: 'カゲボウズ',
    romaji: 'kagebouzu',
    pronunciation: 'ka-ge-bo-u-zu',
    meaning: 'Puppet Pokémon'
  },
  'ジュペッタ': {
    japanese: 'ジュペッタ',
    romaji: 'jupetsuta',
    pronunciation: 'ju-pe-tsu-ta',
    meaning: 'Marionette Pokémon'
  },
  'ヨマワル': {
    japanese: 'ヨマワル',
    romaji: 'yomawaru',
    pronunciation: 'yo-ma-wa-ru',
    meaning: 'Requiem Pokémon'
  },
  'サマヨール': {
    japanese: 'サマヨール',
    romaji: 'samayo-ru',
    pronunciation: 'sa-ma-yo--ru',
    meaning: 'Beckon Pokémon'
  },
  'トロピウス': {
    japanese: 'トロピウス',
    romaji: 'toropiusu',
    pronunciation: 'to-ro-pi-u-su',
    meaning: 'Fruit Pokémon'
  },
  'チリーン': {
    japanese: 'チリーン',
    romaji: 'chiri-n',
    pronunciation: 'chi-ri--n',
    meaning: 'Wind Chime Pokémon'
  },
  'アブソル': {
    japanese: 'アブソル',
    romaji: 'abusoru',
    pronunciation: 'a-bu-so-ru',
    meaning: 'Disaster Pokémon'
  },
  'ソーナノ': {
    japanese: 'ソーナノ',
    romaji: 'so-nano',
    pronunciation: 'so--na-no',
    meaning: 'Bright Pokémon'
  },
  'ユキワラシ': {
    japanese: 'ユキワラシ',
    romaji: 'yukiwarashi',
    pronunciation: 'yu-ki-wa-ra-shi',
    meaning: 'Snow Hat Pokémon'
  },
  'オニゴーリ': {
    japanese: 'オニゴーリ',
    romaji: 'onigo-ri',
    pronunciation: 'o-ni-go--ri',
    meaning: 'Face Pokémon'
  },
  'タマザラシ': {
    japanese: 'タマザラシ',
    romaji: 'tamazarashi',
    pronunciation: 'ta-ma-za-ra-shi',
    meaning: 'Clap Pokémon'
  },
  'トドグラー': {
    japanese: 'トドグラー',
    romaji: 'todogura-',
    pronunciation: 'to-do-gu-ra-',
    meaning: 'Ball Roll Pokémon'
  },
  'トドゼルガ': {
    japanese: 'トドゼルガ',
    romaji: 'todozeruga',
    pronunciation: 'to-do-ze-ru-ga',
    meaning: 'Ice Break Pokémon'
  },
  'パールル': {
    japanese: 'パールル',
    romaji: 'pa-ruru',
    pronunciation: 'pa--ru-ru',
    meaning: 'Bivalve Pokémon'
  },
  'ハンテール': {
    japanese: 'ハンテール',
    romaji: 'hante-ru',
    pronunciation: 'ha-nte--ru',
    meaning: 'Deep Sea Pokémon'
  },
  'サクラビス': {
    japanese: 'サクラビス',
    romaji: 'sakurabisu',
    pronunciation: 'sa-ku-ra-bi-su',
    meaning: 'South Sea Pokémon'
  },
  'ジーランス': {
    japanese: 'ジーランス',
    romaji: 'ji-ransu',
    pronunciation: 'ji--ra-nsu',
    meaning: 'Longevity Pokémon'
  },
  'ラブカス': {
    japanese: 'ラブカス',
    romaji: 'rabukasu',
    pronunciation: 'ra-bu-ka-su',
    meaning: 'Rendezvous Pokémon'
  },
  'タツベイ': {
    japanese: 'タツベイ',
    romaji: 'tatsubei',
    pronunciation: 'ta-tsu-be-i',
    meaning: 'Rock Head Pokémon'
  },
  'コモルー': {
    japanese: 'コモルー',
    romaji: 'komoru-',
    pronunciation: 'ko-mo-ru-',
    meaning: 'Endurance Pokémon'
  },
  'ボーマンダ': {
    japanese: 'ボーマンダ',
    romaji: 'bo-manda',
    pronunciation: 'bo--ma-nda',
    meaning: 'Dragon Pokémon'
  },
  'ダンバル': {
    japanese: 'ダンバル',
    romaji: 'danbaru',
    pronunciation: 'da-nba-ru',
    meaning: 'Iron Ball Pokémon'
  },
  'メタング': {
    japanese: 'メタング',
    romaji: 'metangu',
    pronunciation: 'me-ta-ngu',
    meaning: 'Iron Claw Pokémon'
  },
  'メタグロス': {
    japanese: 'メタグロス',
    romaji: 'metagurosu',
    pronunciation: 'me-ta-gu-ro-su',
    meaning: 'Iron Leg Pokémon'
  },
  'レジロック': {
    japanese: 'レジロック',
    romaji: 'rejirotsuku',
    pronunciation: 're-ji-ro-tsu-ku',
    meaning: 'Rock Peak Pokémon'
  },
  'レジアイス': {
    japanese: 'レジアイス',
    romaji: 'rejiaisu',
    pronunciation: 're-ji-a-i-su',
    meaning: 'Iceberg Pokémon'
  },
  'レジスチル': {
    japanese: 'レジスチル',
    romaji: 'rejisuchiru',
    pronunciation: 're-ji-su-chi-ru',
    meaning: 'Iron Pokémon'
  },
  'ラティアス': {
    japanese: 'ラティアス',
    romaji: 'rateiasu',
    pronunciation: 'ra-te-i-a-su',
    meaning: 'Eon Pokémon'
  },
  'ラティオス': {
    japanese: 'ラティオス',
    romaji: 'rateiosu',
    pronunciation: 'ra-te-i-o-su',
    meaning: 'Eon Pokémon'
  },
  'カイオーガ': {
    japanese: 'カイオーガ',
    romaji: 'kaio-ga',
    pronunciation: 'ka-i-o--ga',
    meaning: 'Sea Basin Pokémon'
  },
  'グラードン': {
    japanese: 'グラードン',
    romaji: 'gura-don',
    pronunciation: 'gu-ra--do-n',
    meaning: 'Continent Pokémon'
  },
  'レックウザ': {
    japanese: 'レックウザ',
    romaji: 'retsukuuza',
    pronunciation: 're-tsu-ku-u-za',
    meaning: 'Sky High Pokémon'
  },
  'ジラーチ': {
    japanese: 'ジラーチ',
    romaji: 'jira-chi',
    pronunciation: 'ji-ra--chi',
    meaning: 'Wish Pokémon'
  },
  'デオキシス': {
    japanese: 'デオキシス',
    romaji: 'deokishisu',
    pronunciation: 'de-o-ki-shi-su',
    meaning: 'DNA Pokémon'
  },
  'ナエトル': {
    japanese: 'ナエトル',
    romaji: 'naetoru',
    pronunciation: 'na-e-to-ru',
    meaning: 'Tiny Leaf Pokémon'
  },
  'ハヤシガメ': {
    japanese: 'ハヤシガメ',
    romaji: 'hayashigame',
    pronunciation: 'ha-ya-shi-ga-me',
    meaning: 'Grove Pokémon'
  },
  'ドダイトス': {
    japanese: 'ドダイトス',
    romaji: 'dodaitosu',
    pronunciation: 'do-da-i-to-su',
    meaning: 'Continent Pokémon'
  },
  'ヒコザル': {
    japanese: 'ヒコザル',
    romaji: 'hikozaru',
    pronunciation: 'hi-ko-za-ru',
    meaning: 'Chimp Pokémon'
  },
  'モウカザル': {
    japanese: 'モウカザル',
    romaji: 'moukazaru',
    pronunciation: 'mo-u-ka-za-ru',
    meaning: 'Playful Pokémon'
  },
  'ゴウカザル': {
    japanese: 'ゴウカザル',
    romaji: 'goukazaru',
    pronunciation: 'go-u-ka-za-ru',
    meaning: 'Flame Pokémon'
  },
  'ポッチャマ': {
    japanese: 'ポッチャマ',
    romaji: 'potsuchama',
    pronunciation: 'po-tsu-cha-ma',
    meaning: 'Penguin Pokémon'
  },
  'ポッタイシ': {
    japanese: 'ポッタイシ',
    romaji: 'potsutaishi',
    pronunciation: 'po-tsu-ta-i-shi',
    meaning: 'Penguin Pokémon'
  },
  'エンペルト': {
    japanese: 'エンペルト',
    romaji: 'enperuto',
    pronunciation: 'e-npe-ru-to',
    meaning: 'Emperor Pokémon'
  },
  'ムックル': {
    japanese: 'ムックル',
    romaji: 'mutsukuru',
    pronunciation: 'mu-tsu-ku-ru',
    meaning: 'Starling Pokémon'
  },
  'ムクバード': {
    japanese: 'ムクバード',
    romaji: 'mukuba-do',
    pronunciation: 'mu-ku-ba--do',
    meaning: 'Starling Pokémon'
  },
  'ムクホーク': {
    japanese: 'ムクホーク',
    romaji: 'mukuho-ku',
    pronunciation: 'mu-ku-ho--ku',
    meaning: 'Predator Pokémon'
  },
  'ビッパ': {
    japanese: 'ビッパ',
    romaji: 'bitsupa',
    pronunciation: 'bi-tsu-pa',
    meaning: 'Plump Mouse Pokémon'
  },
  'ビーダル': {
    japanese: 'ビーダル',
    romaji: 'bi-daru',
    pronunciation: 'bi--da-ru',
    meaning: 'Beaver Pokémon'
  },
  'コロボーシ': {
    japanese: 'コロボーシ',
    romaji: 'korobo-shi',
    pronunciation: 'ko-ro-bo--shi',
    meaning: 'Cricket Pokémon'
  },
  'コロトック': {
    japanese: 'コロトック',
    romaji: 'korototsuku',
    pronunciation: 'ko-ro-to-tsu-ku',
    meaning: 'Cricket Pokémon'
  },
  'コリンク': {
    japanese: 'コリンク',
    romaji: 'korinku',
    pronunciation: 'ko-ri-nku',
    meaning: 'Flash Pokémon'
  },
  'ルクシオ': {
    japanese: 'ルクシオ',
    romaji: 'rukushio',
    pronunciation: 'ru-ku-shi-o',
    meaning: 'Spark Pokémon'
  },
  'レントラー': {
    japanese: 'レントラー',
    romaji: 'rentora-',
    pronunciation: 're-nto-ra-',
    meaning: 'Gleam Eyes Pokémon'
  },
  'スボミー': {
    japanese: 'スボミー',
    romaji: 'subomi-',
    pronunciation: 'su-bo-mi-',
    meaning: 'Bud Pokémon'
  },
  'ロズレイド': {
    japanese: 'ロズレイド',
    romaji: 'rozureido',
    pronunciation: 'ro-zu-re-i-do',
    meaning: 'Bouquet Pokémon'
  },
  'ズガイドス': {
    japanese: 'ズガイドス',
    romaji: 'zugaidosu',
    pronunciation: 'zu-ga-i-do-su',
    meaning: 'Head Butt Pokémon'
  },
  'ラムパルド': {
    japanese: 'ラムパルド',
    romaji: 'ramuparudo',
    pronunciation: 'ra-mu-pa-ru-do',
    meaning: 'Head Butt Pokémon'
  },
  'タテトプス': {
    japanese: 'タテトプス',
    romaji: 'tatetopusu',
    pronunciation: 'ta-te-to-pu-su',
    meaning: 'Shield Pokémon'
  },
  'トリデプス': {
    japanese: 'トリデプス',
    romaji: 'toridepusu',
    pronunciation: 'to-ri-de-pu-su',
    meaning: 'Shield Pokémon'
  },
  'ミノムッチ': {
    japanese: 'ミノムッチ',
    romaji: 'minomutsuchi',
    pronunciation: 'mi-no-mu-tsu-chi',
    meaning: 'Bagworm Pokémon'
  },
  'ミノマダム': {
    japanese: 'ミノマダム',
    romaji: 'minomadamu',
    pronunciation: 'mi-no-ma-da-mu',
    meaning: 'Bagworm Pokémon'
  },
  'ガーメイル': {
    japanese: 'ガーメイル',
    romaji: 'ga-meiru',
    pronunciation: 'ga--me-i-ru',
    meaning: 'Moth Pokémon'
  },
  'ミツハニー': {
    japanese: 'ミツハニー',
    romaji: 'mitsuhani-',
    pronunciation: 'mi-tsu-ha-ni-',
    meaning: 'Tiny Bee Pokémon'
  },
  'ビークイン': {
    japanese: 'ビークイン',
    romaji: 'bi-kuin',
    pronunciation: 'bi--ku-i-n',
    meaning: 'Beehive Pokémon'
  },
  'パチリス': {
    japanese: 'パチリス',
    romaji: 'pachirisu',
    pronunciation: 'pa-chi-ri-su',
    meaning: 'EleSquirrel Pokémon'
  },
  'ブイゼル': {
    japanese: 'ブイゼル',
    romaji: 'buizeru',
    pronunciation: 'bu-i-ze-ru',
    meaning: 'Sea Weasel Pokémon'
  },
  'フローゼル': {
    japanese: 'フローゼル',
    romaji: 'furo-zeru',
    pronunciation: 'fu-ro--ze-ru',
    meaning: 'Sea Weasel Pokémon'
  },
  'チェリンボ': {
    japanese: 'チェリンボ',
    romaji: 'chierinbo',
    pronunciation: 'chi-e-ri-nbo',
    meaning: 'Cherry Pokémon'
  },
  'チェリム': {
    japanese: 'チェリム',
    romaji: 'chierimu',
    pronunciation: 'chi-e-ri-mu',
    meaning: 'Blossom Pokémon'
  },
  'カラナクシ': {
    japanese: 'カラナクシ',
    romaji: 'karanakushi',
    pronunciation: 'ka-ra-na-ku-shi',
    meaning: 'Sea Slug Pokémon'
  },
  'トリトドン': {
    japanese: 'トリトドン',
    romaji: 'toritodon',
    pronunciation: 'to-ri-to-do-n',
    meaning: 'Sea Slug Pokémon'
  },
  'エテボース': {
    japanese: 'エテボース',
    romaji: 'etebo-su',
    pronunciation: 'e-te-bo--su',
    meaning: 'Long Tail Pokémon'
  },
  'フワンテ': {
    japanese: 'フワンテ',
    romaji: 'fuwante',
    pronunciation: 'fu-wa-nte',
    meaning: 'Balloon Pokémon'
  },
  'フワライド': {
    japanese: 'フワライド',
    romaji: 'fuwaraido',
    pronunciation: 'fu-wa-ra-i-do',
    meaning: 'Blimp Pokémon'
  },
  'ミミロル': {
    japanese: 'ミミロル',
    romaji: 'mimiroru',
    pronunciation: 'mi-mi-ro-ru',
    meaning: 'Rabbit Pokémon'
  },
  'ミミロップ': {
    japanese: 'ミミロップ',
    romaji: 'mimirotsupu',
    pronunciation: 'mi-mi-ro-tsu-pu',
    meaning: 'Rabbit Pokémon'
  },
  'ムウマージ': {
    japanese: 'ムウマージ',
    romaji: 'muuma-ji',
    pronunciation: 'mu-u-ma--ji',
    meaning: 'Magical Pokémon'
  },
  'ドンカラス': {
    japanese: 'ドンカラス',
    romaji: 'donkarasu',
    pronunciation: 'do-nka-ra-su',
    meaning: 'Big Boss Pokémon'
  },
  'ニャルマー': {
    japanese: 'ニャルマー',
    romaji: 'nyaruma-',
    pronunciation: 'nya-ru-ma-',
    meaning: 'Catty Pokémon'
  },
  'ブニャット': {
    japanese: 'ブニャット',
    romaji: 'bunyatsuto',
    pronunciation: 'bu-nya-tsu-to',
    meaning: 'Tiger Cat Pokémon'
  },
  'リーシャン': {
    japanese: 'リーシャン',
    romaji: 'ri-shan',
    pronunciation: 'ri--sha-n',
    meaning: 'Bell Pokémon'
  },
  'スカンプー': {
    japanese: 'スカンプー',
    romaji: 'sukanpu-',
    pronunciation: 'su-ka-npu-',
    meaning: 'Skunk Pokémon'
  },
  'スカタンク': {
    japanese: 'スカタンク',
    romaji: 'sukatanku',
    pronunciation: 'su-ka-ta-nku',
    meaning: 'Skunk Pokémon'
  },
  'ドーミラー': {
    japanese: 'ドーミラー',
    romaji: 'do-mira-',
    pronunciation: 'do--mi-ra-',
    meaning: 'Bronze Pokémon'
  },
  'ドータクン': {
    japanese: 'ドータクン',
    romaji: 'do-takun',
    pronunciation: 'do--ta-ku-n',
    meaning: 'Bronze Bell Pokémon'
  },
  'ウソハチ': {
    japanese: 'ウソハチ',
    romaji: 'usohachi',
    pronunciation: 'u-so-ha-chi',
    meaning: 'Bonsai Pokémon'
  },
  'マネネ': {
    japanese: 'マネネ',
    romaji: 'manene',
    pronunciation: 'ma-ne-ne',
    meaning: 'Mime Pokémon'
  },
  'ピンプク': {
    japanese: 'ピンプク',
    romaji: 'pinpuku',
    pronunciation: 'pi-npu-ku',
    meaning: 'Playhouse Pokémon'
  },
  'ペラップ': {
    japanese: 'ペラップ',
    romaji: 'peratsupu',
    pronunciation: 'pe-ra-tsu-pu',
    meaning: 'Music Note Pokémon'
  },
  'ミカルゲ': {
    japanese: 'ミカルゲ',
    romaji: 'mikaruge',
    pronunciation: 'mi-ka-ru-ge',
    meaning: 'Forbidden Pokémon'
  },
  'フカマル': {
    japanese: 'フカマル',
    romaji: 'fukamaru',
    pronunciation: 'fu-ka-ma-ru',
    meaning: 'Land Shark Pokémon'
  },
  'ガバイト': {
    japanese: 'ガバイト',
    romaji: 'gabaito',
    pronunciation: 'ga-ba-i-to',
    meaning: 'Cave Pokémon'
  },
  'ガブリアス': {
    japanese: 'ガブリアス',
    romaji: 'gaburiasu',
    pronunciation: 'ga-bu-ri-a-su',
    meaning: 'Mach Pokémon'
  },
  'ゴンベ': {
    japanese: 'ゴンベ',
    romaji: 'gonbe',
    pronunciation: 'go-nbe',
    meaning: 'Big Eater Pokémon'
  },
  'リオル': {
    japanese: 'リオル',
    romaji: 'rioru',
    pronunciation: 'ri-o-ru',
    meaning: 'Emanation Pokémon'
  },
  'ルカリオ': {
    japanese: 'ルカリオ',
    romaji: 'rukario',
    pronunciation: 'ru-ka-ri-o',
    meaning: 'Aura Pokémon'
  },
  'ヒポポタス': {
    japanese: 'ヒポポタス',
    romaji: 'hipopotasu',
    pronunciation: 'hi-po-po-ta-su',
    meaning: 'Hippo Pokémon'
  },
  'カバルドン': {
    japanese: 'カバルドン',
    romaji: 'kabarudon',
    pronunciation: 'ka-ba-ru-do-n',
    meaning: 'Heavyweight Pokémon'
  },
  'スコルピ': {
    japanese: 'スコルピ',
    romaji: 'sukorupi',
    pronunciation: 'su-ko-ru-pi',
    meaning: 'Scorpion Pokémon'
  },
  'ドラピオン': {
    japanese: 'ドラピオン',
    romaji: 'dorapion',
    pronunciation: 'do-ra-pi-o-n',
    meaning: 'Ogre Scorpion Pokémon'
  },
  'グレッグル': {
    japanese: 'グレッグル',
    romaji: 'guretsuguru',
    pronunciation: 'gu-re-tsu-gu-ru',
    meaning: 'Toxic Mouth Pokémon'
  },
  'ドクロッグ': {
    japanese: 'ドクロッグ',
    romaji: 'dokurotsugu',
    pronunciation: 'do-ku-ro-tsu-gu',
    meaning: 'Toxic Mouth Pokémon'
  },
  'マスキッパ': {
    japanese: 'マスキッパ',
    romaji: 'masukitsupa',
    pronunciation: 'ma-su-ki-tsu-pa',
    meaning: 'Bug Catcher Pokémon'
  },
  'ケイコウオ': {
    japanese: 'ケイコウオ',
    romaji: 'keikouo',
    pronunciation: 'ke-i-ko-u-o',
    meaning: 'Wing Fish Pokémon'
  },
  'ネオラント': {
    japanese: 'ネオラント',
    romaji: 'neoranto',
    pronunciation: 'ne-o-ra-nto',
    meaning: 'Neon Pokémon'
  },
  'タマンタ': {
    japanese: 'タマンタ',
    romaji: 'tamanta',
    pronunciation: 'ta-ma-nta',
    meaning: 'Kite Pokémon'
  },
  'ユキカブリ': {
    japanese: 'ユキカブリ',
    romaji: 'yukikaburi',
    pronunciation: 'yu-ki-ka-bu-ri',
    meaning: 'Frost Tree Pokémon'
  },
  'ユキノオー': {
    japanese: 'ユキノオー',
    romaji: 'yukinoo-',
    pronunciation: 'yu-ki-no-o-',
    meaning: 'Frost Tree Pokémon'
  },
  'マニューラ': {
    japanese: 'マニューラ',
    romaji: 'manyu-ra',
    pronunciation: 'ma-nyu--ra',
    meaning: 'Sharp Claw Pokémon'
  },
  'ジバコイル': {
    japanese: 'ジバコイル',
    romaji: 'jibakoiru',
    pronunciation: 'ji-ba-ko-i-ru',
    meaning: 'Magnet Area Pokémon'
  },
  'ベロベルト': {
    japanese: 'ベロベルト',
    romaji: 'beroberuto',
    pronunciation: 'be-ro-be-ru-to',
    meaning: 'Licking Pokémon'
  },
  'ドサイドン': {
    japanese: 'ドサイドン',
    romaji: 'dosaidon',
    pronunciation: 'do-sa-i-do-n',
    meaning: 'Drill Pokémon'
  },
  'モジャンボ': {
    japanese: 'モジャンボ',
    romaji: 'mojanbo',
    pronunciation: 'mo-ja-nbo',
    meaning: 'Vine Pokémon'
  },
  'エレキブル': {
    japanese: 'エレキブル',
    romaji: 'erekiburu',
    pronunciation: 'e-re-ki-bu-ru',
    meaning: 'Thunderbolt Pokémon'
  },
  'ブーバーン': {
    japanese: 'ブーバーン',
    romaji: 'bu-ba-n',
    pronunciation: 'bu--ba--n',
    meaning: 'Blast Pokémon'
  },
  'トゲキッス': {
    japanese: 'トゲキッス',
    romaji: 'togekitsusu',
    pronunciation: 'to-ge-ki-tsu-su',
    meaning: 'Jubilee Pokémon'
  },
  'メガヤンマ': {
    japanese: 'メガヤンマ',
    romaji: 'megayanma',
    pronunciation: 'me-ga-ya-nma',
    meaning: 'Ogre Darner Pokémon'
  },
  'リーフィア': {
    japanese: 'リーフィア',
    romaji: 'ri-fuia',
    pronunciation: 'ri--fu-i-a',
    meaning: 'Verdant Pokémon'
  },
  'グレイシア': {
    japanese: 'グレイシア',
    romaji: 'gureishia',
    pronunciation: 'gu-re-i-shi-a',
    meaning: 'Fresh Snow Pokémon'
  },
  'グライオン': {
    japanese: 'グライオン',
    romaji: 'guraion',
    pronunciation: 'gu-ra-i-o-n',
    meaning: 'Fang Scorpion Pokémon'
  },
  'マンムー': {
    japanese: 'マンムー',
    romaji: 'manmu-',
    pronunciation: 'ma-nmu-',
    meaning: 'Twin Tusk Pokémon'
  },
  'ポリゴンＺ': {
    japanese: 'ポリゴンＺ',
    romaji: 'porigonＺ',
    pronunciation: 'po-ri-go-nｚ',
    meaning: 'Virtual Pokémon'
  },
  'エルレイド': {
    japanese: 'エルレイド',
    romaji: 'erureido',
    pronunciation: 'e-ru-re-i-do',
    meaning: 'Blade Pokémon'
  },
  'ダイノーズ': {
    japanese: 'ダイノーズ',
    romaji: 'daino-zu',
    pronunciation: 'da-i-no--zu',
    meaning: 'Compass Pokémon'
  },
  'ヨノワール': {
    japanese: 'ヨノワール',
    romaji: 'yonowa-ru',
    pronunciation: 'yo-no-wa--ru',
    meaning: 'Gripper Pokémon'
  },
  'ユキメノコ': {
    japanese: 'ユキメノコ',
    romaji: 'yukimenoko',
    pronunciation: 'yu-ki-me-no-ko',
    meaning: 'Snow Land Pokémon'
  },
  'ロトム': {
    japanese: 'ロトム',
    romaji: 'rotomu',
    pronunciation: 'ro-to-mu',
    meaning: 'Plasma Pokémon'
  },
  'ユクシー': {
    japanese: 'ユクシー',
    romaji: 'yukushi-',
    pronunciation: 'yu-ku-shi-',
    meaning: 'Knowledge Pokémon'
  },
  'エムリット': {
    japanese: 'エムリット',
    romaji: 'emuritsuto',
    pronunciation: 'e-mu-ri-tsu-to',
    meaning: 'Emotion Pokémon'
  },
  'アグノム': {
    japanese: 'アグノム',
    romaji: 'agunomu',
    pronunciation: 'a-gu-no-mu',
    meaning: 'Willpower Pokémon'
  },
  'ディアルガ': {
    japanese: 'ディアルガ',
    romaji: 'deiaruga',
    pronunciation: 'de-i-a-ru-ga',
    meaning: 'Temporal Pokémon'
  },
  'パルキア': {
    japanese: 'パルキア',
    romaji: 'parukia',
    pronunciation: 'pa-ru-ki-a',
    meaning: 'Spatial Pokémon'
  },
  'ヒードラン': {
    japanese: 'ヒードラン',
    romaji: 'hi-doran',
    pronunciation: 'hi--do-ra-n',
    meaning: 'Lava Dome Pokémon'
  },
  'レジギガス': {
    japanese: 'レジギガス',
    romaji: 'rejigigasu',
    pronunciation: 're-ji-gi-ga-su',
    meaning: 'Colossal Pokémon'
  },
  'ギラティナ': {
    japanese: 'ギラティナ',
    romaji: 'girateina',
    pronunciation: 'gi-ra-te-i-na',
    meaning: 'Renegade Pokémon'
  },
  'クレセリア': {
    japanese: 'クレセリア',
    romaji: 'kureseria',
    pronunciation: 'ku-re-se-ri-a',
    meaning: 'Lunar Pokémon'
  },
  'フィオネ': {
    japanese: 'フィオネ',
    romaji: 'fuione',
    pronunciation: 'fu-i-o-ne',
    meaning: 'Sea Drifter Pokémon'
  },
  'マナフィ': {
    japanese: 'マナフィ',
    romaji: 'manafui',
    pronunciation: 'ma-na-fu-i',
    meaning: 'Seafaring Pokémon'
  },
  'ダークライ': {
    japanese: 'ダークライ',
    romaji: 'da-kurai',
    pronunciation: 'da--ku-ra-i',
    meaning: 'Pitch-Black Pokémon'
  },
  'シェイミ': {
    japanese: 'シェイミ',
    romaji: 'shieimi',
    pronunciation: 'shi-e-i-mi',
    meaning: 'Gratitude Pokémon'
  },
  'アルセウス': {
    japanese: 'アルセウス',
    romaji: 'aruseusu',
    pronunciation: 'a-ru-se-u-su',
    meaning: 'Alpha Pokémon'
  },
  'ビクティニ': {
    japanese: 'ビクティニ',
    romaji: 'bikuteini',
    pronunciation: 'bi-ku-te-i-ni',
    meaning: 'Victory Pokémon'
  },
  'ツタージャ': {
    japanese: 'ツタージャ',
    romaji: 'tsuta-ja',
    pronunciation: 'tsu-ta--ja',
    meaning: 'Grass Snake Pokémon'
  },
  'ジャノビー': {
    japanese: 'ジャノビー',
    romaji: 'janobi-',
    pronunciation: 'ja-no-bi-',
    meaning: 'Grass Snake Pokémon'
  },
  'ジャローダ': {
    japanese: 'ジャローダ',
    romaji: 'jaro-da',
    pronunciation: 'ja-ro--da',
    meaning: 'Regal Pokémon'
  },
  'ポカブ': {
    japanese: 'ポカブ',
    romaji: 'pokabu',
    pronunciation: 'po-ka-bu',
    meaning: 'Fire Pig Pokémon'
  },
  'チャオブー': {
    japanese: 'チャオブー',
    romaji: 'chaobu-',
    pronunciation: 'cha-o-bu-',
    meaning: 'Fire Pig Pokémon'
  },
  'エンブオー': {
    japanese: 'エンブオー',
    romaji: 'enbuo-',
    pronunciation: 'e-nbu-o-',
    meaning: 'Mega Fire Pig Pokémon'
  },
  'ミジュマル': {
    japanese: 'ミジュマル',
    romaji: 'mijumaru',
    pronunciation: 'mi-ju-ma-ru',
    meaning: 'Sea Otter Pokémon'
  },
  'フタチマル': {
    japanese: 'フタチマル',
    romaji: 'futachimaru',
    pronunciation: 'fu-ta-chi-ma-ru',
    meaning: 'Discipline Pokémon'
  },
  'ダイケンキ': {
    japanese: 'ダイケンキ',
    romaji: 'daikenki',
    pronunciation: 'da-i-ke-nki',
    meaning: 'Formidable Pokémon'
  },
  'ミネズミ': {
    japanese: 'ミネズミ',
    romaji: 'minezumi',
    pronunciation: 'mi-ne-zu-mi',
    meaning: 'Scout Pokémon'
  },
  'ミルホッグ': {
    japanese: 'ミルホッグ',
    romaji: 'miruhotsugu',
    pronunciation: 'mi-ru-ho-tsu-gu',
    meaning: 'Lookout Pokémon'
  },
  'ヨーテリー': {
    japanese: 'ヨーテリー',
    romaji: 'yo-teri-',
    pronunciation: 'yo--te-ri-',
    meaning: 'Puppy Pokémon'
  },
  'ハーデリア': {
    japanese: 'ハーデリア',
    romaji: 'ha-deria',
    pronunciation: 'ha--de-ri-a',
    meaning: 'Loyal Dog Pokémon'
  },
  'ムーランド': {
    japanese: 'ムーランド',
    romaji: 'mu-rando',
    pronunciation: 'mu--ra-ndo',
    meaning: 'Big-Hearted Pokémon'
  },
  'チョロネコ': {
    japanese: 'チョロネコ',
    romaji: 'choroneko',
    pronunciation: 'cho-ro-ne-ko',
    meaning: 'Devious Pokémon'
  },
  'レパルダス': {
    japanese: 'レパルダス',
    romaji: 'reparudasu',
    pronunciation: 're-pa-ru-da-su',
    meaning: 'Cruel Pokémon'
  },
  'ヤナップ': {
    japanese: 'ヤナップ',
    romaji: 'yanatsupu',
    pronunciation: 'ya-na-tsu-pu',
    meaning: 'Grass Monkey Pokémon'
  },
  'ヤナッキー': {
    japanese: 'ヤナッキー',
    romaji: 'yanatsuki-',
    pronunciation: 'ya-na-tsu-ki-',
    meaning: 'Thorn Monkey Pokémon'
  },
  'バオップ': {
    japanese: 'バオップ',
    romaji: 'baotsupu',
    pronunciation: 'ba-o-tsu-pu',
    meaning: 'High Temp Pokémon'
  },
  'バオッキー': {
    japanese: 'バオッキー',
    romaji: 'baotsuki-',
    pronunciation: 'ba-o-tsu-ki-',
    meaning: 'Ember Pokémon'
  },
  'ヒヤップ': {
    japanese: 'ヒヤップ',
    romaji: 'hiyatsupu',
    pronunciation: 'hi-ya-tsu-pu',
    meaning: 'Spray Pokémon'
  },
  'ヒヤッキー': {
    japanese: 'ヒヤッキー',
    romaji: 'hiyatsuki-',
    pronunciation: 'hi-ya-tsu-ki-',
    meaning: 'Geyser Pokémon'
  },
  'ムンナ': {
    japanese: 'ムンナ',
    romaji: 'munna',
    pronunciation: 'mu-nna',
    meaning: 'Dream Eater Pokémon'
  },
  'ムシャーナ': {
    japanese: 'ムシャーナ',
    romaji: 'musha-na',
    pronunciation: 'mu-sha--na',
    meaning: 'Drowsing Pokémon'
  },
  'マメパト': {
    japanese: 'マメパト',
    romaji: 'mamepato',
    pronunciation: 'ma-me-pa-to',
    meaning: 'Tiny Pigeon Pokémon'
  },
  'ハトーボー': {
    japanese: 'ハトーボー',
    romaji: 'hato-bo-',
    pronunciation: 'ha-to--bo-',
    meaning: 'Wild Pigeon Pokémon'
  },
  'ケンホロウ': {
    japanese: 'ケンホロウ',
    romaji: 'kenhorou',
    pronunciation: 'ke-nho-ro-u',
    meaning: 'Proud Pokémon'
  },
  'シママ': {
    japanese: 'シママ',
    romaji: 'shimama',
    pronunciation: 'shi-ma-ma',
    meaning: 'Electrified Pokémon'
  },
  'ゼブライカ': {
    japanese: 'ゼブライカ',
    romaji: 'zeburaika',
    pronunciation: 'ze-bu-ra-i-ka',
    meaning: 'Thunderbolt Pokémon'
  },
  'ダンゴロ': {
    japanese: 'ダンゴロ',
    romaji: 'dangoro',
    pronunciation: 'da-ngo-ro',
    meaning: 'Mantle Pokémon'
  },
  'ガントル': {
    japanese: 'ガントル',
    romaji: 'gantoru',
    pronunciation: 'ga-nto-ru',
    meaning: 'Ore Pokémon'
  },
  'ギガイアス': {
    japanese: 'ギガイアス',
    romaji: 'gigaiasu',
    pronunciation: 'gi-ga-i-a-su',
    meaning: 'Compressed Pokémon'
  },
  'コロモリ': {
    japanese: 'コロモリ',
    romaji: 'koromori',
    pronunciation: 'ko-ro-mo-ri',
    meaning: 'Bat Pokémon'
  },
  'ココロモリ': {
    japanese: 'ココロモリ',
    romaji: 'kokoromori',
    pronunciation: 'ko-ko-ro-mo-ri',
    meaning: 'Courting Pokémon'
  },
  'モグリュー': {
    japanese: 'モグリュー',
    romaji: 'moguryu-',
    pronunciation: 'mo-gu-ryu-',
    meaning: 'Mole Pokémon'
  },
  'ドリュウズ': {
    japanese: 'ドリュウズ',
    romaji: 'doryuuzu',
    pronunciation: 'do-ryu-u-zu',
    meaning: 'Subterrene Pokémon'
  },
  'タブンネ': {
    japanese: 'タブンネ',
    romaji: 'tabunne',
    pronunciation: 'ta-bu-nne',
    meaning: 'Hearing Pokémon'
  },
  'ドッコラー': {
    japanese: 'ドッコラー',
    romaji: 'dotsukora-',
    pronunciation: 'do-tsu-ko-ra-',
    meaning: 'Muscular Pokémon'
  },
  'ドテッコツ': {
    japanese: 'ドテッコツ',
    romaji: 'dotetsukotsu',
    pronunciation: 'do-te-tsu-ko-tsu',
    meaning: 'Muscular Pokémon'
  },
  'ローブシン': {
    japanese: 'ローブシン',
    romaji: 'ro-bushin',
    pronunciation: 'ro--bu-shi-n',
    meaning: 'Muscular Pokémon'
  },
  'オタマロ': {
    japanese: 'オタマロ',
    romaji: 'otamaro',
    pronunciation: 'o-ta-ma-ro',
    meaning: 'Tadpole Pokémon'
  },
  'ガマガル': {
    japanese: 'ガマガル',
    romaji: 'gamagaru',
    pronunciation: 'ga-ma-ga-ru',
    meaning: 'Vibration Pokémon'
  },
  'ガマゲロゲ': {
    japanese: 'ガマゲロゲ',
    romaji: 'gamageroge',
    pronunciation: 'ga-ma-ge-ro-ge',
    meaning: 'Vibration Pokémon'
  },
  'ナゲキ': {
    japanese: 'ナゲキ',
    romaji: 'nageki',
    pronunciation: 'na-ge-ki',
    meaning: 'Judo Pokémon'
  },
  'ダゲキ': {
    japanese: 'ダゲキ',
    romaji: 'dageki',
    pronunciation: 'da-ge-ki',
    meaning: 'Karate Pokémon'
  },
  'クルミル': {
    japanese: 'クルミル',
    romaji: 'kurumiru',
    pronunciation: 'ku-ru-mi-ru',
    meaning: 'Sewing Pokémon'
  },
  'クルマユ': {
    japanese: 'クルマユ',
    romaji: 'kurumayu',
    pronunciation: 'ku-ru-ma-yu',
    meaning: 'Leaf-Wrapped Pokémon'
  },
  'ハハコモリ': {
    japanese: 'ハハコモリ',
    romaji: 'hahakomori',
    pronunciation: 'ha-ha-ko-mo-ri',
    meaning: 'Nurturing Pokémon'
  },
  'フシデ': {
    japanese: 'フシデ',
    romaji: 'fushide',
    pronunciation: 'fu-shi-de',
    meaning: 'Centipede Pokémon'
  },
  'ホイーガ': {
    japanese: 'ホイーガ',
    romaji: 'hoi-ga',
    pronunciation: 'ho-i--ga',
    meaning: 'Curlipede Pokémon'
  },
  'ペンドラー': {
    japanese: 'ペンドラー',
    romaji: 'pendora-',
    pronunciation: 'pe-ndo-ra-',
    meaning: 'Megapede Pokémon'
  },
  'モンメン': {
    japanese: 'モンメン',
    romaji: 'monmen',
    pronunciation: 'mo-nme-n',
    meaning: 'Cotton Puff Pokémon'
  },
  'エルフーン': {
    japanese: 'エルフーン',
    romaji: 'erufu-n',
    pronunciation: 'e-ru-fu--n',
    meaning: 'Windveiled Pokémon'
  },
  'チュリネ': {
    japanese: 'チュリネ',
    romaji: 'churine',
    pronunciation: 'chu-ri-ne',
    meaning: 'Bulb Pokémon'
  },
  'ドレディア': {
    japanese: 'ドレディア',
    romaji: 'doredeia',
    pronunciation: 'do-re-de-i-a',
    meaning: 'Flowering Pokémon'
  },
  'バスラオ': {
    japanese: 'バスラオ',
    romaji: 'basurao',
    pronunciation: 'ba-su-ra-o',
    meaning: 'Hostile Pokémon'
  },
  'メグロコ': {
    japanese: 'メグロコ',
    romaji: 'meguroko',
    pronunciation: 'me-gu-ro-ko',
    meaning: 'Desert Croc Pokémon'
  },
  'ワルビル': {
    japanese: 'ワルビル',
    romaji: 'warubiru',
    pronunciation: 'wa-ru-bi-ru',
    meaning: 'Desert Croc Pokémon'
  },
  'ワルビアル': {
    japanese: 'ワルビアル',
    romaji: 'warubiaru',
    pronunciation: 'wa-ru-bi-a-ru',
    meaning: 'Intimidation Pokémon'
  },
  'ダルマッカ': {
    japanese: 'ダルマッカ',
    romaji: 'darumatsuka',
    pronunciation: 'da-ru-ma-tsu-ka',
    meaning: 'Zen Charm Pokémon'
  },
  'ヒヒダルマ': {
    japanese: 'ヒヒダルマ',
    romaji: 'hihidaruma',
    pronunciation: 'hi-hi-da-ru-ma',
    meaning: 'Blazing Pokémon'
  },
  'マラカッチ': {
    japanese: 'マラカッチ',
    romaji: 'marakatsuchi',
    pronunciation: 'ma-ra-ka-tsu-chi',
    meaning: 'Cactus Pokémon'
  },
  'イシズマイ': {
    japanese: 'イシズマイ',
    romaji: 'ishizumai',
    pronunciation: 'i-shi-zu-ma-i',
    meaning: 'Rock Inn Pokémon'
  },
  'イワパレス': {
    japanese: 'イワパレス',
    romaji: 'iwaparesu',
    pronunciation: 'i-wa-pa-re-su',
    meaning: 'Stone Home Pokémon'
  },
  'ズルッグ': {
    japanese: 'ズルッグ',
    romaji: 'zurutsugu',
    pronunciation: 'zu-ru-tsu-gu',
    meaning: 'Shedding Pokémon'
  },
  'ズルズキン': {
    japanese: 'ズルズキン',
    romaji: 'zuruzukin',
    pronunciation: 'zu-ru-zu-ki-n',
    meaning: 'Hoodlum Pokémon'
  },
  'シンボラー': {
    japanese: 'シンボラー',
    romaji: 'shinbora-',
    pronunciation: 'shi-nbo-ra-',
    meaning: 'Avianoid Pokémon'
  },
  'デスマス': {
    japanese: 'デスマス',
    romaji: 'desumasu',
    pronunciation: 'de-su-ma-su',
    meaning: 'Spirit Pokémon'
  },
  'デスカーン': {
    japanese: 'デスカーン',
    romaji: 'desuka-n',
    pronunciation: 'de-su-ka--n',
    meaning: 'Coffin Pokémon'
  },
  'プロトーガ': {
    japanese: 'プロトーガ',
    romaji: 'puroto-ga',
    pronunciation: 'pu-ro-to--ga',
    meaning: 'Prototurtle Pokémon'
  },
  'アバゴーラ': {
    japanese: 'アバゴーラ',
    romaji: 'abago-ra',
    pronunciation: 'a-ba-go--ra',
    meaning: 'Prototurtle Pokémon'
  },
  'アーケン': {
    japanese: 'アーケン',
    romaji: 'a-ken',
    pronunciation: 'a--ke-n',
    meaning: 'First Bird Pokémon'
  },
  'アーケオス': {
    japanese: 'アーケオス',
    romaji: 'a-keosu',
    pronunciation: 'a--ke-o-su',
    meaning: 'First Bird Pokémon'
  },
  'ヤブクロン': {
    japanese: 'ヤブクロン',
    romaji: 'yabukuron',
    pronunciation: 'ya-bu-ku-ro-n',
    meaning: 'Trash Bag Pokémon'
  },
  'ダストダス': {
    japanese: 'ダストダス',
    romaji: 'dasutodasu',
    pronunciation: 'da-su-to-da-su',
    meaning: 'Trash Heap Pokémon'
  },
  'ゾロア': {
    japanese: 'ゾロア',
    romaji: 'zoroa',
    pronunciation: 'zo-ro-a',
    meaning: 'Tricky Fox Pokémon'
  },
  'ゾロアーク': {
    japanese: 'ゾロアーク',
    romaji: 'zoroa-ku',
    pronunciation: 'zo-ro-a--ku',
    meaning: 'Illusion Fox Pokémon'
  },
  'チラーミィ': {
    japanese: 'チラーミィ',
    romaji: 'chira-mii',
    pronunciation: 'chi-ra--mi-i',
    meaning: 'Chinchilla Pokémon'
  },
  'チラチーノ': {
    japanese: 'チラチーノ',
    romaji: 'chirachi-no',
    pronunciation: 'chi-ra-chi--no',
    meaning: 'Scarf Pokémon'
  },
  'ゴチム': {
    japanese: 'ゴチム',
    romaji: 'gochimu',
    pronunciation: 'go-chi-mu',
    meaning: 'Fixation Pokémon'
  },
  'ゴチミル': {
    japanese: 'ゴチミル',
    romaji: 'gochimiru',
    pronunciation: 'go-chi-mi-ru',
    meaning: 'Manipulate Pokémon'
  },
  'ゴチルゼル': {
    japanese: 'ゴチルゼル',
    romaji: 'gochiruzeru',
    pronunciation: 'go-chi-ru-ze-ru',
    meaning: 'Astral Body Pokémon'
  },
  'ユニラン': {
    japanese: 'ユニラン',
    romaji: 'yuniran',
    pronunciation: 'yu-ni-ra-n',
    meaning: 'Cell Pokémon'
  },
  'ダブラン': {
    japanese: 'ダブラン',
    romaji: 'daburan',
    pronunciation: 'da-bu-ra-n',
    meaning: 'Mitosis Pokémon'
  },
  'ランクルス': {
    japanese: 'ランクルス',
    romaji: 'rankurusu',
    pronunciation: 'ra-nku-ru-su',
    meaning: 'Multiplying Pokémon'
  },
  'コアルヒー': {
    japanese: 'コアルヒー',
    romaji: 'koaruhi-',
    pronunciation: 'ko-a-ru-hi-',
    meaning: 'Water Bird Pokémon'
  },
  'スワンナ': {
    japanese: 'スワンナ',
    romaji: 'suwanna',
    pronunciation: 'su-wa-nna',
    meaning: 'White Bird Pokémon'
  },
  'バニプッチ': {
    japanese: 'バニプッチ',
    romaji: 'baniputsuchi',
    pronunciation: 'ba-ni-pu-tsu-chi',
    meaning: 'Fresh Snow Pokémon'
  },
  'バニリッチ': {
    japanese: 'バニリッチ',
    romaji: 'baniritsuchi',
    pronunciation: 'ba-ni-ri-tsu-chi',
    meaning: 'Icy Snow Pokémon'
  },
  'バイバニラ': {
    japanese: 'バイバニラ',
    romaji: 'baibanira',
    pronunciation: 'ba-i-ba-ni-ra',
    meaning: 'Snowstorm Pokémon'
  },
  'シキジカ': {
    japanese: 'シキジカ',
    romaji: 'shikijika',
    pronunciation: 'shi-ki-ji-ka',
    meaning: 'Season Pokémon'
  },
  'メブキジカ': {
    japanese: 'メブキジカ',
    romaji: 'mebukijika',
    pronunciation: 'me-bu-ki-ji-ka',
    meaning: 'Season Pokémon'
  },
  'エモンガ': {
    japanese: 'エモンガ',
    romaji: 'emonga',
    pronunciation: 'e-mo-nga',
    meaning: 'Sky Squirrel Pokémon'
  },
  'カブルモ': {
    japanese: 'カブルモ',
    romaji: 'kaburumo',
    pronunciation: 'ka-bu-ru-mo',
    meaning: 'Clamping Pokémon'
  },
  'シュバルゴ': {
    japanese: 'シュバルゴ',
    romaji: 'shubarugo',
    pronunciation: 'shu-ba-ru-go',
    meaning: 'Cavalry Pokémon'
  },
  'タマゲタケ': {
    japanese: 'タマゲタケ',
    romaji: 'tamagetake',
    pronunciation: 'ta-ma-ge-ta-ke',
    meaning: 'Mushroom Pokémon'
  },
  'モロバレル': {
    japanese: 'モロバレル',
    romaji: 'morobareru',
    pronunciation: 'mo-ro-ba-re-ru',
    meaning: 'Mushroom Pokémon'
  },
  'プルリル': {
    japanese: 'プルリル',
    romaji: 'pururiru',
    pronunciation: 'pu-ru-ri-ru',
    meaning: 'Floating Pokémon'
  },
  'ブルンゲル': {
    japanese: 'ブルンゲル',
    romaji: 'burungeru',
    pronunciation: 'bu-ru-nge-ru',
    meaning: 'Floating Pokémon'
  },
  'ママンボウ': {
    japanese: 'ママンボウ',
    romaji: 'mamanbou',
    pronunciation: 'ma-ma-nbo-u',
    meaning: 'Caring Pokémon'
  },
  'バチュル': {
    japanese: 'バチュル',
    romaji: 'bachuru',
    pronunciation: 'ba-chu-ru',
    meaning: 'Attaching Pokémon'
  },
  'デンチュラ': {
    japanese: 'デンチュラ',
    romaji: 'denchura',
    pronunciation: 'de-nchu-ra',
    meaning: 'EleSpider Pokémon'
  },
  'テッシード': {
    japanese: 'テッシード',
    romaji: 'tetsushi-do',
    pronunciation: 'te-tsu-shi--do',
    meaning: 'Thorn Seed Pokémon'
  },
  'ナットレイ': {
    japanese: 'ナットレイ',
    romaji: 'natsutorei',
    pronunciation: 'na-tsu-to-re-i',
    meaning: 'Thorn Pod Pokémon'
  },
  'ギアル': {
    japanese: 'ギアル',
    romaji: 'giaru',
    pronunciation: 'gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'ギギアル': {
    japanese: 'ギギアル',
    romaji: 'gigiaru',
    pronunciation: 'gi-gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'ギギギアル': {
    japanese: 'ギギギアル',
    romaji: 'gigigiaru',
    pronunciation: 'gi-gi-gi-a-ru',
    meaning: 'Gear Pokémon'
  },
  'シビシラス': {
    japanese: 'シビシラス',
    romaji: 'shibishirasu',
    pronunciation: 'shi-bi-shi-ra-su',
    meaning: 'EleFish Pokémon'
  },
  'シビビール': {
    japanese: 'シビビール',
    romaji: 'shibibi-ru',
    pronunciation: 'shi-bi-bi--ru',
    meaning: 'EleFish Pokémon'
  },
  'シビルドン': {
    japanese: 'シビルドン',
    romaji: 'shibirudon',
    pronunciation: 'shi-bi-ru-do-n',
    meaning: 'EleFish Pokémon'
  },
  'リグレー': {
    japanese: 'リグレー',
    romaji: 'rigure-',
    pronunciation: 'ri-gu-re-',
    meaning: 'Cerebral Pokémon'
  },
  'オーベム': {
    japanese: 'オーベム',
    romaji: 'o-bemu',
    pronunciation: 'o--be-mu',
    meaning: 'Cerebral Pokémon'
  },
  'ヒトモシ': {
    japanese: 'ヒトモシ',
    romaji: 'hitomoshi',
    pronunciation: 'hi-to-mo-shi',
    meaning: 'Candle Pokémon'
  },
  'ランプラー': {
    japanese: 'ランプラー',
    romaji: 'ranpura-',
    pronunciation: 'ra-npu-ra-',
    meaning: 'Lamp Pokémon'
  },
  'シャンデラ': {
    japanese: 'シャンデラ',
    romaji: 'shandera',
    pronunciation: 'sha-nde-ra',
    meaning: 'Luring Pokémon'
  },
  'キバゴ': {
    japanese: 'キバゴ',
    romaji: 'kibago',
    pronunciation: 'ki-ba-go',
    meaning: 'Tusk Pokémon'
  },
  'オノンド': {
    japanese: 'オノンド',
    romaji: 'onondo',
    pronunciation: 'o-no-ndo',
    meaning: 'Axe Jaw Pokémon'
  },
  'オノノクス': {
    japanese: 'オノノクス',
    romaji: 'ononokusu',
    pronunciation: 'o-no-no-ku-su',
    meaning: 'Axe Jaw Pokémon'
  },
  'クマシュン': {
    japanese: 'クマシュン',
    romaji: 'kumashun',
    pronunciation: 'ku-ma-shu-n',
    meaning: 'Chill Pokémon'
  },
  'ツンベアー': {
    japanese: 'ツンベアー',
    romaji: 'tsunbea-',
    pronunciation: 'tsu-nbe-a-',
    meaning: 'Freezing Pokémon'
  },
  'フリージオ': {
    japanese: 'フリージオ',
    romaji: 'furi-jio',
    pronunciation: 'fu-ri--ji-o',
    meaning: 'Crystallizing Pokémon'
  },
  'チョボマキ': {
    japanese: 'チョボマキ',
    romaji: 'chobomaki',
    pronunciation: 'cho-bo-ma-ki',
    meaning: 'Snail Pokémon'
  },
  'アギルダー': {
    japanese: 'アギルダー',
    romaji: 'agiruda-',
    pronunciation: 'a-gi-ru-da-',
    meaning: 'Shell Out Pokémon'
  },
  'マッギョ': {
    japanese: 'マッギョ',
    romaji: 'matsugyo',
    pronunciation: 'ma-tsu-gyo',
    meaning: 'Trap Pokémon'
  },
  'コジョフー': {
    japanese: 'コジョフー',
    romaji: 'kojofu-',
    pronunciation: 'ko-jo-fu-',
    meaning: 'Martial Arts Pokémon'
  },
  'コジョンド': {
    japanese: 'コジョンド',
    romaji: 'kojondo',
    pronunciation: 'ko-jo-ndo',
    meaning: 'Martial Arts Pokémon'
  },
  'クリムガン': {
    japanese: 'クリムガン',
    romaji: 'kurimugan',
    pronunciation: 'ku-ri-mu-ga-n',
    meaning: 'Cave Pokémon'
  },
  'ゴビット': {
    japanese: 'ゴビット',
    romaji: 'gobitsuto',
    pronunciation: 'go-bi-tsu-to',
    meaning: 'Automaton Pokémon'
  },
  'ゴルーグ': {
    japanese: 'ゴルーグ',
    romaji: 'goru-gu',
    pronunciation: 'go-ru--gu',
    meaning: 'Automaton Pokémon'
  },
  'コマタナ': {
    japanese: 'コマタナ',
    romaji: 'komatana',
    pronunciation: 'ko-ma-ta-na',
    meaning: 'Sharp Blade Pokémon'
  },
  'キリキザン': {
    japanese: 'キリキザン',
    romaji: 'kirikizan',
    pronunciation: 'ki-ri-ki-za-n',
    meaning: 'Sword Blade Pokémon'
  },
  'バッフロン': {
    japanese: 'バッフロン',
    romaji: 'batsufuron',
    pronunciation: 'ba-tsu-fu-ro-n',
    meaning: 'Bash Buffalo Pokémon'
  },
  'ワシボン': {
    japanese: 'ワシボン',
    romaji: 'washibon',
    pronunciation: 'wa-shi-bo-n',
    meaning: 'Eaglet Pokémon'
  },
  'ウォーグル': {
    japanese: 'ウォーグル',
    romaji: 'uo-guru',
    pronunciation: 'u-o--gu-ru',
    meaning: 'Valiant Pokémon'
  },
  'バルチャイ': {
    japanese: 'バルチャイ',
    romaji: 'baruchai',
    pronunciation: 'ba-ru-cha-i',
    meaning: 'Diapered Pokémon'
  },
  'バルジーナ': {
    japanese: 'バルジーナ',
    romaji: 'baruji-na',
    pronunciation: 'ba-ru-ji--na',
    meaning: 'Bone Vulture Pokémon'
  },
  'クイタラン': {
    japanese: 'クイタラン',
    romaji: 'kuitaran',
    pronunciation: 'ku-i-ta-ra-n',
    meaning: 'Anteater Pokémon'
  },
  'アイアント': {
    japanese: 'アイアント',
    romaji: 'aianto',
    pronunciation: 'a-i-a-nto',
    meaning: 'Iron Ant Pokémon'
  },
  'モノズ': {
    japanese: 'モノズ',
    romaji: 'monozu',
    pronunciation: 'mo-no-zu',
    meaning: 'Irate Pokémon'
  },
  'ジヘッド': {
    japanese: 'ジヘッド',
    romaji: 'jihetsudo',
    pronunciation: 'ji-he-tsu-do',
    meaning: 'Hostile Pokémon'
  },
  'サザンドラ': {
    japanese: 'サザンドラ',
    romaji: 'sazandora',
    pronunciation: 'sa-za-ndo-ra',
    meaning: 'Brutal Pokémon'
  },
  'メラルバ': {
    japanese: 'メラルバ',
    romaji: 'meraruba',
    pronunciation: 'me-ra-ru-ba',
    meaning: 'Torch Pokémon'
  },
  'ウルガモス': {
    japanese: 'ウルガモス',
    romaji: 'urugamosu',
    pronunciation: 'u-ru-ga-mo-su',
    meaning: 'Sun Pokémon'
  },
  'コバルオン': {
    japanese: 'コバルオン',
    romaji: 'kobaruon',
    pronunciation: 'ko-ba-ru-o-n',
    meaning: 'Iron Will Pokémon'
  },
  'テラキオン': {
    japanese: 'テラキオン',
    romaji: 'terakion',
    pronunciation: 'te-ra-ki-o-n',
    meaning: 'Cavern Pokémon'
  },
  'ビリジオン': {
    japanese: 'ビリジオン',
    romaji: 'birijion',
    pronunciation: 'bi-ri-ji-o-n',
    meaning: 'Grassland Pokémon'
  },
  'トルネロス': {
    japanese: 'トルネロス',
    romaji: 'torunerosu',
    pronunciation: 'to-ru-ne-ro-su',
    meaning: 'Cyclone Pokémon'
  },
  'ボルトロス': {
    japanese: 'ボルトロス',
    romaji: 'borutorosu',
    pronunciation: 'bo-ru-to-ro-su',
    meaning: 'Bolt Strike Pokémon'
  },
  'レシラム': {
    japanese: 'レシラム',
    romaji: 'reshiramu',
    pronunciation: 're-shi-ra-mu',
    meaning: 'Vast White Pokémon'
  },
  'ゼクロム': {
    japanese: 'ゼクロム',
    romaji: 'zekuromu',
    pronunciation: 'ze-ku-ro-mu',
    meaning: 'Deep Black Pokémon'
  },
  'ランドロス': {
    japanese: 'ランドロス',
    romaji: 'randorosu',
    pronunciation: 'ra-ndo-ro-su',
    meaning: 'Abundance Pokémon'
  },
  'キュレム': {
    japanese: 'キュレム',
    romaji: 'kyuremu',
    pronunciation: 'kyu-re-mu',
    meaning: 'Boundary Pokémon'
  },
  'ケルディオ': {
    japanese: 'ケルディオ',
    romaji: 'kerudeio',
    pronunciation: 'ke-ru-de-i-o',
    meaning: 'Colt Pokémon'
  },
  'メロエッタ': {
    japanese: 'メロエッタ',
    romaji: 'meroetsuta',
    pronunciation: 'me-ro-e-tsu-ta',
    meaning: 'Melody Pokémon'
  },
  'ゲノセクト': {
    japanese: 'ゲノセクト',
    romaji: 'genosekuto',
    pronunciation: 'ge-no-se-ku-to',
    meaning: 'Paleozoic Pokémon'
  },
  'ハリマロン': {
    japanese: 'ハリマロン',
    romaji: 'harimaron',
    pronunciation: 'ha-ri-ma-ro-n',
    meaning: 'Spiny Nut Pokémon'
  },
  'ハリボーグ': {
    japanese: 'ハリボーグ',
    romaji: 'haribo-gu',
    pronunciation: 'ha-ri-bo--gu',
    meaning: 'Spiny Armor Pokémon'
  },
  'ブリガロン': {
    japanese: 'ブリガロン',
    romaji: 'burigaron',
    pronunciation: 'bu-ri-ga-ro-n',
    meaning: 'Spiny Armor Pokémon'
  },
  'フォッコ': {
    japanese: 'フォッコ',
    romaji: 'fuotsuko',
    pronunciation: 'fu-o-tsu-ko',
    meaning: 'Fox Pokémon'
  },
  'テールナー': {
    japanese: 'テールナー',
    romaji: 'te-runa-',
    pronunciation: 'te--ru-na-',
    meaning: 'Fox Pokémon'
  },
  'マフォクシー': {
    japanese: 'マフォクシー',
    romaji: 'mafuokushi-',
    pronunciation: 'ma-fu-o-ku-shi-',
    meaning: 'Fox Pokémon'
  },
  'ケロマツ': {
    japanese: 'ケロマツ',
    romaji: 'keromatsu',
    pronunciation: 'ke-ro-ma-tsu',
    meaning: 'Bubble Frog Pokémon'
  },
  'ゲコガシラ': {
    japanese: 'ゲコガシラ',
    romaji: 'gekogashira',
    pronunciation: 'ge-ko-ga-shi-ra',
    meaning: 'Bubble Frog Pokémon'
  },
  'ゲッコウガ': {
    japanese: 'ゲッコウガ',
    romaji: 'getsukouga',
    pronunciation: 'ge-tsu-ko-u-ga',
    meaning: 'Ninja Pokémon'
  },
  'ホルビー': {
    japanese: 'ホルビー',
    romaji: 'horubi-',
    pronunciation: 'ho-ru-bi-',
    meaning: 'Digging Pokémon'
  },
  'ホルード': {
    japanese: 'ホルード',
    romaji: 'horu-do',
    pronunciation: 'ho-ru--do',
    meaning: 'Digging Pokémon'
  },
  'ヤヤコマ': {
    japanese: 'ヤヤコマ',
    romaji: 'yayakoma',
    pronunciation: 'ya-ya-ko-ma',
    meaning: 'Tiny Robin Pokémon'
  },
  'ヒノヤコマ': {
    japanese: 'ヒノヤコマ',
    romaji: 'hinoyakoma',
    pronunciation: 'hi-no-ya-ko-ma',
    meaning: 'Ember Pokémon'
  },
  'ファイアロー': {
    japanese: 'ファイアロー',
    romaji: 'fuaiaro-',
    pronunciation: 'fu-a-i-a-ro-',
    meaning: 'Scorching Pokémon'
  },
  'コフキムシ': {
    japanese: 'コフキムシ',
    romaji: 'kofukimushi',
    pronunciation: 'ko-fu-ki-mu-shi',
    meaning: 'Scatterdust Pokémon'
  },
  'コフーライ': {
    japanese: 'コフーライ',
    romaji: 'kofu-rai',
    pronunciation: 'ko-fu--ra-i',
    meaning: 'Scatterdust Pokémon'
  },
  'ビビヨン': {
    japanese: 'ビビヨン',
    romaji: 'bibiyon',
    pronunciation: 'bi-bi-yo-n',
    meaning: 'Scale Pokémon'
  },
  'シシコ': {
    japanese: 'シシコ',
    romaji: 'shishiko',
    pronunciation: 'shi-shi-ko',
    meaning: 'Lion Cub Pokémon'
  },
  'カエンジシ': {
    japanese: 'カエンジシ',
    romaji: 'kaenjishi',
    pronunciation: 'ka-e-nji-shi',
    meaning: 'Royal Pokémon'
  },
  'フラベベ': {
    japanese: 'フラベベ',
    romaji: 'furabebe',
    pronunciation: 'fu-ra-be-be',
    meaning: 'Single Bloom Pokémon'
  },
  'フラエッテ': {
    japanese: 'フラエッテ',
    romaji: 'furaetsute',
    pronunciation: 'fu-ra-e-tsu-te',
    meaning: 'Single Bloom Pokémon'
  },
  'フラージェス': {
    japanese: 'フラージェス',
    romaji: 'fura-jiesu',
    pronunciation: 'fu-ra--ji-e-su',
    meaning: 'Garden Pokémon'
  },
  'メェークル': {
    japanese: 'メェークル',
    romaji: 'mee-kuru',
    pronunciation: 'me-e--ku-ru',
    meaning: 'Mount Pokémon'
  },
  'ゴーゴート': {
    japanese: 'ゴーゴート',
    romaji: 'go-go-to',
    pronunciation: 'go--go--to',
    meaning: 'Mount Pokémon'
  },
  'ヤンチャム': {
    japanese: 'ヤンチャム',
    romaji: 'yanchamu',
    pronunciation: 'ya-ncha-mu',
    meaning: 'Playful Pokémon'
  },
  'ゴロンダ': {
    japanese: 'ゴロンダ',
    romaji: 'goronda',
    pronunciation: 'go-ro-nda',
    meaning: 'Daunting Pokémon'
  },
  'トリミアン': {
    japanese: 'トリミアン',
    romaji: 'torimian',
    pronunciation: 'to-ri-mi-a-n',
    meaning: 'Poodle Pokémon'
  },
  'ニャスパー': {
    japanese: 'ニャスパー',
    romaji: 'nyasupa-',
    pronunciation: 'nya-su-pa-',
    meaning: 'Restraint Pokémon'
  },
  'ニャオニクス': {
    japanese: 'ニャオニクス',
    romaji: 'nyaonikusu',
    pronunciation: 'nya-o-ni-ku-su',
    meaning: 'Constraint Pokémon'
  },
  'ヒトツキ': {
    japanese: 'ヒトツキ',
    romaji: 'hitotsuki',
    pronunciation: 'hi-to-tsu-ki',
    meaning: 'Sword Pokémon'
  },
  'ニダンギル': {
    japanese: 'ニダンギル',
    romaji: 'nidangiru',
    pronunciation: 'ni-da-ngi-ru',
    meaning: 'Sword Pokémon'
  },
  'ギルガルド': {
    japanese: 'ギルガルド',
    romaji: 'girugarudo',
    pronunciation: 'gi-ru-ga-ru-do',
    meaning: 'Royal Sword Pokémon'
  },
  'シュシュプ': {
    japanese: 'シュシュプ',
    romaji: 'shushupu',
    pronunciation: 'shu-shu-pu',
    meaning: 'Perfume Pokémon'
  },
  'フレフワン': {
    japanese: 'フレフワン',
    romaji: 'furefuwan',
    pronunciation: 'fu-re-fu-wa-n',
    meaning: 'Fragrance Pokémon'
  },
  'ペロッパフ': {
    japanese: 'ペロッパフ',
    romaji: 'perotsupafu',
    pronunciation: 'pe-ro-tsu-pa-fu',
    meaning: 'Cotton Candy Pokémon'
  },
  'ペロリーム': {
    japanese: 'ペロリーム',
    romaji: 'perori-mu',
    pronunciation: 'pe-ro-ri--mu',
    meaning: 'Meringue Pokémon'
  },
  'マーイーカ': {
    japanese: 'マーイーカ',
    romaji: 'ma-i-ka',
    pronunciation: 'ma--i--ka',
    meaning: 'Revolving Pokémon'
  },
  'カラマネロ': {
    japanese: 'カラマネロ',
    romaji: 'karamanero',
    pronunciation: 'ka-ra-ma-ne-ro',
    meaning: 'Overturning Pokémon'
  },
  'カメテテ': {
    japanese: 'カメテテ',
    romaji: 'kametete',
    pronunciation: 'ka-me-te-te',
    meaning: 'Two-Handed Pokémon'
  },
  'ガメノデス': {
    japanese: 'ガメノデス',
    romaji: 'gamenodesu',
    pronunciation: 'ga-me-no-de-su',
    meaning: 'Collective Pokémon'
  },
  'クズモー': {
    japanese: 'クズモー',
    romaji: 'kuzumo-',
    pronunciation: 'ku-zu-mo-',
    meaning: 'Mock Kelp Pokémon'
  },
  'ドラミドロ': {
    japanese: 'ドラミドロ',
    romaji: 'doramidoro',
    pronunciation: 'do-ra-mi-do-ro',
    meaning: 'Mock Kelp Pokémon'
  },
  'ウデッポウ': {
    japanese: 'ウデッポウ',
    romaji: 'udetsupou',
    pronunciation: 'u-de-tsu-po-u',
    meaning: 'Water Gun Pokémon'
  },
  'ブロスター': {
    japanese: 'ブロスター',
    romaji: 'burosuta-',
    pronunciation: 'bu-ro-su-ta-',
    meaning: 'Howitzer Pokémon'
  },
  'エリキテル': {
    japanese: 'エリキテル',
    romaji: 'erikiteru',
    pronunciation: 'e-ri-ki-te-ru',
    meaning: 'Generator Pokémon'
  },
  'エレザード': {
    japanese: 'エレザード',
    romaji: 'ereza-do',
    pronunciation: 'e-re-za--do',
    meaning: 'Generator Pokémon'
  },
  'チゴラス': {
    japanese: 'チゴラス',
    romaji: 'chigorasu',
    pronunciation: 'chi-go-ra-su',
    meaning: 'Royal Heir Pokémon'
  },
  'ガチゴラス': {
    japanese: 'ガチゴラス',
    romaji: 'gachigorasu',
    pronunciation: 'ga-chi-go-ra-su',
    meaning: 'Despot Pokémon'
  },
  'アマルス': {
    japanese: 'アマルス',
    romaji: 'amarusu',
    pronunciation: 'a-ma-ru-su',
    meaning: 'Tundra Pokémon'
  },
  'アマルルガ': {
    japanese: 'アマルルガ',
    romaji: 'amaruruga',
    pronunciation: 'a-ma-ru-ru-ga',
    meaning: 'Tundra Pokémon'
  },
  'ニンフィア': {
    japanese: 'ニンフィア',
    romaji: 'ninfuia',
    pronunciation: 'ni-nfu-i-a',
    meaning: 'Intertwining Pokémon'
  },
  'ルチャブル': {
    japanese: 'ルチャブル',
    romaji: 'ruchaburu',
    pronunciation: 'ru-cha-bu-ru',
    meaning: 'Wrestling Pokémon'
  },
  'デデンネ': {
    japanese: 'デデンネ',
    romaji: 'dedenne',
    pronunciation: 'de-de-nne',
    meaning: 'Antenna Pokémon'
  },
  'メレシー': {
    japanese: 'メレシー',
    romaji: 'mereshi-',
    pronunciation: 'me-re-shi-',
    meaning: 'Jewel Pokémon'
  },
  'ヌメラ': {
    japanese: 'ヌメラ',
    romaji: 'numera',
    pronunciation: 'nu-me-ra',
    meaning: 'Soft Tissue Pokémon'
  },
  'ヌメイル': {
    japanese: 'ヌメイル',
    romaji: 'numeiru',
    pronunciation: 'nu-me-i-ru',
    meaning: 'Soft Tissue Pokémon'
  },
  'ヌメルゴン': {
    japanese: 'ヌメルゴン',
    romaji: 'numerugon',
    pronunciation: 'nu-me-ru-go-n',
    meaning: 'Dragon Pokémon'
  },
  'クレッフィ': {
    japanese: 'クレッフィ',
    romaji: 'kuretsufui',
    pronunciation: 'ku-re-tsu-fu-i',
    meaning: 'Key Ring Pokémon'
  },
  'ボクレー': {
    japanese: 'ボクレー',
    romaji: 'bokure-',
    pronunciation: 'bo-ku-re-',
    meaning: 'Stump Pokémon'
  },
  'オーロット': {
    japanese: 'オーロット',
    romaji: 'o-rotsuto',
    pronunciation: 'o--ro-tsu-to',
    meaning: 'Elder Tree Pokémon'
  },
  'バケッチャ': {
    japanese: 'バケッチャ',
    romaji: 'baketsucha',
    pronunciation: 'ba-ke-tsu-cha',
    meaning: 'Pumpkin Pokémon'
  },
  'パンプジン': {
    japanese: 'パンプジン',
    romaji: 'panpujin',
    pronunciation: 'pa-npu-ji-n',
    meaning: 'Pumpkin Pokémon'
  },
  'カチコール': {
    japanese: 'カチコール',
    romaji: 'kachiko-ru',
    pronunciation: 'ka-chi-ko--ru',
    meaning: 'Ice Chunk Pokémon'
  },
  'クレベース': {
    japanese: 'クレベース',
    romaji: 'kurebe-su',
    pronunciation: 'ku-re-be--su',
    meaning: 'Iceberg Pokémon'
  },
  'オンバット': {
    japanese: 'オンバット',
    romaji: 'onbatsuto',
    pronunciation: 'o-nba-tsu-to',
    meaning: 'Sound Wave Pokémon'
  },
  'オンバーン': {
    japanese: 'オンバーン',
    romaji: 'onba-n',
    pronunciation: 'o-nba--n',
    meaning: 'Sound Wave Pokémon'
  },
  'ゼルネアス': {
    japanese: 'ゼルネアス',
    romaji: 'zeruneasu',
    pronunciation: 'ze-ru-ne-a-su',
    meaning: 'Life Pokémon'
  },
  'イベルタル': {
    japanese: 'イベルタル',
    romaji: 'iberutaru',
    pronunciation: 'i-be-ru-ta-ru',
    meaning: 'Destruction Pokémon'
  },
  'ジガルデ': {
    japanese: 'ジガルデ',
    romaji: 'jigarude',
    pronunciation: 'ji-ga-ru-de',
    meaning: 'Order Pokémon'
  },
  'ディアンシー': {
    japanese: 'ディアンシー',
    romaji: 'deianshi-',
    pronunciation: 'de-i-a-nshi-',
    meaning: 'Jewel Pokémon'
  },
  'フーパ': {
    japanese: 'フーパ',
    romaji: 'fu-pa',
    pronunciation: 'fu--pa',
    meaning: 'Mischief Pokémon'
  },
  'ボルケニオン': {
    japanese: 'ボルケニオン',
    romaji: 'borukenion',
    pronunciation: 'bo-ru-ke-ni-o-n',
    meaning: 'Steam Pokémon'
  },
  'モクロー': {
    japanese: 'モクロー',
    romaji: 'mokuro-',
    pronunciation: 'mo-ku-ro-',
    meaning: 'Grass Quill Pokémon'
  },
  'フクスロー': {
    japanese: 'フクスロー',
    romaji: 'fukusuro-',
    pronunciation: 'fu-ku-su-ro-',
    meaning: 'Blade Quill Pokémon'
  },
  'ジュナイパー': {
    japanese: 'ジュナイパー',
    romaji: 'junaipa-',
    pronunciation: 'ju-na-i-pa-',
    meaning: 'Arrow Quill Pokémon'
  },
  'ニャビー': {
    japanese: 'ニャビー',
    romaji: 'nyabi-',
    pronunciation: 'nya-bi-',
    meaning: 'Fire Cat Pokémon'
  },
  'ニャヒート': {
    japanese: 'ニャヒート',
    romaji: 'nyahi-to',
    pronunciation: 'nya-hi--to',
    meaning: 'Fire Cat Pokémon'
  },
  'ガオガエン': {
    japanese: 'ガオガエン',
    romaji: 'gaogaen',
    pronunciation: 'ga-o-ga-e-n',
    meaning: 'Heel Pokémon'
  },
  'アシマリ': {
    japanese: 'アシマリ',
    romaji: 'ashimari',
    pronunciation: 'a-shi-ma-ri',
    meaning: 'Sea Lion Pokémon'
  },
  'オシャマリ': {
    japanese: 'オシャマリ',
    romaji: 'oshamari',
    pronunciation: 'o-sha-ma-ri',
    meaning: 'Pop Star Pokémon'
  },
  'アシレーヌ': {
    japanese: 'アシレーヌ',
    romaji: 'ashire-nu',
    pronunciation: 'a-shi-re--nu',
    meaning: 'Soloist Pokémon'
  },
  'ツツケラ': {
    japanese: 'ツツケラ',
    romaji: 'tsutsukera',
    pronunciation: 'tsu-tsu-ke-ra',
    meaning: 'Woodpecker Pokémon'
  },
  'ケララッパ': {
    japanese: 'ケララッパ',
    romaji: 'keraratsupa',
    pronunciation: 'ke-ra-ra-tsu-pa',
    meaning: 'Bugle Beak Pokémon'
  },
  'ドデカバシ': {
    japanese: 'ドデカバシ',
    romaji: 'dodekabashi',
    pronunciation: 'do-de-ka-ba-shi',
    meaning: 'Cannon Pokémon'
  },
  'ヤングース': {
    japanese: 'ヤングース',
    romaji: 'yangu-su',
    pronunciation: 'ya-ngu--su',
    meaning: 'Loitering Pokémon'
  },
  'デカグース': {
    japanese: 'デカグース',
    romaji: 'dekagu-su',
    pronunciation: 'de-ka-gu--su',
    meaning: 'Stakeout Pokémon'
  },
  'アゴジムシ': {
    japanese: 'アゴジムシ',
    romaji: 'agojimushi',
    pronunciation: 'a-go-ji-mu-shi',
    meaning: 'Larva Pokémon'
  },
  'デンヂムシ': {
    japanese: 'デンヂムシ',
    romaji: 'denjimushi',
    pronunciation: 'de-nji-mu-shi',
    meaning: 'Battery Pokémon'
  },
  'クワガノン': {
    japanese: 'クワガノン',
    romaji: 'kuwaganon',
    pronunciation: 'ku-wa-ga-no-n',
    meaning: 'Stag Beetle Pokémon'
  },
  'マケンカニ': {
    japanese: 'マケンカニ',
    romaji: 'makenkani',
    pronunciation: 'ma-ke-nka-ni',
    meaning: 'Boxing Pokémon'
  },
  'ケケンカニ': {
    japanese: 'ケケンカニ',
    romaji: 'kekenkani',
    pronunciation: 'ke-ke-nka-ni',
    meaning: 'Woolly Crab Pokémon'
  },
  'オドリドリ': {
    japanese: 'オドリドリ',
    romaji: 'odoridori',
    pronunciation: 'o-do-ri-do-ri',
    meaning: 'Dancing Pokémon'
  },
  'アブリー': {
    japanese: 'アブリー',
    romaji: 'aburi-',
    pronunciation: 'a-bu-ri-',
    meaning: 'Bee Fly Pokémon'
  },
  'アブリボン': {
    japanese: 'アブリボン',
    romaji: 'aburibon',
    pronunciation: 'a-bu-ri-bo-n',
    meaning: 'Bee Fly Pokémon'
  },
  'イワンコ': {
    japanese: 'イワンコ',
    romaji: 'iwanko',
    pronunciation: 'i-wa-nko',
    meaning: 'Puppy Pokémon'
  },
  'ルガルガン': {
    japanese: 'ルガルガン',
    romaji: 'rugarugan',
    pronunciation: 'ru-ga-ru-ga-n',
    meaning: 'Wolf Pokémon'
  },
  'ヨワシ': {
    japanese: 'ヨワシ',
    romaji: 'yowashi',
    pronunciation: 'yo-wa-shi',
    meaning: 'Small Fry Pokémon'
  },
  'ヒドイデ': {
    japanese: 'ヒドイデ',
    romaji: 'hidoide',
    pronunciation: 'hi-do-i-de',
    meaning: 'Brutal Star Pokémon'
  },
  'ドヒドイデ': {
    japanese: 'ドヒドイデ',
    romaji: 'dohidoide',
    pronunciation: 'do-hi-do-i-de',
    meaning: 'Brutal Star Pokémon'
  },
  'ドロバンコ': {
    japanese: 'ドロバンコ',
    romaji: 'dorobanko',
    pronunciation: 'do-ro-ba-nko',
    meaning: 'Donkey Pokémon'
  },
  'バンバドロ': {
    japanese: 'バンバドロ',
    romaji: 'banbadoro',
    pronunciation: 'ba-nba-do-ro',
    meaning: 'Draft Horse Pokémon'
  },
  'シズクモ': {
    japanese: 'シズクモ',
    romaji: 'shizukumo',
    pronunciation: 'shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon'
  },
  'オニシズクモ': {
    japanese: 'オニシズクモ',
    romaji: 'onishizukumo',
    pronunciation: 'o-ni-shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon'
  },
  'カリキリ': {
    japanese: 'カリキリ',
    romaji: 'karikiri',
    pronunciation: 'ka-ri-ki-ri',
    meaning: 'Sickle Grass Pokémon'
  },
  'ラランテス': {
    japanese: 'ラランテス',
    romaji: 'rarantesu',
    pronunciation: 'ra-ra-nte-su',
    meaning: 'Bloom Sickle Pokémon'
  },
  'ネマシュ': {
    japanese: 'ネマシュ',
    romaji: 'nemashu',
    pronunciation: 'ne-ma-shu',
    meaning: 'Illuminating Pokémon'
  },
  'マシェード': {
    japanese: 'マシェード',
    romaji: 'mashie-do',
    pronunciation: 'ma-shi-e--do',
    meaning: 'Illuminating Pokémon'
  },
  'ヤトウモリ': {
    japanese: 'ヤトウモリ',
    romaji: 'yatoumori',
    pronunciation: 'ya-to-u-mo-ri',
    meaning: 'Toxic Lizard Pokémon'
  },
  'エンニュート': {
    japanese: 'エンニュート',
    romaji: 'ennyu-to',
    pronunciation: 'e-nnyu--to',
    meaning: 'Toxic Lizard Pokémon'
  },
  'ヌイコグマ': {
    japanese: 'ヌイコグマ',
    romaji: 'nuikoguma',
    pronunciation: 'nu-i-ko-gu-ma',
    meaning: 'Flailing Pokémon'
  },
  'キテルグマ': {
    japanese: 'キテルグマ',
    romaji: 'kiteruguma',
    pronunciation: 'ki-te-ru-gu-ma',
    meaning: 'Strong Arm Pokémon'
  },
  'アマカジ': {
    japanese: 'アマカジ',
    romaji: 'amakaji',
    pronunciation: 'a-ma-ka-ji',
    meaning: 'Fruit Pokémon'
  },
  'アママイコ': {
    japanese: 'アママイコ',
    romaji: 'amamaiko',
    pronunciation: 'a-ma-ma-i-ko',
    meaning: 'Fruit Pokémon'
  },
  'アマージョ': {
    japanese: 'アマージョ',
    romaji: 'ama-jo',
    pronunciation: 'a-ma--jo',
    meaning: 'Fruit Pokémon'
  },
  'キュワワー': {
    japanese: 'キュワワー',
    romaji: 'kyuwawa-',
    pronunciation: 'kyu-wa-wa-',
    meaning: 'Posy Picker Pokémon'
  },
  'ヤレユータン': {
    japanese: 'ヤレユータン',
    romaji: 'yareyu-tan',
    pronunciation: 'ya-re-yu--ta-n',
    meaning: 'Sage Pokémon'
  },
  'ナゲツケサル': {
    japanese: 'ナゲツケサル',
    romaji: 'nagetsukesaru',
    pronunciation: 'na-ge-tsu-ke-sa-ru',
    meaning: 'Teamwork Pokémon'
  },
  'コソクムシ': {
    japanese: 'コソクムシ',
    romaji: 'kosokumushi',
    pronunciation: 'ko-so-ku-mu-shi',
    meaning: 'Turn Tail Pokémon'
  },
  'グソクムシャ': {
    japanese: 'グソクムシャ',
    romaji: 'gusokumusha',
    pronunciation: 'gu-so-ku-mu-sha',
    meaning: 'Hard Scale Pokémon'
  },
  'スナバァ': {
    japanese: 'スナバァ',
    romaji: 'sunabaa',
    pronunciation: 'su-na-ba-a',
    meaning: 'Sand Heap Pokémon'
  },
  'シロデスナ': {
    japanese: 'シロデスナ',
    romaji: 'shirodesuna',
    pronunciation: 'shi-ro-de-su-na',
    meaning: 'Sand Castle Pokémon'
  },
  'ナマコブシ': {
    japanese: 'ナマコブシ',
    romaji: 'namakobushi',
    pronunciation: 'na-ma-ko-bu-shi',
    meaning: 'Sea Cucumber Pokémon'
  },
  'タイプ：ヌル': {
    japanese: 'タイプ：ヌル',
    romaji: 'taipu：nuru',
    pronunciation: 'ta-i-pu-：nu-ru',
    meaning: 'Synthetic Pokémon'
  },
  'シルヴァディ': {
    japanese: 'シルヴァディ',
    romaji: 'shiruヴadei',
    pronunciation: 'shi-ru-ヴa-de-i',
    meaning: 'Synthetic Pokémon'
  },
  'メテノ': {
    japanese: 'メテノ',
    romaji: 'meteno',
    pronunciation: 'me-te-no',
    meaning: 'Meteor Pokémon'
  },
  'ネッコアラ': {
    japanese: 'ネッコアラ',
    romaji: 'netsukoara',
    pronunciation: 'ne-tsu-ko-a-ra',
    meaning: 'Drowsing Pokémon'
  },
  'バクガメス': {
    japanese: 'バクガメス',
    romaji: 'bakugamesu',
    pronunciation: 'ba-ku-ga-me-su',
    meaning: 'Blast Turtle Pokémon'
  },
  'トゲデマル': {
    japanese: 'トゲデマル',
    romaji: 'togedemaru',
    pronunciation: 'to-ge-de-ma-ru',
    meaning: 'Roly-Poly Pokémon'
  },
  'ミミッキュ': {
    japanese: 'ミミッキュ',
    romaji: 'mimitsukyu',
    pronunciation: 'mi-mi-tsu-kyu',
    meaning: 'Disguise Pokémon'
  },
  'ハギギシリ': {
    japanese: 'ハギギシリ',
    romaji: 'hagigishiri',
    pronunciation: 'ha-gi-gi-shi-ri',
    meaning: 'Gnash Teeth Pokémon'
  },
  'ジジーロン': {
    japanese: 'ジジーロン',
    romaji: 'jiji-ron',
    pronunciation: 'ji-ji--ro-n',
    meaning: 'Placid Pokémon'
  },
  'ダダリン': {
    japanese: 'ダダリン',
    romaji: 'dadarin',
    pronunciation: 'da-da-ri-n',
    meaning: 'Sea Creeper Pokémon'
  },
  'ジャラコ': {
    japanese: 'ジャラコ',
    romaji: 'jarako',
    pronunciation: 'ja-ra-ko',
    meaning: 'Scaly Pokémon'
  },
  'ジャランゴ': {
    japanese: 'ジャランゴ',
    romaji: 'jarango',
    pronunciation: 'ja-ra-ngo',
    meaning: 'Scaly Pokémon'
  },
  'ジャラランガ': {
    japanese: 'ジャラランガ',
    romaji: 'jararanga',
    pronunciation: 'ja-ra-ra-nga',
    meaning: 'Scaly Pokémon'
  },
  'カプ・コケコ': {
    japanese: 'カプ・コケコ',
    romaji: 'kapu・kokeko',
    pronunciation: 'ka-pu-・ko-ke-ko',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・テテフ': {
    japanese: 'カプ・テテフ',
    romaji: 'kapu・tetefu',
    pronunciation: 'ka-pu-・te-te-fu',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・ブルル': {
    japanese: 'カプ・ブルル',
    romaji: 'kapu・bururu',
    pronunciation: 'ka-pu-・bu-ru-ru',
    meaning: 'Land Spirit Pokémon'
  },
  'カプ・レヒレ': {
    japanese: 'カプ・レヒレ',
    romaji: 'kapu・rehire',
    pronunciation: 'ka-pu-・re-hi-re',
    meaning: 'Land Spirit Pokémon'
  },
  'コスモッグ': {
    japanese: 'コスモッグ',
    romaji: 'kosumotsugu',
    pronunciation: 'ko-su-mo-tsu-gu',
    meaning: 'Nebula Pokémon'
  },
  'コスモウム': {
    japanese: 'コスモウム',
    romaji: 'kosumoumu',
    pronunciation: 'ko-su-mo-u-mu',
    meaning: 'Protostar Pokémon'
  },
  'ソルガレオ': {
    japanese: 'ソルガレオ',
    romaji: 'sorugareo',
    pronunciation: 'so-ru-ga-re-o',
    meaning: 'Sunne Pokémon'
  },
  'ルナアーラ': {
    japanese: 'ルナアーラ',
    romaji: 'runaa-ra',
    pronunciation: 'ru-na-a--ra',
    meaning: 'Moone Pokémon'
  },
  'ウツロイド': {
    japanese: 'ウツロイド',
    romaji: 'utsuroido',
    pronunciation: 'u-tsu-ro-i-do',
    meaning: 'Parasite Pokémon'
  },
  'マッシブーン': {
    japanese: 'マッシブーン',
    romaji: 'matsushibu-n',
    pronunciation: 'ma-tsu-shi-bu--n',
    meaning: 'Swollen Pokémon'
  },
  'フェローチェ': {
    japanese: 'フェローチェ',
    romaji: 'fuero-chie',
    pronunciation: 'fu-e-ro--chi-e',
    meaning: 'Lissome Pokémon'
  },
  'デンジュモク': {
    japanese: 'デンジュモク',
    romaji: 'denjumoku',
    pronunciation: 'de-nju-mo-ku',
    meaning: 'Glowing Pokémon'
  },
  'テッカグヤ': {
    japanese: 'テッカグヤ',
    romaji: 'tetsukaguya',
    pronunciation: 'te-tsu-ka-gu-ya',
    meaning: 'Launch Pokémon'
  },
  'カミツルギ': {
    japanese: 'カミツルギ',
    romaji: 'kamitsurugi',
    pronunciation: 'ka-mi-tsu-ru-gi',
    meaning: 'Drawn Sword Pokémon'
  },
  'アクジキング': {
    japanese: 'アクジキング',
    romaji: 'akujikingu',
    pronunciation: 'a-ku-ji-ki-ngu',
    meaning: 'Junkivore Pokémon'
  },
  'ネクロズマ': {
    japanese: 'ネクロズマ',
    romaji: 'nekurozuma',
    pronunciation: 'ne-ku-ro-zu-ma',
    meaning: 'Prism Pokémon'
  },
  'マギアナ': {
    japanese: 'マギアナ',
    romaji: 'magiana',
    pronunciation: 'ma-gi-a-na',
    meaning: 'Artificial Pokémon'
  },
  'マーシャドー': {
    japanese: 'マーシャドー',
    romaji: 'ma-shado-',
    pronunciation: 'ma--sha-do-',
    meaning: 'Gloomdweller Pokémon'
  },
  'ベベノム': {
    japanese: 'ベベノム',
    romaji: 'bebenomu',
    pronunciation: 'be-be-no-mu',
    meaning: 'Poison Pin Pokémon'
  },
  'アーゴヨン': {
    japanese: 'アーゴヨン',
    romaji: 'a-goyon',
    pronunciation: 'a--go-yo-n',
    meaning: 'Poison Pin Pokémon'
  },
  'ツンデツンデ': {
    japanese: 'ツンデツンデ',
    romaji: 'tsundetsunde',
    pronunciation: 'tsu-nde-tsu-nde',
    meaning: 'Rampart Pokémon'
  },
  'ズガドーン': {
    japanese: 'ズガドーン',
    romaji: 'zugado-n',
    pronunciation: 'zu-ga-do--n',
    meaning: 'Fireworks Pokémon'
  },
  'ゼラオラ': {
    japanese: 'ゼラオラ',
    romaji: 'zeraora',
    pronunciation: 'ze-ra-o-ra',
    meaning: 'Thunderclap Pokémon'
  },
  'メルタン': {
    japanese: 'メルタン',
    romaji: 'merutan',
    pronunciation: 'me-ru-ta-n',
    meaning: 'Hex Nut Pokémon'
  },
  'メルメタル': {
    japanese: 'メルメタル',
    romaji: 'merumetaru',
    pronunciation: 'me-ru-me-ta-ru',
    meaning: 'Hex Nut Pokémon'
  },
  'サルノリ': {
    japanese: 'サルノリ',
    romaji: 'sarunori',
    pronunciation: 'sa-ru-no-ri',
    meaning: 'Chimp Pokémon'
  },
  'バチンキー': {
    japanese: 'バチンキー',
    romaji: 'bachinki-',
    pronunciation: 'ba-chi-nki-',
    meaning: 'Beat Pokémon'
  },
  'ゴリランダー': {
    japanese: 'ゴリランダー',
    romaji: 'goriranda-',
    pronunciation: 'go-ri-ra-nda-',
    meaning: 'Drummer Pokémon'
  },
  'ヒバニー': {
    japanese: 'ヒバニー',
    romaji: 'hibani-',
    pronunciation: 'hi-ba-ni-',
    meaning: 'Rabbit Pokémon'
  },
  'ラビフット': {
    japanese: 'ラビフット',
    romaji: 'rabifutsuto',
    pronunciation: 'ra-bi-fu-tsu-to',
    meaning: 'Rabbit Pokémon'
  },
  'エースバーン': {
    japanese: 'エースバーン',
    romaji: 'e-suba-n',
    pronunciation: 'e--su-ba--n',
    meaning: 'Striker Pokémon'
  },
  'メッソン': {
    japanese: 'メッソン',
    romaji: 'metsuson',
    pronunciation: 'me-tsu-so-n',
    meaning: 'Water Lizard Pokémon'
  },
  'ジメレオン': {
    japanese: 'ジメレオン',
    romaji: 'jimereon',
    pronunciation: 'ji-me-re-o-n',
    meaning: 'Water Lizard Pokémon'
  },
  'インテレオン': {
    japanese: 'インテレオン',
    romaji: 'intereon',
    pronunciation: 'i-nte-re-o-n',
    meaning: 'Secret Agent Pokémon'
  },
  'ホシガリス': {
    japanese: 'ホシガリス',
    romaji: 'hoshigarisu',
    pronunciation: 'ho-shi-ga-ri-su',
    meaning: 'Cheeky Pokémon'
  },
  'ヨクバリス': {
    japanese: 'ヨクバリス',
    romaji: 'yokubarisu',
    pronunciation: 'yo-ku-ba-ri-su',
    meaning: 'Greedy Pokémon'
  },
  'ココガラ': {
    japanese: 'ココガラ',
    romaji: 'kokogara',
    pronunciation: 'ko-ko-ga-ra',
    meaning: 'Tiny Bird Pokémon'
  },
  'アオガラス': {
    japanese: 'アオガラス',
    romaji: 'aogarasu',
    pronunciation: 'a-o-ga-ra-su',
    meaning: 'Raven Pokémon'
  },
  'アーマーガア': {
    japanese: 'アーマーガア',
    romaji: 'a-ma-gaa',
    pronunciation: 'a--ma--ga-a',
    meaning: 'Raven Pokémon'
  },
  'サッチムシ': {
    japanese: 'サッチムシ',
    romaji: 'satsuchimushi',
    pronunciation: 'sa-tsu-chi-mu-shi',
    meaning: 'Larva Pokémon'
  },
  'レドームシ': {
    japanese: 'レドームシ',
    romaji: 'redo-mushi',
    pronunciation: 're-do--mu-shi',
    meaning: 'Radome Pokémon'
  },
  'イオルブ': {
    japanese: 'イオルブ',
    romaji: 'iorubu',
    pronunciation: 'i-o-ru-bu',
    meaning: 'Seven Spot Pokémon'
  },
  'クスネ': {
    japanese: 'クスネ',
    romaji: 'kusune',
    pronunciation: 'ku-su-ne',
    meaning: 'Fox Pokémon'
  },
  'フォクスライ': {
    japanese: 'フォクスライ',
    romaji: 'fuokusurai',
    pronunciation: 'fu-o-ku-su-ra-i',
    meaning: 'Fox Pokémon'
  },
  'ヒメンカ': {
    japanese: 'ヒメンカ',
    romaji: 'himenka',
    pronunciation: 'hi-me-nka',
    meaning: 'Flowering Pokémon'
  },
  'ワタシラガ': {
    japanese: 'ワタシラガ',
    romaji: 'watashiraga',
    pronunciation: 'wa-ta-shi-ra-ga',
    meaning: 'Cotton Bloom Pokémon'
  },
  'ウールー': {
    japanese: 'ウールー',
    romaji: 'u-ru-',
    pronunciation: 'u--ru-',
    meaning: 'Sheep Pokémon'
  },
  'バイウールー': {
    japanese: 'バイウールー',
    romaji: 'baiu-ru-',
    pronunciation: 'ba-i-u--ru-',
    meaning: 'Sheep Pokémon'
  },
  'カムカメ': {
    japanese: 'カムカメ',
    romaji: 'kamukame',
    pronunciation: 'ka-mu-ka-me',
    meaning: 'Snapping Pokémon'
  },
  'カジリガメ': {
    japanese: 'カジリガメ',
    romaji: 'kajirigame',
    pronunciation: 'ka-ji-ri-ga-me',
    meaning: 'Bite Pokémon'
  },
  'ワンパチ': {
    japanese: 'ワンパチ',
    romaji: 'wanpachi',
    pronunciation: 'wa-npa-chi',
    meaning: 'Puppy Pokémon'
  },
  'パルスワン': {
    japanese: 'パルスワン',
    romaji: 'parusuwan',
    pronunciation: 'pa-ru-su-wa-n',
    meaning: 'Dog Pokémon'
  },
  'タンドン': {
    japanese: 'タンドン',
    romaji: 'tandon',
    pronunciation: 'ta-ndo-n',
    meaning: 'Coal Pokémon'
  },
  'トロッゴン': {
    japanese: 'トロッゴン',
    romaji: 'torotsugon',
    pronunciation: 'to-ro-tsu-go-n',
    meaning: 'Coal Pokémon'
  },
  'セキタンザン': {
    japanese: 'セキタンザン',
    romaji: 'sekitanzan',
    pronunciation: 'se-ki-ta-nza-n',
    meaning: 'Coal Pokémon'
  },
  'カジッチュ': {
    japanese: 'カジッチュ',
    romaji: 'kajitsuchu',
    pronunciation: 'ka-ji-tsu-chu',
    meaning: 'Apple Core Pokémon'
  },
  'アップリュー': {
    japanese: 'アップリュー',
    romaji: 'atsupuryu-',
    pronunciation: 'a-tsu-pu-ryu-',
    meaning: 'Apple Wing Pokémon'
  },
  'タルップル': {
    japanese: 'タルップル',
    romaji: 'tarutsupuru',
    pronunciation: 'ta-ru-tsu-pu-ru',
    meaning: 'Apple Nectar Pokémon'
  },
  'スナヘビ': {
    japanese: 'スナヘビ',
    romaji: 'sunahebi',
    pronunciation: 'su-na-he-bi',
    meaning: 'Sand Snake Pokémon'
  },
  'サダイジャ': {
    japanese: 'サダイジャ',
    romaji: 'sadaija',
    pronunciation: 'sa-da-i-ja',
    meaning: 'Sand Snake Pokémon'
  },
  'ウッウ': {
    japanese: 'ウッウ',
    romaji: 'utsuu',
    pronunciation: 'u-tsu-u',
    meaning: 'Gulp Pokémon'
  },
  'サシカマス': {
    japanese: 'サシカマス',
    romaji: 'sashikamasu',
    pronunciation: 'sa-shi-ka-ma-su',
    meaning: 'Rush Pokémon'
  },
  'カマスジョー': {
    japanese: 'カマスジョー',
    romaji: 'kamasujo-',
    pronunciation: 'ka-ma-su-jo-',
    meaning: 'Skewer Pokémon'
  },
  'エレズン': {
    japanese: 'エレズン',
    romaji: 'erezun',
    pronunciation: 'e-re-zu-n',
    meaning: 'Baby Pokémon'
  },
  'ストリンダー': {
    japanese: 'ストリンダー',
    romaji: 'sutorinda-',
    pronunciation: 'su-to-ri-nda-',
    meaning: 'Punk Pokémon'
  },
  'ヤクデ': {
    japanese: 'ヤクデ',
    romaji: 'yakude',
    pronunciation: 'ya-ku-de',
    meaning: 'Radiator Pokémon'
  },
  'マルヤクデ': {
    japanese: 'マルヤクデ',
    romaji: 'maruyakude',
    pronunciation: 'ma-ru-ya-ku-de',
    meaning: 'Radiator Pokémon'
  },
  'タタッコ': {
    japanese: 'タタッコ',
    romaji: 'tatatsuko',
    pronunciation: 'ta-ta-tsu-ko',
    meaning: 'Tantrum Pokémon'
  },
  'オトスパス': {
    japanese: 'オトスパス',
    romaji: 'otosupasu',
    pronunciation: 'o-to-su-pa-su',
    meaning: 'Jujitsu Pokémon'
  },
  'ヤバチャ': {
    japanese: 'ヤバチャ',
    romaji: 'yabacha',
    pronunciation: 'ya-ba-cha',
    meaning: 'Black Tea Pokémon'
  },
  'ポットデス': {
    japanese: 'ポットデス',
    romaji: 'potsutodesu',
    pronunciation: 'po-tsu-to-de-su',
    meaning: 'Black Tea Pokémon'
  },
  'ミブリム': {
    japanese: 'ミブリム',
    romaji: 'miburimu',
    pronunciation: 'mi-bu-ri-mu',
    meaning: 'Calm Pokémon'
  },
  'テブリム': {
    japanese: 'テブリム',
    romaji: 'teburimu',
    pronunciation: 'te-bu-ri-mu',
    meaning: 'Serene Pokémon'
  },
  'ブリムオン': {
    japanese: 'ブリムオン',
    romaji: 'burimuon',
    pronunciation: 'bu-ri-mu-o-n',
    meaning: 'Silent Pokémon'
  },
  'ベロバー': {
    japanese: 'ベロバー',
    romaji: 'beroba-',
    pronunciation: 'be-ro-ba-',
    meaning: 'Wily Pokémon'
  },
  'ギモー': {
    japanese: 'ギモー',
    romaji: 'gimo-',
    pronunciation: 'gi-mo-',
    meaning: 'Devious Pokémon'
  },
  'オーロンゲ': {
    japanese: 'オーロンゲ',
    romaji: 'o-ronge',
    pronunciation: 'o--ro-nge',
    meaning: 'Bulk Up Pokémon'
  },
  'タチフサグマ': {
    japanese: 'タチフサグマ',
    romaji: 'tachifusaguma',
    pronunciation: 'ta-chi-fu-sa-gu-ma',
    meaning: 'Blocking Pokémon'
  },
  'ニャイキング': {
    japanese: 'ニャイキング',
    romaji: 'nyaikingu',
    pronunciation: 'nya-i-ki-ngu',
    meaning: 'Viking Pokémon'
  },
  'サニゴーン': {
    japanese: 'サニゴーン',
    romaji: 'sanigo-n',
    pronunciation: 'sa-ni-go--n',
    meaning: 'Coral Pokémon'
  },
  'ネギガナイト': {
    japanese: 'ネギガナイト',
    romaji: 'negiganaito',
    pronunciation: 'ne-gi-ga-na-i-to',
    meaning: 'Wild Duck Pokémon'
  },
  'バリコオル': {
    japanese: 'バリコオル',
    romaji: 'barikooru',
    pronunciation: 'ba-ri-ko-o-ru',
    meaning: 'Comedian Pokémon'
  },
  'デスバーン': {
    japanese: 'デスバーン',
    romaji: 'desuba-n',
    pronunciation: 'de-su-ba--n',
    meaning: 'Grudge Pokémon'
  },
  'マホミル': {
    japanese: 'マホミル',
    romaji: 'mahomiru',
    pronunciation: 'ma-ho-mi-ru',
    meaning: 'Cream Pokémon'
  },
  'マホイップ': {
    japanese: 'マホイップ',
    romaji: 'mahoitsupu',
    pronunciation: 'ma-ho-i-tsu-pu',
    meaning: 'Cream Pokémon'
  },
  'タイレーツ': {
    japanese: 'タイレーツ',
    romaji: 'taire-tsu',
    pronunciation: 'ta-i-re--tsu',
    meaning: 'Formation Pokémon'
  },
  'バチンウニ': {
    japanese: 'バチンウニ',
    romaji: 'bachinuni',
    pronunciation: 'ba-chi-nu-ni',
    meaning: 'Sea Urchin Pokémon'
  },
  'ユキハミ': {
    japanese: 'ユキハミ',
    romaji: 'yukihami',
    pronunciation: 'yu-ki-ha-mi',
    meaning: 'Worm Pokémon'
  },
  'モスノウ': {
    japanese: 'モスノウ',
    romaji: 'mosunou',
    pronunciation: 'mo-su-no-u',
    meaning: 'Frost Moth Pokémon'
  },
  'イシヘンジン': {
    japanese: 'イシヘンジン',
    romaji: 'ishihenjin',
    pronunciation: 'i-shi-he-nji-n',
    meaning: 'Big Rock Pokémon'
  },
  'コオリッポ': {
    japanese: 'コオリッポ',
    romaji: 'kooritsupo',
    pronunciation: 'ko-o-ri-tsu-po',
    meaning: 'Penguin Pokémon'
  },
  'イエッサン': {
    japanese: 'イエッサン',
    romaji: 'ietsusan',
    pronunciation: 'i-e-tsu-sa-n',
    meaning: 'Emotion Pokémon'
  },
  'モルペコ': {
    japanese: 'モルペコ',
    romaji: 'morupeko',
    pronunciation: 'mo-ru-pe-ko',
    meaning: 'Two-Sided Pokémon'
  },
  'ゾウドウ': {
    japanese: 'ゾウドウ',
    romaji: 'zoudou',
    pronunciation: 'zo-u-do-u',
    meaning: 'Copperderm Pokémon'
  },
  'ダイオウドウ': {
    japanese: 'ダイオウドウ',
    romaji: 'daioudou',
    pronunciation: 'da-i-o-u-do-u',
    meaning: 'Copperderm Pokémon'
  },
  'パッチラゴン': {
    japanese: 'パッチラゴン',
    romaji: 'patsuchiragon',
    pronunciation: 'pa-tsu-chi-ra-go-n',
    meaning: 'Fossil Pokémon'
  },
  'パッチルドン': {
    japanese: 'パッチルドン',
    romaji: 'patsuchirudon',
    pronunciation: 'pa-tsu-chi-ru-do-n',
    meaning: 'Fossil Pokémon'
  },
  'ウオノラゴン': {
    japanese: 'ウオノラゴン',
    romaji: 'uonoragon',
    pronunciation: 'u-o-no-ra-go-n',
    meaning: 'Fossil Pokémon'
  },
  'ウオチルドン': {
    japanese: 'ウオチルドン',
    romaji: 'uochirudon',
    pronunciation: 'u-o-chi-ru-do-n',
    meaning: 'Fossil Pokémon'
  },
  'ジュラルドン': {
    japanese: 'ジュラルドン',
    romaji: 'jurarudon',
    pronunciation: 'ju-ra-ru-do-n',
    meaning: 'Alloy Pokémon'
  },
  'ドラメシヤ': {
    japanese: 'ドラメシヤ',
    romaji: 'dorameshiya',
    pronunciation: 'do-ra-me-shi-ya',
    meaning: 'Lingering Pokémon'
  },
  'ドロンチ': {
    japanese: 'ドロンチ',
    romaji: 'doronchi',
    pronunciation: 'do-ro-nchi',
    meaning: 'Caretaker Pokémon'
  },
  'ドラパルト': {
    japanese: 'ドラパルト',
    romaji: 'doraparuto',
    pronunciation: 'do-ra-pa-ru-to',
    meaning: 'Stealth Pokémon'
  },
  'ザシアン': {
    japanese: 'ザシアン',
    romaji: 'zashian',
    pronunciation: 'za-shi-a-n',
    meaning: 'Warrior Pokémon'
  },
  'ザマゼンタ': {
    japanese: 'ザマゼンタ',
    romaji: 'zamazenta',
    pronunciation: 'za-ma-ze-nta',
    meaning: 'Warrior Pokémon'
  },
  'ムゲンダイナ': {
    japanese: 'ムゲンダイナ',
    romaji: 'mugendaina',
    pronunciation: 'mu-ge-nda-i-na',
    meaning: 'Gigantic Pokémon'
  },
  'ダクマ': {
    japanese: 'ダクマ',
    romaji: 'dakuma',
    pronunciation: 'da-ku-ma',
    meaning: 'Wushu Pokémon'
  },
  'ウーラオス': {
    japanese: 'ウーラオス',
    romaji: 'u-raosu',
    pronunciation: 'u--ra-o-su',
    meaning: 'Wushu Pokémon'
  },
  'ザルード': {
    japanese: 'ザルード',
    romaji: 'zaru-do',
    pronunciation: 'za-ru--do',
    meaning: 'Rogue Monkey Pokémon'
  },
  'レジエレキ': {
    japanese: 'レジエレキ',
    romaji: 'rejiereki',
    pronunciation: 're-ji-e-re-ki',
    meaning: 'Electron Pokémon'
  },
  'レジドラゴ': {
    japanese: 'レジドラゴ',
    romaji: 'rejidorago',
    pronunciation: 're-ji-do-ra-go',
    meaning: 'Dragon Orb Pokémon'
  },
  'ブリザポス': {
    japanese: 'ブリザポス',
    romaji: 'burizaposu',
    pronunciation: 'bu-ri-za-po-su',
    meaning: 'Wild Horse Pokémon'
  },
  'レイスポス': {
    japanese: 'レイスポス',
    romaji: 'reisuposu',
    pronunciation: 're-i-su-po-su',
    meaning: 'Swift Horse Pokémon'
  },
  'バドレックス': {
    japanese: 'バドレックス',
    romaji: 'badoretsukusu',
    pronunciation: 'ba-do-re-tsu-ku-su',
    meaning: 'King Pokémon'
  },
  'アヤシシ': {
    japanese: 'アヤシシ',
    romaji: 'ayashishi',
    pronunciation: 'a-ya-shi-shi',
    meaning: 'Big Horn Pokémon'
  },
  'バサギリ': {
    japanese: 'バサギリ',
    romaji: 'basagiri',
    pronunciation: 'ba-sa-gi-ri',
    meaning: 'Axe Pokémon'
  },
  'ガチグマ': {
    japanese: 'ガチグマ',
    romaji: 'gachiguma',
    pronunciation: 'ga-chi-gu-ma',
    meaning: 'Peat Pokémon'
  },
  'イダイトウ': {
    japanese: 'イダイトウ',
    romaji: 'idaitou',
    pronunciation: 'i-da-i-to-u',
    meaning: 'Big Fish Pokémon'
  },
  'オオニューラ': {
    japanese: 'オオニューラ',
    romaji: 'oonyu-ra',
    pronunciation: 'o-o-nyu--ra',
    meaning: 'Free Climb Pokémon'
  },
  'ハリーマン': {
    japanese: 'ハリーマン',
    romaji: 'hari-man',
    pronunciation: 'ha-ri--ma-n',
    meaning: 'Pin Cluster Pokémon'
  },
  'ラブトロス': {
    japanese: 'ラブトロス',
    romaji: 'rabutorosu',
    pronunciation: 'ra-bu-to-ro-su',
    meaning: 'Love-Hate Pokémon'
  },
  'ニャオハ': {
    japanese: 'ニャオハ',
    romaji: 'nyaoha',
    pronunciation: 'nya-o-ha',
    meaning: 'Grass Cat Pokémon'
  },
  'ニャローテ': {
    japanese: 'ニャローテ',
    romaji: 'nyaro-te',
    pronunciation: 'nya-ro--te',
    meaning: 'Grass Cat Pokémon'
  },
  'マスカーニャ': {
    japanese: 'マスカーニャ',
    romaji: 'masuka-nya',
    pronunciation: 'ma-su-ka--nya',
    meaning: 'Magician Pokémon'
  },
  'ホゲータ': {
    japanese: 'ホゲータ',
    romaji: 'hoge-ta',
    pronunciation: 'ho-ge--ta',
    meaning: 'Fire Croc Pokémon'
  },
  'アチゲータ': {
    japanese: 'アチゲータ',
    romaji: 'achige-ta',
    pronunciation: 'a-chi-ge--ta',
    meaning: 'Fire Croc Pokémon'
  },
  'ラウドボーン': {
    japanese: 'ラウドボーン',
    romaji: 'raudobo-n',
    pronunciation: 'ra-u-do-bo--n',
    meaning: 'Singer Pokémon'
  },
  'クワッス': {
    japanese: 'クワッス',
    romaji: 'kuwatsusu',
    pronunciation: 'ku-wa-tsu-su',
    meaning: 'Duckling Pokémon'
  },
  'ウェルカモ': {
    japanese: 'ウェルカモ',
    romaji: 'uerukamo',
    pronunciation: 'u-e-ru-ka-mo',
    meaning: 'Practicing Pokémon'
  },
  'ウェーニバル': {
    japanese: 'ウェーニバル',
    romaji: 'ue-nibaru',
    pronunciation: 'u-e--ni-ba-ru',
    meaning: 'Dancer Pokémon'
  },
  'グルトン': {
    japanese: 'グルトン',
    romaji: 'guruton',
    pronunciation: 'gu-ru-to-n',
    meaning: 'Hog Pokémon'
  },
  'パフュートン': {
    japanese: 'パフュートン',
    romaji: 'pafuュ-ton',
    pronunciation: 'pa-fu-ュ-to-n',
    meaning: 'Hog Pokémon'
  },
  'タマンチュラ': {
    japanese: 'タマンチュラ',
    romaji: 'tamanchura',
    pronunciation: 'ta-ma-nchu-ra',
    meaning: 'String Ball Pokémon'
  },
  'ワナイダー': {
    japanese: 'ワナイダー',
    romaji: 'wanaida-',
    pronunciation: 'wa-na-i-da-',
    meaning: 'Trap Pokémon'
  },
  'マメバッタ': {
    japanese: 'マメバッタ',
    romaji: 'mamebatsuta',
    pronunciation: 'ma-me-ba-tsu-ta',
    meaning: 'Grasshopper Pokémon'
  },
  'エクスレッグ': {
    japanese: 'エクスレッグ',
    romaji: 'ekusuretsugu',
    pronunciation: 'e-ku-su-re-tsu-gu',
    meaning: 'Grasshopper Pokémon'
  },
  'パモ': {
    japanese: 'パモ',
    romaji: 'pamo',
    pronunciation: 'pa-mo',
    meaning: 'Mouse Pokémon'
  },
  'パモット': {
    japanese: 'パモット',
    romaji: 'pamotsuto',
    pronunciation: 'pa-mo-tsu-to',
    meaning: 'Mouse Pokémon'
  },
  'パーモット': {
    japanese: 'パーモット',
    romaji: 'pa-motsuto',
    pronunciation: 'pa--mo-tsu-to',
    meaning: 'Hands-On Pokémon'
  },
  'ワッカネズミ': {
    japanese: 'ワッカネズミ',
    romaji: 'watsukanezumi',
    pronunciation: 'wa-tsu-ka-ne-zu-mi',
    meaning: 'Couple Pokémon'
  },
  'イッカネズミ': {
    japanese: 'イッカネズミ',
    romaji: 'itsukanezumi',
    pronunciation: 'i-tsu-ka-ne-zu-mi',
    meaning: 'Family Pokémon'
  },
  'パピモッチ': {
    japanese: 'パピモッチ',
    romaji: 'papimotsuchi',
    pronunciation: 'pa-pi-mo-tsu-chi',
    meaning: 'Puppy Pokémon'
  },
  'バウッツェル': {
    japanese: 'バウッツェル',
    romaji: 'bautsutsueru',
    pronunciation: 'ba-u-tsu-tsu-e-ru',
    meaning: 'Dog Pokémon'
  },
  'ミニーブ': {
    japanese: 'ミニーブ',
    romaji: 'mini-bu',
    pronunciation: 'mi-ni--bu',
    meaning: 'Olive Pokémon'
  },
  'オリーニョ': {
    japanese: 'オリーニョ',
    romaji: 'ori-nyo',
    pronunciation: 'o-ri--nyo',
    meaning: 'Olive Pokémon'
  },
  'オリーヴァ': {
    japanese: 'オリーヴァ',
    romaji: 'ori-ヴa',
    pronunciation: 'o-ri--ヴa',
    meaning: 'Olive Pokémon'
  },
  'イキリンコ': {
    japanese: 'イキリンコ',
    romaji: 'ikirinko',
    pronunciation: 'i-ki-ri-nko',
    meaning: 'Parrot Pokémon'
  },
  'コジオ': {
    japanese: 'コジオ',
    romaji: 'kojio',
    pronunciation: 'ko-ji-o',
    meaning: 'Rock Salt Pokémon'
  },
  'ジオヅム': {
    japanese: 'ジオヅム',
    romaji: 'jiozumu',
    pronunciation: 'ji-o-zu-mu',
    meaning: 'Rock Salt Pokémon'
  },
  'キョジオーン': {
    japanese: 'キョジオーン',
    romaji: 'kyojio-n',
    pronunciation: 'kyo-ji-o--n',
    meaning: 'Rock Salt Pokémon'
  },
  'カルボウ': {
    japanese: 'カルボウ',
    romaji: 'karubou',
    pronunciation: 'ka-ru-bo-u',
    meaning: 'Fire Child Pokémon'
  },
  'グレンアルマ': {
    japanese: 'グレンアルマ',
    romaji: 'gurenaruma',
    pronunciation: 'gu-re-na-ru-ma',
    meaning: 'Fire Warrior Pokémon'
  },
  'ソウブレイズ': {
    japanese: 'ソウブレイズ',
    romaji: 'soubureizu',
    pronunciation: 'so-u-bu-re-i-zu',
    meaning: 'Fire Blades Pokémon'
  },
  'ズピカ': {
    japanese: 'ズピカ',
    romaji: 'zupika',
    pronunciation: 'zu-pi-ka',
    meaning: 'EleTadpole Pokémon'
  },
  'ハラバリー': {
    japanese: 'ハラバリー',
    romaji: 'harabari-',
    pronunciation: 'ha-ra-ba-ri-',
    meaning: 'EleFrog Pokémon'
  },
  'カイデン': {
    japanese: 'カイデン',
    romaji: 'kaiden',
    pronunciation: 'ka-i-de-n',
    meaning: 'Storm Petrel Pokémon'
  },
  'タイカイデン': {
    japanese: 'タイカイデン',
    romaji: 'taikaiden',
    pronunciation: 'ta-i-ka-i-de-n',
    meaning: 'Frigatebird Pokémon'
  },
  'オラチフ': {
    japanese: 'オラチフ',
    romaji: 'orachifu',
    pronunciation: 'o-ra-chi-fu',
    meaning: 'Rascal Pokémon'
  },
  'マフィティフ': {
    japanese: 'マフィティフ',
    romaji: 'mafuiteifu',
    pronunciation: 'ma-fu-i-te-i-fu',
    meaning: 'Boss Pokémon'
  },
  'シルシュルー': {
    japanese: 'シルシュルー',
    romaji: 'shirushuru-',
    pronunciation: 'shi-ru-shu-ru-',
    meaning: 'Toxic Mouse Pokémon'
  },
  'タギングル': {
    japanese: 'タギングル',
    romaji: 'taginguru',
    pronunciation: 'ta-gi-ngu-ru',
    meaning: 'Toxic Monkey Pokémon'
  },
  'アノクサ': {
    japanese: 'アノクサ',
    romaji: 'anokusa',
    pronunciation: 'a-no-ku-sa',
    meaning: 'Tumbleweed Pokémon'
  },
  'アノホラグサ': {
    japanese: 'アノホラグサ',
    romaji: 'anohoragusa',
    pronunciation: 'a-no-ho-ra-gu-sa',
    meaning: 'Tumbleweed Pokémon'
  },
  'ノノクラゲ': {
    japanese: 'ノノクラゲ',
    romaji: 'nonokurage',
    pronunciation: 'no-no-ku-ra-ge',
    meaning: 'Woodear Pokémon'
  },
  'リククラゲ': {
    japanese: 'リククラゲ',
    romaji: 'rikukurage',
    pronunciation: 'ri-ku-ku-ra-ge',
    meaning: 'Woodear Pokémon'
  },
  'ガケガニ': {
    japanese: 'ガケガニ',
    romaji: 'gakegani',
    pronunciation: 'ga-ke-ga-ni',
    meaning: 'Ambush Pokémon'
  },
  'カプサイジ': {
    japanese: 'カプサイジ',
    romaji: 'kapusaiji',
    pronunciation: 'ka-pu-sa-i-ji',
    meaning: 'Spicy Pepper Pokémon'
  },
  'スコヴィラン': {
    japanese: 'スコヴィラン',
    romaji: 'sukoヴiran',
    pronunciation: 'su-ko-ヴi-ra-n',
    meaning: 'Spicy Pepper Pokémon'
  },
  'シガロコ': {
    japanese: 'シガロコ',
    romaji: 'shigaroko',
    pronunciation: 'shi-ga-ro-ko',
    meaning: 'Rolling Pokémon'
  },
  'ベラカス': {
    japanese: 'ベラカス',
    romaji: 'berakasu',
    pronunciation: 'be-ra-ka-su',
    meaning: 'Rolling Pokémon'
  },
  'ヒラヒナ': {
    japanese: 'ヒラヒナ',
    romaji: 'hirahina',
    pronunciation: 'hi-ra-hi-na',
    meaning: 'Frill Pokémon'
  },
  'クエスパトラ': {
    japanese: 'クエスパトラ',
    romaji: 'kuesupatora',
    pronunciation: 'ku-e-su-pa-to-ra',
    meaning: 'Ostrich Pokémon'
  },
  'カヌチャン': {
    japanese: 'カヌチャン',
    romaji: 'kanuchan',
    pronunciation: 'ka-nu-cha-n',
    meaning: 'Metalsmith Pokémon'
  },
  'ナカヌチャン': {
    japanese: 'ナカヌチャン',
    romaji: 'nakanuchan',
    pronunciation: 'na-ka-nu-cha-n',
    meaning: 'Hammer Pokémon'
  },
  'デカヌチャン': {
    japanese: 'デカヌチャン',
    romaji: 'dekanuchan',
    pronunciation: 'de-ka-nu-cha-n',
    meaning: 'Hammer Pokémon'
  },
  'ウミディグダ': {
    japanese: 'ウミディグダ',
    romaji: 'umideiguda',
    pronunciation: 'u-mi-de-i-gu-da',
    meaning: 'Garden Eel Pokémon'
  },
  'ウミトリオ': {
    japanese: 'ウミトリオ',
    romaji: 'umitorio',
    pronunciation: 'u-mi-to-ri-o',
    meaning: 'Garden Eel Pokémon'
  },
  'オトシドリ': {
    japanese: 'オトシドリ',
    romaji: 'otoshidori',
    pronunciation: 'o-to-shi-do-ri',
    meaning: 'Item Drop Pokémon'
  },
  'ナミイルカ': {
    japanese: 'ナミイルカ',
    romaji: 'namiiruka',
    pronunciation: 'na-mi-i-ru-ka',
    meaning: 'Dolphin Pokémon'
  },
  'イルカマン': {
    japanese: 'イルカマン',
    romaji: 'irukaman',
    pronunciation: 'i-ru-ka-ma-n',
    meaning: 'Dolphin Pokémon'
  },
  'ブロロン': {
    japanese: 'ブロロン',
    romaji: 'buroron',
    pronunciation: 'bu-ro-ro-n',
    meaning: 'Single-Cyl Pokémon'
  },
  'ブロロローム': {
    japanese: 'ブロロローム',
    romaji: 'burororo-mu',
    pronunciation: 'bu-ro-ro-ro--mu',
    meaning: 'Multi-Cyl Pokémon'
  },
  'モトトカゲ': {
    japanese: 'モトトカゲ',
    romaji: 'mototokage',
    pronunciation: 'mo-to-to-ka-ge',
    meaning: 'Mount Pokémon'
  },
  'ミミズズ': {
    japanese: 'ミミズズ',
    romaji: 'mimizuzu',
    pronunciation: 'mi-mi-zu-zu',
    meaning: 'Earthworm Pokémon'
  },
  'キラーメ': {
    japanese: 'キラーメ',
    romaji: 'kira-me',
    pronunciation: 'ki-ra--me',
    meaning: 'Ore Pokémon'
  },
  'キラフロル': {
    japanese: 'キラフロル',
    romaji: 'kirafuroru',
    pronunciation: 'ki-ra-fu-ro-ru',
    meaning: 'Ore Pokémon'
  },
  'ボチ': {
    japanese: 'ボチ',
    romaji: 'bochi',
    pronunciation: 'bo-chi',
    meaning: 'Ghost Dog Pokémon'
  },
  'ハカドッグ': {
    japanese: 'ハカドッグ',
    romaji: 'hakadotsugu',
    pronunciation: 'ha-ka-do-tsu-gu',
    meaning: 'Ghost Dog Pokémon'
  },
  'カラミンゴ': {
    japanese: 'カラミンゴ',
    romaji: 'karamingo',
    pronunciation: 'ka-ra-mi-ngo',
    meaning: 'Synchronize Pokémon'
  },
  'アルクジラ': {
    japanese: 'アルクジラ',
    romaji: 'arukujira',
    pronunciation: 'a-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon'
  },
  'ハルクジラ': {
    japanese: 'ハルクジラ',
    romaji: 'harukujira',
    pronunciation: 'ha-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon'
  },
  'ミガルーサ': {
    japanese: 'ミガルーサ',
    romaji: 'migaru-sa',
    pronunciation: 'mi-ga-ru--sa',
    meaning: 'Jettison Pokémon'
  },
  'ヘイラッシャ': {
    japanese: 'ヘイラッシャ',
    romaji: 'heiratsusha',
    pronunciation: 'he-i-ra-tsu-sha',
    meaning: 'Big Catfish Pokémon'
  },
  'シャリタツ': {
    japanese: 'シャリタツ',
    romaji: 'sharitatsu',
    pronunciation: 'sha-ri-ta-tsu',
    meaning: 'Mimicry Pokémon'
  },
  'コノヨザル': {
    japanese: 'コノヨザル',
    romaji: 'konoyozaru',
    pronunciation: 'ko-no-yo-za-ru',
    meaning: 'Rage Monkey Pokémon'
  },
  'ドオー': {
    japanese: 'ドオー',
    romaji: 'doo-',
    pronunciation: 'do-o-',
    meaning: 'Spiny Fish Pokémon'
  },
  'リキキリン': {
    japanese: 'リキキリン',
    romaji: 'rikikirin',
    pronunciation: 'ri-ki-ki-ri-n',
    meaning: 'Long Neck Pokémon'
  },
  'ノココッチ': {
    japanese: 'ノココッチ',
    romaji: 'nokokotsuchi',
    pronunciation: 'no-ko-ko-tsu-chi',
    meaning: 'Land Snake Pokémon'
  },
  'ドドゲザン': {
    japanese: 'ドドゲザン',
    romaji: 'dodogezan',
    pronunciation: 'do-do-ge-za-n',
    meaning: 'Big Blade Pokémon'
  },
  'イダイナキバ': {
    japanese: 'イダイナキバ',
    romaji: 'idainakiba',
    pronunciation: 'i-da-i-na-ki-ba',
    meaning: 'Paradox Pokémon'
  },
  'サケブシッポ': {
    japanese: 'サケブシッポ',
    romaji: 'sakebushitsupo',
    pronunciation: 'sa-ke-bu-shi-tsu-po',
    meaning: 'Paradox Pokémon'
  },
  'アラブルタケ': {
    japanese: 'アラブルタケ',
    romaji: 'araburutake',
    pronunciation: 'a-ra-bu-ru-ta-ke',
    meaning: 'Paradox Pokémon'
  },
  'ハバタクカミ': {
    japanese: 'ハバタクカミ',
    romaji: 'habatakukami',
    pronunciation: 'ha-ba-ta-ku-ka-mi',
    meaning: 'Paradox Pokémon'
  },
  'チヲハウハネ': {
    japanese: 'チヲハウハネ',
    romaji: 'chiwohauhane',
    pronunciation: 'chi-wo-ha-u-ha-ne',
    meaning: 'Paradox Pokémon'
  },
  'スナノケガワ': {
    japanese: 'スナノケガワ',
    romaji: 'sunanokegawa',
    pronunciation: 'su-na-no-ke-ga-wa',
    meaning: 'Paradox Pokémon'
  },
  'テツノワダチ': {
    japanese: 'テツノワダチ',
    romaji: 'tetsunowadachi',
    pronunciation: 'te-tsu-no-wa-da-chi',
    meaning: 'Paradox Pokémon'
  },
  'テツノツツミ': {
    japanese: 'テツノツツミ',
    romaji: 'tetsunotsutsumi',
    pronunciation: 'te-tsu-no-tsu-tsu-mi',
    meaning: 'Paradox Pokémon'
  },
  'テツノカイナ': {
    japanese: 'テツノカイナ',
    romaji: 'tetsunokaina',
    pronunciation: 'te-tsu-no-ka-i-na',
    meaning: 'Paradox Pokémon'
  },
  'テツノコウベ': {
    japanese: 'テツノコウベ',
    romaji: 'tetsunokoube',
    pronunciation: 'te-tsu-no-ko-u-be',
    meaning: 'Paradox Pokémon'
  },
  'テツノドクガ': {
    japanese: 'テツノドクガ',
    romaji: 'tetsunodokuga',
    pronunciation: 'te-tsu-no-do-ku-ga',
    meaning: 'Paradox Pokémon'
  },
  'テツノイバラ': {
    japanese: 'テツノイバラ',
    romaji: 'tetsunoibara',
    pronunciation: 'te-tsu-no-i-ba-ra',
    meaning: 'Paradox Pokémon'
  },
  'セビエ': {
    japanese: 'セビエ',
    romaji: 'sebie',
    pronunciation: 'se-bi-e',
    meaning: 'Ice Fin Pokémon'
  },
  'セゴール': {
    japanese: 'セゴール',
    romaji: 'sego-ru',
    pronunciation: 'se-go--ru',
    meaning: 'Ice Fin Pokémon'
  },
  'セグレイブ': {
    japanese: 'セグレイブ',
    romaji: 'segureibu',
    pronunciation: 'se-gu-re-i-bu',
    meaning: 'Ice Dragon Pokémon'
  },
  'コレクレー': {
    japanese: 'コレクレー',
    romaji: 'korekure-',
    pronunciation: 'ko-re-ku-re-',
    meaning: 'Coin Chest Pokémon'
  },
  'サーフゴー': {
    japanese: 'サーフゴー',
    romaji: 'sa-fugo-',
    pronunciation: 'sa--fu-go-',
    meaning: 'Coin Entity Pokémon'
  },
  'チオンジェン': {
    japanese: 'チオンジェン',
    romaji: 'chionjien',
    pronunciation: 'chi-o-nji-e-n',
    meaning: 'Ruinous Pokémon'
  },
  'パオジアン': {
    japanese: 'パオジアン',
    romaji: 'paojian',
    pronunciation: 'pa-o-ji-a-n',
    meaning: 'Ruinous Pokémon'
  },
  'ディンルー': {
    japanese: 'ディンルー',
    romaji: 'deinru-',
    pronunciation: 'de-i-nru-',
    meaning: 'Ruinous Pokémon'
  },
  'イーユイ': {
    japanese: 'イーユイ',
    romaji: 'i-yui',
    pronunciation: 'i--yu-i',
    meaning: 'Ruinous Pokémon'
  },
  'トドロクツキ': {
    japanese: 'トドロクツキ',
    romaji: 'todorokutsuki',
    pronunciation: 'to-do-ro-ku-tsu-ki',
    meaning: 'Paradox Pokémon'
  },
  'テツノブジン': {
    japanese: 'テツノブジン',
    romaji: 'tetsunobujin',
    pronunciation: 'te-tsu-no-bu-ji-n',
    meaning: 'Paradox Pokémon'
  },
  'コライドン': {
    japanese: 'コライドン',
    romaji: 'koraidon',
    pronunciation: 'ko-ra-i-do-n',
    meaning: 'Paradox Pokémon'
  },
  'ミライドン': {
    japanese: 'ミライドン',
    romaji: 'miraidon',
    pronunciation: 'mi-ra-i-do-n',
    meaning: 'Paradox Pokémon'
  },
  'ウネルミナモ': {
    japanese: 'ウネルミナモ',
    romaji: 'uneruminamo',
    pronunciation: 'u-ne-ru-mi-na-mo',
    meaning: 'Paradox Pokémon'
  },
  'テツノイサハ': {
    japanese: 'テツノイサハ',
    romaji: 'tetsunoisaha',
    pronunciation: 'te-tsu-no-i-sa-ha',
    meaning: 'Paradox Pokémon'
  }
}

export function getJapaneseNameInfo(japaneseName: string): JapaneseNameInfo | null {
  return japaneseNames[japaneseName] || null
}

// Pokemon ID to Japanese name mapping (Gen 1-9)
const pokemonIdToJapanese: Record<number, string> = {
  1: 'フシギダネ',    // Strange Seed
  2: 'フシギソウ',    // Strange Grass
  3: 'フシギバナ',    // Strange Flower
  4: 'ヒトカゲ',    // Fire Lizard
  5: 'リザード',    // Lizard
  6: 'リザードン',    // Lizard
  7: 'ゼニガメ',    // Tiny Turtle
  8: 'カメール',    // Turtle
  9: 'カメックス',    // Shellfish
  10: 'キャタピー',    // Caterpillar
  11: 'トランセル',    // Transparent Shell
  12: 'バタフリー',    // Butterfly
  13: 'ビードル',    // Beedle
  14: 'コクーン',    // Cocoon
  15: 'スピアー',    // Spear
  16: 'ポッポ',    // Pigeon
  17: 'ピジョン',    // Pigeon
  18: 'ピジョット',    // Pigeon
  19: 'コラッタ',    // Small Rat
  20: 'ラッタ',    // Rat
  21: 'オニスズメ',    // Demon Sparrow
  22: 'オニドリル',    // Demon Drill
  23: 'アーボ',    // Snake
  24: 'アーボック',    // Cobra
  25: 'ピカチュウ',    // Spark Mouse
  26: 'ライチュウ',    // Thunder Mouse
  27: 'サンド',    // Sand
  28: 'サンドパン',    // Sand Pan
  29: 'ニドラン♀',    // Nidoran Female
  30: 'ニドリーナ',    // Nidorina
  31: 'ニドクイン',    // Nidoqueen
  32: 'ニドラン♂',    // Nidoran Male
  33: 'ニドリーノ',    // Nidorino
  34: 'ニドキング',    // Nidoking
  35: 'ピッピ',    // Fairy
  36: 'ピクシー',    // Pixie
  37: 'ロコン',    // Six Tails
  38: 'キュウコン',    // Nine Tails
  39: 'プリン',    // Balloon
  40: 'プクリン',    // Balloon
  41: 'ズバット',    // Bat
  42: 'ゴルバット',    // Golbat
  43: 'ナゾノクサ',    // Mysterious Grass
  44: 'クサイハナ',    // Smelly Flower
  45: 'ラフレシア',    // Rafflesia
  46: 'パラス',    // Paras
  47: 'パラセクト',    // Parasect
  48: 'コンパン',    // Venonat
  49: 'モルフォン',    // Morphon
  50: 'ディグダ',    // Digda
  51: 'ダグトリオ',    // Dugtrio
  52: 'ニャース',    // Cat
  53: 'ペルシアン',    // Persian
  54: 'コダック',    // Duck
  55: 'ゴルダック',    // Golduck
  56: 'マンキー',    // Monkey
  57: 'オコリザル',    // Angry Monkey
  58: 'ガーディ',    // Guardie
  59: 'ウインディ',    // Windie
  60: 'ニョロモ',    // Nyoromo
  61: 'ニョロゾ',    // Nyorozo
  62: 'ニョロボン',    // Nyorobon
  63: 'ケーシィ',    // Casey
  64: 'ユンゲラー',    // Yungeler
  65: 'フーディン',    // Foodin
  66: 'ワンリキー',    // One Power
  67: 'ゴーリキー',    // Go Power
  68: 'カイリキー',    // Strong Power
  69: 'マダツボミ',    // Madatsubomi
  70: 'ウツドン',    // Utsudon
  71: 'ウツボット',    // Utsubot
  72: 'メノクラゲ',    // Menokurage
  73: 'ドククラゲ',    // Poison Jellyfish
  74: 'イシツブテ',    // Stone Fragment
  75: 'ゴローン',    // Goron
  76: 'ゴローニャ',    // Golonya
  77: 'ポニータ',    // Ponyta
  78: 'ギャロップ',    // Gallop
  79: 'ヤドン',    // Yadon
  80: 'ヤドラン',    // Yadoran
  81: 'コイル',    // Coil
  82: 'レアコイル',    // Rare Coil
  83: 'カモネギ',    // Duck Onion
  84: 'ドードー',    // Dodo
  85: 'ドードリオ',    // Dodrio
  86: 'パウワウ',    // Pauwau
  87: 'ジュゴン',    // Dugong
  88: 'ベトベター',    // Betobeter
  89: 'ベトベトン',    // Betobeton
  90: 'シェルダー',    // Shellder
  91: 'パルシェン',    // Parshen
  92: 'ゴース',    // Gas
  93: 'ゴースト',    // Ghost
  94: 'ゲンガー',    // Gengar
  95: 'イワーク',    // Iron Snake
  96: 'スリープ',    // Sleep
  97: 'スリーパー',    // Sleeper
  98: 'クラブ',    // Crab
  99: 'キングラー',    // Kingler
  100: 'ビリリダマ',    // Electric Ball
  101: 'マルマイン',    // Ball Mine
  102: 'タマタマ',    // Egg
  103: 'ナッシー',    // Coconut
  104: 'カラカラ',    // Skull
  105: 'ガラガラ',    // Rattle
  106: 'サワムラー',    // Sawamular
  107: 'エビワラー',    // Ebiwarar
  108: 'ベロリンガ',    // Licking Tongue
  109: 'ドガース',    // Dogas
  110: 'マタドガス',    // Matadogas
  111: 'サイホーン',    // Rhyhorn
  112: 'サイドン',    // Rhydon
  113: 'ラッキー',    // Lucky
  114: 'モンジャラ',    // Tangela
  115: 'ガルーラ',    // Kangaskhan
  116: 'タッツー',    // Horsea
  117: 'シードラ',    // Seadra
  118: 'トサキント',    // Goldfish
  119: 'アズマオウ',    // Seaking
  120: 'ヒトデマン',    // Starfish
  121: 'スターミー',    // Starmie
  122: 'バリヤード',    // Barrier
  123: 'ストライク',    // Strike
  124: 'ルージュラ',    // Jynx
  125: 'エレブー',    // Electabuzz
  126: 'ブーバー',    // Magmar
  127: 'カイロス',    // Pinsir
  128: 'ケンタロス',    // Tauros
  129: 'コイキング',    // Carp
  130: 'ギャラドス',    // Gyarados
  131: 'ラプラス',    // Lapras
  132: 'メタモン',    // Metamon
  133: 'イーブイ',    // Eevee
  134: 'シャワーズ',    // Showers
  135: 'サンダース',    // Thunders
  136: 'ブースター',    // Booster
  137: 'ポリゴン',    // Polygon
  138: 'オムナイト',    // Omanyte
  139: 'オムスター',    // Omastar
  140: 'カブト',    // Kabuto
  141: 'カブトプス',    // Kabutops
  142: 'プテラ',    // Aerodactyl
  143: 'カビゴン',    // Snorlax
  144: 'フリーザー',    // Freezer
  145: 'サンダー',    // Thunder
  146: 'ファイヤー',    // Fire
  147: 'ミニリュウ',    // Mini Dragon
  148: 'ハクリュー',    // Hakuryu
  149: 'カイリュー',    // Dragonite
  150: 'ミュウツー',    // Mewtwo
  151: 'ミュウ',    // Mew
  152: 'チコリータ',    // Leaf Pokémon
  153: 'ベイリーフ',    // Leaf Pokémon
  154: 'メガニウム',    // Herb Pokémon
  155: 'ヒノアラシ',    // Fire Mouse Pokémon
  156: 'マグマラシ',    // Volcano Pokémon
  157: 'バクフーン',    // Volcano Pokémon
  158: 'ワニノコ',    // Big Jaw Pokémon
  159: 'アリゲイツ',    // Big Jaw Pokémon
  160: 'オーダイル',    // Big Jaw Pokémon
  161: 'オタチ',    // Scout Pokémon
  162: 'オオタチ',    // Long Body Pokémon
  163: 'ホーホー',    // Owl Pokémon
  164: 'ヨルノズク',    // Owl Pokémon
  165: 'レディバ',    // Five Star Pokémon
  166: 'レディアン',    // Five Star Pokémon
  167: 'イトマル',    // String Spit Pokémon
  168: 'アリアドス',    // Long Leg Pokémon
  169: 'クロバット',    // Bat Pokémon
  170: 'チョンチー',    // Angler Pokémon
  171: 'ランターン',    // Light Pokémon
  172: 'ピチュー',    // Tiny Mouse Pokémon
  173: 'ピィ',    // Star Shape Pokémon
  174: 'ププリン',    // Balloon Pokémon
  175: 'トゲピー',    // Spike Ball Pokémon
  176: 'トゲチック',    // Happiness Pokémon
  177: 'ネイティ',    // Tiny Bird Pokémon
  178: 'ネイティオ',    // Mystic Pokémon
  179: 'メリープ',    // Wool Pokémon
  180: 'モココ',    // Wool Pokémon
  181: 'デンリュウ',    // Light Pokémon
  182: 'キレイハナ',    // Flower Pokémon
  183: 'マリル',    // Aqua Mouse Pokémon
  184: 'マリルリ',    // Aqua Rabbit Pokémon
  185: 'ウソッキー',    // Imitation Pokémon
  186: 'ニョロトノ',    // Frog Lord
  187: 'ハネッコ',    // Cottonweed Pokémon
  188: 'ポポッコ',    // Cottonweed Pokémon
  189: 'ワタッコ',    // Cottonweed Pokémon
  190: 'エイパム',    // Long Tail Pokémon
  191: 'ヒマナッツ',    // Seed Pokémon
  192: 'キマワリ',    // Sun Pokémon
  193: 'ヤンヤンマ',    // Clear Wing Pokémon
  194: 'ウパー',    // Water Fish Pokémon
  195: 'ヌオー',    // Water Fish Pokémon
  196: 'エーフィ',    // Sun Pokémon
  197: 'ブラッキー',    // Moonlight Pokémon
  198: 'ヤミカラス',    // Darkness Pokémon
  199: 'ヤドキング',    // Royal Pokémon
  200: 'ムウマ',    // Screech Pokémon
  201: 'アンノーン',    // Symbol Pokémon
  202: 'ソーナンス',    // Patient Pokémon
  203: 'キリンリキ',    // Long Neck Pokémon
  204: 'クヌギダマ',    // Bagworm Pokémon
  205: 'フォレトス',    // Bagworm Pokémon
  206: 'ノコッチ',    // Land Snake Pokémon
  207: 'グライガー',    // Fly Scorpion Pokémon
  208: 'ハガネール',    // Iron Snake Pokémon
  209: 'ブルー',    // Fairy Pokémon
  210: 'グランブル',    // Fairy Pokémon
  211: 'ハリーセン',    // Balloon Pokémon
  212: 'ハッサム',    // Pincer Pokémon
  213: 'ツボツボ',    // Mold Pokémon
  214: 'ヘラクロス',    // Single Horn Pokémon
  215: 'ニューラ',    // Sharp Claw Pokémon
  216: 'ヒメグマ',    // Little Bear Pokémon
  217: 'リングマ',    // Hibernator Pokémon
  218: 'マグマッグ',    // Lava Pokémon
  219: 'マグカルゴ',    // Lava Pokémon
  220: 'ウリムー',    // Pig Pokémon
  221: 'イノムー',    // Swine Pokémon
  222: 'サニーゴ',    // Coral Pokémon
  223: 'テッポウオ',    // Jet Pokémon
  224: 'オクタン',    // Jet Pokémon
  225: 'デリバード',    // Delivery Pokémon
  226: 'マンタイン',    // Kite Pokémon
  227: 'エアームド',    // Armor Bird Pokémon
  228: 'デルビル',    // Dark Pokémon
  229: 'ヘルガー',    // Dark Pokémon
  230: 'キングドラ',    // Dragon Pokémon
  231: 'ゴマゾウ',    // Long Nose Pokémon
  232: 'ドンファン',    // Armor Pokémon
  233: 'ポリゴン２',    // Virtual Pokémon
  234: 'オドシシ',    // Big Horn Pokémon
  235: 'ドーブル',    // Painter Pokémon
  236: 'バルキー',    // Scuffle Pokémon
  237: 'カポエラー',    // Handstand Pokémon
  238: 'ムチュール',    // Kiss Pokémon
  239: 'エレキッド',    // Electric Pokémon
  240: 'ブビィ',    // Live Coal Pokémon
  241: 'ミルタンク',    // Milk Cow Pokémon
  242: 'ハピナス',    // Happiness Pokémon
  243: 'ライコウ',    // Thunder Pokémon
  244: 'エンテイ',    // Volcano Pokémon
  245: 'スイクン',    // Aurora Pokémon
  246: 'ヨーギラス',    // Rock Skin Pokémon
  247: 'サナギラス',    // Hard Shell Pokémon
  248: 'バンギラス',    // Armor Pokémon
  249: 'ルギア',    // Diving Pokémon
  250: 'ホウオウ',    // Rainbow Pokémon
  251: 'セレビィ',    // Time Travel Pokémon
  252: 'キモリ',    // Wood Gecko Pokémon
  253: 'ジュプトル',    // Wood Gecko Pokémon
  254: 'ジュカイン',    // Forest Pokémon
  255: 'アチャモ',    // Chick Pokémon
  256: 'ワカシャモ',    // Young Fowl Pokémon
  257: 'バシャーモ',    // Blaze Pokémon
  258: 'ミズゴロウ',    // Mud Fish Pokémon
  259: 'ヌマクロー',    // Mud Fish Pokémon
  260: 'ラグラージ',    // Mud Fish Pokémon
  261: 'ポチエナ',    // Bite Pokémon
  262: 'グラエナ',    // Bite Pokémon
  263: 'ジグザグマ',    // Tiny Raccoon Pokémon
  264: 'マッスグマ',    // Rushing Pokémon
  265: 'ケムッソ',    // Worm Pokémon
  266: 'カラサリス',    // Cocoon Pokémon
  267: 'アゲハント',    // Butterfly Pokémon
  268: 'マユルド',    // Cocoon Pokémon
  269: 'ドクケイル',    // Poison Moth Pokémon
  270: 'ハスボー',    // Water Weed Pokémon
  271: 'ハスブレロ',    // Jolly Pokémon
  272: 'ルンパッパ',    // Carefree Pokémon
  273: 'タネボー',    // Acorn Pokémon
  274: 'コノハナ',    // Wily Pokémon
  275: 'ダーテング',    // Wicked Pokémon
  276: 'スバメ',    // Tiny Swallow Pokémon
  277: 'オオスバメ',    // Swallow Pokémon
  278: 'キャモメ',    // Seagull Pokémon
  279: 'ペリッパー',    // Water Bird Pokémon
  280: 'ラルトス',    // Feeling Pokémon
  281: 'キルリア',    // Emotion Pokémon
  282: 'サーナイト',    // Embrace Pokémon
  283: 'アメタマ',    // Pond Skater Pokémon
  284: 'アメモース',    // Eyeball Pokémon
  285: 'キノココ',    // Mushroom Pokémon
  286: 'キノガッサ',    // Mushroom Pokémon
  287: 'ナマケロ',    // Slacker Pokémon
  288: 'ヤルキモノ',    // Wild Monkey Pokémon
  289: 'ケッキング',    // Lazy Pokémon
  290: 'ツチニン',    // Trainee Pokémon
  291: 'テッカニン',    // Ninja Pokémon
  292: 'ヌケニン',    // Shed Pokémon
  293: 'ゴニョニョ',    // Whisper Pokémon
  294: 'ドゴーム',    // Big Voice Pokémon
  295: 'バクオング',    // Loud Noise Pokémon
  296: 'マクノシタ',    // Guts Pokémon
  297: 'ハリテヤマ',    // Arm Thrust Pokémon
  298: 'ルリリ',    // Polka Dot Pokémon
  299: 'ノズパス',    // Compass Pokémon
  300: 'エネコ',    // Kitten Pokémon
  301: 'エネコロロ',    // Prim Pokémon
  302: 'ヤミラミ',    // Darkness Pokémon
  303: 'クチート',    // Deceiver Pokémon
  304: 'ココドラ',    // Iron Armor Pokémon
  305: 'コドラ',    // Iron Armor Pokémon
  306: 'ボスゴドラ',    // Iron Armor Pokémon
  307: 'アサナン',    // Meditate Pokémon
  308: 'チャーレム',    // Meditate Pokémon
  309: 'ラクライ',    // Lightning Pokémon
  310: 'ライボルト',    // Discharge Pokémon
  311: 'プラスル',    // Cheering Pokémon
  312: 'マイナン',    // Cheering Pokémon
  313: 'バルビート',    // Firefly Pokémon
  314: 'イルミーゼ',    // Firefly Pokémon
  315: 'ロゼリア',    // Thorn Pokémon
  316: 'ゴクリン',    // Stomach Pokémon
  317: 'マルノーム',    // Poison Bag Pokémon
  318: 'キバニア',    // Savage Pokémon
  319: 'サメハダー',    // Brutal Pokémon
  320: 'ホエルコ',    // Ball Whale Pokémon
  321: 'ホエルオー',    // Float Whale Pokémon
  322: 'ドンメル',    // Numb Pokémon
  323: 'バクーダ',    // Eruption Pokémon
  324: 'コータス',    // Coal Pokémon
  325: 'バネブー',    // Bounce Pokémon
  326: 'ブーピッグ',    // Manipulate Pokémon
  327: 'パッチール',    // Spot Panda Pokémon
  328: 'ナックラー',    // Ant Pit Pokémon
  329: 'ビブラーバ',    // Vibration Pokémon
  330: 'フライゴン',    // Mystic Pokémon
  331: 'サボネア',    // Cactus Pokémon
  332: 'ノクタス',    // Scarecrow Pokémon
  333: 'チルット',    // Cotton Bird Pokémon
  334: 'チルタリス',    // Humming Pokémon
  335: 'ザングース',    // Cat Ferret Pokémon
  336: 'ハブネーク',    // Fang Snake Pokémon
  337: 'ルナトーン',    // Meteorite Pokémon
  338: 'ソルロック',    // Meteorite Pokémon
  339: 'ドジョッチ',    // Whiskers Pokémon
  340: 'ナマズン',    // Whiskers Pokémon
  341: 'ヘイガニ',    // Ruffian Pokémon
  342: 'シザリガー',    // Rogue Pokémon
  343: 'ヤジロン',    // Clay Doll Pokémon
  344: 'ネンドール',    // Clay Doll Pokémon
  345: 'リリーラ',    // Sea Lily Pokémon
  346: 'ユレイドル',    // Barnacle Pokémon
  347: 'アノプス',    // Old Shrimp Pokémon
  348: 'アーマルド',    // Plate Pokémon
  349: 'ヒンバス',    // Fish Pokémon
  350: 'ミロカロス',    // Tender Pokémon
  351: 'ポワルン',    // Weather Pokémon
  352: 'カクレオン',    // Color Swap Pokémon
  353: 'カゲボウズ',    // Puppet Pokémon
  354: 'ジュペッタ',    // Marionette Pokémon
  355: 'ヨマワル',    // Requiem Pokémon
  356: 'サマヨール',    // Beckon Pokémon
  357: 'トロピウス',    // Fruit Pokémon
  358: 'チリーン',    // Wind Chime Pokémon
  359: 'アブソル',    // Disaster Pokémon
  360: 'ソーナノ',    // Bright Pokémon
  361: 'ユキワラシ',    // Snow Hat Pokémon
  362: 'オニゴーリ',    // Face Pokémon
  363: 'タマザラシ',    // Clap Pokémon
  364: 'トドグラー',    // Ball Roll Pokémon
  365: 'トドゼルガ',    // Ice Break Pokémon
  366: 'パールル',    // Bivalve Pokémon
  367: 'ハンテール',    // Deep Sea Pokémon
  368: 'サクラビス',    // South Sea Pokémon
  369: 'ジーランス',    // Longevity Pokémon
  370: 'ラブカス',    // Rendezvous Pokémon
  371: 'タツベイ',    // Rock Head Pokémon
  372: 'コモルー',    // Endurance Pokémon
  373: 'ボーマンダ',    // Dragon Pokémon
  374: 'ダンバル',    // Iron Ball Pokémon
  375: 'メタング',    // Iron Claw Pokémon
  376: 'メタグロス',    // Iron Leg Pokémon
  377: 'レジロック',    // Rock Peak Pokémon
  378: 'レジアイス',    // Iceberg Pokémon
  379: 'レジスチル',    // Iron Pokémon
  380: 'ラティアス',    // Eon Pokémon
  381: 'ラティオス',    // Eon Pokémon
  382: 'カイオーガ',    // Sea Basin Pokémon
  383: 'グラードン',    // Continent Pokémon
  384: 'レックウザ',    // Sky High Pokémon
  385: 'ジラーチ',    // Wish Pokémon
  386: 'デオキシス',    // DNA Pokémon
  387: 'ナエトル',    // Tiny Leaf Pokémon
  388: 'ハヤシガメ',    // Grove Pokémon
  389: 'ドダイトス',    // Continent Pokémon
  390: 'ヒコザル',    // Chimp Pokémon
  391: 'モウカザル',    // Playful Pokémon
  392: 'ゴウカザル',    // Flame Pokémon
  393: 'ポッチャマ',    // Penguin Pokémon
  394: 'ポッタイシ',    // Penguin Pokémon
  395: 'エンペルト',    // Emperor Pokémon
  396: 'ムックル',    // Starling Pokémon
  397: 'ムクバード',    // Starling Pokémon
  398: 'ムクホーク',    // Predator Pokémon
  399: 'ビッパ',    // Plump Mouse Pokémon
  400: 'ビーダル',    // Beaver Pokémon
  401: 'コロボーシ',    // Cricket Pokémon
  402: 'コロトック',    // Cricket Pokémon
  403: 'コリンク',    // Flash Pokémon
  404: 'ルクシオ',    // Spark Pokémon
  405: 'レントラー',    // Gleam Eyes Pokémon
  406: 'スボミー',    // Bud Pokémon
  407: 'ロズレイド',    // Bouquet Pokémon
  408: 'ズガイドス',    // Head Butt Pokémon
  409: 'ラムパルド',    // Head Butt Pokémon
  410: 'タテトプス',    // Shield Pokémon
  411: 'トリデプス',    // Shield Pokémon
  412: 'ミノムッチ',    // Bagworm Pokémon
  413: 'ミノマダム',    // Bagworm Pokémon
  414: 'ガーメイル',    // Moth Pokémon
  415: 'ミツハニー',    // Tiny Bee Pokémon
  416: 'ビークイン',    // Beehive Pokémon
  417: 'パチリス',    // EleSquirrel Pokémon
  418: 'ブイゼル',    // Sea Weasel Pokémon
  419: 'フローゼル',    // Sea Weasel Pokémon
  420: 'チェリンボ',    // Cherry Pokémon
  421: 'チェリム',    // Blossom Pokémon
  422: 'カラナクシ',    // Sea Slug Pokémon
  423: 'トリトドン',    // Sea Slug Pokémon
  424: 'エテボース',    // Long Tail Pokémon
  425: 'フワンテ',    // Balloon Pokémon
  426: 'フワライド',    // Blimp Pokémon
  427: 'ミミロル',    // Rabbit Pokémon
  428: 'ミミロップ',    // Rabbit Pokémon
  429: 'ムウマージ',    // Magical Pokémon
  430: 'ドンカラス',    // Big Boss Pokémon
  431: 'ニャルマー',    // Catty Pokémon
  432: 'ブニャット',    // Tiger Cat Pokémon
  433: 'リーシャン',    // Bell Pokémon
  434: 'スカンプー',    // Skunk Pokémon
  435: 'スカタンク',    // Skunk Pokémon
  436: 'ドーミラー',    // Bronze Pokémon
  437: 'ドータクン',    // Bronze Bell Pokémon
  438: 'ウソハチ',    // Bonsai Pokémon
  439: 'マネネ',    // Mime Pokémon
  440: 'ピンプク',    // Playhouse Pokémon
  441: 'ペラップ',    // Music Note Pokémon
  442: 'ミカルゲ',    // Forbidden Pokémon
  443: 'フカマル',    // Land Shark Pokémon
  444: 'ガバイト',    // Cave Pokémon
  445: 'ガブリアス',    // Mach Pokémon
  446: 'ゴンベ',    // Big Eater Pokémon
  447: 'リオル',    // Emanation Pokémon
  448: 'ルカリオ',    // Aura Pokémon
  449: 'ヒポポタス',    // Hippo Pokémon
  450: 'カバルドン',    // Heavyweight Pokémon
  451: 'スコルピ',    // Scorpion Pokémon
  452: 'ドラピオン',    // Ogre Scorpion Pokémon
  453: 'グレッグル',    // Toxic Mouth Pokémon
  454: 'ドクロッグ',    // Toxic Mouth Pokémon
  455: 'マスキッパ',    // Bug Catcher Pokémon
  456: 'ケイコウオ',    // Wing Fish Pokémon
  457: 'ネオラント',    // Neon Pokémon
  458: 'タマンタ',    // Kite Pokémon
  459: 'ユキカブリ',    // Frost Tree Pokémon
  460: 'ユキノオー',    // Frost Tree Pokémon
  461: 'マニューラ',    // Sharp Claw Pokémon
  462: 'ジバコイル',    // Magnet Area Pokémon
  463: 'ベロベルト',    // Licking Pokémon
  464: 'ドサイドン',    // Drill Pokémon
  465: 'モジャンボ',    // Vine Pokémon
  466: 'エレキブル',    // Thunderbolt Pokémon
  467: 'ブーバーン',    // Blast Pokémon
  468: 'トゲキッス',    // Jubilee Pokémon
  469: 'メガヤンマ',    // Ogre Darner Pokémon
  470: 'リーフィア',    // Verdant Pokémon
  471: 'グレイシア',    // Fresh Snow Pokémon
  472: 'グライオン',    // Fang Scorpion Pokémon
  473: 'マンムー',    // Twin Tusk Pokémon
  474: 'ポリゴンＺ',    // Virtual Pokémon
  475: 'エルレイド',    // Blade Pokémon
  476: 'ダイノーズ',    // Compass Pokémon
  477: 'ヨノワール',    // Gripper Pokémon
  478: 'ユキメノコ',    // Snow Land Pokémon
  479: 'ロトム',    // Plasma Pokémon
  480: 'ユクシー',    // Knowledge Pokémon
  481: 'エムリット',    // Emotion Pokémon
  482: 'アグノム',    // Willpower Pokémon
  483: 'ディアルガ',    // Temporal Pokémon
  484: 'パルキア',    // Spatial Pokémon
  485: 'ヒードラン',    // Lava Dome Pokémon
  486: 'レジギガス',    // Colossal Pokémon
  487: 'ギラティナ',    // Renegade Pokémon
  488: 'クレセリア',    // Lunar Pokémon
  489: 'フィオネ',    // Sea Drifter Pokémon
  490: 'マナフィ',    // Seafaring Pokémon
  491: 'ダークライ',    // Pitch-Black Pokémon
  492: 'シェイミ',    // Gratitude Pokémon
  493: 'アルセウス',    // Alpha Pokémon
  494: 'ビクティニ',    // Victory Pokémon
  495: 'ツタージャ',    // Grass Snake Pokémon
  496: 'ジャノビー',    // Grass Snake Pokémon
  497: 'ジャローダ',    // Regal Pokémon
  498: 'ポカブ',    // Fire Pig Pokémon
  499: 'チャオブー',    // Fire Pig Pokémon
  500: 'エンブオー',    // Mega Fire Pig Pokémon
  501: 'ミジュマル',    // Sea Otter Pokémon
  502: 'フタチマル',    // Discipline Pokémon
  503: 'ダイケンキ',    // Formidable Pokémon
  504: 'ミネズミ',    // Scout Pokémon
  505: 'ミルホッグ',    // Lookout Pokémon
  506: 'ヨーテリー',    // Puppy Pokémon
  507: 'ハーデリア',    // Loyal Dog Pokémon
  508: 'ムーランド',    // Big-Hearted Pokémon
  509: 'チョロネコ',    // Devious Pokémon
  510: 'レパルダス',    // Cruel Pokémon
  511: 'ヤナップ',    // Grass Monkey Pokémon
  512: 'ヤナッキー',    // Thorn Monkey Pokémon
  513: 'バオップ',    // High Temp Pokémon
  514: 'バオッキー',    // Ember Pokémon
  515: 'ヒヤップ',    // Spray Pokémon
  516: 'ヒヤッキー',    // Geyser Pokémon
  517: 'ムンナ',    // Dream Eater Pokémon
  518: 'ムシャーナ',    // Drowsing Pokémon
  519: 'マメパト',    // Tiny Pigeon Pokémon
  520: 'ハトーボー',    // Wild Pigeon Pokémon
  521: 'ケンホロウ',    // Proud Pokémon
  522: 'シママ',    // Electrified Pokémon
  523: 'ゼブライカ',    // Thunderbolt Pokémon
  524: 'ダンゴロ',    // Mantle Pokémon
  525: 'ガントル',    // Ore Pokémon
  526: 'ギガイアス',    // Compressed Pokémon
  527: 'コロモリ',    // Bat Pokémon
  528: 'ココロモリ',    // Courting Pokémon
  529: 'モグリュー',    // Mole Pokémon
  530: 'ドリュウズ',    // Subterrene Pokémon
  531: 'タブンネ',    // Hearing Pokémon
  532: 'ドッコラー',    // Muscular Pokémon
  533: 'ドテッコツ',    // Muscular Pokémon
  534: 'ローブシン',    // Muscular Pokémon
  535: 'オタマロ',    // Tadpole Pokémon
  536: 'ガマガル',    // Vibration Pokémon
  537: 'ガマゲロゲ',    // Vibration Pokémon
  538: 'ナゲキ',    // Judo Pokémon
  539: 'ダゲキ',    // Karate Pokémon
  540: 'クルミル',    // Sewing Pokémon
  541: 'クルマユ',    // Leaf-Wrapped Pokémon
  542: 'ハハコモリ',    // Nurturing Pokémon
  543: 'フシデ',    // Centipede Pokémon
  544: 'ホイーガ',    // Curlipede Pokémon
  545: 'ペンドラー',    // Megapede Pokémon
  546: 'モンメン',    // Cotton Puff Pokémon
  547: 'エルフーン',    // Windveiled Pokémon
  548: 'チュリネ',    // Bulb Pokémon
  549: 'ドレディア',    // Flowering Pokémon
  550: 'バスラオ',    // Hostile Pokémon
  551: 'メグロコ',    // Desert Croc Pokémon
  552: 'ワルビル',    // Desert Croc Pokémon
  553: 'ワルビアル',    // Intimidation Pokémon
  554: 'ダルマッカ',    // Zen Charm Pokémon
  555: 'ヒヒダルマ',    // Blazing Pokémon
  556: 'マラカッチ',    // Cactus Pokémon
  557: 'イシズマイ',    // Rock Inn Pokémon
  558: 'イワパレス',    // Stone Home Pokémon
  559: 'ズルッグ',    // Shedding Pokémon
  560: 'ズルズキン',    // Hoodlum Pokémon
  561: 'シンボラー',    // Avianoid Pokémon
  562: 'デスマス',    // Spirit Pokémon
  563: 'デスカーン',    // Coffin Pokémon
  564: 'プロトーガ',    // Prototurtle Pokémon
  565: 'アバゴーラ',    // Prototurtle Pokémon
  566: 'アーケン',    // First Bird Pokémon
  567: 'アーケオス',    // First Bird Pokémon
  568: 'ヤブクロン',    // Trash Bag Pokémon
  569: 'ダストダス',    // Trash Heap Pokémon
  570: 'ゾロア',    // Tricky Fox Pokémon
  571: 'ゾロアーク',    // Illusion Fox Pokémon
  572: 'チラーミィ',    // Chinchilla Pokémon
  573: 'チラチーノ',    // Scarf Pokémon
  574: 'ゴチム',    // Fixation Pokémon
  575: 'ゴチミル',    // Manipulate Pokémon
  576: 'ゴチルゼル',    // Astral Body Pokémon
  577: 'ユニラン',    // Cell Pokémon
  578: 'ダブラン',    // Mitosis Pokémon
  579: 'ランクルス',    // Multiplying Pokémon
  580: 'コアルヒー',    // Water Bird Pokémon
  581: 'スワンナ',    // White Bird Pokémon
  582: 'バニプッチ',    // Fresh Snow Pokémon
  583: 'バニリッチ',    // Icy Snow Pokémon
  584: 'バイバニラ',    // Snowstorm Pokémon
  585: 'シキジカ',    // Season Pokémon
  586: 'メブキジカ',    // Season Pokémon
  587: 'エモンガ',    // Sky Squirrel Pokémon
  588: 'カブルモ',    // Clamping Pokémon
  589: 'シュバルゴ',    // Cavalry Pokémon
  590: 'タマゲタケ',    // Mushroom Pokémon
  591: 'モロバレル',    // Mushroom Pokémon
  592: 'プルリル',    // Floating Pokémon
  593: 'ブルンゲル',    // Floating Pokémon
  594: 'ママンボウ',    // Caring Pokémon
  595: 'バチュル',    // Attaching Pokémon
  596: 'デンチュラ',    // EleSpider Pokémon
  597: 'テッシード',    // Thorn Seed Pokémon
  598: 'ナットレイ',    // Thorn Pod Pokémon
  599: 'ギアル',    // Gear Pokémon
  600: 'ギギアル',    // Gear Pokémon
  601: 'ギギギアル',    // Gear Pokémon
  602: 'シビシラス',    // EleFish Pokémon
  603: 'シビビール',    // EleFish Pokémon
  604: 'シビルドン',    // EleFish Pokémon
  605: 'リグレー',    // Cerebral Pokémon
  606: 'オーベム',    // Cerebral Pokémon
  607: 'ヒトモシ',    // Candle Pokémon
  608: 'ランプラー',    // Lamp Pokémon
  609: 'シャンデラ',    // Luring Pokémon
  610: 'キバゴ',    // Tusk Pokémon
  611: 'オノンド',    // Axe Jaw Pokémon
  612: 'オノノクス',    // Axe Jaw Pokémon
  613: 'クマシュン',    // Chill Pokémon
  614: 'ツンベアー',    // Freezing Pokémon
  615: 'フリージオ',    // Crystallizing Pokémon
  616: 'チョボマキ',    // Snail Pokémon
  617: 'アギルダー',    // Shell Out Pokémon
  618: 'マッギョ',    // Trap Pokémon
  619: 'コジョフー',    // Martial Arts Pokémon
  620: 'コジョンド',    // Martial Arts Pokémon
  621: 'クリムガン',    // Cave Pokémon
  622: 'ゴビット',    // Automaton Pokémon
  623: 'ゴルーグ',    // Automaton Pokémon
  624: 'コマタナ',    // Sharp Blade Pokémon
  625: 'キリキザン',    // Sword Blade Pokémon
  626: 'バッフロン',    // Bash Buffalo Pokémon
  627: 'ワシボン',    // Eaglet Pokémon
  628: 'ウォーグル',    // Valiant Pokémon
  629: 'バルチャイ',    // Diapered Pokémon
  630: 'バルジーナ',    // Bone Vulture Pokémon
  631: 'クイタラン',    // Anteater Pokémon
  632: 'アイアント',    // Iron Ant Pokémon
  633: 'モノズ',    // Irate Pokémon
  634: 'ジヘッド',    // Hostile Pokémon
  635: 'サザンドラ',    // Brutal Pokémon
  636: 'メラルバ',    // Torch Pokémon
  637: 'ウルガモス',    // Sun Pokémon
  638: 'コバルオン',    // Iron Will Pokémon
  639: 'テラキオン',    // Cavern Pokémon
  640: 'ビリジオン',    // Grassland Pokémon
  641: 'トルネロス',    // Cyclone Pokémon
  642: 'ボルトロス',    // Bolt Strike Pokémon
  643: 'レシラム',    // Vast White Pokémon
  644: 'ゼクロム',    // Deep Black Pokémon
  645: 'ランドロス',    // Abundance Pokémon
  646: 'キュレム',    // Boundary Pokémon
  647: 'ケルディオ',    // Colt Pokémon
  648: 'メロエッタ',    // Melody Pokémon
  649: 'ゲノセクト',    // Paleozoic Pokémon
  650: 'ハリマロン',    // Spiny Nut Pokémon
  651: 'ハリボーグ',    // Spiny Armor Pokémon
  652: 'ブリガロン',    // Spiny Armor Pokémon
  653: 'フォッコ',    // Fox Pokémon
  654: 'テールナー',    // Fox Pokémon
  655: 'マフォクシー',    // Fox Pokémon
  656: 'ケロマツ',    // Bubble Frog Pokémon
  657: 'ゲコガシラ',    // Bubble Frog Pokémon
  658: 'ゲッコウガ',    // Ninja Pokémon
  659: 'ホルビー',    // Digging Pokémon
  660: 'ホルード',    // Digging Pokémon
  661: 'ヤヤコマ',    // Tiny Robin Pokémon
  662: 'ヒノヤコマ',    // Ember Pokémon
  663: 'ファイアロー',    // Scorching Pokémon
  664: 'コフキムシ',    // Scatterdust Pokémon
  665: 'コフーライ',    // Scatterdust Pokémon
  666: 'ビビヨン',    // Scale Pokémon
  667: 'シシコ',    // Lion Cub Pokémon
  668: 'カエンジシ',    // Royal Pokémon
  669: 'フラベベ',    // Single Bloom Pokémon
  670: 'フラエッテ',    // Single Bloom Pokémon
  671: 'フラージェス',    // Garden Pokémon
  672: 'メェークル',    // Mount Pokémon
  673: 'ゴーゴート',    // Mount Pokémon
  674: 'ヤンチャム',    // Playful Pokémon
  675: 'ゴロンダ',    // Daunting Pokémon
  676: 'トリミアン',    // Poodle Pokémon
  677: 'ニャスパー',    // Restraint Pokémon
  678: 'ニャオニクス',    // Constraint Pokémon
  679: 'ヒトツキ',    // Sword Pokémon
  680: 'ニダンギル',    // Sword Pokémon
  681: 'ギルガルド',    // Royal Sword Pokémon
  682: 'シュシュプ',    // Perfume Pokémon
  683: 'フレフワン',    // Fragrance Pokémon
  684: 'ペロッパフ',    // Cotton Candy Pokémon
  685: 'ペロリーム',    // Meringue Pokémon
  686: 'マーイーカ',    // Revolving Pokémon
  687: 'カラマネロ',    // Overturning Pokémon
  688: 'カメテテ',    // Two-Handed Pokémon
  689: 'ガメノデス',    // Collective Pokémon
  690: 'クズモー',    // Mock Kelp Pokémon
  691: 'ドラミドロ',    // Mock Kelp Pokémon
  692: 'ウデッポウ',    // Water Gun Pokémon
  693: 'ブロスター',    // Howitzer Pokémon
  694: 'エリキテル',    // Generator Pokémon
  695: 'エレザード',    // Generator Pokémon
  696: 'チゴラス',    // Royal Heir Pokémon
  697: 'ガチゴラス',    // Despot Pokémon
  698: 'アマルス',    // Tundra Pokémon
  699: 'アマルルガ',    // Tundra Pokémon
  700: 'ニンフィア',    // Intertwining Pokémon
  701: 'ルチャブル',    // Wrestling Pokémon
  702: 'デデンネ',    // Antenna Pokémon
  703: 'メレシー',    // Jewel Pokémon
  704: 'ヌメラ',    // Soft Tissue Pokémon
  705: 'ヌメイル',    // Soft Tissue Pokémon
  706: 'ヌメルゴン',    // Dragon Pokémon
  707: 'クレッフィ',    // Key Ring Pokémon
  708: 'ボクレー',    // Stump Pokémon
  709: 'オーロット',    // Elder Tree Pokémon
  710: 'バケッチャ',    // Pumpkin Pokémon
  711: 'パンプジン',    // Pumpkin Pokémon
  712: 'カチコール',    // Ice Chunk Pokémon
  713: 'クレベース',    // Iceberg Pokémon
  714: 'オンバット',    // Sound Wave Pokémon
  715: 'オンバーン',    // Sound Wave Pokémon
  716: 'ゼルネアス',    // Life Pokémon
  717: 'イベルタル',    // Destruction Pokémon
  718: 'ジガルデ',    // Order Pokémon
  719: 'ディアンシー',    // Jewel Pokémon
  720: 'フーパ',    // Mischief Pokémon
  721: 'ボルケニオン',    // Steam Pokémon
  722: 'モクロー',    // Grass Quill Pokémon
  723: 'フクスロー',    // Blade Quill Pokémon
  724: 'ジュナイパー',    // Arrow Quill Pokémon
  725: 'ニャビー',    // Fire Cat Pokémon
  726: 'ニャヒート',    // Fire Cat Pokémon
  727: 'ガオガエン',    // Heel Pokémon
  728: 'アシマリ',    // Sea Lion Pokémon
  729: 'オシャマリ',    // Pop Star Pokémon
  730: 'アシレーヌ',    // Soloist Pokémon
  731: 'ツツケラ',    // Woodpecker Pokémon
  732: 'ケララッパ',    // Bugle Beak Pokémon
  733: 'ドデカバシ',    // Cannon Pokémon
  734: 'ヤングース',    // Loitering Pokémon
  735: 'デカグース',    // Stakeout Pokémon
  736: 'アゴジムシ',    // Larva Pokémon
  737: 'デンヂムシ',    // Battery Pokémon
  738: 'クワガノン',    // Stag Beetle Pokémon
  739: 'マケンカニ',    // Boxing Pokémon
  740: 'ケケンカニ',    // Woolly Crab Pokémon
  741: 'オドリドリ',    // Dancing Pokémon
  742: 'アブリー',    // Bee Fly Pokémon
  743: 'アブリボン',    // Bee Fly Pokémon
  744: 'イワンコ',    // Puppy Pokémon
  745: 'ルガルガン',    // Wolf Pokémon
  746: 'ヨワシ',    // Small Fry Pokémon
  747: 'ヒドイデ',    // Brutal Star Pokémon
  748: 'ドヒドイデ',    // Brutal Star Pokémon
  749: 'ドロバンコ',    // Donkey Pokémon
  750: 'バンバドロ',    // Draft Horse Pokémon
  751: 'シズクモ',    // Water Bubble Pokémon
  752: 'オニシズクモ',    // Water Bubble Pokémon
  753: 'カリキリ',    // Sickle Grass Pokémon
  754: 'ラランテス',    // Bloom Sickle Pokémon
  755: 'ネマシュ',    // Illuminating Pokémon
  756: 'マシェード',    // Illuminating Pokémon
  757: 'ヤトウモリ',    // Toxic Lizard Pokémon
  758: 'エンニュート',    // Toxic Lizard Pokémon
  759: 'ヌイコグマ',    // Flailing Pokémon
  760: 'キテルグマ',    // Strong Arm Pokémon
  761: 'アマカジ',    // Fruit Pokémon
  762: 'アママイコ',    // Fruit Pokémon
  763: 'アマージョ',    // Fruit Pokémon
  764: 'キュワワー',    // Posy Picker Pokémon
  765: 'ヤレユータン',    // Sage Pokémon
  766: 'ナゲツケサル',    // Teamwork Pokémon
  767: 'コソクムシ',    // Turn Tail Pokémon
  768: 'グソクムシャ',    // Hard Scale Pokémon
  769: 'スナバァ',    // Sand Heap Pokémon
  770: 'シロデスナ',    // Sand Castle Pokémon
  771: 'ナマコブシ',    // Sea Cucumber Pokémon
  772: 'タイプ：ヌル',    // Synthetic Pokémon
  773: 'シルヴァディ',    // Synthetic Pokémon
  774: 'メテノ',    // Meteor Pokémon
  775: 'ネッコアラ',    // Drowsing Pokémon
  776: 'バクガメス',    // Blast Turtle Pokémon
  777: 'トゲデマル',    // Roly-Poly Pokémon
  778: 'ミミッキュ',    // Disguise Pokémon
  779: 'ハギギシリ',    // Gnash Teeth Pokémon
  780: 'ジジーロン',    // Placid Pokémon
  781: 'ダダリン',    // Sea Creeper Pokémon
  782: 'ジャラコ',    // Scaly Pokémon
  783: 'ジャランゴ',    // Scaly Pokémon
  784: 'ジャラランガ',    // Scaly Pokémon
  785: 'カプ・コケコ',    // Land Spirit Pokémon
  786: 'カプ・テテフ',    // Land Spirit Pokémon
  787: 'カプ・ブルル',    // Land Spirit Pokémon
  788: 'カプ・レヒレ',    // Land Spirit Pokémon
  789: 'コスモッグ',    // Nebula Pokémon
  790: 'コスモウム',    // Protostar Pokémon
  791: 'ソルガレオ',    // Sunne Pokémon
  792: 'ルナアーラ',    // Moone Pokémon
  793: 'ウツロイド',    // Parasite Pokémon
  794: 'マッシブーン',    // Swollen Pokémon
  795: 'フェローチェ',    // Lissome Pokémon
  796: 'デンジュモク',    // Glowing Pokémon
  797: 'テッカグヤ',    // Launch Pokémon
  798: 'カミツルギ',    // Drawn Sword Pokémon
  799: 'アクジキング',    // Junkivore Pokémon
  800: 'ネクロズマ',    // Prism Pokémon
  801: 'マギアナ',    // Artificial Pokémon
  802: 'マーシャドー',    // Gloomdweller Pokémon
  803: 'ベベノム',    // Poison Pin Pokémon
  804: 'アーゴヨン',    // Poison Pin Pokémon
  805: 'ツンデツンデ',    // Rampart Pokémon
  806: 'ズガドーン',    // Fireworks Pokémon
  807: 'ゼラオラ',    // Thunderclap Pokémon
  808: 'メルタン',    // Hex Nut Pokémon
  809: 'メルメタル',    // Hex Nut Pokémon
  810: 'サルノリ',    // Chimp Pokémon
  811: 'バチンキー',    // Beat Pokémon
  812: 'ゴリランダー',    // Drummer Pokémon
  813: 'ヒバニー',    // Rabbit Pokémon
  814: 'ラビフット',    // Rabbit Pokémon
  815: 'エースバーン',    // Striker Pokémon
  816: 'メッソン',    // Water Lizard Pokémon
  817: 'ジメレオン',    // Water Lizard Pokémon
  818: 'インテレオン',    // Secret Agent Pokémon
  819: 'ホシガリス',    // Cheeky Pokémon
  820: 'ヨクバリス',    // Greedy Pokémon
  821: 'ココガラ',    // Tiny Bird Pokémon
  822: 'アオガラス',    // Raven Pokémon
  823: 'アーマーガア',    // Raven Pokémon
  824: 'サッチムシ',    // Larva Pokémon
  825: 'レドームシ',    // Radome Pokémon
  826: 'イオルブ',    // Seven Spot Pokémon
  827: 'クスネ',    // Fox Pokémon
  828: 'フォクスライ',    // Fox Pokémon
  829: 'ヒメンカ',    // Flowering Pokémon
  830: 'ワタシラガ',    // Cotton Bloom Pokémon
  831: 'ウールー',    // Sheep Pokémon
  832: 'バイウールー',    // Sheep Pokémon
  833: 'カムカメ',    // Snapping Pokémon
  834: 'カジリガメ',    // Bite Pokémon
  835: 'ワンパチ',    // Puppy Pokémon
  836: 'パルスワン',    // Dog Pokémon
  837: 'タンドン',    // Coal Pokémon
  838: 'トロッゴン',    // Coal Pokémon
  839: 'セキタンザン',    // Coal Pokémon
  840: 'カジッチュ',    // Apple Core Pokémon
  841: 'アップリュー',    // Apple Wing Pokémon
  842: 'タルップル',    // Apple Nectar Pokémon
  843: 'スナヘビ',    // Sand Snake Pokémon
  844: 'サダイジャ',    // Sand Snake Pokémon
  845: 'ウッウ',    // Gulp Pokémon
  846: 'サシカマス',    // Rush Pokémon
  847: 'カマスジョー',    // Skewer Pokémon
  848: 'エレズン',    // Baby Pokémon
  849: 'ストリンダー',    // Punk Pokémon
  850: 'ヤクデ',    // Radiator Pokémon
  851: 'マルヤクデ',    // Radiator Pokémon
  852: 'タタッコ',    // Tantrum Pokémon
  853: 'オトスパス',    // Jujitsu Pokémon
  854: 'ヤバチャ',    // Black Tea Pokémon
  855: 'ポットデス',    // Black Tea Pokémon
  856: 'ミブリム',    // Calm Pokémon
  857: 'テブリム',    // Serene Pokémon
  858: 'ブリムオン',    // Silent Pokémon
  859: 'ベロバー',    // Wily Pokémon
  860: 'ギモー',    // Devious Pokémon
  861: 'オーロンゲ',    // Bulk Up Pokémon
  862: 'タチフサグマ',    // Blocking Pokémon
  863: 'ニャイキング',    // Viking Pokémon
  864: 'サニゴーン',    // Coral Pokémon
  865: 'ネギガナイト',    // Wild Duck Pokémon
  866: 'バリコオル',    // Comedian Pokémon
  867: 'デスバーン',    // Grudge Pokémon
  868: 'マホミル',    // Cream Pokémon
  869: 'マホイップ',    // Cream Pokémon
  870: 'タイレーツ',    // Formation Pokémon
  871: 'バチンウニ',    // Sea Urchin Pokémon
  872: 'ユキハミ',    // Worm Pokémon
  873: 'モスノウ',    // Frost Moth Pokémon
  874: 'イシヘンジン',    // Big Rock Pokémon
  875: 'コオリッポ',    // Penguin Pokémon
  876: 'イエッサン',    // Emotion Pokémon
  877: 'モルペコ',    // Two-Sided Pokémon
  878: 'ゾウドウ',    // Copperderm Pokémon
  879: 'ダイオウドウ',    // Copperderm Pokémon
  880: 'パッチラゴン',    // Fossil Pokémon
  881: 'パッチルドン',    // Fossil Pokémon
  882: 'ウオノラゴン',    // Fossil Pokémon
  883: 'ウオチルドン',    // Fossil Pokémon
  884: 'ジュラルドン',    // Alloy Pokémon
  885: 'ドラメシヤ',    // Lingering Pokémon
  886: 'ドロンチ',    // Caretaker Pokémon
  887: 'ドラパルト',    // Stealth Pokémon
  888: 'ザシアン',    // Warrior Pokémon
  889: 'ザマゼンタ',    // Warrior Pokémon
  890: 'ムゲンダイナ',    // Gigantic Pokémon
  891: 'ダクマ',    // Wushu Pokémon
  892: 'ウーラオス',    // Wushu Pokémon
  893: 'ザルード',    // Rogue Monkey Pokémon
  894: 'レジエレキ',    // Electron Pokémon
  895: 'レジドラゴ',    // Dragon Orb Pokémon
  896: 'ブリザポス',    // Wild Horse Pokémon
  897: 'レイスポス',    // Swift Horse Pokémon
  898: 'バドレックス',    // King Pokémon
  899: 'アヤシシ',    // Big Horn Pokémon
  900: 'バサギリ',    // Axe Pokémon
  901: 'ガチグマ',    // Peat Pokémon
  902: 'イダイトウ',    // Big Fish Pokémon
  903: 'オオニューラ',    // Free Climb Pokémon
  904: 'ハリーマン',    // Pin Cluster Pokémon
  905: 'ラブトロス',    // Love-Hate Pokémon
  906: 'ニャオハ',    // Grass Cat Pokémon
  907: 'ニャローテ',    // Grass Cat Pokémon
  908: 'マスカーニャ',    // Magician Pokémon
  909: 'ホゲータ',    // Fire Croc Pokémon
  910: 'アチゲータ',    // Fire Croc Pokémon
  911: 'ラウドボーン',    // Singer Pokémon
  912: 'クワッス',    // Duckling Pokémon
  913: 'ウェルカモ',    // Practicing Pokémon
  914: 'ウェーニバル',    // Dancer Pokémon
  915: 'グルトン',    // Hog Pokémon
  916: 'パフュートン',    // Hog Pokémon
  917: 'タマンチュラ',    // String Ball Pokémon
  918: 'ワナイダー',    // Trap Pokémon
  919: 'マメバッタ',    // Grasshopper Pokémon
  920: 'エクスレッグ',    // Grasshopper Pokémon
  921: 'パモ',    // Mouse Pokémon
  922: 'パモット',    // Mouse Pokémon
  923: 'パーモット',    // Hands-On Pokémon
  924: 'ワッカネズミ',    // Couple Pokémon
  925: 'イッカネズミ',    // Family Pokémon
  926: 'パピモッチ',    // Puppy Pokémon
  927: 'バウッツェル',    // Dog Pokémon
  928: 'ミニーブ',    // Olive Pokémon
  929: 'オリーニョ',    // Olive Pokémon
  930: 'オリーヴァ',    // Olive Pokémon
  931: 'イキリンコ',    // Parrot Pokémon
  932: 'コジオ',    // Rock Salt Pokémon
  933: 'ジオヅム',    // Rock Salt Pokémon
  934: 'キョジオーン',    // Rock Salt Pokémon
  935: 'カルボウ',    // Fire Child Pokémon
  936: 'グレンアルマ',    // Fire Warrior Pokémon
  937: 'ソウブレイズ',    // Fire Blades Pokémon
  938: 'ズピカ',    // EleTadpole Pokémon
  939: 'ハラバリー',    // EleFrog Pokémon
  940: 'カイデン',    // Storm Petrel Pokémon
  941: 'タイカイデン',    // Frigatebird Pokémon
  942: 'オラチフ',    // Rascal Pokémon
  943: 'マフィティフ',    // Boss Pokémon
  944: 'シルシュルー',    // Toxic Mouse Pokémon
  945: 'タギングル',    // Toxic Monkey Pokémon
  946: 'アノクサ',    // Tumbleweed Pokémon
  947: 'アノホラグサ',    // Tumbleweed Pokémon
  948: 'ノノクラゲ',    // Woodear Pokémon
  949: 'リククラゲ',    // Woodear Pokémon
  950: 'ガケガニ',    // Ambush Pokémon
  951: 'カプサイジ',    // Spicy Pepper Pokémon
  952: 'スコヴィラン',    // Spicy Pepper Pokémon
  953: 'シガロコ',    // Rolling Pokémon
  954: 'ベラカス',    // Rolling Pokémon
  955: 'ヒラヒナ',    // Frill Pokémon
  956: 'クエスパトラ',    // Ostrich Pokémon
  957: 'カヌチャン',    // Metalsmith Pokémon
  958: 'ナカヌチャン',    // Hammer Pokémon
  959: 'デカヌチャン',    // Hammer Pokémon
  960: 'ウミディグダ',    // Garden Eel Pokémon
  961: 'ウミトリオ',    // Garden Eel Pokémon
  962: 'オトシドリ',    // Item Drop Pokémon
  963: 'ナミイルカ',    // Dolphin Pokémon
  964: 'イルカマン',    // Dolphin Pokémon
  965: 'ブロロン',    // Single-Cyl Pokémon
  966: 'ブロロローム',    // Multi-Cyl Pokémon
  967: 'モトトカゲ',    // Mount Pokémon
  968: 'ミミズズ',    // Earthworm Pokémon
  969: 'キラーメ',    // Ore Pokémon
  970: 'キラフロル',    // Ore Pokémon
  971: 'ボチ',    // Ghost Dog Pokémon
  972: 'ハカドッグ',    // Ghost Dog Pokémon
  973: 'カラミンゴ',    // Synchronize Pokémon
  974: 'アルクジラ',    // Terra Whale Pokémon
  975: 'ハルクジラ',    // Terra Whale Pokémon
  976: 'ミガルーサ',    // Jettison Pokémon
  977: 'ヘイラッシャ',    // Big Catfish Pokémon
  978: 'シャリタツ',    // Mimicry Pokémon
  979: 'コノヨザル',    // Rage Monkey Pokémon
  980: 'ドオー',    // Spiny Fish Pokémon
  981: 'リキキリン',    // Long Neck Pokémon
  982: 'ノココッチ',    // Land Snake Pokémon
  983: 'ドドゲザン',    // Big Blade Pokémon
  984: 'イダイナキバ',    // Paradox Pokémon
  985: 'サケブシッポ',    // Paradox Pokémon
  986: 'アラブルタケ',    // Paradox Pokémon
  987: 'ハバタクカミ',    // Paradox Pokémon
  988: 'チヲハウハネ',    // Paradox Pokémon
  989: 'スナノケガワ',    // Paradox Pokémon
  990: 'テツノワダチ',    // Paradox Pokémon
  991: 'テツノツツミ',    // Paradox Pokémon
  992: 'テツノカイナ',    // Paradox Pokémon
  993: 'テツノコウベ',    // Paradox Pokémon
  994: 'テツノドクガ',    // Paradox Pokémon
  995: 'テツノイバラ',    // Paradox Pokémon
  996: 'セビエ',    // Ice Fin Pokémon
  997: 'セゴール',    // Ice Fin Pokémon
  998: 'セグレイブ',    // Ice Dragon Pokémon
  999: 'コレクレー',    // Coin Chest Pokémon
  1000: 'サーフゴー',    // Coin Entity Pokémon
  1001: 'チオンジェン',    // Ruinous Pokémon
  1002: 'パオジアン',    // Ruinous Pokémon
  1003: 'ディンルー',    // Ruinous Pokémon
  1004: 'イーユイ',    // Ruinous Pokémon
  1005: 'トドロクツキ',    // Paradox Pokémon
  1006: 'テツノブジン',    // Paradox Pokémon
  1007: 'コライドン',    // Paradox Pokémon
  1008: 'ミライドン',    // Paradox Pokémon
  1009: 'ウネルミナモ',    // Paradox Pokémon
  1010: 'テツノイサハ',    // Paradox Pokémon
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
    'かえん': 'Kaen',
    'みずがめ': 'Mizugame',
    'ねずみ': 'Nezumi',
    'つばさ': 'Tsubasa',
    'へび': 'Hebi',
    'どくばち': 'Dokubachi',
    'いし': 'Ishi',
    'ゴースト': 'Goosuto',
    'ドラゴン': 'Doragon',
    'あく': 'Aku',
    'はがね': 'Hagane',
    'フェアリー': 'Fearii',
    'ポケモン': 'Pokemon'
  }
  
  let result = japaneseText
  for (const [japanese, romaji] of Object.entries(basicConversions)) {
    result = result.replace(new RegExp(japanese, 'g'), romaji)
  }
  
  return result
}
