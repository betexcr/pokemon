import Link from "next/link";
import TypeBadge from "@/components/TypeBadge";
import Image from "next/image";
import { formatPokemonName } from "@/lib/utils";
import { EvolutionSkeleton } from "@/components/skeletons/PokemonDetailsSkeleton";

type Node = { id:number; name:string; types:string[]; condition?:string };

export default function EvolutionSection({ chain, selectedSprite = 'default', loading = false }: { chain: Node[]; selectedSprite?: 'default' | 'shiny'; loading?: boolean }) {
  if (loading) {
    return (
      <section id="evolution" className="mx-auto w-full px-4 py-4 space-y-4 text-center">
        <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 overflow-x-auto pb-4 -mx-4 px-4">
          {[1, 2, 3].map((i) => (
            <EvolutionSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }
  
  if (!chain || !chain.length) return null;
  return (
    <section id="evolution" className="mx-auto w-full px-4 py-4 space-y-4 text-center">
      <div className="flex flex-wrap sm:flex-nowrap justify-center gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {chain.map((n, i) => {
          const primaryType = n.types[0] || 'normal';
          const secondaryType = n.types[1] || null;
          const imageUrl = selectedSprite === 'shiny' 
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${n.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n.id}.png`;
          
          return (
            <div key={`${n.id}-${i}`} className="flex items-center gap-4">
              <Link href={`/pokemon/${n.id}`} className="group block">
                <div 
                  className="relative rounded-xl bg-surface overflow-hidden border border-border hover:shadow-card transition-all duration-200"
                  style={{ 
                    background: secondaryType
                      ? `linear-gradient(180deg,
                            color-mix(in oklab, var(--type-${primaryType}) 16%, transparent) 0%,
                            color-mix(in oklab, var(--type-${secondaryType}) 16%, transparent) 60%)`
                      : `linear-gradient(180deg, color-mix(in oklab, var(--type-${primaryType}) 14%, transparent) 0%, transparent 60%)`
                  }}
                >
                  {/* Type accent bar */}
                  <div 
                    className="h-1.5 w-full" 
                    style={secondaryType
                      ? { backgroundImage: `linear-gradient(90deg, var(--type-${primaryType}) 0%, var(--type-${secondaryType}) 100%)` }
                      : { backgroundColor: `var(--type-${primaryType})` }} 
                  />
                  
                  <div className="flex justify-center items-center p-3">
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center flex-shrink-0">
                      <Image
                        src={imageUrl}
                        alt={formatPokemonName(n.name)}
                        width={192}
                        height={192}
                        className="object-contain w-full h-full"
                        sizes="(max-width: 640px) 128px, (max-width: 768px) 160px, 192px"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n.id}.png`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 text-center">
                    <div className="font-semibold text-sm sm:text-base">{formatPokemonName(n.name)}</div>
                    <div className="mt-1 flex justify-center gap-1">
                      {n.types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t} className="text-xs"/>)}
                    </div>
                  </div>
                </div>
              </Link>
              {i < chain.length - 1 && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted flex-shrink-0">
                  <span className="hidden sm:inline text-xs">{chain[i+1].condition ?? "—"}</span>
                  <span className="text-lg">→</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
