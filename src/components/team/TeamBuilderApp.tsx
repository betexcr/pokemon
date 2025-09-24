"use client";

import { useEffect, useMemo, useState } from 'react';
import TeamGrid from './TeamGrid';
import TypeRadar from './TypeRadar';
import WeaknessMatrix from './WeaknessMatrix';
import Suggestions from './Suggestions';
import OffenseMatrix from './OffenseMatrix';
import { analyzeTeam, type TeamAnalysis } from '@/lib/team/engine';
import type { SimplePokemon } from '@/lib/battle/sampleData';
import { POKEMON_LIST, SAMPLE_POKEMON } from '@/lib/battle/sampleData';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function TeamBuilderApp({ initialNames = [] as string[] }: { initialNames?: string[] }) {
  const [team, setTeam] = useState<(SimplePokemon | null)[]>(() => {
    const arr: (SimplePokemon | null)[] = Array(6).fill(null);
    initialNames.slice(0, 6).forEach((n, i) => {
      const p = POKEMON_LIST.find((x) => x.name === n);
      if (p) arr[i] = p;
    });
    return arr;
  });
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const cleanTeam = useMemo(() => team.filter(Boolean) as SimplePokemon[], [team]);
  const analysis: TeamAnalysis = useMemo(() => analyzeTeam(cleanTeam), [cleanTeam]);

  useEffect(() => {
    const names = team.filter(Boolean).map((p) => (p as SimplePokemon).name);
    const usp = new URLSearchParams(sp.toString());
    if (names.length) usp.set('team', names.join(','));
    else usp.delete('team');
    router.replace(`${pathname}?${usp.toString()}`, { scroll: false });
    // persist
    try { localStorage.setItem('team-builder:names', JSON.stringify(names)); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team]);

  useEffect(() => {
    // restore if no initial names
    if (initialNames.length) return;
    try {
      const raw = localStorage.getItem('team-builder:names');
      if (raw) {
        const names: string[] = JSON.parse(raw);
        const arr: (SimplePokemon | null)[] = Array(6).fill(null);
        names.slice(0, 6).forEach((n, i) => {
          const p = POKEMON_LIST.find((x) => x.name === n);
          if (p) arr[i] = p;
        });
        setTeam(arr);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportJSON() {
    const json = JSON.stringify(team.filter(Boolean).map((p) => ({ name: p!.name, types: p!.types })), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyShare() {
    const usp = new URLSearchParams(sp.toString());
    const names = team.filter(Boolean).map((p) => (p as SimplePokemon).name);
    if (names.length) usp.set('team', names.join(','));
    const url = `${location.origin}${pathname}?${usp.toString()}`;
    await navigator.clipboard.writeText(url);
    alert('Share link copied to clipboard');
  }

  async function exportCSV() {
    const rows = cleanTeam.map((p) => ({ name: p.name, types: p.types.join('/') }));
    const header = 'Name,Types\n';
    const body = rows.map((r) => `${r.name},${r.types}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportRadarPNG() {
    const svg = document.getElementById('team-radar') as SVGSVGElement | null;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    await new Promise<void>((res) => {
      img.onload = () => res();
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = svg.clientWidth || 360;
    canvas.height = svg.clientHeight || 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const dl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dl;
      a.download = 'team-radar.png';
      a.click();
      URL.revokeObjectURL(dl);
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      <div className="space-y-6">
        <TeamGrid team={team} onChange={setTeam} />
        <div className="flex gap-2 flex-wrap">
          <button className="btn" onClick={exportJSON}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 7v10a2 2 0 0 0 2 2h8"/><path d="M14 22l-7-7 7-7"/></svg>
            JSON
          </button>
          <button className="btn" onClick={exportCSV}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
            CSV
          </button>
          <button className="btn" onClick={exportRadarPNG}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h.01"/><path d="M17 10h.01"/><path d="M15 12h.01"/></svg>
            Radar PNG
          </button>
          <button className="btn-primary" onClick={copyShare}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a3 3 0 0 0-3-3"/><path d="M6 11v-1a7 7 0 0 1 14 0v1"/><rect width="20" height="8" x="2" y="11" rx="2"/></svg>
            Share
          </button>
          {/* <RecentTeams onLoad={(names) => setTeam(fromNames(names))} onSave={(names) => saveRecent(names)} current={cleanTeam.map((p) => p.name)} /> */}
        </div>
      </div>
      <div className="space-y-6">
        <TypeRadar analysis={analysis} />
        <WeaknessMatrix analysis={analysis} />
        <OffenseMatrix team={cleanTeam} />
        <Suggestions analysis={analysis} />
      </div>
    </div>
  );
}

function fromNames(names: string[]) {
  const { POKEMON_LIST } = require('@/lib/battle/sampleData');
  const arr = Array(6).fill(null);
  names.slice(0, 6).forEach((n: string, i: number) => {
    const p = POKEMON_LIST.find((x: any) => x.name === n) || null;
    arr[i] = p;
  });
  return arr;
}

function RecentTeams({ onLoad, onSave, current }: { onLoad: (names: string[]) => void; onSave: (names: string[]) => void; current: string[] }) {
  const [list, setList] = useState<{ name: string; team: string[] }[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('team-builder:recent');
      if (raw) setList(JSON.parse(raw));
    } catch {}
  }, []);
  function save() {
    const name = prompt('Save team as:');
    if (!name) return;
    const entry = { name, team: current };
    const next = [entry, ...list.filter((e) => e.name !== name)].slice(0, 10);
    setList(next);
    try { localStorage.setItem('team-builder:recent', JSON.stringify(next)); } catch {}
    onSave(current);
  }
  return (
    <div className="flex items-center gap-2">
      <button className="px-3 py-2 rounded border" onClick={save}>Save Team</button>
      {list.length > 0 && (
        <div className="flex items-center gap-2 overflow-auto">
          <span className="text-xs text-gray-600">Recent:</span>
          {list.map((e) => (
            <button key={e.name} className="text-xs px-2 py-1 rounded border" onClick={() => onLoad(e.team)}>{e.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}
