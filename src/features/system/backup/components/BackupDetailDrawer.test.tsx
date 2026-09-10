// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupDetailDrawer } from './BackupDetailDrawer';
import { BackupDTO } from '../../../../api/types';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('BackupDetailDrawer 组件测试', () => {
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

  it('历史备份无 runMetrics 时显示未采集黄色提示，绝不伪装为 0 字节', async () => {
    const historicalBackup: BackupDTO = {
      key: 'backups/v3/full/2026-08-01.json.gz',
      filename: '2026-08-01.json.gz',
      size: 1048576,
      lastModified: '2026-08-01T12:00:00.000Z',
      scope: 'full',
      formatVersion: '3',
      runMetrics: null,
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupDetailDrawer
          backup={historicalBackup}
          isOpen={true}
          onClose={jest.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('历史备份未采集三段指标');
    expect(container.textContent).toContain('该备份生成于流量指标体系上线前');
    expect(container.textContent).toContain('绝不以 0 字节伪装');
    expect(container.textContent).not.toContain('0 Bytes 数据载荷');
  });

  it('新版备份有 runMetrics 时完整渲染三段指标、峰值内存与压缩率', async () => {
    const modernBackup: BackupDTO = {
      key: 'backups/v4/season/season_1.json.gz',
      filename: 'season_1.json.gz',
      size: 10240, // 10 KB
      lastModified: '2026-09-10T10:00:00.000Z',
      scope: 'module',
      module: 'season',
      formatVersion: '4',
      checksum: 'sha256-abcdef1234567890',
      runMetrics: {
        databaseBytesEstimated: '51200', // 50 KB
        uncompressedBytes: '52400', // 51.17 KB
        uploadedBytes: '10240', // 10 KB
        databaseRowsRead: 350,
        peakRssBytes: '104857600', // 100 MB
      },
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupDetailDrawer
          backup={modernBackup}
          isOpen={true}
          onClose={jest.fn()}
        />,
      );
    });

    expect(container.textContent).toContain('三段流量与性能审计');
    expect(container.textContent).toContain('数据库估算出口');
    expect(container.textContent).toContain('50 KB');
    expect(container.textContent).toContain('未压缩全流载荷');
    expect(container.textContent).toContain('R2 实际上传大小');
    expect(container.textContent).toContain('10 KB');
    expect(container.textContent).toContain('执行峰值内存');
    expect(container.textContent).toContain('100 MB');
    expect(container.textContent).toContain('累计读取数据行数:');
    expect(container.textContent).toContain('350 行');
    expect(container.textContent).toContain('节省');
  });

  it('点击关闭按钮触发 onClose 回调', async () => {
    const onClose = jest.fn();
    const testBackup: BackupDTO = {
      key: 'backups/test.json.gz',
      filename: 'test.json.gz',
      size: 1024,
      lastModified: '2026-09-10T10:00:00.000Z',
      runMetrics: null,
    };

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupDetailDrawer
          backup={testBackup}
          isOpen={true}
          onClose={onClose}
        />,
      );
    });

    const closeBtn = Array.from(container.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('关闭详情'),
    );
    expect(closeBtn).toBeDefined();

    await act(async () => {
      closeBtn?.click();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
