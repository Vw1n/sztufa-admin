// @jest-environment jsdom
import { describe, expect, it, jest, beforeEach, beforeAll } from '@jest/globals';
import { exportTeamToJson, exportTeamToExcel } from './team-entry-export';
import { Team } from '../../../types';

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
    json_to_sheet: jest.fn((data) => ({ __data: data })),
    book_append_sheet: jest.fn(),
  },
  writeFile: jest.fn(),
}));

import * as XLSX from 'xlsx';

const sampleTeam: Team = {
  id: 'team-1',
  teamName: '测试队',
  teamDoctor: '队医',
  headCoach: '主教练',
  teamLeader: '领队',
  coachPhone: '13800138000',
  leaderPhone: '13900139000',
  homeJerseyColor: '红色',
  awayJerseyColor: '蓝色',
  teamLogo: null,
  homeJersey: null,
  awayJersey: null,
  players: [
    { id: 'p1', name: '张三', studentId: '2026001', jerseyNumber: '10', photo: null, teamId: 'team-1' },
    { id: 'p2', name: '李四', studentId: '2026002', jerseyNumber: '11', photo: null, teamId: 'team-1' },
  ],
};

describe('team-entry-export', () => {
  let createObjectURLSpy: jest.Mock;
  let revokeObjectURLSpy: jest.Mock;
  let clickSpy: jest.Mock;

  beforeAll(() => {
    // jsdom 不提供 URL.createObjectURL / revokeObjectURL，手动挂载
    createObjectURLSpy = jest.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = jest.fn();
    (global.URL as Record<string, unknown>).createObjectURL = createObjectURLSpy;
    (global.URL as Record<string, unknown>).revokeObjectURL = revokeObjectURLSpy;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clickSpy = jest.fn();
    const linkEl = { click: clickSpy, href: '', download: '' };
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return linkEl as unknown as HTMLElement;
      return document.createElement(tag);
    });
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as HTMLElement);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node);
  });

  describe('exportTeamToJson', () => {
    it('生成 JSON Blob 并触发下载', () => {
      exportTeamToJson(sampleTeam);

      expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
      const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobArg.type).toBe('application/json');
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('文件名包含球队名称', () => {
      exportTeamToJson(sampleTeam);

      const linkEl = (document.createElement as jest.Mock).mock.results[0].value as {
        download: string;
      };
      expect(linkEl.download).toBe('测试队_球队信息.json');
    });
  });

  describe('exportTeamToExcel', () => {
    it('创建两个 sheet 并调用 writeFile', () => {
      exportTeamToExcel(sampleTeam);

      expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
      expect(XLSX.writeFile).toHaveBeenCalledTimes(1);

      const writeFileArgs = (XLSX.writeFile as jest.Mock).mock.calls[0];
      expect(writeFileArgs[1]).toBe('测试队_球队信息.xlsx');
    });

    it('球队信息 sheet 包含 8 行字段', () => {
      exportTeamToExcel(sampleTeam);

      const teamSheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[0];
      const teamInfo = teamSheetCall[0] as Array<Record<string, string>>;
      expect(teamInfo).toHaveLength(8);
      expect(teamInfo[0]).toEqual({ '信息类型': '队伍名称', '内容': '测试队' });
    });

    it('球员名单 sheet 包含正确字段', () => {
      exportTeamToExcel(sampleTeam);

      const playerSheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[1];
      const playerData = playerSheetCall[0] as Array<Record<string, string>>;
      expect(playerData).toHaveLength(2);
      expect(playerData[0]).toEqual({ '姓名': '张三', '学号': '2026001', '球衣号码': '10' });
    });

    it('球员为空时输出空数组', () => {
      exportTeamToExcel({ ...sampleTeam, players: undefined });

      const playerSheetCall = (XLSX.utils.json_to_sheet as jest.Mock).mock.calls[1];
      expect(playerSheetCall[0]).toEqual([]);
    });
  });
});
