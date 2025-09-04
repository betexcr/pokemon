"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function DebugSpritesPage() {
  const [spriteData, setSpriteData] = useState<{ valid: string; invalid: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSpriteLoading = async () => {
      try {
        // Test with Geodude (ID 74)
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/74');
        const data = await response.json();
        setSpriteData(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    testSpriteLoading();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!spriteData) return <div>No data</div>;

  const sprites = spriteData.sprites;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sprite Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Pokemon: {spriteData.name}</h2>
        <p>ID: {spriteData.id}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Front Sprites</h3>
          <div className="space-y-2">
            <div>
              <p>front_default:</p>
              <p className="text-sm text-gray-600 break-all">{sprites.front_default}</p>
              {sprites.front_default && (
                <div className="w-24 h-24 border border-gray-300">
                  <Image
                    src={sprites.front_default}
                    alt="front_default"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('front_default failed:', e.currentTarget.src)}
                    onLoad={() => console.log('front_default loaded')}
                  />
                </div>
              )}
            </div>
            
            <div>
              <p>front_shiny:</p>
              <p className="text-sm text-gray-600 break-all">{sprites.front_shiny}</p>
              {sprites.front_shiny && (
                <div className="w-24 h-24 border border-gray-300">
                  <Image
                    src={sprites.front_shiny}
                    alt="front_shiny"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('front_shiny failed:', e.currentTarget.src)}
                    onLoad={() => console.log('front_shiny loaded')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Back Sprites</h3>
          <div className="space-y-2">
            <div>
              <p>back_default:</p>
              <p className="text-sm text-gray-600 break-all">{sprites.back_default}</p>
              {sprites.back_default && (
                <div className="w-24 h-24 border border-gray-300">
                  <Image
                    src={sprites.back_default}
                    alt="back_default"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('back_default failed:', e.currentTarget.src)}
                    onLoad={() => console.log('back_default loaded')}
                  />
                </div>
              )}
            </div>
            
            <div>
              <p>back_shiny:</p>
              <p className="text-sm text-gray-600 break-all">{sprites.back_shiny}</p>
              {sprites.back_shiny && (
                <div className="w-24 h-24 border border-gray-300">
                  <Image
                    src={sprites.back_shiny}
                    alt="back_shiny"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    onError={(e) => console.error('back_shiny failed:', e.currentTarget.src)}
                    onLoad={() => console.log('back_shiny loaded')}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Raw Sprite Data</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(sprites, null, 2)}
        </pre>
      </div>
    </div>
  );
}
