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
  it('accepts a team with empty or partial fields for zero-required draft saving', () => {
    expect(validateTeamCreation({ ...validTeam, teamName: '' }, [])).toBeNull();
  });

  it('keeps the phone format check when phone number is provided', () => {
    expect(
      validateTeamCreation({ ...validTeam, coachPhone: '123' }, [validPlayer]),
    ).toBe('主教练联系方式格式不正确，请输入11位手机号');
    expect(
      validateTeamCreation({ ...validTeam, leaderPhone: '123' }, [validPlayer]),
    ).toBe('领队联系方式格式不正确，请输入11位手机号');
  });

  it('allows duplicate student IDs and jersey numbers in player list', () => {
    expect(
      validateTeamCreation(validTeam, [validPlayer, { ...validPlayer, id: 'player-2' }]),
    ).toBeNull();
  });
});
