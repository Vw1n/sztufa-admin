import { useCallback, useState } from 'react';
import { formDraftApi } from '../../../api/form-draft.service';
import { Player, Team, TeamFormData } from '../../../types';
import { createTeam } from '../../team-create';

export interface SaveProgress {
  current: number;
  total: number;
  message: string;
}

export type SavedTeam = Partial<Team> & Pick<Team, 'id' | 'teamName'>;

interface UseTeamEntrySaveOptions {
  teamFormData: TeamFormData;
  players: Player[];
  /** 当前用户角色，来自 AuthContext，不再从 localStorage.user 推断 */
  userRole: string | undefined;
  /** 表单校验回调，非超级管理员保存前调用 */
  validate: () => boolean;
  /** 共享错误状态 setter（由 useTeamEntryForm 拥有） */
  setError: (error: string | null) => void;
  /** 保存成功后回调，用于推进 PDF 草稿队列 */
  onSaveSuccess?: () => void;
}

/**
 * 球队保存 Hook。
 *
 * 职责：
 * - 区分超级管理员（草稿物化）与普通用户（正式创建）两种保存模式；
 * - 维护保存状态（isLoading / isSaved / savedTeam / saveProgress）；
 * - 超级管理员草稿 ID（activeDraftId）的续传。
 *
 * 关键约束（按解耦计划）：
 * - userRole 由调用方从 AuthContext 传入，**不再从 localStorage.user 推断**；
 * - 保存成功后通过 onSaveSuccess 回调通知 PDF 队列推进，不直接操作队列状态。
 */
export function useTeamEntrySave({
  teamFormData,
  players,
  userRole,
  validate,
  setError,
  onSaveSuccess,
}: UseTeamEntrySaveOptions) {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedTeam, setSavedTeam] = useState<SavedTeam | null>(null);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    setError(null);

    const isSuperAdmin = userRole === 'super_admin';

    if (!isSuperAdmin) {
      if (!validate()) {
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSuperAdmin) {
        // 超级管理员：先保存草稿，再尝试物化
        const saveRes = await formDraftApi.saveDraft({
          draftId: activeDraftId || undefined,
          formType: 'TEAM',
          payload: { ...teamFormData, players },
          seasonId: teamFormData.seasonId || null,
        });

        if (saveRes.draftId) {
          setActiveDraftId(saveRes.draftId);
        }

        const matRes = await formDraftApi.materializeDraft(saveRes.draftId);
        if (matRes.success && matRes.officialRecordId) {
          setSavedTeam({ id: matRes.officialRecordId, teamName: teamFormData.teamName });
          setIsSaved(true);
        } else {
          setIsSaved(true);
          setError(matRes.error || '信息不完整，已保存为草稿');
        }
      } else {
        // 普通用户：直接正式创建
        const team = await createTeam(teamFormData, players, setSaveProgress);
        setSavedTeam(team);
        setIsSaved(true);
      }

      // 通知 PDF 队列推进（若有待载入草稿）
      onSaveSuccess?.();

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
  }, [teamFormData, players, userRole, validate, setError, onSaveSuccess, activeDraftId]);

  return {
    isSaved,
    isLoading,
    savedTeam,
    saveProgress,
    handleSave,
  };
}

export type UseTeamEntrySaveReturn = ReturnType<typeof useTeamEntrySave>;
