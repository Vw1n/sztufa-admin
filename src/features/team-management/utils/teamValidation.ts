import { Player, Team, TeamFormData } from '../../../types';

export const validatePhone = (phone: string): boolean => /^1[3-9]\d{9}$/.test(phone);

export function validateCommonTeamFields(team: Partial<Team | TeamFormData>): string | null {
  if (!team.teamName?.trim()) {
    return '请输入队伍名称';
  }
  if (team.teamName.trim().length > 100) {
    return '球队名称长度不能超过100个字符';
  }
  if (!team.headCoach?.trim()) {
    return '请输入主教练姓名';
  }
  if (!team.teamLeader?.trim()) {
    return '请输入领队姓名';
  }
  if (!team.teamDoctor?.trim()) {
    return '请输入队医姓名';
  }
  if (!team.coachPhone?.trim()) {
    return '请输入主教练联系方式';
  }
  if (!validatePhone(team.coachPhone)) {
    return '主教练联系方式格式不正确，请输入11位手机号';
  }
  if (!team.leaderPhone?.trim()) {
    return '请输入领队联系方式';
  }
  if (!validatePhone(team.leaderPhone)) {
    return '领队联系方式格式不正确，请输入11位手机号';
  }
  if (!team.homeJerseyColor?.trim()) {
    return '请输入主队球衣颜色';
  }
  if (!team.awayJerseyColor?.trim()) {
    return '请输入客队球衣颜色';
  }

  return null;
}

export function validatePlayerList(
  players?: Player[],
  options: { requireAtLeastOne?: boolean } = {}
): string | null {
  if (options.requireAtLeastOne && (!players || players.length === 0)) {
    return '请至少添加一名球员；填写球员资料后请点击“确认添加”';
  }

  if (players && players.length > 0) {
    const studentIds = new Set<string>();
    const jerseyNumbers = new Set<string>();
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      if (!p.name?.trim()) {
        return `第 ${i + 1} 个球员的姓名不能为空`;
      }
      const sId = (p.studentId || '').trim();
      const jNum = String(p.jerseyNumber ?? '').trim();
      if (!sId) {
        return `第 ${i + 1} 个球员的学号不能为空`;
      }
      if (jNum === '') {
        return `第 ${i + 1} 个球员的球衣号码不能为空`;
      }
      if (studentIds.has(sId)) {
        return `球员列表中存在重复的学号: ${sId}`;
      }
      if (jerseyNumbers.has(jNum)) {
        return `球员列表中存在重复的球衣号码: ${jNum}`;
      }
      studentIds.add(sId);
      jerseyNumbers.add(jNum);
    }
  }

  return null;
}

/**
 * 校验球队编辑状态数据
 */
export function validateTeamData(editData: Partial<Team>): string | null {
  const commonError = validateCommonTeamFields(editData);
  if (commonError) return commonError;

  return validatePlayerList(editData.players, { requireAtLeastOne: false });
}

/**
 * 校验新建球队表单数据
 */
export function validateTeamCreation(
  team: TeamFormData,
  players: Player[]
): string | null {
  const commonError = validateCommonTeamFields(team);
  if (commonError) return commonError;

  if (!team.seasonId) {
    return '请选择所属活跃赛季';
  }

  return validatePlayerList(players, { requireAtLeastOne: true });
}
