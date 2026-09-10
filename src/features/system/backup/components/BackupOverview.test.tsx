// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupOverview } from './BackupOverview';
import { backupApi, BackupDashboardDTO } from '../../../../api/backup.service';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../../api/backup.service', () => ({
  backupApi: {
    getDashboard: jest.fn(),
    retryRun: jest.fn(),
  },
}));

const mockDashboardData: BackupDashboardDTO = {
  applicationBudget: {
    usedBytes: '536870912', // 512 MB
    limitBytes: '2147483648', // 2 GB
    warningBytes: '1503238553', // 1.4 GB
    criticalBytes: '1717986918', // 1.6 GB
    alertLevel: 'normal',
    percent: 25,
  },
  neonOfficial: {
    status: 'not_configured',
    dataTransferBytes: null,
    limitBytes: '5368709120',
    warningBytes: '3758096384',
    criticalBytes: '4294967296',
    alertLevel: 'normal',
    capturedAt: null,
    billingPeriod: null,
    stale: false,
  },
  storageUploaded: {
    usedBytes: '104857600', // 100 MB
  },
  moduleHealth: [
    {
      module: 'season',
      lastRunStatus: 'succeeded',
      lastRunAt: '2026-09-08T10:00:00.000Z',
      lastSuccessfulBackupKey: 'backups/v4/season/season_1.json.gz',
      lastSuccessfulAt: '2026-09-08T10:00:00.000Z',
      fingerprint: 'fp-season-1',
    },
    {
      module: 'staff',
      lastRunStatus: 'failed',
      lastRunAt: '2026-09-09T10:00:00.000Z',
      lastSuccessfulBackupKey: null,
      lastSuccessfulAt: null,
      fingerprint: 'fp-staff-1',
    },
  ],
  nextScheduledAt: '2026-10-01T18:00:00.000Z',
  currentMonthStats: {
    periodKey: '2026-09',
    totalRuns: 6,
    succeededRuns: 5,
    failedRuns: 1,
    skippedRuns: 0,
    hasFailedRuns: true,
    recentFailedRuns: [
      {
        id: 'run-fail-1',
        module: 'staff',
        selectorKey: 'default',
        trigger: 'scheduled',
        failureCode: 'EXPORT_FAILED',
        failureMessage: '连接数据库超时',
        createdAt: '2026-09-09T10:00:00.000Z',
      },
    ],
  },
};

describe('BackupOverview 组件测试', () => {
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

  it('渲染双轨预算：应用预算正常显示，Neon 官方未配置时明确提示且不伪装为 0', async () => {
    (backupApi.getDashboard as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupOverview />);
    });

    // 应用预算 512 MB / 2 GB (25.0%)
    expect(container.textContent).toContain('应用出口预算 (月度)');
    expect(container.textContent).toContain('512 MB');
    expect(container.textContent).toContain('2 GB');

    // Neon 官方未配置提示
    expect(container.textContent).toContain('Neon 官方配额监控');
    expect(container.textContent).toContain('未配置官方凭证');
    expect(container.textContent).toContain('未配置 NEON_API_KEY / NEON_PROJECT_ID');

    // 严禁显示伪装的 0 字节
    expect(container.textContent).not.toContain('0 Bytes / 5 GB');
  });

  it('正确渲染模块健康矩阵与当月失败任务告警', async () => {
    (backupApi.getDashboard as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupOverview />);
    });

    // 模块健康
    expect(container.textContent).toContain('模块备份健康度与基线检查点矩阵');
    expect(container.textContent).toContain('赛季数据 (Season)');
    expect(container.textContent).toContain('工作人员与组织架构 (Staff)');

    // 失败任务告警
    expect(container.textContent).toContain('当月存在 1 笔失败任务');
    expect(container.textContent).toContain('连接数据库超时');
  });

  it('点击失败任务重试按钮触发 retryRun API 并重新刷新', async () => {
    (backupApi.getDashboard as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });
    (backupApi.retryRun as jest.Mock<any>).mockResolvedValue({
      success: true,
      data: { id: 'run-new-1', status: 'running' },
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(<BackupOverview />);
    });

    const retryBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('立即重试'),
    );
    expect(retryBtn).toBeDefined();

    await act(async () => {
      retryBtn?.click();
    });

    expect(backupApi.retryRun).toHaveBeenCalledWith('run-fail-1');
  });
});
