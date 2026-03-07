import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import Tooltip from '@/components/Tooltip';
import { getMove } from '@/lib/moveCache';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, formatPokemonName, getShowdownAnimatedSprite } from '@/lib/utils';
import HitShake from '@/components/battle/HitShake';
import StatusPopups, { StatusEvent } from '@/components/battle/StatusPopups';
import AttackAnimator from '@/components/battle/AttackAnimator';
import { FxKind } from '@/components/battle/fx/MoveFX.types';
import { BattleSprite, BattleSpriteRef } from '@/components/battle/BattleSprite';
import Image from 'next/image';
import { BattleTurnManager } from '@/components/multiplayer/BattleTurnManager';
import { BattleEndScreen } from '@/components/multiplayer/BattleEndScreen';
import { useForfeit } from '@/hooks/useMultiplayerBattle';

const formatMoveLabel = (rawId: string): string => {
  if (!rawId) return 'Unknown Move';
  return rawId
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

/* ─── Pokemon-style text box ────────────────────────────────────────── */

interface GameTextBoxProps {
  battleLog?: any[];
  waitingForResolution: boolean;
  myActiveSpecies?: string | null;
  displayedLogIndex: number;
  onDisplayedLogIndexChange: (idx: number) => void;
}

function GameTextBox({
  battleLog,
  waitingForResolution,
  myActiveSpecies,
  displayedLogIndex,
  onDisplayedLogIndexChange,
}: GameTextBoxProps) {
  const logRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const messages: string[] = useMemo(() => {
    if (!battleLog?.length) return [];
    return battleLog.map((entry: any) =>
      typeof entry === 'string' ? entry : entry?.message ?? ''
    ).filter(Boolean);
  }, [battleLog]);

  // Auto-advance to newest message when the log grows
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      onDisplayedLogIndexChange(messages.length - 1);
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, onDisplayedLogIndexChange]);

  // Scroll into view when index changes
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [displayedLogIndex]);

  const visibleMessages = messages.length > 0
    ? messages.slice(Math.max(0, messages.length - 3))
    : [];

  const idleText = waitingForResolution
    ? null
    : myActiveSpecies
      ? `What will ${formatPokemonName(myActiveSpecies)} do?`
      : null;

  if (visibleMessages.length === 0 && !idleText) return null;

  return (
    <div className="relative z-20 mx-auto mt-4 w-full max-w-xl">
      <div className="relative rounded-xl border-[3px] border-text/20 bg-surface shadow-lg">
        <div className="absolute inset-[3px] rounded-lg border border-text/10 pointer-events-none" />
        <div ref={logRef} className="relative px-5 py-3 min-h-[3.5rem] max-h-28 overflow-y-auto">
          {visibleMessages.length > 0 ? (
            <div className="space-y-1">
              {visibleMessages.map((msg, i) => (
                <p
                  key={`${messages.length}-${i}`}
                  className={`text-sm leading-relaxed text-text ${
                    i === visibleMessages.length - 1
                      ? 'font-medium animate-[typewriter_0.3s_ease-out]'
                      : 'text-text/60'
                  }`}
                >
                  {msg}
                </p>
              ))}
            </div>
          ) : idleText ? (
            <p className="text-sm leading-relaxed text-text font-medium">{idleText}</p>
          ) : null}
        </div>
        {visibleMessages.length > 0 && (
          <div className="absolute bottom-2 right-3">
            <span className="inline-block h-2 w-2 animate-bounce text-text/40">▼</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────── */

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

  useEffect(() => {
    console.log('RTDBBattleComponent: Battle state updated:', {
      hasMeta: !!meta,
      hasPublic: !!pub,
      hasPrivate: !!me,
      phase: meta?.phase,
      turn: meta?.turn,
      publicTurn: pub?.lastResultSummary
    });
  }, [meta, pub, me]);


  // duplicate state/effects removed (using direct imports below)

  const [moveInfo, setMoveInfo] = useState<Record<string, {
    displayName: string;
    type: string;
    damage_class?: 'physical'|'special'|'status';
    short_effect?: string;
    power?: number | null;
    accuracy?: number | null;
    pp?: number | null;
  }>>({});
  
  // Transition effects state
  const [playerShakeKey, setPlayerShakeKey] = useState(0);
  const [opponentShakeKey, setOpponentShakeKey] = useState(0);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [activeMoveFX, setActiveMoveFX] = useState<{ kind: FxKind; key: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ turn: number; type: 'move' | 'switch'; id: string | number } | null>(null);

  // Battle end screen state
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [displayedLogIndex, setDisplayedLogIndex] = useState(-1);

  // Determine if current user is host (p1)
  const isHost = useMemo(() => {
    return meta?.players?.p1?.uid === meUid;
  }, [meta?.players?.p1?.uid, meUid]);

  // Use multiplayer forfeit handler
  const handleForfeit = useForfeit(battleId, meUid || '');

  const waitingForResolution = useMemo(() => {
    if (!meta) return false;
    if (pendingAction && pendingAction.turn === meta.turn) return true;
    return meta.phase === 'resolving';
  }, [meta?.phase, meta?.turn, pendingAction]);

  const activePhase: 'choosing' | 'resolving' = waitingForResolution ? 'resolving' : 'choosing';

  useEffect(() => {
    if (!pendingAction) return;
    if (!meta || meta.phase === 'ended' || meta.turn !== pendingAction.turn) {
      setPendingAction(null);
    }
  }, [meta?.turn, meta?.phase, pendingAction]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const entries = await Promise.all(
        (legalMoves || []).map(async (m) => {
          try {
            const mv: any = await getMove(m.id);
            const english = (mv.effect_entries || []).find((e: any) => e.language?.name === 'en');
            return [
              m.id,
              {
                displayName: typeof mv.name === 'string' ? mv.name : m.id,
                type: mv.type?.name || 'normal',
                damage_class: mv.damage_class?.name || undefined,
                short_effect: english?.short_effect || english?.effect,
                power: typeof mv.power === 'number' ? mv.power : null,
                accuracy: typeof mv.accuracy === 'number' ? mv.accuracy : null,
                pp: typeof mv.pp === 'number' ? mv.pp : null
              }
            ];
          } catch {
            return [m.id, { displayName: m.id, type: 'normal', power: null, accuracy: null, pp: null }];
          }
        })
      );
      if (!cancelled) {
        const next: Record<string, {
          displayName: string;
          type: string;
          damage_class?: 'physical'|'special'|'status';
          short_effect?: string;
          power?: number | null;
          accuracy?: number | null;
          pp?: number | null;
        }> = {};
        for (const [k, v] of entries) next[k as string] = v as any;
        setMoveInfo(next);
      }
    };
    if (legalMoves?.length) run();
    return () => { cancelled = true; };
  }, [legalMoves]);

  // Handle battle completion
  useEffect(() => {
    if (meta?.phase === 'ended') {
      setShowEndScreen(true);
      if (meta.winnerUid && onBattleComplete) {
        onBattleComplete(meta.winnerUid);
      }
    }
  }, [meta?.phase, meta?.winnerUid, onBattleComplete]);

const handleMoveSelection = async (moveId: string, target?: 'p1' | 'p2') => {
  console.log('🎮 handleMoveSelection called:', { moveId, target, hasPub: !!pub, hasMyActive: !!(meUid && (pub as any)?.[meUid]?.active) });
    try {
      if (!meta) {
        console.warn('No battle meta available; cannot select move.');
        return;
      }
      if (meta.phase !== 'choosing') {
        console.warn('Battle not in selection phase; ignoring move input.');
        return;
      }
      if (waitingForResolution && pendingAction && pendingAction.turn === meta.turn) {
        console.warn('Move already selected for this turn; awaiting resolution.');
        return;
      }
      setPendingAction({ turn: meta.turn, type: 'move', id: moveId });
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
      setPendingAction(null);
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
      if (!meta) {
        console.warn('No battle meta available; cannot switch.');
        return;
      }
      if (meta.phase !== 'choosing') {
        console.warn('Battle not in selection phase; ignoring switch input.');
        return;
      }
      if (waitingForResolution && pendingAction && pendingAction.turn === meta.turn) {
        console.warn('Action already submitted; awaiting resolution.');
        return;
      }
      setPendingAction({ turn: meta.turn, type: 'switch', id: pokemonIndex });
      await chooseSwitch(pokemonIndex);
    } catch (err) {
      console.error('Failed to switch Pokemon:', err);
      setPendingAction(null);
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

  // Drive sprite animations from lastResultSummary
  useEffect(() => {
    const line = pub?.lastResultSummary?.toLowerCase?.() || '';
    if (!line) return;
    if (line.includes('used')) {
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

  const renderSpriteImage = useCallback(
    (
      species: string | null | undefined,
      {
        variant,
        shiny = false,
        animatedPreferred = false,
        size = 48,
        className
      }: { variant: 'front' | 'back'; shiny?: boolean; animatedPreferred?: boolean; size?: number; className?: string }
    ) => {
      const normalizedShiny = !!shiny;
      const speciesId = getPokemonIdFromSpecies(species || '') ?? null;
      const staticSprite = getPokemonBattleImageWithFallback(speciesId, variant, normalizedShiny);
      const shouldAnimate = animatedPreferred && viewMode === 'animated';
      const animatedSprite = shouldAnimate ? getShowdownAnimatedSprite(species || undefined, variant, normalizedShiny) : null;
      const sources = [animatedSprite, staticSprite.primary, staticSprite.fallback, '/placeholder-pokemon.png']
        .filter((src): src is string => !!src && src.length > 0);

      return (
        <Image
          src={sources[0]}
          alt={formatPokemonName(species)}
          width={size}
          height={size}
          className={className ?? 'object-contain'}
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
    },
    [viewMode]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Initializing battle...</div>
      </div>
    );
  }


  // If loading or error, show that
  if (loading) return <div className="p-8 text-center">Loading battle...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!meta || !pub) return <div className="p-8 text-center">Waiting for battle data...</div>;

  // Get current active Pokemon using RTDB p1/p2 mapping
  const mySide: 'p1' | 'p2' | null = meUid && meta?.players
    ? (meta.players.p1.uid === meUid ? 'p1' : meta.players.p2.uid === meUid ? 'p2' : null)
    : null;
  const oppSide: 'p1' | 'p2' | null = mySide === 'p1' ? 'p2' : mySide === 'p2' ? 'p1' : null;
  const myActive = mySide && (pub as any)?.[mySide]?.active ? (pub as any)[mySide].active : null;
  const oppActive = oppSide && (pub as any)?.[oppSide]?.active ? (pub as any)[oppSide].active : null;
  const myTeam = me?.team || [];

  const resolveTeamSpecies = (pokemon: any): string | null => {
    if (!pokemon) return null;
    if (typeof pokemon.species === 'string' && pokemon.species.trim()) return pokemon.species;
    if (typeof pokemon.name === 'string' && pokemon.name.trim()) return pokemon.name;
    if (pokemon.pokemon) {
      const nested = pokemon.pokemon;
      if (typeof nested.species === 'string' && nested.species.trim()) return nested.species;
      if (typeof nested.name === 'string' && nested.name.trim()) return nested.name;
    }
    if (typeof pokemon.id === 'number') return `pokemon-${String(pokemon.id).padStart(3, '0')}`;
    return null;
  };

  // (refs declared above)

  return (
    <div className="w-full text-text">
      {/* Headless turn resolution manager (host only) */}
      {meta && meUid && (
        <BattleTurnManager 
          battleId={battleId}
          isHost={isHost}
          userId={meUid}
        />
      )}
      
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6">
      {/* Battle Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 px-3 py-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-sm">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary/80" />
              {meta.phase}
            </span>
            <span className="text-xs text-muted" data-testid="turn-counter">Turn {meta.turn}</span>
            <span className="text-xs text-muted">{timeLeftSec}s</span>
          </div>
          <div className="text-sm text-muted">
            vs Opponent
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-surface/80">
        <div className="py-2 flex items-center justify-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activePhase === 'choosing' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            Selection Phase
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activePhase === 'resolving' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            Resolution Phase
          </span>
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
                hp={{ 
                  cur: myActive.hp.cur, 
                  max: myActive.hp.max 
                }}
                status={myActive.status}
                volatiles={myActive.volatiles}
                types={myActive.types || []}
                side="player"
                shiny={Boolean((myActive as any)?.shiny || (myActive as any)?.isShiny)}
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
                shiny={Boolean((oppActive as any)?.shiny || (oppActive as any)?.isShiny)}
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

        {/* Pokemon-style Battle Text Box */}
        <GameTextBox
          battleLog={pub?.battleLog as any[] | undefined}
          waitingForResolution={waitingForResolution}
          myActiveSpecies={myActive?.species}
          displayedLogIndex={displayedLogIndex}
          onDisplayedLogIndexChange={setDisplayedLogIndex}
        />
      </div>

      {/* Action Panel */}
      {meta.phase !== 'ended' && (
        <div className="border-t border-border bg-surface/90 backdrop-blur p-3 sm:p-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>

            {waitingForResolution && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Waiting for opponent…
              </div>
            )}

          {/* Move Selection */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">Moves</h4>
            <div className="grid grid-cols-2 gap-3">
              {legalMoves.map((move, index) => {
                if (!move?.id) {
                  return (
                    <button
                      key={`move-placeholder-${index}`}
                      type="button"
                      disabled
                      className="p-3 rounded-lg border border-dashed border-border/60 bg-surface/60 text-muted transition-all duration-200"
                    >
                      <div className="font-medium">Move unavailable</div>
                      <div className="text-sm">PP: —</div>
                    </button>
                  );
                }
                const info = moveInfo[move.id];
                const labelSource = info?.displayName || move.id;
                const prettyLabel = formatMoveLabel(labelSource);
                const remainingPpValue = typeof move.pp === 'number' ? move.pp : (typeof (move as any)?.remainingPp === 'number' ? (move as any).remainingPp : undefined);
                const maxPpValue = typeof move.maxPp === 'number' ? move.maxPp : (typeof (move as any)?.maxPp === 'number' ? (move as any).maxPp : undefined);
                const remainingPp = remainingPpValue ?? maxPpValue ?? '—';
                const isSelected = pendingAction?.type === 'move' && pendingAction.turn === meta?.turn && pendingAction.id === move.id;
                const buttonDisabled = !!move.disabled || waitingForResolution;
                const tooltipContent = info ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize text-text">{prettyLabel}</span>
                      <span className="text-[11px] uppercase tracking-wide text-muted">
                        {(info.damage_class || 'Status').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-muted">
                      <div>
                        <div className="uppercase tracking-wide text-[10px]">Power</div>
                        <div className="text-sm text-text">{info.power ?? '—'}</div>
                      </div>
                      <div>
                        <div className="uppercase tracking-wide text-[10px]">Accuracy</div>
                        <div className="text-sm text-text">{info.accuracy != null ? `${info.accuracy}%` : '—'}</div>
                      </div>
                      <div>
                        <div className="uppercase tracking-wide text-[10px]">PP</div>
                        <div className="text-sm text-text">{info.pp ?? '—'}</div>
                      </div>
                    </div>
                    {info.short_effect && (
                      <p className="text-xs leading-snug text-muted">{info.short_effect}</p>
                    )}
                  </div>
                ) : null;
                return (
                  <button
                    key={index}
                    onClick={() => handleMoveSelection(move.id)}
                    disabled={buttonDisabled}
                    aria-pressed={isSelected}
                    className={`p-3 rounded-lg border border-border bg-surface text-text hover:border-primary/50 hover:bg-primary/5 hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${isSelected ? 'border-primary/80 bg-primary/10' : ''}`}
                    data-testid={`move-${move.id}`}
                  >
                    <div className="font-medium capitalize">
                      {tooltipContent ? (
                        <Tooltip
                          content={tooltipContent}
                          type={(info?.type as any) || 'normal'}
                          damageClass={info?.damage_class}
                          variant="move"
                          position="top"
                          containViewport={false}
                          maxWidth="w-[22rem]"
                        >
                          <span className="cursor-help">{prettyLabel}</span>
                        </Tooltip>
                      ) : (
                        <span>{prettyLabel}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted">
                      PP: {typeof remainingPp === 'number' ? remainingPp : remainingPp || '—'}
                      {typeof remainingPp === 'number' && typeof maxPpValue === 'number' ? ` / ${maxPpValue}` : ''}
                    </div>
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
              {myTeam.map((pokemon, index) => {
                const speciesName = resolveTeamSpecies(pokemon);
                const currentHp = typeof pokemon?.hp?.cur === 'number'
                  ? pokemon.hp.cur
                  : typeof (pokemon as any)?.currentHp === 'number'
                    ? (pokemon as any).currentHp
                    : undefined;
                const maxHp = typeof pokemon?.hp?.max === 'number'
                  ? pokemon.hp.max
                  : typeof (pokemon as any)?.maxHp === 'number'
                    ? (pokemon as any).maxHp
                    : typeof pokemon?.stats?.hp === 'number'
                      ? pokemon.stats.hp
                      : undefined;
                const hpLabel = currentHp != null && maxHp != null
                  ? `${currentHp} / ${maxHp}`
                  : currentHp != null
                    ? String(currentHp)
                    : maxHp != null
                      ? `${maxHp}`
                      : '—';
                const isPendingSwitch = pendingAction?.type === 'switch' && pendingAction.turn === meta?.turn && pendingAction.id === index;
                const switchDisabled = pokemon?.fainted || index === 0 || !legalSwitchIndexes.includes(index) || waitingForResolution;

                return (
                  <button
                    key={index}
                    onClick={() => handlePokemonSwitch(index)}
                    disabled={switchDisabled}
                    aria-pressed={isPendingSwitch}
                    className={`p-2 rounded-lg border transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
                      switchDisabled
                        ? 'border-border bg-surface cursor-not-allowed opacity-60'
                        : 'border-border bg-surface hover:border-primary/50 hover:bg-primary/5'
                    } ${isPendingSwitch ? 'border-primary/80 bg-primary/10' : ''}`}
                    data-testid={`switch-${speciesName || 'unknown'}-${index}`}
                  >
                    <div className="flex items-center gap-2">
                      {renderSpriteImage(speciesName, {
                        variant: 'front',
                        shiny: Boolean((pokemon as any)?.shiny || (pokemon as any)?.isShiny),
                        animatedPreferred: false,
                        size: 32,
                        className: 'w-8 h-8 object-contain'
                      })}
                      <div className="text-sm font-medium capitalize truncate">
                        {formatPokemonName(speciesName)}
                      </div>
                    </div>
                    <div className="text-xs text-muted">
                      HP: {hpLabel}
                    </div>
                    {pokemon?.fainted && (
                      <div className="text-xs text-red-500">Fainted</div>
                    )}
                    {index === 0 && (
                      <div className="text-xs text-muted">Active</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forfeit Button */}
          <div className="text-center">
            <button
              onClick={handleForfeit}
              className="inline-flex items-center justify-center rounded-md border border-red-600/60 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-600/15 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              data-testid="forfeit-button"
            >
              Forfeit Battle
            </button>
          </div>
          </div>
        </div>
      )}

        </div>

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
      {showEndScreen && meta && (
        <BattleEndScreen
          winner={meta.winnerUid === meUid ? 'player' : meta.winnerUid === oppUid ? 'opponent' : null}
          playerName={meta.players?.p1?.uid === meUid ? meta.players.p1.name : meta.players?.p2?.name || 'You'}
          opponentName={meta.players?.p1?.uid === oppUid ? meta.players.p1.name : meta.players?.p2?.name || 'Opponent'}
          endReason={meta.endedReason}
          battleStats={{
            turns: meta.turn
          }}
        />
      )}
    </div>
  );
};

export default RTDBBattleComponent;
