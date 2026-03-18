"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface SpriteSet {
  front_default: string | null;
  front_shiny: string | null;
  back_default: string | null;
  back_shiny: string | null;
}

export default function DebugSpritesPage() {
  const [sprites, setSprites] = useState<SpriteSet | null>(null);
  const [pokemonName, setPokemonName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testSpriteLoading = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon/74');
        const data = await response.json();
        setPokemonName(data.name);
        setSprites({
          front_default: data.sprites?.front_default ?? null,
          front_shiny: data.sprites?.front_shiny ?? null,
          back_default: data.sprites?.back_default ?? null,
          back_shiny: data.sprites?.back_shiny ?? null,
        });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    testSpriteLoading();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8">Error: {error}</div>;
  if (!sprites) return <div className="p-8">No data</div>;

  const entries: { label: string; url: string | null }[] = [
    { label: 'front_default', url: sprites.front_default },
    { label: 'front_shiny', url: sprites.front_shiny },
    { label: 'back_default', url: sprites.back_default },
    { label: 'back_shiny', url: sprites.back_shiny },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sprite Debug Page</h1>
      <p className="mb-6 text-gray-600">Testing sprite loading for <strong>{pokemonName}</strong> (#74)</p>

      <div className="grid grid-cols-2 gap-6">
        {entries.map(({ label, url }) => (
          <div key={label}>
            <h3 className="text-lg font-semibold mb-1">{label}</h3>
            <p className="text-sm text-gray-500 break-all mb-2">{url ?? 'null'}</p>
            {url && (
              <div className="w-24 h-24 border border-gray-300 rounded">
                <Image
                  src={url}
                  alt={label}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                  onError={(e) => console.error(`${label} failed:`, e.currentTarget.src)}
                />
              </div>
            )}
          </div>
        ))}
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
