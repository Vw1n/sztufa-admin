import { useState, useEffect } from 'react';
import { teamApi } from '../../../api/service';
import { TeamDTO, PlayerDTO } from '../../../api/types';
import { filterTeamsForGroup, SeasonGroupAssignment } from '../utils/matchForm';

export function useMatchTeams(
  seasonId?: string,
  homeTeamId?: string,
  awayTeamId?: string,
  activeSeasonType?: string,
  stage?: string,
  groupName?: string,
  seasonGroups: SeasonGroupAssignment[] = [],
  setError?: (msg: string | null) => void,
) {
  const [availableTeams, setAvailableTeams] = useState<TeamDTO[]>([]);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);

  const loadTeams = async (targetSeasonId?: string) => {
    try {
      const response = await teamApi.getAll(1, 100, targetSeasonId || seasonId);
      setAvailableTeams(response.data);
    } catch (err) {
      console.error('加载球队列表失败:', err);
    }
  };

  const loadTeamPlayers = async (teamId: string, teamType: 'home' | 'away') => {
    if (!teamId) {
      if (teamType === 'home') setHomeTeamPlayers([]);
      else setAwayTeamPlayers([]);
      return;
    }
    try {
      const players = await teamApi.getPlayers(teamId, seasonId || undefined);
      let playerList = Array.isArray(players) ? players : (players as { data?: PlayerDTO[] })?.data ?? [];

      if (playerList.length === 0) {
        const cachedTeam = availableTeams.find(t => t.id === teamId);
        if (cachedTeam?.players && cachedTeam.players.length > 0) {
          playerList = cachedTeam.players;
        } else {
          try {
            const fullTeam = await teamApi.getById(teamId);
            if (fullTeam?.players && fullTeam.players.length > 0) {
              playerList = fullTeam.players;
            }
          } catch (fetchErr) {
            console.error('获取球队详情球员失败:', fetchErr);
          }
        }
      }

      if (teamType === 'home') {
        setHomeTeamPlayers(playerList);
      } else {
        setAwayTeamPlayers(playerList);
      }
    } catch (err) {
      console.error('加载球队球员失败:', err);
      const cachedTeam = availableTeams.find(t => t.id === teamId);
      if (cachedTeam?.players && cachedTeam.players.length > 0) {
        if (teamType === 'home') {
          setHomeTeamPlayers(cachedTeam.players);
        } else {
          setAwayTeamPlayers(cachedTeam.players);
        }
      } else if (setError) {
        setError('加载球队名单失败，请检查是否已有活跃赛季，或球队是否已录入球员名册');
      }
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (homeTeamId) {
      loadTeamPlayers(homeTeamId, 'home');
    } else {
      setHomeTeamPlayers([]);
    }
  }, [homeTeamId, seasonId, availableTeams]);

  useEffect(() => {
    if (awayTeamId) {
      loadTeamPlayers(awayTeamId, 'away');
    } else {
      setAwayTeamPlayers([]);
    }
  }, [awayTeamId, seasonId, availableTeams]);

  const getFilteredTeams = (
    overrideSeasonType?: string,
    overrideStage?: string,
    overrideGroupName?: string,
    overrideSeasonGroups?: SeasonGroupAssignment[],
  ) => {
    const sType = overrideSeasonType ?? activeSeasonType;
    const sStage = overrideStage ?? stage;
    const gName = overrideGroupName ?? (groupName || 'A');
    const sGroups = overrideSeasonGroups ?? seasonGroups;

    if (sType === 'CUP' && sStage === 'GROUP') {
      return filterTeamsForGroup(availableTeams, sGroups, gName);
    }
    return availableTeams;
  };

  return {
    availableTeams,
    homeTeamPlayers,
    awayTeamPlayers,
    loadTeams,
    loadTeamPlayers,
    getFilteredTeams,
  };
}
