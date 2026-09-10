// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupCenter } from './BackupCenter';
import { BackupDTO } from '../../../../api/types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('./BackupOverview', () => ({
  BackupOverview: () => <div data-testid="backup-overview">系统概览子视图</div>,
}));
jest.mock('./BackupTrafficDashboard', () => ({
  BackupTrafficDashboard: () => <div data-testid="backup-traffic">流量看板子视图</div>,
}));
jest.mock('./BackupRunHistory', () => ({
  BackupRunHistory: () => <div data-testid="backup-history">运行账本子视图</div>,
}));
jest.mock('../../components/ArchiveProtectionPanel', () => ({
  ArchiveProtectionPanel: () => <div data-testid="archive-protection">归档保护子视图</div>,
}));
jest.mock('./BackupCreatePanel', () => ({
  BackupCreatePanel: () => <div data-testid="backup-create">按需创建子视图</div>,
}));

const mockBackups: BackupDTO[] = [
  {
    key: 'backups/v4/season/season_1.json.gz',
    filename: 'season_1.json.gz',
    size: 10240,
    lastModified: '2026-09-10T10:00:00.000Z',
    scope: 'module',
    module: 'season',
    formatVersion: '4',
    runMetrics: {
      databaseBytesEstimated: '51200',
      uncompressedBytes: '52400',
      uploadedBytes: '10240',
      databaseRowsRead: 350,
      peakRssBytes: '104857600',
    },
  },
];

describe('BackupCenter 组件测试', () => {
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

  it('默认激活系统概览子 Tab 并正确渲染 BackupOverview', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCenter
          backups={mockBackups}
          isLoading={false}
          isBackingUp={false}
          isRestoring={null}
          onCreateBackup={jest.fn()}
          onRestoreBackup={jest.fn()}
          onLoadBackups={jest.fn()}
        />,
      );
    });

    const overviewTabBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('系统概览与双轨预算'),
    );
    expect(overviewTabBtn).toBeDefined();
    expect(overviewTabBtn?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-testid="backup-overview"]')).not.toBeNull();
  });

  it('切换到备份文件管理子 Tab 并点击详情打开抽屉', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCenter
          backups={mockBackups}
          isLoading={false}
          isBackingUp={false}
          isRestoring={null}
          onCreateBackup={jest.fn()}
          onRestoreBackup={jest.fn()}
          onLoadBackups={jest.fn()}
        />,
      );
    });

    // 点击“备份文件管理”按钮
    const filesTabBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('备份文件管理'),
    );
    expect(filesTabBtn).toBeDefined();

    await act(async () => {
      filesTabBtn?.click();
    });

    // 应该渲染了 BackupHistoryPanel，且包含 mock 数据文件名
    expect(container.textContent).toContain('season_1.json.gz');
    expect(container.textContent).toContain('已采集');

    // 点击“详情”按钮打开抽屉
    const detailBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('详情'),
    );
    expect(detailBtn).toBeDefined();

    await act(async () => {
      detailBtn?.click();
    });

    expect(container.textContent).toContain('备份详情与三段指标');
    expect(container.textContent).toContain('数据库估算出口');
    expect(container.textContent).toContain('50 KB');
  });

  it('可自由切换至流量趋势、运行账本、归档覆盖与创建备份等视图', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupCenter
          backups={mockBackups}
          isLoading={false}
          isBackingUp={false}
          isRestoring={null}
          onCreateBackup={jest.fn()}
          onRestoreBackup={jest.fn()}
          onLoadBackups={jest.fn()}
        />,
      );
    });

    const clickTab = async (label: string) => {
      const btn = Array.from(container.querySelectorAll('button')).find((b) =>
        b.textContent?.includes(label),
      );
      expect(btn).toBeDefined();
      await act(async () => {
        btn?.click();
      });
    };

    await clickTab('流量基线与趋势');
    expect(container.querySelector('[data-testid="backup-traffic"]')).not.toBeNull();

    await clickTab('任务运行账本');
    expect(container.querySelector('[data-testid="backup-history"]')).not.toBeNull();

    await clickTab('归档保护覆盖');
    expect(container.querySelector('[data-testid="archive-protection"]')).not.toBeNull();

    await clickTab('按需创建备份');
    expect(container.querySelector('[data-testid="backup-create"]')).not.toBeNull();
  });
});
