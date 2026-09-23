import { describe, expect, it } from '@jest/globals';
import {
  mapTeamFormFields,
  mapPlayerFields,
  mapPlayerFieldsList,
} from './pdf-team-draft.mapper';
import { ParsedPlayer, ParsedTeam } from '../../../api/pdf-import.service';

const field = <T>(value: T | null, confidence = 0.95): { value: T | null; confidence: number; page: number } => ({
  value,
  confidence,
  page: 1,
});

const mockParsedTeam: ParsedTeam = {
  teamName: field('深圳队'),
  headCoach: field('王教练'),
  coachPhone: field('13800138000'),
  teamLeader: field('李领队'),
  leaderPhone: field('13900139000'),
  teamDoctor: field('张医生'),
  homeJerseyColor: field('红色'),
  awayJerseyColor: field('蓝色'),
  logo: field('https://example.com/logo.webp'),
  homeJerseyPhoto: field('https://example.com/home.webp'),
  awayJerseyPhoto: field('https://example.com/away.webp'),
  players: [
    {
      name: field('张三'),
      studentId: field('2026001'),
      jerseyNumber: field('10'),
      photo: field('https://example.com/p1.webp'),
      needsManualConfirm: false,
    },
    {
      name: field('李四'),
      studentId: field('2026002'),
      jerseyNumber: field('11'),
      photo: field('https://example.com/p2.webp'),
      needsManualConfirm: false,
    },
  ],
};

describe('pdf-team-draft.mapper', () => {
  describe('mapTeamFormFields', () => {
    it('正确映射所有文本字段', () => {
      const result = mapTeamFormFields(mockParsedTeam, { gender: 'MALE', seasonId: 'season-1' });
      expect(result).toEqual({
        teamName: '深圳队',
        teamDoctor: '张医生',
        headCoach: '王教练',
        teamLeader: '李领队',
        coachPhone: '13800138000',
        leaderPhone: '13900139000',
        homeJerseyColor: '红色',
        awayJerseyColor: '蓝色',
        gender: 'MALE',
        seasonId: 'season-1',
      });
    });

    it('null 字段映射为空字符串', () => {
      const team: ParsedTeam = {
        ...mockParsedTeam,
        teamName: field(null),
        teamDoctor: field(null),
      };
      const result = mapTeamFormFields(team, { gender: 'FEMALE', seasonId: 's2' });
      expect(result.teamName).toBe('');
      expect(result.teamDoctor).toBe('');
      expect(result.gender).toBe('FEMALE');
      expect(result.seasonId).toBe('s2');
    });

    it('不包含文件类型字段', () => {
      const result = mapTeamFormFields(mockParsedTeam, { gender: 'MALE', seasonId: 's1' });
      expect(result).not.toHaveProperty('teamLogo');
      expect(result).not.toHaveProperty('homeJersey');
      expect(result).not.toHaveProperty('awayJersey');
    });
  });

  describe('mapPlayerFields', () => {
    it('正确映射球员文本字段', () => {
      const player: ParsedPlayer = {
        name: field('王五'),
        studentId: field('2026003'),
        jerseyNumber: field('7'),
        photo: field('https://example.com/p3.webp'),
        needsManualConfirm: true,
      };
      const result = mapPlayerFields(player);
      expect(result).toEqual({
        name: '王五',
        studentId: '2026003',
        jerseyNumber: '7',
      });
    });

    it('null 字段映射为空字符串', () => {
      const player: ParsedPlayer = {
        name: field(null),
        studentId: field(null),
        jerseyNumber: field(null),
        photo: field(null),
        needsManualConfirm: false,
      };
      const result = mapPlayerFields(player);
      expect(result).toEqual({ name: '', studentId: '', jerseyNumber: '' });
    });

    it('不包含 photo / id / teamId', () => {
      const result = mapPlayerFields(mockParsedTeam.players[0]);
      expect(result).not.toHaveProperty('photo');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('teamId');
      expect(result).not.toHaveProperty('photoFile');
    });
  });

  describe('mapPlayerFieldsList', () => {
    it('批量映射所有球员', () => {
      const result = mapPlayerFieldsList(mockParsedTeam.players);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('张三');
      expect(result[1].jerseyNumber).toBe('11');
    });

    it('空数组返回空数组', () => {
      expect(mapPlayerFieldsList([])).toEqual([]);
    });
  });
});
