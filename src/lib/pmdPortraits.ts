/**
 * Utility functions for PMD Collab portrait management
 */

export interface PortraitExpression {
  name: string;
  filename: string;
  displayName: string;
}

/**
 * Maps portrait filenames to display names
 */
const portraitDisplayNames: Record<string, string> = {
  'Normal.png': 'Normal',
  'Happy.png': 'Happy',
  'Angry.png': 'Angry',
  'Sad.png': 'Sad',
  'Crying.png': 'Crying',
  'Surprised.png': 'Surprised',
  'Determined.png': 'Determined',
  'Joyous.png': 'Joyous',
  'Inspired.png': 'Inspired',
  'Dizzy.png': 'Dizzy',
  'Pain.png': 'Pain',
  'Shouting.png': 'Shouting',
  'Sigh.png': 'Sigh',
  'Stunned.png': 'Stunned',
  'Teary-Eyed.png': 'Teary-Eyed',
  'Worried.png': 'Worried',
  'Special0.png': 'Special'
};

/**
 * Cache for available portraits to avoid repeated API calls
 */
const portraitCache = new Map<string, PortraitExpression[]>();

/**
 * Fetches available portrait expressions for a Pokemon from PMD Collab
 */
export async function getAvailablePortraits(pokemonId: number): Promise<PortraitExpression[]> {
  const dex4 = String(pokemonId).padStart(4, '0');
  const cacheKey = dex4;
  
  // Check cache first
  if (portraitCache.has(cacheKey)) {
    return portraitCache.get(cacheKey)!;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/PMDCollab/SpriteCollab/contents/portrait/${dex4}`);
    
    if (!response.ok) {
      // If Pokemon doesn't have portraits, return default Normal portrait
      const defaultPortrait: PortraitExpression[] = [{
        name: 'normal',
        filename: 'Normal.png',
        displayName: 'Normal'
      }];
      portraitCache.set(cacheKey, defaultPortrait);
      return defaultPortrait;
    }

    const files = await response.json();
    const portraits: PortraitExpression[] = files
      .filter((file: any) => file.name.endsWith('.png'))
      .map((file: any) => ({
        name: file.name.replace('.png', '').toLowerCase(),
        filename: file.name,
        displayName: portraitDisplayNames[file.name] || file.name.replace('.png', '')
      }))
      .sort((a: any, b: any) => {
        // Sort Normal first, then alphabetically
        if (a.filename === 'Normal.png') return -1;
        if (b.filename === 'Normal.png') return 1;
        return a.displayName.localeCompare(b.displayName);
      });

    // Cache the result
    portraitCache.set(cacheKey, portraits);
    return portraits;
  } catch (error) {
    console.error(`Failed to fetch portraits for Pokemon ${pokemonId}:`, error);
    // Return default Normal portrait on error
    const defaultPortrait: PortraitExpression[] = [{
      name: 'normal',
      filename: 'Normal.png',
      displayName: 'Normal'
    }];
    portraitCache.set(cacheKey, defaultPortrait);
    return defaultPortrait;
  }
}

/**
 * Gets the PMD Collab portrait URL for a specific expression
 */
export function getPortraitURL(pokemonId: number, expression: string = 'Normal.png'): string {
  const dex4 = String(pokemonId).padStart(4, '0');
  return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${dex4}/${expression}`;
}

/**
 * Clears the portrait cache (useful for development)
 */
export function clearPortraitCache(): void {
  portraitCache.clear();
}
