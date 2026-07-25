import {
  formatDate,
  getActionTagClass,
  getActionLabel,
  parseLogDetails,
  extractSubLogAttrs,
  parseSubLogItem,
} from './auditLogFormatter';

describe('auditLogFormatter', () => {
  describe('formatDate', () => {
    it('should format ISO string to yyyy-mm-dd hh:mm:ss', () => {
      const formatted = formatDate('2026-07-25T14:30:00.000Z');
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should handle invalid date string', () => {
      expect(formatDate('')).toBe('暂无时间');
      expect(formatDate('invalid')).toBe('无效时间');
    });
  });

  describe('getActionTagClass & getActionLabel', () => {
    it('should return correct CSS tag class and Chinese label', () => {
      expect(getActionTagClass('CREATE_MATCH')).toBe('tag-success');
      expect(getActionTagClass('UPDATE_MATCH')).toBe('tag-warning');
      expect(getActionTagClass('DELETE_MATCH')).toBe('tag-danger');
      expect(getActionLabel('CREATE_MATCH')).toBe('录入比赛');
      expect(getActionLabel('UPDATE_TEAM')).toBe('更新球队');
    });
  });

  describe('parseLogDetails', () => {
    it('should parse details with diff items', () => {
      const details = '更新球队 计算机学院 的信息: 领队姓名: 张三, 主教练姓名: 李四';
      const parsed = parseLogDetails(details);
      expect(parsed.summary).toBe('更新球队 计算机学院 的信息:');
      expect(parsed.diffItems).toEqual(['领队姓名: 张三', '主教练姓名: 李四']);
    });

    it('should return plain text when no match', () => {
      const details = '重置密码成功';
      const parsed = parseLogDetails(details);
      expect(parsed.summary).toBe('重置密码成功');
      expect(parsed.diffItems).toEqual([]);
    });
  });

  describe('extractSubLogAttrs & parseSubLogItem', () => {
    it('should extract unique attributes from sub-logs', () => {
      const subLogs = [
        { details: '更新球队A 的信息: 领队姓名: 张三, 球队名称: A队' },
        { details: '更新球队A 的信息: 领队姓名: 李四' },
      ];
      const attrs = extractSubLogAttrs(subLogs);
      expect(attrs).toEqual(['领队姓名', '球队名称']);
    });

    it('should parse single sub-log item correctly', () => {
      const item = parseSubLogItem('更新球队A 的信息: 领队姓名: 张三');
      expect(item.mainText).toBe('更新球队A 的信息:');
      expect(item.diffText).toBe('领队姓名: 张三');
    });
  });
});
