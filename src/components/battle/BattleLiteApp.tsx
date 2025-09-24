"use client";

import { useState } from 'react';
import TeamSelector from './TeamSelector';
import BattleStage from './BattleStage';
import type { SimplePokemon } from '@/lib/battle/sampleData';

export default function BattleLiteApp() {
  const [attacker, setAttacker] = useState<SimplePokemon | null>(null);
  const [defender, setDefender] = useState<SimplePokemon | null>(null);

  if (!attacker || !defender) {
    return <TeamSelector onStart={(a, d) => { setAttacker(a); setDefender(d); }} />;
  }
  return <BattleStage attacker={attacker} defender={defender} onReset={() => { setAttacker(null); setDefender(null); }} />;
}

