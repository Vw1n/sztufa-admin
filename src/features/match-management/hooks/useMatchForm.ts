import { useState } from 'react';
import { MatchFormData } from '../../../types';
import { TeamDTO } from '../../../api/types';
import { useMatchSeason } from './useMatchSeason';
import { useMatchTeams } from './useMatchTeams';
import { useMatchLineup } from './useMatchLineup';
import { useMatchEvents } from './useMatchEvents';
import { useMatchSubmission } from './useMatchSubmission';

export const useMatchForm = () => {
  const [formData, setFormData] = useState<MatchFormData>({
    matchName: '',
    matchTime: '',
    homeTeamName: '',
    awayTeamName: '',
    homeTeamScore: '',
    awayTeamScore: '',
    homeTeamGoals: [],
    awayTeamGoals: [],
    events: [],
    homeTeamId: '',
    awayTeamId: '',
    matchDate: '',
    location: '',
    status: 'finished',
    stage: 'LEAGUE',
    groupName: '',
    knockoutRound: '',
    knockoutMatchIndex: '',
    seasonId: '',
  });

  const submission = useMatchSubmission();

  const handleSetFormDataSeason = (seasonId: string, stage: string, groupName: string) => {
    setFormData(prev => ({
      ...prev,
      seasonId,
      stage,
      groupName,
      knockoutRound: '',
      knockoutMatchIndex: '',
    }));
  };

  const teams = useMatchTeams(
    formData.seasonId,
    formData.homeTeamId,
    formData.awayTeamId,
    undefined,
    formData.stage,
    formData.groupName,
    [],
    submission.setError,
  );

  const season = useMatchSeason(
    handleSetFormDataSeason,
    teams.loadTeams,
  );

  const lineup = useMatchLineup();

  const events = useMatchEvents(
    formData,
    setFormData,
    submission.setError,
    teams.homeTeamPlayers,
    teams.awayTeamPlayers,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    submission.setError(null);
  };

  const handleTeamSelect = (teamType: 'home' | 'away', team: TeamDTO) => {
    if (teamType === 'home') {
      setFormData(prev => ({
        ...prev,
        homeTeamId: team.id || '',
        homeTeamName: team.teamName,
      }));
      teams.loadTeamPlayers(team.id || '', 'home');
      lineup.clearLineupForTeam('home');
    } else {
      setFormData(prev => ({
        ...prev,
        awayTeamId: team.id || '',
        awayTeamName: team.teamName,
      }));
      teams.loadTeamPlayers(team.id || '', 'away');
      lineup.clearLineupForTeam('away');
    }
    submission.setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    return submission.handleSubmit(e, formData, lineup.lineups, () => {
      lineup.setLineups([]);
    });
  };

  const getFilteredTeams = () => {
    return teams.getFilteredTeams(
      season.activeSeason?.type,
      formData.stage,
      formData.groupName,
      season.seasonGroups,
    );
  };

  return {
    formData,
    setFormData,
    activeSeasons: season.activeSeasons,
    activeSeason: season.activeSeason,
    seasonGroups: season.seasonGroups,
    isSaved: submission.isSaved,
    isLoading: submission.isLoading,
    isVerifyingTeams: submission.isVerifyingTeams,
    error: submission.error,
    setError: submission.setError,
    savedMatch: submission.savedMatch,
    availableTeams: teams.availableTeams,
    homeTeamPlayers: teams.homeTeamPlayers,
    awayTeamPlayers: teams.awayTeamPlayers,
    lineups: lineup.lineups,
    handleLineupChange: lineup.handleLineupChange,
    handleSeasonSelect: season.handleSeasonSelect,
    getFilteredTeams,
    addEvent: events.addEvent,
    removeEvent: events.removeEvent,
    updateEvent: events.updateEvent,
    handleEventPlayerSelect: events.handleEventPlayerSelect,
    handleSubPlayerSelect: events.handleSubPlayerSelect,
    handleAssistPlayerSelect: events.handleAssistPlayerSelect,
    handleSubmit,
    handleChange,
    handleTeamSelect,
  };
};
