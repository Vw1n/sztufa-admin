import { useState, useEffect, useRef } from 'react';
import { teamApi, matchApi, seasonApi } from '../../../api/service';
import { TeamDTO, MatchDTO, SeasonDTO, AuthUser } from '../../../api/types';
import { Team } from '../../../types';
import { mapTeamDtoToModel } from '../utils/teamMapper';

const PAGE_SIZE = 10;

export function useTeamDirectory(user?: AuthUser | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allMatches, setAllMatches] = useState<MatchDTO[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [activeSeasonName, setActiveSeasonName] = useState<string>('');

  const [seasons, setSeasons] = useState<SeasonDTO[]>([]);
  const [filterSeasonId, setFilterSeasonId] = useState<string>('all');

  const teamsRequestIdRef = useRef(0);
  const matchesRequestIdRef = useRef(0);

  useEffect(() => {
    const initPage = async () => {
      try {
        const seasonList = await seasonApi.getAll();
        setSeasons(seasonList || []);

        const active = (seasonList || []).find((s: SeasonDTO) => s.status === 'active');
        if (active) {
          setFilterSeasonId(active.id);
          setActiveSeasonId(active.id);
          setActiveSeasonName(active.name);
        }
      } catch (err) {
        console.error('加载赛季列表失败:', err);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    loadTeams(currentPage, filterSeasonId);
  }, [currentPage, filterSeasonId, seasons]);

  useEffect(() => {
    if (filterSeasonId !== 'all') {
      loadActiveSeasonAndMatchesForSeason(filterSeasonId);
    } else {
      setAllMatches([]);
    }
  }, [filterSeasonId, seasons]);

  const loadActiveSeasonAndMatchesForSeason = async (seasonId: string) => {
    const requestId = ++matchesRequestIdRef.current;
    try {
      const response = await matchApi.getAll(1, 200, undefined, seasonId === 'all' ? undefined : seasonId);

      if (requestId !== matchesRequestIdRef.current) return;

      setAllMatches(response.data || []);

      const currentSeason = seasons.find(s => s.id === seasonId);
      if (currentSeason) {
        setActiveSeasonId(currentSeason.id);
        setActiveSeasonName(currentSeason.name);
      }
    } catch (err) {
      if (requestId !== matchesRequestIdRef.current) return;
      console.error('加载比赛记录失败:', err);
    }
  };

  const loadTeams = async (page = currentPage, seasonId = filterSeasonId) => {
    const requestId = ++teamsRequestIdRef.current;
    setIsLoading(true);
    try {
      let gender = 'MALE';
      if (seasonId !== 'all') {
        const currentSeason = seasons.find(s => s.id === seasonId);
        if (currentSeason && (currentSeason.name.includes('女') || currentSeason.name.includes('女子'))) {
          gender = 'FEMALE';
        }
      } else {
        gender = 'all';
      }

      const response = await teamApi.getAll(
        user?.role === 'coach' ? 1 : page,
        user?.role === 'coach' ? 100 : PAGE_SIZE,
        seasonId === 'all' ? undefined : seasonId,
        gender === 'all' ? undefined : gender
      );

      if (requestId !== teamsRequestIdRef.current) return;

      const teamList: Team[] = response.data.map((t: TeamDTO) => mapTeamDtoToModel(t));
      if (user && user.role === 'coach') {
        const coachTeamId = user.teamId;
        const filteredTeams = teamList.filter(t => t.id === coachTeamId);
        setTeams(filteredTeams);
        setTotalTeams(filteredTeams.length);
        if (filteredTeams.length > 0) {
          setSelectedTeam(filteredTeams[0]);
        }
      } else {
        setTeams(teamList);
        setTotalTeams(response.total);
        // Reconcile the detail panel with the freshly loaded season result.
        // A team filtered out by a season change/migration must not leave its
        // stale global roster visible under the current season.
        setSelectedTeam((previous) => {
          if (!previous) return null;
          return teamList.find((team) => team.id === previous.id) || null;
        });
      }
    } catch (err) {
      if (requestId !== teamsRequestIdRef.current) return;
      console.error('加载球队列表失败:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        setError('请先登录系统');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      if (requestId === teamsRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSeasonChange = (seasonId: string) => {
    setFilterSeasonId(seasonId);
    setCurrentPage(1);
    setSelectedTeam(null);
  };

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalTeams / PAGE_SIZE);
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setError(null);
  };

  return {
    teams,
    setTeams,
    currentPage,
    setCurrentPage,
    totalTeams,
    setTotalTeams,
    selectedTeam,
    setSelectedTeam,
    isLoading,
    setIsLoading,
    error,
    setError,
    allMatches,
    activeSeasonId,
    activeSeasonName,
    seasons,
    filterSeasonId,
    pageSize: PAGE_SIZE,
    loadTeams,
    handleSeasonChange,
    handlePageChange,
    handleViewTeam,
  };
}
