// @jest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, jest } from '@jest/globals';
import { useTeamEntry } from './useTeamEntry';
import { seasonApi } from '../../../api/service';

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../../api/service', () => ({
  seasonApi: {
    getAll: jest.fn(async () => [
      { id: 'season-1', name: '2026 男子足球联赛', status: 'active', gender: 'MALE' },
      { id: 'season-2', name: '2026 女子足球联赛', status: 'active', gender: 'FEMALE' },
    ]),
  },
}));

jest.mock('../../../api/pdf-import.service', () => ({
  pdfImportApi: {
    downloadAsset: jest.fn(async () => new Blob(['dummy'], { type: 'image/webp' })),
  },
}));

function TestContainer({ onHook }: { onHook: (hook: ReturnType<typeof useTeamEntry>) => void }) {
  const hook = useTeamEntry();
  onHook(hook);
  return null;
}

describe('useTeamEntry Hook 单元测试', () => {
  it('应能够正确初始化并获取活跃赛季', async () => {
    let latestHook: ReturnType<typeof useTeamEntry> | null = null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TestContainer onHook={(h) => (latestHook = h)} />);
    });

    expect(seasonApi.getAll).toHaveBeenCalled();
    expect(latestHook!.compatibleActiveSeasons.length).toBeGreaterThan(0);
    expect(latestHook!.players).toEqual([]);

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('应能够添加球员并防止学号与球衣号码重复', async () => {
    let latestHook: ReturnType<typeof useTeamEntry> | null = null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TestContainer onHook={(h) => (latestHook = h)} />);
    });

    await act(async () => {
      latestHook!.handleAddPlayer({
        name: '张三',
        studentId: '2026001',
        jerseyNumber: '10',
        teamId: '',
        photo: null,
      });
    });

    expect(latestHook!.players.length).toBe(1);
    expect(latestHook!.players[0].name).toBe('张三');

    // 尝试添加相同学号
    await act(async () => {
      latestHook!.handleAddPlayer({
        name: '李四',
        studentId: '2026001',
        jerseyNumber: '11',
        teamId: '',
        photo: null,
      });
    });
    expect(latestHook!.players.length).toBe(1);
    expect(latestHook!.error).toContain('已存在学号为 2026001 的球员');

    // 尝试添加相同球衣号码
    await act(async () => {
      latestHook!.handleAddPlayer({
        name: '王五',
        studentId: '2026002',
        jerseyNumber: '10',
        teamId: '',
        photo: null,
      });
    });
    expect(latestHook!.players.length).toBe(1);
    expect(latestHook!.error).toContain('球衣号码 10 在本队中已被占用');

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });

  it('应能够正确更新与删除球员信息', async () => {
    let latestHook: ReturnType<typeof useTeamEntry> | null = null;
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(<TestContainer onHook={(h) => (latestHook = h)} />);
    });

    await act(async () => {
      latestHook!.handleAddPlayer({
        name: '赵六',
        studentId: '2026009',
        jerseyNumber: '9',
        teamId: '',
        photo: null,
      });
    });

    const targetId = latestHook!.players[0].id;

    // 测试更新球员球衣号码
    await act(async () => {
      latestHook!.handleUpdatePlayer(targetId, { jerseyNumber: '99' });
    });
    expect(latestHook!.players[0].jerseyNumber).toBe('99');

    // 测试删除球员
    await act(async () => {
      latestHook!.handleRemovePlayer(targetId);
    });
    expect(latestHook!.players.length).toBe(0);

    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(container);
  });
});
