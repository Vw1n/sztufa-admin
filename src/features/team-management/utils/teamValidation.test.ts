import { validatePhone, validateTeamData } from './teamValidation';
import { Team } from '../../../types';

describe('teamValidation', () => {
  describe('validatePhone', () => {
    it('should validate 11-digit Chinese mobile phone numbers correctly', () => {
      expect(validatePhone('13812345678')).toBe(true);
      expect(validatePhone('19999999999')).toBe(true);
      expect(validatePhone('12812345678')).toBe(false); // starts with 12
      expect(validatePhone('1381234567')).toBe(false);  // 10 digits
      expect(validatePhone('138123456789')).toBe(false); // 12 digits
      expect(validatePhone('abc')).toBe(false);
    });
  });

  describe('validateTeamData', () => {
    const validTeam: Team = {
      id: 'team1',
      teamName: '计算机学院足球队',
      headCoach: '张教练',
      teamLeader: '李领队',
      teamDoctor: '王医生',
      coachPhone: '13800000001',
      leaderPhone: '13800000002',
      homeJerseyColor: '红色',
      awayJerseyColor: '白色',
      teamLogo: null,
      homeJersey: null,
      awayJersey: null,
      players: [
        { id: 'p1', name: '选手一', studentId: '20230001', jerseyNumber: '10', photo: null, teamId: 'team1' },
        { id: 'p2', name: '选手二', studentId: '20230002', jerseyNumber: '7', photo: null, teamId: 'team1' },
      ],
    };

    it('should pass for a valid team', () => {
      expect(validateTeamData(validTeam)).toBeNull();
    });

    it('should return error when teamName is empty', () => {
      expect(validateTeamData({ ...validTeam, teamName: '' })).toBe('请输入队伍名称');
    });

    it('should return error when coachPhone is invalid', () => {
      expect(validateTeamData({ ...validTeam, coachPhone: '123' })).toBe(
        '主教练联系方式格式不正确，请输入11位手机号'
      );
    });

    it('should detect duplicate student IDs', () => {
      const invalidTeam = {
        ...validTeam,
        players: [
          { id: 'p1', name: '选手一', studentId: '20230001', jerseyNumber: '10', photo: null, teamId: 'team1' },
          { id: 'p2', name: '选手二', studentId: '20230001', jerseyNumber: '7', photo: null, teamId: 'team1' },
        ],
      };
      expect(validateTeamData(invalidTeam)).toBe('球员列表中存在重复的学号: 20230001');
    });

    it('should detect duplicate jersey numbers', () => {
      const invalidTeam = {
        ...validTeam,
        players: [
          { id: 'p1', name: '选手一', studentId: '20230001', jerseyNumber: '10', photo: null, teamId: 'team1' },
          { id: 'p2', name: '选手二', studentId: '20230002', jerseyNumber: '10', photo: null, teamId: 'team1' },
        ],
      };
      expect(validateTeamData(invalidTeam)).toBe('球员列表中存在重复的球衣号码: 10');
    });
  });
});
