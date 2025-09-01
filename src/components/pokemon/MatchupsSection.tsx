import TypeBadge from "@/components/TypeBadge";

type Group = { title: string; types: string[]; tone: "danger"|"ok"|"immune" };

export default function MatchupsSection({ groups }: { groups: Group[] }) {
  // groups example:
  // [{ title: "Weak to (2×)", types:["fire","flying",...], tone:"danger" }, ...]
  const toneBg = (t:Group["tone"]) =>
    t==="danger" ? "bg-red-500/10 border-red-500/30"
    : t==="ok" ? "bg-green-500/10 border-green-500/30"
    : "bg-gray-500/10 border-gray-500/30";

  return (
    <section id="matchups" className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <h3 className="text-lg font-semibold">Type Matchups</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g)=>(
          <div key={g.title} className={`rounded-2xl border p-4 ${toneBg(g.tone)}`}>
            <div className="font-semibold mb-2">{g.title}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.types.length ? g.types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t}/>) : <span className="text-sm text-muted">None</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
