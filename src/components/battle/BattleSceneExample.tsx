"use client";

import React from 'react';
import BattleScene from './BattleScene';
import { useBattleFeed } from '@/hooks/useBattleFeed';

interface BattleSceneExampleProps {
  battleId: string;
  useSelfSubscribing?: boolean;
  events?: any[];
}

export const BattleSceneExample: React.FC<BattleSceneExampleProps> = ({ 
  battleId, 
  useSelfSubscribing = false,
  events 
}) => {
  // Optional: Use the self-subscribing hook
  const { pub, logs, meta } = useBattleFeed(useSelfSubscribing ? battleId : undefined);

  return (
    <div className="h-screen">
      <BattleScene />
    </div>
  );
};

export default BattleSceneExample;
