import { useState, useEffect, useCallback, useRef } from 'react';
import { seasonApi } from '../../../api/service';
import { SeasonDTO } from '../../../api/types';
import { SeasonGroupAssignment } from '../utils/matchForm';

export function useMatchSeason(
  setFormDataSeason: (seasonId: string, stage: string, groupName: string) => void,
  onSeasonChangeLoadTeams: (seasonId: string) => Promise<void>,
) {
  const [activeSeasons, setActiveSeasons] = useState<SeasonDTO[]>([]);
  const [activeSeason, setActiveSeason] = useState<SeasonDTO | null>(null);
  const [seasonGroups, setSeasonGroups] = useState<SeasonGroupAssignment[]>([]);
  const callbacksRef = useRef({ setFormDataSeason, onSeasonChangeLoadTeams });
  const activeSeasonsRef = useRef(activeSeasons);
  callbacksRef.current = { setFormDataSeason, onSeasonChangeLoadTeams };
  activeSeasonsRef.current = activeSeasons;

  const loadActiveSeasons = useCallback(async () => {
    try {
      const allSeasons = await seasonApi.getAll();
      const actives = (allSeasons || []).filter((s: SeasonDTO) => s.status === 'active');
      setActiveSeasons(actives);

      if (actives.length > 0) {
        const defaultSeason = actives[0];
        setActiveSeason(defaultSeason);

        const stage = defaultSeason.type === 'CUP' ? 'GROUP' : 'LEAGUE';
        const groupName = defaultSeason.type === 'CUP' ? 'A' : '';
        callbacksRef.current.setFormDataSeason(defaultSeason.id, stage, groupName);

        await callbacksRef.current.onSeasonChangeLoadTeams(defaultSeason.id);

        if (defaultSeason.type === 'CUP') {
          const groups = await seasonApi.getGroups(defaultSeason.id);
          setSeasonGroups(groups || []);
        }
      }
    } catch (err) {
      console.error('加载活跃赛季列表失败:', err);
    }
  }, []);

  const handleSeasonSelect = useCallback(async (seasonId: string) => {
    const selected = activeSeasonsRef.current.find(s => s.id === seasonId);
    if (!selected) return;

    setActiveSeason(selected);
    await callbacksRef.current.onSeasonChangeLoadTeams(seasonId);

    const stage = selected.type === 'CUP' ? 'GROUP' : 'LEAGUE';
    const groupName = selected.type === 'CUP' ? 'A' : '';
    callbacksRef.current.setFormDataSeason(seasonId, stage, groupName);

    if (selected.type === 'CUP') {
      try {
        const groups = await seasonApi.getGroups(seasonId);
        setSeasonGroups(groups || []);
      } catch (err) {
        console.error('加载赛季分组失败:', err);
      }
    } else {
      setSeasonGroups([]);
    }
  }, []);

  useEffect(() => {
    void loadActiveSeasons();
  }, [loadActiveSeasons]);

  return {
    activeSeasons,
    activeSeason,
    seasonGroups,
    loadActiveSeasons,
    handleSeasonSelect,
  };
}
