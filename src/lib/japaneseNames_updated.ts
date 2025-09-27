// Japanese Pokemon names with romaji, pronunciation, and meaning
export interface JapaneseNameInfo {
  japanese: string
  romaji: string
  pronunciation: string
  meaning: string
  explanation?: string
}

// Pokemon-specific Japanese names with romaji, pronunciation, meanings, and explanations
const japaneseNames: Record<string, JapaneseNameInfo> = {
  'フシギダネ': {

    japanese: 'フシギダネ',
    romaji: 'Fushigidane',
    pronunciation: 'foo-SHEE-ghee-dah-neh',
    meaning: 'Mysterious Seed (不思議 + 種)',
    explanation: 'From 不思議 (fushigi, strange/mysterious) + 種 (tane, seed). Also wordplay on "Fushigi da ne?" meaning "Isn't it strange?"'t it strange?"'
  
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
    meaning: 'Turtle (亀 + turtle)',
    explanation: '亀 (kame, turtle) + "ru" (possibly from tail or as a name ending).'
  },
  'カメックス': {
japanese: 'カメックス',
    romaji: 'Kamekkusu',
    pronunciation: 'kah-MEHK-koo-soo',
    meaning: 'Turtle Max (亀 + max)',
    explanation: '亀 (kame, turtle) + "x" (from "max" or "ex" for extra/largest).'
  },
  'ピカチュウ': {
japanese: 'ピカチュウ',
    romaji: 'Pikachuu',
    pronunciation: 'pee-KAH-choo',
    meaning: 'Spark Mouse (ピカピカ + チュウ)',
    explanation: 'ピカピカ (pika-pika, sparkle) + チュウ (chū, mouse squeak).'
  },
  'ライチュウ': {
japanese: 'ライチュウ',
    romaji: 'Raichuu',
    pronunciation: 'RYE-choo',
    meaning: 'Thunder Mouse (雷 + チュウ)',
    explanation: '雷 (rai, thunder) + チュウ (chū, mouse squeak).'
  },
  'オニスズメ': {
japanese: 'オニスズメ',
    romaji: 'Onisuzume',
    pronunciation: 'oh-nee-soo-ZEH-meh',
    meaning: 'Demon Sparrow (鬼 + 雀)',
    explanation: '鬼 (oni, demon) + 雀 (suzume, sparrow).'
  },
  'オニドリル': {
japanese: 'オニドリル',
    romaji: 'Onidoriru',
    pronunciation: 'oh-nee-doh-REE-ru',
    meaning: 'Demon Drill (鬼 + ドリル)',
    explanation: '鬼 (oni, demon) + ドリル (doriru, drill).'
  },
  'アーボ': {
japanese: 'アーボ',
    romaji: 'Aabo',
    pronunciation: 'AH-boh',
    meaning: 'Boa (from "boa" snake)',
    explanation: '"Boa" spelled backwards.'
  },
  'アーボック': {
japanese: 'アーボック',
    romaji: 'Aabokku',
    pronunciation: 'AH-bohk-koo',
    meaning: 'Cobra (boa + cobra)',
    explanation: '"Cobra" spelled backwards.'
  },
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
    meaning: 'Worm Pokémon',
    explanation: 'From English "caterpillar" + "p" (possibly from "pupa" or "petite").'
  },
  'トランセル': {
japanese: 'トランセル',
    romaji: 'toranseru',
    pronunciation: 'to-ra-nse-ru',
    meaning: 'Cocoon Pokémon',
    explanation: '"Transform" + "cell" (referring to metamorphosis).'
  },
  'バタフリー': {
japanese: 'バタフリー',
    romaji: 'batafuri-',
    pronunciation: 'ba-ta-fu-ri-',
    meaning: 'Butterfly Pokémon',
    explanation: 'From English "butterfly" + "free."'
  },
  'ビードル': {
japanese: 'ビードル',
    romaji: 'bi-doru',
    pronunciation: 'bi--do-ru',
    meaning: 'Hairy Bug Pokémon',
    explanation: '"Bee" + "needle" (referring to its stinger).'
  },
  'コクーン': {
japanese: 'コクーン',
    romaji: 'koku-n',
    pronunciation: 'ko-ku--n',
    meaning: 'Cocoon Pokémon',
    explanation: 'From English "cocoon."'
  },
  'スピアー': {
japanese: 'スピアー',
    romaji: 'supia-',
    pronunciation: 'su-pi-a-',
    meaning: 'Poison Bee Pokémon',
    explanation: 'From English "spear" (refers to its stingers).'
  },
  'ポッポ': {
japanese: 'ポッポ',
    romaji: 'potsupo',
    pronunciation: 'po-tsu-po',
    meaning: 'Tiny Bird Pokémon',
    explanation: 'Onomatopoeia for a pigeon's cooing.'
  },
  'ピジョン': {
japanese: 'ピジョン',
    romaji: 'pijon',
    pronunciation: 'pi-jo-n',
    meaning: 'Bird Pokémon',
    explanation: 'From English "pigeon."'
  },
  'ピジョット': {
japanese: 'ピジョット',
    romaji: 'pijotsuto',
    pronunciation: 'pi-jo-tsu-to',
    meaning: 'Bird Pokémon',
    explanation: '"Pigeon" + ending for emphasis.'
  },
  'コラッタ': {
japanese: 'コラッタ',
    romaji: 'koratsuta',
    pronunciation: 'ko-ra-tsu-ta',
    meaning: 'Mouse Pokémon',
    explanation: '子 (ko, child) + ratta (from "rat").'
  },
  'ラッタ': {
japanese: 'ラッタ',
    romaji: 'ratsuta',
    pronunciation: 'ra-tsu-ta',
    meaning: 'Mouse Pokémon',
    explanation: 'From English "rat."'
  },
  'サンド': {
japanese: 'サンド',
    romaji: 'sando',
    pronunciation: 'sa-ndo',
    meaning: 'Mouse Pokémon',
    explanation: 'From English "sand."'
  },
  'サンドパン': {
japanese: 'サンドパン',
    romaji: 'sandopan',
    pronunciation: 'sa-ndo-pa-n',
    meaning: 'Mouse Pokémon',
    explanation: '"Sand" + "pangolin."'
  },
  'ロコン': {
japanese: 'ロコン',
    romaji: 'rokon',
    pronunciation: 'ro-ko-n',
    meaning: 'Fox Pokémon',
    explanation: '六 (roku, six) + 尾 (kon, tail/fox).'
  },
  'キュウコン': {
japanese: 'キュウコン',
    romaji: 'kyuukon',
    pronunciation: 'kyu-u-ko-n',
    meaning: 'Fox Pokémon',
    explanation: '九 (kyū, nine) + 尾 (kon, tail/fox).'
  },
  'プリン': {
japanese: 'プリン',
    romaji: 'purin',
    pronunciation: 'pu-ri-n',
    meaning: 'Balloon Pokémon',
    explanation: 'From English "pudding" (refers to its soft, bouncy shape).'
  },
  'プクリン': {
japanese: 'プクリン',
    romaji: 'pukurin',
    pronunciation: 'pu-ku-ri-n',
    meaning: 'Balloon Pokémon',
    explanation: 'ぷくぷく (puku-puku, puffy) + "rin" (ring or cute suffix).'
  },
  'ズバット': {
japanese: 'ズバット',
    romaji: 'zubatsuto',
    pronunciation: 'zu-ba-tsu-to',
    meaning: 'Bat Pokémon',
    explanation: 'Onomatopoeia for something cutting through air ("zubat").'
  },
  'ゴルバット': {
japanese: 'ゴルバット',
    romaji: 'gorubatsuto',
    pronunciation: 'go-ru-ba-tsu-to',
    meaning: 'Bat Pokémon',
    explanation: 'Possibly "gorge" + "bat."'
  },
  'ナゾノクサ': {
japanese: 'ナゾノクサ',
    romaji: 'nazonokusa',
    pronunciation: 'na-zo-no-ku-sa',
    meaning: 'Weed Pokémon',
    explanation: '謎 (nazo, mystery) + 草 (kusa, grass).'
  },
  'クサイハナ': {
japanese: 'クサイハナ',
    romaji: 'kusaihana',
    pronunciation: 'ku-sa-i-ha-na',
    meaning: 'Weed Pokémon',
    explanation: '臭い (kusai, smelly) + 花 (hana, flower).'
  },
  'ラフレシア': {
japanese: 'ラフレシア',
    romaji: 'rafureshia',
    pronunciation: 'ra-fu-re-shi-a',
    meaning: 'Flower Pokémon',
    explanation: 'From "Rafflesia," a genus of parasitic plants with a strong odor.'
  },
  'パラス': {
japanese: 'パラス',
    romaji: 'parasu',
    pronunciation: 'pa-ra-su',
    meaning: 'Mushroom Pokémon',
    explanation: 'From English "parasite."'
  },
  'パラセクト': {
japanese: 'パラセクト',
    romaji: 'parasekuto',
    pronunciation: 'pa-ra-se-ku-to',
    meaning: 'Mushroom Pokémon',
    explanation: '"Parasite" + "insect."'
  },
  'コンパン': {
japanese: 'コンパン',
    romaji: 'konpan',
    pronunciation: 'ko-npa-n',
    meaning: 'Insect Pokémon',
    explanation: '粉 (kona, powder) + "pan" (from "pan" as in bread, or "pan" as in panicked).'
  },
  'モルフォン': {
japanese: 'モルフォン',
    romaji: 'morufuon',
    pronunciation: 'mo-ru-fu-o-n',
    meaning: 'Poison Moth Pokémon',
    explanation: '"Morph" + "moth."'
  },
  'ディグダ': {
japanese: 'ディグダ',
    romaji: 'deiguda',
    pronunciation: 'de-i-gu-da',
    meaning: 'Mole Pokémon',
    explanation: 'From English "dig."'
  },
  'ダグトリオ': {
japanese: 'ダグトリオ',
    romaji: 'dagutorio',
    pronunciation: 'da-gu-to-ri-o',
    meaning: 'Mole Pokémon',
    explanation: '"Dug" + "trio."'
  },
  'ニャース': {
japanese: 'ニャース',
    romaji: 'nya-su',
    pronunciation: 'nya--su',
    meaning: 'Scratch Cat Pokémon',
    explanation: '"Nyaa" (Japanese onomatopoeia for "meow") + "th."'
  },
  'ペルシアン': {
japanese: 'ペルシアン',
    romaji: 'perushian',
    pronunciation: 'pe-ru-shi-a-n',
    meaning: 'Classy Cat Pokémon',
    explanation: 'From English "Persian" (cat breed).'
  },
  'コダック': {
japanese: 'コダック',
    romaji: 'kodatsuku',
    pronunciation: 'ko-da-tsu-ku',
    meaning: 'Duck Pokémon',
    explanation: '子 (ko, child) + "duck."'
  },
  'ゴルダック': {
japanese: 'ゴルダック',
    romaji: 'gorudatsuku',
    pronunciation: 'go-ru-da-tsu-ku',
    meaning: 'Duck Pokémon',
    explanation: 'From English "gold" + "duck."'
  },
  'マンキー': {
japanese: 'マンキー',
    romaji: 'manki-',
    pronunciation: 'ma-nki-',
    meaning: 'Pig Monkey Pokémon',
    explanation: 'From English "monkey."'
  },
  'オコリザル': {
japanese: 'オコリザル',
    romaji: 'okorizaru',
    pronunciation: 'o-ko-ri-za-ru',
    meaning: 'Pig Monkey Pokémon',
    explanation: '怒り (okori, anger) + 猿 (zaru, monkey).'
  },
  'ガーディ': {
japanese: 'ガーディ',
    romaji: 'ga-dei',
    pronunciation: 'ga--de-i',
    meaning: 'Puppy Pokémon',
    explanation: 'From "guard" (as in guard dog).'
  },
  'ウインディ': {
japanese: 'ウインディ',
    romaji: 'uindei',
    pronunciation: 'u-i-nde-i',
    meaning: 'Legendary Pokémon',
    explanation: 'From English "windy."'
  },
  'ニョロモ': {
japanese: 'ニョロモ',
    romaji: 'nyoromo',
    pronunciation: 'nyo-ro-mo',
    meaning: 'Tadpole Pokémon',
    explanation: 'にょろにょろ (nyoro-nyoro, wriggling) + "mo" (suffix).'
  },
  'ニョロゾ': {
japanese: 'ニョロゾ',
    romaji: 'nyorozo',
    pronunciation: 'nyo-ro-zo',
    meaning: 'Tadpole Pokémon',
    explanation: '"Nyoronyoro" (wriggling) + "zo" (zone/growth).'
  },
  'ニョロボン': {
japanese: 'ニョロボン',
    romaji: 'nyorobon',
    pronunciation: 'nyo-ro-bo-n',
    meaning: 'Tadpole Pokémon',
    explanation: '"Nyoronyoro" + "bon" (onomatopoeia for a punch).'
  },
  'ケーシィ': {
japanese: 'ケーシィ',
    romaji: 'ke-shii',
    pronunciation: 'ke--shi-i',
    meaning: 'Psi Pokémon',
    explanation: 'From Edgar Cayce, famous psychic.'
  },
  'ユンゲラー': {
japanese: 'ユンゲラー',
    romaji: 'yungera-',
    pronunciation: 'yu-nge-ra-',
    meaning: 'Psi Pokémon',
    explanation: 'Named after Uri Geller, famous psychic/illusionist.'
  },
  'フーディン': {
japanese: 'フーディン',
    romaji: 'fu-dein',
    pronunciation: 'fu--de-i-n',
    meaning: 'Psi Pokémon',
    explanation: 'After Harry Houdini, famous magician.'
  },
  'ワンリキー': {
japanese: 'ワンリキー',
    romaji: 'wanriki-',
    pronunciation: 'wa-nri-ki-',
    meaning: 'Superpower Pokémon',
    explanation: '腕力 (wanryoku, physical strength).'
  },
  'ゴーリキー': {
japanese: 'ゴーリキー',
    romaji: 'go-riki-',
    pronunciation: 'go--ri-ki-',
    meaning: 'Superpower Pokémon',
    explanation: '豪力 (gōriki, great strength).'
  },
  'カイリキー': {
japanese: 'カイリキー',
    romaji: 'kairiki-',
    pronunciation: 'ka-i-ri-ki-',
    meaning: 'Superpower Pokémon',
    explanation: '怪力 (kairiki, superhuman strength).'
  },
  'マダツボミ': {
japanese: 'マダツボミ',
    romaji: 'madatsubomi',
    pronunciation: 'ma-da-tsu-bo-mi',
    meaning: 'Flower Pokémon',
    explanation: 'まだ (mada, not yet) + 蕾 (tsubomi, bud).'
  },
  'ウツドン': {
japanese: 'ウツドン',
    romaji: 'utsudon',
    pronunciation: 'u-tsu-do-n',
    meaning: 'Flycatcher Pokémon',
    explanation: '"Utsuwa" (vessel/pitcher) + "don" (suffix for large creatures).'
  },
  'ウツボット': {
japanese: 'ウツボット',
    romaji: 'utsubotsuto',
    pronunciation: 'u-tsu-bo-tsu-to',
    meaning: 'Flycatcher Pokémon',
    explanation: '"Utsuwa" + "bot" (from "bot" or "pot").'
  },
  'メノクラゲ': {
japanese: 'メノクラゲ',
    romaji: 'menokurage',
    pronunciation: 'me-no-ku-ra-ge',
    meaning: 'Jellyfish Pokémon',
    explanation: '目 (me, eye) + 海月 (kurage, jellyfish).'
  },
  'ドククラゲ': {
japanese: 'ドククラゲ',
    romaji: 'dokukurage',
    pronunciation: 'do-ku-ku-ra-ge',
    meaning: 'Jellyfish Pokémon',
    explanation: '毒 (doku, poison) + 海月 (kurage, jellyfish).'
  },
  'イシツブテ': {
japanese: 'イシツブテ',
    romaji: 'ishitsubute',
    pronunciation: 'i-shi-tsu-bu-te',
    meaning: 'Rock Pokémon',
    explanation: '石 (ishi, stone) + つぶて (tsubute, throwing stone).'
  },
  'ゴローン': {
japanese: 'ゴローン',
    romaji: 'goro-n',
    pronunciation: 'go-ro--n',
    meaning: 'Rock Pokémon',
    explanation: 'ごろごろ (gorogoro, rolling).'
  },
  'ゴローニャ': {
japanese: 'ゴローニャ',
    romaji: 'goro-nya',
    pronunciation: 'go-ro--nya',
    meaning: 'Megaton Pokémon',
    explanation: 'ごろごろ + "nya" (from "golem").'
  },
  'ポニータ': {
japanese: 'ポニータ',
    romaji: 'poni-ta',
    pronunciation: 'po-ni--ta',
    meaning: 'Fire Horse Pokémon',
    explanation: 'From English "pony."'
  },
  'ギャロップ': {
japanese: 'ギャロップ',
    romaji: 'gyarotsupu',
    pronunciation: 'gya-ro-tsu-pu',
    meaning: 'Fire Horse Pokémon',
    explanation: 'From English "gallop."'
  },
  'ヤドン': {
japanese: 'ヤドン',
    romaji: 'yadon',
    pronunciation: 'ya-do-n',
    meaning: 'Dopey Pokémon',
    explanation: '宿 (yado, lodging).'
  },
  'ヤドラン': {
japanese: 'ヤドラン',
    romaji: 'yadoran',
    pronunciation: 'ya-do-ra-n',
    meaning: 'Hermit Crab Pokémon',
    explanation: '"Yado" + "ran" (from "relax").'
  },
  'コイル': {
japanese: 'コイル',
    romaji: 'koiru',
    pronunciation: 'ko-i-ru',
    meaning: 'Magnet Pokémon',
    explanation: 'From English "coil."'
  },
  'レアコイル': {
japanese: 'レアコイル',
    romaji: 'reakoiru',
    pronunciation: 're-a-ko-i-ru',
    meaning: 'Magnet Pokémon',
    explanation: '"Rare" + "coil."'
  },
  'カモネギ': {
japanese: 'カモネギ',
    romaji: 'kamonegi',
    pronunciation: 'ka-mo-ne-gi',
    meaning: 'Wild Duck Pokémon',
    explanation: '鴨 (kamo, duck) + 葱 (negi, green onion/leek). Refers to Japanese saying "a duck comes bearing green onions" (something convenient).'
  },
  'ドードー': {
japanese: 'ドードー',
    romaji: 'do-do-',
    pronunciation: 'do--do-',
    meaning: 'Twin Bird Pokémon',
    explanation: 'From English "dodo."'
  },
  'ドードリオ': {
japanese: 'ドードリオ',
    romaji: 'do-dorio',
    pronunciation: 'do--do-ri-o',
    meaning: 'Triple Bird Pokémon',
    explanation: '"Dodo" + "trio."'
  },
  'パウワウ': {
japanese: 'パウワウ',
    romaji: 'pauwau',
    pronunciation: 'pa-u-wa-u',
    meaning: 'Sea Lion Pokémon',
    explanation: 'Onomatopoeic/childish term for a seal.'
  },
  'ジュゴン': {
japanese: 'ジュゴン',
    romaji: 'jugon',
    pronunciation: 'ju-go-n',
    meaning: 'Sea Lion Pokémon',
    explanation: 'From "dugong," a marine mammal.'
  },
  'ベトベター': {
japanese: 'ベトベター',
    romaji: 'betobeta-',
    pronunciation: 'be-to-be-ta-',
    meaning: 'Sludge Pokémon',
    explanation: 'べとべと (betobeto, sticky) + comparative "-er."'
  },
  'ベトベトン': {
japanese: 'ベトベトン',
    romaji: 'betobeton',
    pronunciation: 'be-to-be-to-n',
    meaning: 'Sludge Pokémon',
    explanation: 'べとべと + "ton" (superlative/large).'
  },
  'シェルダー': {
japanese: 'シェルダー',
    romaji: 'shieruda-',
    pronunciation: 'shi-e-ru-da-',
    meaning: 'Bivalve Pokémon',
    explanation: 'From English "shell."'
  },
  'パルシェン': {
japanese: 'パルシェン',
    romaji: 'parushien',
    pronunciation: 'pa-ru-shi-e-n',
    meaning: 'Bivalve Pokémon',
    explanation: '"Pearl" + "shell."'
  },
  'ゴース': {
japanese: 'ゴース',
    romaji: 'go-su',
    pronunciation: 'go--su',
    meaning: 'Gas Pokémon',
    explanation: 'From English "ghost."'
  },
  'ゴースト': {
japanese: 'ゴースト',
    romaji: 'go-suto',
    pronunciation: 'go--su-to',
    meaning: 'Gas Pokémon',
    explanation: 'From English "ghost."'
  },
  'ゲンガー': {
japanese: 'ゲンガー',
    romaji: 'genga-',
    pronunciation: 'ge-nga-',
    meaning: 'Shadow Pokémon',
    explanation: 'From German "doppelgänger" (double).'
  },
  'イワーク': {
japanese: 'イワーク',
    romaji: 'iwa-ku',
    pronunciation: 'i-wa--ku',
    meaning: 'Rock Snake Pokémon',
    explanation: '岩 (iwa, rock) + "snake."'
  },
  'スリープ': {
japanese: 'スリープ',
    romaji: 'suri-pu',
    pronunciation: 'su-ri--pu',
    meaning: 'Hypnosis Pokémon',
    explanation: 'From English "sleep."'
  },
  'スリーパー': {
japanese: 'スリーパー',
    romaji: 'suri-pa-',
    pronunciation: 'su-ri--pa-',
    meaning: 'Hypnosis Pokémon',
    explanation: 'From English "sleeper."'
  },
  'クラブ': {
japanese: 'クラブ',
    romaji: 'kurabu',
    pronunciation: 'ku-ra-bu',
    meaning: 'River Crab Pokémon',
    explanation: 'From English "crab."'
  },
  'キングラー': {
japanese: 'キングラー',
    romaji: 'kingura-',
    pronunciation: 'ki-ngu-ra-',
    meaning: 'Pincer Pokémon',
    explanation: 'From English "king" + "crab."'
  },
  'ビリリダマ': {
japanese: 'ビリリダマ',
    romaji: 'biriridama',
    pronunciation: 'bi-ri-ri-da-ma',
    meaning: 'Ball Pokémon',
    explanation: 'ビリビリ (biribiri, electric shock) + 玉 (dama, ball).'
  },
  'マルマイン': {
japanese: 'マルマイン',
    romaji: 'marumain',
    pronunciation: 'ma-ru-ma-i-n',
    meaning: 'Ball Pokémon',
    explanation: '丸 (maru, round) + "mine" (as in landmine).'
  },
  'タマタマ': {
japanese: 'タマタマ',
    romaji: 'tamatama',
    pronunciation: 'ta-ma-ta-ma',
    meaning: 'Egg Pokémon',
    explanation: '玉 (tama, egg/ball) repeated.'
  },
  'ナッシー': {
japanese: 'ナッシー',
    romaji: 'natsushi-',
    pronunciation: 'na-tsu-shi-',
    meaning: 'Coconut Pokémon',
    explanation: '"Nashi" (pear) + "shī" (from "tree").'
  },
  'カラカラ': {
japanese: 'カラカラ',
    romaji: 'karakara',
    pronunciation: 'ka-ra-ka-ra',
    meaning: 'Lonely Pokémon',
    explanation: 'From the rattling sound "karakara."'
  },
  'ガラガラ': {
japanese: 'ガラガラ',
    romaji: 'garagara',
    pronunciation: 'ga-ra-ga-ra',
    meaning: 'Bone Keeper Pokémon',
    explanation: 'From the clattering sound "garagara."'
  },
  'サワムラー': {
japanese: 'サワムラー',
    romaji: 'sawamura-',
    pronunciation: 'sa-wa-mu-ra-',
    meaning: 'Kicking Pokémon',
    explanation: 'Named after kickboxer Tadashi Sawamura.'
  },
  'エビワラー': {
japanese: 'エビワラー',
    romaji: 'ebiwara-',
    pronunciation: 'e-bi-wa-ra-',
    meaning: 'Punching Pokémon',
    explanation: 'Named after boxer Hiroyuki Ebihara.'
  },
  'ベロリンガ': {
japanese: 'ベロリンガ',
    romaji: 'beroringa',
    pronunciation: 'be-ro-ri-nga',
    meaning: 'Licking Pokémon',
    explanation: 'ベロ (bero, tongue) + "linga" (from "lingual" or "long").'
  },
  'ドガース': {
japanese: 'ドガース',
    romaji: 'doga-su',
    pronunciation: 'do-ga--su',
    meaning: 'Poison Gas Pokémon',
    explanation: '"Gas" with a sound effect.'
  },
  'マタドガス': {
japanese: 'マタドガス',
    romaji: 'matadogasu',
    pronunciation: 'ma-ta-do-ga-su',
    meaning: 'Poison Gas Pokémon',
    explanation: 'また (mata, again) + "dogasu" (gas).'
  },
  'サイホーン': {
japanese: 'サイホーン',
    romaji: 'saiho-n',
    pronunciation: 'sa-i-ho--n',
    meaning: 'Spikes Pokémon',
    explanation: 'サイ (sai, rhinoceros) + ホーン (horn).'
  },
  'サイドン': {
japanese: 'サイドン',
    romaji: 'saidon',
    pronunciation: 'sa-i-do-n',
    meaning: 'Drill Pokémon',
    explanation: '"Sai" (rhino) + "don" (dinosaur suffix).'
  },
  'ラッキー': {
japanese: 'ラッキー',
    romaji: 'ratsuki-',
    pronunciation: 'ra-tsu-ki-',
    meaning: 'Egg Pokémon',
    explanation: 'From English "lucky."'
  },
  'モンジャラ': {
japanese: 'モンジャラ',
    romaji: 'monjara',
    pronunciation: 'mo-nja-ra',
    meaning: 'Vine Pokémon',
    explanation: 'もじゃもじゃ (mojamoja, tangled).'
  },
  'ガルーラ': {
japanese: 'ガルーラ',
    romaji: 'garu-ra',
    pronunciation: 'ga-ru--ra',
    meaning: 'Parent Pokémon',
    explanation: 'From English "kangaroo."'
  },
  'タッツー': {
japanese: 'タッツー',
    romaji: 'tatsutsu-',
    pronunciation: 'ta-tsu-tsu-',
    meaning: 'Dragon Pokémon',
    explanation: '竜 (tatsu, dragon).'
  },
  'シードラ': {
japanese: 'シードラ',
    romaji: 'shi-dora',
    pronunciation: 'shi--do-ra',
    meaning: 'Dragon Pokémon',
    explanation: 'From English "sea" + "dragon."'
  },
  'トサキント': {
japanese: 'トサキント',
    romaji: 'tosakinto',
    pronunciation: 'to-sa-ki-nto',
    meaning: 'Goldfish Pokémon',
    explanation: 'とさきん (tosakin, a goldfish breed) + "to."'
  },
  'アズマオウ': {
japanese: 'アズマオウ',
    romaji: 'azumaou',
    pronunciation: 'a-zu-ma-o-u',
    meaning: 'Goldfish Pokémon',
    explanation: '東 (azuma, east) + 王 (ō, king).'
  },
  'ヒトデマン': {
japanese: 'ヒトデマン',
    romaji: 'hitodeman',
    pronunciation: 'hi-to-de-ma-n',
    meaning: 'Star Shape Pokémon',
    explanation: 'ヒトデ (hitode, starfish) + "man."'
  },
  'スターミー': {
japanese: 'スターミー',
    romaji: 'suta-mi-',
    pronunciation: 'su-ta--mi-',
    meaning: 'Mysterious Pokémon',
    explanation: '"Star" + "me" (possibly for symmetry or "star" + "mystery").'
  },
  'バリヤード': {
japanese: 'バリヤード',
    romaji: 'bariya-do',
    pronunciation: 'ba-ri-ya--do',
    meaning: 'Barrier Pokémon',
    explanation: '"Barrier" + "do" (from "do" or "person").'
  },
  'ストライク': {
japanese: 'ストライク',
    romaji: 'sutoraiku',
    pronunciation: 'su-to-ra-i-ku',
    meaning: 'Mantis Pokémon',
    explanation: 'From English "strike."'
  },
  'ルージュラ': {
japanese: 'ルージュラ',
    romaji: 'ru-jura',
    pronunciation: 'ru--ju-ra',
    meaning: 'Human Shape Pokémon',
    explanation: 'From French "rouge" (red/lipstick).'
  },
  'エレブー': {
japanese: 'エレブー',
    romaji: 'erebu-',
    pronunciation: 'e-re-bu-',
    meaning: 'Electric Pokémon',
    explanation: '"Electric" + "boo" (onomatopoeic zap).'
  },
  'ブーバー': {
japanese: 'ブーバー',
    romaji: 'bu-ba-',
    pronunciation: 'bu--ba-',
    meaning: 'Spitfire Pokémon',
    explanation: '"Booboo" (onomatopoeic for fire) + "bird."'
  },
  'カイロス': {
japanese: 'カイロス',
    romaji: 'kairosu',
    pronunciation: 'ka-i-ro-su',
    meaning: 'Stag Beetle Pokémon',
    explanation: 'From "kai" (shell) + "rosu" (from "cross" or "horns").'
  },
  'ケンタロス': {
japanese: 'ケンタロス',
    romaji: 'kentarosu',
    pronunciation: 'ke-nta-ro-su',
    meaning: 'Wild Bull Pokémon',
    explanation: 'From "centaur" (bull-man in myth), also "tauros" (bull).'
  },
  'コイキング': {
japanese: 'コイキング',
    romaji: 'koikingu',
    pronunciation: 'ko-i-ki-ngu',
    meaning: 'Fish Pokémon',
    explanation: '鯉 (koi, carp) + "king."'
  },
  'ギャラドス': {
japanese: 'ギャラドス',
    romaji: 'gyaradosu',
    pronunciation: 'gya-ra-do-su',
    meaning: 'Atrocious Pokémon',
    explanation: 'Possibly from "gyaku" (wrath) + "dos" (dragon/serpent).'
  },
  'ラプラス': {
japanese: 'ラプラス',
    romaji: 'rapurasu',
    pronunciation: 'ra-pu-ra-su',
    meaning: 'Transport Pokémon',
    explanation: 'From mathematician Pierre-Simon Laplace.'
  },
  'メタモン': {
japanese: 'メタモン',
    romaji: 'metamon',
    pronunciation: 'me-ta-mo-n',
    meaning: 'Transform Pokémon',
    explanation: '"Metamorph" + "monster."'
  },
  'イーブイ': {
japanese: 'イーブイ',
    romaji: 'i-bui',
    pronunciation: 'i--bu-i',
    meaning: 'Evolution Pokémon',
    explanation: 'From the letters "E" and "V" (evolution).'
  },
  'シャワーズ': {
japanese: 'シャワーズ',
    romaji: 'shawa-zu',
    pronunciation: 'sha-wa--zu',
    meaning: 'Bubble Jet Pokémon',
    explanation: 'From English "shower."'
  },
  'サンダース': {
japanese: 'サンダース',
    romaji: 'sanda-su',
    pronunciation: 'sa-nda--su',
    meaning: 'Lightning Pokémon',
    explanation: 'From English "thunder."'
  },
  'ブースター': {
japanese: 'ブースター',
    romaji: 'bu-suta-',
    pronunciation: 'bu--su-ta-',
    meaning: 'Flame Pokémon',
    explanation: 'From English "booster" (as in fire/energy).'
  },
  'ポリゴン': {
japanese: 'ポリゴン',
    romaji: 'porigon',
    pronunciation: 'po-ri-go-n',
    meaning: 'Virtual Pokémon',
    explanation: 'From English "polygon."'
  },
  'オムナイト': {
japanese: 'オムナイト',
    romaji: 'omunaito',
    pronunciation: 'o-mu-na-i-to',
    meaning: 'Spiral Pokémon',
    explanation: '"Omma" (from "ammonite," a fossil) + "knight."'
  },
  'オムスター': {
japanese: 'オムスター',
    romaji: 'omusuta-',
    pronunciation: 'o-mu-su-ta-',
    meaning: 'Spiral Pokémon',
    explanation: '"Omma" + "star."'
  },
  'カブト': {
japanese: 'カブト',
    romaji: 'kabuto',
    pronunciation: 'ka-bu-to',
    meaning: 'Shellfish Pokémon',
    explanation: '兜 (kabuto, helmet).'
  },
  'カブトプス': {
japanese: 'カブトプス',
    romaji: 'kabutopusu',
    pronunciation: 'ka-bu-to-pu-su',
    meaning: 'Shellfish Pokémon',
    explanation: '"Kabuto" + "ops" (Greek for face).'
  },
  'プテラ': {
japanese: 'プテラ',
    romaji: 'putera',
    pronunciation: 'pu-te-ra',
    meaning: 'Fossil Pokémon',
    explanation: 'From "pteranodon," a prehistoric flying reptile.'
  },
  'カビゴン': {
japanese: 'カビゴン',
    romaji: 'kabigon',
    pronunciation: 'ka-bi-go-n',
    meaning: 'Sleeping Pokémon',
    explanation: 'カビ (kabi, mold) + "gon" (suffix).'
  },
  'フリーザー': {
japanese: 'フリーザー',
    romaji: 'furi-za-',
    pronunciation: 'fu-ri--za-',
    meaning: 'Freeze Pokémon',
    explanation: 'From English "freezer."'
  },
  'サンダー': {
japanese: 'サンダー',
    romaji: 'sanda-',
    pronunciation: 'sa-nda-',
    meaning: 'Electric Pokémon',
    explanation: 'From English "thunder."'
  },
  'ファイヤー': {
japanese: 'ファイヤー',
    romaji: 'fuaiya-',
    pronunciation: 'fu-a-i-ya-',
    meaning: 'Flame Pokémon',
    explanation: 'From English "fire."'
  },
  'ミニリュウ': {
japanese: 'ミニリュウ',
    romaji: 'miniryuu',
    pronunciation: 'mi-ni-ryu-u',
    meaning: 'Dragon Pokémon',
    explanation: '"Mini" + 竜 (ryū, dragon).'
  },
  'ハクリュー': {
japanese: 'ハクリュー',
    romaji: 'hakuryu-',
    pronunciation: 'ha-ku-ryu-',
    meaning: 'Dragon Pokémon',
    explanation: '白 (haku, white) + 竜 (ryū, dragon).'
  },
  'カイリュー': {
japanese: 'カイリュー',
    romaji: 'kairyu-',
    pronunciation: 'ka-i-ryu-',
    meaning: 'Dragon Pokémon',
    explanation: '海 (kai, sea) + 竜 (ryū, dragon).'
  },
  'ミュウツー': {
japanese: 'ミュウツー',
    romaji: 'myuutsu-',
    pronunciation: 'myu-u-tsu-',
    meaning: 'Genetic Pokémon',
    explanation: '"Mew" + "two" (clone of Mew).'
  },
  'ミュウ': {
japanese: 'ミュウ',
    romaji: 'myuu',
    pronunciation: 'myu-u',
    meaning: 'New Species Pokémon',
    explanation: 'From the sound "mew" (cat's meow).'
  },
  'チコリータ': {
japanese: 'チコリータ',
    romaji: 'chikori-ta',
    pronunciation: 'chi-ko-ri--ta',
    meaning: 'Leaf Pokémon',
    explanation: 'From the herb chicory (チコリー *chikorī*) + Spanish diminutive “-ita,” meaning “little.”'
  },
  'ベイリーフ': {
japanese: 'ベイリーフ',
    romaji: 'beiri-fu',
    pronunciation: 'be-i-ri--fu',
    meaning: 'Leaf Pokémon',
    explanation: 'Katakana rendering of “bay leaf,” the aromatic herb. Reflects the leaf around its neck.'
  },
  'メガニウム': {
japanese: 'メガニウム',
    romaji: 'meganiumu',
    pronunciation: 'me-ga-ni-u-mu',
    meaning: 'Herb Pokémon',
    explanation: 'Blends “mega” (large) with “geranium,” indicating a large flowering herb.'
  },
  'ヒノアラシ': {
japanese: 'ヒノアラシ',
    romaji: 'hinoarashi',
    pronunciation: 'hi-no-a-ra-shi',
    meaning: 'Fire Mouse Pokémon',
    explanation: '火の嵐 (*hi no arashi*), literally “storm of fire,” referencing the flames on its back.'
  },
  'マグマラシ': {
japanese: 'マグマラシ',
    romaji: 'magumarashi',
    pronunciation: 'ma-gu-ma-ra-shi',
    meaning: 'Volcano Pokémon',
    explanation: 'マグマ (magma) + 嵐 (storm), continuing Cyndaquil’s naming motif with intensified heat.'
  },
  'バクフーン': {
japanese: 'バクフーン',
    romaji: 'bakufu-n',
    pronunciation: 'ba-ku-fu--n',
    meaning: 'Volcano Pokémon',
    explanation: '爆風 (*bakufū*, blast of wind) + 台風 (*taifū*, typhoon). Conveys explosive, gale-like flames.'
  },
  'ワニノコ': {
japanese: 'ワニノコ',
    romaji: 'waninoko',
    pronunciation: 'wa-ni-no-ko',
    meaning: 'Big Jaw Pokémon',
    explanation: 'ワニ (wani, crocodile) + の子 (no ko, “child of”). A baby crocodilian.'
  },
  'アリゲイツ': {
japanese: 'アリゲイツ',
    romaji: 'arigeitsu',
    pronunciation: 'a-ri-ge-i-tsu',
    meaning: 'Big Jaw Pokémon',
    explanation: 'From “alligator” (*arigētā*) with a clipped/childlike form. Suggests a young gator.'
  },
  'オーダイル': {
japanese: 'オーダイル',
    romaji: 'o-dairu',
    pronunciation: 'o--da-i-ru',
    meaning: 'Big Jaw Pokémon',
    explanation: '王 (*ō*, king) + 「ダイル」 (from *crocodile*). Implies a regal/ultimate crocodile.'
  },
  'オタチ': {
japanese: 'オタチ',
    romaji: 'otachi',
    pronunciation: 'o-ta-chi',
    meaning: 'Scout Pokémon',
    explanation: '尾 (*o*, tail) + 立つ (*tatsu*, to stand) + イタチ (*itachi*, weasel). A weasel that stands upright (often using its tail).'
  },
  'オオタチ': {
japanese: 'オオタチ',
    romaji: 'ootachi',
    pronunciation: 'o-o-ta-chi',
    meaning: 'Long Body Pokémon',
    explanation: '大 (*ō*, big) + (o) *tachi* from *Otachi* line; the grown, elongated weasel.'
  },
  'ホーホー': {
japanese: 'ホーホー',
    romaji: 'ho-ho-',
    pronunciation: 'ho--ho-',
    meaning: 'Owl Pokémon',
    explanation: 'Onomatopoeia for an owl’s hoot in Japanese.'
  },
  'ヨルノズク': {
japanese: 'ヨルノズク',
    romaji: 'yorunozuku',
    pronunciation: 'yo-ru-no-zu-ku',
    meaning: 'Owl Pokémon',
    explanation: '夜 (*yoru*, night) + (木菟/梟) *nozuku* (horned owl). A nocturnal owl.'
  },
  'レディバ': {
japanese: 'レディバ',
    romaji: 'redeiba',
    pronunciation: 're-de-i-ba',
    meaning: 'Five Star Pokémon',
    explanation: 'From “ladybug” with emphasis on *redi* (“red”); a little ladybird beetle.'
  },
  'レディアン': {
japanese: 'レディアン',
    romaji: 'redeian',
    pronunciation: 're-de-i-a-n',
    meaning: 'Five Star Pokémon',
    explanation: 'Evolves *Ledyba*; often analyzed as “lady” + “guardian,” hinting at a starry protector motif.'
  },
  'イトマル': {
japanese: 'イトマル',
    romaji: 'itomaru',
    pronunciation: 'i-to-ma-ru',
    meaning: 'String Spit Pokémon',
    explanation: '糸 (*ito*, thread) + 丸 (*maru*, circle/ball). A small spider that spins thread.'
  },
  'アリアドス': {
japanese: 'アリアドス',
    romaji: 'ariadosu',
    pronunciation: 'a-ri-a-do-su',
    meaning: 'Long Leg Pokémon',
    explanation: 'Named after Ariadne, who gave Theseus thread to navigate the Labyrinth—appropriate for a web-spinning spider.'
  },
  'クロバット': {
japanese: 'クロバット',
    romaji: 'kurobatsuto',
    pronunciation: 'ku-ro-ba-tsu-to',
    meaning: 'Bat Pokémon',
    explanation: 'Reads as “kuro” (black) + “bat,” and also evokes “acrobat,” capturing its swift, acrobatic flight.'
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
    meaning: 'Light Pokémon',
    explanation: 'Katakana for “lantern,” reflecting its bioluminescent lure like a deep-sea anglerfish.'
  },
  'ピチュー': {
japanese: 'ピチュー',
    romaji: 'pichu-',
    pronunciation: 'pi-chu-',
    meaning: 'Tiny Mouse Pokémon',
    explanation: 'Diminutive of Pikachu; retains ピカ (pika, sparkle) + チュウ (chū, squeak), with a cuter baby-sounding form.'
  },
  'ピィ': {
japanese: 'ピィ',
    romaji: 'pii',
    pronunciation: 'pi-i',
    meaning: 'Star Shape Pokémon',
    explanation: 'Baby form of ピッピ (Pippi/Clefairy); clipped, high-pitched sound implying something tiny and cute.'
  },
  'ププリン': {
japanese: 'ププリン',
    romaji: 'pupurin',
    pronunciation: 'pu-pu-ri-n',
    meaning: 'Balloon Pokémon',
    explanation: 'プチ (puchi, petite) + プリン (purin, pudding). Emphasizes a small, jiggly body.'
  },
  'トゲピー': {
japanese: 'トゲピー',
    romaji: 'togepi-',
    pronunciation: 'to-ge-pi-',
    meaning: 'Spike Ball Pokémon',
    explanation: '棘 (toge, spike) + ピヨ/ピー (piyo/pī, chick chirp). A spiky-shelled baby.'
  },
  'トゲチック': {
japanese: 'トゲチック',
    romaji: 'togechitsuku',
    pronunciation: 'to-ge-chi-tsu-ku',
    meaning: 'Happiness Pokémon',
    explanation: '棘 (toge, spike) + チック (chikku, from “chick” / チクチク prickly); angelic baby-bird vibes.'
  },
  'ネイティ': {
japanese: 'ネイティ',
    romaji: 'neitei',
    pronunciation: 'ne-i-te-i',
    meaning: 'Tiny Bird Pokémon',
    explanation: 'From “native”; references totemic/indigenous designs carried into its evolution.'
  },
  'ネイティオ': {
japanese: 'ネイティオ',
    romaji: 'neiteio',
    pronunciation: 'ne-i-te-i-o',
    meaning: 'Mystic Pokémon',
    explanation: 'Evolves Natu’s theme; evokes “native” + “indio,” fitting its totem pole aesthetic and prophetic stance.'
  },
  'メリープ': {
japanese: 'メリープ',
    romaji: 'meri-pu',
    pronunciation: 'me-ri--pu',
    meaning: 'Wool Pokémon',
    explanation: 'From Merino (sheep breed) and めー (mē, baa). Also an anagram of “ampere,” hinting electricity.'
  },
  'モココ': {
japanese: 'モココ',
    romaji: 'mokoko',
    pronunciation: 'mo-ko-ko',
    meaning: 'Wool Pokémon',
    explanation: 'もこもこ (moko-moko, fluffy). A very fluffy intermediate sheep.'
  },
  'デンリュウ': {
japanese: 'デンリュウ',
    romaji: 'denryuu',
    pronunciation: 'de-nryu-u',
    meaning: 'Light Pokémon',
    explanation: '電流 (denryū, electric current) + 竜 (ryū, dragon). A bright, lighthouse-like electric “dragon.”'
  },
  'キレイハナ': {
japanese: 'キレイハナ',
    romaji: 'kireihana',
    pronunciation: 'ki-re-i-ha-na',
    meaning: 'Flower Pokémon',
    explanation: '綺麗 (kirei, beautiful) + 花 (hana, flower). A graceful blossom.'
  },
  'マリル': {
japanese: 'マリル',
    romaji: 'mariru',
    pronunciation: 'ma-ri-ru',
    meaning: 'Aqua Mouse Pokémon',
    explanation: 'From “marine,” 丸い (marui, round), and 瑠璃 (ruri, lapis/azure). A round, blue river mouse.'
  },
  'マリルリ': {
japanese: 'マリルリ',
    romaji: 'mariruri',
    pronunciation: 'ma-ri-ru-ri',
    meaning: 'Aqua Rabbit Pokémon',
    explanation: 'Evolves Marill’s components with doubled “ruri,” emphasizing deeper blue and growth.'
  },
  'ウソッキー': {
japanese: 'ウソッキー',
    romaji: 'usotsuki-',
    pronunciation: 'u-so-tsu-ki-',
    meaning: 'Imitation Pokémon',
    explanation: '嘘つき (usotsuki, liar). A Rock-type that pretends to be a tree (fake wood).'
  },
  'ニョロトノ': {
japanese: 'ニョロトノ',
    romaji: 'nyorotono',
    pronunciation: 'nyo-ro-to-no',
    meaning: 'Frog Pokémon',
    explanation: 'ニョロニョロ (nyoro-nyoro, wriggle) + 殿 (tono, lord). The frog “lord” of the Poli line.'
  },
  'ハネッコ': {
japanese: 'ハネッコ',
    romaji: 'hanetsuko',
    pronunciation: 'ha-ne-tsu-ko',
    meaning: 'Cottonweed Pokémon',
    explanation: '跳ねる (haneru, to hop) + 子 (ko, child). A light dandelion puff that hops on the wind.'
  },
  'ポポッコ': {
japanese: 'ポポッコ',
    romaji: 'popotsuko',
    pronunciation: 'po-po-tsu-ko',
    meaning: 'Cottonweed Pokémon',
    explanation: 'From たんぽぽ (tanpopo, dandelion); playful doubling indicates a puffball child.'
  },
  'ワタッコ': {
japanese: 'ワタッコ',
    romaji: 'watatsuko',
    pronunciation: 'wa-ta-tsu-ko',
    meaning: 'Cottonweed Pokémon',
    explanation: '綿 (wata, cotton) + 子 (ko, child). A cottony float-seed that drifts far.'
  },
  'エイパム': {
japanese: 'エイパム',
    romaji: 'eipamu',
    pronunciation: 'e-i-pa-mu',
    meaning: 'Long Tail Pokémon',
    explanation: 'From “ape” + “palm,” referring to its hand-like tail.'
  },
  'ヒマナッツ': {
japanese: 'ヒマナッツ',
    romaji: 'himanatsutsu',
    pronunciation: 'hi-ma-na-tsu-tsu',
    meaning: 'Seed Pokémon',
    explanation: '向日葵 (himawari, sunflower) + ナッツ (nattsu, nuts). A sunflower seed.'
  },
  'キマワリ': {
japanese: 'キマワリ',
    romaji: 'kimawari',
    pronunciation: 'ki-ma-wa-ri',
    meaning: 'Sun Pokémon',
    explanation: 'From 向日葵 (himawari); voiced variation plays with “ki” to match naming patterns.'
  },
  'ヤンヤンマ': {
japanese: 'ヤンヤンマ',
    romaji: 'yanyanma',
    pronunciation: 'ya-nya-nma',
    meaning: 'Clear Wing Pokémon',
    explanation: 'ヤンマ (yanma, large dragonfly) with reduplication for emphasis/speed.'
  },
  'ウパー': {
japanese: 'ウパー',
    romaji: 'upa-',
    pronunciation: 'u-pa-',
    meaning: 'Water Fish Pokémon',
    explanation: 'From “wooper looper,” a Japanese nickname for axolotl; cute aquatic salamander.'
  },
  'ヌオー': {
japanese: 'ヌオー',
    romaji: 'nuo-',
    pronunciation: 'nu-o-',
    meaning: 'Water Fish Pokémon',
    explanation: 'Languid interjection “nuō,” evoking a laid-back, dopey water fish/salamander.'
  },
  'エーフィ': {
japanese: 'エーフィ',
    romaji: 'e-fui',
    pronunciation: 'e--fu-i',
    meaning: 'Sun Pokémon',
    explanation: 'From ESP (extrasensory perception) + フィ (fi, euphonic); a sun/psychic eeveelution.'
  },
  'ブラッキー': {
japanese: 'ブラッキー',
    romaji: 'buratsuki-',
    pronunciation: 'bu-ra-tsu-ki-',
    meaning: 'Moonlight Pokémon',
    explanation: 'From English “black” with cute -y ending; a moon/dark eeveelution.'
  },
  'ヤミカラス': {
japanese: 'ヤミカラス',
    romaji: 'yamikarasu',
    pronunciation: 'ya-mi-ka-ra-su',
    meaning: 'Darkness Pokémon',
    explanation: '闇 (yami, darkness) + 烏 (karasu, crow). A sinister night crow.'
  },
  'ヤドキング': {
japanese: 'ヤドキング',
    romaji: 'yadokingu',
    pronunciation: 'ya-do-ki-ngu',
    meaning: 'Royal Pokémon',
    explanation: '宿 (yado, lodging) + “king.” The royal apex of the Slowpoke line.'
  },
  'ムウマ': {
japanese: 'ムウマ',
    romaji: 'muuma',
    pronunciation: 'mu-u-ma',
    meaning: 'Screech Pokémon',
    explanation: 'From 夢魔 (muma, nightmare/dream demon). A mischievous, wailing spirit.'
  },
  'アンノーン': {
japanese: 'アンノーン',
    romaji: 'anno-n',
    pronunciation: 'a-nno--n',
    meaning: 'Symbol Pokémon',
    explanation: 'From English “unknown”; glyph-like forms shaped as letters.'
  },
  'ソーナンス': {
japanese: 'ソーナンス',
    romaji: 'so-nansu',
    pronunciation: 'so--na-nsu',
    meaning: 'Patient Pokémon',
    explanation: 'From 相成す／そうなんす (*sō nansu*, slang “that’s how it is”); comedic catchphrase of a Japanese performer.'
  },
  'キリンリキ': {
japanese: 'キリンリキ',
    romaji: 'kirinriki',
    pronunciation: 'ki-ri-nri-ki',
    meaning: 'Long Neck Pokémon',
    explanation: 'キリン (*kirin*, giraffe) + 念力 (*nenriki*, psychokinesis). Palindrome theme matches the two-headed motif.'
  },
  'クヌギダマ': {
japanese: 'クヌギダマ',
    romaji: 'kunugidama',
    pronunciation: 'ku-nu-gi-da-ma',
    meaning: 'Bagworm Pokémon',
    explanation: '櫟／クヌギ (*kunugi*, sawtooth oak) + 玉 (*tama*, ball), i.e., an oak gall/cone.'
  },
  'フォレトス': {
japanese: 'フォレトス',
    romaji: 'fuoretosu',
    pronunciation: 'fu-o-re-to-su',
    meaning: 'Bagworm Pokémon',
    explanation: 'Blend of “forest/forêt” and “fortress”; an armored, shelled bug.'
  },
  'ノコッチ': {
japanese: 'ノコッチ',
    romaji: 'nokotsuchi',
    pronunciation: 'no-ko-tsu-chi',
    meaning: 'Land Snake Pokémon',
    explanation: 'From ノコギリ (nokogiri, saw) / 凹 (oko, notch) + diminutive; based on the mythical tsuchinoko.'
  },
  'グライガー': {
japanese: 'グライガー',
    romaji: 'guraiga-',
    pronunciation: 'gu-ra-i-ga-',
    meaning: 'Fly Scorpion Pokémon',
    explanation: 'From “glide/glider”; scorpion-bat hybrid that glides.'
  },
  'ハガネール': {
japanese: 'ハガネール',
    romaji: 'hagane-ru',
    pronunciation: 'ha-ga-ne--ru',
    meaning: 'Iron Snake Pokémon',
    explanation: '鋼 (*hagane*, steel) + elongated suffix; Onix’s steel evolution.'
  },
  'ブルー': {
japanese: 'ブルー',
    romaji: 'buru-',
    pronunciation: 'bu-ru-',
    meaning: 'Fairy Pokémon',
    explanation: 'From English “blue/bulldog”; grumpy pink bulldog fairy.'
  },
  'グランブル': {
japanese: 'グランブル',
    romaji: 'guranburu',
    pronunciation: 'gu-ra-nbu-ru',
    meaning: 'Fairy Pokémon',
    explanation: 'Larger bulldog; “grand” size/power.'
  },
  'ハリーセン': {
japanese: 'ハリーセン',
    romaji: 'hari-sen',
    pronunciation: 'ha-ri--se-n',
    meaning: 'Balloon Pokémon',
    explanation: '針 (*hari*, needle) + 千 (*sen*, thousand) — a very spiky puffer.'
  },
  'ハッサム': {
japanese: 'ハッサム',
    romaji: 'hatsusamu',
    pronunciation: 'ha-tsu-sa-mu',
    meaning: 'Pincer Pokémon',
    explanation: 'From “scissor(s)” in Japanese phonology; pincer-armed mantis.'
  },
  'ツボツボ': {
japanese: 'ツボツボ',
    romaji: 'tsubotsubo',
    pronunciation: 'tsu-bo-tsu-bo',
    meaning: 'Mold Pokémon',
    explanation: '壺 (*tsubo*, pot) doubled; a tiny creature living in a pot-like shell.'
  },
  'ヘラクロス': {
japanese: 'ヘラクロス',
    romaji: 'herakurosu',
    pronunciation: 'he-ra-ku-ro-su',
    meaning: 'Single Horn Pokémon',
    explanation: 'Named for the Hercules beetle; “hera” evokes “hera-/hero.”'
  },
  'ニューラ': {
japanese: 'ニューラ',
    romaji: 'nyu-ra',
    pronunciation: 'nyu--ra',
    meaning: 'Sharp Claw Pokémon',
    explanation: 'Likely from “new”/“nyā” (meow) + “weasel”; a sharp-clawed weasel cat.'
  },
  'ヒメグマ': {
japanese: 'ヒメグマ',
    romaji: 'himeguma',
    pronunciation: 'hi-me-gu-ma',
    meaning: 'Little Bear Pokémon',
    explanation: '姫 (*hime*, princess) + 熊 (*guma/kuma*, bear) — a cute little bear.'
  },
  'リングマ': {
japanese: 'リングマ',
    romaji: 'ringuma',
    pronunciation: 'ri-ngu-ma',
    meaning: 'Hibernator Pokémon',
    explanation: 'From “ring” (chest ring marking) + 熊 (*kuma*, bear).'
  },
  'マグマッグ': {
japanese: 'マグマッグ',
    romaji: 'magumatsugu',
    pronunciation: 'ma-gu-ma-tsu-gu',
    meaning: 'Lava Pokémon',
    explanation: 'マグマ (magma) with playful doubling; molten slug.'
  },
  'マグカルゴ': {
japanese: 'マグカルゴ',
    romaji: 'magukarugo',
    pronunciation: 'ma-gu-ka-ru-go',
    meaning: 'Lava Pokémon',
    explanation: 'Portmanteau of magma and escargot/cargo; lava snail.'
  },
  'ウリムー': {
japanese: 'ウリムー',
    romaji: 'urimu-',
    pronunciation: 'u-ri-mu-',
    meaning: 'Pig Pokémon',
    explanation: '瓜坊 (*uribō*, boar piglet) + ムー (mū); a piglet boar.'
  },
  'イノムー': {
japanese: 'イノムー',
    romaji: 'inomu-',
    pronunciation: 'i-no-mu-',
    meaning: 'Swine Pokémon',
    explanation: '猪 (*ino*, boar) + ムー (mū); shaggy adult boar.'
  },
  'サニーゴ': {
japanese: 'サニーゴ',
    romaji: 'sani-go',
    pronunciation: 'sa-ni--go',
    meaning: 'Coral Pokémon',
    explanation: '“Sunny” + 珊瑚 (*sango*, coral); bright pink coral.'
  },
  'テッポウオ': {
japanese: 'テッポウオ',
    romaji: 'tetsupouo',
    pronunciation: 'te-tsu-po-u-o',
    meaning: 'Jet Pokémon',
    explanation: '鉄砲魚 (*teppōuo*, archerfish) / 鉄砲 (teppō, gun); shoots water like a gun.'
  },
  'オクタン': {
japanese: 'オクタン',
    romaji: 'okutan',
    pronunciation: 'o-ku-ta-n',
    meaning: 'Jet Pokémon',
    explanation: 'From “octopus” with engine/“octane” pun; cannon-like siphon.'
  },
  'デリバード': {
japanese: 'デリバード',
    romaji: 'deriba-do',
    pronunciation: 'de-ri-ba--do',
    meaning: 'Delivery Pokémon',
    explanation: 'From “delivery bird”; gift-giving motif.'
  },
  'マンタイン': {
japanese: 'マンタイン',
    romaji: 'mantain',
    pronunciation: 'ma-nta-i-n',
    meaning: 'Kite Pokémon',
    explanation: 'From manta ray; serene glider with Remoraid partner.'
  },
  'エアームド': {
japanese: 'エアームド',
    romaji: 'ea-mudo',
    pronunciation: 'e-a--mu-do',
    meaning: 'Armor Bird Pokémon',
    explanation: '空気 (air) + 武土/armed (phonetic); steel bird armored like weapons.'
  },
  'デルビル': {
japanese: 'デルビル',
    romaji: 'derubiru',
    pronunciation: 'de-ru-bi-ru',
    meaning: 'Dark Pokémon',
    explanation: 'From “devil”; a dark hellhound pup.'
  },
  'ヘルガー': {
japanese: 'ヘルガー',
    romaji: 'heruga-',
    pronunciation: 'he-ru-ga-',
    meaning: 'Dark Pokémon',
    explanation: 'From “hell” + guard/gaur; a hellhound.'
  },
  'キングドラ': {
japanese: 'キングドラ',
    romaji: 'kingudora',
    pronunciation: 'ki-ngu-do-ra',
    meaning: 'Dragon Pokémon',
    explanation: 'Straight blend; Horsea line’s dragon monarch.'
  },
  'ゴマゾウ': {
japanese: 'ゴマゾウ',
    romaji: 'gomazou',
    pronunciation: 'go-ma-zo-u',
    meaning: 'Long Nose Pokémon',
    explanation: '胡麻 (*goma*, sesame spots) + 象 (*zō*, elephant) with cute -ō; a speckled baby elephant.'
  },
  'ドンファン': {
japanese: 'ドンファン',
    romaji: 'donfuan',
    pronunciation: 'do-nfu-a-n',
    meaning: 'Armor Pokémon',
    explanation: '“Don” (big/boss) + fan/elephant; tire-like rolling.'
  },
  'ポリゴン２': {
japanese: 'ポリゴン２',
    romaji: 'porigon２',
    pronunciation: 'po-ri-go-n２',
    meaning: 'Virtual Pokémon',
    explanation: 'Sequel/upgrade to Porygon; software versioning joke.'
  },
  'オドシシ': {
japanese: 'オドシシ',
    romaji: 'odoshishi',
    pronunciation: 'o-do-shi-shi',
    meaning: 'Big Horn Pokémon',
    explanation: '驚かす／脅す (*odosu*, to scare) + 鹿 (*shika/shishi*, deer); antlers induce illusions.'
  },
  'ドーブル': {
japanese: 'ドーブル',
    romaji: 'do-buru',
    pronunciation: 'do--bu-ru',
    meaning: 'Painter Pokémon',
    explanation: 'From “doodle”/“daub”; painter beagle with a tail brush.'
  },
  'バルキー': {
japanese: 'バルキー',
    romaji: 'baruki-',
    pronunciation: 'ba-ru-ki-',
    meaning: 'Scuffle Pokémon',
    explanation: 'From “bulky”; a young fighter before branching evolution.'
  },
  'カポエラー': {
japanese: 'カポエラー',
    romaji: 'kapoera-',
    pronunciation: 'ka-po-e-ra-',
    meaning: 'Handstand Pokémon',
    explanation: 'From the Brazilian martial art *capoeira*; spins on its head.'
  },
  'ムチュール': {
japanese: 'ムチュール',
    romaji: 'muchu-ru',
    pronunciation: 'mu-chu--ru',
    meaning: 'Kiss Pokémon',
    explanation: '夢中 (*muchū*, in a trance/absorbed) + cute suffix; kissing motif.'
  },
  'エレキッド': {
japanese: 'エレキッド',
    romaji: 'erekitsudo',
    pronunciation: 'e-re-ki-tsu-do',
    meaning: 'Electric Pokémon',
    explanation: 'From “electric kid”; plug-like horns.'
  },
  'ブビィ': {
japanese: 'ブビィ',
    romaji: 'bubii',
    pronunciation: 'bu-bi-i',
    meaning: 'Live Coal Pokémon',
    explanation: 'Onomatopoeic *bubi/bubu* (bubbling) with baby vibe; magma infant.'
  },
  'ミルタンク': {
japanese: 'ミルタンク',
    romaji: 'mirutanku',
    pronunciation: 'mi-ru-ta-nku',
    meaning: 'Milk Cow Pokémon',
    explanation: 'From “milk tank”; dairy cow that stores milk.'
  },
  'ハピナス': {
japanese: 'ハピナス',
    romaji: 'hapinasu',
    pronunciation: 'ha-pi-na-su',
    meaning: 'Happiness Pokémon',
    explanation: 'From “happiness”; nurturing egg nurse.'
  },
  'ライコウ': {
japanese: 'ライコウ',
    romaji: 'raikou',
    pronunciation: 'ra-i-ko-u',
    meaning: 'Thunder Pokémon',
    explanation: '雷 (*rai*, thunder) + 皇／吼 (*kō*, emperor/howl). Thunder beast.'
  },
  'エンテイ': {
japanese: 'エンテイ',
    romaji: 'entei',
    pronunciation: 'e-nte-i',
    meaning: 'Volcano Pokémon',
    explanation: '炎 (*en*, flame) + 帝 (*tei*, emperor). Volcanic beast.'
  },
  'スイクン': {
japanese: 'スイクン',
    romaji: 'suikun',
    pronunciation: 'su-i-ku-n',
    meaning: 'Aurora Pokémon',
    explanation: '水 (*sui*, water) + 君 (*kun*, lord/monarch). North wind/water beast.'
  },
  'ヨーギラス': {
japanese: 'ヨーギラス',
    romaji: 'yo-girasu',
    pronunciation: 'yo--gi-ra-su',
    meaning: 'Rock Skin Pokémon',
    explanation: 'Evokes “yō” (youth) + -giras line suffix; larval rock beast.'
  },
  'サナギラス': {
japanese: 'サナギラス',
    romaji: 'sanagirasu',
    pronunciation: 'sa-na-gi-ra-su',
    meaning: 'Hard Shell Pokémon',
    explanation: '蛹 (*sanagi*, chrysalis) + line suffix; pupa stage.'
  },
  'バンギラス': {
japanese: 'バンギラス',
    romaji: 'bangirasu',
    pronunciation: 'ba-ngi-ra-su',
    meaning: 'Armor Pokémon',
    explanation: '“Ban” (as in bang/brutal) + -giras; tyrant kaiju motif.'
  },
  'ルギア': {
japanese: 'ルギア',
    romaji: 'rugia',
    pronunciation: 'ru-gi-a',
    meaning: 'Diving Pokémon',
    explanation: 'Invented mythic name; guardian of the seas/storms.'
  },
  'ホウオウ': {
japanese: 'ホウオウ',
    romaji: 'houou',
    pronunciation: 'ho-u-o-u',
    meaning: 'Rainbow Pokémon',
    explanation: '鳳凰 (*hōō*), the East Asian auspicious phoenix.'
  },
  'セレビィ': {
japanese: 'セレビィ',
    romaji: 'serebii',
    pronunciation: 'se-re-bi-i',
    meaning: 'Time Travel Pokémon',
    explanation: 'From “celebration”/“celery”; a time-traveling forest fairy.'
  },
  'キモリ': {
japanese: 'キモリ',
    romaji: 'kimori',
    pronunciation: 'ki-mo-ri',
    meaning: 'Wood Gecko Pokémon',
    explanation: '木 (*ki*, tree/wood) + ヤモリ／守り (*yamori/mamori*, gecko/protect). A gecko that lives among trees and is swift and protective.'
  },
  'ジュプトル': {
japanese: 'ジュプトル',
    romaji: 'juputoru',
    pronunciation: 'ju-pu-to-ru',
    meaning: 'Wood Gecko Pokémon',
    explanation: 'From “jungle” + “reptile”; agile, leaf-bladed forest reptile.'
  },
  'ジュカイン': {
japanese: 'ジュカイン',
    romaji: 'jukain',
    pronunciation: 'ju-ka-i-n',
    meaning: 'Forest Pokémon',
    explanation: 'Often parsed as “jungle” + evergreen tree nuance (カイン) or English “-tile/–ile”; a swift, bladed forest lizard.'
  },
  'アチャモ': {
japanese: 'アチャモ',
    romaji: 'achamo',
    pronunciation: 'a-cha-mo',
    meaning: 'Chick Pokémon',
    explanation: '熱い (*atsui/acha*, hot) + 雛 (*hiyoko*, chick) with cute ending -mo. A fiery chick.'
  },
  'ワカシャモ': {
japanese: 'ワカシャモ',
    romaji: 'wakashamo',
    pronunciation: 'wa-ka-sha-mo',
    meaning: 'Young Fowl Pokémon',
    explanation: '若 (*waka*, young) + 軍鶏 (*shamo*, fighting cock). A young fighting chicken.'
  },
  'バシャーモ': {
japanese: 'バシャーモ',
    romaji: 'basha-mo',
    pronunciation: 'ba-sha--mo',
    meaning: 'Blaze Pokémon',
    explanation: 'ばしゃ (basha, whoosh/splash) + 軍鶏 (*shamo*). A blazing martial rooster.'
  },
  'ミズゴロウ': {
japanese: 'ミズゴロウ',
    romaji: 'mizugorou',
    pronunciation: 'mi-zu-go-ro-u',
    meaning: 'Mud Fish Pokémon',
    explanation: '水 (*mizu*, water) + ドジョウ (*dojo*, loach). References amphibious, mud-dwelling nature.'
  },
  'ヌマクロー': {
japanese: 'ヌマクロー',
    romaji: 'numakuro-',
    pronunciation: 'nu-ma-ku-ro-',
    meaning: 'Mud Fish Pokémon',
    explanation: '沼 (*numa*, marsh) + クロウ (claw/craw). A marsh-stomping amphibian.'
  },
  'ラグラージ': {
japanese: 'ラグラージ',
    romaji: 'ragura-ji',
    pronunciation: 'ra-gu-ra--ji',
    meaning: 'Mud Fish Pokémon',
    explanation: 'Blend suggesting a very large swamp-dweller, powerful in wetlands.'
  },
  'ポチエナ': {
japanese: 'ポチエナ',
    romaji: 'pochiena',
    pronunciation: 'po-chi-e-na',
    meaning: 'Bite Pokémon',
    explanation: 'ポチ (*Pochi*, common dog name) + “hyena.” A small, scrappy hyena-like pup.'
  },
  'グラエナ': {
japanese: 'グラエナ',
    romaji: 'guraena',
    pronunciation: 'gu-ra-e-na',
    meaning: 'Bite Pokémon',
    explanation: '“Gura” evokes a deep growl + hyena; the imposing evolved hyena/wolf.'
  },
  'ジグザグマ': {
japanese: 'ジグザグマ',
    romaji: 'jiguzaguma',
    pronunciation: 'ji-gu-za-gu-ma',
    meaning: 'Tiny Raccoon Pokémon',
    explanation: 'From “zigzag” + 熊 (*guma*, bear) or animal suffix -ma; its pathing and stripes are zigzagged.'
  },
  'マッスグマ': {
japanese: 'マッスグマ',
    romaji: 'matsusuguma',
    pronunciation: 'ma-tsu-su-gu-ma',
    meaning: 'Rushing Pokémon',
    explanation: '真っ直ぐ (*massugu*, straight) + -ma. Runs straight in a line, unlike its pre-evo’s zigzags.'
  },
  'ケムッソ': {
japanese: 'ケムッソ',
    romaji: 'kemutsuso',
    pronunciation: 'ke-mu-tsu-so',
    meaning: 'Worm Pokémon',
    explanation: '毛虫 (*kemushi*, caterpillar) with emphatic -sso; a spiny worm.'
  },
  'カラサリス': {
japanese: 'カラサリス',
    romaji: 'karasarisu',
    pronunciation: 'ka-ra-sa-ri-su',
    meaning: 'Cocoon Pokémon',
    explanation: '殻 (*kara*, shell) + chrysalis; a white, silky cocoon form.'
  },
  'アゲハント': {
japanese: 'アゲハント',
    romaji: 'agehanto',
    pronunciation: 'a-ge-ha-nto',
    meaning: 'Butterfly Pokémon',
    explanation: 'アゲハ (*ageha*, swallowtail butterfly) + “hunt”; a nectar-feeding but aggressive butterfly.'
  },
  'マユルド': {
japanese: 'マユルド',
    romaji: 'mayurudo',
    pronunciation: 'ma-yu-ru-do',
    meaning: 'Cocoon Pokémon',
    explanation: '繭 (*mayu*, cocoon) + “hard” nuance; the darker, tougher cocoon.'
  },
  'ドクケイル': {
japanese: 'ドクケイル',
    romaji: 'dokukeiru',
    pronunciation: 'do-ku-ke-i-ru',
    meaning: 'Poison Moth Pokémon',
    explanation: '毒 (*doku*, poison) + ケイル (from “scale”/“moth”); a toxic scale-shedding moth.'
  },
  'ハスボー': {
japanese: 'ハスボー',
    romaji: 'hasubo-',
    pronunciation: 'ha-su-bo-',
    meaning: 'Water Weed Pokémon',
    explanation: '蓮 (*hasu*, lotus) + 坊 (*bō*, boy/youngster). A little lotus-pad Pokémon.'
  },
  'ハスブレロ': {
japanese: 'ハスブレロ',
    romaji: 'hasuburero',
    pronunciation: 'ha-su-bu-re-ro',
    meaning: 'Jolly Pokémon',
    explanation: '蓮 (*hasu*) + “sombrero”; a kappa-like dancer with a lily-pad hat.'
  },
  'ルンパッパ': {
japanese: 'ルンパッパ',
    romaji: 'runpatsupa',
    pronunciation: 'ru-npa-tsu-pa',
    meaning: 'Carefree Pokémon',
    explanation: 'From “rumba/lo-co” + “papa”; a festive dancing kappa.'
  },
  'タネボー': {
japanese: 'タネボー',
    romaji: 'tanebo-',
    pronunciation: 'ta-ne-bo-',
    meaning: 'Acorn Pokémon',
    explanation: '種 (*tane*, seed) + 坊 (*bō*, boy). An acorn cap-sporting seed.'
  },
  'コノハナ': {
japanese: 'コノハナ',
    romaji: 'konohana',
    pronunciation: 'ko-no-ha-na',
    meaning: 'Wily Pokémon',
    explanation: '木の花 (*konohana*, “tree’s flower”) / 木葉 (*konoha*, leaves); also hints at *Konoha* (leaf) folklore.'
  },
  'ダーテング': {
japanese: 'ダーテング',
    romaji: 'da-tengu',
    pronunciation: 'da--te-ngu',
    meaning: 'Wicked Pokémon',
    explanation: '“Dirty/dark” + 天狗 (*tengu*, long-nosed yokai). A fan-wielding forest spirit.'
  },
  'スバメ': {
japanese: 'スバメ',
    romaji: 'subame',
    pronunciation: 'su-ba-me',
    meaning: 'Tiny Swallow Pokémon',
    explanation: '燕 (*tsubame*, swallow). A small, speedy swallow.'
  },
  'オオスバメ': {
japanese: 'オオスバメ',
    romaji: 'oosubame',
    pronunciation: 'o-o-su-ba-me',
    meaning: 'Swallow Pokémon',
    explanation: '大 (*ō*, great) + 燕 (*subame*, swallow). The larger, stronger swallow.'
  },
  'キャモメ': {
japanese: 'キャモメ',
    romaji: 'kyamome',
    pronunciation: 'kya-mo-me',
    meaning: 'Seagull Pokémon',
    explanation: '鴎 (*kamome*, seagull) in katakana. A coastal gull.'
  },
  'ペリッパー': {
japanese: 'ペリッパー',
    romaji: 'peritsupa-',
    pronunciation: 'pe-ri-tsu-pa-',
    meaning: 'Water Bird Pokémon',
    explanation: 'From “pelican,” emphasizing its huge bill and courier role.'
  },
  'ラルトス': {
japanese: 'ラルトス',
    romaji: 'rarutosu',
    pronunciation: 'ra-ru-to-su',
    meaning: 'Feeling Pokémon',
    explanation: 'Evokes “waltz”/“halts” with elegant, empathic vibe; starts the empath line leading to Gardevoir/Gallade.'
  },
  'キルリア': {
japanese: 'キルリア',
    romaji: 'kiruria',
    pronunciation: 'ki-ru-ri-a',
    meaning: 'Emotion Pokémon',
    explanation: 'Evokes graceful, curving movements like ballet; a stylized coined name leading to Gardevoir.'
  },
  'サーナイト': {
japanese: 'サーナイト',
    romaji: 'sa-naito',
    pronunciation: 'sa--na-i-to',
    meaning: 'Embrace Pokémon',
    explanation: 'Japanese reads like “sir + knight,” fitting its protective, knightly guardian motif.'
  },
  'アメタマ': {
japanese: 'アメタマ',
    romaji: 'ametama',
    pronunciation: 'a-me-ta-ma',
    meaning: 'Pond Skater Pokémon',
    explanation: '雨 (*ame*, rain) + 玉 (*tama*, drop/ball); a pond-skater that glides on rainy ponds.'
  },
  'アメモース': {
japanese: 'アメモース',
    romaji: 'amemo-su',
    pronunciation: 'a-me-mo--su',
    meaning: 'Eyeball Pokémon',
    explanation: '雨 (*ame*, rain) + “moth”; eyespot “mask” wings after evolving from a rainy larva.'
  },
  'キノココ': {
japanese: 'キノココ',
    romaji: 'kinokoko',
    pronunciation: 'ki-no-ko-ko',
    meaning: 'Mushroom Pokémon',
    explanation: 'キノコ (*kinoko*, mushroom) + 子 (*ko*, child); a small, grumpy mushroom.'
  },
  'キノガッサ': {
japanese: 'キノガッサ',
    romaji: 'kinogatsusa',
    pronunciation: 'ki-no-ga-tsu-sa',
    meaning: 'Mushroom Pokémon',
    explanation: 'From キノコ (mushroom) + かさ/*gasa* (umbrella/cap); a fighting mushroom with a big cap.'
  },
  'ナマケロ': {
japanese: 'ナマケロ',
    romaji: 'namakero',
    pronunciation: 'na-ma-ke-ro',
    meaning: 'Slacker Pokémon',
    explanation: '怠ける (*namakeru*, to slack off). A very lazy sloth.'
  },
  'ヤルキモノ': {
japanese: 'ヤルキモノ',
    romaji: 'yarukimono',
    pronunciation: 'ya-ru-ki-mo-no',
    meaning: 'Wild Monkey Pokémon',
    explanation: 'やる気 (*yaruki*, motivation/drive) + 者 (*mono*, person). Hyperactive sloth stage.'
  },
  'ケッキング': {
japanese: 'ケッキング',
    romaji: 'ketsukingu',
    pronunciation: 'ke-tsu-ki-ngu',
    meaning: 'Lazy Pokémon',
    explanation: 'Portmanteau of “slacking” + “king,” the indolent king of sloths.'
  },
  'ツチニン': {
japanese: 'ツチニン',
    romaji: 'tsuchinin',
    pronunciation: 'tsu-chi-ni-n',
    meaning: 'Trainee Pokémon',
    explanation: '土 (*tsuchi*, earth) + 忍 (*nin*, ninja); a burrowing ninja cicada nymph.'
  },
  'テッカニン': {
japanese: 'テッカニン',
    romaji: 'tetsukanin',
    pronunciation: 'te-tsu-ka-ni-n',
    meaning: 'Ninja Pokémon',
    explanation: 'Suggests 鉄 (*tetsu*, steel) or てっか (blazing fast) + 忍 (*nin*, ninja); a lightning-fast ninja cicada.'
  },
  'ヌケニン': {
japanese: 'ヌケニン',
    romaji: 'nukenin',
    pronunciation: 'nu-ke-ni-n',
    meaning: 'Shed Pokémon',
    explanation: '抜け忍 (*nukenin*, a defector ninja); a hollow shell left behind that gains eerie life.'
  },
  'ゴニョニョ': {
japanese: 'ゴニョニョ',
    romaji: 'gonyonyo',
    pronunciation: 'go-nyo-nyo',
    meaning: 'Whisper Pokémon',
    explanation: 'ごにょごにょ (*gonyo-gonyo*, to mutter). A timid whispering Pokémon.'
  },
  'ドゴーム': {
japanese: 'ドゴーム',
    romaji: 'dogo-mu',
    pronunciation: 'do-go--mu',
    meaning: 'Big Voice Pokémon',
    explanation: '轟音 (*gōon*, roaring sound); stomps and shouts loudly.'
  },
  'バクオング': {
japanese: 'バクオング',
    romaji: 'bakuongu',
    pronunciation: 'ba-ku-o-ngu',
    meaning: 'Loud Noise Pokémon',
    explanation: '爆音 (*bakuon*, explosive/loud sound). A living subwoofer.'
  },
  'マクノシタ': {
japanese: 'マクノシタ',
    romaji: 'makunoshita',
    pronunciation: 'ma-ku-no-shi-ta',
    meaning: 'Guts Pokémon',
    explanation: '幕下 (*maku-no-shita*), a sumo rank below the main ring; a trainee sumo.'
  },
  'ハリテヤマ': {
japanese: 'ハリテヤマ',
    romaji: 'hariteyama',
    pronunciation: 'ha-ri-te-ya-ma',
    meaning: 'Arm Thrust Pokémon',
    explanation: '張り手 (*harite*, sumo open-hand strike) + 山 (*yama*, mountain); a powerful sumo.'
  },
  'ルリリ': {
japanese: 'ルリリ',
    romaji: 'ruriri',
    pronunciation: 'ru-ri-ri',
    meaning: 'Polka Dot Pokémon',
    explanation: '瑠璃 (*ruri*, lapis/azure) with a cutesy doubled ending; tiny blue mouse.'
  },
  'ノズパス': {
japanese: 'ノズパス',
    romaji: 'nozupasu',
    pronunciation: 'no-zu-pa-su',
    meaning: 'Compass Pokémon',
    explanation: 'Huge nose + compass motif (always points north); rock guide.'
  },
  'エネコ': {
japanese: 'エネコ',
    romaji: 'eneko',
    pronunciation: 'e-ne-ko',
    meaning: 'Kitten Pokémon',
    explanation: 'エネルギー (energy) + 猫 (*neko*, cat); a peppy kitten.'
  },
  'エネコロロ': {
japanese: 'エネコロロ',
    romaji: 'enekororo',
    pronunciation: 'e-ne-ko-ro-ro',
    meaning: 'Prim Pokémon',
    explanation: 'From エネコ + ころころ (*korokoro*, rolling/purring); a carefree, pampered cat.'
  },
  'ヤミラミ': {
japanese: 'ヤミラミ',
    romaji: 'yamirami',
    pronunciation: 'ya-mi-ra-mi',
    meaning: 'Darkness Pokémon',
    explanation: '闇 (*yami*, darkness) + wordplay suggesting 恨み (*urami*, grudge) / gems; a gem-eyed imp.'
  },
  'クチート': {
japanese: 'クチート',
    romaji: 'kuchi-to',
    pronunciation: 'ku-chi--to',
    meaning: 'Deceiver Pokémon',
    explanation: '口 (*kuchi*, mouth) + “cheat”; a deceiver with jaws on the back of its head.'
  },
  'ココドラ': {
japanese: 'ココドラ',
    romaji: 'kokodora',
    pronunciation: 'ko-ko-do-ra',
    meaning: 'Iron Armor Pokémon',
    explanation: '子 (*ko*, child) reduplicated + ドラ (as in ドラゴン/monster). A small iron armor beast.'
  },
  'コドラ': {
japanese: 'コドラ',
    romaji: 'kodora',
    pronunciation: 'ko-do-ra',
    meaning: 'Iron Armor Pokémon',
    explanation: 'Evolves from Kokodora; name drops one “ko” to show growth.'
  },
  'ボスゴドラ': {
japanese: 'ボスゴドラ',
    romaji: 'bosugodora',
    pronunciation: 'bo-su-go-do-ra',
    meaning: 'Iron Armor Pokémon',
    explanation: 'ボス (boss) + ゴドラ (evokes Godzilla-like kaiju). The armored boss.'
  },
  'アサナン': {
japanese: 'アサナン',
    romaji: 'asanan',
    pronunciation: 'a-sa-na-n',
    meaning: 'Meditate Pokémon',
    explanation: 'From “asana,” reflecting meditative yoga training.'
  },
  'チャーレム': {
japanese: 'チャーレム',
    romaji: 'cha-remu',
    pronunciation: 'cha--re-mu',
    meaning: 'Meditate Pokémon',
    explanation: 'Coined name evoking “charm/cha” + “-lem”; a yogi that fights while meditating.'
  },
  'ラクライ': {
japanese: 'ラクライ',
    romaji: 'rakurai',
    pronunciation: 'ra-ku-ra-i',
    meaning: 'Lightning Pokémon',
    explanation: '落雷 (*rakurai*, lightning strike). A hound charged with static.'
  },
  'ライボルト': {
japanese: 'ライボルト',
    romaji: 'raiboruto',
    pronunciation: 'ra-i-bo-ru-to',
    meaning: 'Discharge Pokémon',
    explanation: '雷 (*rai*, thunder) + “volt”; a high-voltage hound.'
  },
  'プラスル': {
japanese: 'プラスル',
    romaji: 'purasuru',
    pronunciation: 'pu-ra-su-ru',
    meaning: 'Cheering Pokémon',
    explanation: 'From “plus”; a cheerleader mouse that boosts allies.'
  },
  'マイナン': {
japanese: 'マイナン',
    romaji: 'mainan',
    pronunciation: 'ma-i-na-n',
    meaning: 'Cheering Pokémon',
    explanation: 'From “minus”; a partner to Plusle that specializes in support.'
  },
  'バルビート': {
japanese: 'バルビート',
    romaji: 'barubi-to',
    pronunciation: 'ba-ru-bi--to',
    meaning: 'Firefly Pokémon',
    explanation: 'Firefly whose tail glows to a beat; name evokes light + rhythm.'
  },
  'イルミーゼ': {
japanese: 'イルミーゼ',
    romaji: 'irumi-ze',
    pronunciation: 'i-ru-mi--ze',
    meaning: 'Firefly Pokémon',
    explanation: 'From “illuminate”; a firefly that leads Volbeat swarms with light.'
  },
  'ロゼリア': {
japanese: 'ロゼリア',
    romaji: 'rozeria',
    pronunciation: 'ro-ze-ri-a',
    meaning: 'Thorn Pokémon',
    explanation: 'From “rose”; a genteel thorny flower.'
  },
  'ゴクリン': {
japanese: 'ゴクリン',
    romaji: 'gokurin',
    pronunciation: 'go-ku-ri-n',
    meaning: 'Stomach Pokémon',
    explanation: 'ごくり (*gokuri*, gulp) + -n; a stomach on legs.'
  },
  'マルノーム': {
japanese: 'マルノーム',
    romaji: 'maruno-mu',
    pronunciation: 'ma-ru-no--mu',
    meaning: 'Poison Bag Pokémon',
    explanation: '丸呑み (*marunomi*, to swallow whole). A big purple glutton.'
  },
  'キバニア': {
japanese: 'キバニア',
    romaji: 'kibania',
    pronunciation: 'ki-ba-ni-a',
    meaning: 'Savage Pokémon',
    explanation: '牙 (*kiba*, fang) + “piranha”; a vicious river fish.'
  },
  'サメハダー': {
japanese: 'サメハダー',
    romaji: 'samehada-',
    pronunciation: 'sa-me-ha-da-',
    meaning: 'Brutal Pokémon',
    explanation: '鮫 (*same*, shark) + 鮫肌 (*samehada*, sharkskin/rough skin); a torpedo shark.'
  },
  'ホエルコ': {
japanese: 'ホエルコ',
    romaji: 'hoeruko',
    pronunciation: 'ho-e-ru-ko',
    meaning: 'Ball Whale Pokémon',
    explanation: '“Whale” + 子 (*ko*, child). A playful baby whale.'
  },
  'ホエルオー': {
japanese: 'ホエルオー',
    romaji: 'hoeruo-',
    pronunciation: 'ho-e-ru-o-',
    meaning: 'Float Whale Pokémon',
    explanation: 'From “whale” and 大／王 (*ō*, great/king). The colossal whale Pokémon.'
  },
  'ドンメル': {
japanese: 'ドンメル',
    romaji: 'donmeru',
    pronunciation: 'do-nme-ru',
    meaning: 'Numb Pokémon',
    explanation: 'ドン (*don*, thudding/heavy) + “camel.” A dull, placid camel that stores magma.'
  },
  'バクーダ': {
japanese: 'バクーダ',
    romaji: 'baku-da',
    pronunciation: 'ba-ku--da',
    meaning: 'Eruption Pokémon',
    explanation: '爆 (*baku*, explosion) + “dromedary/camel.” A volcano-backed camel.'
  },
  'コータス': {
japanese: 'コータス',
    romaji: 'ko-tasu',
    pronunciation: 'ko--ta-su',
    meaning: 'Coal Pokémon',
    explanation: 'From “coal” + tortoise; burns coal in its shell to emit smoke.'
  },
  'バネブー': {
japanese: 'バネブー',
    romaji: 'banebu-',
    pronunciation: 'ba-ne-bu-',
    meaning: 'Bounce Pokémon',
    explanation: 'バネ (*bane*, spring) + ブー (*bū*, pig oink). It bounces on its springy tail.'
  },
  'ブーピッグ': {
japanese: 'ブーピッグ',
    romaji: 'bu-pitsugu',
    pronunciation: 'bu--pi-tsu-gu',
    meaning: 'Manipulate Pokémon',
    explanation: 'From *bū* (oink) + pig; a jujitsu-dancing pig that channels psychic power.'
  },
  'パッチール': {
japanese: 'パッチール',
    romaji: 'patsuchi-ru',
    pronunciation: 'pa-tsu-chi--ru',
    meaning: 'Spot Panda Pokémon',
    explanation: 'パッチ (*patchi*, patch) + シール (*shīru*, sticker); spot patterns vary individually.'
  },
  'ナックラー': {
japanese: 'ナックラー',
    romaji: 'natsukura-',
    pronunciation: 'na-tsu-ku-ra-',
    meaning: 'Ant Pit Pokémon',
    explanation: 'Evokes “knuckle” and biting power; an antlion that digs pitfall traps.'
  },
  'ビブラーバ': {
japanese: 'ビブラーバ',
    romaji: 'bibura-ba',
    pronunciation: 'bi-bu-ra--ba',
    meaning: 'Vibration Pokémon',
    explanation: 'From “vibration” + larva; wings buzz with ultrasonic waves.'
  },
  'フライゴン': {
japanese: 'フライゴン',
    romaji: 'furaigon',
    pronunciation: 'fu-ra-i-go-n',
    meaning: 'Mystic Pokémon',
    explanation: 'From “fly” + “dragon”; a desert spirit-dragon.'
  },
  'サボネア': {
japanese: 'サボネア',
    romaji: 'sabonea',
    pronunciation: 'sa-bo-ne-a',
    meaning: 'Cactus Pokémon',
    explanation: 'サボテン (*saboten*, cactus) stylized; a spiny desert cactus.'
  },
  'ノクタス': {
japanese: 'ノクタス',
    romaji: 'nokutasu',
    pronunciation: 'no-ku-ta-su',
    meaning: 'Scarecrow Pokémon',
    explanation: 'From “noct-” (night) + cactus; a night-stalking scarecrow cactus.'
  },
  'チルット': {
japanese: 'チルット',
    romaji: 'chirutsuto',
    pronunciation: 'chi-ru-tsu-to',
    meaning: 'Cotton Bird Pokémon',
    explanation: 'Onomatopoeic chirp (*chiru/chiru*) with cute ending; cotton-winged bird.'
  },
  'チルタリス': {
japanese: 'チルタリス',
    romaji: 'chirutarisu',
    pronunciation: 'chi-ru-ta-ri-su',
    meaning: 'Humming Pokémon',
    explanation: 'Continues the *Chiru* line with a lofty aria/altus feel; a cloud-like songbird dragon.'
  },
  'ザングース': {
japanese: 'ザングース',
    romaji: 'zangu-su',
    pronunciation: 'za-ngu--su',
    meaning: 'Cat Ferret Pokémon',
    explanation: '斬 (*zan*, to slash) + “mongoose.” Traditional foe of snakes.'
  },
  'ハブネーク': {
japanese: 'ハブネーク',
    romaji: 'habune-ku',
    pronunciation: 'ha-bu-ne--ku',
    meaning: 'Fang Snake Pokémon',
    explanation: 'ハブ (*habu*, pit viper) + “snake.” Long-standing rival to Zangoose.'
  },
  'ルナトーン': {
japanese: 'ルナトーン',
    romaji: 'runato-n',
    pronunciation: 'ru-na-to--n',
    meaning: 'Meteorite Pokémon',
    explanation: 'From Latin *luna* (moon) + stone; a crescent moon meteorite.'
  },
  'ソルロック': {
japanese: 'ソルロック',
    romaji: 'sorurotsuku',
    pronunciation: 'so-ru-ro-tsu-ku',
    meaning: 'Meteorite Pokémon',
    explanation: 'From Latin *sol* (sun) + rock; a sunlike meteorite.'
  },
  'ドジョッチ': {
japanese: 'ドジョッチ',
    romaji: 'dojotsuchi',
    pronunciation: 'do-jo-tsu-chi',
    meaning: 'Whiskers Pokémon',
    explanation: 'ドジョウ (*dojo*, loach) + -ッチ (diminutive). A slippery mud fish.'
  },
  'ナマズン': {
japanese: 'ナマズン',
    romaji: 'namazun',
    pronunciation: 'na-ma-zu-n',
    meaning: 'Whiskers Pokémon',
    explanation: '鯰 (*namazu*, catfish) + -n; quake-foretelling catfish of folklore.'
  },
  'ヘイガニ': {
japanese: 'ヘイガニ',
    romaji: 'heigani',
    pronunciation: 'he-i-ga-ni',
    meaning: 'Ruffian Pokémon',
    explanation: '兵 (*hei*, soldier) + 蟹 (*kani*, crab) sound shift; a hardy invasive crayfish.'
  },
  'シザリガー': {
japanese: 'シザリガー',
    romaji: 'shizariga-',
    pronunciation: 'shi-za-ri-ga-',
    meaning: 'Rogue Pokémon',
    explanation: 'シザー (*shizā*, scissor) + ザリガニ (*zarigani*, crayfish). A violent rogue crayfish.'
  },
  'ヤジロン': {
japanese: 'ヤジロン',
    romaji: 'yajiron',
    pronunciation: 'ya-ji-ro-n',
    meaning: 'Clay Doll Pokémon',
    explanation: '矢尻 (*yajiri*, arrowhead); top/figurine that spins.'
  },
  'ネンドール': {
japanese: 'ネンドール',
    romaji: 'nendo-ru',
    pronunciation: 'ne-ndo--ru',
    meaning: 'Clay Doll Pokémon',
    explanation: '粘土 (*nendo*, clay) + doll; based on ancient haniwa figures.'
  },
  'リリーラ': {
japanese: 'リリーラ',
    romaji: 'riri-ra',
    pronunciation: 'ri-ri--ra',
    meaning: 'Sea Lily Pokémon',
    explanation: 'From “lily” with soft ending; a fossil sea lily (crinoid).'
  },
  'ユレイドル': {
japanese: 'ユレイドル',
    romaji: 'yureidoru',
    pronunciation: 'yu-re-i-do-ru',
    meaning: 'Barnacle Pokémon',
    explanation: '揺れる (*yureru*, to sway) + “idol/doll”; a swaying sea-lily predator.'
  },
  'アノプス': {
japanese: 'アノプス',
    romaji: 'anopusu',
    pronunciation: 'a-no-pu-su',
    meaning: 'Old Shrimp Pokémon',
    explanation: 'From *Anomalocaris* lineage; an ancient arthropod.'
  },
  'アーマルド': {
japanese: 'アーマルド',
    romaji: 'a-marudo',
    pronunciation: 'a--ma-ru-do',
    meaning: 'Plate Pokémon',
    explanation: '“Armor” + name-like ending; a plated predator.'
  },
  'ヒンバス': {
japanese: 'ヒンバス',
    romaji: 'hinbasu',
    pronunciation: 'hi-nba-su',
    meaning: 'Fish Pokémon',
    explanation: '貧 (*hin*, poor/meager) + “bass.” An unattractive but hardy fish.'
  },
  'ミロカロス': {
japanese: 'ミロカロス',
    romaji: 'mirokarosu',
    pronunciation: 'mi-ro-ka-ro-su',
    meaning: 'Tender Pokémon',
    explanation: 'Evokes “melodic” and Greek *kalos* (beautiful); the elegant serpent.'
  },
  'ポワルン': {
japanese: 'ポワルン',
    romaji: 'powarun',
    pronunciation: 'po-wa-ru-n',
    meaning: 'Weather Pokémon',
    explanation: 'From ふわふわ/*ぽわぽわ* (fluffy/floaty) + ルン (*run*, cheerful tone); a weather-formed body.'
  },
  'カクレオン': {
japanese: 'カクレオン',
    romaji: 'kakureon',
    pronunciation: 'ka-ku-re-o-n',
    meaning: 'Color Swap Pokémon',
    explanation: '隠れる (*kakureru*, to hide) + “chameleon.” A color-shifting lizard.'
  },
  'カゲボウズ': {
japanese: 'カゲボウズ',
    romaji: 'kagebouzu',
    pronunciation: 'ka-ge-bo-u-zu',
    meaning: 'Puppet Pokémon',
    explanation: '影 (*kage*, shadow) + 坊主 (*bōzu*, monk/doll); a vengeful little puppet.'
  },
  'ジュペッタ': {
japanese: 'ジュペッタ',
    romaji: 'jupetsuta',
    pronunciation: 'ju-pe-tsu-ta',
    meaning: 'Marionette Pokémon',
    explanation: 'From “puppet”; a discarded doll animated by grudges.'
  },
  'ヨマワル': {
japanese: 'ヨマワル',
    romaji: 'yomawaru',
    pronunciation: 'yo-ma-wa-ru',
    meaning: 'Requiem Pokémon',
    explanation: '夜回り (*yomawari*, night patrol); a skulking reaper.'
  },
  'サマヨール': {
japanese: 'サマヨール',
    romaji: 'samayo-ru',
    pronunciation: 'sa-ma-yo--ru',
    meaning: 'Beckon Pokémon',
    explanation: '彷徨う (*samayō*, to wander). A one-eyed wandering specter.'
  },
  'トロピウス': {
japanese: 'トロピウス',
    romaji: 'toropiusu',
    pronunciation: 'to-ro-pi-u-su',
    meaning: 'Fruit Pokémon',
    explanation: 'From “tropic”; a banana-bearing dinosaur of the tropics.'
  },
  'チリーン': {
japanese: 'チリーン',
    romaji: 'chiri-n',
    pronunciation: 'chi-ri--n',
    meaning: 'Wind Chime Pokémon',
    explanation: 'Onomatopoeia for a wind chime’s ring; a healing chime spirit.'
  },
  'アブソル': {
japanese: 'アブソル',
    romaji: 'abusoru',
    pronunciation: 'a-bu-so-ru',
    meaning: 'Disaster Pokémon',
    explanation: 'From “absolute/absolution”; a disaster-foretelling beast misunderstood as ominous.'
  },
  'ソーナノ': {
japanese: 'ソーナノ',
    romaji: 'so-nano',
    pronunciation: 'so--na-no',
    meaning: 'Bright Pokémon',
    explanation: 'From そうなの (*sō na no*, “is that so?”), matching Wobbuffet’s ソーナンス (“that’s how it is”).'
  },
  'ユキワラシ': {
japanese: 'ユキワラシ',
    romaji: 'yukiwarashi',
    pronunciation: 'yu-ki-wa-ra-shi',
    meaning: 'Snow Hat Pokémon',
    explanation: '雪 (*yuki*, snow) + 童子 (*warashi*, child spirit). Based on yuki-warashi, a snow spirit.'
  },
  'オニゴーリ': {
japanese: 'オニゴーリ',
    romaji: 'onigo-ri',
    pronunciation: 'o-ni-go--ri',
    meaning: 'Face Pokémon',
    explanation: '鬼 (*oni*, demon) + 氷 (*kōri*, ice). A demonic ice-face.'
  },
  'タマザラシ': {
japanese: 'タマザラシ',
    romaji: 'tamazarashi',
    pronunciation: 'ta-ma-za-ra-shi',
    meaning: 'Clap Pokémon',
    explanation: '玉 (*tama*, ball) + 胡麻斑海豹 (*azarashi*, spotted seal). A round, rolling seal.'
  },
  'トドグラー': {
japanese: 'トドグラー',
    romaji: 'todogura-',
    pronunciation: 'to-do-gu-ra-',
    meaning: 'Ball Roll Pokémon',
    explanation: 'トド (*todo*, sea lion) + グラー (growl); a playful but strong pinniped.'
  },
  'トドゼルガ': {
japanese: 'トドゼルガ',
    romaji: 'todozeruga',
    pronunciation: 'to-do-ze-ru-ga',
    meaning: 'Ice Break Pokémon',
    explanation: 'トド (todo, sea lion) + 善牙 (zeruga, fierce tusks). A walrus-like beast.'
  },
  'パールル': {
japanese: 'パールル',
    romaji: 'pa-ruru',
    pronunciation: 'pa--ru-ru',
    meaning: 'Bivalve Pokémon',
    explanation: 'From “pearl” with doubled ending for cuteness. A clam with a pearl.'
  },
  'ハンテール': {
japanese: 'ハンテール',
    romaji: 'hante-ru',
    pronunciation: 'ha-nte--ru',
    meaning: 'Deep Sea Pokémon',
    explanation: 'Direct from English; a predatory deep-sea eel.'
  },
  'サクラビス': {
japanese: 'サクラビス',
    romaji: 'sakurabisu',
    pronunciation: 'sa-ku-ra-bi-su',
    meaning: 'South Sea Pokémon',
    explanation: '桜 (*sakura*, cherry blossom) + abyss; a pink, graceful deep-sea eel.'
  },
  'ジーランス': {
japanese: 'ジーランス',
    romaji: 'ji-ransu',
    pronunciation: 'ji--ra-nsu',
    meaning: 'Longevity Pokémon',
    explanation: 'From “G.” (possibly “grand/geo”) + coelacanth; an ancient fish.'
  },
  'ラブカス': {
japanese: 'ラブカス',
    romaji: 'rabukasu',
    pronunciation: 'ra-bu-ka-su',
    meaning: 'Rendezvous Pokémon',
    explanation: 'From “love” + “discus”; heart-shaped fish of love.'
  },
  'タツベイ': {
japanese: 'タツベイ',
    romaji: 'tatsubei',
    pronunciation: 'ta-tsu-be-i',
    meaning: 'Rock Head Pokémon',
    explanation: '竜 (*tatsu*, dragon) + small-name suffix; a dragon aspirant.'
  },
  'コモルー': {
japanese: 'コモルー',
    romaji: 'komoru-',
    pronunciation: 'ko-mo-ru-',
    meaning: 'Endurance Pokémon',
    explanation: '籠る (*komoru*, to seclude/encase); a cocoon dragon.'
  },
  'ボーマンダ': {
japanese: 'ボーマンダ',
    romaji: 'bo-manda',
    pronunciation: 'bo--ma-nda',
    meaning: 'Dragon Pokémon',
    explanation: 'From “salamander” + “bombardment/bomber.” A fearsome dragon.'
  },
  'ダンバル': {
japanese: 'ダンバル',
    romaji: 'danbaru',
    pronunciation: 'da-nba-ru',
    meaning: 'Iron Ball Pokémon',
    explanation: 'From “dumbbell” with Japanese phonology; metallic weight shape.'
  },
  'メタング': {
japanese: 'メタング',
    romaji: 'metangu',
    pronunciation: 'me-ta-ngu',
    meaning: 'Iron Claw Pokémon',
    explanation: 'From “metal” + “tang” (sound/extension); alloyed form.'
  },
  'メタグロス': {
japanese: 'メタグロス',
    romaji: 'metagurosu',
    pronunciation: 'me-ta-gu-ro-su',
    meaning: 'Iron Leg Pokémon',
    explanation: 'From “metal” + gross (large); a huge, four-brained machine.'
  },
  'レジロック': {
japanese: 'レジロック',
    romaji: 'rejirotsuku',
    pronunciation: 're-ji-ro-tsu-ku',
    meaning: 'Rock Peak Pokémon',
    explanation: '“Regi-” prefix for Regi trio + rock.'
  },
  'レジアイス': {
japanese: 'レジアイス',
    romaji: 'rejiaisu',
    pronunciation: 're-ji-a-i-su',
    meaning: 'Iceberg Pokémon',
    explanation: '“Regi-” prefix + ice.'
  },
  'レジスチル': {
japanese: 'レジスチル',
    romaji: 'rejisuchiru',
    pronunciation: 're-ji-su-chi-ru',
    meaning: 'Iron Pokémon',
    explanation: '“Regi-” prefix + steel.'
  },
  'ラティアス': {
japanese: 'ラティアス',
    romaji: 'rateiasu',
    pronunciation: 'ra-te-i-a-su',
    meaning: 'Eon Pokémon',
    explanation: 'Coined dragon name; feminine suffix -as.'
  },
  'ラティオス': {
japanese: 'ラティオス',
    romaji: 'rateiosu',
    pronunciation: 'ra-te-i-o-su',
    meaning: 'Eon Pokémon',
    explanation: 'Coined dragon name; masculine suffix -os.'
  },
  'カイオーガ': {
japanese: 'カイオーガ',
    romaji: 'kaio-ga',
    pronunciation: 'ka-i-o--ga',
    meaning: 'Sea Basin Pokémon',
    explanation: '海 (*kai*, sea) + ogre; a leviathan of the ocean.'
  },
  'グラードン': {
japanese: 'グラードン',
    romaji: 'gura-don',
    pronunciation: 'gu-ra--do-n',
    meaning: 'Continent Pokémon',
    explanation: 'From “ground” + suffix -don (common in dinosaur names). A continent-raising titan.'
  },
  'レックウザ': {
japanese: 'レックウザ',
    romaji: 'retsukuuza',
    pronunciation: 're-tsu-ku-u-za',
    meaning: 'Sky High Pokémon',
    explanation: '烈空 (*rekkū*, violent sky) + -za; a sky serpent.'
  },
  'ジラーチ': {
japanese: 'ジラーチ',
    romaji: 'jira-chi',
    pronunciation: 'ji-ra--chi',
    meaning: 'Wish Pokémon',
    explanation: 'From 幸 (*shiawase*, happiness) and borrowing “wish” from other languages. A wish-granting star.'
  },
  'デオキシス': {
japanese: 'デオキシス',
    romaji: 'deokishisu',
    pronunciation: 'de-o-ki-shi-su',
    meaning: 'DNA Pokémon',
    explanation: 'From “deoxyribonucleic acid”; a DNA-based alien.'
  },
  'ナエトル': {
japanese: 'ナエトル',
    romaji: 'naetoru',
    pronunciation: 'na-e-to-ru',
    meaning: 'Tiny Leaf Pokémon',
    explanation: '苗 (*nae*, sprout/seedling) + 亀 (*toru/toru*, turtle—phonetic). A seedling-backed turtle.'
  },
  'ハヤシガメ': {
japanese: 'ハヤシガメ',
    romaji: 'hayashigame',
    pronunciation: 'ha-ya-shi-ga-me',
    meaning: 'Grove Pokémon',
    explanation: '林 (*hayashi*, forest) + 亀 (*kame/game*, turtle). Bushes grow on its shell.'
  },
  'ドダイトス': {
japanese: 'ドダイトス',
    romaji: 'dodaitosu',
    pronunciation: 'do-da-i-to-su',
    meaning: 'Continent Pokémon',
    explanation: '土台 (*dodai*, foundation/earth) + トータス (tortoise); a continent-like tortoise.'
  },
  'ヒコザル': {
japanese: 'ヒコザル',
    romaji: 'hikozaru',
    pronunciation: 'hi-ko-za-ru',
    meaning: 'Chimp Pokémon',
    explanation: '火 (*hi*, fire) + 子 (*ko*, child) + 猿 (*zaru*, monkey). A fiery little monkey.'
  },
  'モウカザル': {
japanese: 'モウカザル',
    romaji: 'moukazaru',
    pronunciation: 'mo-u-ka-za-ru',
    meaning: 'Playful Pokémon',
    explanation: '猛火 (*mōka*, fierce flames) + 猿 (*zaru*, monkey). Mid-stage fighter.'
  },
  'ゴウカザル': {
japanese: 'ゴウカザル',
    romaji: 'goukazaru',
    pronunciation: 'go-u-ka-za-ru',
    meaning: 'Flame Pokémon',
    explanation: '豪火／劫火 (*gōka*, great blaze) + 猿 (*zaru*, monkey). A blazing martial sage.'
  },
  'ポッチャマ': {
japanese: 'ポッチャマ',
    romaji: 'potsuchama',
    pronunciation: 'po-tsu-cha-ma',
    meaning: 'Penguin Pokémon',
    explanation: 'ぽっちゃり (*pochari*, plump) + ちゃま/*sama* (child/master). A proud, plump penguin chick.'
  },
  'ポッタイシ': {
japanese: 'ポッタイシ',
    romaji: 'potsutaishi',
    pronunciation: 'po-tsu-ta-i-shi',
    meaning: 'Penguin Pokémon',
    explanation: 'Coined from *potta* sound + 意志 (*ishi*, will) / 石 (*ishi*, stone). A princely penguin.'
  },
  'エンペルト': {
japanese: 'エンペルト',
    romaji: 'enperuto',
    pronunciation: 'e-npe-ru-to',
    meaning: 'Emperor Pokémon',
    explanation: '“Emperor” + ペンギン (penguin) nuance; trident-like beak evokes rulership.'
  },
  'ムックル': {
japanese: 'ムックル',
    romaji: 'mutsukuru',
    pronunciation: 'mu-tsu-ku-ru',
    meaning: 'Starling Pokémon',
    explanation: 'Onomatopoeic bird name; a small starling.'
  },
  'ムクバード': {
japanese: 'ムクバード',
    romaji: 'mukuba-do',
    pronunciation: 'mu-ku-ba--do',
    meaning: 'Starling Pokémon',
    explanation: 'ムク (muku, from the line) + バード (bird). The adolescent starling.'
  },
  'ムクホーク': {
japanese: 'ムクホーク',
    romaji: 'mukuho-ku',
    pronunciation: 'mu-ku-ho--ku',
    meaning: 'Predator Pokémon',
    explanation: 'ムク + ホーク (hawk); a fierce raptor.'
  },
  'ビッパ': {
japanese: 'ビッパ',
    romaji: 'bitsupa',
    pronunciation: 'bi-tsu-pa',
    meaning: 'Plump Mouse Pokémon',
    explanation: 'Coined beaver-like name with cute doubling; a simple-minded beaver.'
  },
  'ビーダル': {
japanese: 'ビーダル',
    romaji: 'bi-daru',
    pronunciation: 'bi--da-ru',
    meaning: 'Beaver Pokémon',
    explanation: 'From “beaver”; industrious dam-builder.'
  },
  'コロボーシ': {
japanese: 'コロボーシ',
    romaji: 'korobo-shi',
    pronunciation: 'ko-ro-bo--shi',
    meaning: 'Cricket Pokémon',
    explanation: '転ぶ (*korobu*, roll) + beetle. A dung-rolling scarab.'
  },
  'コロトック': {
japanese: 'コロトック',
    romaji: 'korototsuku',
    pronunciation: 'ko-ro-to-tsu-ku',
    meaning: 'Cricket Pokémon',
    explanation: 'Onomatopoeia blending cricket chirps and ticking; a violinist cricket.'
  },
  'コリンク': {
japanese: 'コリンク',
    romaji: 'korinku',
    pronunciation: 'ko-ri-nku',
    meaning: 'Flash Pokémon',
    explanation: 'Often read as 子 (*ko*, child) + “link”/“ring” sound; an electric lion cub.'
  },
  'ルクシオ': {
japanese: 'ルクシオ',
    romaji: 'rukushio',
    pronunciation: 'ru-ku-shi-o',
    meaning: 'Spark Pokémon',
    explanation: 'From Latin *lux* (light); the charged adolescent.'
  },
  'レントラー': {
japanese: 'レントラー',
    romaji: 'rentora-',
    pronunciation: 're-nto-ra-',
    meaning: 'Gleam Eyes Pokémon',
    explanation: 'レントゲン (*rentogen*, X‑ray) shortened; can “see through” with x‑ray vision.'
  },
  'スボミー': {
japanese: 'スボミー',
    romaji: 'subomi-',
    pronunciation: 'su-bo-mi-',
    meaning: 'Bud Pokémon',
    explanation: '蕾 (*tsubomi*, bud) with sound shift; a tiny rosebud.'
  },
  'ロズレイド': {
japanese: 'ロズレイド',
    romaji: 'rozureido',
    pronunciation: 'ro-zu-re-i-do',
    meaning: 'Bouquet Pokémon',
    explanation: '“Rose” + “raid/blade”; a masked bouquet duelist.'
  },
  'ズガイドス': {
japanese: 'ズガイドス',
    romaji: 'zugaidosu',
    pronunciation: 'zu-ga-i-do-su',
    meaning: 'Head Butt Pokémon',
    explanation: '頭蓋 (*zuga i*, skull) + -ドス; a headbutting fossil.'
  },
  'ラムパルド': {
japanese: 'ラムパルド',
    romaji: 'ramuparudo',
    pronunciation: 'ra-mu-pa-ru-do',
    meaning: 'Head Butt Pokémon',
    explanation: 'From “rampart”; a thick-skulled battering fossil.'
  },
  'タテトプス': {
japanese: 'タテトプス',
    romaji: 'tatetopusu',
    pronunciation: 'ta-te-to-pu-su',
    meaning: 'Shield Pokémon',
    explanation: '盾 (*tate*, shield) + -ops (face). A shield-faced fossil.'
  },
  'トリデプス': {
japanese: 'トリデプス',
    romaji: 'toridepusu',
    pronunciation: 'to-ri-de-pu-su',
    meaning: 'Shield Pokémon',
    explanation: '砦 (*toride*, fort) + -ops; an impregnable wall.'
  },
  'ミノムッチ': {
japanese: 'ミノムッチ',
    romaji: 'minomutsuchi',
    pronunciation: 'mi-no-mu-tsu-chi',
    meaning: 'Bagworm Pokémon',
    explanation: '蓑虫 (*minomushi*, bagworm) + -っち (cute). A cloak-wearing larva.'
  },
  'ミノマダム': {
japanese: 'ミノマダム',
    romaji: 'minomadamu',
    pronunciation: 'mi-no-ma-da-mu',
    meaning: 'Bagworm Pokémon',
    explanation: '蓑 (*mino*, straw raincoat) + “madam”; female evolution with different cloaks.'
  },
  'ガーメイル': {
japanese: 'ガーメイル',
    romaji: 'ga-meiru',
    pronunciation: 'ga--me-i-ru',
    meaning: 'Moth Pokémon',
    explanation: '“Moth” + *male*; the male counterpart to Wormadam.'
  },
  'ミツハニー': {
japanese: 'ミツハニー',
    romaji: 'mitsuhani-',
    pronunciation: 'mi-tsu-ha-ni-',
    meaning: 'Tiny Bee Pokémon',
    explanation: '蜜 (*mitsu*, honey) + English “honey”; a honeycomb of three.'
  },
  'ビークイン': {
japanese: 'ビークイン',
    romaji: 'bi-kuin',
    pronunciation: 'bi--ku-i-n',
    meaning: 'Beehive Pokémon',
    explanation: '“Bee” + “queen”; monarch of the hive.'
  },
  'パチリス': {
japanese: 'パチリス',
    romaji: 'pachirisu',
    pronunciation: 'pa-chi-ri-su',
    meaning: 'EleSquirrel Pokémon',
    explanation: 'パチパチ (*pachi‑pachi*, crackle/spark) + リス (*risu*, squirrel). An electric squirrel.'
  },
  'ブイゼル': {
japanese: 'ブイゼル',
    romaji: 'buizeru',
    pronunciation: 'bu-i-ze-ru',
    meaning: 'Sea Weasel Pokémon',
    explanation: 'From “buoy” + “weasel”; sports flotation sacs.'
  },
  'フローゼル': {
japanese: 'フローゼル',
    romaji: 'furo-zeru',
    pronunciation: 'fu-ro--ze-ru',
    meaning: 'Sea Weasel Pokémon',
    explanation: 'From “float” + “weasel”; a lifeguard-like otter.'
  },
  'チェリンボ': {
japanese: 'チェリンボ',
    romaji: 'chierinbo',
    pronunciation: 'chi-e-ri-nbo',
    meaning: 'Cherry Pokémon',
    explanation: 'From “cherry” + 坊 (*bō*, boy/child); a twin‑fruit cherry.'
  },
  'チェリム': {
japanese: 'チェリム',
    romaji: 'chierimu',
    pronunciation: 'chi-e-ri-mu',
    meaning: 'Blossom Pokémon',
    explanation: 'From “cherry” + “bloom”; a cherry blossom that changes with sunlight.'
  },
  'カラナクシ': {
japanese: 'カラナクシ',
    romaji: 'karanakushi',
    pronunciation: 'ka-ra-na-ku-shi',
    meaning: 'Sea Slug Pokémon',
    explanation: '殻 (*kara*, shell) + ナメクジ (*namekuji*, slug); a coastal sea slug.'
  },
  'トリトドン': {
japanese: 'トリトドン',
    romaji: 'toritodon',
    pronunciation: 'to-ri-to-do-n',
    meaning: 'Sea Slug Pokémon',
    explanation: 'From “triton” (sea god) + -don; a larger sea slug.'
  },
  'エテボース': {
japanese: 'エテボース',
    romaji: 'etebo-su',
    pronunciation: 'e-te-bo--su',
    meaning: 'Long Tail Pokémon',
    explanation: '猿 (*ete*, monkey) + “boss”; a two-tailed master monkey.'
  },
  'フワンテ': {
japanese: 'フワンテ',
    romaji: 'fuwante',
    pronunciation: 'fu-wa-nte',
    meaning: 'Balloon Pokémon',
    explanation: 'ふわふわ (*fuwa*, light/fluffy) + balloon (*ente*). A soul-carrying balloon.'
  },
  'フワライド': {
japanese: 'フワライド',
    romaji: 'fuwaraido',
    pronunciation: 'fu-wa-ra-i-do',
    meaning: 'Blimp Pokémon',
    explanation: 'From *fuwa* (floaty) + “ride”; a dirigible ghost.'
  },
  'ミミロル': {
japanese: 'ミミロル',
    romaji: 'mimiroru',
    pronunciation: 'mi-mi-ro-ru',
    meaning: 'Rabbit Pokémon',
    explanation: '耳 (*mimi*, ear) + ロール (roll); a bunny with rolled ears.'
  },
  'ミミロップ': {
japanese: 'ミミロップ',
    romaji: 'mimirotsupu',
    pronunciation: 'mi-mi-ro-tsu-pu',
    meaning: 'Rabbit Pokémon',
    explanation: '耳 (*mimi*, ear) + “lop” (as in lop-eared rabbit).'
  },
  'ムウマージ': {
japanese: 'ムウマージ',
    romaji: 'muuma-ji',
    pronunciation: 'mu-u-ma--ji',
    meaning: 'Magical Pokémon',
    explanation: 'From ムウマ (Misdreavus’ JP name) + mage; a sorceress ghost.'
  },
  'ドンカラス': {
japanese: 'ドンカラス',
    romaji: 'donkarasu',
    pronunciation: 'do-nka-ra-su',
    meaning: 'Big Boss Pokémon',
    explanation: 'ドン (mafia boss) + 烏 (*karasu*, crow). A crime-boss crow.'
  },
  'ニャルマー': {
japanese: 'ニャルマー',
    romaji: 'nyaruma-',
    pronunciation: 'nya-ru-ma-',
    meaning: 'Catty Pokémon',
    explanation: 'ニャー (meow) + “allure”; a sly, charming cat.'
  },
  'ブニャット': {
japanese: 'ブニャット',
    romaji: 'bunyatsuto',
    pronunciation: 'bu-nya-tsu-to',
    meaning: 'Tiger Cat Pokémon',
    explanation: 'ブタ (pig/fat) + ニャー (meow) + -ット; a hefty, mean cat.'
  },
  'リーシャン': {
japanese: 'リーシャン',
    romaji: 'ri-shan',
    pronunciation: 'ri--sha-n',
    meaning: 'Bell Pokémon',
    explanation: '鈴 (*rin/rii*, bell) + 響 (*shan*, ring). A tiny bell spirit.'
  },
  'スカンプー': {
japanese: 'スカンプー',
    romaji: 'sukanpu-',
    pronunciation: 'su-ka-npu-',
    meaning: 'Skunk Pokémon',
    explanation: 'From “skunk” + プー (onomatopoeia for stink/fart). A stinky skunk.'
  },
  'スカタンク': {
japanese: 'スカタンク',
    romaji: 'sukatanku',
    pronunciation: 'su-ka-ta-nku',
    meaning: 'Skunk Pokémon',
    explanation: 'From “skunk” + “tank”; a powerful, noxious skunk.'
  },
  'ドーミラー': {
japanese: 'ドーミラー',
    romaji: 'do-mira-',
    pronunciation: 'do--mi-ra-',
    meaning: 'Bronze Pokémon',
    explanation: '銅 (*dō*, bronze) + 鏡 (*mirā*, mirror). Based on ancient mirrors.'
  },
  'ドータクン': {
japanese: 'ドータクン',
    romaji: 'do-takun',
    pronunciation: 'do--ta-ku-n',
    meaning: 'Bronze Bell Pokémon',
    explanation: '銅鐸 (*dōtaku*, ritual bronze bell). A bell spirit.'
  },
  'ウソハチ': {
japanese: 'ウソハチ',
    romaji: 'usohachi',
    pronunciation: 'u-so-ha-chi',
    meaning: 'Bonsai Pokémon',
    explanation: '嘘 (*uso*, lie/false) + ハチ (*hachi*, eight/child); a fake bonsai.'
  },
  'マネネ': {
japanese: 'マネネ',
    romaji: 'manene',
    pronunciation: 'ma-ne-ne',
    meaning: 'Mime Pokémon',
    explanation: '真似 (*mane*, mimic) + -ne (childlike). A baby mime.'
  },
  'ピンプク': {
japanese: 'ピンプク',
    romaji: 'pinpuku',
    pronunciation: 'pi-npu-ku',
    meaning: 'Playhouse Pokémon',
    explanation: 'From “pin” (tiny) + ぷくぷく (*puku puku*, chubby). A round baby Chansey.'
  },
  'ペラップ': {
japanese: 'ペラップ',
    romaji: 'peratsupu',
    pronunciation: 'pe-ra-tsu-pu',
    meaning: 'Music Note Pokémon',
    explanation: 'ペラペラ (*pera pera*, chatter) + parrot.'
  },
  'ミカルゲ': {
japanese: 'ミカルゲ',
    romaji: 'mikaruge',
    pronunciation: 'mi-ka-ru-ge',
    meaning: 'Forbidden Pokémon',
    explanation: '三百六十 (*sanbyakurokuju*) → 108; a cursed spirit bound in stone.'
  },
  'フカマル': {
japanese: 'フカマル',
    romaji: 'fukamaru',
    pronunciation: 'fu-ka-ma-ru',
    meaning: 'Land Shark Pokémon',
    explanation: '咬む (*fukamu*, to bite) + 丸 (*maru*, round). A small land shark.'
  },
  'ガバイト': {
japanese: 'ガバイト',
    romaji: 'gabaito',
    pronunciation: 'ga-ba-i-to',
    meaning: 'Cave Pokémon',
    explanation: 'ガブガブ (*gabu gabu*, gnash/chomp) + bite. Mid dragon form.'
  },
  'ガブリアス': {
japanese: 'ガブリアス',
    romaji: 'gaburiasu',
    pronunciation: 'ga-bu-ri-a-su',
    meaning: 'Mach Pokémon',
    explanation: 'From ガブ (chomp) + “arch”/“gorge”/“landmass.” A supersonic land shark.'
  },
  'ゴンベ': {
japanese: 'ゴンベ',
    romaji: 'gonbe',
    pronunciation: 'go-nbe',
    meaning: 'Big Eater Pokémon',
    explanation: 'ゴン (onomatopoeia for gulp) + べ (from 食べる, eat). A gluttonous baby.'
  },
  'リオル': {
japanese: 'リオル',
    romaji: 'rioru',
    pronunciation: 'ri-o-ru',
    meaning: 'Emanation Pokémon',
    explanation: 'A coined name evoking “aura”/“hero.”'
  },
  'ルカリオ': {
japanese: 'ルカリオ',
    romaji: 'rukario',
    pronunciation: 'ru-ka-ri-o',
    meaning: 'Aura Pokémon',
    explanation: 'Inspired by “oracle”/“aura”/“Luca.” A jackal aura fighter.'
  },
  'ヒポポタス': {
japanese: 'ヒポポタス',
    romaji: 'hipopotasu',
    pronunciation: 'hi-po-po-ta-su',
    meaning: 'Hippo Pokémon',
    explanation: 'Direct katakana of hippopotamus.'
  },
  'カバルドン': {
japanese: 'カバルドン',
    romaji: 'kabarudon',
    pronunciation: 'ka-ba-ru-do-n',
    meaning: 'Heavyweight Pokémon',
    explanation: 'From hippo + -don (tooth/large creature). A sand hippo.'
  },
  'スコルピ': {
japanese: 'スコルピ',
    romaji: 'sukorupi',
    pronunciation: 'su-ko-ru-pi',
    meaning: 'Scorpion Pokémon',
    explanation: 'From “scorpion.”'
  },
  'ドラピオン': {
japanese: 'ドラピオン',
    romaji: 'dorapion',
    pronunciation: 'do-ra-pi-o-n',
    meaning: 'Ogre Scorpion Pokémon',
    explanation: 'Altered from “scorpion.” A desert predator.'
  },
  'グレッグル': {
japanese: 'グレッグル',
    romaji: 'guretsuguru',
    pronunciation: 'gu-re-tsu-gu-ru',
    meaning: 'Toxic Mouth Pokémon',
    explanation: 'From “croak” + “gurgle.” A sly frog.'
  },
  'ドクロッグ': {
japanese: 'ドクロッグ',
    romaji: 'dokurotsugu',
    pronunciation: 'do-ku-ro-tsu-gu',
    meaning: 'Toxic Mouth Pokémon',
    explanation: 'From “toxic” + “croak.” A venomous frog.'
  },
  'マスキッパ': {
japanese: 'マスキッパ',
    romaji: 'masukitsupa',
    pronunciation: 'ma-su-ki-tsu-pa',
    meaning: 'Bug Catcher Pokémon',
    explanation: '方言 for Venus flytrap; a snapping plant.'
  },
  'ケイコウオ': {
japanese: 'ケイコウオ',
    romaji: 'keikouo',
    pronunciation: 'ke-i-ko-u-o',
    meaning: 'Wing Fish Pokémon',
    explanation: '蛍光 (*keikō*, fluorescence) + 魚 (*uo*, fish). A glowing fish.'
  },
  'ネオラント': {
japanese: 'ネオラント',
    romaji: 'neoranto',
    pronunciation: 'ne-o-ra-nto',
    meaning: 'Neon Pokémon',
    explanation: 'From “neon” + “elegant”; a luminous fish.'
  },
  'タマンタ': {
japanese: 'タマンタ',
    romaji: 'tamanta',
    pronunciation: 'ta-ma-nta',
    meaning: 'Kite Pokémon',
    explanation: '玉 (*tama*, sphere) + manta (ray). A baby manta ray.'
  },
  'ユキカブリ': {
japanese: 'ユキカブリ',
    romaji: 'yukikaburi',
    pronunciation: 'yu-ki-ka-bu-ri',
    meaning: 'Frost Tree Pokémon',
    explanation: '雪 (*yuki*, snow) + 被り (*kaburi*, covering). A snow-covered tree.'
  },
  'ユキノオー': {
japanese: 'ユキノオー',
    romaji: 'yukinoo-',
    pronunciation: 'yu-ki-no-o-',
    meaning: 'Frost Tree Pokémon',
    explanation: '雪 (*yuki*, snow) + 王 (*ō*, king). A yeti snow king.'
  },
  'マニューラ': {
japanese: 'マニューラ',
    romaji: 'manyu-ra',
    pronunciation: 'ma-nyu--ra',
    meaning: 'Sharp Claw Pokémon',
    explanation: '魔 (*ma*, demon) + ニューラ (Sneasel’s JP name). A vicious clawed weasel.'
  },
  'ジバコイル': {
japanese: 'ジバコイル',
    romaji: 'jibakoiru',
    pronunciation: 'ji-ba-ko-i-ru',
    meaning: 'Magnet Area Pokémon',
    explanation: '磁場 (*jiba*, magnetic field) + coil; UFO-like magnet.'
  },
  'ベロベルト': {
japanese: 'ベロベルト',
    romaji: 'beroberuto',
    pronunciation: 'be-ro-be-ru-to',
    meaning: 'Licking Pokémon',
    explanation: 'ベロ (bero, tongue) + ベルト (beruto, belt). A tongue-belt Pokémon.'
  },
  'ドサイドン': {
japanese: 'ドサイドン',
    romaji: 'dosaidon',
    pronunciation: 'do-sa-i-do-n',
    meaning: 'Drill Pokémon',
    explanation: 'ドサイ (dosai, massive) + -don (dinosaur suffix). A bulky armored rhino.'
  },
  'モジャンボ': {
japanese: 'モジャンボ',
    romaji: 'mojanbo',
    pronunciation: 'mo-ja-nbo',
    meaning: 'Vine Pokémon',
    explanation: 'もじゃもじゃ (*moja moja*, bushy) + jumbo. A tangle of vines.'
  },
  'エレキブル': {
japanese: 'エレキブル',
    romaji: 'erekiburu',
    pronunciation: 'e-re-ki-bu-ru',
    meaning: 'Thunderbolt Pokémon',
    explanation: 'エレキ (ereki, electric) + ブル (buru, bull/ogre). A power-wired beast.'
  },
  'ブーバーン': {
japanese: 'ブーバーン',
    romaji: 'bu-ba-n',
    pronunciation: 'bu--ba--n',
    meaning: 'Blast Pokémon',
    explanation: 'From Magmar’s JP name (ブーバー) + burn; a cannon-armed burner.'
  },
  'トゲキッス': {
japanese: 'トゲキッス',
    romaji: 'togekitsusu',
    pronunciation: 'to-ge-ki-tsu-su',
    meaning: 'Jubilee Pokémon',
    explanation: 'From “toge” (spike, Togepi line) + kiss; a blessed jubilee bird.'
  },
  'メガヤンマ': {
japanese: 'メガヤンマ',
    romaji: 'megayanma',
    pronunciation: 'me-ga-ya-nma',
    meaning: 'Ogre Darner Pokémon',
    explanation: 'From “mega” + ヤンマ (*yanma*, dragonfly). A giant dragonfly predator.'
  },
  'リーフィア': {
japanese: 'リーフィア',
    romaji: 'ri-fuia',
    pronunciation: 'ri--fu-i-a',
    meaning: 'Verdant Pokémon',
    explanation: 'From “leaf”; part of Eeveelution line.'
  },
  'グレイシア': {
japanese: 'グレイシア',
    romaji: 'gureishia',
    pronunciation: 'gu-re-i-shi-a',
    meaning: 'Fresh Snow Pokémon',
    explanation: 'From “glacier”; an ice Eeveelution.'
  },
  'グライオン': {
japanese: 'グライオン',
    romaji: 'guraion',
    pronunciation: 'gu-ra-i-o-n',
    meaning: 'Fang Scorpion Pokémon',
    explanation: 'From “glide” + scorpion; a bat-scorpion.'
  },
  'マンムー': {
japanese: 'マンムー',
    romaji: 'manmu-',
    pronunciation: 'ma-nmu-',
    meaning: 'Twin Tusk Pokémon',
    explanation: 'From “mammoth”; icy shaggy boar.'
  },
  'ポリゴンＺ': {
japanese: 'ポリゴンＺ',
    romaji: 'porigonＺ',
    pronunciation: 'po-ri-go-nｚ',
    meaning: 'Virtual Pokémon',
    explanation: 'From Porygon + letter Z; corrupted upgrade.'
  },
  'エルレイド': {
japanese: 'エルレイド',
    romaji: 'erureido',
    pronunciation: 'e-ru-re-i-do',
    meaning: 'Blade Pokémon',
    explanation: 'From エル (elegant/knightly) + blade. Male Ralts evolution.'
  },
  'ダイノーズ': {
japanese: 'ダイノーズ',
    romaji: 'daino-zu',
    pronunciation: 'da-i-no--zu',
    meaning: 'Compass Pokémon',
    explanation: '大 (*dai*, great) + nose. A magnetic guardian with nose motif.'
  },
  'ヨノワール': {
japanese: 'ヨノワール',
    romaji: 'yonowa-ru',
    pronunciation: 'yo-no-wa--ru',
    meaning: 'Gripper Pokémon',
    explanation: '夜 (*yo*, night) + noir; grim reaper spirit.'
  },
  'ユキメノコ': {
japanese: 'ユキメノコ',
    romaji: 'yukimenoko',
    pronunciation: 'yu-ki-me-no-ko',
    meaning: 'Snow Land Pokémon',
    explanation: '雪女 (*yuki-onna*, snow woman ghost) + 子 (*ko*, girl). A frosty yokai.'
  },
  'ロトム': {
japanese: 'ロトム',
    romaji: 'rotomu',
    pronunciation: 'ro-to-mu',
    meaning: 'Plasma Pokémon',
    explanation: 'An anagram of “motor.” A ghost inhabiting appliances.'
  },
  'ユクシー': {
japanese: 'ユクシー',
    romaji: 'yukushi-',
    pronunciation: 'yu-ku-shi-',
    meaning: 'Knowledge Pokémon',
    explanation: 'From “you” + “knowledge” roots; one of the lake trio.'
  },
  'エムリット': {
japanese: 'エムリット',
    romaji: 'emuritsuto',
    pronunciation: 'e-mu-ri-tsu-to',
    meaning: 'Emotion Pokémon',
    explanation: 'From “emotion”; a lake spirit.'
  },
  'アグノム': {
japanese: 'アグノム',
    romaji: 'agunomu',
    pronunciation: 'a-gu-no-mu',
    meaning: 'Willpower Pokémon',
    explanation: 'From “agni” (fire/will) + gnome; a lake spirit.'
  },
  'ディアルガ': {
japanese: 'ディアルガ',
    romaji: 'deiaruga',
    pronunciation: 'de-i-a-ru-ga',
    meaning: 'Temporal Pokémon',
    explanation: 'From “diamond” + “ga” (fang/suffix). Time deity.'
  },
  'パルキア': {
japanese: 'パルキア',
    romaji: 'parukia',
    pronunciation: 'pa-ru-ki-a',
    meaning: 'Spatial Pokémon',
    explanation: 'From “pearl” + coined suffix. Space deity.'
  },
  'ヒードラン': {
japanese: 'ヒードラン',
    romaji: 'hi-doran',
    pronunciation: 'hi--do-ra-n',
    meaning: 'Lava Dome Pokémon',
    explanation: 'From “heat” + “dragon”; molten magma beast.'
  },
  'レジギガス': {
japanese: 'レジギガス',
    romaji: 'rejigigasu',
    pronunciation: 're-ji-gi-ga-su',
    meaning: 'Colossal Pokémon',
    explanation: 'Regi prefix + giga (huge). Master of the Regis.'
  },
  'ギラティナ': {
japanese: 'ギラティナ',
    romaji: 'girateina',
    pronunciation: 'gi-ra-te-i-na',
    meaning: 'Renegade Pokémon',
    explanation: 'From “girasole” (sunflower, turning) or “girati” (Italian: turn) + -tina. Renegade deity.'
  },
  'クレセリア': {
japanese: 'クレセリア',
    romaji: 'kureseria',
    pronunciation: 'ku-re-se-ri-a',
    meaning: 'Lunar Pokémon',
    explanation: 'From “crescent” + -lia; lunar swan Pokémon.'
  },
  'フィオネ': {
japanese: 'フィオネ',
    romaji: 'fuione',
    pronunciation: 'fu-i-o-ne',
    meaning: 'Sea Drifter Pokémon',
    explanation: 'Possibly from “niphon” (sea) + -ne; offspring of Manaphy.'
  },
  'マナフィ': {
japanese: 'マナフィ',
    romaji: 'manafui',
    pronunciation: 'ma-na-fu-i',
    meaning: 'Seafaring Pokémon',
    explanation: 'From “mana” (life energy) + sea feel. Guardian of the sea.'
  },
  'ダークライ': {
japanese: 'ダークライ',
    romaji: 'da-kurai',
    pronunciation: 'da--ku-ra-i',
    meaning: 'Pitch-Black Pokémon',
    explanation: 'From “dark” + 来 (*rai*, coming) or cry. Bringer of nightmares.'
  },
  'シェイミ': {
japanese: 'シェイミ',
    romaji: 'shieimi',
    pronunciation: 'shi-e-i-mi',
    meaning: 'Gratitude Pokémon',
    explanation: 'From “shame”/“shamrock” + mini. A gratitude hedgehog.'
  },
  'アルセウス': {
japanese: 'アルセウス',
    romaji: 'aruseusu',
    pronunciation: 'a-ru-se-u-su',
    meaning: 'Alpha Pokémon',
    explanation: 'From “arch” (origin) + deus (god). The creator deity of Pokémon.'
  },
  'ビクティニ': {
japanese: 'ビクティニ',
    romaji: 'bikuteini',
    pronunciation: 'bi-ku-te-i-ni',
    meaning: 'Victory Pokémon',
    explanation: 'From “victory” + diminutive; a small victory Pokémon.'
  },
  'ツタージャ': {
japanese: 'ツタージャ',
    romaji: 'tsuta-ja',
    pronunciation: 'tsu-ta--ja',
    meaning: 'Grass Snake Pokémon',
    explanation: '蔦 (*tsuta*, vine) + 蛇 (*ja*, snake). A smug grass snake.'
  },
  'ジャノビー': {
japanese: 'ジャノビー',
    romaji: 'janobi-',
    pronunciation: 'ja-no-bi-',
    meaning: 'Grass Snake Pokémon',
    explanation: '蛇 (*ja*, snake) + noble. A refined serpent.'
  },
  'ジャローダ': {
japanese: 'ジャローダ',
    romaji: 'jaro-da',
    pronunciation: 'ja-ro--da',
    meaning: 'Regal Pokémon',
    explanation: '蛇 (*ja*, snake) + ロード (lord). Regal serpent.'
  },
  'ポカブ': {
japanese: 'ポカブ',
    romaji: 'pokabu',
    pronunciation: 'po-ka-bu',
    meaning: 'Fire Pig Pokémon',
    explanation: 'ぽかぽか (*poka*, warm) + 豚 (*buta/bu*). A fire piglet.'
  },
  'チャオブー': {
japanese: 'チャオブー',
    romaji: 'chaobu-',
    pronunciation: 'cha-o-bu-',
    meaning: 'Fire Pig Pokémon',
    explanation: 'チャオ (Chinese: “to fry” / roar) + ブー (oink). Fiery fighting pig.'
  },
  'エンブオー': {
japanese: 'エンブオー',
    romaji: 'enbuo-',
    pronunciation: 'e-nbu-o-',
    meaning: 'Mega Fire Pig Pokémon',
    explanation: '炎 (*en*, flame) + boar. A fire boar warrior.'
  },
  'ミジュマル': {
japanese: 'ミジュマル',
    romaji: 'mijumaru',
    pronunciation: 'mi-ju-ma-ru',
    meaning: 'Sea Otter Pokémon',
    explanation: '水 (*mizu*, water) + 丸 (*maru*, child suffix). A playful otter.'
  },
  'フタチマル': {
japanese: 'フタチマル',
    romaji: 'futachimaru',
    pronunciation: 'fu-ta-chi-ma-ru',
    meaning: 'Discipline Pokémon',
    explanation: '二 (*futa*, two) + 丸 (*maru*). Twin-sword otter.'
  },
  'ダイケンキ': {
japanese: 'ダイケンキ',
    romaji: 'daikenki',
    pronunciation: 'da-i-ke-nki',
    meaning: 'Formidable Pokémon',
    explanation: '大 (*dai*, great) + 剣 (*ken*, sword) + 騎 (*ki*, knight). A samurai otter.'
  },
  'ミネズミ': {
japanese: 'ミネズミ',
    romaji: 'minezumi',
    pronunciation: 'mi-ne-zu-mi',
    meaning: 'Scout Pokémon',
    explanation: '見 (*mi*, watch) + 鼠 (*nezumi*, mouse). A vigilant sentry.'
  },
  'ミルホッグ': {
japanese: 'ミルホッグ',
    romaji: 'miruhotsugu',
    pronunciation: 'mi-ru-ho-tsu-gu',
    meaning: 'Lookout Pokémon',
    explanation: '見る (*miru*, see) + hog. A watchful meerkat.'
  },
  'ヨーテリー': {
japanese: 'ヨーテリー',
    romaji: 'yo-teri-',
    pronunciation: 'yo--te-ri-',
    meaning: 'Puppy Pokémon',
    explanation: 'From “Yorkshire terrier.” A loyal puppy.'
  },
  'ハーデリア': {
japanese: 'ハーデリア',
    romaji: 'ha-deria',
    pronunciation: 'ha--de-ri-a',
    meaning: 'Loyal Dog Pokémon',
    explanation: 'From “hardy” + terrier; a faithful guard dog.'
  },
  'ムーランド': {
japanese: 'ムーランド',
    romaji: 'mu-rando',
    pronunciation: 'mu--ra-ndo',
    meaning: 'Big-Hearted Pokémon',
    explanation: 'From “muzzle/mutt” + land. A noble mustached hound.'
  },
  'チョロネコ': {
japanese: 'チョロネコ',
    romaji: 'choroneko',
    pronunciation: 'cho-ro-ne-ko',
    meaning: 'Devious Pokémon',
    explanation: 'ちょろい (*choroi*, sly/easy trickster) + 猫 (*neko*, cat). A mischievous cat.'
  },
  'レパルダス': {
japanese: 'レパルダス',
    romaji: 'reparudasu',
    pronunciation: 're-pa-ru-da-su',
    meaning: 'Cruel Pokémon',
    explanation: 'From “leopard.” A sleek spotted predator.'
  },
  'ヤナップ': {
japanese: 'ヤナップ',
    romaji: 'yanatsupu',
    pronunciation: 'ya-na-tsu-pu',
    meaning: 'Grass Monkey Pokémon',
    explanation: '柳 (*yanagi*, willow) + ape/monkey. Grass monkey.'
  },
  'ヤナッキー': {
japanese: 'ヤナッキー',
    romaji: 'yanatsuki-',
    pronunciation: 'ya-na-tsu-ki-',
    meaning: 'Thorn Monkey Pokémon',
    explanation: 'Same as above with -キー for emphasis; fierce grass monkey.'
  },
  'バオップ': {
japanese: 'バオップ',
    romaji: 'baotsupu',
    pronunciation: 'ba-o-tsu-pu',
    meaning: 'High Temp Pokémon',
    explanation: '爆 (*bao*, burst/fire) + monkey. Fire monkey.'
  },
  'バオッキー': {
japanese: 'バオッキー',
    romaji: 'baotsuki-',
    pronunciation: 'ba-o-tsu-ki-',
    meaning: 'Ember Pokémon',
    explanation: 'Same as Pansear; fiery hot monkey.'
  },
  'ヒヤップ': {
japanese: 'ヒヤップ',
    romaji: 'hiyatsupu',
    pronunciation: 'hi-ya-tsu-pu',
    meaning: 'Spray Pokémon',
    explanation: '冷やす (*hiyasu*, to cool) + monkey. Water monkey.'
  },
  'ヒヤッキー': {
japanese: 'ヒヤッキー',
    romaji: 'hiyatsuki-',
    pronunciation: 'hi-ya-tsu-ki-',
    meaning: 'Geyser Pokémon',
    explanation: 'Same as above, with -キー emphasis. Water monkey.'
  },
  'ムンナ': {
japanese: 'ムンナ',
    romaji: 'munna',
    pronunciation: 'mu-nna',
    meaning: 'Dream Eater Pokémon',
    explanation: 'From “moon” + 子 (*na*, diminutive). Dream eater piglet.'
  },
  'ムシャーナ': {
japanese: 'ムシャーナ',
    romaji: 'musha-na',
    pronunciation: 'mu-sha--na',
    meaning: 'Drowsing Pokémon',
    explanation: 'From *mushamusha* (dozing) + lunar motif. Dream tapir.'
  },
  'マメパト': {
japanese: 'マメパト',
    romaji: 'mamepato',
    pronunciation: 'ma-me-pa-to',
    meaning: 'Tiny Pigeon Pokémon',
    explanation: '豆 (*mame*, bean/small) + 鳩 (*hato*, pigeon). Tiny pigeon.'
  },
  'ハトーボー': {
japanese: 'ハトーボー',
    romaji: 'hato-bo-',
    pronunciation: 'ha-to--bo-',
    meaning: 'Wild Pigeon Pokémon',
    explanation: '鳩 (*hato*, pigeon) + 坊 (*bō*, boy). A calm dove.'
  },
  'ケンホロウ': {
japanese: 'ケンホロウ',
    romaji: 'kenhorou',
    pronunciation: 'ke-nho-ro-u',
    meaning: 'Proud Pokémon',
    explanation: '拳 (*ken*, fist) + 雉 (*horō*, pheasant). A martial pheasant.'
  },
  'シママ': {
japanese: 'シママ',
    romaji: 'shimama',
    pronunciation: 'shi-ma-ma',
    meaning: 'Electrified Pokémon',
    explanation: '縞 (*shima*, stripe) + 馬 (*uma*, horse). A striped foal.'
  },
  'ゼブライカ': {
japanese: 'ゼブライカ',
    romaji: 'zeburaika',
    pronunciation: 'ze-bu-ra-i-ka',
    meaning: 'Thunderbolt Pokémon',
    explanation: 'From “zebra” + 雷 (*raika*, thunder). A thunder zebra.'
  },
  'ダンゴロ': {
japanese: 'ダンゴロ',
    romaji: 'dangoro',
    pronunciation: 'da-ngo-ro',
    meaning: 'Mantle Pokémon',
    explanation: '団子 (*dango*, lump) + 石 (*ishi*, rock). A round rock.'
  },
  'ガントル': {
japanese: 'ガントル',
    romaji: 'gantoru',
    pronunciation: 'ga-nto-ru',
    meaning: 'Ore Pokémon',
    explanation: 'From “gan” (rock) + “ore.” A crystallized boulder.'
  },
  'ギガイアス': {
japanese: 'ギガイアス',
    romaji: 'gigaiasu',
    pronunciation: 'gi-ga-i-a-su',
    meaning: 'Compressed Pokémon',
    explanation: 'From “giga” (giant) + *iasu* (earth). A massive geode.'
  },
  'コロモリ': {
japanese: 'コロモリ',
    romaji: 'koromori',
    pronunciation: 'ko-ro-mo-ri',
    meaning: 'Bat Pokémon',
    explanation: '衣 (*koromo*, cloth) + 蝙蝠 (*komori*, bat). A fuzzy bat.'
  },
  'ココロモリ': {
japanese: 'ココロモリ',
    romaji: 'kokoromori',
    pronunciation: 'ko-ko-ro-mo-ri',
    meaning: 'Courting Pokémon',
    explanation: '心 (*kokoro*, heart) + bat. A heart-nosed bat.'
  },
  'モグリュー': {
japanese: 'モグリュー',
    romaji: 'moguryu-',
    pronunciation: 'mo-gu-ryu-',
    meaning: 'Mole Pokémon',
    explanation: '土竜 (*mogura*, mole) + dragon/claw (*ryū*). A digging mole.'
  },
  'ドリュウズ': {
japanese: 'ドリュウズ',
    romaji: 'doryuuzu',
    pronunciation: 'do-ryu-u-zu',
    meaning: 'Subterrene Pokémon',
    explanation: 'ドリル (drill) + 土竜 (*mogura*, mole). A steel mole with drills.'
  },
  'タブンネ': {
japanese: 'タブンネ',
    romaji: 'tabunne',
    pronunciation: 'ta-bu-nne',
    meaning: 'Hearing Pokémon',
    explanation: '多分ね (*tabun ne*, “maybe”). A kindly, hearing healer.'
  },
  'ドッコラー': {
japanese: 'ドッコラー',
    romaji: 'dotsukora-',
    pronunciation: 'do-tsu-ko-ra-',
    meaning: 'Muscular Pokémon',
    explanation: '独鈷 (*dokko*, Buddhist tool) / ドッコイ (heave-ho) + timber. A worker Pokémon.'
  },
  'ドテッコツ': {
japanese: 'ドテッコツ',
    romaji: 'dotetsukotsu',
    pronunciation: 'do-te-tsu-ko-tsu',
    meaning: 'Muscular Pokémon',
    explanation: '鉄骨 (*tekkotsu*, iron beam) with prefix. A construction Pokémon.'
  },
  'ローブシン': {
japanese: 'ローブシン',
    romaji: 'ro-bushin',
    pronunciation: 'ro--bu-shi-n',
    meaning: 'Muscular Pokémon',
    explanation: '老 (*rō*, old) + 武神 (*bushin*, war god). A muscular elder.'
  },
  'オタマロ': {
japanese: 'オタマロ',
    romaji: 'otamaro',
    pronunciation: 'o-ta-ma-ro',
    meaning: 'Tadpole Pokémon',
    explanation: 'おたまじゃくし (*otamajakushi*, tadpole). A singing tadpole.'
  },
  'ガマガル': {
japanese: 'ガマガル',
    romaji: 'gamagaru',
    pronunciation: 'ga-ma-ga-ru',
    meaning: 'Vibration Pokémon',
    explanation: '蝦蟇 (*gama*, toad) + がる (croak). A warty toad.'
  },
  'ガマゲロゲ': {
japanese: 'ガマゲロゲ',
    romaji: 'gamageroge',
    pronunciation: 'ga-ma-ge-ro-ge',
    meaning: 'Vibration Pokémon',
    explanation: 'がま (toad) + ゲロゲロ (ribbit croak). A vibrating toad.'
  },
  'ナゲキ': {
japanese: 'ナゲキ',
    romaji: 'nageki',
    pronunciation: 'na-ge-ki',
    meaning: 'Judo Pokémon',
    explanation: '投げ (*nage*, throw). A red judo thrower.'
  },
  'ダゲキ': {
japanese: 'ダゲキ',
    romaji: 'dageki',
    pronunciation: 'da-ge-ki',
    meaning: 'Karate Pokémon',
    explanation: '打撃 (*dageki*, strike). A blue karate striker.'
  },
  'クルミル': {
japanese: 'クルミル',
    romaji: 'kurumiru',
    pronunciation: 'ku-ru-mi-ru',
    meaning: 'Sewing Pokémon',
    explanation: '包む (*kurumu*, wrap) + 虫 (*mushi*, bug). A leaf-wrapped larva.'
  },
  'クルマユ': {
japanese: 'クルマユ',
    romaji: 'kurumayu',
    pronunciation: 'ku-ru-ma-yu',
    meaning: 'Leaf-Wrapped Pokémon',
    explanation: '包む (*kurumu*, wrap) + 繭 (*mayu*, cocoon). A cloaked cocoon bug.'
  },
  'ハハコモリ': {
japanese: 'ハハコモリ',
    romaji: 'hahakomori',
    pronunciation: 'ha-ha-ko-mo-ri',
    meaning: 'Nurturing Pokémon',
    explanation: '母 (*haha*, mother) + 蟷螂 (*kamakiri*). A nurturing mantis.'
  },
  'フシデ': {
japanese: 'フシデ',
    romaji: 'fushide',
    pronunciation: 'fu-shi-de',
    meaning: 'Centipede Pokémon',
    explanation: '節 (*fushi*, segment/joint) + millepede. A small centipede.'
  },
  'ホイーガ': {
japanese: 'ホイーガ',
    romaji: 'hoi-ga',
    pronunciation: 'ho-i--ga',
    meaning: 'Curlipede Pokémon',
    explanation: 'From “wheel” + bug. A rolling cocoon bug.'
  },
  'ペンドラー': {
japanese: 'ペンドラー',
    romaji: 'pendora-',
    pronunciation: 'pe-ndo-ra-',
    meaning: 'Megapede Pokémon',
    explanation: 'From “centipede.” A huge centipede predator.'
  },
  'モンメン': {
japanese: 'モンメン',
    romaji: 'monmen',
    pronunciation: 'mo-nme-n',
    meaning: 'Cotton Puff Pokémon',
    explanation: '綿 (*men*, cotton) + 蒙綿 (monmen, cotton). A cotton fluff.'
  },
  'エルフーン': {
japanese: 'エルフーン',
    romaji: 'erufu-n',
    pronunciation: 'e-ru-fu--n',
    meaning: 'Windveiled Pokémon',
    explanation: 'From “elf” + ふんわり (*funwari*, fluffy). A mischievous fluff.'
  },
  'チュリネ': {
japanese: 'チュリネ',
    romaji: 'churine',
    pronunciation: 'chu-ri-ne',
    meaning: 'Bulb Pokémon',
    explanation: 'From “tulip” + 根 (*ne*, root). A tulip bulb.'
  },
  'ドレディア': {
japanese: 'ドレディア',
    romaji: 'doredeia',
    pronunciation: 'do-re-de-i-a',
    meaning: 'Flowering Pokémon',
    explanation: 'From “dress” + lady. A dancing noble flower.'
  },
  'バスラオ': {
japanese: 'バスラオ',
    romaji: 'basurao',
    pronunciation: 'ba-su-ra-o',
    meaning: 'Hostile Pokémon',
    explanation: 'From “bass” + 荒い (*arai*, rough/violent). An aggressive fish.'
  },
  'メグロコ': {
japanese: 'メグロコ',
    romaji: 'meguroko',
    pronunciation: 'me-gu-ro-ko',
    meaning: 'Desert Croc Pokémon',
    explanation: '目黒 (*meguro*, black eyes) + crocodile. A desert croc.'
  },
  'ワルビル': {
japanese: 'ワルビル',
    romaji: 'warubiru',
    pronunciation: 'wa-ru-bi-ru',
    meaning: 'Desert Croc Pokémon',
    explanation: '悪 (*warui*, bad) + crocodile. A bandit croc.'
  },
  'ワルビアル': {
japanese: 'ワルビアル',
    romaji: 'warubiaru',
    pronunciation: 'wa-ru-bi-a-ru',
    meaning: 'Intimidation Pokémon',
    explanation: '悪 (*warui*, bad) + crocodile. A gangster croc.'
  },
  'ダルマッカ': {
japanese: 'ダルマッカ',
    romaji: 'darumatsuka',
    pronunciation: 'da-ru-ma-tsu-ka',
    meaning: 'Zen Charm Pokémon',
    explanation: '達磨 (*daruma*, traditional doll) + -ッカ (cute diminutive). A fiery daruma doll.'
  },
  'ヒヒダルマ': {
japanese: 'ヒヒダルマ',
    romaji: 'hihidaruma',
    pronunciation: 'hi-hi-da-ru-ma',
    meaning: 'Blazing Pokémon',
    explanation: 'ヒヒ (hihi, baboon) + 達磨 (*daruma*, doll). A fiery daruma baboon.'
  },
  'マラカッチ': {
japanese: 'マラカッチ',
    romaji: 'marakatsuchi',
    pronunciation: 'ma-ra-ka-tsu-chi',
    meaning: 'Cactus Pokémon',
    explanation: 'From “maracas” + cactus. A dancing cactus.'
  },
  'イシズマイ': {
japanese: 'イシズマイ',
    romaji: 'ishizumai',
    pronunciation: 'i-shi-zu-ma-i',
    meaning: 'Rock Inn Pokémon',
    explanation: '石住まい (*ishi-zumai*, rock dweller). A hermit crab with a rock shell.'
  },
  'イワパレス': {
japanese: 'イワパレス',
    romaji: 'iwaparesu',
    pronunciation: 'i-wa-pa-re-su',
    meaning: 'Stone Home Pokémon',
    explanation: '岩 (*iwa*, rock) + “palace.” A giant rock-carrying crab.'
  },
  'ズルッグ': {
japanese: 'ズルッグ',
    romaji: 'zurutsugu',
    pronunciation: 'zu-ru-tsu-gu',
    meaning: 'Shedding Pokémon',
    explanation: 'ずるい (*zurui*, sly/slouchy) + gurgle. A pants-drooping lizard.'
  },
  'ズルズキン': {
japanese: 'ズルズキン',
    romaji: 'zuruzukin',
    pronunciation: 'zu-ru-zu-ki-n',
    meaning: 'Hoodlum Pokémon',
    explanation: 'From ずる (*zuru*, sly) + 頭巾 (*zukin*, hood). A gangster lizard.'
  },
  'シンボラー': {
japanese: 'シンボラー',
    romaji: 'shinbora-',
    pronunciation: 'shi-nbo-ra-',
    meaning: 'Avianoid Pokémon',
    explanation: 'From “symbol”; patterned after Nazca lines.'
  },
  'デスマス': {
japanese: 'デスマス',
    romaji: 'desumasu',
    pronunciation: 'de-su-ma-su',
    meaning: 'Spirit Pokémon',
    explanation: 'From “death” + mask. A spirit with its mask.'
  },
  'デスカーン': {
japanese: 'デスカーン',
    romaji: 'desuka-n',
    pronunciation: 'de-su-ka--n',
    meaning: 'Coffin Pokémon',
    explanation: 'From “death” + sarcophagus. A coffin ghost.'
  },
  'プロトーガ': {
japanese: 'プロトーガ',
    romaji: 'puroto-ga',
    pronunciation: 'pu-ro-to--ga',
    meaning: 'Prototurtle Pokémon',
    explanation: 'From “prototype/proto” + turtle. An ancient turtle.'
  },
  'アバゴーラ': {
japanese: 'アバゴーラ',
    romaji: 'abago-ra',
    pronunciation: 'a-ba-go--ra',
    meaning: 'Prototurtle Pokémon',
    explanation: 'Possibly from アバ (aba, archaic) + tortoise. A fossil turtle.'
  },
  'アーケン': {
japanese: 'アーケン',
    romaji: 'a-ken',
    pronunciation: 'a--ke-n',
    meaning: 'First Bird Pokémon',
    explanation: 'From “archaeo-” + -en. A fossil bird.'
  },
  'アーケオス': {
japanese: 'アーケオス',
    romaji: 'a-keosu',
    pronunciation: 'a--ke-o-su',
    meaning: 'First Bird Pokémon',
    explanation: 'From “archaeo-” + ops. A prehistoric bird.'
  },
  'ヤブクロン': {
japanese: 'ヤブクロン',
    romaji: 'yabukuron',
    pronunciation: 'ya-bu-ku-ro-n',
    meaning: 'Trash Bag Pokémon',
    explanation: '袋 (*fukuro*, bag) + trash. A garbage bag Pokémon.'
  },
  'ダストダス': {
japanese: 'ダストダス',
    romaji: 'dasutodasu',
    pronunciation: 'da-su-to-da-su',
    meaning: 'Trash Heap Pokémon',
    explanation: 'From “dust” + 出す (*dasu*, to emit). A trash heap.'
  },
  'ゾロア': {
japanese: 'ゾロア',
    romaji: 'zoroa',
    pronunciation: 'zo-ro-a',
    meaning: 'Tricky Fox Pokémon',
    explanation: 'From “zorro” (fox in Spanish). A trickster fox.'
  },
  'ゾロアーク': {
japanese: 'ゾロアーク',
    romaji: 'zoroa-ku',
    pronunciation: 'zo-ro-a--ku',
    meaning: 'Illusion Fox Pokémon',
    explanation: 'From “zorro” + arc/arch. An illusion fox.'
  },
  'チラーミィ': {
japanese: 'チラーミィ',
    romaji: 'chira-mii',
    pronunciation: 'chi-ra--mi-i',
    meaning: 'Chinchilla Pokémon',
    explanation: 'ちらちら (*chira*, flicker) + ミィ (cute squeak). A tidy chinchilla.'
  },
  'チラチーノ': {
japanese: 'チラチーノ',
    romaji: 'chirachi-no',
    pronunciation: 'chi-ra-chi--no',
    meaning: 'Scarf Pokémon',
    explanation: 'From *chira* (flicker) + chinchilla. An elegant chinchilla.'
  },
  'ゴチム': {
japanese: 'ゴチム',
    romaji: 'gochimu',
    pronunciation: 'go-chi-mu',
    meaning: 'Fixation Pokémon',
    explanation: 'From “gothic” + child suffix. A gothic doll.'
  },
  'ゴチミル': {
japanese: 'ゴチミル',
    romaji: 'gochimiru',
    pronunciation: 'go-chi-mi-ru',
    meaning: 'Manipulate Pokémon',
    explanation: 'From “gothic” + ミル (mil, middle). A gothic teen.'
  },
  'ゴチルゼル': {
japanese: 'ゴチルゼル',
    romaji: 'gochiruzeru',
    pronunciation: 'go-chi-ru-ze-ru',
    meaning: 'Astral Body Pokémon',
    explanation: 'From “gothic” + mademoiselle. A gothic lady.'
  },
  'ユニラン': {
japanese: 'ユニラン',
    romaji: 'yuniran',
    pronunciation: 'yu-ni-ra-n',
    meaning: 'Cell Pokémon',
    explanation: 'From “unicellular.” A single-cell Pokémon.'
  },
  'ダブラン': {
japanese: 'ダブラン',
    romaji: 'daburan',
    pronunciation: 'da-bu-ra-n',
    meaning: 'Mitosis Pokémon',
    explanation: 'From “double” + cell. A split-cell Pokémon.'
  },
  'ランクルス': {
japanese: 'ランクルス',
    romaji: 'rankurusu',
    pronunciation: 'ra-nku-ru-su',
    meaning: 'Multiplying Pokémon',
    explanation: 'From “homunculus.” A cell colony psychic.'
  },
  'コアルヒー': {
japanese: 'コアルヒー',
    romaji: 'koaruhi-',
    pronunciation: 'ko-a-ru-hi-',
    meaning: 'Water Bird Pokémon',
    explanation: '子 (*ko*, child) + アヒル (*ahiru*, duck). A duckling.'
  },
  'スワンナ': {
japanese: 'スワンナ',
    romaji: 'suwanna',
    pronunciation: 'su-wa-nna',
    meaning: 'White Bird Pokémon',
    explanation: 'From “swan.” A graceful swan dancer.'
  },
  'バニプッチ': {
japanese: 'バニプッチ',
    romaji: 'baniputsuchi',
    pronunciation: 'ba-ni-pu-tsu-chi',
    meaning: 'Fresh Snow Pokémon',
    explanation: 'From “vanilla” + small suffix. An ice cream cone.'
  },
  'バニリッチ': {
japanese: 'バニリッチ',
    romaji: 'baniritsuchi',
    pronunciation: 'ba-ni-ri-tsu-chi',
    meaning: 'Icy Snow Pokémon',
    explanation: 'From “vanilla” + rich. A bigger ice cream cone.'
  },
  'バイバニラ': {
japanese: 'バイバニラ',
    romaji: 'baibanira',
    pronunciation: 'ba-i-ba-ni-ra',
    meaning: 'Snowstorm Pokémon',
    explanation: 'From “bye-bye vanilla.” A twin ice cream cone.'
  },
  'シキジカ': {
japanese: 'シキジカ',
    romaji: 'shikijika',
    pronunciation: 'shi-ki-ji-ka',
    meaning: 'Season Pokémon',
    explanation: '鹿 (*shika*, deer) + 子 (*jika/ko*, child). A seasonal deer.'
  },
  'メブキジカ': {
japanese: 'メブキジカ',
    romaji: 'mebukijika',
    pronunciation: 'me-bu-ki-ji-ka',
    meaning: 'Season Pokémon',
    explanation: '芽吹き (*mebuki*, budding) + 鹿 (*shika*, deer). A seasonal stag.'
  },
  'エモンガ': {
japanese: 'エモンガ',
    romaji: 'emonga',
    pronunciation: 'e-mo-nga',
    meaning: 'Sky Squirrel Pokémon',
    explanation: 'From “electric” + モモンガ (*momonga*, flying squirrel).'
  },
  'カブルモ': {
japanese: 'カブルモ',
    romaji: 'kaburumo',
    pronunciation: 'ka-bu-ru-mo',
    meaning: 'Clamping Pokémon',
    explanation: '頭突き (*kaburi*, headbutt) + 虫 (*mushi*, bug). A charging bug.'
  },
  'シュバルゴ': {
japanese: 'シュバルゴ',
    romaji: 'shubarugo',
    pronunciation: 'shu-ba-ru-go',
    meaning: 'Cavalry Pokémon',
    explanation: 'From French “chevalier” (knight). A lance-armored bug.'
  },
  'タマゲタケ': {
japanese: 'タマゲタケ',
    romaji: 'tamagetake',
    pronunciation: 'ta-ma-ge-ta-ke',
    meaning: 'Mushroom Pokémon',
    explanation: '驚く (*tamage*, to be surprised) +茸 (*take*, mushroom). A mushroom mimic.'
  },
  'モロバレル': {
japanese: 'モロバレル',
    romaji: 'morobareru',
    pronunciation: 'mo-ro-ba-re-ru',
    meaning: 'Mushroom Pokémon',
    explanation: 'ばれる (*bareru*, exposed) + mushroom. A mushroom with Pokéball caps.'
  },
  'プルリル': {
japanese: 'プルリル',
    romaji: 'pururiru',
    pronunciation: 'pu-ru-ri-ru',
    meaning: 'Floating Pokémon',
    explanation: 'From “prune” + rill. A jellyfish.'
  },
  'ブルンゲル': {
japanese: 'ブルンゲル',
    romaji: 'burungeru',
    pronunciation: 'bu-ru-nge-ru',
    meaning: 'Floating Pokémon',
    explanation: 'From “balloon” + gel. A jellyfish monarch.'
  },
  'ママンボウ': {
japanese: 'ママンボウ',
    romaji: 'mamanbou',
    pronunciation: 'ma-ma-nbo-u',
    meaning: 'Caring Pokémon',
    explanation: 'ママ (mama) + 翻車魚 (*manbō*, ocean sunfish). A motherly healer.'
  },
  'バチュル': {
japanese: 'バチュル',
    romaji: 'bachuru',
    pronunciation: 'ba-chu-ru',
    meaning: 'Attaching Pokémon',
    explanation: 'バチバチ (*bachibachi*, crackle) + bug. A tiny electric spider.'
  },
  'デンチュラ': {
japanese: 'デンチュラ',
    romaji: 'denchura',
    pronunciation: 'de-nchu-ra',
    meaning: 'EleSpider Pokémon',
    explanation: '電 (*den*, electric) + tarantula. A large spider.'
  },
  'テッシード': {
japanese: 'テッシード',
    romaji: 'tetsushi-do',
    pronunciation: 'te-tsu-shi--do',
    meaning: 'Thorn Seed Pokémon',
    explanation: '鉄 (*tetsu*, iron) + seed. A spiky seed.'
  },
  'ナットレイ': {
japanese: 'ナットレイ',
    romaji: 'natsutorei',
    pronunciation: 'na-tsu-to-re-i',
    meaning: 'Thorn Pod Pokémon',
    explanation: 'From “nut” + thorn. A spiky vine ball.'
  },
  'ギアル': {
japanese: 'ギアル',
    romaji: 'giaru',
    pronunciation: 'gi-a-ru',
    meaning: 'Gear Pokémon',
    explanation: 'From “gear.” A gear Pokémon.'
  },
  'ギギアル': {
japanese: 'ギギアル',
    romaji: 'gigiaru',
    pronunciation: 'gi-gi-a-ru',
    meaning: 'Gear Pokémon',
    explanation: 'Reduplication of gear. A pair of gears.'
  },
  'ギギギアル': {
japanese: 'ギギギアル',
    romaji: 'gigigiaru',
    pronunciation: 'gi-gi-gi-a-ru',
    meaning: 'Gear Pokémon',
    explanation: 'From “gear” repeated thrice. A full gear system.'
  },
  'シビシラス': {
japanese: 'シビシラス',
    romaji: 'shibishirasu',
    pronunciation: 'shi-bi-shi-ra-su',
    meaning: 'EleFish Pokémon',
    explanation: '痺れ (*shibire*, numb) + シラス (*shirasu*, whitebait fish). A tiny electric eel.'
  },
  'シビビール': {
japanese: 'シビビール',
    romaji: 'shibibi-ru',
    pronunciation: 'shi-bi-bi--ru',
    meaning: 'EleFish Pokémon',
    explanation: '痺れ (*shibire*, numb) + “eel.” A mid-stage eel.'
  },
  'シビルドン': {
japanese: 'シビルドン',
    romaji: 'shibirudon',
    pronunciation: 'shi-bi-ru-do-n',
    meaning: 'EleFish Pokémon',
    explanation: '痺れ (*shibire*) + “don” (large/dragon suffix). A final eel predator.'
  },
  'リグレー': {
japanese: 'リグレー',
    romaji: 'rigure-',
    pronunciation: 'ri-gu-re-',
    meaning: 'Cerebral Pokémon',
    explanation: 'From “little grey,” a common alien depiction.'
  },
  'オーベム': {
japanese: 'オーベム',
    romaji: 'o-bemu',
    pronunciation: 'o--be-mu',
    meaning: 'Cerebral Pokémon',
    explanation: 'From “OBE” (close encounter code) or UFO slang. A classic alien.'
  },
  'ヒトモシ': {
japanese: 'ヒトモシ',
    romaji: 'hitomoshi',
    pronunciation: 'hi-to-mo-shi',
    meaning: 'Candle Pokémon',
    explanation: '火 (*hi*, fire) + 灯 (*tomoshi*, lamp). A candle with a spirit flame.'
  },
  'ランプラー': {
japanese: 'ランプラー',
    romaji: 'ranpura-',
    pronunciation: 'ra-npu-ra-',
    meaning: 'Lamp Pokémon',
    explanation: 'From “lamp.” A ghostly street lamp.'
  },
  'シャンデラ': {
japanese: 'シャンデラ',
    romaji: 'shandera',
    pronunciation: 'sha-nde-ra',
    meaning: 'Luring Pokémon',
    explanation: 'From “chandelier.” A ghostly chandelier.'
  },
  'キバゴ': {
japanese: 'キバゴ',
    romaji: 'kibago',
    pronunciation: 'ki-ba-go',
    meaning: 'Tusk Pokémon',
    explanation: '牙 (*kiba*, fang) + 子 (*ko/go*, child). A tusked child dragon.'
  },
  'オノンド': {
japanese: 'オノンド',
    romaji: 'onondo',
    pronunciation: 'o-no-ndo',
    meaning: 'Axe Jaw Pokémon',
    explanation: '斧 (*ono*, axe) + sound suffix. A tusked axe dragon.'
  },
  'オノノクス': {
japanese: 'オノノクス',
    romaji: 'ononokusu',
    pronunciation: 'o-no-no-ku-su',
    meaning: 'Axe Jaw Pokémon',
    explanation: '斧 (*ono*, axe) + “noxious/ferocious.” A powerful axe dragon.'
  },
  'クマシュン': {
japanese: 'クマシュン',
    romaji: 'kumashun',
    pronunciation: 'ku-ma-shu-n',
    meaning: 'Chill Pokémon',
    explanation: '熊 (*kuma*, bear) + “achoo” sneeze. A sniffly bear cub.'
  },
  'ツンベアー': {
japanese: 'ツンベアー',
    romaji: 'tsunbea-',
    pronunciation: 'tsu-nbe-a-',
    meaning: 'Freezing Pokémon',
    explanation: 'From “tsun” (cold) + bear. A fierce polar bear.'
  },
  'フリージオ': {
japanese: 'フリージオ',
    romaji: 'furi-jio',
    pronunciation: 'fu-ri--ji-o',
    meaning: 'Crystallizing Pokémon',
    explanation: 'From “freeze” + “geo.” An ice crystal.'
  },
  'チョボマキ': {
japanese: 'チョボマキ',
    romaji: 'chobomaki',
    pronunciation: 'cho-bo-ma-ki',
    meaning: 'Snail Pokémon',
    explanation: 'ちょぼ (*chobo*, small) + 巻き (*maki*, roll/wrap). A wrapped clam bug.'
  },
  'アギルダー': {
japanese: 'アギルダー',
    romaji: 'agiruda-',
    pronunciation: 'a-gi-ru-da-',
    meaning: 'Shell Out Pokémon',
    explanation: 'From “agile” + soldier. A ninja-like bug.'
  },
  'マッギョ': {
japanese: 'マッギョ',
    romaji: 'matsugyo',
    pronunciation: 'ma-tsu-gyo',
    meaning: 'Trap Pokémon',
    explanation: '真っ平 (*mappira*, flat) + 魚 (*gyo*, fish). A flat fish.'
  },
  'コジョフー': {
japanese: 'コジョフー',
    romaji: 'kojofu-',
    pronunciation: 'ko-jo-fu-',
    meaning: 'Martial Arts Pokémon',
    explanation: '小 (*ko*, small) + 拳法 (*kenpō*). A martial arts weasel.'
  },
  'コジョンド': {
japanese: 'コジョンド',
    romaji: 'kojondo',
    pronunciation: 'ko-jo-ndo',
    meaning: 'Martial Arts Pokémon',
    explanation: '小 (*ko*) + 拳道 (*kendō*) + “don.” A martial master weasel.'
  },
  'クリムガン': {
japanese: 'クリムガン',
    romaji: 'kurimugan',
    pronunciation: 'ku-ri-mu-ga-n',
    meaning: 'Cave Pokémon',
    explanation: 'Crimson-colored dragon with a rocky face.'
  },
  'ゴビット': {
japanese: 'ゴビット',
    romaji: 'gobitsuto',
    pronunciation: 'go-bi-tsu-to',
    meaning: 'Automaton Pokémon',
    explanation: 'From “golem” + bit. A small automaton.'
  },
  'ゴルーグ': {
japanese: 'ゴルーグ',
    romaji: 'goru-gu',
    pronunciation: 'go-ru--gu',
    meaning: 'Automaton Pokémon',
    explanation: 'From “golem” + huge/rogue. A guardian automaton.'
  },
  'コマタナ': {
japanese: 'コマタナ',
    romaji: 'komatana',
    pronunciation: 'ko-ma-ta-na',
    meaning: 'Sharp Blade Pokémon',
    explanation: '小 (*ko*, small) + 刀 (*katana*, sword). A small bladed pawn.'
  },
  'キリキザン': {
japanese: 'キリキザン',
    romaji: 'kirikizan',
    pronunciation: 'ki-ri-ki-za-n',
    meaning: 'Sword Blade Pokémon',
    explanation: '切り刻む (*kirikizamu*, to slash up). A bladed bishop warrior.'
  },
  'バッフロン': {
japanese: 'バッフロン',
    romaji: 'batsufuron',
    pronunciation: 'ba-tsu-fu-ro-n',
    meaning: 'Bash Buffalo Pokémon',
    explanation: 'From “buffalo” + “afro.” An afro buffalo.'
  },
  'ワシボン': {
japanese: 'ワシボン',
    romaji: 'washibon',
    pronunciation: 'wa-shi-bo-n',
    meaning: 'Eaglet Pokémon',
    explanation: '鷲 (*washi*, eagle) + 坊 (*bon*, boy). A young eagle.'
  },
  'ウォーグル': {
japanese: 'ウォーグル',
    romaji: 'uo-guru',
    pronunciation: 'u-o--gu-ru',
    meaning: 'Valiant Pokémon',
    explanation: 'From “war” + eagle. A patriotic eagle.'
  },
  'バルチャイ': {
japanese: 'バルチャイ',
    romaji: 'baruchai',
    pronunciation: 'ba-ru-cha-i',
    meaning: 'Diapered Pokémon',
    explanation: 'From “vulture” + child. A vulture chick.'
  },
  'バルジーナ': {
japanese: 'バルジーナ',
    romaji: 'baruji-na',
    pronunciation: 'ba-ru-ji--na',
    meaning: 'Bone Vulture Pokémon',
    explanation: 'From “vulture” + feminine suffix. A matriarchal vulture.'
  },
  'クイタラン': {
japanese: 'クイタラン',
    romaji: 'kuitaran',
    pronunciation: 'ku-i-ta-ra-n',
    meaning: 'Anteater Pokémon',
    explanation: '食う (*kuu*, eat) + anteater. A fire anteater.'
  },
  'アイアント': {
japanese: 'アイアント',
    romaji: 'aianto',
    pronunciation: 'a-i-a-nto',
    meaning: 'Iron Ant Pokémon',
    explanation: 'From “iron” + ant. A steel ant.'
  },
  'モノズ': {
japanese: 'モノズ',
    romaji: 'monozu',
    pronunciation: 'mo-no-zu',
    meaning: 'Irate Pokémon',
    explanation: '“Mono” (one) + Kopf/zu (head). A single-headed dragon.'
  },
  'ジヘッド': {
japanese: 'ジヘッド',
    romaji: 'jihetsudo',
    pronunciation: 'ji-he-tsu-do',
    meaning: 'Hostile Pokémon',
    explanation: '“Zwei” (two in German) + head. A two-headed dragon.'
  },
  'サザンドラ': {
japanese: 'サザンドラ',
    romaji: 'sazandora',
    pronunciation: 'sa-za-ndo-ra',
    meaning: 'Brutal Pokémon',
    explanation: 'Drei (three in German) + dragon. A three-headed hydra dragon.'
  },
  'メラルバ': {
japanese: 'メラルバ',
    romaji: 'meraruba',
    pronunciation: 'me-ra-ru-ba',
    meaning: 'Torch Pokémon',
    explanation: 'From “mela” (blaze) + larva. A fiery bug.'
  },
  'ウルガモス': {
japanese: 'ウルガモス',
    romaji: 'urugamosu',
    pronunciation: 'u-ru-ga-mo-su',
    meaning: 'Sun Pokémon',
    explanation: 'From “Uru” (to burn) + moth. A sun moth.'
  },
  'コバルオン': {
japanese: 'コバルオン',
    romaji: 'kobaruon',
    pronunciation: 'ko-ba-ru-o-n',
    meaning: 'Iron Will Pokémon',
    explanation: 'From “cobalt” + lion. One of the Musketeer trio.'
  },
  'テラキオン': {
japanese: 'テラキオン',
    romaji: 'terakion',
    pronunciation: 'te-ra-ki-o-n',
    meaning: 'Cavern Pokémon',
    explanation: 'From “terra” (earth) + lion. A musketeer beast.'
  },
  'ビリジオン': {
japanese: 'ビリジオン',
    romaji: 'birijion',
    pronunciation: 'bi-ri-ji-o-n',
    meaning: 'Grassland Pokémon',
    explanation: 'From “viridian” (green) + lion. A musketeer beast.'
  },
  'トルネロス': {
japanese: 'トルネロス',
    romaji: 'torunerosu',
    pronunciation: 'to-ru-ne-ro-su',
    meaning: 'Cyclone Pokémon',
    explanation: 'From “tornado.” A storm genie.'
  },
  'ボルトロス': {
japanese: 'ボルトロス',
    romaji: 'borutorosu',
    pronunciation: 'bo-ru-to-ro-su',
    meaning: 'Bolt Strike Pokémon',
    explanation: 'From “bolt.” A lightning genie.'
  },
  'レシラム': {
japanese: 'レシラム',
    romaji: 'reshiramu',
    pronunciation: 're-shi-ra-mu',
    meaning: 'Vast White Pokémon',
    explanation: 'From 白 (*shiro*, white) rearranged. A yin-yang dragon.'
  },
  'ゼクロム': {
japanese: 'ゼクロム',
    romaji: 'zekuromu',
    pronunciation: 'ze-ku-ro-mu',
    meaning: 'Deep Black Pokémon',
    explanation: 'From 黒 (*kuro*, black) rearranged. A yin-yang dragon.'
  },
  'ランドロス': {
japanese: 'ランドロス',
    romaji: 'randorosu',
    pronunciation: 'ra-ndo-ro-su',
    meaning: 'Abundance Pokémon',
    explanation: 'From “land.” A fertility genie.'
  },
  'キュレム': {
japanese: 'キュレム',
    romaji: 'kyuremu',
    pronunciation: 'kyu-re-mu',
    meaning: 'Boundary Pokémon',
    explanation: 'From 凍る (*kyūru/kyōre*, to freeze). An icy dragon.'
  },
  'ケルディオ': {
japanese: 'ケルディオ',
    romaji: 'kerudeio',
    pronunciation: 'ke-ru-de-i-o',
    meaning: 'Colt Pokémon',
    explanation: 'From “colt” + Latin deo (god). A young musketeer horse.'
  },
  'メロエッタ': {
japanese: 'メロエッタ',
    romaji: 'meroetsuta',
    pronunciation: 'me-ro-e-tsu-ta',
    meaning: 'Melody Pokémon',
    explanation: 'From “melody.” A singing musical fairy.'
  },
  'ゲノセクト': {
japanese: 'ゲノセクト',
    romaji: 'genosekuto',
    pronunciation: 'ge-no-se-ku-to',
    meaning: 'Paleozoic Pokémon',
    explanation: 'From “gene” + insect. A cybernetic bug revived by Team Plasma.'
  },
  'ハリマロン': {
japanese: 'ハリマロン',
    romaji: 'harimaron',
    pronunciation: 'ha-ri-ma-ro-n',
    meaning: 'Spiny Nut Pokémon',
    explanation: '針 (*hari*, needle) + マロン (*maron*, chestnut). A spiny chestnut Pokémon.'
  },
  'ハリボーグ': {
japanese: 'ハリボーグ',
    romaji: 'haribo-gu',
    pronunciation: 'ha-ri-bo--gu',
    meaning: 'Spiny Armor Pokémon',
    explanation: '針 (*hari*, needle) + 防具 (*bōgu*, armor). A bulky armored chestnut.'
  },
  'ブリガロン': {
japanese: 'ブリガロン',
    romaji: 'burigaron',
    pronunciation: 'bu-ri-ga-ro-n',
    meaning: 'Spiny Armor Pokémon',
    explanation: 'From “brigand/bulwark” + marron. A knightly chestnut warrior.'
  },
  'フォッコ': {
japanese: 'フォッコ',
    romaji: 'fuotsuko',
    pronunciation: 'fu-o-tsu-ko',
    meaning: 'Fox Pokémon',
    explanation: 'From “fox” + 火 (*hi*, fire). A fennec fox with fire powers.'
  },
  'テールナー': {
japanese: 'テールナー',
    romaji: 'te-runa-',
    pronunciation: 'te--ru-na-',
    meaning: 'Fox Pokémon',
    explanation: '“Tail” + 火 (*nā*, from burner). A fox magician with wand-like tail.'
  },
  'マフォクシー': {
japanese: 'マフォクシー',
    romaji: 'mafuokushi-',
    pronunciation: 'ma-fu-o-ku-shi-',
    meaning: 'Fox Pokémon',
    explanation: '魔法 (*mahō*, magic) + “fox.” A mystical mage fox.'
  },
  'ケロマツ': {
japanese: 'ケロマツ',
    romaji: 'keromatsu',
    pronunciation: 'ke-ro-ma-tsu',
    meaning: 'Bubble Frog Pokémon',
    explanation: 'ケロケロ (*kero*, frog croak) + 沫 (*matsu*, bubbles/foam). A froggy ninja.'
  },
  'ゲコガシラ': {
japanese: 'ゲコガシラ',
    romaji: 'gekogashira',
    pronunciation: 'ge-ko-ga-shi-ra',
    meaning: 'Bubble Frog Pokémon',
    explanation: 'ゲコゲコ (*geko*, croak) + 頭 (*gashira*, head). A nimble frog.'
  },
  'ゲッコウガ': {
japanese: 'ゲッコウガ',
    romaji: 'getsukouga',
    pronunciation: 'ge-tsu-ko-u-ga',
    meaning: 'Ninja Pokémon',
    explanation: '月光 (*gekkō*, moonlight) + 忍者 (*ninja*). A stealthy ninja frog.'
  },
  'ホルビー': {
japanese: 'ホルビー',
    romaji: 'horubi-',
    pronunciation: 'ho-ru-bi-',
    meaning: 'Digging Pokémon',
    explanation: '掘る (*horu*, to dig) + “bunny.” A digging rabbit.'
  },
  'ホルード': {
japanese: 'ホルード',
    romaji: 'horu-do',
    pronunciation: 'ho-ru--do',
    meaning: 'Digging Pokémon',
    explanation: '掘る (*horu*, dig) + “lord.” A burly rabbit with shovel ears.'
  },
  'ヤヤコマ': {
japanese: 'ヤヤコマ',
    romaji: 'yayakoma',
    pronunciation: 'ya-ya-ko-ma',
    meaning: 'Tiny Robin Pokémon',
    explanation: 'Small bird motif; “koma” often used for sparrows. A tiny robin.'
  },
  'ヒノヤコマ': {
japanese: 'ヒノヤコマ',
    romaji: 'hinoyakoma',
    pronunciation: 'hi-no-ya-ko-ma',
    meaning: 'Ember Pokémon',
    explanation: '火の (*hi no*, fire) + “yakoma.” A fiery mid-stage robin.'
  },
  'ファイアロー': {
japanese: 'ファイアロー',
    romaji: 'fuaiaro-',
    pronunciation: 'fu-a-i-a-ro-',
    meaning: 'Scorching Pokémon',
    explanation: 'From “fire” + “arrow.” A blazing falcon.'
  },
  'コフキムシ': {
japanese: 'コフキムシ',
    romaji: 'kofukimushi',
    pronunciation: 'ko-fu-ki-mu-shi',
    meaning: 'Scatterdust Pokémon',
    explanation: '粉吹き (*kofuki*, powder-sprinkling) + 虫 (*mushi*, bug). A powder bug.'
  },
  'コフーライ': {
japanese: 'コフーライ',
    romaji: 'kofu-rai',
    pronunciation: 'ko-fu--ra-i',
    meaning: 'Scatterdust Pokémon',
    explanation: '粉 (*ko*) + 風来 (*fūrai*, wanderer). A wandering cocoon bug.'
  },
  'ビビヨン': {
japanese: 'ビビヨン',
    romaji: 'bibiyon',
    pronunciation: 'bi-bi-yo-n',
    meaning: 'Scale Pokémon',
    explanation: 'From “vivid” + “papillon” (French for butterfly). A patterned butterfly.'
  },
  'シシコ': {
japanese: 'シシコ',
    romaji: 'shishiko',
    pronunciation: 'shi-shi-ko',
    meaning: 'Lion Cub Pokémon',
    explanation: '獅子 (*shishi*, lion) + 子 (*ko*, child). A little lion cub.'
  },
  'カエンジシ': {
japanese: 'カエンジシ',
    romaji: 'kaenjishi',
    pronunciation: 'ka-e-nji-shi',
    meaning: 'Royal Pokémon',
    explanation: '火炎 (*kaen*, flame) + 獅子 (*jishi*, lion). A fiery lion.'
  },
  'フラベベ': {
japanese: 'フラベベ',
    romaji: 'furabebe',
    pronunciation: 'fu-ra-be-be',
    meaning: 'Single Bloom Pokémon',
    explanation: 'From “flower” + “bébé” (French for baby). A fairy flower child.'
  },
  'フラエッテ': {
japanese: 'フラエッテ',
    romaji: 'furaetsute',
    pronunciation: 'fu-ra-e-tsu-te',
    meaning: 'Single Bloom Pokémon',
    explanation: 'From “flower” + French “été.” A dancing fairy with a flower.'
  },
  'フラージェス': {
japanese: 'フラージェス',
    romaji: 'fura-jiesu',
    pronunciation: 'fu-ra--ji-e-su',
    meaning: 'Garden Pokémon',
    explanation: 'From “flower” + “gorgeous.” A floral fairy queen.'
  },
  'メェークル': {
japanese: 'メェークル',
    romaji: 'mee-kuru',
    pronunciation: 'me-e--ku-ru',
    meaning: 'Mount Pokémon',
    explanation: 'めぇ (*mee*, goat bleat) + 来る (*kuru*, to come). A rideable goat kid.'
  },
  'ゴーゴート': {
japanese: 'ゴーゴート',
    romaji: 'go-go-to',
    pronunciation: 'go--go--to',
    meaning: 'Mount Pokémon',
    explanation: 'From “go” (movement) + “goat.” A large rideable goat.'
  },
  'ヤンチャム': {
japanese: 'ヤンチャム',
    romaji: 'yanchamu',
    pronunciation: 'ya-ncha-mu',
    meaning: 'Playful Pokémon',
    explanation: 'やんちゃ (*yancha*, mischievous) + panda. A playful panda cub.'
  },
  'ゴロンダ': {
japanese: 'ゴロンダ',
    romaji: 'goronda',
    pronunciation: 'go-ro-nda',
    meaning: 'Daunting Pokémon',
    explanation: 'ゴロ (goro, roar) + panda. A fighting panda boss.'
  },
  'トリミアン': {
japanese: 'トリミアン',
    romaji: 'torimian',
    pronunciation: 'to-ri-mi-a-n',
    meaning: 'Poodle Pokémon',
    explanation: 'From “trim” + dog. A poodle with customizable coats.'
  },
  'ニャスパー': {
japanese: 'ニャスパー',
    romaji: 'nyasupa-',
    pronunciation: 'nya-su-pa-',
    meaning: 'Restraint Pokémon',
    explanation: 'ニャー (*nya*, meow) + “esper.” A psychic kitten.'
  },
  'ニャオニクス': {
japanese: 'ニャオニクス',
    romaji: 'nyaonikusu',
    pronunciation: 'nya-o-ni-ku-su',
    meaning: 'Constraint Pokémon',
    explanation: 'ニャー (*nya*, meow) + onyx/psychic suffix. A mystical feline.'
  },
  'ヒトツキ': {
japanese: 'ヒトツキ',
    romaji: 'hitotsuki',
    pronunciation: 'hi-to-tsu-ki',
    meaning: 'Sword Pokémon',
    explanation: '一突き (*hitotsuki*, one thrust). A haunted sword.'
  },
  'ニダンギル': {
japanese: 'ニダンギル',
    romaji: 'nidangiru',
    pronunciation: 'ni-da-ngi-ru',
    meaning: 'Sword Pokémon',
    explanation: '二段斬る (*nidangiru*, two-stage slash). Twin haunted swords.'
  },
  'ギルガルド': {
japanese: 'ギルガルド',
    romaji: 'girugarudo',
    pronunciation: 'gi-ru-ga-ru-do',
    meaning: 'Royal Sword Pokémon',
    explanation: 'From “guard” + “gild.” A royal sword and shield ghost.'
  },
  'シュシュプ': {
japanese: 'シュシュプ',
    romaji: 'shushupu',
    pronunciation: 'shu-shu-pu',
    meaning: 'Perfume Pokémon',
    explanation: 'From シュシュ (chouchou, perfume) + puff. A perfume bird.'
  },
  'フレフワン': {
japanese: 'フレフワン',
    romaji: 'furefuwan',
    pronunciation: 'fu-re-fu-wa-n',
    meaning: 'Fragrance Pokémon',
    explanation: 'From “fragrance” + fluffy. A perfumed bird dancer.'
  },
  'ペロッパフ': {
japanese: 'ペロッパフ',
    romaji: 'perotsupafu',
    pronunciation: 'pe-ro-tsu-pa-fu',
    meaning: 'Cotton Candy Pokémon',
    explanation: 'ペロペロ (*pero*, lick) + puff. A cotton candy fairy.'
  },
  'ペロリーム': {
japanese: 'ペロリーム',
    romaji: 'perori-mu',
    pronunciation: 'pe-ro-ri--mu',
    meaning: 'Meringue Pokémon',
    explanation: 'ペロペロ (*pero*, lick) + cream. A whipped cream fairy.'
  },
  'マーイーカ': {
japanese: 'マーイーカ',
    romaji: 'ma-i-ka',
    pronunciation: 'ma--i--ka',
    meaning: 'Revolving Pokémon',
    explanation: 'いか (*ika*, squid) with phrase まあいいか (“oh well”). A tricky squid.'
  },
  'カラマネロ': {
japanese: 'カラマネロ',
    romaji: 'karamanero',
    pronunciation: 'ka-ra-ma-ne-ro',
    meaning: 'Overturning Pokémon',
    explanation: '烏賊 (*ika*, squid) + 狡い (*karai*, tricky). A hypnotic squid.'
  },
  'カメテテ': {
japanese: 'カメテテ',
    romaji: 'kametete',
    pronunciation: 'ka-me-te-te',
    meaning: 'Two-Handed Pokémon',
    explanation: '亀 (*kame*, turtle) + 手 (*te*, hand). A barnacle Pokémon.'
  },
  'ガメノデス': {
japanese: 'ガメノデス',
    romaji: 'gamenodesu',
    pronunciation: 'ga-me-no-de-su',
    meaning: 'Collective Pokémon',
    explanation: '亀 (*kame*, turtle) + death. A multi-limbed barnacle beast.'
  },
  'クズモー': {
japanese: 'クズモー',
    romaji: 'kuzumo-',
    pronunciation: 'ku-zu-mo-',
    meaning: 'Mock Kelp Pokémon',
    explanation: '海藻くず (*kuzu*, scrap seaweed) + child. A camouflaged kelp seahorse.'
  },
  'ドラミドロ': {
japanese: 'ドラミドロ',
    romaji: 'doramidoro',
    pronunciation: 'do-ra-mi-do-ro',
    meaning: 'Mock Kelp Pokémon',
    explanation: 'From “dragon” + 海藻 (*midoro*, seaweed). A dragon kelp.'
  },
  'ウデッポウ': {
japanese: 'ウデッポウ',
    romaji: 'udetsupou',
    pronunciation: 'u-de-tsu-po-u',
    meaning: 'Water Gun Pokémon',
    explanation: '腕 (*ude*, arm) + 鉄砲 (*teppō*, gun). A pistol shrimp.'
  },
  'ブロスター': {
japanese: 'ブロスター',
    romaji: 'burosuta-',
    pronunciation: 'bu-ro-su-ta-',
    meaning: 'Howitzer Pokémon',
    explanation: 'From “blaster” + lobster. A shrimp with a giant cannon claw.'
  },
  'エリキテル': {
japanese: 'エリキテル',
    romaji: 'erikiteru',
    pronunciation: 'e-ri-ki-te-ru',
    meaning: 'Generator Pokémon',
    explanation: 'From “electric” + reptile. A frilled lizard.'
  },
  'エレザード': {
japanese: 'エレザード',
    romaji: 'ereza-do',
    pronunciation: 'e-re-za--do',
    meaning: 'Generator Pokémon',
    explanation: 'From “electric” + lizard. A solar-powered lizard.'
  },
  'チゴラス': {
japanese: 'チゴラス',
    romaji: 'chigorasu',
    pronunciation: 'chi-go-ra-su',
    meaning: 'Royal Heir Pokémon',
    explanation: '小 (*chi*, small/child) + dragon. A baby tyrant dinosaur.'
  },
  'ガチゴラス': {
japanese: 'ガチゴラス',
    romaji: 'gachigorasu',
    pronunciation: 'ga-chi-go-ra-su',
    meaning: 'Despot Pokémon',
    explanation: 'From “gachi” (serious/strong) + dragon. A fierce T. rex.'
  },
  'アマルス': {
japanese: 'アマルス',
    romaji: 'amarusu',
    pronunciation: 'a-ma-ru-su',
    meaning: 'Tundra Pokémon',
    explanation: 'From “ammonite” + aura. An icy dinosaur.'
  },
  'アマルルガ': {
japanese: 'アマルルガ',
    romaji: 'amaruruga',
    pronunciation: 'a-ma-ru-ru-ga',
    meaning: 'Tundra Pokémon',
    explanation: 'From “ammonite” + aurora. A majestic dinosaur.'
  },
  'ニンフィア': {
japanese: 'ニンフィア',
    romaji: 'ninfuia',
    pronunciation: 'ni-nfu-i-a',
    meaning: 'Intertwining Pokémon',
    explanation: 'From “nymph” + -eon. A fairy-type Eeveelution.'
  },
  'ルチャブル': {
japanese: 'ルチャブル',
    romaji: 'ruchaburu',
    pronunciation: 'ru-cha-bu-ru',
    meaning: 'Wrestling Pokémon',
    explanation: 'From “lucha libre” + “wrestle.” A wrestling hawk.'
  },
  'デデンネ': {
japanese: 'デデンネ',
    romaji: 'dedenne',
    pronunciation: 'de-de-nne',
    meaning: 'Antenna Pokémon',
    explanation: 'デン (den, electricity) + ネズミ (*nezumi*, mouse). An electric fairy rodent.'
  },
  'メレシー': {
japanese: 'メレシー',
    romaji: 'mereshi-',
    pronunciation: 'me-re-shi-',
    meaning: 'Jewel Pokémon',
    explanation: 'From “mercy” + jewel imagery. A diamond-like fairy.'
  },
  'ヌメラ': {
japanese: 'ヌメラ',
    romaji: 'numera',
    pronunciation: 'nu-me-ra',
    meaning: 'Soft Tissue Pokémon',
    explanation: 'From ぬめぬめ (*numenume*, slimy). A gooey dragon larva.'
  },
  'ヌメイル': {
japanese: 'ヌメイル',
    romaji: 'numeiru',
    pronunciation: 'nu-me-i-ru',
    meaning: 'Soft Tissue Pokémon',
    explanation: 'From ぬめぬめ (*numenume*) + snail. A slimy dragon.'
  },
  'ヌメルゴン': {
japanese: 'ヌメルゴン',
    romaji: 'numerugon',
    pronunciation: 'nu-me-ru-go-n',
    meaning: 'Dragon Pokémon',
    explanation: 'From ぬめぬめ (*numenume*) + dragon. A gentle slime dragon.'
  },
  'クレッフィ': {
japanese: 'クレッフィ',
    romaji: 'kuretsufui',
    pronunciation: 'ku-re-tsu-fu-i',
    meaning: 'Key Ring Pokémon',
    explanation: 'From “clé” (French for key) + key. A fairy keyring.'
  },
  'ボクレー': {
japanese: 'ボクレー',
    romaji: 'bokure-',
    pronunciation: 'bo-ku-re-',
    meaning: 'Stump Pokémon',
    explanation: '木の株 (*kikabu*, stump) + 幽霊 (*yūrei*, ghost). A stump ghost.'
  },
  'オーロット': {
japanese: 'オーロット',
    romaji: 'o-rotsuto',
    pronunciation: 'o--ro-tsu-to',
    meaning: 'Elder Tree Pokémon',
    explanation: '大樹 (*ōki na ki*, large tree) + spirit. A haunted elder tree.'
  },
  'バケッチャ': {
japanese: 'バケッチャ',
    romaji: 'baketsucha',
    pronunciation: 'ba-ke-tsu-cha',
    meaning: 'Pumpkin Pokémon',
    explanation: '化け (*bake*, ghost/monster) + 南瓜 (*kabocha*, pumpkin). A pumpkin ghost.'
  },
  'パンプジン': {
japanese: 'パンプジン',
    romaji: 'panpujin',
    pronunciation: 'pa-npu-ji-n',
    meaning: 'Pumpkin Pokémon',
    explanation: 'From “pumpkin” + 人 (*jin*, person/genie). A spooky pumpkin spirit.'
  },
  'カチコール': {
japanese: 'カチコール',
    romaji: 'kachiko-ru',
    pronunciation: 'ka-chi-ko--ru',
    meaning: 'Ice Chunk Pokémon',
    explanation: 'カチコチ (*kachikochi*, frozen solid) + core. An iceberg Pokémon.'
  },
  'クレベース': {
japanese: 'クレベース',
    romaji: 'kurebe-su',
    pronunciation: 'ku-re-be--su',
    meaning: 'Iceberg Pokémon',
    explanation: 'From “crag” + base. A giant iceberg.'
  },
  'オンバット': {
japanese: 'オンバット',
    romaji: 'onbatsuto',
    pronunciation: 'o-nba-tsu-to',
    meaning: 'Sound Wave Pokémon',
    explanation: '音 (*on*, sound) + bat. A bat that emits ultrasonic cries.'
  },
  'オンバーン': {
japanese: 'オンバーン',
    romaji: 'onba-n',
    pronunciation: 'o-nba--n',
    meaning: 'Sound Wave Pokémon',
    explanation: '音 (*on*, sound) + wyvern. A draconic bat.'
  },
  'ゼルネアス': {
japanese: 'ゼルネアス',
    romaji: 'zeruneasu',
    pronunciation: 'ze-ru-ne-a-su',
    meaning: 'Life Pokémon',
    explanation: 'From “Cernunnos,” a Celtic deity associated with stags.'
  },
  'イベルタル': {
japanese: 'イベルタル',
    romaji: 'iberutaru',
    pronunciation: 'i-be-ru-ta-ru',
    meaning: 'Destruction Pokémon',
    explanation: 'From “Y” shape + death imagery. A destructive dark bird.'
  },
  'ジガルデ': {
japanese: 'ジガルデ',
    romaji: 'jigarude',
    pronunciation: 'ji-ga-ru-de',
    meaning: 'Order Pokémon',
    explanation: 'From “zygote” + guard. A serpentine protector.'
  },
  'ディアンシー': {
japanese: 'ディアンシー',
    romaji: 'deianshi-',
    pronunciation: 'de-i-a-nshi-',
    meaning: 'Jewel Pokémon',
    explanation: 'From “diamond” + fancy. A jewel princess Pokémon.'
  },
  'フーパ': {
japanese: 'フーパ',
    romaji: 'fu-pa',
    pronunciation: 'fu--pa',
    meaning: 'Mischief Pokémon',
    explanation: 'From “hoop” + playful suffix. A mischievous genie.'
  },
  'ボルケニオン': {
japanese: 'ボルケニオン',
    romaji: 'borukenion',
    pronunciation: 'bo-ru-ke-ni-o-n',
    meaning: 'Steam Pokémon',
    explanation: 'From “volcano” + ion. A steam-powered fire/water beast.'
  },
  'モクロー': {
japanese: 'モクロー',
    romaji: 'mokuro-',
    pronunciation: 'mo-ku-ro-',
    meaning: 'Grass Quill Pokémon',
    explanation: '木 (*moku*, wood) + フクロウ (*fukurō*, owl). A grass-type owl.'
  },
  'フクスロー': {
japanese: 'フクスロー',
    romaji: 'fukusuro-',
    pronunciation: 'fu-ku-su-ro-',
    meaning: 'Blade Quill Pokémon',
    explanation: 'フクロウ (*fukurō*, owl) + throw/slash. A stylish owl.'
  },
  'ジュナイパー': {
japanese: 'ジュナイパー',
    romaji: 'junaipa-',
    pronunciation: 'ju-na-i-pa-',
    meaning: 'Arrow Quill Pokémon',
    explanation: 'From “juniper” + “sniper.” A ghostly archer owl.'
  },
  'ニャビー': {
japanese: 'ニャビー',
    romaji: 'nyabi-',
    pronunciation: 'nya-bi-',
    meaning: 'Fire Cat Pokémon',
    explanation: 'ニャー (*nya*, meow) + 火 (*hi*, fire). A fiery kitten.'
  },
  'ニャヒート': {
japanese: 'ニャヒート',
    romaji: 'nyahi-to',
    pronunciation: 'nya-hi--to',
    meaning: 'Fire Cat Pokémon',
    explanation: 'ニャー (*nya*, meow) + heat. A hot-blooded cat.'
  },
  'ガオガエン': {
japanese: 'ガオガエン',
    romaji: 'gaogaen',
    pronunciation: 'ga-o-ga-e-n',
    meaning: 'Heel Pokémon',
    explanation: 'ガオ (gao, roar) + 火炎 (*kaen*, flame). A fiery wrestling cat.'
  },
  'アシマリ': {
japanese: 'アシマリ',
    romaji: 'ashimari',
    pronunciation: 'a-shi-ma-ri',
    meaning: 'Sea Lion Pokémon',
    explanation: '足 (*ashi*, foot) + 鞠 (*mari*, ball). A playful sea lion.'
  },
  'オシャマリ': {
japanese: 'オシャマリ',
    romaji: 'oshamari',
    pronunciation: 'o-sha-ma-ri',
    meaning: 'Pop Star Pokémon',
    explanation: 'おしゃま (*oshama*, stylish/precocious) + 鞠 (*mari*, ball). A dancing seal.'
  },
  'アシレーヌ': {
japanese: 'アシレーヌ',
    romaji: 'ashire-nu',
    pronunciation: 'a-shi-re--nu',
    meaning: 'Soloist Pokémon',
    explanation: '足 (*ashi*, foot/sea lion) + siren. A singing mermaid seal.'
  },
  'ツツケラ': {
japanese: 'ツツケラ',
    romaji: 'tsutsukera',
    pronunciation: 'tsu-tsu-ke-ra',
    meaning: 'Woodpecker Pokémon',
    explanation: '突く (*tsutsuku*, to peck) + 啄木鳥 (*kera*, woodpecker). A tiny pecker bird.'
  },
  'ケララッパ': {
japanese: 'ケララッパ',
    romaji: 'keraratsupa',
    pronunciation: 'ke-ra-ra-tsu-pa',
    meaning: 'Bugle Beak Pokémon',
    explanation: 'From “kera” (woodpecker) + ラッパ (*rappa*, trumpet). A beak instrument bird.'
  },
  'ドデカバシ': {
japanese: 'ドデカバシ',
    romaji: 'dodekabashi',
    pronunciation: 'do-de-ka-ba-shi',
    meaning: 'Cannon Pokémon',
    explanation: 'ドデカ (*dodeka*, gigantic) + 嘴 (*hashi*, beak). A massive-billed toucan.'
  },
  'ヤングース': {
japanese: 'ヤングース',
    romaji: 'yangu-su',
    pronunciation: 'ya-ngu--su',
    meaning: 'Loitering Pokémon',
    explanation: 'From “young” + mongoose. A predator mongoose.'
  },
  'デカグース': {
japanese: 'デカグース',
    romaji: 'dekagu-su',
    pronunciation: 'de-ka-gu--su',
    meaning: 'Stakeout Pokémon',
    explanation: 'デカ (*deka*, big) + mongoose. A detective-like mongoose.'
  },
  'アゴジムシ': {
japanese: 'アゴジムシ',
    romaji: 'agojimushi',
    pronunciation: 'a-go-ji-mu-shi',
    meaning: 'Larva Pokémon',
    explanation: '顎 (*ago*, jaw) + 虫 (*mushi*, insect/larva). A jawed grub.'
  },
  'デンヂムシ': {
japanese: 'デンヂムシ',
    romaji: 'denjimushi',
    pronunciation: 'de-nji-mu-shi',
    meaning: 'Battery Pokémon',
    explanation: '電 (*den*, electric) + 虫 (*mushi*, bug). A battery-like bug.'
  },
  'クワガノン': {
japanese: 'クワガノン',
    romaji: 'kuwaganon',
    pronunciation: 'ku-wa-ga-no-n',
    meaning: 'Stag Beetle Pokémon',
    explanation: 'クワガタ (*kuwagata*, stag beetle) + cannon. An electric stag beetle.'
  },
  'マケンカニ': {
japanese: 'マケンカニ',
    romaji: 'makenkani',
    pronunciation: 'ma-ke-nka-ni',
    meaning: 'Boxing Pokémon',
    explanation: '負けん気 (*makenki*, fighting spirit) + 蟹 (*kani*, crab). A boxing crab.'
  },
  'ケケンカニ': {
japanese: 'ケケンカニ',
    romaji: 'kekenkani',
    pronunciation: 'ke-ke-nka-ni',
    meaning: 'Woolly Crab Pokémon',
    explanation: '毛 (*ke*, hair) + 喧嘩 (*kenka*, fight) + crab. A hairy boxing crab.'
  },
  'オドリドリ': {
japanese: 'オドリドリ',
    romaji: 'odoridori',
    pronunciation: 'o-do-ri-do-ri',
    meaning: 'Dancing Pokémon',
    explanation: '踊り鳥 (*odoridori*, dancing bird) pun + dropping bombs. A delivery bird.'
  },
  'アブリー': {
japanese: 'アブリー',
    romaji: 'aburi-',
    pronunciation: 'a-bu-ri-',
    meaning: 'Bee Fly Pokémon',
    explanation: '蚋 (*aburui*, gnat) + cute suffix. A tiny fairy fly.'
  },
  'アブリボン': {
japanese: 'アブリボン',
    romaji: 'aburibon',
    pronunciation: 'a-bu-ri-bo-n',
    meaning: 'Bee Fly Pokémon',
    explanation: 'From *abu* (gnat) + ribbon. A pollinating bee-fly.'
  },
  'イワンコ': {
japanese: 'イワンコ',
    romaji: 'iwanko',
    pronunciation: 'i-wa-nko',
    meaning: 'Puppy Pokémon',
    explanation: '岩 (*iwa*, rock) + 子犬 (*ko inu*, puppy). A rock puppy.'
  },
  'ルガルガン': {
japanese: 'ルガルガン',
    romaji: 'rugarugan',
    pronunciation: 'ru-ga-ru-ga-n',
    meaning: 'Wolf Pokémon',
    explanation: 'From “loup-garou” (werewolf) + rock. A wolf with forms.'
  },
  'ヨワシ': {
japanese: 'ヨワシ',
    romaji: 'yowashi',
    pronunciation: 'yo-wa-shi',
    meaning: 'Small Fry Pokémon',
    explanation: '弱し (*yowashi*, weak) + 鰯 (*iwashi*, sardine). A tiny schooling fish.'
  },
  'ヒドイデ': {
japanese: 'ヒドイデ',
    romaji: 'hidoide',
    pronunciation: 'hi-do-i-de',
    meaning: 'Brutal Star Pokémon',
    explanation: '酷い (*hidoi*, cruel) + デ (from asari, shellfish). A venomous starfish.'
  },
  'ドヒドイデ': {
japanese: 'ドヒドイデ',
    romaji: 'dohidoide',
    pronunciation: 'do-hi-do-i-de',
    meaning: 'Brutal Star Pokémon',
    explanation: '度 (*do*, intensifier) + 酷い (*hidoi*, cruel) + shellfish. A spiny predator.'
  },
  'ドロバンコ': {
japanese: 'ドロバンコ',
    romaji: 'dorobanko',
    pronunciation: 'do-ro-ba-nko',
    meaning: 'Donkey Pokémon',
    explanation: '泥 (*doro*, mud) + 駄馬 (*banka*, nag/donkey). A muddy donkey.'
  },
  'バンバドロ': {
japanese: 'バンバドロ',
    romaji: 'banbadoro',
    pronunciation: 'ba-nba-do-ro',
    meaning: 'Draft Horse Pokémon',
    explanation: '輓馬 (*banba*, draft horse) + 泥 (*doro*, mud). A heavy war horse.'
  },
  'シズクモ': {
japanese: 'シズクモ',
    romaji: 'shizukumo',
    pronunciation: 'shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon',
    explanation: '雫 (*shizuku*, droplet) + 蜘蛛 (*kumo*, spider). A bubble spider.'
  },
  'オニシズクモ': {
japanese: 'オニシズクモ',
    romaji: 'onishizukumo',
    pronunciation: 'o-ni-shi-zu-ku-mo',
    meaning: 'Water Bubble Pokémon',
    explanation: '鬼 (*oni*, demon) + droplet spider. A large bubble spider.'
  },
  'カリキリ': {
japanese: 'カリキリ',
    romaji: 'karikiri',
    pronunciation: 'ka-ri-ki-ri',
    meaning: 'Sickle Grass Pokémon',
    explanation: '刈り切り (*karikiri*, to mow). A grass mantis.'
  },
  'ラランテス': {
japanese: 'ラランテス',
    romaji: 'rarantesu',
    pronunciation: 'ra-ra-nte-su',
    meaning: 'Bloom Sickle Pokémon',
    explanation: 'From “orchid” + “mantis.” A flowery mantis.'
  },
  'ネマシュ': {
japanese: 'ネマシュ',
    romaji: 'nemashu',
    pronunciation: 'ne-ma-shu',
    meaning: 'Illuminating Pokémon',
    explanation: '眠い (*nemui*, sleepy) + mushroom. A sleepy glowing fungus.'
  },
  'マシェード': {
japanese: 'マシェード',
    romaji: 'mashie-do',
    pronunciation: 'ma-shi-e--do',
    meaning: 'Illuminating Pokémon',
    explanation: 'From “mushroom” + “shade.” A glowing mushroom.'
  },
  'ヤトウモリ': {
japanese: 'ヤトウモリ',
    romaji: 'yatoumori',
    pronunciation: 'ya-to-u-mo-ri',
    meaning: 'Toxic Lizard Pokémon',
    explanation: '夜盗 (*yatō*, burglar/night thief) + 守宮 (*yamori*, lizard). A toxic lizard.'
  },
  'エンニュート': {
japanese: 'エンニュート',
    romaji: 'ennyu-to',
    pronunciation: 'e-nnyu--to',
    meaning: 'Toxic Lizard Pokémon',
    explanation: 'From “ennui” + newt. A toxic salamander queen.'
  },
  'ヌイコグマ': {
japanese: 'ヌイコグマ',
    romaji: 'nuikoguma',
    pronunciation: 'nu-i-ko-gu-ma',
    meaning: 'Flailing Pokémon',
    explanation: 'ぬいぐるみ (*nuigurumi*, plush toy) + 子熊 (*koguma*, bear cub). A stuffed bear cub.'
  },
  'キテルグマ': {
japanese: 'キテルグマ',
    romaji: 'kiteruguma',
    pronunciation: 'ki-te-ru-gu-ma',
    meaning: 'Strong Arm Pokémon',
    explanation: '来てる (*kiteru*, coming/arriving) + 熊 (*kuma*, bear). A huggable bear.'
  },
  'アマカジ': {
japanese: 'アマカジ',
    romaji: 'amakaji',
    pronunciation: 'a-ma-ka-ji',
    meaning: 'Fruit Pokémon',
    explanation: '甘い (*amai*, sweet) + fruit sound. A sweet fruit Pokémon.'
  },
  'アママイコ': {
japanese: 'アママイコ',
    romaji: 'amamaiko',
    pronunciation: 'a-ma-ma-i-ko',
    meaning: 'Fruit Pokémon',
    explanation: '甘い (*amai*, sweet) + 舞子 (*maiko*, apprentice dancer). A fruit dancer.'
  },
  'アマージョ': {
japanese: 'アマージョ',
    romaji: 'ama-jo',
    pronunciation: 'a-ma--jo',
    meaning: 'Fruit Pokémon',
    explanation: '甘い (*amai*, sweet) + 女王 (*joō*, queen). A regal fruit queen.'
  },
  'キュワワー': {
japanese: 'キュワワー',
    romaji: 'kyuwawa-',
    pronunciation: 'kyu-wa-wa-',
    meaning: 'Posy Picker Pokémon',
    explanation: 'From “cute/queue” + Hawaiian lei. A lei fairy.'
  },
  'ヤレユータン': {
japanese: 'ヤレユータン',
    romaji: 'yareyu-tan',
    pronunciation: 'ya-re-yu--ta-n',
    meaning: 'Sage Pokémon',
    explanation: 'やれ (*yare*, to do/perform) + オランウータン (orangutan). A wise orangutan.'
  },
  'ナゲツケサル': {
japanese: 'ナゲツケサル',
    romaji: 'nagetsukesaru',
    pronunciation: 'na-ge-tsu-ke-sa-ru',
    meaning: 'Teamwork Pokémon',
    explanation: '投げつける (*nagetsukeru*, to throw) + 猿 (*saru*, monkey). A team-throwing lemur.'
  },
  'コソクムシ': {
japanese: 'コソクムシ',
    romaji: 'kosokumushi',
    pronunciation: 'ko-so-ku-mu-shi',
    meaning: 'Turn Tail Pokémon',
    explanation: '腰抜け (*kosokunuke*, coward) + 虫 (*mushi*, bug). A timid bug.'
  },
  'グソクムシャ': {
japanese: 'グソクムシャ',
    romaji: 'gusokumusha',
    pronunciation: 'gu-so-ku-mu-sha',
    meaning: 'Hard Scale Pokémon',
    explanation: '具足 (*gusoku*, armor) + 武者 (*musha*, warrior). A samurai-like bug.'
  },
  'スナバァ': {
japanese: 'スナバァ',
    romaji: 'sunabaa',
    pronunciation: 'su-na-ba-a',
    meaning: 'Sand Heap Pokémon',
    explanation: '砂場 (*sunaba*, sandbox) + childlike suffix. A sandcastle ghost.'
  },
  'シロデスナ': {
japanese: 'シロデスナ',
    romaji: 'shirodesuna',
    pronunciation: 'shi-ro-de-su-na',
    meaning: 'Sand Castle Pokémon',
    explanation: '城 (*shiro*, castle) + 砂 (*suna*, sand). A haunted sandcastle.'
  },
  'ナマコブシ': {
japanese: 'ナマコブシ',
    romaji: 'namakobushi',
    pronunciation: 'na-ma-ko-bu-shi',
    meaning: 'Sea Cucumber Pokémon',
    explanation: '海鼠 (*namako*, sea cucumber) + 拳 (*kobushi*, fist). A sea cucumber that punches with innards.'
  },
  'タイプ：ヌル': {
japanese: 'タイプ：ヌル',
    romaji: 'taipu：nuru',
    pronunciation: 'ta-i-pu-：nu-ru',
    meaning: 'Synthetic Pokémon',
    explanation: 'Direct katakana transliteration. A synthetic chimera.'
  },
  'シルヴァディ': {
japanese: 'シルヴァディ',
    romaji: 'shiruヴadei',
    pronunciation: 'shi-ru-ヴa-de-i',
    meaning: 'Synthetic Pokémon',
    explanation: 'From “silver” + “validity.” A completed synthetic Pokémon.'
  },
  'メテノ': {
japanese: 'メテノ',
    romaji: 'meteno',
    pronunciation: 'me-te-no',
    meaning: 'Meteor Pokémon',
    explanation: 'From “meteor” + -no (childlike). A falling star Pokémon.'
  },
  'ネッコアラ': {
japanese: 'ネッコアラ',
    romaji: 'netsukoara',
    pronunciation: 'ne-tsu-ko-a-ra',
    meaning: 'Drowsing Pokémon',
    explanation: '根っ子 (*nekko*, root/sleepy) + koala. A perpetually sleeping koala.'
  },
  'バクガメス': {
japanese: 'バクガメス',
    romaji: 'bakugamesu',
    pronunciation: 'ba-ku-ga-me-su',
    meaning: 'Blast Turtle Pokémon',
    explanation: '爆 (*baku*, explode) + 亀 (*kame*, turtle). An explosive turtle.'
  },
  'トゲデマル': {
japanese: 'トゲデマル',
    romaji: 'togedemaru',
    pronunciation: 'to-ge-de-ma-ru',
    meaning: 'Roly-Poly Pokémon',
    explanation: '棘 (*toge*, spike) + 丸 (*maru*, round). A spiky round hedgehog.'
  },
  'ミミッキュ': {
japanese: 'ミミッキュ',
    romaji: 'mimitsukyu',
    pronunciation: 'mi-mi-tsu-kyu',
    meaning: 'Disguise Pokémon',
    explanation: 'From “mimic” + “cute.” A disguised ghost fairy.'
  },
  'ハギギシリ': {
japanese: 'ハギギシリ',
    romaji: 'hagigishiri',
    pronunciation: 'ha-gi-gi-shi-ri',
    meaning: 'Gnash Teeth Pokémon',
    explanation: '歯ぎしり (*hagishiri*, teeth grinding). A gnashing fish.'
  },
  'ジジーロン': {
japanese: 'ジジーロン',
    romaji: 'jiji-ron',
    pronunciation: 'ji-ji--ro-n',
    meaning: 'Placid Pokémon',
    explanation: 'じじい (*jijii*, old man) + dragon. A benevolent old dragon.'
  },
  'ダダリン': {
japanese: 'ダダリン',
    romaji: 'dadarin',
    pronunciation: 'da-da-ri-n',
    meaning: 'Sea Creeper Pokémon',
    explanation: 'From “anchor” + 輪 (*rin*, ring). A ghostly anchor seaweed.'
  },
  'ジャラコ': {
japanese: 'ジャラコ',
    romaji: 'jarako',
    pronunciation: 'ja-ra-ko',
    meaning: 'Scaly Pokémon',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + 子 (*ko*, child). A rattling dragon.'
  },
  'ジャランゴ': {
japanese: 'ジャランゴ',
    romaji: 'jarango',
    pronunciation: 'ja-ra-ngo',
    meaning: 'Scaly Pokémon',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + young suffix. A scaled dragon.'
  },
  'ジャラランガ': {
japanese: 'ジャラランガ',
    romaji: 'jararanga',
    pronunciation: 'ja-ra-ra-nga',
    meaning: 'Scaly Pokémon',
    explanation: 'じゃらじゃら (*jarajara*, rattling) + elder suffix. A scaly elder dragon.'
  },
  'カプ・コケコ': {
japanese: 'カプ・コケコ',
    romaji: 'kapu・kokeko',
    pronunciation: 'ka-pu-・ko-ke-ko',
    meaning: 'Land Spirit Pokémon',
    explanation: 'カプ (*kapu*, Hawaiian “kapu” = sacred) + コケコ (*kokeko*, rooster cry). Guardian deity of Melemele.'
  },
  'カプ・テテフ': {
japanese: 'カプ・テテフ',
    romaji: 'kapu・tetefu',
    pronunciation: 'ka-pu-・te-te-fu',
    meaning: 'Land Spirit Pokémon',
    explanation: 'カプ (*kapu*) + テテフ (from Hawaiian for butterfly). Guardian deity of Akala.'
  },
  'カプ・ブルル': {
japanese: 'カプ・ブルル',
    romaji: 'kapu・bururu',
    pronunciation: 'ka-pu-・bu-ru-ru',
    meaning: 'Land Spirit Pokémon',
    explanation: 'カプ (*kapu*) + bull sound. Guardian deity of Ula’ula.'
  },
  'カプ・レヒレ': {
japanese: 'カプ・レヒレ',
    romaji: 'kapu・rehire',
    pronunciation: 'ka-pu-・re-hi-re',
    meaning: 'Land Spirit Pokémon',
    explanation: 'カプ (*kapu*) + reef/water name. Guardian deity of Poni.'
  },
  'コスモッグ': {
japanese: 'コスモッグ',
    romaji: 'kosumotsugu',
    pronunciation: 'ko-su-mo-tsu-gu',
    meaning: 'Nebula Pokémon',
    explanation: 'From “cosmos” + “smog/fog.” A tiny nebula.'
  },
  'コスモウム': {
japanese: 'コスモウム',
    romaji: 'kosumoumu',
    pronunciation: 'ko-su-mo-u-mu',
    meaning: 'Protostar Pokémon',
    explanation: 'From “cosmos” + “om/ohm.” A cosmic seed.'
  },
  'ソルガレオ': {
japanese: 'ソルガレオ',
    romaji: 'sorugareo',
    pronunciation: 'so-ru-ga-re-o',
    meaning: 'Sunne Pokémon',
    explanation: 'From “sol” (sun) + Leo (lion). The Sun Legendary.'
  },
  'ルナアーラ': {
japanese: 'ルナアーラ',
    romaji: 'runaa-ra',
    pronunciation: 'ru-na-a--ra',
    meaning: 'Moone Pokémon',
    explanation: 'From “luna” (moon) + ala (wing). The Moon Legendary.'
  },
  'ウツロイド': {
japanese: 'ウツロイド',
    romaji: 'utsuroido',
    pronunciation: 'u-tsu-ro-i-do',
    meaning: 'Parasite Pokémon',
    explanation: '空ろ (*utsuro*, hollow) + -id (parasite). An Ultra Beast jellyfish.'
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
    meaning: 'Artificial Pokémon',
    explanation: 'From “magic” + “gear.” A mechanical fairy.'
  },
  'マーシャドー': {
japanese: 'マーシャドー',
    romaji: 'ma-shado-',
    pronunciation: 'ma--sha-do-',
    meaning: 'Gloomdweller Pokémon',
    explanation: 'From “martial” + “shadow.” A mythical shadow boxer.'
  },
  'ベベノム': {
japanese: 'ベベノム',
    romaji: 'bebenomu',
    pronunciation: 'be-be-no-mu',
    meaning: 'Poison Pin Pokémon',
    explanation: 'From “bébé” (baby) + venom. An Ultra Beast larva.'
  },
  'アーゴヨン': {
japanese: 'アーゴヨン',
    romaji: 'a-goyon',
    pronunciation: 'a--go-yo-n',
    meaning: 'Poison Pin Pokémon',
    explanation: 'From “nagant” (needle gun) + dragon. An Ultra Beast dragon.'
  },
  'ツンデツンデ': {
japanese: 'ツンデツンデ',
    romaji: 'tsundetsunde',
    pronunciation: 'tsu-nde-tsu-nde',
    meaning: 'Rampart Pokémon',
    explanation: '積んで (*tsunde*, pile up). A fortress Ultra Beast.'
  },
  'ズガドーン': {
japanese: 'ズガドーン',
    romaji: 'zugado-n',
    pronunciation: 'zu-ga-do--n',
    meaning: 'Fireworks Pokémon',
    explanation: 'ずがーん (*zugān*, explosive sound). A clown Ultra Beast.'
  },
  'ゼラオラ': {
japanese: 'ゼラオラ',
    romaji: 'zeraora',
    pronunciation: 'ze-ra-o-ra',
    meaning: 'Thunderclap Pokémon',
    explanation: 'From “zero” + aura. An electric feline.'
  },
  'メルタン': {
japanese: 'メルタン',
    romaji: 'merutan',
    pronunciation: 'me-ru-ta-n',
    meaning: 'Hex Nut Pokémon',
    explanation: 'From “melt” + “tan.” A mythical liquid metal nut.'
  },
  'メルメタル': {
japanese: 'メルメタル',
    romaji: 'merumetaru',
    pronunciation: 'me-ru-me-ta-ru',
    meaning: 'Hex Nut Pokémon',
    explanation: 'From “melt” + “metal.” A giant mythical steel titan.'
  },
  'サルノリ': {
japanese: 'サルノリ',
    romaji: 'sarunori',
    pronunciation: 'sa-ru-no-ri',
    meaning: 'Chimp Pokémon',
    explanation: '猿 (*saru*, monkey) + ノリ (*nori*, rhythm/play). A drumming monkey.'
  },
  'バチンキー': {
japanese: 'バチンキー',
    romaji: 'bachinki-',
    pronunciation: 'ba-chi-nki-',
    meaning: 'Beat Pokémon',
    explanation: 'バチン (bachin, slap sound) + monkey. A stick-banging monkey.'
  },
  'ゴリランダー': {
japanese: 'ゴリランダー',
    romaji: 'goriranda-',
    pronunciation: 'go-ri-ra-nda-',
    meaning: 'Drummer Pokémon',
    explanation: 'From “gorilla” + “band.” A drummer gorilla.'
  },
  'ヒバニー': {
japanese: 'ヒバニー',
    romaji: 'hibani-',
    pronunciation: 'hi-ba-ni-',
    meaning: 'Rabbit Pokémon',
    explanation: '火 (*hi*, fire) + bunny. A fiery rabbit.'
  },
  'ラビフット': {
japanese: 'ラビフット',
    romaji: 'rabifutsuto',
    pronunciation: 'ra-bi-fu-tsu-to',
    meaning: 'Rabbit Pokémon',
    explanation: 'From “rabbit” + foot. A sporty rabbit.'
  },
  'エースバーン': {
japanese: 'エースバーン',
    romaji: 'e-suba-n',
    pronunciation: 'e--su-ba--n',
    meaning: 'Striker Pokémon',
    explanation: 'From “ace” + burn. A soccer-striker rabbit.'
  },
  'メッソン': {
japanese: 'メッソン',
    romaji: 'metsuson',
    pronunciation: 'me-tsu-so-n',
    meaning: 'Water Lizard Pokémon',
    explanation: 'From “mess/messo” (sob) + son. A timid water lizard.'
  },
  'ジメレオン': {
japanese: 'ジメレオン',
    romaji: 'jimereon',
    pronunciation: 'ji-me-re-o-n',
    meaning: 'Water Lizard Pokémon',
    explanation: 'じめじめ (*jimejime*, damp) + chameleon. A moody lizard.'
  },
  'インテレオン': {
japanese: 'インテレオン',
    romaji: 'intereon',
    pronunciation: 'i-nte-re-o-n',
    meaning: 'Secret Agent Pokémon',
    explanation: 'From “intelligent” + chameleon. A spy lizard.'
  },
  'ホシガリス': {
japanese: 'ホシガリス',
    romaji: 'hoshigarisu',
    pronunciation: 'ho-shi-ga-ri-su',
    meaning: 'Cheeky Pokémon',
    explanation: '欲しがり (*hoshigari*, greedy) + 栗鼠 (*risu*, squirrel). A greedy squirrel.'
  },
  'ヨクバリス': {
japanese: 'ヨクバリス',
    romaji: 'yokubarisu',
    pronunciation: 'yo-ku-ba-ri-su',
    meaning: 'Greedy Pokémon',
    explanation: 'Same as #820; second form mention. A plump greedy squirrel.'
  },
  'ココガラ': {
japanese: 'ココガラ',
    romaji: 'kokogara',
    pronunciation: 'ko-ko-ga-ra',
    meaning: 'Tiny Bird Pokémon',
    explanation: '小 (*ko*, little) + 鳥 (*tori*, bird) + cry sound. A tiny rook.'
  },
  'アオガラス': {
japanese: 'アオガラス',
    romaji: 'aogarasu',
    pronunciation: 'a-o-ga-ra-su',
    meaning: 'Raven Pokémon',
    explanation: '青 (*ao*, blue) + 烏 (*karasu*, crow). A mid-stage raven.'
  },
  'アーマーガア': {
japanese: 'アーマーガア',
    romaji: 'a-ma-gaa',
    pronunciation: 'a--ma--ga-a',
    meaning: 'Raven Pokémon',
    explanation: 'From “armor” + crow. A knightly raven.'
  },
  'サッチムシ': {
japanese: 'サッチムシ',
    romaji: 'satsuchimushi',
    pronunciation: 'sa-tsu-chi-mu-shi',
    meaning: 'Larva Pokémon',
    explanation: '察知 (*satchi*, to sense/measure) + 虫 (*mushi*, bug). A scholarly bug.'
  },
  'レドームシ': {
japanese: 'レドームシ',
    romaji: 'redo-mushi',
    pronunciation: 're-do--mu-shi',
    meaning: 'Radome Pokémon',
    explanation: 'Dome + 虫 (*mushi*, bug). A psychic cocoon.'
  },
  'イオルブ': {
japanese: 'イオルブ',
    romaji: 'iorubu',
    pronunciation: 'i-o-ru-bu',
    meaning: 'Seven Spot Pokémon',
    explanation: 'From “orb” + beetle. A UFO-like bug.'
  },
  'クスネ': {
japanese: 'クスネ',
    romaji: 'kusune',
    pronunciation: 'ku-su-ne',
    meaning: 'Fox Pokémon',
    explanation: 'くすねる (*kusuneru*, to pilfer) + fox. A cunning fox.'
  },
  'フォクスライ': {
japanese: 'フォクスライ',
    romaji: 'fuokusurai',
    pronunciation: 'fu-o-ku-su-ra-i',
    meaning: 'Fox Pokémon',
    explanation: 'From “fox” + sly. A gentleman thief fox.'
  },
  'ヒメンカ': {
japanese: 'ヒメンカ',
    romaji: 'himenka',
    pronunciation: 'hi-me-nka',
    meaning: 'Flowering Pokémon',
    explanation: '姫 (*hime*, princess) + 花 (*ka*, flower). A dainty flower.'
  },
  'ワタシラガ': {
japanese: 'ワタシラガ',
    romaji: 'watashiraga',
    pronunciation: 'wa-ta-shi-ra-ga',
    meaning: 'Cotton Bloom Pokémon',
    explanation: '綿 (*wata*, cotton) + 白髪 (*shiraga*, white hair). A puffball elder.'
  },
  'ウールー': {
japanese: 'ウールー',
    romaji: 'u-ru-',
    pronunciation: 'u--ru-',
    meaning: 'Sheep Pokémon',
    explanation: 'From “wool” + baa sound. A fluffy sheep.'
  },
  'バイウールー': {
japanese: 'バイウールー',
    romaji: 'baiu-ru-',
    pronunciation: 'ba-i-u--ru-',
    meaning: 'Sheep Pokémon',
    explanation: 'From “double” + wool. A ram with curled horns.'
  },
  'カムカメ': {
japanese: 'カムカメ',
    romaji: 'kamukame',
    pronunciation: 'ka-mu-ka-me',
    meaning: 'Snapping Pokémon',
    explanation: '噛む (*kamu*, to bite) + 亀 (*kame*, turtle). A snapping turtle.'
  },
  'カジリガメ': {
japanese: 'カジリガメ',
    romaji: 'kajirigame',
    pronunciation: 'ka-ji-ri-ga-me',
    meaning: 'Bite Pokémon',
    explanation: 'かじる (*kajiru*, to gnaw) + turtle. A biting turtle.'
  },
  'ワンパチ': {
japanese: 'ワンパチ',
    romaji: 'wanpachi',
    pronunciation: 'wa-npa-chi',
    meaning: 'Puppy Pokémon',
    explanation: 'ワン (*wan*, dog bark) + パチ (pachi, electric crackle). An electric corgi.'
  },
  'パルスワン': {
japanese: 'パルスワン',
    romaji: 'parusuwan',
    pronunciation: 'pa-ru-su-wa-n',
    meaning: 'Dog Pokémon',
    explanation: '“Pulse” + ワン (*wan*, bark). A loyal hound.'
  },
  'タンドン': {
japanese: 'タンドン',
    romaji: 'tandon',
    pronunciation: 'ta-ndo-n',
    meaning: 'Coal Pokémon',
    explanation: '炭団 (*tandon*, charcoal briquette). A rolling coal lump.'
  },
  'トロッゴン': {
japanese: 'トロッゴン',
    romaji: 'torotsugon',
    pronunciation: 'to-ro-tsu-go-n',
    meaning: 'Coal Pokémon',
    explanation: 'From “trolley” + coal. A cart-coal Pokémon.'
  },
  'セキタンザン': {
japanese: 'セキタンザン',
    romaji: 'sekitanzan',
    pronunciation: 'se-ki-ta-nza-n',
    meaning: 'Coal Pokémon',
    explanation: '石炭 (*sekitan*, coal) + 山 (*zan*, mountain). A coal colossus.'
  },
  'カジッチュ': {
japanese: 'カジッチュ',
    romaji: 'kajitsuchu',
    pronunciation: 'ka-ji-tsu-chu',
    meaning: 'Apple Core Pokémon',
    explanation: '噛じる (*kajiru*, to bite) + apple. A worm in an apple.'
  },
  'アップリュー': {
japanese: 'アップリュー',
    romaji: 'atsupuryu-',
    pronunciation: 'a-tsu-pu-ryu-',
    meaning: 'Apple Wing Pokémon',
    explanation: 'From “apple” + dragon. A winged apple wyrm.'
  },
  'タルップル': {
japanese: 'タルップル',
    romaji: 'tarutsupuru',
    pronunciation: 'ta-ru-tsu-pu-ru',
    meaning: 'Apple Nectar Pokémon',
    explanation: 'From “tart” + apple. A pie-like apple dragon.'
  },
  'スナヘビ': {
japanese: 'スナヘビ',
    romaji: 'sunahebi',
    pronunciation: 'su-na-he-bi',
    meaning: 'Sand Snake Pokémon',
    explanation: '砂 (*suna*, sand) + 蛇 (*hebi*, snake). A sand snake.'
  },
  'サダイジャ': {
japanese: 'サダイジャ',
    romaji: 'sadaija',
    pronunciation: 'sa-da-i-ja',
    meaning: 'Sand Snake Pokémon',
    explanation: 'From “sand” + “anaconda.” A coiled sand snake.'
  },
  'ウッウ': {
japanese: 'ウッウ',
    romaji: 'utsuu',
    pronunciation: 'u-tsu-u',
    meaning: 'Gulp Pokémon',
    explanation: 'A silly cormorant; Japanese name mimics its cry.'
  },
  'サシカマス': {
japanese: 'サシカマス',
    romaji: 'sashikamasu',
    pronunciation: 'sa-shi-ka-ma-su',
    meaning: 'Rush Pokémon',
    explanation: '刺す (*sasu*, to pierce) + カマス (*kamasu*, barracuda). A dart fish.'
  },
  'カマスジョー': {
japanese: 'カマスジョー',
    romaji: 'kamasujo-',
    pronunciation: 'ka-ma-su-jo-',
    meaning: 'Skewer Pokémon',
    explanation: 'From “kamasu” (barracuda) + 丈 (*jō*, boss/leader). A spearhead fish.'
  },
  'エレズン': {
japanese: 'エレズン',
    romaji: 'erezun',
    pronunciation: 'e-re-zu-n',
    meaning: 'Baby Pokémon',
    explanation: 'From “electric” + lizard. A baby punk lizard.'
  },
  'ストリンダー': {
japanese: 'ストリンダー',
    romaji: 'sutorinda-',
    pronunciation: 'su-to-ri-nda-',
    meaning: 'Punk Pokémon',
    explanation: 'From “string/strident” + thunder. A punk rocker lizard.'
  },
  'ヤクデ': {
japanese: 'ヤクデ',
    romaji: 'yakude',
    pronunciation: 'ya-ku-de',
    meaning: 'Radiator Pokémon',
    explanation: '焼く (*yaku*, to burn) + 百足 (*mukade*, centipede). A fiery centipede.'
  },
  'マルヤクデ': {
japanese: 'マルヤクデ',
    romaji: 'maruyakude',
    pronunciation: 'ma-ru-ya-ku-de',
    meaning: 'Radiator Pokémon',
    explanation: '丸 (*maru*, round) + yaku (burn) + centipede. A blazing centipede.'
  },
  'タタッコ': {
japanese: 'タタッコ',
    romaji: 'tatatsuko',
    pronunciation: 'ta-ta-tsu-ko',
    meaning: 'Tantrum Pokémon',
    explanation: '叩く (*tataku*, punch) + 蛸 (*tako*, octopus). A punching octopus.'
  },
  'オトスパス': {
japanese: 'オトスパス',
    romaji: 'otosupasu',
    pronunciation: 'o-to-su-pa-su',
    meaning: 'Jujitsu Pokémon',
    explanation: '落とす (*otosu*, to throw down) + octopus. A grappling cephalopod.'
  },
  'ヤバチャ': {
japanese: 'ヤバチャ',
    romaji: 'yabacha',
    pronunciation: 'ya-ba-cha',
    meaning: 'Black Tea Pokémon',
    explanation: 'やばい (*yabai*, dangerous/strange) + 茶 (*cha*, tea). A haunted teacup.'
  },
  'ポットデス': {
japanese: 'ポットデス',
    romaji: 'potsutodesu',
    pronunciation: 'po-tsu-to-de-su',
    meaning: 'Black Tea Pokémon',
    explanation: 'From “pot” + death. A haunted teapot.'
  },
  'ミブリム': {
japanese: 'ミブリム',
    romaji: 'miburimu',
    pronunciation: 'mi-bu-ri-mu',
    meaning: 'Calm Pokémon',
    explanation: '身振り (*miburi*, gesture) + grim. A timid psychic.'
  },
  'テブリム': {
japanese: 'テブリム',
    romaji: 'teburimu',
    pronunciation: 'te-bu-ri-mu',
    meaning: 'Serene Pokémon',
    explanation: '手振り (*teburi*, hand gesture) + grim. A mid-stage psychic.'
  },
  'ブリムオン': {
japanese: 'ブリムオン',
    romaji: 'burimuon',
    pronunciation: 'bu-ri-mu-o-n',
    meaning: 'Silent Pokémon',
    explanation: 'From “grim” + sound suffix. A witch-like psychic fairy.'
  },
  'ベロバー': {
japanese: 'ベロバー',
    romaji: 'beroba-',
    pronunciation: 'be-ro-ba-',
    meaning: 'Wily Pokémon',
    explanation: 'ベロ (*bero*, tongue) + imp sound. A mischievous imp.'
  },
  'ギモー': {
japanese: 'ギモー',
    romaji: 'gimo-',
    pronunciation: 'gi-mo-',
    meaning: 'Devious Pokémon',
    explanation: '偽 (*gi*, false/deceit) + ogre sound. A goblin trickster.'
  },
  'オーロンゲ': {
japanese: 'オーロンゲ',
    romaji: 'o-ronge',
    pronunciation: 'o--ro-nge',
    meaning: 'Bulk Up Pokémon',
    explanation: 'From “ogre” + long hair. A demonic hairy fairy.'
  },
  'タチフサグマ': {
japanese: 'タチフサグマ',
    romaji: 'tachifusaguma',
    pronunciation: 'ta-chi-fu-sa-gu-ma',
    meaning: 'Blocking Pokémon',
    explanation: '立ち塞ぐ (*tachifusagu*, to block) + 熊 (*guma/kuma*, badger). A blocking badger.'
  },
  'ニャイキング': {
japanese: 'ニャイキング',
    romaji: 'nyaikingu',
    pronunciation: 'nya-i-ki-ngu',
    meaning: 'Viking Pokémon',
    explanation: 'ニャー (*nya*, meow) + viking. A berserker cat.'
  },
  'サニゴーン': {
japanese: 'サニゴーン',
    romaji: 'sanigo-n',
    pronunciation: 'sa-ni-go--n',
    meaning: 'Coral Pokémon',
    explanation: 'サンゴ (*sango*, coral) + gone. A ghost coral.'
  },
  'ネギガナイト': {
japanese: 'ネギガナイト',
    romaji: 'negiganaito',
    pronunciation: 'ne-gi-ga-na-i-to',
    meaning: 'Wild Duck Pokémon',
    explanation: '葱 (*negi*, leek) + knight. A noble duck with leek sword.'
  },
  'バリコオル': {
japanese: 'バリコオル',
    romaji: 'barikooru',
    pronunciation: 'ba-ri-ko-o-ru',
    meaning: 'Comedian Pokémon',
    explanation: 'From “barrier” + clown/performer. A tap-dancing mime.'
  },
  'デスバーン': {
japanese: 'デスバーン',
    romaji: 'desuba-n',
    pronunciation: 'de-su-ba--n',
    meaning: 'Grudge Pokémon',
    explanation: 'From “death” + rune/burn. A cursed tablet Pokémon.'
  },
  'マホミル': {
japanese: 'マホミル',
    romaji: 'mahomiru',
    pronunciation: 'ma-ho-mi-ru',
    meaning: 'Cream Pokémon',
    explanation: '魔法 (*mahou*, magic) + milk. A cream fairy.'
  },
  'マホイップ': {
japanese: 'マホイップ',
    romaji: 'mahoitsupu',
    pronunciation: 'ma-ho-i-tsu-pu',
    meaning: 'Cream Pokémon',
    explanation: '魔法 (*mahou*, magic) + whip/cream. A whipped cream fairy.'
  },
  'タイレーツ': {
japanese: 'タイレーツ',
    romaji: 'taire-tsu',
    pronunciation: 'ta-i-re--tsu',
    meaning: 'Formation Pokémon',
    explanation: '隊列 (*tairetsu*, military column). A squad-based Pokémon.'
  },
  'バチンウニ': {
japanese: 'バチンウニ',
    romaji: 'bachinuni',
    pronunciation: 'ba-chi-nu-ni',
    meaning: 'Sea Urchin Pokémon',
    explanation: 'バチン (bachin, crackle sound) + 海胆 (*uni*, sea urchin). An electric urchin.'
  },
  'ユキハミ': {
japanese: 'ユキハミ',
    romaji: 'yukihami',
    pronunciation: 'yu-ki-ha-mi',
    meaning: 'Worm Pokémon',
    explanation: '雪 (*yuki*, snow) + 噛み (*kami*, bite). A snowy larva.'
  },
  'モスノウ': {
japanese: 'モスノウ',
    romaji: 'mosunou',
    pronunciation: 'mo-su-no-u',
    meaning: 'Frost Moth Pokémon',
    explanation: 'From “moth” + snow. An icy moth.'
  },
  'イシヘンジン': {
japanese: 'イシヘンジン',
    romaji: 'ishihenjin',
    pronunciation: 'i-shi-he-nji-n',
    meaning: 'Big Rock Pokémon',
    explanation: '石 (*ishi*, stone) + henge. A Stonehenge Pokémon.'
  },
  'コオリッポ': {
japanese: 'コオリッポ',
    romaji: 'kooritsupo',
    pronunciation: 'ko-o-ri-tsu-po',
    meaning: 'Penguin Pokémon',
    explanation: '氷 (*kōri*, ice) + playful suffix. A penguin with an ice head.'
  },
  'イエッサン': {
japanese: 'イエッサン',
    romaji: 'ietsusan',
    pronunciation: 'i-e-tsu-sa-n',
    meaning: 'Emotion Pokémon',
    explanation: 'From “yes, sir” + attendant. A psychic butler Pokémon.'
  },
  'モルペコ': {
japanese: 'モルペコ',
    romaji: 'morupeko',
    pronunciation: 'mo-ru-pe-ko',
    meaning: 'Two-Sided Pokémon',
    explanation: 'Derived from 食いしん坊 (*moru*, glutton) + ペコペコ (*pekopeko*, hungry). A dual-mode hamster.'
  },
  'ゾウドウ': {
japanese: 'ゾウドウ',
    romaji: 'zoudou',
    pronunciation: 'zo-u-do-u',
    meaning: 'Copperderm Pokémon',
    explanation: '象 (*zō*, elephant) + 銅 (*dō*, copper). A copper elephant.'
  },
  'ダイオウドウ': {
japanese: 'ダイオウドウ',
    romaji: 'daioudou',
    pronunciation: 'da-i-o-u-do-u',
    meaning: 'Copperderm Pokémon',
    explanation: '大王 (*daiō*, great king) + copper. A regal elephant.'
  },
  'パッチラゴン': {
japanese: 'パッチラゴン',
    romaji: 'patsuchiragon',
    pronunciation: 'pa-tsu-chi-ra-go-n',
    meaning: 'Fossil Pokémon',
    explanation: 'From “patchwork” + dragon. A fossil chimera.'
  },
  'パッチルドン': {
japanese: 'パッチルドン',
    romaji: 'patsuchirudon',
    pronunciation: 'pa-tsu-chi-ru-do-n',
    meaning: 'Fossil Pokémon',
    explanation: 'From “patchwork” + cold/freeze suffix. A fossil chimera.'
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
    meaning: 'Alloy Pokémon',
    explanation: 'From “duralumin” (alloy) + don. A steel dragon.'
  },
  'ドラメシヤ': {
japanese: 'ドラメシヤ',
    romaji: 'dorameshiya',
    pronunciation: 'do-ra-me-shi-ya',
    meaning: 'Lingering Pokémon',
    explanation: 'From “dragon” + 餓鬼 (*meshiya*, dead child spirit). A ghostly dragon.'
  },
  'ドロンチ': {
japanese: 'ドロンチ',
    romaji: 'doronchi',
    pronunciation: 'do-ro-nchi',
    meaning: 'Caretaker Pokémon',
    explanation: 'From “drone” + 幽霊 (*doron*, ghost). A guardian dragon.'
  },
  'ドラパルト': {
japanese: 'ドラパルト',
    romaji: 'doraparuto',
    pronunciation: 'do-ra-pa-ru-to',
    meaning: 'Stealth Pokémon',
    explanation: 'From “dragon” + catapult. Launches its young like missiles.'
  },
  'ザシアン': {
japanese: 'ザシアン',
    romaji: 'zashian',
    pronunciation: 'za-shi-a-n',
    meaning: 'Warrior Pokémon',
    explanation: 'From “sword” + cyan. Legendary hero wolf of Galar.'
  },
  'ザマゼンタ': {
japanese: 'ザマゼンタ',
    romaji: 'zamazenta',
    pronunciation: 'za-ma-ze-nta',
    meaning: 'Warrior Pokémon',
    explanation: 'From “shield” + magenta. Legendary hero wolf of Galar.'
  },
  'ムゲンダイナ': {
japanese: 'ムゲンダイナ',
    romaji: 'mugendaina',
    pronunciation: 'mu-ge-nda-i-na',
    meaning: 'Gigantic Pokémon',
    explanation: '無限大 (*mugendai*, infinity) + -na. A colossal alien dragon.'
  },
  'ダクマ': {
japanese: 'ダクマ',
    romaji: 'dakuma',
    pronunciation: 'da-ku-ma',
    meaning: 'Wushu Pokémon',
    explanation: '打 (*da*, strike) + 熊 (*kuma*, bear). A martial bear cub.'
  },
  'ウーラオス': {
japanese: 'ウーラオス',
    romaji: 'u-raosu',
    pronunciation: 'u--ra-o-su',
    meaning: 'Wushu Pokémon',
    explanation: 'From 武 (*ura/ra*, martial) + 師父 (*shifu*, master). A bear martial artist.'
  },
  'ザルード': {
japanese: 'ザルード',
    romaji: 'zaru-do',
    pronunciation: 'za-ru--do',
    meaning: 'Rogue Monkey Pokémon',
    explanation: 'From “zaruba” (baboon) + rude. A rogue jungle ape.'
  },
  'レジエレキ': {
japanese: 'レジエレキ',
    romaji: 'rejiereki',
    pronunciation: 're-ji-e-re-ki',
    meaning: 'Electron Pokémon',
    explanation: 'From “Regi” series + electric. An electric golem.'
  },
  'レジドラゴ': {
japanese: 'レジドラゴ',
    romaji: 'rejidorago',
    pronunciation: 're-ji-do-ra-go',
    meaning: 'Dragon Orb Pokémon',
    explanation: 'From “Regi” series + dragon. A dragon golem.'
  },
  'ブリザポス': {
japanese: 'ブリザポス',
    romaji: 'burizaposu',
    pronunciation: 'bu-ri-za-po-su',
    meaning: 'Wild Horse Pokémon',
    explanation: 'From “blizzard” + horse. An icy steed.'
  },
  'レイスポス': {
japanese: 'レイスポス',
    romaji: 'reisuposu',
    pronunciation: 're-i-su-po-su',
    meaning: 'Swift Horse Pokémon',
    explanation: '霊 (*rei*, spirit) + horse. A spectral steed.'
  },
  'バドレックス': {
japanese: 'バドレックス',
    romaji: 'badoretsukusu',
    pronunciation: 'ba-do-re-tsu-ku-su',
    meaning: 'King Pokémon',
    explanation: 'From “bud” + rex (king). A regal plant king.'
  },
  'アヤシシ': {
japanese: 'アヤシシ',
    romaji: 'ayashishi',
    pronunciation: 'a-ya-shi-shi',
    meaning: 'Big Horn Pokémon',
    explanation: '怪しい (*ayashii*, mysterious) + deer. A mystical deer.'
  },
  'バサギリ': {
japanese: 'バサギリ',
    romaji: 'basagiri',
    pronunciation: 'ba-sa-gi-ri',
    meaning: 'Axe Pokémon',
    explanation: '伐る (*basagiru*, to slash) + insect suffix. A noble axe insect.'
  },
  'ガチグマ': {
japanese: 'ガチグマ',
    romaji: 'gachiguma',
    pronunciation: 'ga-chi-gu-ma',
    meaning: 'Peat Pokémon',
    explanation: 'ガチ (*gachi*, serious) + 熊 (*kuma*, bear). A giant bear.'
  },
  'イダイトウ': {
japanese: 'イダイトウ',
    romaji: 'idaitou',
    pronunciation: 'i-da-i-to-u',
    meaning: 'Big Fish Pokémon',
    explanation: '偉大 (*idai*, great) + 魚 (*tō*, fish). A legion of vengeful fish.'
  },
  'オオニューラ': {
japanese: 'オオニューラ',
    romaji: 'oonyu-ra',
    pronunciation: 'o-o-nyu--ra',
    meaning: 'Free Climb Pokémon',
    explanation: '大 (*ō*, great) + ニューラ (*Nyūra*, Sneasel). A climbing poison cat.'
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
    meaning: 'Love-Hate Pokémon',
    explanation: 'From “love” + genie suffix (as with Tornadus, Thundurus, etc.). A love-associated genie.'
  },
  'ニャオハ': {
japanese: 'ニャオハ',
    romaji: 'nyaoha',
    pronunciation: 'nya-o-ha',
    meaning: 'Grass Cat Pokémon',
    explanation: 'ニャー (*nyaa*, meow) + 葉 (*ha*, leaf). A grass kitten.'
  },
  'ニャローテ': {
japanese: 'ニャローテ',
    romaji: 'nyaro-te',
    pronunciation: 'nya-ro--te',
    meaning: 'Grass Cat Pokémon',
    explanation: 'From ニャー (meow) + rogue/scoundrel nuance. A mischievous cat.'
  },
  'マスカーニャ': {
japanese: 'マスカーニャ',
    romaji: 'masuka-nya',
    pronunciation: 'ma-su-ka--nya',
    meaning: 'Magician Pokémon',
    explanation: 'From “masquerade” + ニャー (*nya*, meow). A magician cat.'
  },
  'ホゲータ': {
japanese: 'ホゲータ',
    romaji: 'hoge-ta',
    pronunciation: 'ho-ge--ta',
    meaning: 'Fire Croc Pokémon',
    explanation: 'ホゲー (*hoge*, silly expression) + ゲータ (alligator). A goofy croc.'
  },
  'アチゲータ': {
japanese: 'アチゲータ',
    romaji: 'achige-ta',
    pronunciation: 'a-chi-ge--ta',
    meaning: 'Fire Croc Pokémon',
    explanation: '熱い (*atsui*, hot) + gator. A hot-headed croc.'
  },
  'ラウドボーン': {
japanese: 'ラウドボーン',
    romaji: 'raudobo-n',
    pronunciation: 'ra-u-do-bo--n',
    meaning: 'Singer Pokémon',
    explanation: 'From “loud” + bone. A ghostly croc singer.'
  },
  'クワッス': {
japanese: 'クワッス',
    romaji: 'kuwatsusu',
    pronunciation: 'ku-wa-tsu-su',
    meaning: 'Duckling Pokémon',
    explanation: 'From “quack.” A proud duckling.'
  },
  'ウェルカモ': {
japanese: 'ウェルカモ',
    romaji: 'uerukamo',
    pronunciation: 'u-e-ru-ka-mo',
    meaning: 'Practicing Pokémon',
    explanation: 'From “welcome” + duck. A dancing duck.'
  },
  'ウェーニバル': {
japanese: 'ウェーニバル',
    romaji: 'ue-nibaru',
    pronunciation: 'u-e--ni-ba-ru',
    meaning: 'Dancer Pokémon',
    explanation: 'From “carnival” + waterfowl. A flamboyant dancer.'
  },
  'グルトン': {
japanese: 'グルトン',
    romaji: 'guruton',
    pronunciation: 'gu-ru-to-n',
    meaning: 'Hog Pokémon',
    explanation: 'From “glutton.” A greedy pig.'
  },
  'パフュートン': {
japanese: 'パフュートン',
    romaji: 'pafuュ-ton',
    pronunciation: 'pa-fu-ュ-to-n',
    meaning: 'Hog Pokémon',
    explanation: 'From “perfume” + glutton. A perfumed hog.'
  },
  'タマンチュラ': {
japanese: 'タマンチュラ',
    romaji: 'tamanchura',
    pronunciation: 'ta-ma-nchu-ra',
    meaning: 'String Ball Pokémon',
    explanation: '玉 (*tama*, ball) + tarantula. A yarn-ball spider.'
  },
  'ワナイダー': {
japanese: 'ワナイダー',
    romaji: 'wanaida-',
    pronunciation: 'wa-na-i-da-',
    meaning: 'Trap Pokémon',
    explanation: '罠 (*wana*, trap) + spider. A thread-trapping spider.'
  },
  'マメバッタ': {
japanese: 'マメバッタ',
    romaji: 'mamebatsuta',
    pronunciation: 'ma-me-ba-tsu-ta',
    meaning: 'Grasshopper Pokémon',
    explanation: '豆 (*mame*, bean/small) + grasshopper. A small hopper.'
  },
  'エクスレッグ': {
japanese: 'エクスレッグ',
    romaji: 'ekusuretsugu',
    pronunciation: 'e-ku-su-re-tsu-gu',
    meaning: 'Grasshopper Pokémon',
    explanation: 'From “exoskeleton” + legs. A mechanical-like hopper.'
  },
  'パモ': {
japanese: 'パモ',
    romaji: 'pamo',
    pronunciation: 'pa-mo',
    meaning: 'Mouse Pokémon',
    explanation: 'From “paw.” A tiny electric rodent.'
  },
  'パモット': {
japanese: 'パモット',
    romaji: 'pamotsuto',
    pronunciation: 'pa-mo-tsu-to',
    meaning: 'Mouse Pokémon',
    explanation: 'Evolves Pamo; slightly bigger.'
  },
  'パーモット': {
japanese: 'パーモット',
    romaji: 'pa-motsuto',
    pronunciation: 'pa--mo-tsu-to',
    meaning: 'Hands-On Pokémon',
    explanation: 'From “paw” + “mighty.” Stronger electric rodent.'
  },
  'ワッカネズミ': {
japanese: 'ワッカネズミ',
    romaji: 'watsukanezumi',
    pronunciation: 'wa-tsu-ka-ne-zu-mi',
    meaning: 'Couple Pokémon',
    explanation: '輪 (*wa*, ring) + 鼠 (*nezumi*, mouse). Two mice together.'
  },
  'イッカネズミ': {
japanese: 'イッカネズミ',
    romaji: 'itsukanezumi',
    pronunciation: 'i-tsu-ka-ne-zu-mi',
    meaning: 'Family Pokémon',
    explanation: '一家 (*ikka*, family) + 鼠 (*nezumi*, mouse). A family of mice.'
  },
  'パピモッチ': {
japanese: 'パピモッチ',
    romaji: 'papimotsuchi',
    pronunciation: 'pa-pi-mo-tsu-chi',
    meaning: 'Puppy Pokémon',
    explanation: 'From “puppy” + mochi. A dough puppy.'
  },
  'バウッツェル': {
japanese: 'バウッツェル',
    romaji: 'bautsutsueru',
    pronunciation: 'ba-u-tsu-tsu-e-ru',
    meaning: 'Dog Pokémon',
    explanation: 'From “pretzel” + dachshund. A baked dog.'
  },
  'ミニーブ': {
japanese: 'ミニーブ',
    romaji: 'mini-bu',
    pronunciation: 'mi-ni--bu',
    meaning: 'Olive Pokémon',
    explanation: 'From “mini” + olive. A tiny olive.'
  },
  'オリーニョ': {
japanese: 'オリーニョ',
    romaji: 'ori-nyo',
    pronunciation: 'o-ri--nyo',
    meaning: 'Olive Pokémon',
    explanation: 'From “olive” + niño (child). A young olive.'
  },
  'オリーヴァ': {
japanese: 'オリーヴァ',
    romaji: 'ori-ヴa',
    pronunciation: 'o-ri--ヴa',
    meaning: 'Olive Pokémon',
    explanation: 'From “olive” + viva. A grand olive tree.'
  },
  'イキリンコ': {
japanese: 'イキリンコ',
    romaji: 'ikirinko',
    pronunciation: 'i-ki-ri-nko',
    meaning: 'Parrot Pokémon',
    explanation: '粋 (*iki*, stylish/cocky) + parrot. A punk parrot.'
  },
  'コジオ': {
japanese: 'コジオ',
    romaji: 'kojio',
    pronunciation: 'ko-ji-o',
    meaning: 'Rock Salt Pokémon',
    explanation: '小 (*ko*, small) + 塩 (*shio*, salt). A salt crystal.'
  },
  'ジオヅム': {
japanese: 'ジオヅム',
    romaji: 'jiozumu',
    pronunciation: 'ji-o-zu-mu',
    meaning: 'Rock Salt Pokémon',
    explanation: 'From “geo” + stack. A pile of salt.'
  },
  'キョジオーン': {
japanese: 'キョジオーン',
    romaji: 'kyojio-n',
    pronunciation: 'kyo-ji-o--n',
    meaning: 'Rock Salt Pokémon',
    explanation: '巨 (*kyo*, giant) + 塩 (*shio*, salt). A colossal salt golem.'
  },
  'カルボウ': {
japanese: 'カルボウ',
    romaji: 'karubou',
    pronunciation: 'ka-ru-bo-u',
    meaning: 'Fire Child Pokémon',
    explanation: 'From “charcoal” + 坊 (*bō*, boy). A fiery child.'
  },
  'グレンアルマ': {
japanese: 'グレンアルマ',
    romaji: 'gurenaruma',
    pronunciation: 'gu-re-na-ru-ma',
    meaning: 'Fire Warrior Pokémon',
    explanation: '紅蓮 (*guren*, crimson) + armor. A fiery knight.'
  },
  'ソウブレイズ': {
japanese: 'ソウブレイズ',
    romaji: 'soubureizu',
    pronunciation: 'so-u-bu-re-i-zu',
    meaning: 'Fire Blades Pokémon',
    explanation: 'From “soul” + blaze. A spectral knight.'
  },
  'ズピカ': {
japanese: 'ズピカ',
    romaji: 'zupika',
    pronunciation: 'zu-pi-ka',
    meaning: 'EleTadpole Pokémon',
    explanation: 'From “spark” + ピカ (pika, flash). A tadpole bulb.'
  },
  'ハラバリー': {
japanese: 'ハラバリー',
    romaji: 'harabari-',
    pronunciation: 'ha-ra-ba-ri-',
    meaning: 'EleFrog Pokémon',
    explanation: 'From “belly” + battery. A frog with belly-electricity.'
  },
  'カイデン': {
japanese: 'カイデン',
    romaji: 'kaiden',
    pronunciation: 'ka-i-de-n',
    meaning: 'Storm Petrel Pokémon',
    explanation: '海 (*kai*, sea) + 電 (*den*, electric). A seabird.'
  },
  'タイカイデン': {
japanese: 'タイカイデン',
    romaji: 'taikaiden',
    pronunciation: 'ta-i-ka-i-de-n',
    meaning: 'Frigatebird Pokémon',
    explanation: '大 (*tai*, great) + 海電 (*kaiden*, sea-electric). A powerful seabird.'
  },
  'オラチフ': {
japanese: 'オラチフ',
    romaji: 'orachifu',
    pronunciation: 'o-ra-chi-fu',
    meaning: 'Rascal Pokémon',
    explanation: 'From “ora” (rough bark) + mastiff. A scrappy puppy.'
  },
  'マフィティフ': {
japanese: 'マフィティフ',
    romaji: 'mafuiteifu',
    pronunciation: 'ma-fu-i-te-i-fu',
    meaning: 'Boss Pokémon',
    explanation: 'From “mafia” + mastiff. A loyal boss dog.'
  },
  'シルシュルー': {
japanese: 'シルシュルー',
    romaji: 'shirushuru-',
    pronunciation: 'shi-ru-shu-ru-',
    meaning: 'Toxic Mouse Pokémon',
    explanation: 'From “scribble” + doodle. A graffiti lemur.'
  },
  'タギングル': {
japanese: 'タギングル',
    romaji: 'taginguru',
    pronunciation: 'ta-gi-ngu-ru',
    meaning: 'Toxic Monkey Pokémon',
    explanation: 'From “tagging” graffiti + lemur. A toxic graffiti monkey.'
  },
  'アノクサ': {
japanese: 'アノクサ',
    romaji: 'anokusa',
    pronunciation: 'a-no-ku-sa',
    meaning: 'Tumbleweed Pokémon',
    explanation: 'あの草 (*ano kusa*, “that weed/grass”). A tumbleweed ghost.'
  },
  'アノホラグサ': {
japanese: 'アノホラグサ',
    romaji: 'anohoragusa',
    pronunciation: 'a-no-ho-ra-gu-sa',
    meaning: 'Tumbleweed Pokémon',
    explanation: 'あの (*ano*, that) + ホラー (horror) + 草 (*kusa*, grass). A haunted tumbleweed.'
  },
  'ノノクラゲ': {
japanese: 'ノノクラゲ',
    romaji: 'nonokurage',
    pronunciation: 'no-no-ku-ra-ge',
    meaning: 'Woodear Pokémon',
    explanation: 'のの (*nono*, imitation) + クラゲ (*kurage*, jellyfish). Mushroom jellyfish.'
  },
  'リククラゲ': {
japanese: 'リククラゲ',
    romaji: 'rikukurage',
    pronunciation: 'ri-ku-ku-ra-ge',
    meaning: 'Woodear Pokémon',
    explanation: '陸 (*riku*, land) + クラゲ (*kurage*, jellyfish). A land fungus jellyfish.'
  },
  'ガケガニ': {
japanese: 'ガケガニ',
    romaji: 'gakegani',
    pronunciation: 'ga-ke-ga-ni',
    meaning: 'Ambush Pokémon',
    explanation: '崖蟹 (*gakegani*). A crab that clings to cliffs.'
  },
  'カプサイジ': {
japanese: 'カプサイジ',
    romaji: 'kapusaiji',
    pronunciation: 'ka-pu-sa-i-ji',
    meaning: 'Spicy Pepper Pokémon',
    explanation: 'From “capsaicin” (chili compound) + kid. A spicy pepper.'
  },
  'スコヴィラン': {
japanese: 'スコヴィラン',
    romaji: 'sukoヴiran',
    pronunciation: 'su-ko-ヴi-ra-n',
    meaning: 'Spicy Pepper Pokémon',
    explanation: 'From Scoville scale + villain. A fiery twin-headed pepper.'
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
    meaning: 'Rolling Pokémon',
    explanation: 'From scarab + “bless.” A psychic scarab.'
  },
  'ヒラヒナ': {
japanese: 'ヒラヒナ',
    romaji: 'hirahina',
    pronunciation: 'hi-ra-hi-na',
    meaning: 'Frill Pokémon',
    explanation: 'From “hirahira” (flutter) + 雛 (*hina*, chick). A floating bird chick.'
  },
  'クエスパトラ': {
japanese: 'クエスパトラ',
    romaji: 'kuesupatora',
    pronunciation: 'ku-e-su-pa-to-ra',
    meaning: 'Ostrich Pokémon',
    explanation: 'From “queso” (question/que) + Cleopatra/ostrich. A psychic ostrich.'
  },
  'カヌチャン': {
japanese: 'カヌチャン',
    romaji: 'kanuchan',
    pronunciation: 'ka-nu-cha-n',
    meaning: 'Metalsmith Pokémon',
    explanation: 'From 金槌 (*kanadzuchi*, hammer) + cute -chan. A small hammer fairy.'
  },
  'ナカヌチャン': {
japanese: 'ナカヌチャン',
    romaji: 'nakanuchan',
    pronunciation: 'na-ka-nu-cha-n',
    meaning: 'Hammer Pokémon',
    explanation: 'From 中 (*naka*, middle) + hammer + -chan. A growing hammer fairy.'
  },
  'デカヌチャン': {
japanese: 'デカヌチャン',
    romaji: 'dekanuchan',
    pronunciation: 'de-ka-nu-cha-n',
    meaning: 'Hammer Pokémon',
    explanation: 'From でかい (*dekai*, huge) + hammer + -chan. A giant hammer fairy.'
  },
  'ウミディグダ': {
japanese: 'ウミディグダ',
    romaji: 'umideiguda',
    pronunciation: 'u-mi-de-i-gu-da',
    meaning: 'Garden Eel Pokémon',
    explanation: '海 (*umi*, sea) + Digda (Diglett). A Diglett variant.'
  },
  'ウミトリオ': {
japanese: 'ウミトリオ',
    romaji: 'umitorio',
    pronunciation: 'u-mi-to-ri-o',
    meaning: 'Garden Eel Pokémon',
    explanation: '海 (*umi*, sea) + trio. A Wug-trio.'
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
    meaning: 'Dolphin Pokémon',
    explanation: '波 (*nami*, wave) + イルカ (*iruka*, dolphin).'
  },
  'イルカマン': {
japanese: 'イルカマン',
    romaji: 'irukaman',
    pronunciation: 'i-ru-ka-ma-n',
    meaning: 'Dolphin Pokémon',
    explanation: 'イルカ (*iruka*, dolphin) + man. A superhero dolphin.'
  },
  'ブロロン': {
japanese: 'ブロロン',
    romaji: 'buroron',
    pronunciation: 'bu-ro-ro-n',
    meaning: 'Single-Cyl Pokémon',
    explanation: 'From “vroom” car engine. A motorbike Pokémon.'
  },
  'ブロロローム': {
japanese: 'ブロロローム',
    romaji: 'burororo-mu',
    pronunciation: 'bu-ro-ro-ro--mu',
    meaning: 'Multi-Cyl Pokémon',
    explanation: 'Engine revving sound. A bigger motorbike.'
  },
  'モトトカゲ': {
japanese: 'モトトカゲ',
    romaji: 'mototokage',
    pronunciation: 'mo-to-to-ka-ge',
    meaning: 'Mount Pokémon',
    explanation: 'From “motor” + トカゲ (*tokage*, lizard). A ride Pokémon.'
  },
  'ミミズズ': {
japanese: 'ミミズズ',
    romaji: 'mimizuzu',
    pronunciation: 'mi-mi-zu-zu',
    meaning: 'Earthworm Pokémon',
    explanation: 'ミミズ (*mimizu*, earthworm). A steel worm.'
  },
  'キラーメ': {
japanese: 'キラーメ',
    romaji: 'kira-me',
    pronunciation: 'ki-ra--me',
    meaning: 'Ore Pokémon',
    explanation: 'From “glimmer” + ore. A crystal flower.'
  },
  'キラフロル': {
japanese: 'キラフロル',
    romaji: 'kirafuroru',
    pronunciation: 'ki-ra-fu-ro-ru',
    meaning: 'Ore Pokémon',
    explanation: 'From “glitter” + floral. A crystal flower.'
  },
  'ボチ': {
japanese: 'ボチ',
    romaji: 'bochi',
    pronunciation: 'bo-chi',
    meaning: 'Ghost Dog Pokémon',
    explanation: '墓地 (*bochi*, graveyard). A ghost dog.'
  },
  'ハカドッグ': {
japanese: 'ハカドッグ',
    romaji: 'hakadotsugu',
    pronunciation: 'ha-ka-do-tsu-gu',
    meaning: 'Ghost Dog Pokémon',
    explanation: '墓 (*haka*, grave) + dog. A tombstone ghost dog.'
  },
  'カラミンゴ': {
japanese: 'カラミンゴ',
    romaji: 'karamingo',
    pronunciation: 'ka-ra-mi-ngo',
    meaning: 'Synchronize Pokémon',
    explanation: 'From “flamingo” + amigo. A friend flamingo.'
  },
  'アルクジラ': {
japanese: 'アルクジラ',
    romaji: 'arukujira',
    pronunciation: 'a-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon',
    explanation: '歩く (*aruku*, to walk) + 鯨 (*kujira*, whale). A land-whale.'
  },
  'ハルクジラ': {
japanese: 'ハルクジラ',
    romaji: 'harukujira',
    pronunciation: 'ha-ru-ku-ji-ra',
    meaning: 'Terra Whale Pokémon',
    explanation: 'From 巨大 (*haru/haru*, huge) + whale. A massive whale.'
  },
  'ミガルーサ': {
japanese: 'ミガルーサ',
    romaji: 'migaru-sa',
    pronunciation: 'mi-ga-ru--sa',
    meaning: 'Jettison Pokémon',
    explanation: 'From 身替り (*migawari*, shedding) + fish. A self-shedding fish.'
  },
  'ヘイラッシャ': {
japanese: 'ヘイラッシャ',
    romaji: 'heiratsusha',
    pronunciation: 'he-i-ra-tsu-sha',
    meaning: 'Big Catfish Pokémon',
    explanation: 'From 平 (*hei*, flat/big) + fish. A catfish-like boss.'
  },
  'シャリタツ': {
japanese: 'シャリタツ',
    romaji: 'sharitatsu',
    pronunciation: 'sha-ri-ta-tsu',
    meaning: 'Mimicry Pokémon',
    explanation: 'From シャリ (*shari*, sushi rice) + 竜 (*tatsu*, dragon). A sushi-dragon.'
  },
  'コノヨザル': {
japanese: 'コノヨザル',
    romaji: 'konoyozaru',
    pronunciation: 'ko-no-yo-za-ru',
    meaning: 'Rage Monkey Pokémon',
    explanation: 'この世 (*kono yo*, this world) + 猿 (*zaru*, monkey). A beyond-death ape.'
  },
  'ドオー': {
japanese: 'ドオー',
    romaji: 'doo-',
    pronunciation: 'do-o-',
    meaning: 'Spiny Fish Pokémon',
    explanation: 'From “mud” + exclamation. A big muddy wooper evo.'
  },
  'リキキリン': {
japanese: 'リキキリン',
    romaji: 'rikikirin',
    pronunciation: 'ri-ki-ki-ri-n',
    meaning: 'Long Neck Pokémon',
    explanation: '力 (*riki*, power) + キリン (*kirin*, giraffe). Palindrome evolution.'
  },
  'ノココッチ': {
japanese: 'ノココッチ',
    romaji: 'nokokotsuchi',
    pronunciation: 'no-ko-ko-tsu-chi',
    meaning: 'Land Snake Pokémon',
    explanation: 'From ノコッチ (*Nokocchi*, Dunsparce) + doubling. A longer Dunsparce.'
  },
  'ドドゲザン': {
japanese: 'ドドゲザン',
    romaji: 'dodogezan',
    pronunciation: 'do-do-ge-za-n',
    meaning: 'Big Blade Pokémon',
    explanation: '土下座 (*dogeza*, kneeling in submission) + 斬 (*zan*, slash). A ruthless samurai king.'
  },
  'イダイナキバ': {
japanese: 'イダイナキバ',
    romaji: 'idainakiba',
    pronunciation: 'i-da-i-na-ki-ba',
    meaning: 'Paradox Pokémon',
    explanation: '偉大 (*idai*, great) + 牙 (*kiba*, tusk). Paradox Donphan.'
  },
  'サケブシッポ': {
japanese: 'サケブシッポ',
    romaji: 'sakebushitsupo',
    pronunciation: 'sa-ke-bu-shi-tsu-po',
    meaning: 'Paradox Pokémon',
    explanation: '叫ぶ (*sakebu*, to scream) + tail. Paradox Jigglypuff.'
  },
  'アラブルタケ': {
japanese: 'アラブルタケ',
    romaji: 'araburutake',
    pronunciation: 'a-ra-bu-ru-ta-ke',
    meaning: 'Paradox Pokémon',
    explanation: '荒ぶる (*araburu*, wild) + mushroom. Paradox Amoonguss.'
  },
  'ハバタクカミ': {
japanese: 'ハバタクカミ',
    romaji: 'habatakukami',
    pronunciation: 'ha-ba-ta-ku-ka-mi',
    meaning: 'Paradox Pokémon',
    explanation: '羽ばたく (*habataku*, flutter) + 神 (*kami*, god). Paradox Misdreavus.'
  },
  'チヲハウハネ': {
japanese: 'チヲハウハネ',
    romaji: 'chiwohauhane',
    pronunciation: 'chi-wo-ha-u-ha-ne',
    meaning: 'Paradox Pokémon',
    explanation: '血 (*chi*, blood) + 羽 (*hane*, wing). Paradox Volcarona.'
  },
  'スナノケガワ': {
japanese: 'スナノケガワ',
    romaji: 'sunanokegawa',
    pronunciation: 'su-na-no-ke-ga-wa',
    meaning: 'Paradox Pokémon',
    explanation: '砂 (*suna*, sand) + 毛皮 (*kegawa*, fur). Paradox Magneton.'
  },
  'テツノワダチ': {
japanese: 'テツノワダチ',
    romaji: 'tetsunowadachi',
    pronunciation: 'te-tsu-no-wa-da-chi',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + 輪立ち (*wadachi*, wheel track). Paradox Donphan.'
  },
  'テツノツツミ': {
japanese: 'テツノツツミ',
    romaji: 'tetsunotsutsumi',
    pronunciation: 'te-tsu-no-tsu-tsu-mi',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + 包み (*tsutsumi*, bundle). Paradox Delibird.'
  },
  'テツノカイナ': {
japanese: 'テツノカイナ',
    romaji: 'tetsunokaina',
    pronunciation: 'te-tsu-no-ka-i-na',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + arm. Paradox Hariyama.'
  },
  'テツノコウベ': {
japanese: 'テツノコウベ',
    romaji: 'tetsunokoube',
    pronunciation: 'te-tsu-no-ko-u-be',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + 頸 (*kōbe*, neck/head). Paradox Hydreigon.'
  },
  'テツノドクガ': {
japanese: 'テツノドクガ',
    romaji: 'tetsunodokuga',
    pronunciation: 'te-tsu-no-do-ku-ga',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + 毒蛾 (*dokuga*, poisonous moth). Paradox Volcarona.'
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
    meaning: 'Ice Fin Pokémon',
    explanation: 'From “severe” + bite. A chilly dragon.'
  },
  'セゴール': {
japanese: 'セゴール',
    romaji: 'sego-ru',
    pronunciation: 'se-go--ru',
    meaning: 'Ice Fin Pokémon',
    explanation: 'From “ice” + goal. Mid-stage icy dragon.'
  },
  'セグレイブ': {
japanese: 'セグレイブ',
    romaji: 'segureibu',
    pronunciation: 'se-gu-re-i-bu',
    meaning: 'Ice Dragon Pokémon',
    explanation: 'From “glacier” + brave. A kaiju-like dragon.'
  },
  'コレクレー': {
japanese: 'コレクレー',
    romaji: 'korekure-',
    pronunciation: 'ko-re-ku-re-',
    meaning: 'Coin Chest Pokémon',
    explanation: 'From “collect” + くれ (*kure*, please give). A coin ghost.'
  },
  'サーフゴー': {
japanese: 'サーフゴー',
    romaji: 'sa-fugo-',
    pronunciation: 'sa--fu-go-',
    meaning: 'Coin Entity Pokémon',
    explanation: 'From “surfing” + gold. A golden surfer.'
  },
  'チオンジェン': {
japanese: 'チオンジェン',
    romaji: 'chionjien',
    pronunciation: 'chi-o-nji-e-n',
    meaning: 'Ruinous Pokémon',
    explanation: 'Based on Chinese 苦諦 (woe) + 蝉 (cicada). A ruinous snail.'
  },
  'パオジアン': {
japanese: 'パオジアン',
    romaji: 'paojian',
    pronunciation: 'pa-o-ji-a-n',
    meaning: 'Ruinous Pokémon',
    explanation: 'From 豹 (*pao*, leopard) + 剣 (*jian*, sword). A ruinous leopard.'
  },
  'ディンルー': {
japanese: 'ディンルー',
    romaji: 'deinru-',
    pronunciation: 'de-i-nru-',
    meaning: 'Ruinous Pokémon',
    explanation: 'From 鼎 (*ding*, ritual cauldron) + deer. A ruinous moose.'
  },
  'イーユイ': {
japanese: 'イーユイ',
    romaji: 'i-yui',
    pronunciation: 'i--yu-i',
    meaning: 'Ruinous Pokémon',
    explanation: 'From 魚 (*yu*, fish) + 火 (*yi*, fire). A ruinous goldfish.'
  },
  'トドロクツキ': {
japanese: 'トドロクツキ',
    romaji: 'todorokutsuki',
    pronunciation: 'to-do-ro-ku-tsu-ki',
    meaning: 'Paradox Pokémon',
    explanation: '轟く (*todoroku*, roar) + 月 (*tsuki*, moon). Paradox Salamence.'
  },
  'テツノブジン': {
japanese: 'テツノブジン',
    romaji: 'tetsunobujin',
    pronunciation: 'te-tsu-no-bu-ji-n',
    meaning: 'Paradox Pokémon',
    explanation: '鉄 (*tetsu*, iron) + 武人 (*bujin*, warrior). Paradox Gardevoir/Gallade.'
  },
  'コライドン': {
japanese: 'コライドン',
    romaji: 'koraidon',
    pronunciation: 'ko-ra-i-do-n',
    meaning: 'Paradox Pokémon',
    explanation: '古来 (*korai*, ancient) + ride + -don. Legendary past dragon.'
  },
  'ミライドン': {
japanese: 'ミライドン',
    romaji: 'miraidon',
    pronunciation: 'mi-ra-i-do-n',
    meaning: 'Paradox Pokémon',
    explanation: '未来 (*mirai*, future) + ride + -don. Legendary future dragon.'
  },
  'ウネルミナモ': {
japanese: 'ウネルミナモ',
    romaji: 'uneruminamo',
    pronunciation: 'u-ne-ru-mi-na-mo',
    meaning: 'Paradox Pokémon',
    explanation: '畝る (*uneru*, ripple) + 水面 (*minamo*, water surface). Paradox Suicune.'
  },
  'ニドラン♀': {
japanese: 'ニドラン♀',
    romaji: 'nidoran♀',
    pronunciation: 'ni-do-ra-n♀',
    meaning: 'Nidoran Female',
    explanation: 'Possibly from "needle" (nido) + "random" or "run."'
  },
  'ニドリーナ': {
japanese: 'ニドリーナ',
    romaji: 'nidori-na',
    pronunciation: 'ni-do-ri--na',
    meaning: 'Nidorina',
    explanation: 'Needle + feminine suffix.'
  },
  'ニドクイン': {
japanese: 'ニドクイン',
    romaji: 'nidokuin',
    pronunciation: 'ni-do-ku-i-n',
    meaning: 'Nidoqueen',
    explanation: 'Needle + "queen."'
  },
  'ニドラン♂': {
japanese: 'ニドラン♂',
    romaji: 'nidoran♂',
    pronunciation: 'ni-do-ra-n♂',
    meaning: 'Nidoran Male',
    explanation: 'Possibly from "needle" (nido) + "random" or "run."'
  },
  'ニドリーノ': {
japanese: 'ニドリーノ',
    romaji: 'nidori-no',
    pronunciation: 'ni-do-ri--no',
    meaning: 'Nidorino',
    explanation: 'Needle + masculine suffix.'
  },
  'ニドキング': {
japanese: 'ニドキング',
    romaji: 'nidokingu',
    pronunciation: 'ni-do-ki-ngu',
    meaning: 'Nidoking',
    explanation: 'Needle + "king."'
  },
  'ピッピ': {
japanese: 'ピッピ',
    romaji: 'pitsupi',
    pronunciation: 'pi-tsu-pi',
    meaning: 'Fairy',
    explanation: 'Onomatopoeic/cute sound for a small, soft creature.'
  },
  'ピクシー': {
japanese: 'ピクシー',
    romaji: 'pikushi-',
    pronunciation: 'pi-ku-shi-',
    meaning: 'Pixie',
    explanation: 'From English "pixie."'
  },
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
  6: 'リザードン',    // Lizard Dragon
  7: 'ゼニガメ',    // Coin Turtle
  8: 'カメール',    // Turtle
  9: 'カメックス',    // Turtle Max
  10: 'キャタピー',    // Caterpillar
  11: 'トランセル',    // Transcell
  12: 'バタフリー',    // Butterfly
  13: 'ビードル',    // Bee Needle
  14: 'コクーン',    // Cocoon
  15: 'スピアー',    // Spear
  16: 'ポッポ',    // Pigeon Sound
  17: 'ピジョン',    // Pigeon
  18: 'ピジョット',    // Pigeon
  19: 'コラッタ',    // Child Rat
  20: 'ラッタ',    // Rat
  21: 'オニスズメ',    // Demon Sparrow
  22: 'オニドリル',    // Demon Drill
  23: 'アーボ',    // Boa (reversed)
  24: 'アーボック',    // Cobra
  25: 'ピカチュウ',    // Spark Mouse
  26: 'ライチュウ',    // Thunder Mouse
  27: 'サンド',    // Sand
  28: 'サンドパン',    // Sand Pan
  29: 'ニドラン♀',    // Needle Poison (Female)
  30: 'ニドリーナ',    // Needle Queen
  31: 'ニドクイン',    // Needle Queen
  32: 'ニドラン♂',    // Needle Poison (Male)
  33: 'ニドリーノ',    // Needle King
  34: 'ニドキング',    // Needle King
  35: 'ピッピ',    // Clefairy
  36: 'ピクシー',    // Pixie
  37: 'ロコン',    // Little Fox
  38: 'キュウコン',    // Nine Tails
  39: 'プリン',    // Pudding
  40: 'プクリン',    // Puffy Pudding
  41: 'ズバット',    // Bat
  42: 'ゴルバット',    // Big Bat
  43: 'ナゾノクサ',    // Mystery Grass
  44: 'クサイハナ',    // Stinky Flower
  45: 'ラフレシア',    // Rafflesia
  46: 'パラス',    // Parasite
  47: 'パラセクト',    // Parasite
  48: 'コンパン',    // Compound
  49: 'モルフォン',    // Morpho
  50: 'ディグダ',    // Digger
  51: 'ダグトリオ',    // Dig Trio
  52: 'ニャース',    // Meow
  53: 'ペルシアン',    // Persian
  54: 'コダック',    // Child Duck
  55: 'ゴルダック',    // Gold Duck
  56: 'マンキー',    // Monkey
  57: 'オコリザル',    // Angry Monkey
  58: 'ガーディ',    // Guard Dog
  59: 'ウインディ',    // Windy
  60: 'ニョロモ',    // Tadpole
  61: 'ニョロゾ',    // Tadpole
  62: 'ニョロボン',    // Tadpole Bon
  63: 'ケーシィ',    // Casey
  64: 'ユンゲラー',    // Uri Geller
  65: 'フーディン',    // Houdini
  66: 'ワンリキー',    // One Power
  67: 'ゴーリキー',    // Strong Power
  68: 'カイリキー',    // Monster Power
  69: 'マダツボミ',    // Bud
  70: 'ウツドン',    // Pitcher Plant
  71: 'ウツボット',    // Pitcher Plant
  72: 'メノクラゲ',    // Eye Jellyfish
  73: 'ドククラゲ',    // Poison Jellyfish
  74: 'イシツブテ',    // Rock Pebble
  75: 'ゴローン',    // Boulder
  76: 'ゴローニャ',    // Big Boulder
  77: 'ポニータ',    // Little Pony
  78: 'ギャロップ',    // Gallop
  79: 'ヤドン',    // Slow
  80: 'ヤドラン',    // Slow King
  81: 'コイル',    // Coil
  82: 'レアコイル',    // Rare Coil
  83: 'カモネギ',    // Duck with Leek
  84: 'ドードー',    // Dodo
  85: 'ドードリオ',    // Dodo Trio
  86: 'パウワウ',    // Seal Sound
  87: 'ジュゴン',    // Dugong
  88: 'ベトベター',    // Sticky
  89: 'ベトベトン',    // Sticky Ton
  90: 'シェルダー',    // Shellfish
  91: 'パルシェン',    // Pearl Shell
  92: 'ゴース',    // Ghost
  93: 'ゴースト',    // Ghost
  94: 'ゲンガー',    // Doppelganger
  95: 'イワーク',    // Rock Snake
  96: 'スリープ',    // Sleep
  97: 'スリーパー',    // Sleeper
  98: 'クラブ',    // Crab
  99: 'キングラー',    // King Crab
  100: 'ビリリダマ',    // Electric Ball
  101: 'マルマイン',    // Round Mine
  102: 'タマタマ',    // Egg Egg
  103: 'ナッシー',    // Coconut Tree
  104: 'カラカラ',    // Rattle Rattle
  105: 'ガラガラ',    // Rattle Rattle
  106: 'サワムラー',    // Sawamura (kickboxer)
  107: 'エビワラー',    // Ebihara (boxer)
  108: 'ベロリンガ',    // Tongue Licker
  109: 'ドガース',    // Poison Gas
  110: 'マタドガス',    // More Poison Gas
  111: 'サイホーン',    // Rhino Horn
  112: 'サイドン',    // Rhino Don
  113: 'ラッキー',    // Lucky
  114: 'モンジャラ',    // Tangle
  115: 'ガルーラ',    // Garuru (kangaroo)
  116: 'タッツー',    // Seahorse
  117: 'シードラ',    // Sea Dragon
  118: 'トサキント',    // Tosa Goldfish
  119: 'アズマオウ',    // Eastern King
  120: 'ヒトデマン',    // Starfish Man
  121: 'スターミー',    // Star Me
  122: 'バリヤード',    // Barrier
  123: 'ストライク',    // Strike
  124: 'ルージュラ',    // Rouge
  125: 'エレブー',    // Electric Boo
  126: 'ブーバー',    // Boober
  127: 'カイロス',    // Kairos (beetle)
  128: 'ケンタロス',    // Centauros
  129: 'コイキング',    // Carp King
  130: 'ギャラドス',    // Gyarados
  131: 'ラプラス',    // Lapras
  132: 'メタモン',    // Metamon
  133: 'イーブイ',    // Eevee
  134: 'シャワーズ',    // Showers
  135: 'サンダース',    // Thunders
  136: 'ブースター',    // Booster
  137: 'ポリゴン',    // Polygon
  138: 'オムナイト',    // Ammonite
  139: 'オムスター',    // Ammonite Star
  140: 'カブト',    // Kabuto (horseshoe crab)
  141: 'カブトプス',    // Kabutops
  142: 'プテラ',    // Pteranodon
  143: 'カビゴン',    // Mold Pokémon
  144: 'フリーザー',    // Freezer
  145: 'サンダー',    // Thunder
  146: 'ファイヤー',    // Fire
  147: 'ミニリュウ',    // Mini Dragon
  148: 'ハクリュー',    // White Dragon
  149: 'カイリュー',    // Sea Dragon
  150: 'ミュウツー',    // Mewtwo
  151: 'ミュウ',    // Mew
  152: 'チコリータ',    // Chikorita
  153: 'ベイリーフ',    // Bay Leaf
  154: 'メガニウム',    // Meganium
  155: 'ヒノアラシ',    // Fire Beast
  156: 'マグマラシ',    // Magma Beast
  157: 'バクフーン',    // Typhoon
  158: 'ワニノコ',    // Little Crocodile
  159: 'アリゲイツ',    // Alligator
  160: 'オーダイル',    // Ordeal
  161: 'オタチ',    // Sentinel
  162: 'オオタチ',    // Big Sentinel
  163: 'ホーホー',    // Hoot Hoot
  164: 'ヨルノズク',    // Night Owl
  165: 'レディバ',    // Ladybird
  166: 'レディアン',    // Ladybird
  167: 'イトマル',    // Thread Ball
  168: 'アリアドス',    // Ariados
  169: 'クロバット',    // Crobat
  170: 'チョンチー',    // Lantern
  171: 'ランターン',    // Lantern
  172: 'ピチュー',    // Pichu
  173: 'ピィ',    // Pii
  174: 'ププリン',    // Pupurin
  175: 'トゲピー',    // Togepi
  176: 'トゲチック',    // Togetic
  177: 'ネイティ',    // Native
  178: 'ネイティオ',    // Natio
  179: 'メリープ',    // Mareep
  180: 'モココ',    // Mokoko
  181: 'デンリュウ',    // Electric Dragon
  182: 'キレイハナ',    // Beautiful Flower
  183: 'マリル',    // Marill
  184: 'マリルリ',    // Marill
  185: 'ウソッキー',    // Fake Tree
  186: 'ニョロトノ',    // Politoed
  187: 'ハネッコ',    // Hoppip
  188: 'ポポッコ',    // Skiploom
  189: 'ワタッコ',    // Jumpluff
  190: 'エイパム',    // Aipom
  191: 'ヒマナッツ',    // Sunflower Nuts
  192: 'キマワリ',    // Sunflower
  193: 'ヤンヤンマ',    // Yanyanma
  194: 'ウパー',    // Wooper
  195: 'ヌオー',    // Quagsire
  196: 'エーフィ',    // Espeon
  197: 'ブラッキー',    // Blacky
  198: 'ヤミカラス',    // Dark Crow
  199: 'ヤドキング',    // Slowking
  200: 'ムウマ',    // Misdreavus
  201: 'アンノーン',    // Unknown
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
  233: 'ポリゴン2',    // Porygon2
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
  // Add more Pokemon as needed...
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
