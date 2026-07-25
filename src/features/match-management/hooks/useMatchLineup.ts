import { useState } from 'react';
import { MatchLineup } from '../utils/matchForm';

export function useMatchLineup() {
  const [lineups, setLineups] = useState<MatchLineup[]>([]);

  const handleLineupChange = (
    playerId: string,
    teamType: 'home' | 'away',
    lineupType: 'starting' | 'substitute' | 'none'
  ) => {
    let updatedLineups = [...lineups];
    updatedLineups = updatedLineups.filter(l => l.playerId !== playerId);
    if (lineupType !== 'none') {
      updatedLineups.push({
        playerId,
        teamType,
        lineupType,
      });
    }
    setLineups(updatedLineups);
  };

  const clearLineupForTeam = (teamType: 'home' | 'away') => {
    setLineups(prev => prev.filter(l => l.teamType !== teamType));
  };

  return {
    lineups,
    setLineups,
    handleLineupChange,
    clearLineupForTeam,
  };
}
