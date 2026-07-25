import { useState } from 'react';
import { MatchFormData, Match } from '../../../types';
import { generateId } from '../../../utils';
import { matchApi, teamApi } from '../../../api/service';
import { buildMatchDto, validateMatchForm, MatchLineup } from '../utils/matchForm';

export function useMatchSubmission() {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingTeams, setIsVerifyingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMatch, setSavedMatch] = useState<Match | null>(null);

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

    const validationError = validateMatchForm(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
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

      console.log('正在提交比赛数据到后端:', matchDTO);
      const response = await matchApi.create(matchDTO);

      const savedData = response;
      const match: Match = {
        id: savedData.id || generateId(),
        matchName: `${savedData.homeTeam?.teamName || '主队'} vs ${savedData.awayTeam?.teamName || '客队'}`,
        matchTime: savedData.matchDate,
        homeScore: savedData.homeScore,
        awayScore: savedData.awayScore,
        homePenaltyScore: savedData.homePenaltyScore,
        awayPenaltyScore: savedData.awayPenaltyScore,
        winnerTeamId: savedData.winnerTeamId,
        decidedBy: savedData.decidedBy,
        homeTeamGoals: [],
        awayTeamGoals: [],
        events: savedData.events || [],
        homeTeamId: savedData.homeTeamId,
        awayTeamId: savedData.awayTeamId,
        homeTeamName: savedData.homeTeam?.teamName,
        awayTeamName: savedData.awayTeam?.teamName,
        location: savedData.location,
        status: savedData.status || 'finished',
      };

      setSavedMatch(match);
      setIsSaved(true);
      setError(null);
      if (onSuccess) onSuccess();

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);

      console.log('比赛信息已成功保存到后端:', match);
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
