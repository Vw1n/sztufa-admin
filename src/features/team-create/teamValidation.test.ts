import { Player, TeamFormData } from '../../types';
import { validateTeamCreation } from './teamValidation';

const validTeam: TeamFormData = {
  teamName: '测试队',
  teamDoctor: '王医生',
  headCoach: '张教练',
  teamLeader: '李领队',
  coachPhone: '13800138000',
  leaderPhone: '13900139000',
  homeJerseyColor: '蓝色',
  awayJerseyColor: '白色',
  teamLogo: null,
  homeJersey: null,
  awayJersey: null,
  gender: 'MALE',
  seasonId: 'season-1',
};

const validPlayer: Player = {
  id: 'player-1',
  name: '张三',
  studentId: '20260001',
  jerseyNumber: '10',
  photo: null,
  teamId: '',
};

describe('team-create validation', () => {
  it('accepts a complete team and player list', () => {
    expect(validateTeamCreation(validTeam, [validPlayer])).toBeNull();
  });

  it.each([
    ['teamName', '', '请输入队伍名称'],
    ['headCoach', '', '请输入主教练姓名'],
    ['teamLeader', '', '请输入领队姓名'],
    ['teamDoctor', '', '请输入队医姓名'],
    ['coachPhone', '', '请输入主教练联系方式'],
    ['leaderPhone', '', '请输入领队联系方式'],
    ['homeJerseyColor', '', '请输入主队球衣颜色'],
    ['awayJerseyColor', '', '请输入客队球衣颜色'],
    ['seasonId', '', '请选择所属活跃赛季'],
  ] as const)('keeps the required-field message for %s', (field, value, message) => {
    expect(validateTeamCreation({ ...validTeam, [field]: value }, [validPlayer])).toBe(message);
  });

  it('keeps the team-name length limit', () => {
    expect(
      validateTeamCreation({ ...validTeam, teamName: '队'.repeat(101) }, [validPlayer]),
    ).toBe('球队名称长度不能超过100个字符');
  });

  it('keeps both phone format checks', () => {
    expect(
      validateTeamCreation({ ...validTeam, coachPhone: '123' }, [validPlayer]),
    ).toBe('主教练联系方式格式不正确，请输入11位手机号');
    expect(
      validateTeamCreation({ ...validTeam, leaderPhone: '123' }, [validPlayer]),
    ).toBe('领队联系方式格式不正确，请输入11位手机号');
  });

  it('requires at least one confirmed player', () => {
    expect(validateTeamCreation(validTeam, [])).toBe(
      '请至少添加一名球员；填写球员资料后请点击“确认添加”',
    );
  });

  it.each([
    ['name', '', '第 1 个球员的姓名不能为空'],
    ['studentId', '', '第 1 个球员的学号不能为空'],
    ['jerseyNumber', '', '第 1 个球员的球衣号码不能为空'],
  ] as const)('keeps the player-field message for %s', (field, value, message) => {
    expect(
      validateTeamCreation(validTeam, [{ ...validPlayer, [field]: value }]),
    ).toBe(message);
  });

  it('rejects duplicate student IDs and jersey numbers', () => {
    expect(
      validateTeamCreation(validTeam, [validPlayer, { ...validPlayer, id: 'player-2' }]),
    ).toBe('球员列表中存在重复的学号: 20260001');

    expect(
      validateTeamCreation(validTeam, [
        validPlayer,
        { ...validPlayer, id: 'player-2', studentId: '20260002' },
      ]),
    ).toBe('球员列表中存在重复的球衣号码: 10');
  });
});
