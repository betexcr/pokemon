import type { PokemonMeta } from '@/lib/meta/types';
import Image from 'next/image';
import UsagePagination from './UsagePagination';
import SortableHeader from './UsageTableHeaderClient';
import ClickableRow from './UsageTableRowClient';

// Server component renders initial table markup. Pagination controls are client-enhanced.
export default function UsageTable({ rows, page = 1, pageSize = 10, sort = 'usage' as 'usage' | 'winrate' }: { rows: PokemonMeta[]; page?: number; pageSize?: number; sort?: 'usage' | 'winrate' }) {
  const sorted = [...rows].sort((a, b) => (sort === 'usage' ? b.usage - a.usage : b.winrate - a.winrate));
  const start = (page - 1) * pageSize;
  const slice = sorted.slice(start, start + pageSize);

  return (
    <div className="glass overflow-hidden">
      <table className="w-full text-sm" role="table" aria-label="Pokémon usage stats">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Pokémon</th>
            <SortableHeader label="Usage %" param="usage" />
            <SortableHeader label="Winrate %" param="winrate" />
            <th className="p-2 text-left">Top Item</th>
            <th className="p-2 text-left">Top Teammate</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((p, idx) => (
            <ClickableRow key={p.id} id={p.id}>
              <td className="p-2">{start + idx + 1}</td>
              <td className="p-2 font-medium">
                <div className="flex items-center gap-2">
                  <Image
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                    alt={p.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full bg-white/70 ring-1 ring-gray-200 object-contain"
                  />
                  <span>{p.name}</span>
                </div>
              </td>
              <td className="p-2 text-right">{p.usage.toFixed(1)}</td>
              <td className="p-2 text-right">{p.winrate.toFixed(1)}</td>
              <td className="p-2">{p.topItem}</td>
              <td className="p-2">{p.topTeammate}</td>
            </ClickableRow>
          ))}
        </tbody>
      </table>
      <UsagePagination total={rows.length} pageSize={pageSize} page={page} sort={sort} />
    </div>
  );
}

// Interactivity moved to dedicated client components
