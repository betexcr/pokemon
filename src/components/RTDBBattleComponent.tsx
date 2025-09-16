import React, { useEffect, useRef, useState } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import Tooltip from '@/components/Tooltip';
// duplicate import removed
import { getMove } from '@/lib/moveCache';
import { getAbility } from '@/lib/api';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, getPokemonImageWithFallbacks, formatPokemonName } from '@/lib/utils';
import HitShake from '@/components/battle/HitShake';
import HPBar from '@/components/battle/HPBar';
import StatusPopups, { StatusEvent } from '@/components/battle/StatusPopups';
import AttackAnimator from '@/components/battle/AttackAnimator';
import { FxKind } from '@/components/battle/fx/MoveFX.types';

interface RTDBBattleComponentProps {
  battleId: string;
  onBattleComplete?: (winner: string) => void;
  viewMode?: 'animated' | 'classic';
}

// Pokemon Image Component for Battle View
interface PokemonBattleImageProps {
  species: string;
  variant: 'front' | 'back';
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

function PokemonBattleImage({ species, variant, className = '', size = 'medium' }: PokemonBattleImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const pokemonId = getPokemonIdFromSpecies(species);
  const { primary, fallbacks } = pokemonId ? getPokemonImageWithFallbacks(pokemonId, species, variant) : { primary: '', fallbacks: [] };
  
  // Reset image state when species changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
  }, [species, variant]);
  
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  if (!pokemonId) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-gray-200 rounded-lg flex items-center justify-center`}>
        <span className="text-gray-500 text-xs">?</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center overflow-hidden`}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
      
      <img
        src={currentImageIndex === 0 ? primary : fallbacks[currentImageIndex - 1]}
        alt={`${formatPokemonName(species)} ${variant}`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          const nextIndex = currentImageIndex + 1;
          
          if (nextIndex <= fallbacks.length) {
            // Try next fallback
            setCurrentImageIndex(nextIndex);
            setImageLoaded(false);
            setImageError(false);
          } else {
            // All fallbacks failed
            setImageError(true);
          }
        }}
        loading="lazy"
      />
      
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
          <span className="text-lg">?</span>
        </div>
      )}
    </div>
  );
}

export const RTDBBattleComponent: React.FC<RTDBBattleComponentProps> = ({
  battleId,
  onBattleComplete,
  viewMode = 'classic'
}) => {
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

  // Get current active Pokemon
  const myActive = meUid ? pub[meUid]?.active : null;
  const oppActive = oppUid ? pub[oppUid]?.active : null;
  const myTeam = me?.team || [];

  return (
    <div className="battle-container">
      {/* Battle Header */}
      <div className="battle-header mb-4">
        <h2 className="text-2xl font-bold text-center">
          Battle Phase: {meta.phase}
        </h2>
        <div className="text-center text-sm text-gray-600">
          Turn: {meta.turn} | Time Left: {timeLeftSec}s
        </div>
      </div>

      {/* Battle Field */}
      <div className="battle-field grid grid-cols-2 gap-6 mb-6">
        {/* Player Side */}
        <div className="player-side">
          <h3 className="text-lg font-semibold mb-4">Your Pokemon</h3>
          {myActive && (
            <div className="pokemon-card p-4 mb-4 rounded-lg border-2 border-blue-500 bg-blue-50 shadow-lg">
              <div className="flex items-start gap-4" ref={playerAnimRef}>
                {/* Pokemon Image (Back view for player) */}
                {viewMode === 'animated' ? (
                  <HitShake playKey={playerShakeKey}>
                    <PokemonBattleImage 
                      species={myActive.species} 
                      variant="back" 
                      size="large"
                      className="flex-shrink-0"
                    />
                  </HitShake>
                ) : (
                  <PokemonBattleImage 
                    species={myActive.species} 
                    variant="back" 
                    size="large"
                    className="flex-shrink-0"
                  />
                )}
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(myActive.species)}
                  </div>
                  <div className="space-y-1 text-sm">
                    {viewMode === 'animated' ? (
                      <HPBar 
                        max={myActive.hp.max} 
                        value={myActive.hp.cur} 
                        showText={true}
                      />
                    ) : (
                      <div className="pokemon-hp">
                        <span className="font-medium">HP:</span> {myActive.hp.cur}/{myActive.hp.max}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(myActive.hp.cur / myActive.hp.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="pokemon-level">
                      <span className="font-medium">Level:</span> {myActive.level}
                    </div>
                    {myActive.status && (
                      <div className="pokemon-status text-red-600 font-medium">
                        Status: {myActive.status}
                      </div>
                    )}
                    {myActive.volatiles && (
                      <div className="volatiles text-purple-600 space-y-1">
                        {myActive.volatiles.taunt && (
                          <div className="text-xs">Taunt ({myActive.volatiles.taunt.turnsLeft} turns)</div>
                        )}
                        {myActive.volatiles.encore && (
                          <div className="text-xs">Encore ({myActive.volatiles.encore.turnsLeft} turns)</div>
                        )}
                        {myActive.volatiles.recharge && (
                          <div className="text-xs">Recharge</div>
                        )}
                        {myActive.volatiles.subHp && (
                          <div className="text-xs">Substitute ({myActive.volatiles.subHp} HP)</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Bench Pokemon */}
          <div className="bench-pokemon">
            <h4 className="font-semibold mb-3 text-gray-700">Bench</h4>
            <div className="grid grid-cols-2 gap-2">
              {myTeam.slice(1).map((pokemon, index) => (
                <div
                  key={index}
                  className={`pokemon-card p-3 rounded-lg border text-sm transition-all duration-200 ${
                    pokemon.fainted 
                      ? 'opacity-50 border-gray-300 bg-gray-100' 
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PokemonBattleImage 
                      species={pokemon.species} 
                      variant="back" 
                      size="small"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="pokemon-name font-medium capitalize truncate">
                        {formatPokemonName(pokemon.species)}
                      </div>
                      <div className="pokemon-hp text-xs text-gray-600">
                        HP: {pokemon.stats.hp}
                      </div>
                      {pokemon.fainted && (
                        <div className="text-xs text-red-600 font-medium">Fainted</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="opponent-side">
          <h3 className="text-lg font-semibold mb-4">Opponent Pokemon</h3>
          {oppActive && (
            <div className="pokemon-card p-4 mb-4 rounded-lg border-2 border-red-500 bg-red-50 shadow-lg">
              <div className="flex items-start gap-4" ref={oppAnimRef}>
                {/* Pokemon Image (Front view for opponent) */}
                {viewMode === 'animated' ? (
                  <HitShake playKey={opponentShakeKey}>
                    <PokemonBattleImage 
                      species={oppActive.species} 
                      variant="front" 
                      size="large"
                      className="flex-shrink-0"
                    />
                  </HitShake>
                ) : (
                  <PokemonBattleImage 
                    species={oppActive.species} 
                    variant="front" 
                    size="large"
                    className="flex-shrink-0"
                  />
                )}
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(oppActive.species)}
                  </div>
                  <div className="space-y-1 text-sm">
                    {viewMode === 'animated' ? (
                      <HPBar 
                        max={oppActive.hp.max} 
                        value={oppActive.hp.cur} 
                        showText={true}
                      />
                    ) : (
                      <div className="pokemon-hp">
                        <span className="font-medium">HP:</span> {oppActive.hp.cur}/{oppActive.hp.max}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(oppActive.hp.cur / oppActive.hp.max) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    <div className="pokemon-level">
                      <span className="font-medium">Level:</span> {oppActive.level}
                    </div>
                    {oppActive.status && (
                      <div className="pokemon-status text-red-600 font-medium">
                        Status: {oppActive.status}
                      </div>
                    )}
                    {oppActive.volatiles && (
                      <div className="volatiles text-purple-600 space-y-1">
                        {oppActive.volatiles.taunt && (
                          <div className="text-xs">Taunt ({oppActive.volatiles.taunt.turnsLeft} turns)</div>
                        )}
                        {oppActive.volatiles.encore && (
                          <div className="text-xs">Encore ({oppActive.volatiles.encore.turnsLeft} turns)</div>
                        )}
                        {oppActive.volatiles.recharge && (
                          <div className="text-xs">Recharge</div>
                        )}
                        {oppActive.volatiles.subHp && (
                          <div className="text-xs">Substitute ({oppActive.volatiles.subHp} HP)</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Selection */}
      {meta.phase === 'choosing' && (
        <div className="action-selection">
          <h3 className="text-lg font-semibold mb-4">Choose Your Action</h3>
          
          {/* Move Selection */}
          <div className="moves-section mb-4">
            <h4 className="font-medium mb-2">Moves</h4>
            <div className="grid grid-cols-2 gap-2">
              {legalMoves.map((move, index) => (
                <button
                  key={index}
                  onClick={() => handleMoveSelection(move.id)}
                  className={`move-button p-2 rounded text-white hover:opacity-90 disabled:opacity-50 ${
                    move.disabled ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                  disabled={move.disabled}
                  title={move.reason}
                >
                  <div className="font-medium capitalize">
                    <Tooltip
                      content={moveInfo[move.id]?.short_effect || ''}
                      type={(moveInfo[move.id]?.type as any) || 'normal'}
                      damageClass={moveInfo[move.id]?.damage_class}
                      variant="move"
                      position="top"
                      containViewport
                      maxWidth="w-80"
                    >
                      <span className="cursor-help">{move.id}</span>
                    </Tooltip>
                  </div>
                  <div className="text-xs">PP: {move.pp}</div>
                  {move.reason && (
                    <div className="text-xs text-red-200">{move.reason}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pokemon Switch */}
          <div className="switch-section">
            <h4 className="font-medium mb-3">Switch Pokemon</h4>
            <div className="grid grid-cols-2 gap-3">
              {myTeam.map((pokemon, index) => (
                <button
                  key={index}
                  onClick={() => handlePokemonSwitch(index)}
                  className={`switch-button p-3 rounded-lg border-2 transition-all duration-200 ${
                    index === 0
                      ? 'border-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                      : legalSwitchIndexes.includes(index)
                      ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600 hover:shadow-md'
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  }`}
                  disabled={index === 0 || !legalSwitchIndexes.includes(index)}
                >
                  <div className="flex items-center gap-3">
                    <PokemonBattleImage 
                      species={pokemon.species} 
                      variant="back" 
                      size="small"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium capitalize truncate">
                        {formatPokemonName(pokemon.species)}
                      </div>
                      <div className="text-xs text-gray-600">
                        HP: {pokemon.stats.hp}
                      </div>
                      {pokemon.fainted && (
                        <div className="text-xs text-red-600 font-medium">Fainted</div>
                      )}
                      {index === 0 && (
                        <div className="text-xs text-gray-500">Active</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Forfeit Button */}
          <div className="forfeit-section mt-4">
            <button
              onClick={forfeit}
              className="forfeit-button p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Forfeit Battle
            </button>
          </div>
        </div>
      )}

      {/* Battle Log */}
      <div className="battle-log mt-6">
        <h3 className="text-lg font-semibold mb-2">Battle Log</h3>
        <div className="log-container max-h-40 overflow-y-auto bg-gray-100 p-3 rounded">
          {pub.lastResultSummary && (
            <div className="log-entry text-sm mb-1">
              {pub.lastResultSummary}
            </div>
          )}
        </div>
      </div>

      {/* Battle Complete */}
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

      {meta.phase === 'ended' && (
        <div className="battle-complete mt-6 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {meta.winnerUid === meUid ? 'Victory!' : 'Defeat!'}
          </h2>
          <p className="text-lg">
            {meta.winnerUid === meUid
              ? 'You won the battle!'
              : 'You lost the battle!'}
          </p>
          {meta.endedReason && (
            <p className="text-sm text-gray-600 mt-2">
              Reason: {meta.endedReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RTDBBattleComponent;
