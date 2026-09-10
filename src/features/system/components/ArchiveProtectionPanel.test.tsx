// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { ArchiveProtectionPanel } from './ArchiveProtectionPanel';
import { backupApi } from '../../../api/backup.service';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../api/backup.service', () => ({
  backupApi: {
    getArchiveCoverage: jest.fn(),
    previewArchiveBackfill: jest.fn(),
    executeArchiveBackfill: jest.fn(),
    retryArchiveSeasonBackfill: jest.fn(),
  },
}));

describe('ArchiveProtectionPanel 组件测试', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  const mockCoverage = {
    total: 3,
    protected: 1,
    missing: 1,
    corrupt: 1,
    seasons: [
      {
        id: 'season-1',
        name: '2024春季杯',
        archivedAt: '2024-06-01T00:00:00.000Z',
        hasProtectedBackup: true,
        backupKey: 'backups/v4/module/season/backup-season-season-1-2024.sql.gz',
        objectSize: 2048,
        verifiedAt: '2024-06-01T00:10:00.000Z',
      },
      {
        id: 'season-2',
        name: '2024秋季联赛',
        archivedAt: '2024-12-01T00:00:00.000Z',
        hasProtectedBackup: false,
        isCorrupt: false,
      },
      {
        id: 'season-3',
        name: '2023超级杯',
        archivedAt: '2023-12-01T00:00:00.000Z',
        hasProtectedBackup: false,
        isCorrupt: true,
        lastError: '文件流不完整',
      },
    ],
  };

  it('正确加载并渲染概览卡片与赛季状态列表', async () => {
    (backupApi.getArchiveCoverage as any).mockResolvedValue({
      success: true,
      data: mockCoverage,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<ArchiveProtectionPanel />);
    });

    expect(backupApi.getArchiveCoverage).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('历史已归档赛季受保护备份管理');
    expect(container.textContent).toContain('已受保护赛季');
    expect(container.textContent).toContain('待补建保护备份');
    expect(container.textContent).toContain('损坏/校验失败');

    // 检查列表项目
    expect(container.textContent).toContain('2024春季杯');
    expect(container.textContent).toContain('已受保护');
    expect(container.textContent).toContain('2024秋季联赛');
    expect(container.textContent).toContain('缺失备份');
    expect(container.textContent).toContain('2023超级杯');
    expect(container.textContent).toContain('损坏/校验失败');

    await act(async () => {
      root.unmount();
    });
  });

  it('点击单赛季“立即补建”按钮触发 retryArchiveSeasonBackfill', async () => {
    (backupApi.getArchiveCoverage as any).mockResolvedValue({
      success: true,
      data: mockCoverage,
    });
    (backupApi.retryArchiveSeasonBackfill as any).mockResolvedValue({
      success: true,
      data: { seasonId: 'season-2', status: 'succeeded' },
    });

    const onBackfillSuccess = jest.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(<ArchiveProtectionPanel onBackfillSuccess={onBackfillSuccess} />);
    });

    const retryButtons = [...container.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes('立即补建'),
    );
    expect(retryButtons.length).toBe(2);

    await act(async () => {
      retryButtons[0].click();
    });

    expect(backupApi.retryArchiveSeasonBackfill).toHaveBeenCalledWith('season-2');

    await act(async () => {
      root.unmount();
    });
  });

  it('完整批量补建 Preview 与 Execute 流程', async () => {
    (backupApi.getArchiveCoverage as any).mockResolvedValue({
      success: true,
      data: mockCoverage,
    });
    (backupApi.previewArchiveBackfill as any).mockResolvedValue({
      success: true,
      data: {
        missingSeasons: [
          { id: 'season-2', name: '2024秋季联赛', archivedAt: '2024-12-01T00:00:00.000Z' },
        ],
        affectedTables: ['Season', 'Match', 'Player', 'Team'],
        estimatedRows: null,
        estimatedBytes: null,
        notice: '为严格遵守低流量与保护 Neon 出口原则，Preview 不对业务表执行预读 COUNT。',
        backfillToken: 'mock-valid-token.signature',
      },
    });
    (backupApi.executeArchiveBackfill as any).mockResolvedValue({
      success: true,
      data: {
        total: 1,
        succeeded: 1,
        skipped: 0,
        failed: 0,
        items: [{ seasonId: 'season-2', status: 'succeeded' }],
      },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<ArchiveProtectionPanel />);
    });

    // 点击批量补建预检
    const previewBtn = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('批量补建预检 (Preview)'),
    )!;

    await act(async () => {
      previewBtn.click();
    });

    expect(backupApi.previewArchiveBackfill).toHaveBeenCalled();
    expect(container.textContent).toContain('批量归档补建执行预检 (Preview)');
    expect(container.textContent).toContain('不对业务表执行预读 COUNT');
    expect(container.textContent).toContain('受影响数据表');

    // 点击确认执行
    const executeBtn = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('确认执行补建 (Execute)'),
    )!;

    await act(async () => {
      executeBtn.click();
    });

    expect(backupApi.executeArchiveBackfill).toHaveBeenCalledWith('mock-valid-token.signature', ['season-2']);
    expect(container.textContent).toContain('补建执行完成：成功 1 个');

    await act(async () => {
      root.unmount();
    });
  });
});
