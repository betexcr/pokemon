#!/usr/bin/env python3
import re
import json

# Load the explanations
with open('pokemon_explanations.json', 'r', encoding='utf-8') as f:
    explanations = json.load(f)

print(f'Loaded {len(explanations)} explanations')

# Read the current japaneseNames.ts file
with open('src/lib/japaneseNames.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all existing Pokemon entries in the file
pokemon_pattern = r"  '([^']+)':\s*\{([^}]+)\},"
matches = re.findall(pokemon_pattern, content, re.DOTALL)

print(f'Found {len(matches)} existing Pokemon entries in japaneseNames.ts')

# Create updated entries
updated_entries = []
processed_names = set()

for japanese_name, entry_content in matches:
    # Skip duplicates (keep only the first occurrence)
    if japanese_name in processed_names:
        continue
    processed_names.add(japanese_name)
    
    # Check if we have an explanation for this Pokemon
    if japanese_name in explanations:
        explanation = explanations[japanese_name]
        
        # Check if explanation already exists in the entry
        if 'explanation:' not in entry_content:
            # Add explanation to the entry
            # Remove trailing whitespace and add explanation before the closing brace
            entry_content = entry_content.strip()
            if entry_content.endswith(','):
                entry_content = entry_content[:-1]  # Remove trailing comma
            
            updated_entry = f"  '{japanese_name}': {{\n{entry_content},\n    explanation: '{explanation}'\n  }},"
        else:
            # Update existing explanation
            updated_entry = re.sub(
                r"explanation: '[^']*'",
                f"explanation: '{explanation}'",
                f"  '{japanese_name}': {{\n{entry_content}\n  }},"
            )
    else:
        # No explanation available, keep as is
        updated_entry = f"  '{japanese_name}': {{\n{entry_content}\n  }},"
    
    updated_entries.append(updated_entry)

print(f'Created {len(updated_entries)} updated entries')

# Create the new file content
header = '''// Japanese Pokemon names with romaji, pronunciation, and meaning
export interface JapaneseNameInfo {
  japanese: string
  romaji: string
  pronunciation: string
  meaning: string
  explanation?: string
}

// Pokemon-specific Japanese names with romaji, pronunciation, meanings, and explanations
const japaneseNames: Record<string, JapaneseNameInfo> = {
'''

footer = '''
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
'''

new_content = header + '\n'.join(updated_entries) + footer

# Write the updated file
with open('src/lib/japaneseNames_updated.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Created updated japaneseNames_updated.ts with {len(updated_entries)} entries')
