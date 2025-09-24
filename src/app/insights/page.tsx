import Link from 'next/link';
import AppHeader from '@/components/AppHeader';

export default function InsightsHub() {
  const cards = [
    { href: '/evolutions', title: 'Evolution Journeys', desc: 'Interactive popup-book evolution trees with filters and a11y.' },
    { href: '/type-matchups', title: 'Type Matchup Explorer', desc: 'Wheel + matrix to explore strengths, weaknesses, immunities.' },
    { href: '/usage', title: 'Competitive Meta Dashboard', desc: 'Usage trends, win rates, podium and move heatmap.' },
    { href: '/top50', title: 'Top 50 Popup Book', desc: 'Flip through the community\'s favorites with animated spreads.' },
    { href: '/trends', title: 'Popularity Trends Explorer', desc: 'See Pokémon popularity rise and fall across years/regions.' },
  ];
  return (
    <>
      <AppHeader title="Insights" backLink="/" backLabel="Back to PokéDex" showToolbar={true} />
      <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">Insights</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">A unified module for advanced, fun analytics across your Pokédex.</p>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="block">
            <div className="bg-gradient-to-br from-blue-500/20 via-fuchsia-500/20 to-rose-500/20 p-[1px] rounded-lg">
              <div className="rounded-md border p-4 bg-white/60 dark:bg-gray-900/40 backdrop-blur-md shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-lg font-semibold">{c.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{c.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
    </>
  );
}
