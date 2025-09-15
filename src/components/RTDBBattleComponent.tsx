import React, { useEffect, useState } from 'react';
import { useBattleState } from '@/hooks/useBattleState';
import { getPokemonIdFromSpecies, getPokemonBattleImageWithFallback, formatPokemonName } from '@/lib/utils';

interface RTDBBattleComponentProps {
  battleId: string;
  onBattleComplete?: (winner: string) => void;
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

export const RTDBBattleComponent: React.FC<RTDBBattleComponentProps> = ({
  battleId,
  onBattleComplete
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

  // Handle battle completion
  useEffect(() => {
    if (meta?.phase === 'ended' && meta.winnerUid && onBattleComplete) {
      onBattleComplete(meta.winnerUid);
    }
  }, [meta?.phase, meta?.winnerUid, onBattleComplete]);

  const handleMoveSelection = async (moveId: string, target?: 'p1' | 'p2') => {
    try {
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
              <div className="flex items-start gap-4">
                {/* Pokemon Image (Back view for player) */}
                <PokemonBattleImage 
                  species={myActive.species} 
                  variant="back" 
                  size="large"
                  className="flex-shrink-0"
                />
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(myActive.species)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="pokemon-hp">
                      <span className="font-medium">HP:</span> {myActive.hp.cur}/{myActive.hp.max}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(myActive.hp.cur / myActive.hp.max) * 100}%` }}
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
              <div className="flex items-start gap-4">
                {/* Pokemon Image (Front view for opponent) */}
                <PokemonBattleImage 
                  species={oppActive.species} 
                  variant="front" 
                  size="large"
                  className="flex-shrink-0"
                />
                
                {/* Pokemon Info */}
                <div className="flex-1 min-w-0">
                  <div className="pokemon-name font-bold text-lg capitalize mb-2">
                    {formatPokemonName(oppActive.species)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="pokemon-hp">
                      <span className="font-medium">HP:</span> {oppActive.hp.cur}/{oppActive.hp.max}
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(oppActive.hp.cur / oppActive.hp.max) * 100}%` }}
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
                  <div className="font-medium capitalize">{move.id}</div>
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
