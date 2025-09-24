import type { Metadata } from 'next';
import BattleLiteApp from '@/components/battle/BattleLiteApp';

export const metadata: Metadata = {
  title: 'Battle Simulator Lite',
  description: 'A lightweight 1v1 Pokémon battle toy to learn matchups with fun animations.',
};

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-fuchsia-500 to-rose-500 dark:from-blue-400 dark:via-fuchsia-400 dark:to-rose-400">Battle Simulator Lite</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Pick two Pokémon and try a move. Type effectiveness applies; animations respect reduced motion.</p>
      </header>
      <BattleLiteApp />
    </main>
  );
}
