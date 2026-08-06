import { useState } from 'react';
import { teamApi } from '../../../api/service';
import { TeamDTO } from '../../../api/types';
import { Team, Player } from '../../../types';
import { validateTeamData } from '../utils/teamValidation';
import {
  mapTeamDtoToModel,
  buildPlayerPayload,
  calculateDeletedPlayerIds,
} from '../utils/teamMapper';

export function useTeamEditor(
  setError: (msg: string | null) => void,
  setIsDirectoryLoading: (loading: boolean) => void,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Team | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);

  const handleEditTeam = (team: Team) => {
    setEditData({
      ...team,
      players: team.players ? team.players.map((p) => ({ ...p })) : [],
    });
    setIsEditing(true);
    setError(null);
    setIsSaved(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setError(null);
  };

  const handleFieldChange = (field: keyof Team, value: string) => {
    if (editData) {
      setEditData({ ...editData, [field]: value });
    }
  };

  const handlePlayerFieldChange = (index: number, field: keyof Player, value: any) => {
    if (editData) {
      const players = [...(editData.players || [])];
      players[index] = { ...players[index], [field]: value } as Player;
      setEditData({ ...editData, players });
    }
  };

  const handleDeletePlayerRow = (index: number) => {
    if (editData) {
      const players = (editData.players || []).filter((_, i) => i !== index);
      setEditData({ ...editData, players });
    }
  };

  const handleAddPlayerRow = () => {
    if (editData) {
      const newPlayer: Player = {
        id: `temp_${Date.now()}`,
        name: '',
        studentId: '',
        jerseyNumber: '',
        photo: null,
        teamId: editData.id,
      };
      setEditData({ ...editData, players: [...(editData.players || []), newPlayer] });
    }
  };

  const handleSaveEdit = async (
    selectedTeam: Team | null,
    seasonId: string,
    onSuccess: (updatedTeam: Team) => void,
  ) => {
    if (!editData) return;
    if (!seasonId || seasonId === 'all') {
      setError('请先选择一个具体赛季再编辑球队');
      return;
    }

    const validationError = validateTeamData(editData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsDirectoryLoading(true);
    setError(null);

    const originalPlayers = selectedTeam?.players || [];
    const currentPlayers = editData.players || [];

    const deletePlayerIds = calculateDeletedPlayerIds(originalPlayers, currentPlayers);
    const playersPayload = buildPlayerPayload(currentPlayers);

    try {
      setSaveProgress({ current: 0, total: 1, message: '正在提交变更...' });

      let updatedTeam: TeamDTO;
      const updatePayload = {
        teamName: editData.teamName,
        teamDoctor: editData.teamDoctor,
        headCoach: editData.headCoach,
        teamLeader: editData.teamLeader,
        coachPhone: editData.coachPhone,
        leaderPhone: editData.leaderPhone,
        homeJerseyColor: editData.homeJerseyColor,
        awayJerseyColor: editData.awayJerseyColor,
        teamLogo: editData.teamLogo || null,
        homeJersey: editData.homeJersey || null,
        awayJersey: editData.awayJersey || null,
        gender: editData.gender,
      };

      try {
        updatedTeam = await teamApi.updateWithPlayers(editData.id, {
          seasonId,
          ...updatePayload,
          players: playersPayload,
          deletePlayerIds,
        });
      } catch (patchErr: any) {
        if (patchErr?.message?.includes('404') || patchErr?.message?.includes('Cannot PATCH')) {
          console.warn('后端尚未支持 with-players 批量更新接口，降级调用基本信息更新接口');
          updatedTeam = await teamApi.update(editData.id, updatePayload);
        } else {
          throw patchErr;
        }
      }

      setSaveProgress({
        current: 1,
        total: 1,
        message: '保存完成！正在重新加载数据...'
      });

      const mappedTeam = mapTeamDtoToModel({
        ...updatedTeam,
        id: updatedTeam.id || editData.id,
      });

      setIsSaved(true);
      setError(null);
      onSuccess(mappedTeam);

      setTimeout(() => {
        setIsSaved(false);
        setIsEditing(false);
        setEditData(null);
      }, 2000);
    } catch (err) {
      console.error('更新系统信息失败:', err);
      setError('更新失败: ' + (err instanceof Error ? err.message : '网络连接错误或学号已被占用'));
    } finally {
      setIsDirectoryLoading(false);
      setSaveProgress(null);
    }
  };

  const handleDeleteTeam = async (
    teamId: string,
    onSuccess: (deletedId: string) => Promise<void> | void,
  ) => {
    if (!confirm('确定要删除这支球队吗？')) return;

    setIsDirectoryLoading(true);
    try {
      await teamApi.delete(teamId);
      await onSuccess(teamId);
      if (editData?.id === teamId) {
        setEditData(null);
        setIsEditing(false);
      }
      setError('球队已成功删除');
    } catch (err) {
      console.error('删除球队失败:', err);
      setError('网络连接失败，请稍后重试');
    } finally {
      setIsDirectoryLoading(false);
    }
  };

  return {
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    isSaved,
    saveProgress,
    handleEditTeam,
    handleCancelEdit,
    handleFieldChange,
    handlePlayerFieldChange,
    handleDeletePlayerRow,
    handleAddPlayerRow,
    handleSaveEdit,
    handleDeleteTeam,
  };
}
