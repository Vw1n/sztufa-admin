import { useEffect, useState } from 'react';
import { seasonApi } from '../../../api/service';
import { SeasonDTO } from '../../../api/types';
import { Player, TeamFormData } from '../../../types';
import { generateId } from '../../../utils';
import {
  getCompatibleActiveSeasons,
  selectActiveSeasonId,
  validateTeamCreation,
} from '../../team-create';

/**
 * 球队录入表单状态 Hook。
 *
 * 职责：
 * - 球队表单数据（teamFormData）与球员列表（players）的本地状态；
 * - 活跃赛季加载与性别兼容筛选；
 * - 球员 CRUD（增删改、批量导入）；
 * - 表单校验（validateTeamCreation）。
 *
 * 不负责：保存到服务端、PDF 导入队列、导出文件。
 * 这些分别由 useTeamEntrySave / usePdfTeamDraftQueue / team-entry-export 处理。
 */
export function useTeamEntryForm() {
  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    teamName: '',
    teamDoctor: '',
    headCoach: '',
    teamLeader: '',
    coachPhone: '',
    leaderPhone: '',
    homeJerseyColor: '',
    awayJerseyColor: '',
    teamLogo: null,
    homeJersey: null,
    awayJersey: null,
    gender: 'MALE',
    seasonId: '',
  });

  const [players, setPlayers] = useState<Player[]>([]);
  const [activeSeasons, setActiveSeasons] = useState<SeasonDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 加载活跃赛季
  useEffect(() => {
    let cancelled = false;
    seasonApi
      .getAll()
      .then((seasons) => {
        if (!cancelled) {
          setActiveSeasons(seasons.filter((season) => season.status === 'active'));
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : '未知错误';
          setError(`加载活跃赛季失败：${message}`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const compatibleActiveSeasons = getCompatibleActiveSeasons(
    activeSeasons,
    teamFormData.gender,
  );

  // 赛季或性别变化时自动选择兼容赛季
  useEffect(() => {
    setTeamFormData((previous) => {
      const seasonId = selectActiveSeasonId(
        activeSeasons,
        previous.gender,
        previous.seasonId,
      );
      if (seasonId === previous.seasonId) {
        return previous;
      }
      return { ...previous, seasonId };
    });
  }, [activeSeasons, teamFormData.gender]);

  const handleAddPlayer = (player: Omit<Player, 'id'>) => {
    const sId = String(player.studentId || '').trim();
    const jNum = String(player.jerseyNumber ?? '').trim();
    setPlayers((prev) => [
      ...prev,
      { ...player, studentId: sId, jerseyNumber: jNum, id: generateId() },
    ]);
    setError(null);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setError(null);
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    setError(null);
  };

  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    const newItems = importedPlayers.map((p) => ({
      ...p,
      studentId: String(p.studentId ?? '').trim(),
      jerseyNumber: String(p.jerseyNumber ?? '').trim(),
      id: generateId(),
    }));

    setPlayers((prev) => [...prev, ...newItems]);
    setError(null);
    alert(`成功导入 ${importedPlayers.length} 名球员`);
  };

  const validateForm = (): boolean => {
    const validationError = validateTeamCreation(teamFormData, players);
    setError(validationError);
    return validationError === null;
  };

  return {
    teamFormData,
    setTeamFormData,
    players,
    setPlayers,
    compatibleActiveSeasons,
    error,
    setError,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleImportPlayers,
    validateForm,
  };
}

export type UseTeamEntryFormReturn = ReturnType<typeof useTeamEntryForm>;
