// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupCreatePanel } from './BackupCreatePanel';
import { backupApi, BackupDashboardDTO } from '../../../../api/backup.service';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../../api/backup.service', () => ({
  backupApi: {
    create: jest.fn(),
    getDashboard: jest.fn(),
  },
}));

jest.mock('../hooks/useBackupDashboard', () => ({
  useBackupDashboard: jest.fn(() => ({
    dashboard: null,
    loading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

const baseDashboard: BackupDashboardDTO = {
  applicationBudget: {
    usedBytes: '1000000',
    limitBytes: '5368709120',
    warningBytes: '3221225472',
    criticalBytes: '4294967296',
    alertLevel: 'normal',
    percent: 18.6,
  },
  neonOfficial: {
    status: 'configured',
    dataTransferBytes: '1073741824', // 1 GB
    limitBytes: '5368709120',
    warningBytes: '3221225472',
    criticalBytes: '4294967296', // 4.0 GB
    alertLevel: 'normal',
    billingPeriod: '2026-09-01 - 2026-10-01',
    capturedAt: '2026-09-11T10:00:00.000Z',
    stale: false,
  },
  storageUploaded: {
    usedBytes: '5000000',
  },
  moduleHealth: [
    {
      module: 'season',
      lastRunStatus: 'succeeded',
      lastRunAt: '2026-09-10T10:00:00.000Z',
      lastSuccessfulBackupKey: 'private-backups/database/modules/season/s1/test.json.gz',
      lastSuccessfulAt: '2026-09-10T10:00:00.000Z',
      fingerprint: 'fp1',
    },
  ],
  nextScheduledAt: '2026-10-01T02:00:00.000Z',
  currentMonthStats: {
    periodKey: '2026-09',
    totalRuns: 10,
    succeededRuns: 10,
    failedRuns: 0,
    skippedRuns: 0,
    hasFailedRuns: false,
    recentFailedRuns: [],
  },
};

describe('BackupCreatePanel 组件测试', () => {
  let container: HTMLDivElement;
  let confirmSpy: jest.SpiedFunction<typeof window.confirm>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    jest.clearAllMocks();
    confirmSpy = jest.spyOn(window, 'confirm');
  });

  afterEach(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    confirmSpy.mockRestore();
  });

  it('在正常用量下不渲染红色高危横幅，模块备份提交不触发 4.0GB 确认弹窗', async () => {
    (backupApi.create as jest.MockedFunction<typeof backupApi.create>).mockResolvedValue({
      success: true,
      data: { key: 'private-backups/database/modules/season/s1/test.json.gz' } as any,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCreatePanel
          dashboard={baseDashboard}
          activeSeasonId="s1"
        />,
      );
    });

    // 确认无高危红色横幅
    expect(container.textContent).not.toContain('4.0GB 红色预警上限');

    // 提交表单
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(submitBtn).not.toBeNull();

    await act(async () => {
      submitBtn.click();
    });

    // 不应弹出 window.confirm
    expect(confirmSpy).not.toHaveBeenCalled();
    // 应该正常调用 API
    expect(backupApi.create).toHaveBeenCalledWith({
      scope: 'module',
      module: 'season',
      selector: { seasonId: 's1' },
      purpose: 'manual',
      protected: false,
    });
  });

  it('当 alertLevel 为 critical 时常驻高危红色横幅，提交被用户取消时终止请求', async () => {
    const criticalDashboard: BackupDashboardDTO = {
      ...baseDashboard,
      neonOfficial: {
        ...baseDashboard.neonOfficial,
        alertLevel: 'critical',
        dataTransferBytes: '4300000000',
      },
    };

    confirmSpy.mockReturnValue(false); // 用户取消确认

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCreatePanel
          dashboard={criticalDashboard}
          activeSeasonId="s1"
        />,
      );
    });

    // 验证高危红色横幅已渲染
    expect(container.textContent).toContain('4.0GB 红色预警上限');
    const alertBox = container.querySelector('[role="alert"]');
    expect(alertBox).not.toBeNull();

    // 提交表单
    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    // 验证触发二次确认弹窗
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toContain('本月 Neon 官方用量已达到 4.0GB 红色预警上限');

    // 因为用户取消，不应调用 API
    expect(backupApi.create).not.toHaveBeenCalled();
  });

  it('当 alertLevel 为 critical 时，用户二次确认后正常调用备份 API', async () => {
    const criticalDashboard: BackupDashboardDTO = {
      ...baseDashboard,
      neonOfficial: {
        ...baseDashboard.neonOfficial,
        alertLevel: 'critical',
        dataTransferBytes: '4500000000',
      },
    };

    confirmSpy.mockReturnValue(true); // 用户确认
    (backupApi.create as jest.MockedFunction<typeof backupApi.create>).mockResolvedValue({
      success: true,
      data: { key: 'private-backups/database/modules/staff/staff.json.gz' } as any,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCreatePanel
          dashboard={criticalDashboard}
          activeSeasonId="s1"
        />,
      );
    });

    // 切换到 staff 模块
    const moduleSelect = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      moduleSelect.value = 'staff';
      moduleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(backupApi.create).toHaveBeenCalledWith({
      scope: 'module',
      module: 'staff',
      selector: {},
      protected: false,
    });
  });

  it('当 dataTransferBytes >= criticalBytes 时同样触发高危告警与拦截', async () => {
    const criticalBytesDashboard: BackupDashboardDTO = {
      ...baseDashboard,
      neonOfficial: {
        ...baseDashboard.neonOfficial,
        alertLevel: 'warning',
        dataTransferBytes: '4294967296', // 刚好 4.0 GB
        criticalBytes: '4294967296',
      },
    };

    confirmSpy.mockReturnValue(false);

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCreatePanel
          dashboard={criticalBytesDashboard}
          activeSeasonId="s1"
        />,
      );
    });

    expect(container.textContent).toContain('4.0GB 红色预警上限');

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(backupApi.create).not.toHaveBeenCalled();
  });

  it('官方数据过期 (stale=true) 或未配置时安全降级 (Fail-Open)，不渲染高危横幅', async () => {
    const staleDashboard: BackupDashboardDTO = {
      ...baseDashboard,
      neonOfficial: {
        ...baseDashboard.neonOfficial,
        alertLevel: 'critical',
        dataTransferBytes: '4800000000',
        stale: true, // 过期数据
      },
    };

    (backupApi.create as jest.MockedFunction<typeof backupApi.create>).mockResolvedValue({
      success: true,
      data: { key: 'private-backups/database/modules/content/content.json.gz' } as any,
    });

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCreatePanel
          dashboard={staleDashboard}
          activeSeasonId="s1"
        />,
      );
    });

    // 过期数据不展示高危横幅
    expect(container.textContent).not.toContain('4.0GB 红色预警上限');

    // 切换到 content 模块
    const moduleSelect = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      moduleSelect.value = 'content';
      moduleSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
    await act(async () => {
      submitBtn.click();
    });

    // 降级不弹出 4.0GB 弹窗
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(backupApi.create).toHaveBeenCalledWith({
      scope: 'module',
      module: 'content',
      selector: {},
      protected: false,
    });
  });
});
