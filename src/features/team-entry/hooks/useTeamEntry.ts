import { useEffect, useState } from 'react';
import { ParsedTeam, pdfImportApi } from '../../../api/pdf-import.service';
import { seasonApi } from '../../../api/service';
import { SeasonDTO } from '../../../api/types';
import { formDraftApi } from '../../../api/form-draft.service';
import { Player, Team, TeamFormData } from '../../../types';
import { generateId } from '../../../utils';
import {
  createTeam,
  getCompatibleActiveSeasons,
  selectActiveSeasonId,
  validateTeamCreation,
} from '../../team-create';
import * as XLSX from 'xlsx';

export interface PdfTeamDraft {
  formData: TeamFormData;
  players: Player[];
}

const downloadPdfImage = async (
  batchId: string,
  url: string | null | undefined,
  fileName: string,
) => {
  if (!url) return null;
  const blob = await pdfImportApi.downloadAsset(batchId, url);
  return new File([blob], fileName, { type: blob.type || 'image/webp' });
};

const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
};

export const useTeamEntry = () => {
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
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedTeam, setSavedTeam] = useState<Team | null>(null);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [showPdfImporter, setShowPdfImporter] = useState(false);
  const [pdfImportMessage, setPdfImportMessage] = useState<string | null>(null);
  const [pendingPdfDrafts, setPendingPdfDrafts] = useState<PdfTeamDraft[]>([]);

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
    setPlayers((prev) => [...prev, { ...player, studentId: sId, jerseyNumber: jNum, id: generateId() }]);
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

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
    let currentUserRole = 'super_admin';
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role) currentUserRole = u.role;
      } catch (_e) {
        // Keep the default role when the persisted user payload is invalid.
      }
    }
    const isSuperAdmin = currentUserRole === 'super_admin';

    if (!isSuperAdmin) {
      if (!validateForm()) {
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSuperAdmin) {
        // 先上报保存草稿 (带着 activeDraftId)
        const saveRes = await formDraftApi.saveDraft({
          draftId: activeDraftId || undefined,
          formType: 'TEAM',
          payload: { ...teamFormData, players },
          seasonId: teamFormData.seasonId || null,
        });

        if (saveRes.draftId) {
          setActiveDraftId(saveRes.draftId);
        }

        // 尝试落库正式化
        const matRes = await formDraftApi.materializeDraft(saveRes.draftId);
        if (matRes.success && matRes.officialRecordId) {
          setSavedTeam({ id: matRes.officialRecordId, teamName: teamFormData.teamName } as any);
          setIsSaved(true);
        } else {
          setIsSaved(true);
          setError(matRes.error || '信息不完整，已保存为草稿');
        }
      } else {
        const team = await createTeam(teamFormData, players, setSaveProgress);
        setSavedTeam(team);
        setIsSaved(true);
      }

      if (pendingPdfDrafts.length > 0) {
        const [nextDraft, ...remainingDrafts] = pendingPdfDrafts;
        setTeamFormData(nextDraft.formData);
        setPlayers(nextDraft.players);
        setPendingPdfDrafts(remainingDrafts);
        setPdfImportMessage(
          `当前球队已保存，已自动载入下一支 PDF 球队；剩余 ${remainingDrafts.length} 支待录入。`,
        );
      }

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('保存球队信息失败:', err);
      if (err instanceof Error) {
        setError('保存失败: ' + err.message);
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setSaveProgress(null);
    }
  };

  const handlePdfTeamsRecognized = async ({
    batchId,
    teams,
  }: {
    batchId: string;
    teams: ParsedTeam[];
  }) => {
    if (teams.length === 0) {
      throw new Error('PDF 中没有可回填的球队');
    }

    const drafts = await mapWithConcurrency(
      teams,
      1,
      async (team, teamIndex): Promise<PdfTeamDraft> => {
        const [teamLogo, homeJersey, awayJersey, importedPlayers] = await Promise.all([
          downloadPdfImage(batchId, team.logo?.value, `team-${teamIndex + 1}-logo.webp`),
          downloadPdfImage(
            batchId,
            team.homeJerseyPhoto?.value,
            `team-${teamIndex + 1}-home.webp`,
          ),
          downloadPdfImage(
            batchId,
            team.awayJerseyPhoto?.value,
            `team-${teamIndex + 1}-away.webp`,
          ),
          mapWithConcurrency(
            team.players,
            4,
            async (player, playerIndex): Promise<Player> => {
              const photoFile = await downloadPdfImage(
                batchId,
                player.photo.value,
                `team-${teamIndex + 1}-player-${playerIndex + 1}.webp`,
              );
              return {
                id: generateId(),
                name: player.name.value || '',
                studentId: player.studentId.value || '',
                jerseyNumber: player.jerseyNumber.value || '',
                photo: photoFile ? URL.createObjectURL(photoFile) : null,
                photoFile,
                teamId: '',
              };
            },
          ),
        ]);

        return {
          formData: {
            teamName: team.teamName.value || '',
            teamDoctor: team.teamDoctor.value || '',
            headCoach: team.headCoach.value || '',
            teamLeader: team.teamLeader.value || '',
            coachPhone: team.coachPhone.value || '',
            leaderPhone: team.leaderPhone.value || '',
            homeJerseyColor: team.homeJerseyColor.value || '',
            awayJerseyColor: team.awayJerseyColor.value || '',
            teamLogo,
            homeJersey,
            awayJersey,
            gender: teamFormData.gender,
            seasonId: teamFormData.seasonId,
          },
          players: importedPlayers,
        };
      },
    );

    const [firstDraft, ...remainingDrafts] = drafts;
    setTeamFormData(firstDraft.formData);
    setPlayers(firstDraft.players);
    setPendingPdfDrafts(remainingDrafts);
    setShowPdfImporter(false);
    setError(null);
    setPdfImportMessage(
      teams.length === 1
        ? 'PDF 信息已回填到球队录入表单，可继续修改后保存。'
        : `PDF 已识别 ${teams.length} 支球队，当前载入第 1 支；每次保存后自动载入下一支。`,
    );
  };

  const handleExportJson = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const dataStr = JSON.stringify(savedTeam, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${savedTeam.teamName}_球队信息.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!savedTeam) {
      setError('请先保存球队信息');
      return;
    }

    const teamInfo = [
      { '信息类型': '队伍名称', '内容': savedTeam.teamName },
      { '信息类型': '队医姓名', '内容': savedTeam.teamDoctor },
      { '信息类型': '主教练姓名', '内容': savedTeam.headCoach },
      { '信息类型': '领队姓名', '内容': savedTeam.teamLeader },
      { '信息类型': '主教练联系方式', '内容': savedTeam.coachPhone },
      { '信息类型': '领队联系方式', '内容': savedTeam.leaderPhone },
      { '信息类型': '主队球衣颜色', '内容': savedTeam.homeJerseyColor },
      { '信息类型': '客队球衣颜色', '内容': savedTeam.awayJerseyColor },
    ];

    const playerData = savedTeam.players?.map((player) => ({
      '姓名': player.name,
      '学号': player.studentId,
      '球衣号码': player.jerseyNumber,
    })) || [];

    const workbook = XLSX.utils.book_new();

    const teamSheet = XLSX.utils.json_to_sheet(teamInfo);
    XLSX.utils.book_append_sheet(workbook, teamSheet, '球队信息');

    const playerSheet = XLSX.utils.json_to_sheet(playerData);
    XLSX.utils.book_append_sheet(workbook, playerSheet, '球员名单');

    XLSX.writeFile(workbook, `${savedTeam.teamName}_球队信息.xlsx`);
  };

  return {
    teamFormData,
    setTeamFormData,
    players,
    compatibleActiveSeasons,
    isSaved,
    isLoading,
    error,
    saveProgress,
    showPdfImporter,
    setShowPdfImporter,
    pdfImportMessage,
    setPdfImportMessage,
    handleAddPlayer,
    handleRemovePlayer,
    handleUpdatePlayer,
    handleImportPlayers,
    handleSave,
    handlePdfTeamsRecognized,
    handleExportJson,
    handleExportExcel,
  };
};
