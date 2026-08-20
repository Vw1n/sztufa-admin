import { useCallback, useEffect, useState } from 'react';
import { registrationApi } from '../../api/registration.service';
import { seasonApi } from '../../api/service';
import { uploadImageFile } from '../../utils/imageUpload';
import { Player, TeamFormData } from '../../types';
import { SeasonDTO } from '../../api/types';
import {
  RegistrationPlayerDTO,
  RegistrationStatusType,
  TeamRegistrationDTO,
} from './registration.types';
import { ApiError } from '../../api/http';

export function useRegistration() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSeasons, setActiveSeasons] = useState<SeasonDTO[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [registration, setRegistration] = useState<TeamRegistrationDTO | null>(null);

  // Editable Form State
  const [teamForm, setTeamForm] = useState<TeamFormData>({
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
    seasonId: '',
    gender: 'MALE',
  });

  const [players, setPlayers] = useState<Player[]>([]);

  // Load Seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const seasons = await seasonApi.getAll();
        const active = seasons.filter((s) => s.status === 'active');
        setActiveSeasons(active);
        if (active.length > 0) {
          setSelectedSeasonId(active[0].id);
        }
      } catch (err) {
        console.error('获取赛季失败:', err);
      }
    };
    fetchSeasons();
  }, []);

  // Sync state from TeamRegistrationDTO
  const populateFromRegistration = (reg: TeamRegistrationDTO) => {
    setRegistration(reg);
    if (reg.teamData) {
      setTeamForm({
        teamName: reg.teamData.teamName || '',
        teamDoctor: reg.teamData.teamDoctor || '',
        headCoach: reg.teamData.headCoach || '',
        teamLeader: reg.teamData.teamLeader || '',
        coachPhone: reg.teamData.coachPhone || '',
        leaderPhone: reg.teamData.leaderPhone || '',
        homeJerseyColor: reg.teamData.homeJerseyColor || '',
        awayJerseyColor: reg.teamData.awayJerseyColor || '',
        teamLogo: reg.teamData.teamLogo || null,
        homeJersey: reg.teamData.homeJersey || null,
        awayJersey: reg.teamData.awayJersey || null,
        seasonId: reg.seasonId,
        gender: reg.teamData.gender || 'MALE',
      });
    }

    if (reg.players) {
      setPlayers(
        reg.players.map((p, index) => ({
          id: p.id || p.playerId || `temp-${index}-${Date.now()}`,
          name: p.name,
          studentId: p.studentId,
          jerseyNumber: p.jerseyNumber,
          photo: p.photo || null,
          teamId: reg.teamId,
          legacyKey: p.playerId || undefined,
        })),
      );
    } else {
      setPlayers([]);
    }
  };

  // Load current registration for season
  const loadRegistration = useCallback(async (seasonId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registrationApi.getMine(seasonId);
      if (data) {
        populateFromRegistration(data);
      } else {
        setRegistration(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取报名失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSeasonId) {
      loadRegistration(selectedSeasonId);
    }
  }, [selectedSeasonId, loadRegistration]);

  // Create Draft if not exists
  const handleCreateDraft = async () => {
    if (!selectedSeasonId) {
      alert('请先选择活跃赛季');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const created = await registrationApi.create(selectedSeasonId);
      populateFromRegistration(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '创建草稿失败';
      alert(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Upload images if any are File objects (Refinement 3)
  const processImageUploads = async (): Promise<{
    teamLogo: string | null;
    homeJersey: string | null;
    awayJersey: string | null;
    processedPlayers: RegistrationPlayerDTO[];
  }> => {
    let uploadedLogo = typeof teamForm.teamLogo === 'string' ? teamForm.teamLogo : null;
    if (teamForm.teamLogo instanceof File) {
      uploadedLogo = await uploadImageFile(teamForm.teamLogo, '球队 Logo');
    }

    let uploadedHome = typeof teamForm.homeJersey === 'string' ? teamForm.homeJersey : null;
    if (teamForm.homeJersey instanceof File) {
      uploadedHome = await uploadImageFile(teamForm.homeJersey, '主场球衣');
    }

    let uploadedAway = typeof teamForm.awayJersey === 'string' ? teamForm.awayJersey : null;
    if (teamForm.awayJersey instanceof File) {
      uploadedAway = await uploadImageFile(teamForm.awayJersey, '客场球衣');
    }

    const processedPlayers: RegistrationPlayerDTO[] = [];
    for (const player of players) {
      let photoUrl: string | null = null;
      if (player.photoFile instanceof File) {
        photoUrl = await uploadImageFile(player.photoFile, `球员 [${player.name}] 照片`);
      } else if (typeof player.photo === 'string' && !player.photo.startsWith('blob:') && !player.photo.startsWith('data:')) {
        photoUrl = player.photo;
      }
      processedPlayers.push({
        playerId: player.legacyKey || (player.id.startsWith('temp-') ? undefined : player.id),
        name: player.name,
        studentId: player.studentId,
        jerseyNumber: player.jerseyNumber,
        photo: photoUrl,
      });
    }

    return {
      teamLogo: uploadedLogo,
      homeJersey: uploadedHome,
      awayJersey: uploadedAway,
      processedPlayers,
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!registration) return;
    setSaving(true);
    setError(null);
    try {
      const { teamLogo, homeJersey, awayJersey, processedPlayers } =
        await processImageUploads();

      const saved = await registrationApi.save(registration.id, {
        teamData: {
          teamName: teamForm.teamName,
          teamDoctor: teamForm.teamDoctor,
          headCoach: teamForm.headCoach,
          teamLeader: teamForm.teamLeader,
          coachPhone: teamForm.coachPhone,
          leaderPhone: teamForm.leaderPhone,
          homeJerseyColor: teamForm.homeJerseyColor,
          awayJerseyColor: teamForm.awayJerseyColor,
          teamLogo,
          homeJersey,
          awayJersey,
          gender: teamForm.gender || 'MALE',
        },
        players: processedPlayers,
      });

      populateFromRegistration(saved);
      alert('草稿保存成功');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert('操作失败 (409)：当前报名处于不可编辑状态，无法保存');
      } else {
        const msg = err instanceof Error ? err.message : '保存草稿失败';
        alert(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Submit Registration
  const handleSubmit = async () => {
    if (!registration) return;

    if (!teamForm.teamName.trim()) {
      alert('请填写球队名称');
      return;
    }
    if (players.length === 0) {
      alert('请至少添加一名球员');
      return;
    }

    if (!window.confirm('确认要提交报名申请吗？提交后在审核期间将无法再编辑。')) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      // Save latest state first
      const { teamLogo, homeJersey, awayJersey, processedPlayers } =
        await processImageUploads();

      await registrationApi.save(registration.id, {
        teamData: {
          teamName: teamForm.teamName,
          teamDoctor: teamForm.teamDoctor,
          headCoach: teamForm.headCoach,
          teamLeader: teamForm.teamLeader,
          coachPhone: teamForm.coachPhone,
          leaderPhone: teamForm.leaderPhone,
          homeJerseyColor: teamForm.homeJerseyColor,
          awayJerseyColor: teamForm.awayJerseyColor,
          teamLogo,
          homeJersey,
          awayJersey,
          gender: teamForm.gender || 'MALE',
        },
        players: processedPlayers,
      });

      const submitted = await registrationApi.submit(registration.id);
      populateFromRegistration(submitted);
      alert('报名提交成功！等待系统管理员审核。');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert('提交失败 (409)：报名状态发生变更，无法重复提交');
      } else {
        const msg = err instanceof Error ? err.message : '提交报名失败';
        alert(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Player handlers
  const handleAddPlayer = (newPlayer: Omit<Player, 'id'>) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setPlayers((prev) => [...prev, { ...newPlayer, id: tempId }]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  };

  const handleImportPlayers = (importedPlayers: Omit<Player, 'id'>[]) => {
    const newItems = importedPlayers.map((item, idx) => ({
      ...item,
      id: `imported-${Date.now()}-${idx}`,
    }));
    setPlayers((prev) => [...prev, ...newItems]);
  };

  const isReadOnly = Boolean(
    registration &&
      (registration.status === ('SUBMITTED' as RegistrationStatusType) ||
        registration.status === ('APPROVED' as RegistrationStatusType)),
  );

  return {
    loading,
    saving,
    submitting,
    error,
    activeSeasons,
    selectedSeasonId,
    setSelectedSeasonId,
    registration,
    teamForm,
    setTeamForm,
    players,
    isReadOnly,
    handleCreateDraft,
    handleSaveDraft,
    handleSubmit,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleImportPlayers,
    refresh: () => loadRegistration(selectedSeasonId),
  };
}
