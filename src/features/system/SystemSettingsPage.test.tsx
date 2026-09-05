import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import SystemSettingsPage from './SystemSettingsPage';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let mockInitialSearch = '';
const mockBackupSettings = jest.fn(() => ({ loadAllSeasons: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useSearchParams: () => {
    const React = jest.requireActual<typeof import('react')>('react');
    return React.useState(new URLSearchParams(mockInitialSearch));
  },
}));
jest.mock('./hooks', () => ({
  useSeasonBackupSettings: () => mockBackupSettings(),
  useHistoryImport: () => ({}),
  useSystemTeams: () => ({ teams: [] }),
  useCupGroupSettings: () => ({}),
}));
jest.mock('./components', () => ({
  SeasonBackupPanel: () => <div>备份设置内容</div>,
  CupGroupPanel: () => <div>分组内容</div>,
  HistoryImportPanel: () => <div>历史导入内容</div>,
}));
jest.mock('../accounts/MemberAccountsPage', () => ({ __esModule: true, default: () => <div>网页用户管理内容</div> }));
jest.mock('../accounts/StaffAccountsPage', () => ({ __esModule: true, default: () => <div>后台账号管理内容</div> }));

describe('系统设置内账号管理', () => {
  beforeEach(() => { mockInitialSearch = ''; jest.clearAllMocks(); });
  it('在设置框架内切换两类账号，保留原有设置入口', async () => {
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(async () => root.render(<SystemSettingsPage />));
      const click = async (label: string) => {
        await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent?.trim() === label)!.click());
      };
      expect(host.textContent).toContain('备份设置内容');
      await click('网页用户审核');
      expect(host.textContent).toContain('网页用户管理内容');
      expect(host.textContent).not.toContain('备份设置内容');
      await click('后台账号');
      expect(host.textContent).toContain('后台账号管理内容');
      expect(host.textContent).not.toContain('网页用户管理内容');
      expect(host.querySelector('h1')?.textContent).toContain('系统设置与安全中心');
      expect(host.querySelector('button[aria-pressed="true"]')?.textContent).toBe('后台账号');
    } finally { await act(async () => root.unmount()); }
  });
  it.each(['members', 'staff'])('可从 tab=%s 直接进入，且不请求无关的备份数据', async (tab) => {
    mockInitialSearch = `tab=${tab}`;
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(async () => root.render(<SystemSettingsPage />));
      expect(host.textContent).toContain(tab === 'members' ? '网页用户管理内容' : '后台账号管理内容');
      expect(mockBackupSettings).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
  it('可从自动化测试页签直接查看内嵌报告', async () => {
    mockInitialSearch = 'tab=automation';
    const host = document.createElement('div');
    const root = createRoot(host);
    try {
      await act(async () => root.render(<SystemSettingsPage />));
      const report = host.querySelector('iframe[title="自动化测试可视化报告"]');
      expect(report?.getAttribute('src')).toBe('/automation-report.html');
      expect(mockBackupSettings).not.toHaveBeenCalled();
    } finally { await act(async () => root.unmount()); }
  });
});
