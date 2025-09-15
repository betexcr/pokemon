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
  const { user } = useAuth();
  const [teams, setTeams] = useState<(SavedTeam | LocalTeam)[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | LocalTeam | null>(null);
  const [isUsingLocalStorage, setIsUsingLocalStorage] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const loadTeams = async () => {
      try {
        console.log('TeamSelector: Loading teams for user:', user?.uid, user?.displayName);
        if (user) {
          // Load from Firebase for authenticated users
          console.log('TeamSelector: Loading cloud teams...');
          const userTeams = await getUserTeams(user.uid);
          console.log('TeamSelector: Loaded cloud teams:', userTeams);
          setTeams(userTeams);
          setIsUsingLocalStorage(false);
          
          // Set selected team if teamId is provided
          if (selectedTeamId) {
            const team = userTeams.find(t => t.id === selectedTeamId);
            setSelectedTeam(team || null);
          } else if (userTeams.length > 0 && !selectedTeam) {
            // Auto-select first team if no team is currently selected
            const firstTeam = userTeams[0];
            setSelectedTeam(firstTeam);
            onTeamSelect(firstTeam);
          }
        } else {
          // Load from local storage for non-authenticated users
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const localTeams: LocalTeam[] = JSON.parse(raw);
            setTeams(localTeams);
            setIsUsingLocalStorage(true);
            
            // Set selected team if teamId is provided
            if (selectedTeamId) {
              const team = localTeams.find(t => t.id === selectedTeamId);
              setSelectedTeam(team || null);
            } else if (localTeams.length > 0 && !selectedTeam) {
              // Auto-select first team if no team is currently selected
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
        console.error('Failed to load teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user, selectedTeamId]);

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
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
          <div className="animate-pulse flex items-center space-x-3">
            <div className="h-4 w-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded flex-1"></div>
          </div>
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
            <Users className="h-4 w-4 text-gray-400" />
            <span className={selectedTeam ? "text-black dark:text-text" : "text-gray-800 dark:text-muted"}>
              {selectedTeam ? selectedTeam.name : "Choose a team..."}
            </span>
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
                            <Image
                              src={getPokemonImageUrl(slot.id)}
                              alt={`Pokemon ${slot.id}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-pokemon.png';
                              }}
                            />
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
                    console.log('TeamSelector auth button clicked, setting showAuthModal to true');
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
