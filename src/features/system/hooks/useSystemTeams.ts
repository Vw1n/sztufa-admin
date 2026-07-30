import { useCallback, useEffect, useState } from 'react';
import { teamApi } from '../../../api/service';
import { TeamDTO } from '../../../api/types';

export const useSystemTeams = (seasonId?: string) => {
  const [teams, setTeams] = useState<TeamDTO[]>([]);

  const loadTeams = useCallback(async () => {
    try {
      const response = await teamApi.getAll(1, 1000, seasonId);
      setTeams(response.data || []);
    } catch (error) {
      console.error('加载球队列表失败:', error);
    }
  }, [seasonId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return { teams, loadTeams };
};
