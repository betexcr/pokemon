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
    <section id="matchups" className="mx-auto w-full px-4 py-4 space-y-6 text-center">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g)=>(
          <div key={g.title} className={`rounded-2xl p-6 ${toneBg(g.tone)}`}>
            <div className="font-semibold mb-4 text-center">{g.title}</div>
            <div className="flex flex-wrap justify-center gap-3">
              {g.types.length ? g.types.map((t, index) => <TypeBadge key={`${t}-${index}`} type={t}/>) : <span className="text-sm text-muted">None</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
