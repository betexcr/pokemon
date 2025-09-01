import Link from "next/link";
import { getPokemonImageUrl } from "@/lib/api";
import TypeBadge from "@/components/TypeBadge";

type Node = { id:number; name:string; types:string[]; condition?:string };

export default function EvolutionSection({ chain }: { chain: Node[] }) {
  if (!chain.length) return null;
  return (
    <section id="evolution" className="mx-auto max-w-5xl px-4 py-8 space-y-4">
      <h3 className="text-lg font-semibold">Evolution</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {chain.map((n, i) => (
          <div key={`${n.id}-${i}`} className="flex items-center gap-4">
            <Link href={`/pokemon/${n.id}`}
              className="group rounded-2xl border border-border bg-surface p-3 hover:shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getPokemonImageUrl(n.id)} alt={n.name}
                   className="mx-auto h-32 w-32 md:h-40 md:w-40 object-contain" />
              <div className="mt-2 text-center">
                <div className="capitalize font-semibold">{n.name}</div>
                <div className="mt-2 flex justify-center gap-2">{n.types.map((t, index)=><TypeBadge key={`${t}-${index}`} type={t}/>)}</div>
              </div>
            </Link>
            {i < chain.length - 1 && (
              <div className="flex items-center gap-2 text-xs text-muted">
                <span className="hidden sm:inline">{chain[i+1].condition ?? "—"}</span>
                <span className="text-2xl">→</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
