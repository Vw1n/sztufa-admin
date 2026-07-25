import { mergeImportedPlayers, exportPlayersToExcel } from './teamRosterExcel';
import { Player } from '../../../types';
import * as XLSX from 'xlsx';

jest.mock('xlsx', () => {
  const original = jest.requireActual('xlsx');
  return {
    ...original,
    utils: {
      ...original.utils,
      json_to_sheet: jest.fn(() => ({})),
      book_new: jest.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
  };
});

describe('teamRosterExcel', () => {
  const existingPlayers: Player[] = [
    { id: 'p1', name: '现有球员', studentId: '20210001', jerseyNumber: '10', photo: null, teamId: 't1' },
  ];

  describe('mergeImportedPlayers', () => {
    it('should merge new players correctly when there are no duplicates', () => {
      const imported = [
        { name: '新球员1', studentId: '20210002', jerseyNumber: '11', photo: null, teamId: 't1' },
      ];
      const result = mergeImportedPlayers(existingPlayers, imported, 't1');
      expect(result.importedCount).toBe(1);
      expect(result.studentIdDupCount).toBe(0);
      expect(result.jerseyNumDupCount).toBe(0);
      expect(result.mergedPlayers.length).toBe(2);
    });

    it('should skip duplicate student IDs', () => {
      const imported = [
        { name: '同学号球员', studentId: '20210001', jerseyNumber: '99', photo: null, teamId: 't1' },
      ];
      const result = mergeImportedPlayers(existingPlayers, imported, 't1');
      expect(result.importedCount).toBe(0);
      expect(result.studentIdDupCount).toBe(1);
      expect(result.mergedPlayers.length).toBe(1);
    });

    it('should skip duplicate jersey numbers', () => {
      const imported = [
        { name: '撞号球员', studentId: '20210003', jerseyNumber: '10', photo: null, teamId: 't1' },
      ];
      const result = mergeImportedPlayers(existingPlayers, imported, 't1');
      expect(result.importedCount).toBe(0);
      expect(result.jerseyNumDupCount).toBe(1);
      expect(result.mergedPlayers.length).toBe(1);
    });
  });

  describe('exportPlayersToExcel', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should format roster data and trigger XLSX writeFile with correct filename', () => {
      const teamName = '计算机学院队';
      const players: Player[] = [
        { id: 'p1', name: '张三', studentId: '20230001', jerseyNumber: '10', photo: null, teamId: 't1' },
        { id: 'p2', name: '李四', studentId: '20230002', jerseyNumber: '7', photo: null, teamId: 't1' },
      ];

      exportPlayersToExcel(teamName, players);

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([
        { '姓名': '张三', '学号': '20230001', '球衣号码': '10' },
        { '姓名': '李四', '学号': '20230002', '球衣号码': '7' },
      ]);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), '球员名单');
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), '计算机学院队_球员名单.xlsx');
    });

    it('should handle empty player list without errors', () => {
      exportPlayersToExcel('空队伍', []);
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith([]);
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), '空队伍_球员名单.xlsx');
    });
  });
});
