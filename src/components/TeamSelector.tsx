'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTeams, type SavedTeam } from '@/lib/userTeams';
import { ChevronDown, Users, Check, Cloud, CloudOff, Wifi } from 'lucide-react';
import Image from 'next/image';
import AuthModal from '@/components/auth/AuthModal';

// Local storage team type (simpler version)
interface LocalTeam {
  id: string;
  name: string;
  slots: Array<{ id: number | null; level: number; moves: unknown[] }>;
}

interface TeamSelectorProps {
  selectedTeamId?: string;
  onTeamSelect: (team: SavedTeam | LocalTeam | null) => void;
  disabled?: boolean;
  label?: string;
  showStorageIndicator?: boolean;
}

const STORAGE_KEY = 'pokemon-team-builder';
const CURRENT_TEAM_KEY = 'pokemon-current-team';

// Function to get Pokemon image URL
const getPokemonImageUrl = (pokemonId: number | null): string => {
  if (!pokemonId) return '/placeholder-pokemon.png';
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;
};

export default function TeamSelector({ 
  selectedTeamId, 
  onTeamSelect, 
  disabled = false,
  label = "Select Team",
  showStorageIndicator = true
}: TeamSelectorProps) {
  const { user, loading: authLoading } = useAuth();
  const [teams, setTeams] = useState<(SavedTeam | LocalTeam)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | LocalTeam | null>(null);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Helper: load teams from localStorage with robust fallbacks
  const loadLocalTeams = (): LocalTeam[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as LocalTeam[];
        // Some older formats may store as an object with a teams property
        if (parsed && Array.isArray(parsed.teams)) return parsed.teams as LocalTeam[];
      }
    } catch {}

    // Fallback: construct a single team from CURRENT_TEAM_KEY if present
    try {
      const currentRaw = localStorage.getItem(CURRENT_TEAM_KEY);
      if (currentRaw) {
        const current = JSON.parse(currentRaw);
        if (current && Array.isArray(current.slots)) {
          const fallbackTeam: LocalTeam = {
            id: 'current-team',
            name: current.name || 'Current Team',
            slots: current.slots.map((s: any) => ({ id: s?.id ?? null, level: s?.level ?? 50, moves: Array.isArray(s?.moves) ? s.moves : [] })),
          };
          return [fallbackTeam];
        }
      }
    } catch {}

    return [];
  };

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve to avoid flashing "No teams"

    const loadTeams = async () => {
      try {
        setLoading(true);
        if (user) {
          const userTeams = await getUserTeams(user.uid);
          setTeams(userTeams);
          setIsUsingLocalStorage(false);
          if (selectedTeamId) {
            const team = userTeams.find(t => t.id === selectedTeamId);
            setSelectedTeam(team || null);
          } else if (userTeams.length > 0 && !selectedTeam) {
            const firstTeam = userTeams[0];
            setSelectedTeam(firstTeam);
            onTeamSelect(firstTeam);
          }
        } else {
          const localTeams: LocalTeam[] = loadLocalTeams();
          if (localTeams.length > 0) {
            setTeams(localTeams);
            setIsUsingLocalStorage(true);
            if (selectedTeamId) {
              const team = localTeams.find(t => t.id === selectedTeamId);
              setSelectedTeam(team || null);
            } else if (localTeams.length > 0 && !selectedTeam) {
              const firstTeam = localTeams[0];
              setSelectedTeam(firstTeam);
              onTeamSelect(firstTeam);
            }
          } else {
            setTeams([]);
            setIsUsingLocalStorage(true);
          }
        }
      } catch (error) {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();

    const onStorage = (e: StorageEvent) => {
      if (!user && (e.key === STORAGE_KEY || e.key === CURRENT_TEAM_KEY)) {
        setLoading(true);
        const locals = loadLocalTeams();
        setTeams(locals);
        if (locals.length > 0 && !selectedTeam) {
          setSelectedTeam(locals[0]);
          onTeamSelect(locals[0]);
        }
        setLoading(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user, authLoading, selectedTeamId]);

  const handleTeamSelect = (team: SavedTeam | LocalTeam) => {
    setSelectedTeam(team);
    onTeamSelect(team);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    setSelectedTeam(null);
    onTeamSelect(null);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-black dark:text-text mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 flex items-center gap-3">
          <img src="/loading.gif" alt="Loading teams" className="w-5 h-5" />
          <span className="text-sm text-gray-700">Loading teams…</span>
        </div>
      </div>
    );
  }

  if (!user && teams.length === 0) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-black dark:text-text mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800 dark:text-muted text-sm">
          No teams saved. <a href="/team" className="text-blue-600 hover:underline">Create a team</a> or <button onClick={() => setShowAuthModal(true)} className="text-blue-600 hover:underline bg-transparent border-none cursor-pointer">sign in</button> to access cloud teams.
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-black dark:text-text mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-800 dark:text-muted text-sm">
          No teams saved. <a href="/team" className="text-blue-600 hover:underline">Create a team</a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-black dark:text-text">
          {label}
        </label>
        {showStorageIndicator && (
          <div className="flex items-center space-x-1 text-xs">
            {isUsingLocalStorage ? (
              <>
                <CloudOff className="h-3 w-3 text-orange-500" />
                <span className="text-orange-600">Local</span>
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3 text-blue-500" />
                <span className="text-blue-600">Cloud</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg p-3 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            {selectedTeam ? (
              <>
                {/* Selected team preview thumbnails */}
                <div className="flex -space-x-1">
                  {selectedTeam.slots.slice(0, 6).map((slot, index) => (
                    <div
                      key={index}
                      className="relative w-5 h-5 rounded-full border border-white bg-gray-100 overflow-hidden"
                    >
                      {slot.id ? (
                        <>
                          <Image
                            src={getPokemonImageUrl(slot.id)}
                            alt={`Pokemon ${slot.id}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-pokemon.png';
                              const loader = (target.parentElement?.querySelector('[data-img-loader]') as HTMLElement | null);
                              if (loader) loader.style.display = 'none';
                            }}
                            onLoadingComplete={(img) => {
                              const loader = (img as any).parentElement?.querySelector('[data-img-loader]') as HTMLElement | null;
                              if (loader) loader.style.display = 'none';
                            }}
                          />
                          <img src="/loading.gif" alt="Loading" className="absolute inset-0 m-auto w-2.5 h-2.5 opacity-80" data-img-loader />
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-black dark:text-text">{selectedTeam.name}</span>
              </>
            ) : (
              <>
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-800 dark:text-muted">Choose a team...</span>
              </>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <div className="p-2">
              <button
                onClick={handleClearSelection}
                className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-muted hover:bg-gray-100 rounded flex items-center space-x-2"
              >
                <span>No team selected</span>
              </button>
            </div>
            
            {teams.map((team) => (
              <div key={team.id} className="p-2">
                <button
                  onClick={() => handleTeamSelect(team)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    {/* Pokemon Roster Images */}
                    <div className="flex -space-x-1">
                      {team.slots.slice(0, 6).map((slot, index) => (
                        <div
                          key={index}
                          className="relative w-6 h-6 rounded-full border border-white bg-gray-100 overflow-hidden"
                        >
                          {slot.id ? (
                            <>
                              <Image
                                src={getPokemonImageUrl(slot.id)}
                                alt={`Pokemon ${slot.id}`}
                                fill
                                className="object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-pokemon.png';
                                  const loader = (target.parentElement?.querySelector('[data-img-loader]') as HTMLElement | null);
                                  if (loader) loader.style.display = 'none';
                                }}
                                onLoadingComplete={(img) => {
                                  const loader = (img as any).parentElement?.querySelector('[data-img-loader]') as HTMLElement | null;
                                  if (loader) loader.style.display = 'none';
                                }}
                              />
                              <img src="/loading.gif" alt="Loading" className="absolute inset-0 m-auto w-3 h-3 opacity-80" data-img-loader />
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="font-medium text-black dark:text-text">{team.name}</div>
                      <div className="text-xs text-gray-800 dark:text-muted">
                        {team.slots.filter(slot => slot.id).length}/6 Pokémon
                      </div>
                    </div>
                  </div>
                  {selectedTeam?.id === team.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              </div>
            ))}
            
            {/* Go Online Option - only show when not authenticated */}
            {!user && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Wifi className="h-4 w-4" />
                  <span>Go online to save your teams!</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
}
