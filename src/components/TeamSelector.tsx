'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserTeams, type SavedTeam } from '@/lib/userTeams';
import { ChevronDown, Users, Check } from 'lucide-react';

interface TeamSelectorProps {
  selectedTeamId?: string;
  onTeamSelect: (team: SavedTeam | null) => void;
  disabled?: boolean;
  label?: string;
}

export default function TeamSelector({ 
  selectedTeamId, 
  onTeamSelect, 
  disabled = false,
  label = "Select Team"
}: TeamSelectorProps) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<SavedTeam | null>(null);

  useEffect(() => {
    const loadTeams = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userTeams = await getUserTeams(user.uid);
        setTeams(userTeams);
        
        // Set selected team if teamId is provided
        if (selectedTeamId) {
          const team = userTeams.find(t => t.id === selectedTeamId);
          setSelectedTeam(team || null);
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, [user, selectedTeamId]);

  const handleTeamSelect = (team: SavedTeam) => {
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
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

  if (!user) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-500 text-sm">
          Sign in to select a team
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-500 text-sm">
          No teams saved. <a href="/team" className="text-blue-600 hover:underline">Create a team</a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg p-3 bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <Users className="h-4 w-4 text-gray-400" />
            <span className={selectedTeam ? "text-gray-900" : "text-gray-500"}>
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
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded flex items-center space-x-2"
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
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{team.name}</div>
                      <div className="text-xs text-gray-500">
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
          </div>
        )}
      </div>

      {selectedTeam && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm">
            <div className="font-medium text-blue-900 mb-1">{selectedTeam.name}</div>
            <div className="text-blue-700">
              {selectedTeam.slots.filter(slot => slot.id).length} Pokémon selected
            </div>
            {selectedTeam.description && (
              <div className="text-blue-600 text-xs mt-1">{selectedTeam.description}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
