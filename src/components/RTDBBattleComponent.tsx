import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import Tooltip from '@/components/Tooltip';
import { getMove } from '@/lib/moveCache';
import { getAbility } from '@/lib/api';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, getPokemonImageWithFallbacks, formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils';
import HitShake from '@/components/battle/HitShake';
import HPBar from '@/components/battle/HPBar';
import StatusPopups, { StatusEvent } from '@/components/battle/StatusPopups';
import AttackAnimator from '@/components/battle/AttackAnimator';
import { FxKind } from '@/components/battle/fx/MoveFX.types';
import { BattleSprite, BattleSpriteRef } from '@/components/battle/BattleSprite';
import { rtdbService } from '@/lib/firebase-rtdb-service';
import Image from 'next/image';

interface RTDBBattleComponentProps {
  battleId: string;
  onBattleComplete?: (winner: string) => void;
  viewMode?: 'animated' | 'classic';
}


export const RTDBBattleComponent: React.FC<RTDBBattleComponentProps> = ({
  battleId,
  onBattleComplete,
  viewMode = 'classic'
}) => {
  console.log('🎮 RTDBBattleComponent viewMode:', viewMode);
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


  // duplicate state/effects removed (using direct imports below)

  const [moveInfo, setMoveInfo] = useState<Record<string, { type: string; damage_class?: 'physical'|'special'|'status'; short_effect?: string }>>({});
  const [myAbilityInfo, setMyAbilityInfo] = useState<{ name: string; short_effect?: string } | null>(null);
  
  // Transition effects state
  const [playerShakeKey, setPlayerShakeKey] = useState(0);
  const [opponentShakeKey, setOpponentShakeKey] = useState(0);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [activeMoveFX, setActiveMoveFX] = useState<{ kind: FxKind; key: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(
        (legalMoves || []).map(async (m) => {
          try {
            const mv: any = await getMove(m.id);
            const english = (mv.effect_entries || []).find((e: any) => e.language?.name === 'en');
            return [m.id, { type: mv.type?.name || 'normal', damage_class: mv.damage_class?.name || undefined, short_effect: english?.short_effect || english?.effect }];
          } catch {
            return [m.id, { type: 'normal' }];
          }
        })
      );
      if (!cancelled) {
        const next: Record<string, { type: string; damage_class?: 'physical'|'special'|'status'; short_effect?: string }> = {};
        for (const [k, v] of entries) next[k as string] = v as any;
        setMoveInfo(next);
      }
    };
    if (legalMoves?.length) run();
    return () => { cancelled = true; };
  }, [legalMoves]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const abilityId = (me?.team?.[0]?.ability as any) || null;
      if (!abilityId) { setMyAbilityInfo(null); return; }
      try {
        const ab: any = await getAbility(abilityId);
        const english = (ab.effect_entries || []).find((e: any) => e.language?.name === 'en');
        if (!cancelled) setMyAbilityInfo({ name: ab.name, short_effect: english?.short_effect || english?.effect });
      } catch { if (!cancelled) setMyAbilityInfo({ name: String(abilityId) }); }
    };
    load();
    return () => { cancelled = true; };
  }, [me?.team?.[0]?.ability]);

  // Handle battle completion
  useEffect(() => {
    if (meta?.phase === 'ended' && meta.winnerUid && onBattleComplete) {
      onBattleComplete(meta.winnerUid);
    }
  }, [meta?.phase, meta?.winnerUid, onBattleComplete]);

  const handleMoveSelection = async (moveId: string, target?: 'p1' | 'p2') => {
  console.log('🎮 handleMoveSelection called:', { moveId, target, hasPub: !!pub, hasMyActive: !!(meUid && (pub as any)?.[meUid]?.active) });
    try {
      // Classic view: give immediate feedback on action
      playAnim(playerAnimRef, 'animate-bounce');
      
      // Animated view: trigger transition effects
      if (viewMode === 'animated') {
        const move = moveInfo[moveId];
        if (move) {
          // Map move type to FX kind
          const fxKind: FxKind = (move.type as FxKind) || 'electric';
          
          // Trigger move FX
          setActiveMoveFX({ kind: fxKind, key: Date.now() });
          
          // Trigger shake on target (simplified - in real battle this would be determined by the move)
          if (target === 'p2') {
            setOpponentShakeKey(Date.now());
          } else {
            setPlayerShakeKey(Date.now());
          }
          
          // Add status effects based on move type (simplified)
          const statusEffects: StatusEvent[] = [];
          if (move.type === 'electric') statusEffects.push({ code: 'PAR', side: target === 'p2' ? 'foe' : 'ally' });
          if (move.type === 'fire') statusEffects.push({ code: 'BRN', side: target === 'p2' ? 'foe' : 'ally' });
          if (move.type === 'poison') statusEffects.push({ code: 'PSN', side: target === 'p2' ? 'foe' : 'ally' });
          
          setStatusEvents(prev => [...prev, ...statusEffects]);
        }
      }
      
      await chooseMove(moveId, target);
    } catch (err) {
      console.error('Failed to submit move:', err);
    }
  };

  // Listen for custom move events from E2E testing
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_E2E === 'true') {
      const handleCustomMoveEvent = (event: CustomEvent) => {
        console.log('🎮 Received custom move event:', event.detail);
        if (event.detail && event.detail.moveId) {
          handleMoveSelection(event.detail.moveId);
        }
      };
      
      document.addEventListener('move-selected', handleCustomMoveEvent as EventListener);
      console.log('🎮 Added custom move event listener for E2E testing');
      
      return () => {
        document.removeEventListener('move-selected', handleCustomMoveEvent as EventListener);
      };
    }
  }, [handleMoveSelection]);

  const handlePokemonSwitch = async (pokemonIndex: number) => {
    try {
      await chooseSwitch(pokemonIndex);
    } catch (err) {
      console.error('Failed to switch Pokemon:', err);
    }
  };

  // Lightweight CSS animations for classic view
  const playerAnimRef = useRef<HTMLDivElement>(null);
  const oppAnimRef = useRef<HTMLDivElement>(null);
  // Sprite refs for animations (must be declared before any conditional returns to preserve hook order)
  const playerSpriteRef = useRef<BattleSpriteRef>(null);
  const opponentSpriteRef = useRef<BattleSpriteRef>(null);
  const playAnim = (ref: React.RefObject<HTMLDivElement>, cls: string) => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('animate-bounce','animate-damage','animate-critical','animate-pulse');
    // Force reflow to restart animation reliably
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (el as any).offsetHeight;
    el.classList.add(cls);
    const onEnd = () => {
      el.classList.remove(cls);
      el.removeEventListener('animationend', onEnd);
    };
    el.addEventListener('animationend', onEnd);
  };

  // Parse lastResultSummary to drive simple animations
  useEffect(() => {
    const line = pub?.lastResultSummary?.toLowerCase?.() || '';
    if (!line) return;
    // Toast with move info/effect when present
    try {
      const detail = (pub as any)?.lastResultDetail as { actor?: 'p1'|'p2'; moveId?: string; effect?: string; effectiveness?: 'super_effective' | 'not_very_effective' | 'no_effect' | 'normal' } | undefined;
      if (detail?.moveId) {
        const actorName = detail.actor === 'p2' ? 'Opponent' : 'You';
        const title = `${actorName} used ${detail.moveId}`;
        let message = detail.effect || '';
        if (detail.effectiveness === 'super_effective') message = `${message} It's super effective!`;
        if (detail.effectiveness === 'not_very_effective') message = `${message} It's not very effective.`;
        if (detail.effectiveness === 'no_effect') message = `${message} It had no effect.`;
        (window as any).__battle_toast?.({ title, message });
      } else {
        // Fallback: use summary text
        const title = line.includes('used') ? pub?.lastResultSummary : 'Battle update';
        let message = '';
        if (line.includes('super effective')) message = `It's super effective!`;
        if (line.includes('not very effective')) message = `It's not very effective.`;
        (window as any).__battle_toast?.({ title, message });
      }
    } catch {}
    if (line.includes('used')) {
      // Heuristic: if mentions opponent, animate opponent as actor
      if (line.includes('opponent')) {
        playAnim(oppAnimRef, 'animate-bounce');
      } else {
        playAnim(playerAnimRef, 'animate-bounce');
      }
    }
    if (line.includes('hit') || line.includes('damage') || line.includes('fainted')) {
      if (line.includes('opponent')) {
        playAnim(oppAnimRef, 'animate-damage');
      } else {
        playAnim(playerAnimRef, 'animate-damage');
      }
    }
  }, [pub?.lastResultSummary]);

  // Damage animations when HP values change (robust cue)
  const lastMyHpRef = useRef<number | null>(null);
  const lastOppHpRef = useRef<number | null>(null);
  useEffect(() => {
    const cur = meUid ? pub?.[meUid]?.active?.hp?.cur : null;
    if (typeof cur === 'number') {
      if (lastMyHpRef.current != null && cur < lastMyHpRef.current) {
        playAnim(playerAnimRef, 'animate-damage');
      }
      lastMyHpRef.current = cur;
    }
  }, [pub?.[meUid!]?.active?.hp?.cur, meUid, pub]);
  useEffect(() => {
    const cur = oppUid ? pub?.[oppUid]?.active?.hp?.cur : null;
    if (typeof cur === 'number') {
      if (lastOppHpRef.current != null && cur < lastOppHpRef.current) {
        playAnim(oppAnimRef, 'animate-damage');
      }
      lastOppHpRef.current = cur;
    }
  }, [pub?.[oppUid!]?.active?.hp?.cur, oppUid, pub]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Initializing battle...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!meta || !pub || !me) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Waiting for battle data...</div>
      </div>
    );
  }

  // Get current active Pokemon using RTDB p1/p2 mapping
  const mySide: 'p1' | 'p2' | null = meUid && meta?.players
    ? (meta.players.p1.uid === meUid ? 'p1' : meta.players.p2.uid === meUid ? 'p2' : null)
    : null;
  const oppSide: 'p1' | 'p2' | null = mySide === 'p1' ? 'p2' : mySide === 'p2' ? 'p1' : null;
  const myActive = mySide && (pub as any)?.[mySide]?.active ? (pub as any)[mySide].active : null;
  const oppActive = oppSide && (pub as any)?.[oppSide]?.active ? (pub as any)[oppSide].active : null;
  const myTeam = me?.team || [];

  // (refs declared above)

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Battle Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary/80" />
              {meta.phase}
            </span>
            <span className="text-xs text-muted">Turn {meta.turn}</span>
            <span className="text-xs text-muted">{timeLeftSec}s</span>
          </div>
          <div className="text-sm text-muted">
            vs Opponent
          </div>
        </div>
      </div>

      {/* Active Pokemon Overview (mirrors offline battle top panels) */}
      {(myActive || oppActive) && (
        <div className="border-b border-border bg-surface/80">
          <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Your Active */}
            {myActive && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
                <div className="flex-shrink-0">
                  <Image
                    src={getPokemonImageWithFallbacks(getPokemonIdFromSpecies(myActive.species) || 1, myActive.species, 'front').primary}
                    alt={formatPokemonName(myActive.species)}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold capitalize truncate">{formatPokemonName(myActive.species)}</div>
                    <div className="text-xs text-muted">Lv {myActive.level}</div>
                  </div>
                  <div className="mt-1">
                    <HPBar value={myActive.hp.cur} max={myActive.hp.max} />
                  </div>
                  {myActive.status && (
                    <div className="mt-1 text-xs uppercase tracking-wide text-yellow-500">{myActive.status}</div>
                  )}
                </div>
              </div>
            )}

            {/* Opponent Active */}
            {oppActive && (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 sm:justify-self-end">
                <div className="flex-shrink-0">
                  <Image
                    src={getPokemonImageWithFallbacks(getPokemonIdFromSpecies(oppActive.species) || 1, oppActive.species, 'front').primary}
                    alt={formatPokemonName(oppActive.species)}
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold capitalize truncate">{formatPokemonName(oppActive.species)}</div>
                    <div className="text-xs text-muted">Lv {oppActive.level}</div>
                  </div>
                  <div className="mt-1">
                    <HPBar value={oppActive.hp.cur} max={oppActive.hp.max} />
                  </div>
                  {oppActive.status && (
                    <div className="mt-1 text-xs uppercase tracking-wide text-yellow-500">{oppActive.status}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Battle Field */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-8 h-full">
          {/* Player Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Your Pokemon</h2>
            </div>
            {myActive && (
              <BattleSprite
                ref={playerSpriteRef}
                species={myActive.species}
                level={myActive.level}
                hp={{ 
                  cur: myActive.hp.cur, 
                  max: myActive.hp.max 
                }}
                status={myActive.status}
                volatiles={myActive.volatiles}
                types={myActive.types || []}
                side="player"
                field={{
                  safeguardTurns: 0,
                  mistTurns: 0,
                  reflectTurns: 0,
                  lightScreenTurns: 0
                }}
                className="transform scale-110"
                spriteMode={viewMode === 'animated' ? 'animated' : 'static'}
              />
            )}
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Opponent</h2>
            </div>
            {oppActive && (
              <BattleSprite
                ref={opponentSpriteRef}
                species={oppActive.species}
                level={oppActive.level}
                hp={{ 
                  cur: oppActive.hp.cur, 
                  max: oppActive.hp.max 
                }}
                status={oppActive.status}
                volatiles={oppActive.volatiles}
                types={oppActive.types || []}
                side="opponent"
                field={{
                  safeguardTurns: 0,
                  mistTurns: 0,
                  reflectTurns: 0,
                  lightScreenTurns: 0
                }}
                className="transform scale-110"
                spriteMode={viewMode === 'animated' ? 'animated' : 'static'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Resolving Phase Indicator */}
      {meta.phase === 'resolving' && (
        <div className="border-t border-border bg-surface/90 backdrop-blur p-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse text-muted font-semibold">
              Resolving moves...
            </div>
          </div>
        </div>
      )}

      {/* Action Panel */}
      {meta.phase === 'choosing' && (
        <div className="border-t border-border bg-surface/90 backdrop-blur p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>
            
            {/* Move Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Moves</h4>
              <div className="grid grid-cols-2 gap-3">
                {legalMoves.map((move, index) => {
                  console.log('🎮 Rendering move button:', { moveId: move.id, disabled: move.disabled, index });
                  return (
                  <button
                    key={index}
                    onClick={() => handleMoveSelection(move.id)}
                    disabled={move.disabled}
                    className="p-3 rounded-lg border border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5 hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    data-testid={`move-${move.id}`}
                  >
                    <div className="font-medium capitalize">
                      <Tooltip 
                        content={moveInfo[move.id]?.short_effect || ''} 
                        type={(moveInfo[move.id]?.type as any) || 'normal'} 
                        variant="move" 
                        position="top"
                        containViewport={false}
                        maxWidth="w-64"
                      >
                        <span className="cursor-help">{move.id}</span>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-muted">PP: {move.pp}</div>
                    {move.reason && (
                      <div className="text-xs text-red-500/80">{move.reason}</div>
                    )}
                  </button>
                  );
                })}
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
                    disabled={pokemon.fainted || index === 0 || !legalSwitchIndexes.includes(index)}
                    className={`p-2 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      pokemon.fainted || index === 0 || !legalSwitchIndexes.includes(index)
                        ? 'border-border bg-surface cursor-not-allowed opacity-60'
                        : 'border-border bg-surface hover:border-primary/50 hover:bg-primary/5'
                    }`}
                    data-testid={`switch-${pokemon.species}-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      <Image
                        src={getPokemonImageWithFallbacks(getPokemonIdFromSpecies(pokemon.species) || 1, pokemon.species, 'front').primary}
                        alt={formatPokemonName(pokemon.species)}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <div className="text-sm font-medium capitalize truncate">
                        {formatPokemonName(pokemon.species)}
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      HP: {pokemon.stats.hp}
                    </div>
                    {pokemon.fainted && (
                      <div className="text-xs text-red-500">Fainted</div>
                    )}
                    {index === 0 && (
                      <div className="text-xs text-muted">Active</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Forfeit Button */}
            <div className="text-center">
              <button
                onClick={forfeit}
                className="inline-flex items-center justify-center rounded-md border border-red-600/60 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                data-testid="forfeit-button"
              >
                Forfeit Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle Log */}
      {pub.lastResultSummary && (
        <div className="border-t border-border bg-surface p-4 text-sm font-mono max-h-32 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-muted">
              {pub.lastResultSummary}
            </div>
          </div>
        </div>
      )}

      {/* Transition Effects for Animated View */}
      {viewMode === 'animated' && (
        <>
          {/* Status Popups */}
          <StatusPopups
            anchorAlly={{ x: 0.20, y: 0.58 }}
            anchorFoe={{ x: 0.80, y: 0.18 }}
            events={statusEvents}
          />
          
          {/* Move FX */}
          {activeMoveFX && myActive && oppActive && (
            <AttackAnimator
              kind={activeMoveFX.kind}
              from={{ x: 0.2, y: 0.6 }} // Player position
              to={{ x: 0.8, y: 0.4 }}   // Opponent position
              playKey={activeMoveFX.key}
              power={1}
              onDone={() => setActiveMoveFX(null)}
            />
          )}
        </>
      )}

      {/* Battle Complete */}
      {meta.phase === 'ended' && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-surface border border-border rounded-lg p-8 text-center max-w-2xl w-full text-text">
            <h2 className="text-3xl font-bold mb-4">
              {meta.winnerUid === meUid ? 'Victory!' : 'Defeat!'}
            </h2>
            <p className="text-lg mb-4">
              {meta.winnerUid === meUid
                ? 'You won the battle!'
                : 'You lost the battle!'}
            </p>
            {meta.endedReason && (
              <p className="text-sm text-muted mt-2">
                Reason: {meta.endedReason}
              </p>
            )}
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/battle'}
                className="w-full px-4 py-2 rounded-md border border-border bg-surface hover:bg-primary/5 hover:border-primary/50 text-text"
              >
                Battle Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 rounded-md border border-border bg-surface hover:bg-primary/5 hover:border-primary/50 text-text"
              >
                Back to PokéDex
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RTDBBattleComponent;
