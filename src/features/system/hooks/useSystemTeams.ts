import { useCallback, useEffect, useRef, useState } from 'react';
import { teamApi } from '../../../api/service';
import { TeamDTO } from '../../../api/types';

export const useSystemTeams = (seasonId?: string, requireSeason = false) => {
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const requestIdRef = useRef(0);

  const loadTeams = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (requireSeason && !seasonId) {
      setTeams([]);
      return;
    }

    if (requireSeason) {
      setTeams([]);
    }

    try {
      const response = await teamApi.getAll(1, 1000, seasonId);
      if (requestId === requestIdRef.current) {
        setTeams(response.data || []);
      }
    } catch (error) {
      console.error('加载球队列表失败:', error);
    }
  }, [requireSeason, seasonId]);

  useEffect(() => {
    void loadTeams();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadTeams]);

  return { teams, loadTeams };
};
