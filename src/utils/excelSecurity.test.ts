import {
  validateExcelFile,
  validateExcelArchive,
  validateWorksheetData,
  parsePlayerRows,
  MAX_FILE_SIZE,
} from './excelSecurity';

describe('Excel 安全防护与导入校验测试', () => {
  describe('validateExcelArchive - 压缩包结构校验', () => {
    it('拒绝缺少 ZIP 中央目录的伪造 .xlsx 文件', () => {
      const result = validateExcelArchive(new Uint8Array([1, 2, 3, 4]), 'fake.xlsx');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('无效的 .xlsx 文件结构');
    });

    it('旧版 .xls 文件不执行 ZIP 结构校验', () => {
      const result = validateExcelArchive(new Uint8Array([1, 2, 3, 4]), 'legacy.xls');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateExcelFile - 文件格式与大小限制', () => {
    it('拒绝非 Excel 格式的文件（如 .png / .pdf）', () => {
      const result = validateExcelFile({ name: 'malicious.exe', size: 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('请上传 Excel 文件');
    });

    it('拒绝超过 10MB 的超大文件（防爆内存及拒绝服务攻击）', () => {
      const result = validateExcelFile({
        name: 'huge_data.xlsx',
        size: MAX_FILE_SIZE + 1024,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件大小超过限制');
    });

    it('放行符合规范且未超限制的 .xlsx 文件', () => {
      const result = validateExcelFile({
        name: 'players_list.xlsx',
        size: 500 * 1024,
      });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateWorksheetData - Sheet 数量、行数与列数限制', () => {
    it('拒绝为空或没有任何 Sheet 的工作表', () => {
      const result = validateWorksheetData([], []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('文件不包含有效工作表');
    });

    it('拒绝 Sheet 数量超过 10 个的文件', () => {
      const sheets = Array.from({ length: 11 }, (_, i) => `Sheet${i + 1}`);
      const result = validateWorksheetData(sheets, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('工作表过多');
    });

    it('拒绝数据行数超过 1000 行的文件', () => {
      const rows = Array.from({ length: 1001 }, (_, i) => ({ 姓名: `Player${i}` }));
      const result = validateWorksheetData(['Sheet1'], rows);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('数据行数超过限制');
    });

    it('拒绝列数超过 50 列的异常工作表（防 Zip 炸弹/畸形数据）', () => {
      const row: Record<string, any> = {};
      for (let i = 0; i < 51; i++) {
        row[`col_${i}`] = i;
      }
      const result = validateWorksheetData(['Sheet1'], [row]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('列数过多');
    });
  });

  describe('parsePlayerRows - 数据解析与清洗逻辑', () => {
    it('能正确识别中文表头并提取球员信息', () => {
      const mockJson = [
        { 姓名: '张三', 学号: '20210001', 球衣号码: '10' },
        { 姓名: '李四', 学号: '20210002', 球衣号码: 7 },
      ];
      const players = parsePlayerRows(mockJson);
      expect(players).toHaveLength(2);
      expect(players[0]).toEqual({
        name: '张三',
        studentId: '20210001',
        jerseyNumber: '10',
        photo: null,
        teamId: '',
      });
      expect(players[1].jerseyNumber).toBe('7');
    });

    it('过滤无效或缺少必要字段的错误记录', () => {
      const mockJson = [
        { 姓名: '王五', 学号: '', 球衣号码: '11' }, // 缺少学号
        { 姓名: '', 学号: '20210004', 球衣号码: '12' }, // 缺少姓名
      ];
      const players = parsePlayerRows(mockJson);
      expect(players).toHaveLength(0);
    });
  });
});
