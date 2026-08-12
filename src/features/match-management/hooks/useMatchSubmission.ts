import { useState } from 'react';
import { MatchFormData, Match } from '../../../types';
import { generateId } from '../../../utils';
import { matchApi, teamApi } from '../../../api/service';
import { formDraftApi } from '../../../api/form-draft.service';
import { buildMatchDto, validateMatchForm, MatchLineup } from '../utils/matchForm';

export function useMatchSubmission() {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTeams, setIsVerifyingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const validateTeamId = async (teamId: string): Promise<boolean> => {
    if (!teamId.trim()) {
      return true;
    }
    try {
      await teamApi.getById(teamId);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    formData: MatchFormData,
    lineups: MatchLineup[],
    onSuccess?: () => void,
  ) => {
    e.preventDefault();
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
      const validationError = validateMatchForm(formData);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isSuperAdmin) {
        // 保存原始可序列化 formData (带 activeDraftId)
        const saveRes = await formDraftApi.saveDraft({
          draftId: activeDraftId || undefined,
          formType: 'MATCH',
          payload: { ...formData, lineups },
          seasonId: formData.seasonId || null,
        });

        if (saveRes.draftId) {
          setActiveDraftId(saveRes.draftId);
        }

        const matRes = await formDraftApi.materializeDraft(saveRes.draftId);
        if (matRes.success && matRes.officialRecordId) {
          setSavedMatch({ id: matRes.officialRecordId } as any);
          setIsSaved(true);
          if (onSuccess) onSuccess();
        } else {
          setIsSaved(true);
          setError(matRes.error || '信息不完整，已保存为草稿');
          if (onSuccess) onSuccess();
        }
      } else {
        if (formData.homeTeamId.trim()) {
          setIsVerifyingTeams(true);
          const homeTeamValid = await validateTeamId(formData.homeTeamId);
          if (!homeTeamValid) {
            setError(`主队ID ${formData.homeTeamId} 不存在，请检查或使用球队名称`);
            setIsLoading(false);
            setIsVerifyingTeams(false);
            return;
          }
        }

        if (formData.awayTeamId.trim()) {
          const awayTeamValid = await validateTeamId(formData.awayTeamId);
          if (!awayTeamValid) {
            setError(`客队ID ${formData.awayTeamId} 不存在，请检查或使用球队名称`);
            setIsLoading(false);
            setIsVerifyingTeams(false);
            return;
          }
        }
        setIsVerifyingTeams(false);

        const matchDTO = buildMatchDto(formData, lineups);
        const response = await matchApi.create(matchDTO);
        setSavedMatch(response as any);
        setIsSaved(true);
        if (onSuccess) onSuccess();
      }

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (err) {
      console.error('保存比赛信息失败:', err);
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('网络连接失败，请检查网络或稍后重试');
        } else if (err.message.includes('400')) {
          setError('请求参数错误，请检查表单数据是否完整');
        } else if (err.message.includes('401')) {
          setError('未授权访问，请先登录');
        } else if (err.message.includes('404')) {
          setError('关联的球队不存在，请检查球队ID');
        } else if (err.message.includes('500')) {
          setError('服务器内部错误，请稍后重试');
        } else {
          setError('保存失败: ' + err.message);
        }
      } else {
        setError('保存失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
      setIsVerifyingTeams(false);
    }
  };

  return {
    isSaved,
    isLoading,
    isVerifyingTeams,
    error,
    setError,
    savedMatch,
    handleSubmit,
  };
}
