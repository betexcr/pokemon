import Link from "next/link";
import TypeBadge from "@/components/TypeBadge";
import Image from "next/image";

type Node = { id:number; name:string; types:string[]; condition?:string };

export default function EvolutionSection({ chain, selectedSprite = 'default' }: { chain: Node[]; selectedSprite?: 'default' | 'shiny' }) {
  if (!chain.length) return null;
  return (
    <section id="evolution" className="mx-auto max-w-5xl px-4 py-4 space-y-4">
      <div className="flex flex-wrap justify-center gap-4">
        {chain.map((n, i) => {
          const primaryType = n.types[0] || 'normal';
          const imageUrl = selectedSprite === 'shiny' 
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${n.id}.png`
            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${n.id}.png`;
          
          return (
            <div key={`${n.id}-${i}`} className="flex items-center gap-4">
              <Link href={`/pokemon/${n.id}`} className="group block">
                <div 
                  className="relative rounded-xl bg-surface overflow-hidden border border-border hover:shadow-card transition-all duration-200"
                  style={{ 
                    background: `linear-gradient(180deg, color-mix(in oklab, var(--type-${primaryType}) 14%, transparent) 0%, transparent 60%)`
                  }}
                >
                  {/* Type accent bar */}
                  <div 
                    className="h-1.5 w-full" 
                    style={{ backgroundColor: `var(--type-${primaryType})` }} 
                  />
                  
                  <div className="flex justify-center items-center p-4">
                    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                      <Image
                        src={imageUrl}
                        alt={n.name}
                        width={256}
                        height={256}
                        className="object-contain w-full h-full"
                        sizes="(max-width: 768px) 192px, 256px"
                        onError={(e) => {
                          e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n.id}.png`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 text-center">
                    <div className="capitalize font-semibold text-lg">{n.name}</div>
                    <div className="mt-2 flex justify-center gap-2">
                      {n.types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t}/>)}
                    </div>
                  </div>
                </div>
              </Link>
              {i < chain.length - 1 && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="hidden sm:inline">{chain[i+1].condition ?? "—"}</span>
                  <span className="text-2xl">→</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
