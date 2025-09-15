"use client";

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { onValue, ref as dbRef } from 'firebase/database';
import { Database } from 'firebase/database';
import { BattleSprite, BattleSpriteRef } from './BattleSprite';
import { useBattleState } from '@/hooks/useBattleState';
import Tooltip from '@/components/Tooltip';

// UI Event types for precise animation control
export type UIEvent =
  | { kind: "attack"; actor: "p1" | "p2"; typeColor?: string; special?: boolean }
  | { kind: "hit"; target: "p1" | "p2"; crit?: boolean }
  | { kind: "miss"; actor: "p1" | "p2" }
  | { kind: "protect"; target: "p1" | "p2" }
  | { kind: "feintBreak"; target: "p1" | "p2" }
  | { kind: "subFade"; target: "p1" | "p2" }
  | { kind: "perishTick"; target: "p1" | "p2"; count: number }
  | { kind: "ko"; target: "p1" | "p2" };

interface BattleSceneProps {
  battleId: string;
  className?: string;
  events?: UIEvent[]; // Optional structured events
  state?: any; // Optional external state
  logs?: string[]; // Optional log array
}

export const BattleScene: React.FC<BattleSceneProps> = ({ 
  battleId, 
  className = '',
  events,
  state: externalState,
  logs: externalLogs
}) => {
  const playerSpriteRef = useRef<BattleSpriteRef>(null);
  const opponentSpriteRef = useRef<BattleSpriteRef>(null);
  const [lastLogLine, setLastLogLine] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [projectiles, setProjectiles] = useState<Array<{id: string; side: 'p1' | 'p2'; typeColor: string}>>([]);
  const [moveInfo, setMoveInfo] = useState<Record<string, { type: string; short_effect?: string }>>({});
  const [myAbilityInfo, setMyAbilityInfo] = useState<{ name: string; short_effect?: string } | null>(null);

  // Animation scheduler for sequenced effects
  const step = useCallback((fn: () => void, delay: number = 100) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        fn();
        resolve();
      }, delay);
    });
  }, []);

  // Use your existing battle state hook
  const {
    loading,
    error,
    meta,
    pub,
    me,
    meUid,
    oppUid,
    timeLeftSec,
    legalMoves,
    legalSwitchIndexes,
    chooseMove,
    chooseSwitch,
    forfeit
  } = useBattleState(battleId);

  // Prefetch move details for tooltips
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(
        (legalMoves || []).map(async (m) => {
          try {
            const mv: any = await (await import('@/lib/moveCache')).getMove(m.id);
            const english = (mv.effect_entries || []).find((e: any) => e.language?.name === 'en');
            return [m.id, { type: mv.type?.name || 'normal', short_effect: english?.short_effect || english?.effect }];
          } catch {
            return [m.id, { type: 'normal' }];
          }
        })
      );
      if (!cancelled) {
        const next: Record<string, { type: string; short_effect?: string }> = {};
        for (const [k, v] of entries) next[k as string] = v as any;
        setMoveInfo(next);
      }
    };
    if (legalMoves?.length) run();
    return () => { cancelled = true; };
  }, [legalMoves]);

  // Prefetch my active ability
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const abilityId = (me?.team?.[0]?.ability as any) || null;
      if (!abilityId) { setMyAbilityInfo(null); return; }
      try {
        const ab: any = await (await import('@/lib/api')).getAbility(abilityId);
        const english = (ab.effect_entries || []).find((e: any) => e.language?.name === 'en');
        if (!cancelled) setMyAbilityInfo({ name: ab.name, short_effect: english?.short_effect || english?.effect });
      } catch { if (!cancelled) setMyAbilityInfo({ name: String(abilityId) }); }
    };
    load();
    return () => { cancelled = true; };
  }, [me?.team?.[0]?.ability]);

  // Get current active Pokemon
  const myActive = meUid ? pub?.[meUid]?.active : null;
  const oppActive = oppUid ? pub?.[oppUid]?.active : null;
  const myTeam = me?.team || [];

  // Use external state if provided, otherwise use battle state
  const state = externalState || pub;
  const logs = externalLogs || (pub?.lastResultSummary ? [pub.lastResultSummary] : []);

  // Parse logs to events (fallback when events not provided)
  const parseLogsToEvents = useCallback((logLines: string[]): UIEvent[] => {
    const events: UIEvent[] = [];
    
    for (const line of logLines) {
      const lower = line.toLowerCase();
      
      // Attack patterns
      if (lower.includes('used') && lower.includes('attack')) {
        const actor = lower.includes('opponent') ? 'p2' : 'p1';
        events.push({ kind: 'attack', actor });
      }
      
      // Hit patterns
      if (lower.includes('hit') || lower.includes('damage')) {
        const target = lower.includes('opponent') ? 'p2' : 'p1';
        const crit = lower.includes('critical') || lower.includes('crit');
        events.push({ kind: 'hit', target, crit });
      }
      
      // Miss patterns
      if (lower.includes('missed') || lower.includes('miss')) {
        const actor = lower.includes('opponent') ? 'p2' : 'p1';
        events.push({ kind: 'miss', actor });
      }
      
      // Protect patterns
      if (lower.includes('protect')) {
        const target = lower.includes('opponent') ? 'p2' : 'p1';
        events.push({ kind: 'protect', target });
      }
      
      // KO patterns
      if (lower.includes('fainted') || lower.includes('ko')) {
        const target = lower.includes('opponent') ? 'p2' : 'p1';
        events.push({ kind: 'ko', target });
      }
    }
    
    return events;
  }, []);

  // Get current events (prefer structured events over parsed logs)
  const currentEvents = useMemo(() => {
    return events?.length ? events : parseLogsToEvents(logs);
  }, [events, logs, parseLogsToEvents]);

  // Process events for animations with sequencing
  const processEvents = useCallback(async (events: UIEvent[]) => {
    if (isAnimating || !events.length) return;

    setIsAnimating(true);

    for (const event of events) {
      const targetSprite = 'target' in event && event.target === 'p1' ? playerSpriteRef.current : opponentSpriteRef.current;
      const actorSprite = 'actor' in event && event.actor === 'p1' ? playerSpriteRef.current : opponentSpriteRef.current;

      switch (event.kind) {
        case 'attack':
          // Show projectile
          if (event.typeColor) {
            const projId = `proj_${Date.now()}_${Math.random()}`;
            setProjectiles(prev => [...prev, {
              id: projId,
              side: event.actor,
              typeColor: event.typeColor || '#ff0000'
            }]);
            
            // Remove projectile after animation
            await step(() => {
              setProjectiles(prev => prev.filter(p => p.id !== projId));
            }, 500);
          }
          
          if (actorSprite) {
            await actorSprite.play('animate-bounce');
          }
          break;

        case 'hit':
          if (targetSprite) {
            const animName = event.crit ? 'animate-critical' : 'animate-damage';
            await targetSprite.play(animName);
          }
          break;

        case 'miss':
          if (actorSprite) {
            await actorSprite.play('animate-pulse');
          }
          break;

        case 'protect':
          if (targetSprite) {
            await targetSprite.play('animate-pulse');
          }
          break;

        case 'ko':
          if (targetSprite) {
            await targetSprite.play('animate-fadeOut');
          }
          break;

        default:
          // Generic pulse for other events
          if (targetSprite) {
            await targetSprite.play('animate-pulse');
          }
      }

      // Small delay between events for smooth sequencing
      await step(() => {}, 50);
    }

    setIsAnimating(false);
  }, [isAnimating, step]);

  // Watch for events and trigger animations
  useEffect(() => {
    if (currentEvents.length > 0) {
      processEvents(currentEvents);
    }
  }, [currentEvents, processEvents]);

  // Emit readable toasts for online battles (animated view)
  useEffect(() => {
    const summary = pub?.lastResultSummary || '';
    if (!summary) return;
    try {
      const lower = summary.toLowerCase();
      // Simple title/message split
      let title = summary;
      let message = '';
      const usedIdx = lower.indexOf(' used ');
      if (usedIdx > -1) {
        // e.g., "Pikachu used thunderbolt! It dealt ..."
        title = summary.slice(0, usedIdx + ' used '.length) + summary.slice(usedIdx + ' used '.length).split('!')[0] + '!';
        message = summary.slice((summary.toLowerCase().indexOf('!', usedIdx) + 1) || summary.length).trim();
      }
      // Append effectiveness cues if present
      const eff = lower.includes('super effective') ? 'It\'s super effective!' : lower.includes('not very effective') ? "It\'s not very effective." : '';
      if (eff) {
        message = message ? `${message} ${eff}` : eff;
      }
      if (typeof window !== 'undefined' && (window as any).__battle_toast) {
        (window as any).__battle_toast({ title, message, type: 'info', duration: 3500 });
      }
    } catch {}
  }, [pub?.lastResultSummary]);

  // Handle move selection
  const handleMoveSelection = useCallback(async (moveId: string) => {
    if (isAnimating) return;
    try {
      await chooseMove(moveId);
    } catch (err) {
      console.error('Failed to submit move:', err);
    }
  }, [chooseMove, isAnimating]);

  // Handle Pokemon switch
  const handlePokemonSwitch = useCallback(async (pokemonIndex: number) => {
    if (isAnimating) return;
    try {
      await chooseSwitch(pokemonIndex);
    } catch (err) {
      console.error('Failed to switch Pokemon:', err);
    }
  }, [chooseSwitch, isAnimating]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading battle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!meta || !state || !me) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Waiting for battle data...</p>
      </div>
    );
  }

  // Map field auras for each side
  const fieldP1 = {
    safeguardTurns: state?.field?.safeguard?.p1 ?? 0,
    mistTurns: state?.field?.mist?.p1 ?? 0,
    reflectTurns: state?.field?.screens?.p1?.reflect ?? 0,
    lightScreenTurns: state?.field?.screens?.p1?.lightScreen ?? 0,
  };
  const fieldP2 = {
    safeguardTurns: state?.field?.safeguard?.p2 ?? 0,
    mistTurns: state?.field?.mist?.p2 ?? 0,
    reflectTurns: state?.field?.screens?.p2?.reflect ?? 0,
    lightScreenTurns: state?.field?.screens?.p2?.lightScreen ?? 0,
  };

  return (
    <div className={`h-screen bg-gradient-to-b from-blue-100 to-green-100 ${className}`}>
      {/* Battle Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold">
            Turn {meta.turn} | Phase: {meta.phase}
          </div>
          <div className="text-sm text-gray-600">
            Time Left: {timeLeftSec}s
          </div>
        </div>
      </div>

      {/* Battle Field */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-8 h-full">
          {/* Player Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-blue-600">Your Pokemon</h2>
            </div>
            {myActive && (
              <BattleSprite
                ref={playerSpriteRef}
                species={myActive.species}
                level={myActive.level}
                hp={{ cur: myActive.hp?.cur ?? myActive.hp, max: myActive.hp?.max ?? myActive.hp }}
                status={myActive.status}
                volatiles={myActive.volatiles}
                types={myActive.types}
                side="player"
                field={fieldP1}
                className="transform scale-110"
                spriteMode="animated"
              />
            )}
            {myAbilityInfo && (
              <div className="mt-2 text-sm text-gray-700">
                <Tooltip content={myAbilityInfo.short_effect || '—'} variant="ability" position="top" maxWidth="w-80">
                  <span className="cursor-help font-medium capitalize">Ability: {myAbilityInfo.name}</span>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Opponent</h2>
            </div>
            {oppActive && (
              <BattleSprite
                ref={opponentSpriteRef}
                species={oppActive.species}
                level={oppActive.level}
                hp={{ cur: oppActive.hp?.cur ?? oppActive.hp, max: oppActive.hp?.max ?? oppActive.hp }}
                status={oppActive.status}
                volatiles={oppActive.volatiles}
                types={oppActive.types}
                side="opponent"
                field={fieldP2}
                className="transform scale-110"
                spriteMode="animated"
              />
            )}
          </div>
        </div>
      </div>

      {/* Projectile Layer */}
      {projectiles.map((proj) => (
        <div
          key={proj.id}
          className={`absolute top-1/2 ${proj.side === "p1" ? "left-32" : "right-32"} h-1 w-24 rounded animate-beam`}
          style={{ background: proj.typeColor }}
        />
      ))}

      {/* Action Panel */}
      {meta.phase === 'choosing' && (
        <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>
            
            {/* Move Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Moves</h4>
              <div className="grid grid-cols-2 gap-3">
                {legalMoves.map((move, index) => (
                  <button
                    key={index}
                    onClick={() => handleMoveSelection(move.id)}
                    disabled={move.disabled || isAnimating}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      move.disabled || isAnimating
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                        : 'border-blue-500 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 hover:shadow-md'
                    }`}
                  >
                    <div className="font-medium capitalize">
                      <Tooltip
                        content={moveInfo[move.id]?.short_effect || ''}
                        type={(moveInfo[move.id]?.type as any) || 'normal'}
                        variant="move"
                        position="top"
                        containViewport
                        maxWidth="w-80"
                      >
                        <span className="cursor-help">{move.id}</span>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-gray-600">PP: {move.pp}</div>
                    {move.reason && (
                      <div className="text-xs text-red-600">{move.reason}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pokemon Switch */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Switch Pokemon</h4>
              <div className="grid grid-cols-3 gap-2">
                {myTeam.map((pokemon, index) => (
                  <button
                    key={index}
                    onClick={() => handlePokemonSwitch(index)}
                    disabled={index === 0 || !legalSwitchIndexes.includes(index) || isAnimating}
                    className={`p-2 rounded-lg border transition-all duration-200 ${
                      index === 0
                        ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                        : legalSwitchIndexes.includes(index) && !isAnimating
                        ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600'
                        : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize truncate">
                      {pokemon.species}
                    </div>
                    <div className="text-xs text-gray-600">
                      HP: {pokemon.stats.hp}
                    </div>
                    {pokemon.fainted && (
                      <div className="text-xs text-red-600">Fainted</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Forfeit Button */}
            <div className="text-center">
              <button
                onClick={forfeit}
                disabled={isAnimating}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forfeit Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Log */}
      {pub?.lastResultSummary && (
        <div className="bg-black/80 text-white p-4 text-sm font-mono">
          <div className="max-w-4xl mx-auto">
            <div className="text-green-400">{pub.lastResultSummary}</div>
          </div>
        </div>
      )}

      {/* Battle Complete */}
      {meta.phase === 'ended' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">
              {meta.winnerUid === meUid ? 'Victory!' : 'Defeat!'}
            </h2>
            <p className="text-lg mb-4">
              {meta.winnerUid === meUid
                ? 'You won the battle!'
                : 'You lost the battle!'}
            </p>
            {meta.endedReason && (
              <p className="text-sm text-gray-600">
                Reason: {meta.endedReason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};