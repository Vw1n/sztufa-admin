import { Player, Team, TeamFormData } from '../../../types';

export const validatePhone = (phone: string): boolean => /^1[3-9]\d{9}$/.test(phone);

export function validateCommonTeamFields(team: Partial<Team | TeamFormData>): string | null {
  if (team.coachPhone?.trim() && !validatePhone(team.coachPhone.trim())) {
    return '主教练联系方式格式不正确，请输入11位手机号';
  }
  if (team.leaderPhone?.trim() && !validatePhone(team.leaderPhone.trim())) {
    return '领队联系方式格式不正确，请输入11位手机号';
  }
  return null;
}

export function validatePlayerList(
  players?: Player[],
  _options: { requireAtLeastOne?: boolean } = {}
): string | null {
  const unnamedIndex = (players || []).findIndex(player => !player.name?.trim());
  return unnamedIndex >= 0 ? `第${unnamedIndex + 1}名球员缺少姓名，请填写姓名或删除空白行` : null;
}

/**
 * 校验球队编辑状态数据
 */
export function validateTeamData(editData: Partial<Team>): string | null {
  return validateCommonTeamFields(editData) || validatePlayerList(editData.players);
}

/**
 * 校验新建球队表单数据
 */
export function validateTeamCreation(
  team: TeamFormData,
  players: Player[]
): string | null {
  return validateCommonTeamFields(team) || validatePlayerList(players);
}
