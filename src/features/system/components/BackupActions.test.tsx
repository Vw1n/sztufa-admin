// @jest-environment jsdom
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { BackupActions } from './BackupActions';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('BackupActions 组件行为测试', () => {
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

  it('无活跃赛季时默认选中 staff，加载出活跃赛季后自动更新为 season', async () => {
    const onCreateBackup = jest.fn();
    const onUploadFile = jest.fn();
    const root = createRoot(container);

    // 1. 首次渲染无 activeSeason
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={null}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('staff');

    // 2. 异步获取到 activeSeason
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={{ id: 'season-2026', name: '2026春季联赛' }}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    expect(select.value).toBe('season');

    // 3. 点击备份，提交当前赛季模块
    const buttons = [...container.querySelectorAll('button')];
    const backupButton = buttons.find((b) => b.textContent?.includes('立即执行备份'))!;
    await act(async () => {
      backupButton.click();
    });

    expect(onCreateBackup).toHaveBeenCalledWith({
      scope: 'module',
      module: 'season',
      selector: { seasonId: 'season-2026' },
    });

    await act(async () => {
      root.unmount();
    });
  });

  it('用户手动切换后，activeSeason 变动不覆盖用户选择', async () => {
    const onCreateBackup = jest.fn();
    const onUploadFile = jest.fn();
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={null}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select.value).toBe('staff');

    // 用户手动选择 members
    await act(async () => {
      select.value = 'members';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(select.value).toBe('members');

    // 异步返回 activeSeason
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={{ id: 'season-2026', name: '2026春季联赛' }}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    // 仍保持用户选择的 members
    expect(select.value).toBe('members');

    await act(async () => {
      root.unmount();
    });
  });

  it('全量备份触发 window.confirm 提示 Neon 5GB 风险，用户取消时不执行', async () => {
    const onCreateBackup = jest.fn();
    const onUploadFile = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={null}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'full';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const backupButton = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('立即执行备份'),
    )!;

    await act(async () => {
      backupButton.click();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy.mock.calls[0][0]).toContain('Neon 流量消耗');
    expect(onCreateBackup).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
    await act(async () => {
      root.unmount();
    });
  });

  it('全量备份在用户确认后提交 { scope: "full" }', async () => {
    const onCreateBackup = jest.fn();
    const onUploadFile = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={null}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    const select = container.querySelector('select') as HTMLSelectElement;
    await act(async () => {
      select.value = 'full';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const backupButton = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('立即执行备份'),
    )!;

    await act(async () => {
      backupButton.click();
    });

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onCreateBackup).toHaveBeenCalledWith({ scope: 'full' });

    confirmSpy.mockRestore();
    await act(async () => {
      root.unmount();
    });
  });

  it('普通模块备份不需要用户弹窗确认', async () => {
    const onCreateBackup = jest.fn();
    const onUploadFile = jest.fn();
    const confirmSpy = jest.spyOn(window, 'confirm');

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <BackupActions
          isBackingUp={false}
          isRestoring={null}
          isUploading={false}
          uploadProgress={null}
          activeSeason={null}
          onCreateBackup={onCreateBackup}
          onUploadFile={onUploadFile}
        />,
      );
    });

    const backupButton = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('立即执行备份'),
    )!;

    // 默认是 staff 模块
    await act(async () => {
      backupButton.click();
    });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onCreateBackup).toHaveBeenCalledWith({
      scope: 'module',
      module: 'staff',
      selector: {},
    });

    confirmSpy.mockRestore();
    await act(async () => {
      root.unmount();
    });
  });
});
