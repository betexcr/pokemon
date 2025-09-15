"use client";

import React from 'react';
import { BattleScene, UIEvent } from './BattleScene';
import { useBattleFeed } from '@/hooks/useBattleFeed';

interface BattleSceneExampleProps {
  battleId: string;
  useSelfSubscribing?: boolean;
  events?: UIEvent[];
}

export const BattleSceneExample: React.FC<BattleSceneExampleProps> = ({ 
  battleId, 
  useSelfSubscribing = false,
  events 
}) => {
  // Optional: Use the self-subscribing hook
  const { pub, logs, meta } = useBattleFeed(useSelfSubscribing ? battleId : undefined);

  if (useSelfSubscribing) {
    return (
      <div className="h-screen">
        <BattleScene 
          battleId={battleId} 
          state={pub} 
          logs={logs} 
          events={events}
        />
      </div>
    );
  }

  return (
    <div className="h-screen">
      <BattleScene 
        battleId={battleId} 
        events={events}
      />
    </div>
  );
};

export default BattleSceneExample;
