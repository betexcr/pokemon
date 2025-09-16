import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createFirebaseBattleSyncManager, FirebaseBattleSyncConfig } from '@/lib/firebase-battle-sync';
import { battleService, MultiplayerBattleState } from '@/lib/battleService';
import { BattleState, BattleAction } from '@/lib/team-battle-engine';
import Tooltip from '@/components/Tooltip';
import { getMove } from '@/lib/moveCache';
import { getAbility } from '@/lib/api';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, formatPokemonName } from '@/lib/utils';
import HitShake from '@/components/battle/HitShake';
import HPBar from '@/components/battle/HPBar';
import StatusPopups, { StatusEvent } from '@/components/battle/StatusPopups';
import AttackAnimator from '@/components/battle/AttackAnimator';
import { FxKind } from '@/components/battle/fx/MoveFX.types';
import { 
  checkBattleParticipation, 
  checkBattleActionPermission, 
  handlePermissionError,
  logPermissionError 
} from '@/lib/permissionUtils';

interface FirestoreBattleComponentProps {
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
  
  const pokemonId = getPokemonIdFromSpecies(species);
  const { primary, fallback } = pokemonId ? getPokemonBattleImageWithFallback(pokemonId, variant) : { primary: '', fallback: '' };
  
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
        src={primary}
        alt={`${formatPokemonName(species)} ${variant}`}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src === primary) {
            target.src = fallback;
          } else {
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

export const FirestoreBattleComponent: React.FC<FirestoreBattleComponentProps> = ({
  battleId,
  onBattleComplete,
  viewMode = 'classic'
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [battle, setBattle] = useState<MultiplayerBattleState | null>(null);
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [syncManager, setSyncManager] = useState<any>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'host' | 'guest'>('host');
  const [turnNumber, setTurnNumber] = useState(1);
  const [phase, setPhase] = useState<'choice' | 'resolution' | 'end_of_turn' | 'replacement' | 'selection' | 'execution'>('choice');
  const [timeLeftSec, setTimeLeftSec] = useState(45);
  const [legalMoves, setLegalMoves] = useState<Array<{ id: string; pp: number; disabled?: boolean; reason?: string }>>([]);
  const [legalSwitchIndexes, setLegalSwitchIndexes] = useState<number[]>([]);
  const [moveInfo, setMoveInfo] = useState<Record<string, { type: string; damage_class?: 'physical'|'special'|'status'; short_effect?: string }>>({});
  const [myAbilityInfo, setMyAbilityInfo] = useState<{ name: string; short_effect?: string } | null>(null);
  
  // Transition effects state
  const [playerShakeKey, setPlayerShakeKey] = useState(0);
  const [opponentShakeKey, setOpponentShakeKey] = useState(0);
  const [statusEvents, setStatusEvents] = useState<StatusEvent[]>([]);
  const [activeMoveFX, setActiveMoveFX] = useState<{ kind: FxKind; key: number } | null>(null);

  // Refs for animations
  const playerAnimRef = useRef<HTMLDivElement>(null);
  const oppAnimRef = useRef<HTMLDivElement>(null);

  // Initialize battle sync manager
  useEffect(() => {
    if (!user || !battleId) return;

    const initializeBattle = async () => {
      try {
        setLoading(true);
        setError(null);

        // Enhanced permission check using utility functions
        const battleData = await battleService.getBattle(battleId);
        if (!battleData) {
          throw new Error('Battle not found');
        }

        // Use permission utility to check battle participation
        const participationCheck = checkBattleParticipation(user, battleData);
        if (!participationCheck.hasPermission) {
          throw new Error(participationCheck.error || 'Permission denied');
        }

        setBattle(battleData);
        setIsHost(battleData.hostId === user.uid);
        setCurrentTurn(battleData.currentTurn || 'host');
        setTurnNumber(battleData.turnNumber || 1);
        setPhase(battleData.phase || 'choice');

        // Initialize sync manager
        const config: FirebaseBattleSyncConfig = {
          battleId,
          playerId: user.uid,
          isHost: battleData.hostId === user.uid
        };

        const manager = createFirebaseBattleSyncManager(config);
        await manager.initialize();
        setSyncManager(manager);

        // Set up battle state listener
        const unsubscribe = manager.onStateChange((state: BattleState) => {
          setBattleState(state);
          setPhase(state.phase);
          setTurnNumber(state.turn);
          
          // Update legal moves and switches based on current state
          updateLegalActions(state);
          
          // Check for battle completion
          if (state.isComplete && onBattleComplete) {
            const winner = state.player.faintedCount >= state.player.pokemon.length ? 'opponent' : 'player';
            onBattleComplete(winner);
          }
        });

        // Set up battle data listener
        const battleUnsubscribe = battleService.onBattleChange(battleId, (updatedBattle) => {
          if (updatedBattle) {
            setBattle(updatedBattle);
            setCurrentTurn(updatedBattle.currentTurn || 'host');
            setTurnNumber(updatedBattle.turnNumber || 1);
            setPhase(updatedBattle.phase || 'choice');
          }
        });

        setLoading(false);

        return () => {
          unsubscribe();
          battleUnsubscribe();
          manager.disconnect();
        };
      } catch (err) {
        console.error('Failed to initialize battle:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize battle');
        setLoading(false);
      }
    };

    initializeBattle();
  }, [user, battleId, onBattleComplete]);

  // Update legal actions based on battle state
  const updateLegalActions = (state: BattleState) => {
    if (!state.player.pokemon[state.player.currentIndex]) return;

    const activePokemon = state.player.pokemon[state.player.currentIndex];
    const moves = activePokemon.moves || [];
    
    // Calculate legal moves
    const legalMovesList = moves.map(move => {
      let disabled = false;
      let reason = '';
      
      if (move.pp <= 0) {
        disabled = true;
        reason = 'No PP';
      }
      
      return {
        id: move.id,
        pp: move.pp,
        disabled,
        reason: disabled ? reason : undefined
      };
    });
    
    setLegalMoves(legalMovesList);

    // Calculate legal switches
    const switchIndexes: number[] = [];
    for (let i = 0; i < state.player.pokemon.length; i++) {
      if (i !== state.player.currentIndex && 
          state.player.pokemon[i].currentHp > 0) {
        switchIndexes.push(i);
      }
    }
    setLegalSwitchIndexes(switchIndexes);
  };

  // Load move information
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

  // Load ability information
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!battleState?.player.pokemon[battleState.player.currentIndex]) return;
      
      const abilityId = battleState.player.pokemon[battleState.player.currentIndex].pokemon.abilities?.[0]?.ability?.name;
      if (!abilityId) { setMyAbilityInfo(null); return; }
      
      try {
        const ab: any = await getAbility(abilityId);
        const english = (ab.effect_entries || []).find((e: any) => e.language?.name === 'en');
        if (!cancelled) setMyAbilityInfo({ name: ab.name, short_effect: english?.short_effect || english?.effect });
      } catch { if (!cancelled) setMyAbilityInfo({ name: String(abilityId) }); }
    };
    load();
    return () => { cancelled = true; };
  }, [battleState?.player.pokemon, battleState?.player.currentIndex]);

  // Handle move selection
  const handleMoveSelection = async (moveId: string) => {
    if (!syncManager) return;
    
    try {
      // Use permission utility to check battle action permissions
      const isCurrentTurn = (currentTurn === 'host' && isHost) || (currentTurn === 'guest' && !isHost);
      const actionCheck = checkBattleActionPermission(user, battle, isCurrentTurn);
      if (!actionCheck.hasPermission) {
        throw new Error(actionCheck.error || 'Cannot perform this action');
      }
      
      // Classic view: give immediate feedback on action
      playAnim(playerAnimRef, 'animate-bounce');
      await syncManager.selectMove(moveId, moveId);
    } catch (err) {
      const errorMessage = handlePermissionError(err, 'Failed to submit move');
      logPermissionError('move_selection', err, { battleId, moveId, userId: user?.uid });
      setError(errorMessage);
    }
  };

  // Handle Pokemon switch
  const handlePokemonSwitch = async (pokemonIndex: number) => {
    if (!syncManager) return;
    
    try {
      // Use permission utility to check battle action permissions
      const isCurrentTurn = (currentTurn === 'host' && isHost) || (currentTurn === 'guest' && !isHost);
      const actionCheck = checkBattleActionPermission(user, battle, isCurrentTurn);
      if (!actionCheck.hasPermission) {
        throw new Error(actionCheck.error || 'Cannot perform this action');
      }
      
      // Validation check: Ensure the switch index is legal
      if (!legalSwitchIndexes.includes(pokemonIndex)) {
        throw new Error('Invalid Pokemon switch selection');
      }
      
      await syncManager.switchPokemon(pokemonIndex);
    } catch (err) {
      const errorMessage = handlePermissionError(err, 'Failed to switch Pokemon');
      logPermissionError('pokemon_switch', err, { battleId, pokemonIndex, userId: user?.uid });
      setError(errorMessage);
    }
  };

  // Lightweight CSS animations for classic view
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

  // Handle battle completion
  useEffect(() => {
    if (battleState?.isComplete && onBattleComplete) {
      const winner = battleState.player.faintedCount >= battleState.player.pokemon.length ? 'opponent' : 'player';
      onBattleComplete(winner);
    }
  }, [battleState?.isComplete, onBattleComplete]);

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

  if (!battle || !battleState) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Waiting for battle data...</div>
      </div>
    );
  }

  // Get current active Pokemon
  const myActive = battleState.player.pokemon[battleState.player.currentIndex];
  const oppActive = battleState.opponent.pokemon[battleState.opponent.currentIndex];
  const myTeam = battleState.player.pokemon;

  return (
    <div className="battle-container">
      {/* Battle Header */}
      <div className="battle-header mb-4">
        <h2 className="text-2xl font-bold text-center">
          Battle Phase: {phase}
        </h2>
        <div className="text-center text-sm text-gray-600">
          Turn: {turnNumber} | Time Left: {timeLeftSec}s
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
                <PokemonBattleImage 
                  species={myActive.pokemon.name} 
                  variant="back" 
                  size="large"
                  className="flex-shrink-0"
                />
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(myActive.pokemon.name)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="pokemon-hp">
                      <span className="font-medium">HP:</span> {myActive.currentHp}/{myActive.maxHp}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(myActive.currentHp / myActive.maxHp) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="pokemon-level">
                      <span className="font-medium">Level:</span> {myActive.level}
                    </div>
                    {myActive.status && (
                      <div className="pokemon-status text-red-600 font-medium">
                        Status: {myActive.status}
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
                    pokemon.currentHp <= 0 
                      ? 'opacity-50 border-gray-300 bg-gray-100' 
                      : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <PokemonBattleImage 
                      species={pokemon.pokemon.name} 
                      variant="back" 
                      size="small"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="pokemon-name font-medium capitalize truncate">
                        {formatPokemonName(pokemon.pokemon.name)}
                      </div>
                      <div className="pokemon-hp text-xs text-gray-600">
                        HP: {pokemon.currentHp}/{pokemon.maxHp}
                      </div>
                      {pokemon.currentHp <= 0 && (
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
                <PokemonBattleImage 
                  species={oppActive.pokemon.name} 
                  variant="front" 
                  size="large"
                  className="flex-shrink-0"
                />
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(oppActive.pokemon.name)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="pokemon-hp">
                      <span className="font-medium">HP:</span> {oppActive.currentHp}/{oppActive.maxHp}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(oppActive.currentHp / oppActive.maxHp) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="pokemon-level">
                      <span className="font-medium">Level:</span> {oppActive.level}
                    </div>
                    {oppActive.status && (
                      <div className="pokemon-status text-red-600 font-medium">
                        Status: {oppActive.status}
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
      {phase === 'choice' && (
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
                    index === battleState.player.currentIndex
                      ? 'border-gray-400 bg-gray-100 cursor-not-allowed opacity-60'
                      : legalSwitchIndexes.includes(index)
                      ? 'border-green-500 bg-green-50 hover:bg-green-100 hover:border-green-600 hover:shadow-md'
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  }`}
                  disabled={index === battleState.player.currentIndex || !legalSwitchIndexes.includes(index)}
                >
                  <div className="flex items-center gap-3">
                    <PokemonBattleImage 
                      species={pokemon.pokemon.name} 
                      variant="back" 
                      size="small"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-medium capitalize truncate">
                        {formatPokemonName(pokemon.pokemon.name)}
                      </div>
                      <div className="text-xs text-gray-600">
                        HP: {pokemon.currentHp}/{pokemon.maxHp}
                      </div>
                      {pokemon.currentHp <= 0 && (
                        <div className="text-xs text-red-600 font-medium">Fainted</div>
                      )}
                      {index === battleState.player.currentIndex && (
                        <div className="text-xs text-gray-500">Active</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Battle Log */}
      <div className="battle-log mt-6">
        <h3 className="text-lg font-semibold mb-2">Battle Log</h3>
        <div className="log-container max-h-40 overflow-y-auto bg-gray-100 p-3 rounded">
          {battleState.battleLog && battleState.battleLog.length > 0 && (
            <div className="log-entry text-sm mb-1">
              {battleState.battleLog[battleState.battleLog.length - 1]?.message}
            </div>
          )}
        </div>
      </div>

      {/* Battle Complete */}
      {battleState.isComplete && (
        <div className="battle-complete mt-6 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {battleState.player.faintedCount >= battleState.player.pokemon.length ? 'Defeat!' : 'Victory!'}
          </h2>
          <p className="text-lg">
            {battleState.player.faintedCount >= battleState.player.pokemon.length
              ? 'You lost the battle!'
              : 'You won the battle!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default FirestoreBattleComponent;
