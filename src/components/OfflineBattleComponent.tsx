"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useOfflineBattleState, type OfflineBattleConfig } from '@/hooks/useOfflineBattleState';
import Tooltip from '@/components/Tooltip';
import { getMove } from '@/lib/moveCache';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils';
import { BattleSprite, BattleSpriteRef } from '@/components/battle/BattleSprite';
import Image from 'next/image';
import { BattleEndScreen } from '@/components/multiplayer/BattleEndScreen';
import { BattleTextBox } from '@/components/battle/BattleTextBox';
import { trackEvent } from '@/lib/analytics';
import { useReducedMotionPref } from '@/hooks/useReducedMotionPref';

const formatMoveLabel = (rawId: string): string => {
  if (!rawId) return 'Unknown Move';
  return rawId.split(/[-_\s]+/).filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};

interface OfflineBattleComponentProps {
  config: OfflineBattleConfig;
  onBattleComplete?: (winner: string) => void;
  viewMode?: 'animated' | 'classic';
}

const OfflineBattleComponent: React.FC<OfflineBattleComponentProps> = ({
  config,
  onBattleComplete,
  viewMode = 'animated',
}) => {
  const {
    loading, error, meta, pub, me, meUid, oppUid,
    legalMoves, legalSwitchIndexes, chooseMove, chooseSwitch, forfeit,
  } = useOfflineBattleState(config);

  const [moveInfo, setMoveInfo] = useState<Record<string, any>>({});
  const [pendingAction, setPendingAction] = useState<{ turn: number; type: 'move' | 'switch'; id: string | number } | null>(null);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const playerSpriteRef = useRef<BattleSpriteRef>(null);
  const opponentSpriteRef = useRef<BattleSpriteRef>(null);
  const reduceMotion = useReducedMotionPref();
  const spriteMode = reduceMotion || viewMode !== 'animated' ? 'static' : 'animated';

  const waitingForResolution = useMemo(() => {
    if (!meta) return false;
    return meta.phase === 'resolving';
  }, [meta?.phase]);

  useEffect(() => {
    if (meta?.phase === 'ended') {
      const timer = setTimeout(() => setShowEndScreen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [meta?.phase]);

  useEffect(() => {
    if (meta?.phase === 'ended' && meta.winnerUid && onBattleComplete) {
      onBattleComplete(meta.winnerUid === meUid ? 'player' : 'opponent');
    }
  }, [meta?.phase, meta?.winnerUid, meUid, onBattleComplete]);

  // Load move info
  useEffect(() => {
    if (!legalMoves.length) return;
    const newMoves = legalMoves.filter(m => m.id && !moveInfo[m.id]);
    if (!newMoves.length) return;
    let cancelled = false;
    Promise.all(newMoves.map(async m => {
      try {
        const data = await getMove(m.id);
        return { id: m.id, data };
      } catch { return null; }
    })).then(results => {
      if (cancelled) return;
      const updates: Record<string, any> = {};
      for (const r of results) {
        if (!r) continue;
        updates[r.id] = {
          displayName: r.data.name,
          type: typeof r.data.type === 'string' ? r.data.type.toLowerCase() : r.data.type || 'normal',
          damage_class: r.data.category?.toLowerCase(),
          power: r.data.power,
          accuracy: r.data.accuracy,
          pp: r.data.pp,
          short_effect: r.data.shortEffect,
        };
      }
      if (Object.keys(updates).length > 0) {
        setMoveInfo(prev => ({ ...prev, ...updates }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [legalMoves, moveInfo]);

  const myActive = useMemo(() => {
    if (!pub || !meUid) return null;
    const side = pub.p1;
    return side?.active ?? null;
  }, [pub, meUid]);

  const oppActive = useMemo(() => {
    if (!pub) return null;
    const side = pub.p2;
    return side?.active ?? null;
  }, [pub]);

  const myTeam = useMemo(() => me?.team ?? [], [me]);

  const handleMoveSelection = useCallback(async (moveId: string) => {
    if (!meta || waitingForResolution) return;
    setPendingAction({ turn: meta.turn, type: 'move', id: moveId });
    try {
      await chooseMove(moveId);
    } catch (e: unknown) {
      console.error('Move selection failed:', e);
    }
    setPendingAction(null);
  }, [meta, waitingForResolution, chooseMove]);

  const handlePokemonSwitch = useCallback(async (idx: number) => {
    if (!meta || waitingForResolution) return;
    setPendingAction({ turn: meta.turn, type: 'switch', id: idx });
    try {
      await chooseSwitch(idx);
    } catch (e: unknown) {
      console.error('Switch failed:', e);
    }
    setPendingAction(null);
  }, [meta, waitingForResolution, chooseSwitch]);

  const handleForfeit = useCallback(async () => {
    if (window.confirm('Are you sure you want to forfeit?')) {
      await forfeit();
    }
  }, [forfeit]);

  const resolveTeamSpecies = (mon: any): string => {
    return mon?.species || mon?.pokemon?.name || 'unknown';
  };

  const renderSpriteImage = (species: string | undefined, opts: { variant?: string; shiny?: boolean; animatedPreferred?: boolean; size?: number; className?: string } = {}) => {
    if (!species) return null;
    const variant: 'front' | 'back' = opts.variant === 'back' ? 'back' : 'front';
    const normalizedShiny = !!opts.shiny;
    const speciesId = getPokemonIdFromSpecies(species) ?? null;
    const staticSprite = getPokemonBattleImageWithFallback(speciesId, variant, normalizedShiny);
    const shouldAnimate = !!opts.animatedPreferred && spriteMode === 'animated';
    const animatedSprite = shouldAnimate ? getShowdownAnimatedSprite(species, variant, normalizedShiny) : null;
    const sources = [animatedSprite, staticSprite.primary, staticSprite.fallback, '/placeholder-pokemon.png']
      .filter((src): src is string => !!src && src.length > 0);
    if (!sources.length) return null;
    return (
      <Image
        src={sources[0]}
        alt={formatPokemonName(species)}
        width={opts.size || 48}
        height={opts.size || 48}
        className={opts.className || 'w-12 h-12 object-contain'}
        unoptimized
        onError={(event) => {
          const target = event.currentTarget;
          const fallbackIndex = Number(target.dataset.fallbackIndex || '0') + 1;
          if (fallbackIndex < sources.length) {
            target.dataset.fallbackIndex = String(fallbackIndex);
            target.src = sources[fallbackIndex];
          }
        }}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <img src="/loading.gif" alt="Loading" width={96} height={96} />
        <p className="text-muted">Preparing battle...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4" role="alert">
        <p className="text-red-500">Battle error: {error}</p>
        <button
          type="button"
          className="rounded-md border border-border px-4 py-2 text-sm"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
        <a href="/battle/" className="text-sm text-primary underline">
          Return to battle setup
        </a>
      </div>
    );
  }

  if (!meta || !pub) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted">Initializing battle...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Battle Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 px-3 py-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              role="status"
              aria-live="polite"
              className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm"
            >
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary/80" />
              {meta.phase === 'ended' ? 'Battle Over' : meta.phase === 'resolving' ? 'Resolving...' : 'Your Turn'}
            </span>
            <span className="text-xs text-muted" data-testid="turn-counter">Turn {meta.turn}</span>
          </div>
          <div className="text-sm font-medium text-muted">
            vs {meta.players.p2.name}
          </div>
        </div>
      </div>

      {/* Battle Field */}
      <div className="relative flex-1 p-3 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:gap-8 h-full">
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
                hp={myActive.hp}
                status={myActive.status as any}
                types={myActive.types || []}
                side="player"
                className="transform scale-110"
                spriteMode={spriteMode}
              />
            )}
          </div>

          {/* Opponent Side */}
          <div className="flex flex-col justify-center items-center">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">{meta.players.p2.name}</h2>
            </div>
            {oppActive && (
              <BattleSprite
                ref={opponentSpriteRef}
                species={oppActive.species}
                level={oppActive.level}
                hp={oppActive.hp}
                status={oppActive.status as any}
                types={oppActive.types || []}
                side="opponent"
                className="transform scale-110"
                spriteMode={spriteMode}
              />
            )}
          </div>
        </div>

        <BattleTextBox
          battleLog={pub?.battleLog}
          myActiveSpecies={myActive?.species}
          waitingForResolution={waitingForResolution}
        />
      </div>

      {/* Action Panel */}
      {meta.phase !== 'ended' && (
        <div className="border-t border-border bg-surface/90 backdrop-blur p-3 sm:p-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>

            {waitingForResolution && (
              <div
                role="status"
                aria-live="polite"
                className="mb-4 flex items-center justify-center gap-2 text-sm text-muted"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Resolving turn...
              </div>
            )}

            {/* Move Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Moves</h4>
              <div className="grid grid-cols-2 gap-3">
                {legalMoves.map((move, index) => {
                  const info = moveInfo[move.id];
                  const prettyLabel = formatMoveLabel(info?.displayName || move.id);
                  const isSelected = pendingAction?.type === 'move' && pendingAction.id === move.id;
                  const disabled = !!move.disabled || waitingForResolution;
                  const tooltipContent = info ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold capitalize text-text">{prettyLabel}</span>
                        <span className="text-[11px] uppercase tracking-wide text-muted">{(info.damage_class || 'Status').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs text-muted">
                        <div><div className="uppercase tracking-wide text-[10px]">Power</div><div className="text-sm text-text">{info.power ?? '—'}</div></div>
                        <div><div className="uppercase tracking-wide text-[10px]">Accuracy</div><div className="text-sm text-text">{info.accuracy != null ? `${info.accuracy}%` : '—'}</div></div>
                        <div><div className="uppercase tracking-wide text-[10px]">PP</div><div className="text-sm text-text">{info.pp ?? '—'}</div></div>
                      </div>
                      {info.short_effect && <p className="text-xs leading-snug text-muted">{info.short_effect}</p>}
                    </div>
                  ) : null;
                  return (
                    <button
                      type="button"
                      key={move.id}
                      onClick={() => handleMoveSelection(move.id)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-lg border border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5 hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${isSelected ? 'border-primary/80 bg-primary/10' : ''}`}
                      data-testid={`move-${move.id}`}
                    >
                      <div className="font-medium capitalize">
                        {tooltipContent ? (
                          <Tooltip content={tooltipContent} type={(info?.type as any) || 'normal'} damageClass={info?.damage_class} variant="move" position="top" containViewport={false} maxWidth="w-[22rem]">
                            <span className="cursor-help">{prettyLabel}</span>
                          </Tooltip>
                        ) : (
                          <span>{prettyLabel}</span>
                        )}
                      </div>
                      <div className="text-sm text-muted">PP: {move.pp}{move.maxPp ? ` / ${move.maxPp}` : ''}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pokemon Switch */}
            <div className="mb-4">
              <h4 className="font-medium mb-3">Switch Pokemon</h4>
              <div className="grid grid-cols-3 gap-2">
                {myTeam.map((pokemon, index) => {
                  const speciesName = resolveTeamSpecies(pokemon);
                  const hpCur = pokemon.hp?.cur ?? 0;
                  const hpMax = pokemon.hp?.max ?? pokemon.stats?.hp ?? 0;
                  const isPending = pendingAction?.type === 'switch' && pendingAction.id === index;
                  const switchDisabled = pokemon.fainted || index === (me?.currentIndex ?? 0) || !legalSwitchIndexes.includes(index) || waitingForResolution;
                  return (
                    <button
                      type="button"
                      key={speciesName || `slot-${index}`}
                      onClick={() => handlePokemonSwitch(index)}
                      disabled={switchDisabled}
                      aria-pressed={isPending}
                      className={`p-2 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        switchDisabled ? 'border-border bg-surface cursor-not-allowed opacity-60' : 'border-border bg-surface hover:border-primary/50 hover:bg-primary/5'
                      } ${isPending ? 'border-primary/80 bg-primary/10' : ''}`}
                      data-testid={`switch-${speciesName}-${index}`}
                    >
                      <div className="flex items-center gap-2">
                        {renderSpriteImage(speciesName, { variant: 'front', size: 32, className: 'w-8 h-8 object-contain' })}
                        <div className="text-sm font-medium capitalize truncate">{formatPokemonName(speciesName)}</div>
                      </div>
                      <div className="text-xs text-muted">HP: {hpCur} / {hpMax}</div>
                      {pokemon.fainted && <div className="text-xs text-red-500">Fainted</div>}
                      {index === (me?.currentIndex ?? 0) && <div className="text-xs text-muted">Active</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Forfeit Button */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForfeit}
                className="inline-flex items-center justify-center rounded-md border border-red-600/60 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/15 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                data-testid="forfeit-button"
              >
                Forfeit Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Battle End Screen */}
      {showEndScreen && meta && (
        <BattleEndScreen
          winner={meta.winnerUid === meUid ? 'player' : meta.winnerUid === oppUid ? 'opponent' : null}
          playerName="You"
          opponentName={meta.players.p2.name || 'Opponent'}
          endReason={meta.endedReason}
          battleStats={{ turns: meta.turn }}
          returnTo={{ path: '/battle', label: 'Back to Battles' }}
        />
      )}
    </div>
  );
};

export default OfflineBattleComponent;
