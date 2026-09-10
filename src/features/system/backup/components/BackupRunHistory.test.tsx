// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupRunHistory } from './BackupRunHistory';
import { backupApi, BackupRunDTO } from '../../../../api/backup.service';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../../api/backup.service', () => ({
  backupApi: {
    listRuns: jest.fn(),
    retryRun: jest.fn(),
  },
}));

const mockRuns: BackupRunDTO[] = [
  {
    id: 'run-succeeded-1',
    batchId: 'batch-1',
    scope: 'module',
    module: 'season',
    selectorKey: 'cmroeexdz00018js1kmbmyog5',
    purpose: 'scheduled',
    trigger: 'cron',
    status: 'succeeded',
    attempts: 1,
    failureCode: null,
    failureMessage: null,
    databaseBytesEstimated: '102400',
    uncompressedBytes: '104800',
    databaseRowsRead: 120,
    uploadedBytes: '25600',
    peakRssBytes: '52428800',
    durationMs: 1500,
    backupKey: 'backups/v4/season/season_1.json.gz',
    startedAt: '2026-09-08T10:00:00.000Z',
    createdAt: '2026-09-08T10:00:00.000Z',
    finishedAt: '2026-09-08T10:00:01.500Z',
  },
  {
    id: 'run-failed-1',
    batchId: 'batch-1',
    scope: 'module',
    module: 'staff',
    selectorKey: 'default',
    purpose: 'scheduled',
    trigger: 'cron',
    status: 'failed',
    attempts: 1,
    failureCode: 'EXPORT_FAILED',
    failureMessage: '连接数据库超时',
    databaseBytesEstimated: '5120',
    uncompressedBytes: '5120',
    databaseRowsRead: 10,
    uploadedBytes: null, // 失败上传严格为 null
    peakRssBytes: '41943040',
    durationMs: 5000,
    backupKey: null,
    startedAt: '2026-09-08T10:00:00.000Z',
    createdAt: '2026-09-08T10:00:00.000Z',
    finishedAt: '2026-09-08T10:00:05.000Z',
  },
];

describe('BackupRunHistory 组件测试', () => {
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

  it('渲染运行流水账本：正确显示模块、状态、指标与失败原因', async () => {
    (backupApi.listRuns as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: {
        items: mockRuns,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupRunHistory />);
    });

    expect(container.textContent).toContain('备份任务运行账本');
    expect(container.textContent).toContain('season');
    expect(container.textContent).toContain('staff');
    expect(container.textContent).toContain('成功');
    expect(container.textContent).toContain('失败');
    expect(container.textContent).toContain('连接数据库超时');
    expect(container.textContent).toContain('120 行');
  });

  it('对失败任务点击重试按钮触发 retryRun API', async () => {
    (backupApi.listRuns as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: {
        items: mockRuns,
        total: 2,
        limit: 20,
        offset: 0,
      },
    });
    (backupApi.retryRun as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: { id: 'run-retry-2', status: 'running' },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupRunHistory />);
    });

    const retryBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('重试'),
    );
    expect(retryBtn).toBeDefined();

    await act(async () => {
      retryBtn?.click();
    });

    expect(backupApi.retryRun).toHaveBeenCalledWith('run-failed-1');
  });

  it('状态筛选与分页控制交互', async () => {
    (backupApi.listRuns as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: {
        items: [mockRuns[1]],
        total: 25,
        limit: 20,
        offset: 0,
      },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupRunHistory />);
    });

    expect(container.textContent).toContain('第 1 / 2 页 (共 25 条)');

    // 切换状态筛选
    const statusSelect = Array.from(container.querySelectorAll('select')).find((s) =>
      Array.from(s.options).some((o) => o.value === 'failed'),
    );
    expect(statusSelect).toBeDefined();

    await act(async () => {
      if (statusSelect) {
        statusSelect.value = 'failed';
        statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    expect(backupApi.listRuns).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
      }),
    );
  });
});
