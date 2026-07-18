import { useCallback, useEffect, useState } from 'react';
import { matchApi, seasonApi, teamApi } from '../../../api/service';
import { PlayerDTO } from '../../../api/types';
import { Match } from '../../../types';
import { mapMatchDto } from '../utils/matchEditor';

export const useMatchData = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeTeamPlayers, setHomeTeamPlayers] = useState<PlayerDTO[]>([]);
  const [awayTeamPlayers, setAwayTeamPlayers] = useState<PlayerDTO[]>([]);
  const [seasons, setSeasons] = useState<any[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState('all');
  const [seasonsLoaded, setSeasonsLoaded] = useState(false);

  useEffect(() => {
    const loadSeasons = async () => {
      try {
        const data = await seasonApi.getAll();
        setSeasons(data || []);
        const active = data.find((season: any) => season.status === 'active');
        if (active) setSelectedSeasonId(active.id);
      } catch (loadError) {
        console.error('加载赛季列表失败:', loadError);
      } finally {
        setSeasonsLoaded(true);
      }
    };
    void loadSeasons();
  }, []);

  const loadMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await matchApi.getAll(1, 100, undefined, selectedSeasonId);
      const matchList = response.data.map(mapMatchDto);
      setMatches(matchList);
      setSelectedMatch((previous) => {
        if (!previous) return null;
        return matchList.find((match) => match.id === previous.id) || previous;
      });
    } catch (loadError) {
      console.error('加载比赛列表失败:', loadError);
      setError(
        loadError instanceof Error && loadError.message === 'Unauthorized'
          ? '请先登录系统'
          : '网络连接失败，请稍后重试',
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedSeasonId]);

  useEffect(() => {
    if (seasonsLoaded) void loadMatches();
  }, [loadMatches, seasonsLoaded]);

  const loadTeamPlayers = async (
    homeTeamId: string,
    awayTeamId: string,
    seasonId?: string,
  ) => {
    try {
      const [homePlayers, awayPlayers] = await Promise.all([
        teamApi.getPlayers(homeTeamId, seasonId),
        teamApi.getPlayers(awayTeamId, seasonId),
      ]);
      setHomeTeamPlayers(homePlayers);
      setAwayTeamPlayers(awayPlayers);
    } catch (loadError) {
      console.error('加载球队球员失败:', loadError);
    }
  };

  const deleteMatch = async (matchId: string) => {
    if (!confirm('确定要删除这场比赛吗？')) return false;
    setIsLoading(true);
    try {
      await matchApi.delete(matchId);
      void loadMatches();
      if (selectedMatch?.id === matchId) setSelectedMatch(null);
      return true;
    } catch (deleteError) {
      console.error('删除比赛失败:', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : '网络连接失败，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    matches,
    selectedMatch,
    setSelectedMatch,
    isLoading,
    setIsLoading,
    error,
    setError,
    homeTeamPlayers,
    awayTeamPlayers,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    loadMatches,
    loadTeamPlayers,
    deleteMatch,
  };
};
